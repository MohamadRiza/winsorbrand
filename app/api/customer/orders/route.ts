import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Coupon from '@/lib/models/Coupon';
import Customer from '@/lib/models/Customer';
import { verifyCouponToken } from '@/app/api/customer/validate-coupon/route';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    let { userId } = getAuth(req);
    if (!userId) {
      userId = req.nextUrl.searchParams.get('clerkId');
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const orders = await Order.find({ clerkId: userId }).sort({ createdAt: -1 }).lean();

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
    let { userId } = getAuth(req);
    const body = await req.json();
    const {
      clerkId, orderRef, items, shippingAddress, subtotal, isGift,
      couponCode, validationToken, paymentMethod, paymentStatus, payhereOrderId,
      customerName, customerEmail, customerMobile,
    } = body;

    if (!userId && clerkId) {
      userId = clerkId;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    if (!orderRef || !items || !shippingAddress || !subtotal) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one timepiece' },
        { status: 400 }
      );
    }

    // 1. Validate stock first to prevent race conditions or partial updates and resolve authoritative variant thumbnail
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Timepiece not found` },
          { status: 404 }
        );
      }
      
      const variant = product.colorVariants.find(v => v.colorName === item.colorVariant);
      if (variant) {
        if (variant.qty < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${product.title} (${item.colorVariant}). Only ${variant.qty} remaining.` },
            { status: 400 }
          );
        }
      } else if (product.colorVariants[0]) {
        if (product.colorVariants[0].qty < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${product.title}. Only ${product.colorVariants[0].qty} remaining.` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: `Timepiece does not have any variants available` },
          { status: 400 }
        );
      }

      const variantThumbnail = variant?.image?.url || item.productThumbnail || product.thumbnail?.url || '';
      validatedItems.push({
        ...item,
        productThumbnail: variantThumbnail,
      });
    }

    // 2. Decrement stock for variants
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.colorVariants.find(v => v.colorName === item.colorVariant);
        if (variant) {
          variant.qty -= item.quantity;
          variant.inStock = variant.qty > 0;
        } else if (product.colorVariants[0]) {
          product.colorVariants[0].qty -= item.quantity;
          product.colorVariants[0].inStock = product.colorVariants[0].qty > 0;
        }
        
        // Re-evaluate global sold out state
        const allOutOfStock = product.colorVariants.every(v => v.qty === 0);
        if (allOutOfStock) {
          product.isSoldOut = true;
        }
        
        await product.save();
      }
    }

    // ── Coupon Verification (server-side, cryptographically secure) ──────────
    let appliedCouponCode: string | null = null;
    let couponDiscountPercent = 0;
    let couponDiscountAmount = 0;
    let finalTotal = subtotal;

    if (couponCode && validationToken) {
      // ① Verify the signed JWT issued by validate-coupon route
      const tokenPayload = verifyCouponToken(validationToken);

      if (!tokenPayload) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired coupon validation. Please re-apply your coupon.' },
          { status: 400 }
        );
      }

      // ② Token must belong to this user (prevents token sharing)
      if (tokenPayload.clerkId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Coupon validation mismatch. Please re-apply your coupon.' },
          { status: 403 }
        );
      }

      // ③ Token code must match submitted code
      const submittedCode = couponCode.trim().toUpperCase();
      if (tokenPayload.code !== submittedCode) {
        return NextResponse.json(
          { success: false, error: 'Coupon code mismatch. Please re-apply your coupon.' },
          { status: 400 }
        );
      }

      // ④ Re-validate coupon in DB (final authoritative check)
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: submittedCode,
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (!coupon) {
        return NextResponse.json(
          { success: false, error: 'This coupon has expired or been deactivated. Please proceed without it.' },
          { status: 410 }
        );
      }

      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json(
          { success: false, error: 'This coupon has reached its usage limit.' },
          { status: 409 }
        );
      }

      // ⑤ Compute discount server-side (NEVER trust client amount)
      const discountPct = coupon.discountPercent;
      couponDiscountAmount = Math.round((subtotal * discountPct) / 100);
      finalTotal = Math.max(0, subtotal - couponDiscountAmount);
      couponDiscountPercent = discountPct;
      appliedCouponCode = coupon.code;

      // ⑥ Atomically increment usage count to prevent race conditions
      await Coupon.findOneAndUpdate(
        { _id: coupon._id },
        { $inc: { usageCount: 1 } }
      );
    }

    const isPaid = paymentStatus === 'paid' || (paymentMethod === 'card' && paymentStatus === 'paid');

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
      subtotal,
      status: isPaid ? 'processing' : 'pending',
      isGift: !!isGift || validatedItems.some((i: any) => i.isGift),
      // Coupon data (all computed server-side)
      couponCode: appliedCouponCode,
      couponDiscountPercent,
      couponDiscountAmount,
      finalTotal: appliedCouponCode ? finalTotal : subtotal,
      // Payment
      paymentMethod: paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
      paymentStatus: isPaid ? 'paid' : 'pending',
      payhereOrderId: payhereOrderId || null,
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('Create customer order API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
