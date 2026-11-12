import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { validateAndConsumeCouponForOrder } from '@/lib/couponHelper';
import {
  decrementStockForOrderItems,
  OrderValidationError,
  resolveOrderItemsFromDb,
  sanitizeOrderText as sanitize,
} from '@/lib/orderFulfillment';

// ── Validate email format ──────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Validate mobile (digits, +, spaces, dashes, min 6 chars) ──────────────
function isValidMobile(mobile: string): boolean {
  return /^[\d\s\-+]{6,20}$/.test(mobile);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      guestInfo, items, shippingAddress, paymentMethod, customOrderRef,
      couponCode, validationToken, checkoutSource,
    } = body;

    if (paymentMethod !== 'bank_transfer') {
      return NextResponse.json(
        { success: false, error: 'Card orders must be initiated through Payments.lk checkout.' },
        { status: 400 }
      );
    }

    // ── 1. Validate guest info ──────────────────────────────────────────────
    if (!guestInfo || typeof guestInfo !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Guest information is required' },
        { status: 400 }
      );
    }

    const guestName = sanitize(guestInfo.name);
    const guestEmail = sanitize(guestInfo.email).toLowerCase();
    const guestMobile = sanitize(guestInfo.mobile);

    if (!guestName || guestName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please provide your full name' },
        { status: 400 }
      );
    }

    if (!isValidEmail(guestEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!isValidMobile(guestMobile)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid mobile number' },
        { status: 400 }
      );
    }

    // ── 2. Validate items ───────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // ── 3. Validate shipping address ────────────────────────────────────────
    if (
      !shippingAddress ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country ||
      !shippingAddress.mobile ||
      !shippingAddress.mobileCode
    ) {
      return NextResponse.json(
        { success: false, error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // ── 4. Server-side stock & price validation — NEVER trust client prices ──
    const { validatedItems, serverSubtotal } = await resolveOrderItemsFromDb(items, {
      allowGiftMetadata: false,
    });

    // ── 5. Verify & consume coupon BEFORE decrementing stock ────────────────
    const couponResult = await validateAndConsumeCouponForOrder({
      couponCode,
      validationToken,
      subtotal: serverSubtotal,
      expectedClerkId: null,
    });
    if (!couponResult.ok) {
      return NextResponse.json(
        { success: false, error: couponResult.error },
        { status: couponResult.status }
      );
    }
    const {
      appliedCouponCode,
      couponDiscountPercent,
      couponDiscountAmount,
      finalTotal,
    } = couponResult;

    // ── 6. Generate cryptographically safe order reference ──────────────────
    const uid = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderRef =
      typeof customOrderRef === 'string' && /^WG-[A-Z0-9]{4,16}$/i.test(customOrderRef.trim())
        ? customOrderRef.trim().toUpperCase()
        : `WG-${uid}`;

    // ── 7. Atomically decrement stock ───────────────────────────────────────
    await decrementStockForOrderItems(validatedItems);

    // ── 8. Sanitize shipping address ────────────────────────────────────────
    const safeAddress = {
      address: sanitize(shippingAddress.address),
      city: sanitize(shippingAddress.city),
      postalCode: sanitize(shippingAddress.postalCode),
      country: sanitize(shippingAddress.country),
      mobile: sanitize(shippingAddress.mobile),
      mobileCode: sanitize(shippingAddress.mobileCode),
    };

    // ── 9. Create guest bank-transfer order in DB (always starts pending) ───
    const newOrder = await Order.create({
      clerkId: null,
      isGuestOrder: true,
      guestName,
      guestEmail,
      guestMobile,
      customerName: guestName,
      customerEmail: guestEmail,
      customerMobile: guestMobile,
      orderRef,
      items: validatedItems,
      shippingAddress: safeAddress,
      subtotal: serverSubtotal,
      couponCode: appliedCouponCode,
      couponDiscountPercent,
      couponDiscountAmount,
      finalTotal: appliedCouponCode ? finalTotal : serverSubtotal,
      status: 'pending',
      isGift: false,
      // Payment
      paymentMethod: 'bank_transfer',
      paymentProvider: 'bank_transfer',
      paymentStatus: 'pending',
      checkoutSource: checkoutSource === 'guest_cart' ? 'guest_cart' : 'guest_buy_now',
      inventoryCommitted: true,
      couponCommitted: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderRef: newOrder.orderRef,
        subtotal: newOrder.subtotal,
        couponCode: newOrder.couponCode,
        couponDiscountPercent: newOrder.couponDiscountPercent,
        couponDiscountAmount: newOrder.couponDiscountAmount,
        finalTotal: newOrder.finalTotal,
        status: newOrder.status,
        guestName: newOrder.guestName,
      },
    });
  } catch (error: any) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Guest order creation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error creating guest order' },
      { status: 500 }
    );
  }
}
