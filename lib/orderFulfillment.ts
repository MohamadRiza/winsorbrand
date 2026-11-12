import { connectDB } from '@/lib/db';
import Order, { IOrderDocument } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';
import Customer from '@/lib/models/Customer';
import { consumeVerifiedCouponCode } from '@/lib/couponHelper';
import {
  getPaymentsLkMode,
  PaymentsLkCheckout,
  retrievePaymentsLkCheckout,
} from '@/lib/paymentsLk';
import { IOrderItem } from '@/types';

if (typeof window !== 'undefined') {
  throw new Error('lib/orderFulfillment must only be imported on the server.');
}

export class OrderValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'OrderValidationError';
    this.status = status;
  }
}

export function sanitizeOrderText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/<[^>]*>/g, '').slice(0, maxLen);
}

function sanitizeOptionalHttpsUrl(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim().slice(0, 1000);
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    // ignore invalid URLs
  }
  return '';
}

/**
 * Resolve & price items authoritatively from MongoDB Product records.
 * Never trusts client-submitted prices, totals, or variant images.
 */
export async function resolveOrderItemsFromDb(
  rawItems: unknown[],
  options?: { allowGiftMetadata?: boolean }
): Promise<{
  validatedItems: IOrderItem[];
  serverSubtotal: number;
  hasGifts: boolean;
}> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new OrderValidationError('Order must contain at least one timepiece.', 400);
  }
  if (rawItems.length > 50) {
    throw new OrderValidationError('Too many line items in a single order.', 400);
  }

  let serverSubtotal = 0;
  const validatedItems: IOrderItem[] = [];
  const allowGifts = !!options?.allowGiftMetadata;
  const cumulativeQtyByVariant = new Map<string, number>();

  for (const raw of rawItems as any[]) {
    if (
      !raw ||
      typeof raw.productId !== 'string' ||
      !/^[a-fA-F0-9]{24}$/.test(raw.productId.trim()) ||
      !Number.isInteger(raw.quantity) ||
      raw.quantity < 1 ||
      raw.quantity > 99
    ) {
      throw new OrderValidationError('Invalid timepiece item or quantity in order.', 400);
    }

    const product = await Product.findById(raw.productId.trim());
    if (!product || product.isActive === false) {
      throw new OrderValidationError('One or more selected timepieces are unavailable.', 404);
    }

    const requestedVariant = typeof raw.colorVariant === 'string' ? raw.colorVariant.trim() : '';
    const variant =
      (requestedVariant
        ? product.colorVariants.find((v: any) => v.colorName === requestedVariant)
        : undefined) || product.colorVariants[0];

    if (!variant) {
      throw new OrderValidationError(`Timepiece "${product.title}" does not have available variants.`, 400);
    }

    const variantKey = `${product._id.toString()}::${variant.colorName}`;
    const totalRequestedForVariant = (cumulativeQtyByVariant.get(variantKey) || 0) + raw.quantity;
    if (variant.qty < totalRequestedForVariant) {
      throw new OrderValidationError(
        `Insufficient stock for ${product.title} (${variant.colorName}). Only ${variant.qty} remaining.`,
        400
      );
    }
    cumulativeQtyByVariant.set(variantKey, totalRequestedForVariant);

    const serverPrice = Number(product.price);
    if (!Number.isFinite(serverPrice) || serverPrice <= 0) {
      throw new OrderValidationError(`Invalid catalogue price for ${product.title}.`, 400);
    }

    serverSubtotal += serverPrice * raw.quantity;

    const isGift = allowGifts && !!raw.isGift;
    validatedItems.push({
      productId: product._id.toString(),
      productTitle: product.title,
      productModelNo: product.modelNo,
      productThumbnail: variant.image?.url || product.thumbnail?.url || '',
      colorVariant: variant.colorName,
      quantity: raw.quantity,
      price: serverPrice,
      isGift,
      giftNote: isGift ? sanitizeOrderText(raw.giftNote, 500) : '',
      canvaLink: isGift ? sanitizeOptionalHttpsUrl(raw.canvaLink) : '',
      giftAttachmentUrl: isGift ? sanitizeOptionalHttpsUrl(raw.giftAttachmentUrl) : '',
      giftAttachmentName: isGift ? sanitizeOrderText(raw.giftAttachmentName, 160) : '',
    });
  }

  return {
    validatedItems,
    serverSubtotal,
    hasGifts: validatedItems.some((i) => i.isGift),
  };
}

