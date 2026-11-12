import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getVerifiedClerkUserId } from '@/lib/clerkAuth';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Customer from '@/lib/models/Customer';
import { previewCouponForOrder } from '@/lib/couponHelper';
import {
  createPaymentsLkCheckout,
  normalizeSriLankanPhoneForPaymentsLk,
  PaymentsLkApiError,
  resolvePublicOrigin,
  sanitizeInternalReturnPath,
  signCheckoutResultToken,
} from '@/lib/paymentsLk';
import {
  OrderValidationError,
  resolveOrderItemsFromDb,
  sanitizeOrderText,
} from '@/lib/orderFulfillment';
import { CheckoutSource } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[\d\s\-+]{6,20}$/;

const checkoutRateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 300,
});

function validateShippingAddress(raw: any): {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  mobile: string;
  mobileCode: string;
} {
  if (!raw || typeof raw !== 'object') {
    throw new OrderValidationError('Complete shipping address is required.', 400);
  }
  const address = sanitizeOrderText(raw.address, 300);
  const city = sanitizeOrderText(raw.city, 120);
  const postalCode = sanitizeOrderText(raw.postalCode, 30);
  const country = sanitizeOrderText(raw.country, 80);
  const mobile = sanitizeOrderText(raw.mobile, 30);
  const mobileCode = sanitizeOrderText(raw.mobileCode, 10);

  if (!address || !city || !postalCode || !country || !mobile || !mobileCode) {
    throw new OrderValidationError('Complete shipping address is required.', 400);
  }
  return { address, city, postalCode, country, mobile, mobileCode };
}

