import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedClerkUserId } from '@/lib/clerkAuth';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Customer from '@/lib/models/Customer';
import { validateAndConsumeCouponForOrder } from '@/lib/couponHelper';
import {
  decrementStockForOrderItems,
  OrderValidationError,
  resolveOrderItemsFromDb,
} from '@/lib/orderFulfillment';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = await getVerifiedClerkUserId(req);
    const queryClerkId = req.nextUrl.searchParams.get('clerkId');
    const queryEmail = req.nextUrl.searchParams.get('email');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    if (queryClerkId && queryClerkId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Account session mismatch.' },
        { status: 403 }
      );
    }

    const filterConditions: any[] = [{ clerkId: userId }];

    // Only include email-matched orders if the email belongs to this authenticated customer's profile
    const customerProfile = await Customer.findOne({ clerkId: userId }).select('email').lean() as any;
    const verifiedProfileEmail = customerProfile?.email ? String(customerProfile.email).toLowerCase().trim() : '';
    const requestedEmail = queryEmail ? queryEmail.toLowerCase().trim() : '';
    const emailToInclude = verifiedProfileEmail && (!requestedEmail || requestedEmail === verifiedProfileEmail)
      ? verifiedProfileEmail
      : '';

    if (emailToInclude) {
      filterConditions.push({ customerEmail: emailToInclude });
      filterConditions.push({ guestEmail: emailToInclude });
    }

    const query = filterConditions.length === 1
      ? filterConditions[0]
      : { $or: filterConditions };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const productIds = Array.from(new Set(orders.flatMap((o: any) => (o.items || []).map((i: any) => i.productId)).filter(Boolean)));
    const products = productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } } as any).select('_id thumbnail colorVariants').lean()
      : [];
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedOrders = orders.map((order: any) => {
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
      };
    });

    return NextResponse.json({ success: true, data: enrichedOrders });
  } catch (error: any) {
    console.error('Fetch customer orders API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = await getVerifiedClerkUserId(req);
    const body = await req.json();
    const {
      clerkId, orderRef: clientOrderRef, items, shippingAddress, isGift,
      couponCode, validationToken, paymentMethod,
      customerName, customerEmail, customerMobile, checkoutSource,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    if (typeof clerkId === 'string' && clerkId && clerkId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Account session mismatch.' },
        { status: 403 }
      );
    }

    if (paymentMethod !== 'bank_transfer') {
      return NextResponse.json(
        { success: false, error: 'Card orders must be initiated through Payments.lk checkout.' },
        { status: 400 }
      );
    }

    if (!items || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    // 1. Authoritatively validate stock and compute subtotal strictly from MongoDB Product records
    const { validatedItems, serverSubtotal, hasGifts } = await resolveOrderItemsFromDb(items, {
      allowGiftMetadata: true,
    });

    // 2. Verify and consume coupon BEFORE decrementing stock so invalid coupons never subtract inventory
    const couponResult = await validateAndConsumeCouponForOrder({
      couponCode,
      validationToken,
      subtotal: serverSubtotal,
      expectedClerkId: userId,
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

    // 3. Decrement stock atomically after coupon verification
    await decrementStockForOrderItems(validatedItems);

    const safeSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderRef =
      typeof clientOrderRef === 'string' && /^(WNS-2026-|WN-)[A-Z0-9]{4,16}$/i.test(clientOrderRef.trim())
        ? clientOrderRef.trim().toUpperCase()
        : `WNS-2026-${safeSuffix}`;

    // Look up customer document to fill in any missing contact details
    let resolvedCustomerName = customerName?.trim() || null;
    let resolvedCustomerEmail = customerEmail?.trim()?.toLowerCase() || null;
    let resolvedCustomerMobile = customerMobile?.trim() || null;

    if (!resolvedCustomerEmail || !resolvedCustomerName) {
      try {
        const customerDoc = await Customer.findOne({ clerkId: userId });
        if (customerDoc) {
          if (!resolvedCustomerEmail && customerDoc.email) resolvedCustomerEmail = customerDoc.email;
          if (!resolvedCustomerName && customerDoc.name) resolvedCustomerName = customerDoc.name;
          if (!resolvedCustomerMobile && customerDoc.mobile) {
            resolvedCustomerMobile = `${customerDoc.mobileCode || ''} ${customerDoc.mobile}`.trim();
          }
        }
      } catch (e) {
        console.warn('Could not lookup customer profile on order create:', e);
      }
    }

    if (!resolvedCustomerMobile && shippingAddress?.mobile) {
      resolvedCustomerMobile = `${shippingAddress.mobileCode || ''} ${shippingAddress.mobile}`.trim();
    }

    const newOrder = await Order.create({
      clerkId: userId,
      isGuestOrder: false,
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      customerMobile: resolvedCustomerMobile,
      orderRef,
      items: validatedItems,
      shippingAddress,
      subtotal: serverSubtotal,
      status: 'pending',
      isGift: !!isGift || hasGifts,
      // Coupon data (all computed server-side)
      couponCode: appliedCouponCode,
      couponDiscountPercent,
      couponDiscountAmount,
      finalTotal: appliedCouponCode ? finalTotal : serverSubtotal,
      // Payment — bank transfer always starts pending admin receipt verification
      paymentMethod: 'bank_transfer',
      paymentProvider: 'bank_transfer',
      paymentStatus: 'pending',
      checkoutSource: checkoutSource === 'buy_now' ? 'buy_now' : 'cart',
      inventoryCommitted: true,
      couponCommitted: true,
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Create customer order API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