/**
 * Atomically decrement product stock for validated order items.
 */
export async function decrementStockForOrderItems(items: IOrderItem[]): Promise<void> {
  for (const item of items) {
    // 1. Atomic decrement on the matching colorVariant when sufficient stock exists
    const updateRes = await Product.updateOne(
      {
        _id: item.productId,
        colorVariants: {
          $elemMatch: {
            colorName: item.colorVariant,
            qty: { $gte: item.quantity },
          },
        },
      } as any,
      {
        $inc: { 'colorVariants.$.qty': -item.quantity },
      }
    );

    const updatedProduct = await Product.findById(item.productId);
    if (!updatedProduct) continue;

    let needsSave = false;

    // 2. Fallback if concurrent checkout reduced stock below item.quantity after initial check
    if (updateRes.modifiedCount === 0) {
      const variant =
        updatedProduct.colorVariants.find((v: any) => v.colorName === item.colorVariant) ||
        updatedProduct.colorVariants[0];

      if (variant) {
        console.warn(
          `[OrderFulfillment] Concurrent stock shortfall for ${updatedProduct.title} (${variant.colorName}): had ${variant.qty}, ordered ${item.quantity}`
        );
        variant.qty = Math.max(0, variant.qty - item.quantity);
        needsSave = true;
      }
    }

    // 3. Reconcile variant.inStock and product.isSoldOut flags
    for (const v of updatedProduct.colorVariants as any[]) {
      const shouldBeInStock = v.qty > 0;
      if (v.inStock !== shouldBeInStock) {
        v.inStock = shouldBeInStock;
        needsSave = true;
      }
    }
    const allOutOfStock = updatedProduct.colorVariants.every((v: any) => v.qty <= 0);
    if (allOutOfStock && !updatedProduct.isSoldOut) {
      updatedProduct.isSoldOut = true;
      needsSave = true;
    }

    if (needsSave) {
      await updatedProduct.save();
    }
  }
}

export interface PaymentsLkMoneyCheck {
  ok: true;
  refundedCents: number;
  expectedCents: number;
}

