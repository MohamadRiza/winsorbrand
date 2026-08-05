import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

// ── Security helper: sanitize strings ──────────────────────────────────────
function sanitize(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/<[^>]*>/g, '').slice(0, 500);
}

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
    const { guestInfo, items, shippingAddress, paymentMethod } = body;

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

    // ── 4. Server-side stock validation — NEVER trust client prices ─────────
    let serverSubtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid item data in order' },
          { status: 400 }
        );
      }

      // Fetch product from DB — authoritative price and stock source
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { success: false, error: `Product not found or unavailable` },
          { status: 404 }
        );
      }

      // Find variant
      const variant = product.colorVariants.find(
        (v: any) => v.colorName === item.colorVariant
      ) || product.colorVariants[0];

      if (!variant) {
        return NextResponse.json(
          { success: false, error: `No variant available for ${product.title}` },
          { status: 400 }
        );
      }

      // Check stock
      if (variant.qty < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.title}" (${variant.colorName}). Only ${variant.qty} available.`,
          },
          { status: 400 }
        );
      }

      // Use DB price — never client-supplied price
      const serverPrice = product.price;
      serverSubtotal += serverPrice * item.quantity;

      validatedItems.push({
        productId: product._id.toString(),
        productTitle: product.title,
        productModelNo: product.modelNo,
        productThumbnail: product.thumbnail?.url || '',
        colorVariant: variant.colorName,
        quantity: item.quantity,
        price: serverPrice,
        isGift: false,
        giftNote: '',
        canvaLink: '',
        giftAttachmentUrl: '',
        giftAttachmentName: '',
      });
    }

    // ── 5. Generate cryptographically safe order reference ──────────────────
    const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const orderRef = `WG-${uid}`;  // WG prefix = Winsor Guest

    // ── 6. Atomically decrement stock ───────────────────────────────────────
    for (const item of validatedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.colorVariants.find(
        (v: any) => v.colorName === item.colorVariant
      );
      if (variant) {
        variant.qty -= item.quantity;
        variant.inStock = variant.qty > 0;
      } else if (product.colorVariants[0]) {
        product.colorVariants[0].qty -= item.quantity;
        product.colorVariants[0].inStock = product.colorVariants[0].qty > 0;
      }

      // Update global isSoldOut flag if all variants empty
      const allOutOfStock = product.colorVariants.every((v: any) => v.qty === 0);
      if (allOutOfStock) {
        product.isSoldOut = true;
      }

      await product.save();
    }

    // ── 7. Sanitize shipping address ────────────────────────────────────────
    const safeAddress = {
      address: sanitize(shippingAddress.address),
      city: sanitize(shippingAddress.city),
      postalCode: sanitize(shippingAddress.postalCode),
      country: sanitize(shippingAddress.country),
      mobile: sanitize(shippingAddress.mobile),
      mobileCode: sanitize(shippingAddress.mobileCode),
    };

    // ── 8. Create guest order in DB ─────────────────────────────────────────
    const newOrder = await Order.create({
      clerkId: null,
      isGuestOrder: true,
      guestName,
      guestEmail,
      guestMobile,
      orderRef,
      items: validatedItems,
      shippingAddress: safeAddress,
      subtotal: serverSubtotal,
      finalTotal: serverSubtotal,
      status: 'pending',
      isGift: false,
      // Payment
      paymentMethod: paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
      paymentStatus: 'pending',
    });

    return NextResponse.json({
      success: true,
      data: {
        orderRef: newOrder.orderRef,
        subtotal: newOrder.subtotal,
        status: newOrder.status,
        guestName: newOrder.guestName,
      },
    });
  } catch (error: any) {
    console.error('Guest order creation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error creating guest order' },
      { status: 500 }
    );
  }
}