export async function POST(req: NextRequest) {
  let createdOrderId: string | null = null;

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  try {
    await checkoutRateLimiter.consume(clientIp);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await req.json();
    const isGuest = Boolean(body?.isGuest);
    const items = body?.items;
    const rawShippingAddress = body?.shippingAddress;
    const guestInfo = body?.guestInfo;
    const couponCode = body?.couponCode;
    const validationToken = body?.validationToken;
    const isGiftFlag = Boolean(body?.isGift);
    const requestedSource = body?.checkoutSource as CheckoutSource | undefined;

    const checkoutSource: CheckoutSource = isGuest
      ? (requestedSource === 'guest_cart' ? 'guest_cart' : 'guest_buy_now')
      : (requestedSource === 'buy_now' ? 'buy_now' : 'cart');

    const defaultReturnPath =
      checkoutSource === 'cart' || checkoutSource === 'guest_cart' ? '/cart' : '/collections';
    const returnPath = sanitizeInternalReturnPath(body?.returnPath, defaultReturnPath);

    let authenticatedClerkId: string | null = null;
    let resolvedName = '';
    let resolvedEmail = '';
    let resolvedMobile = '';

    if (!isGuest) {
      const userId = await getVerifiedClerkUserId(req);
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please sign in to complete your purchase.' },
          { status: 401 }
        );
      }
      if (typeof body?.clerkId === 'string' && body.clerkId && body.clerkId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Account session mismatch. Please refresh and try again.' },
          { status: 403 }
        );
      }

      authenticatedClerkId = userId;
      resolvedName = sanitizeOrderText(body?.customerName, 80);
      resolvedEmail = sanitizeOrderText(body?.customerEmail, 254).toLowerCase();
      resolvedMobile = sanitizeOrderText(body?.customerMobile, 30);

      if (!resolvedEmail || !resolvedName) {
        const customerDoc = await Customer.findOne({ clerkId: userId }).lean() as any;
        if (customerDoc) {
          if (!resolvedEmail && customerDoc.email) resolvedEmail = String(customerDoc.email).trim().toLowerCase();
          if (!resolvedName && customerDoc.name) resolvedName = String(customerDoc.name).trim();
          if (!resolvedMobile && customerDoc.mobile) {
            resolvedMobile = `${customerDoc.mobileCode || ''} ${customerDoc.mobile}`.trim();
          }
        }
      }
    } else {
      if (!guestInfo || typeof guestInfo !== 'object') {
        throw new OrderValidationError('Guest contact details are required.', 400);
      }
      resolvedName = sanitizeOrderText(guestInfo.name, 80);
      resolvedEmail = sanitizeOrderText(guestInfo.email, 254).toLowerCase();
      resolvedMobile = sanitizeOrderText(guestInfo.mobile, 30);

      if (!resolvedName || resolvedName.length < 2) {
        throw new OrderValidationError('Please provide your full name.', 400);
      }
      if (!EMAIL_REGEX.test(resolvedEmail)) {
        throw new OrderValidationError('Please provide a valid email address.', 400);
      }
      if (!MOBILE_REGEX.test(resolvedMobile)) {
        throw new OrderValidationError('Please provide a valid mobile number.', 400);
      }
    }

    const shippingAddress = validateShippingAddress(rawShippingAddress);
    if (!resolvedMobile) {
      resolvedMobile = `${shippingAddress.mobileCode} ${shippingAddress.mobile}`.trim();
    }

    // 1. Validate & price all items authoritatively from MongoDB
    const { validatedItems, serverSubtotal, hasGifts } = await resolveOrderItemsFromDb(items, {
      allowGiftMetadata: !isGuest,
    });

    // 2. Verify coupon read-only (consumed atomically ONLY when payment succeeds)
    const couponResult = await previewCouponForOrder({
      couponCode,
      validationToken,
      subtotal: serverSubtotal,
      expectedClerkId: authenticatedClerkId,
    });

    if (!couponResult.ok) {
      return NextResponse.json(
        { success: false, error: couponResult.error },
        { status: couponResult.status }
      );
    }

    const finalTotal = couponResult.appliedCouponCode ? couponResult.finalTotal : serverSubtotal;

    // 3. Generate unique server-authoritative order reference
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderRef = isGuest
      ? `WG-${randomSuffix}`
      : checkoutSource === 'buy_now'
      ? `WN-${randomSuffix}`
      : `WNS-2026-${randomSuffix}`;

    // 4. Create pending card order (inventory & coupon NOT committed until gateway confirmation)
    const newOrder = await Order.create({
      clerkId: authenticatedClerkId,
      isGuestOrder: isGuest,
      guestName: isGuest ? resolvedName : null,
      guestEmail: isGuest ? resolvedEmail : null,
      guestMobile: isGuest ? resolvedMobile : null,
      customerName: resolvedName || 'Valued Client',
      customerEmail: resolvedEmail || null,
      customerMobile: resolvedMobile || null,
      orderRef,
      items: validatedItems,
      shippingAddress,
      subtotal: serverSubtotal,
      status: 'pending',
      isGift: !isGuest && (isGiftFlag || hasGifts),
      couponCode: couponResult.appliedCouponCode,
      couponDiscountPercent: couponResult.couponDiscountPercent,
      couponDiscountAmount: couponResult.couponDiscountAmount,
      finalTotal,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      paymentProvider: 'payments_lk',
      checkoutSource,
      inventoryCommitted: false,
      couponCommitted: false,
    });

    createdOrderId = newOrder._id.toString();

    // 5. Build signed return token & Payments.lk redirect URLs
    const origin = resolvePublicOrigin(req);
    const resultToken = signCheckoutResultToken({
      orderRef,
      source: checkoutSource,
      returnPath,
    });

    const successUrl = `${origin}/checkout/result?ref=${encodeURIComponent(orderRef)}&token=${encodeURIComponent(resultToken)}`;
    const cancelUrl = `${origin}/checkout/result?ref=${encodeURIComponent(orderRef)}&token=${encodeURIComponent(resultToken)}&flow=cancel`;

    const totalItems = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const primaryTitle = validatedItems[0]?.productTitle || 'Timepiece';
    const description =
      validatedItems.length === 1
        ? `Winsor Maison - ${primaryTitle}${totalItems > 1 ? ` x${totalItems}` : ''} (${orderRef})`
        : `Winsor Maison - ${totalItems} Timepieces (${orderRef})`;

    const lkPhone = normalizeSriLankanPhoneForPaymentsLk(
      shippingAddress.mobileCode,
      shippingAddress.mobile
    );

    // 6. Create hosted checkout session via Payments.lk API (secret key stays strictly on server)
    const checkout = await createPaymentsLkCheckout({
      amountLkr: finalTotal,
      description,
      reference: orderRef,
      customer: {
        name: resolvedName || 'Winsor Client',
        email: resolvedEmail || undefined,
        ...(lkPhone ? { phone: lkPhone } : {}),
      },
      successUrl,
      cancelUrl,
      idempotencyKey: orderRef,
      expiresInMinutes: 30,
    });

    // 7. Bind authoritative Payments.lk checkout ID to our order
    await Order.findByIdAndUpdate(newOrder._id, {
      $set: { paymentsLkCheckoutId: checkout.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutId: checkout.id,
        checkoutUrl: checkout.url,
        orderRef,
        expiresAt: checkout.expiresAt,
        resultToken,
      },
    });
  } catch (error: any) {
    // Clean up newly created uncommitted order if gateway checkout creation failed
    if (createdOrderId) {
      try {
        await Order.deleteOne({
          _id: createdOrderId,
          paymentStatus: 'pending',
          inventoryCommitted: false,
        });
      } catch (cleanupErr) {
        console.warn('[Payments.lk Checkout] Cleanup failed for order:', createdOrderId, cleanupErr);
      }
    }

    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof PaymentsLkApiError) {
      console.error('[Payments.lk Checkout] Gateway API error:', {
        status: error.status,
        code: error.code,
        reason: error.reason,
        traceId: error.traceId,
        fields: error.fields,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            error.status === 401 || error.status === 403
              ? 'Payment gateway authentication error. Please contact support.'
              : error.message || 'Unable to initiate payment gateway.',
        },
        { status: error.status >= 400 && error.status < 500 ? error.status : 502 }
      );
    }

    console.error('[Payments.lk Checkout] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to initiate Payments.lk checkout.' },
      { status: 500 }
    );
  }
}
