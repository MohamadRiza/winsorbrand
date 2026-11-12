import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import {
  PaymentsLkApiError,
  retrievePaymentsLkCheckout,
  verifyCheckoutResultToken,
} from '@/lib/paymentsLk';
import {
  finalizePaidOrderFromCheckout,
  markPendingCardOrderFailed,
} from '@/lib/orderFulfillment';

function serializeReceiptOrder(order: any, extra?: { cardScheme?: string | null; cardLast4?: string | null; returnPath?: string }) {
  const customerMobile =
    order.customerMobile ||
    order.guestMobile ||
    (order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
      ? `${order.shippingAddress.mobileCode} ${order.shippingAddress.mobile}`.trim()
      : order.shippingAddress?.mobile || '');

  return {
    orderRef: order.orderRef,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider || 'payments_lk',
    paymentsLkCheckoutId: order.paymentsLkCheckoutId || null,
    paymentsLkPaymentId: order.paymentsLkPaymentId || null,
    checkoutSource: order.checkoutSource || null,
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
    customerName: order.customerName || order.guestName || 'Valued Patron',
    customerEmail: order.customerEmail || order.guestEmail || '',
    customerMobile,
    shippingAddress: order.shippingAddress,
    items: (order.items || []).map((i: any) => ({
      productId: i.productId,
      productTitle: i.productTitle,
      productModelNo: i.productModelNo,
      productThumbnail: i.productThumbnail,
      colorVariant: i.colorVariant,
      quantity: i.quantity,
      price: i.price,
    })),
    subtotal: order.subtotal,
    couponCode: order.couponCode || null,
    couponDiscountPercent: order.couponDiscountPercent || 0,
    couponDiscountAmount: order.couponDiscountAmount || 0,
    finalTotal: order.finalTotal ?? order.subtotal,
    cardScheme: extra?.cardScheme || null,
    cardLast4: extra?.cardLast4 || null,
    returnPath: extra?.returnPath || '/cart',
  };
}

/**
 * POST /api/payment/payments-lk/confirm
 *
 * Server-authoritative payment verification when a customer returns from Payments.lk.
 * Never trusts query-string `status=succeeded`; queries Payments.lk directly with
 * the checkout ID bound to the Order in MongoDB.
 */
const confirmRateLimiter = new RateLimiterMemory({
  points: 40,
  duration: 300,
});

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  try {
    await confirmRateLimiter.consume(clientIp);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Too many payment verification attempts. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await req.json();
    const orderRef = typeof body?.orderRef === 'string' ? body.orderRef.trim() : '';
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const queryCheckoutId = typeof body?.checkoutId === 'string' ? body.checkoutId.trim() : '';
    const canceled = Boolean(body?.canceled);

    if (!orderRef || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing order confirmation credentials.' },
        { status: 400 }
      );
    }

    const tokenPayload = verifyCheckoutResultToken(token);
    if (!tokenPayload || tokenPayload.orderRef !== orderRef) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired payment confirmation token.' },
        { status: 403 }
      );
    }

    const order = await Order.findOne({ orderRef });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== 'card' || !order.paymentsLkCheckoutId) {
      return NextResponse.json(
        { success: false, error: 'This order is not linked to a Payments.lk checkout session.' },
        { status: 400 }
      );
    }

    // Prevent checkout session substitution via tampered query params
    if (queryCheckoutId && queryCheckoutId !== order.paymentsLkCheckoutId) {
      return NextResponse.json(
        { success: false, error: 'Checkout session mismatch detected.' },
        { status: 403 }
      );
    }

    // Authoritative server-to-server verification against Payments.lk API
    const checkout = await retrievePaymentsLkCheckout(order.paymentsLkCheckoutId);
    const payStatus = checkout.payment?.status || 'unknown';

    if (payStatus === 'succeeded') {
      const result = await finalizePaidOrderFromCheckout({ order, checkout });
      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.reason },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          state: 'paid',
          order: serializeReceiptOrder(result.order, {
            cardScheme: checkout.payment?.card?.scheme || null,
            cardLast4: checkout.payment?.card?.last4 || null,
            returnPath: tokenPayload.returnPath,
          }),
        },
      });
    }

    // Payment declined, canceled, or expired
    if (
      canceled ||
      payStatus === 'failed' ||
      payStatus === 'canceled' ||
      checkout.status === 'expired'
    ) {
      const reason =
        checkout.payment?.failure?.reason ||
        checkout.payment?.failureMessage ||
        (checkout.status === 'expired'
          ? 'The checkout session expired before payment was completed.'
          : 'Payment was cancelled before completion.');

      await markPendingCardOrderFailed({
        orderId: order._id.toString(),
        reason,
      });

      return NextResponse.json({
        success: true,
        data: {
          state: payStatus === 'failed' ? 'failed' : checkout.status === 'expired' ? 'expired' : 'canceled',
          reason,
          canRetry: checkout.status === 'open',
          retryUrl: checkout.status === 'open' ? checkout.url : null,
          returnPath: tokenPayload.returnPath,
          orderRef: order.orderRef,
          checkoutSource: order.checkoutSource || tokenPayload.source,
        },
      });
    }

    // Payment is still in progress or awaiting card entry
    return NextResponse.json({
      success: true,
      data: {
        state: 'pending',
        gatewayStatus: payStatus,
        canRetry: checkout.status === 'open',
        retryUrl: checkout.status === 'open' ? checkout.url : null,
        returnPath: tokenPayload.returnPath,
        orderRef: order.orderRef,
        checkoutSource: order.checkoutSource || tokenPayload.source,
      },
    });
  } catch (error: any) {
    if (error instanceof PaymentsLkApiError) {
      console.error('[Payments.lk Confirm] API verification failed:', {
        status: error.status,
        code: error.code,
        reason: error.reason,
        traceId: error.traceId,
      });
      return NextResponse.json(
        { success: false, error: error.message || 'Unable to verify payment status with Payments.lk.' },
        { status: error.status >= 400 && error.status < 500 ? error.status : 502 }
      );
    }

    console.error('[Payments.lk Confirm] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to confirm payment.' },
      { status: 500 }
    );
  }
}