export function validatePaymentsLkMoneyReceived(params: {
  order: Pick<IOrderDocument, 'orderRef' | 'paymentMethod' | 'paymentsLkCheckoutId' | 'finalTotal' | 'subtotal'>;
  checkout: PaymentsLkCheckout;
}): PaymentsLkMoneyCheck | { ok: false; reason: string } {
  const { order, checkout } = params;
  const expectedMode = getPaymentsLkMode();

  if (checkout.mode !== expectedMode) {
    console.error(
      `[OrderFulfillment] Mode mismatch for ${order.orderRef}: expected ${expectedMode}, got ${checkout.mode}`
    );
    return { ok: false, reason: 'Payment mode mismatch.' };
  }

  if (order.paymentMethod !== 'card') {
    return { ok: false, reason: 'Order is not a card payment order.' };
  }

  if (!order.paymentsLkCheckoutId || !checkout.id || order.paymentsLkCheckoutId !== checkout.id) {
    console.error(
      `[OrderFulfillment] Checkout ID mismatch for ${order.orderRef}: stored=${order.paymentsLkCheckoutId}, received=${checkout.id}`
    );
    return { ok: false, reason: 'Checkout ID does not match order record.' };
  }

  if (checkout.status !== 'completed') {
    return { ok: false, reason: `Checkout status is ${checkout.status || 'unknown'}, not completed.` };
  }

  if (checkout.payment?.status !== 'succeeded' || !checkout.payment?.id) {
    return { ok: false, reason: `Payment status is ${checkout.payment?.status || 'unknown'}.` };
  }

  if (!checkout.payment.succeededAt || Number.isNaN(new Date(checkout.payment.succeededAt).getTime())) {
    return { ok: false, reason: 'Payment confirmation timestamp is missing.' };
  }

  if (checkout.payment.currency !== 'LKR') {
    console.error(
      `[OrderFulfillment] Currency mismatch for ${order.orderRef}: expected LKR, got ${checkout.payment.currency}`
    );
    return { ok: false, reason: 'Currency mismatch.' };
  }

  if (!checkout.payment.reference || checkout.payment.reference !== order.orderRef) {
    console.error(
      `[OrderFulfillment] Reference mismatch for ${order.orderRef}: got ${checkout.payment.reference}`
    );
    return { ok: false, reason: 'Order reference mismatch.' };
  }

  const expectedCents = Math.round((order.finalTotal ?? order.subtotal) * 100);
  if (checkout.payment.amountCents !== expectedCents) {
    console.error(
      `[OrderFulfillment] SECURITY ALERT amount mismatch for ${order.orderRef}: expected=${expectedCents} cents, paid=${checkout.payment.amountCents} cents`
    );
    return { ok: false, reason: 'Paid amount mismatch detected.' };
  }

  if (typeof checkout.payment.netCents !== 'number' || checkout.payment.netCents <= 0) {
    return { ok: false, reason: 'Net settlement confirmation from Payments.lk is missing.' };
  }

  const refundedCents =
    typeof checkout.payment.refundedCents === 'number' ? checkout.payment.refundedCents : 0;

  return { ok: true, refundedCents, expectedCents };
}

/**
 * Pure structural proof check used before rendering any card order as "Payment Succeeded".
 * Never returns true unless the order has matching gateway confirmation proof.
 */
export function isOrderPaymentsLkConfirmed(order: any): boolean {
  if (!order || order.paymentMethod !== 'card') return false;
  if (order.paymentProvider !== 'payments_lk') return false;
  if (order.paymentStatus !== 'paid') return false;
  if (!order.paymentsLkCheckoutId || !order.paymentsLkPaymentId) return false;
  if (!order.paidAt || !order.paymentsLkVerifiedAt) return false;
  if (order.paymentsLkMode && order.paymentsLkMode !== getPaymentsLkMode()) return false;
  if (typeof order.paymentsLkNetCents !== 'number' || order.paymentsLkNetCents <= 0) return false;
  if ((order.paymentsLkRefundedCents ?? 0) > 0) return false;
  return true;
}

/**
 * Verify a Payments.lk Checkout against our Order and atomically fulfill it ONCE.
 * Safe to invoke concurrently from webhooks, return confirmation, and admin reconciliation.
 */
export async function finalizePaidOrderFromCheckout(params: {
  order: IOrderDocument;
  checkout: PaymentsLkCheckout;
  eventId?: string | null;
}): Promise<{
  ok: true;
  alreadyPaid: boolean;
  order: IOrderDocument;
} | {
  ok: false;
  reason: string;
}> {
  await connectDB();

  const { order, checkout, eventId } = params;
  const check = validatePaymentsLkMoneyReceived({ order, checkout });
  if (!check.ok) {
    return check;
  }

  if (check.refundedCents >= check.expectedCents) {
    return { ok: false, reason: 'Payment has been refunded in full.' };
  }

  const verifiedMeta = {
    paymentProvider: 'payments_lk' as const,
    paymentsLkCheckoutId: checkout.id,
    paymentsLkPaymentId: checkout.payment.id,
    paymentsLkEventId: eventId || order.paymentsLkEventId || null,
    paymentsLkMode: checkout.mode,
    paymentsLkCardScheme: checkout.payment.card?.scheme || null,
    paymentsLkCardLast4: checkout.payment.card?.last4 || null,
    paymentsLkFeeCents: typeof checkout.payment.feeCents === 'number' ? checkout.payment.feeCents : null,
    paymentsLkNetCents: typeof checkout.payment.netCents === 'number' ? checkout.payment.netCents : null,
    paymentsLkRefundedCents: check.refundedCents,
    paymentsLkVerifiedAt: new Date(),
    paidAt: new Date(checkout.payment.succeededAt!),
    paymentFailureReason: null,
  };

  // 1. Transition paymentStatus -> 'paid' and status 'pending' -> 'processing' atomically once
  const transitionedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        paymentStatus: 'paid',
        ...verifiedMeta,
        ...(order.status === 'pending' ? { status: 'processing' } : {}),
      },
    },
    { new: true }
  );

  const alreadyPaid = !transitionedOrder;
  let activeOrder = transitionedOrder;

  if (!activeOrder) {
    // Sync latest immutable gateway proof/refund metadata onto already-paid order
    activeOrder =
      (await Order.findByIdAndUpdate(
        order._id,
        { $set: verifiedMeta },
        { new: true }
      )) ||
      (await Order.findById(order._id)) ||
      order;
  }

  // 2. Commit inventory ONCE (separate atomic guard survives partial crashes cleanly)
  const inventoryClaim = await Order.findOneAndUpdate(
    { _id: order._id, inventoryCommitted: false },
    { $set: { inventoryCommitted: true } },
    { new: true }
  );
  if (inventoryClaim) {
    await decrementStockForOrderItems(activeOrder.items as IOrderItem[]);
  }

  // 3. Commit coupon usage ONCE if a coupon was applied
  if (activeOrder.couponCode) {
    const couponClaim = await Order.findOneAndUpdate(
      { _id: order._id, couponCommitted: false },
      { $set: { couponCommitted: true } },
      { new: true }
    );
    if (couponClaim) {
      await consumeVerifiedCouponCode(activeOrder.couponCode);
    }
  }

  // 4. Clear signed-in user's server Cart if checkout originated from cart
  if (activeOrder.checkoutSource === 'cart' && activeOrder.clerkId) {
    try {
      await Cart.updateOne(
        { clerkId: activeOrder.clerkId },
        { $set: { items: [] } }
      );
    } catch (cartErr) {
      console.warn('[OrderFulfillment] Non-fatal error clearing server cart:', cartErr);
    }
  }

  return {
    ok: true,
    alreadyPaid,
    order: activeOrder,
  };
}

/**
 * Mark an unpaid pending card order as failed without ever overwriting already-paid orders
 * or touching inventory/coupons (since neither was committed on pending card initiation).
 */
export async function markPendingCardOrderFailed(params: {
  orderId: string;
  reason?: string | null;
}): Promise<IOrderDocument | null> {
  await connectDB();
  return Order.findOneAndUpdate(
    {
      _id: params.orderId,
      paymentMethod: 'card',
      paymentStatus: 'pending',
    },
    {
      $set: {
        paymentStatus: 'failed',
        paymentFailureReason: params.reason ? String(params.reason).slice(0, 300) : 'Payment was not completed.',
      },
    },
    { new: true }
  );
}

/**
 * Query Payments.lk live to confirm whether money was 100% received for a card order,
 * atomically fulfilling or correcting DB status accordingly.
 */
export async function verifyAndSyncPaymentsLkOrder(orderDoc: any): Promise<{
  confirmed: boolean;
  gatewayStatus: string;
  message: string;
  order: any;
}> {
  await connectDB();

  if (!orderDoc || orderDoc.paymentMethod !== 'card') {
    return {
      confirmed: false,
      gatewayStatus: 'not_applicable',
      message: 'Only online card orders can be verified with Payments.lk.',
      order: orderDoc,
    };
  }

  if (!orderDoc.paymentsLkCheckoutId) {
    if (orderDoc.paymentStatus === 'paid') {
      const revoked = await Order.findByIdAndUpdate(
        orderDoc._id,
        {
          $set: {
            paymentStatus: 'pending',
            paymentsLkVerifiedAt: null,
            paymentFailureReason: 'Missing Payments.lk checkout session proof.',
          },
        },
        { new: true }
      ).lean();
      return {
        confirmed: false,
        gatewayStatus: 'unverified',
        message: 'No Payments.lk checkout session is linked to this order.',
        order: revoked || orderDoc,
      };
    }
    return {
      confirmed: false,
      gatewayStatus: 'missing_checkout',
      message: 'No Payments.lk checkout session is linked to this order.',
      order: orderDoc,
    };
  }

  const checkout = await retrievePaymentsLkCheckout(String(orderDoc.paymentsLkCheckoutId));
  const payStatus = checkout.payment?.status || checkout.status || 'unknown';
  const check = validatePaymentsLkMoneyReceived({ order: orderDoc, checkout });

  if (check.ok) {
    if (check.refundedCents > 0) {
      const isFullRefund = check.refundedCents >= check.expectedCents;
      const synced = await Order.findByIdAndUpdate(
        orderDoc._id,
        {
          $set: {
            ...(orderDoc.paymentStatus === 'pending' && isFullRefund ? { paymentStatus: 'failed' } : {}),
            paymentsLkPaymentId: checkout.payment.id,
            paymentsLkMode: checkout.mode,
            paymentsLkCardScheme: checkout.payment.card?.scheme || null,
            paymentsLkCardLast4: checkout.payment.card?.last4 || null,
            paymentsLkFeeCents: typeof checkout.payment.feeCents === 'number' ? checkout.payment.feeCents : null,
            paymentsLkNetCents: typeof checkout.payment.netCents === 'number' ? checkout.payment.netCents : null,
            paymentsLkRefundedCents: check.refundedCents,
            paymentsLkVerifiedAt: new Date(),
            paymentFailureReason: isFullRefund
              ? 'Payment was refunded in full on Payments.lk.'
              : 'Payment was partially refunded on Payments.lk.',
          },
        },
        { new: true }
      ).lean();
      return {
        confirmed: false,
        gatewayStatus: 'refunded',
        message: isFullRefund
          ? 'Payment was refunded in full on Payments.lk.'
          : 'Payment was partially refunded on Payments.lk.',
        order: synced || orderDoc,
      };
    }

    const dbDoc = await Order.findById(orderDoc._id);
    if (!dbDoc) {
      return {
        confirmed: false,
        gatewayStatus: 'not_found',
        message: 'Order record no longer exists.',
        order: orderDoc,
      };
    }

    const fulfillment = await finalizePaidOrderFromCheckout({ order: dbDoc, checkout });
    if (fulfillment.ok) {
      const updated = await Order.findById(orderDoc._id).lean();
      return {
        confirmed: true,
        gatewayStatus: 'succeeded',
        message: '100% confirmed: Payments.lk received payment for this order.',
        order: updated || fulfillment.order.toObject(),
      };
    }
    return {
      confirmed: false,
      gatewayStatus: payStatus,
      message: fulfillment.reason,
      order: orderDoc,
    };
  }

  // Gateway did NOT confirm money received
  if (orderDoc.paymentStatus === 'paid') {
    const nextPayStatus =
      payStatus === 'failed' || payStatus === 'canceled' || checkout.status === 'expired'
        ? 'failed'
        : 'pending';
    const revoked = await Order.findByIdAndUpdate(
      orderDoc._id,
      {
        $set: {
          paymentStatus: nextPayStatus,
          paymentsLkVerifiedAt: null,
          paymentFailureReason: check.reason,
        },
      },
      { new: true }
    ).lean();
    return {
      confirmed: false,
      gatewayStatus: payStatus,
      message: `Revoked unverified paid flag: ${check.reason}`,
      order: revoked || orderDoc,
    };
  }

  if (payStatus === 'failed' || payStatus === 'canceled' || checkout.status === 'expired') {
    const reason =
      checkout.payment?.failure?.reason ||
      checkout.payment?.failureMessage ||
      (checkout.status === 'expired'
        ? 'Checkout session expired before payment was completed.'
        : 'Payment was not completed on Payments.lk.');
    const failedDoc = await markPendingCardOrderFailed({
      orderId: String(orderDoc._id),
      reason,
    });
    return {
      confirmed: false,
      gatewayStatus: checkout.status === 'expired' ? 'expired' : payStatus,
      message: reason,
      order: failedDoc ? failedDoc.toObject() : orderDoc,
    };
  }

  return {
    confirmed: false,
    gatewayStatus: payStatus,
    message: check.reason,
    order: orderDoc,
  };
}

/**
 * Reconcile pending or unverified Payments.lk card orders against Payments.lk API
 * in bounded concurrent batches so admin order tables reflect 100%-confirmed payments
 * even if the customer closed the gateway tab before returning to /checkout/result.
 */
export async function reconcilePaymentsLkOrders(orders: any[]): Promise<Map<string, any>> {
  const updatedById = new Map<string, any>();
  const candidates = orders.filter(
    (o) =>
      o?.paymentMethod === 'card' &&
      Boolean(o?.paymentsLkCheckoutId) &&
      (o?.paymentStatus === 'pending' ||
        (o?.paymentStatus === 'paid' && !isOrderPaymentsLkConfirmed(o)))
  );

  const BATCH_SIZE = 5;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (orderDoc) => {
        try {
          const result = await verifyAndSyncPaymentsLkOrder(orderDoc);
          if (result.order?._id) {
            updatedById.set(String(result.order._id), result.order);
          }
        } catch (err) {
          console.warn(
            `[OrderReconcile] Live gateway check skipped for ${orderDoc.orderRef}:`,
            (err as Error)?.message || err
          );
        }
      })
    );
  }

  return updatedById;
}

/**
 * Enrich order documents consistently for admin API responses, attaching resolved
 * customer contact info, variant thumbnails, and authoritative `gatewayConfirmed`.
 */
export async function enrichOrdersForAdmin(rawOrders: any[]): Promise<any[]> {
  if (!Array.isArray(rawOrders) || rawOrders.length === 0) return [];

  const clerkIds = Array.from(new Set(rawOrders.map((o: any) => o.clerkId).filter(Boolean)));
  const customers = clerkIds.length > 0
    ? await Customer.find({ clerkId: { $in: clerkIds } }).lean()
    : [];
  const customerMap = new Map(customers.map((c: any) => [c.clerkId, c]));

  const allProductIds = Array.from(
    new Set(rawOrders.flatMap((o: any) => (o.items || []).map((i: any) => i.productId)).filter(Boolean))
  );
  const products = allProductIds.length > 0
    ? await Product.find({ _id: { $in: allProductIds } } as any).select('_id thumbnail colorVariants').lean()
    : [];
  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  return rawOrders.map((order: any) => {
    const cust = order.clerkId ? customerMap.get(order.clerkId) : null;

    const customerName =
      order.customerName ||
      order.guestName ||
      cust?.name ||
      (cust?.email ? cust.email.split('@')[0] : order.isGuestOrder ? 'Guest Customer' : 'Registered Patron');

    const customerEmail = order.customerEmail || order.guestEmail || cust?.email || null;

    const customerMobile =
      order.customerMobile ||
      order.guestMobile ||
      (order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
        ? `${order.shippingAddress.mobileCode} ${order.shippingAddress.mobile}`
        : cust?.mobileCode && cust?.mobile
        ? `${cust.mobileCode} ${cust.mobile}`
        : null);

    const enrichedItems = (order.items || []).map((item: any) => {
      let thumbnail = item.productThumbnail;
      if (item.productId && item.colorVariant) {
        const prod = productMap.get(item.productId.toString());
        const variant = prod?.colorVariants?.find((v: any) => v.colorName === item.colorVariant);
        if (variant?.image?.url) {
          thumbnail = variant.image.url;
        }
      }
      return {
        ...item,
        productThumbnail: thumbnail || item.productThumbnail,
      };
    });

    return {
      ...order,
      items: enrichedItems,
      customerName,
      customerEmail,
      customerMobile,
      gatewayConfirmed: isOrderPaymentsLkConfirmed(order),
    };
  });
}
