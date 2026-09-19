import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Customer from '@/lib/models/Customer';
import Product from '@/lib/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const rawRef = searchParams.get('ref')?.trim() || '';
    const mobile = searchParams.get('mobile')?.trim() || searchParams.get('phone')?.trim() || '';
    let clerkId = searchParams.get('clerkId')?.trim() || '';

    let { userId } = getAuth(req);
    if (!userId && clerkId) {
      userId = clerkId;
    }

    if (!rawRef) {
      return NextResponse.json(
        { success: false, error: 'Order reference is required.' },
        { status: 400 }
      );
    }

    // Case-insensitive regex query for orderRef (e.g. WNS-2026-373243 or WG-8F9A2B or WN-YOZHCSWY)
    const orderRefRegex = new RegExp(`^${rawRef.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');

    // Find order in DB (matches both guest & registered user orders)
    const order = await Order.findOne({
      orderRef: orderRefRegex,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order reference not found. Please double-check your reference code.' },
        { status: 404 }
      );
    }

    // Normalise phone numbers for robust matching (removes non-digit characters)
    const cleanDigits = (m?: string | null) => (m ? m.replace(/\D/g, '') : '');
    const stripZero = (s: string) => s.replace(/^0+/, '');

    const inputDigits = cleanDigits(mobile);
    const inputStripped = stripZero(inputDigits);

    // Extract candidate mobile numbers stored on the order document
    const candidateNumbers = [
      order.guestMobile,
      order.shippingAddress?.mobile,
      order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
        ? `${order.shippingAddress.mobileCode}${order.shippingAddress.mobile}`
        : null,
    ].filter(Boolean) as string[];

    // Verify if any candidate mobile matches input
    const isMobileMatch = inputDigits.length > 0 && candidateNumbers.some(cand => {
      const candDigits = cleanDigits(cand);
      if (!candDigits) return false;
      const candStripped = stripZero(candDigits);

      return (
        candDigits === inputDigits ||
        candStripped === inputStripped ||
        candDigits.endsWith(inputStripped) ||
        inputDigits.endsWith(candStripped) ||
        candDigits.includes(inputStripped) ||
        inputStripped.includes(candStripped)
      );
    });

    // Check if the caller is the authenticated owner of the order via Clerk
    const isOwnerAuthenticated = Boolean(userId && order.clerkId && order.clerkId === userId);

    if (!isOwnerAuthenticated && !isMobileMatch) {
      if (!mobile) {
        return NextResponse.json(
          { success: false, error: 'Registered mobile number is required to view tracking records for this order.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Mobile number does not match our records for this order reference.' },
        { status: 403 }
      );
    }

    // Extract formatted phone number with country code
    let orderMobile = order.customerMobile || order.guestMobile || '';
    if (!orderMobile && order.shippingAddress?.mobile) {
      const code = order.shippingAddress.mobileCode || '';
      orderMobile = code && !order.shippingAddress.mobile.startsWith('+')
        ? `${code} ${order.shippingAddress.mobile}`.trim()
        : order.shippingAddress.mobile;
    }

    if (!orderMobile && order.clerkId) {
      try {
        const cust = await Customer.findOne({ clerkId: order.clerkId }).lean() as any;
        if (cust?.mobile) {
          const code = cust.mobileCode || '';
          orderMobile = code && !cust.mobile.startsWith('+') ? `${code} ${cust.mobile}`.trim() : cust.mobile;
        }
      } catch {
        // ignore
      }
    }

    // Collect productIds to ensure variant image lookup fallback for historical orders
    const productIds = Array.from(new Set((order.items || []).map((i: any) => i.productId).filter(Boolean)));
    const products = productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } } as any).select('_id thumbnail colorVariants').lean()
      : [];
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

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
        productId: item.productId,
        productTitle: item.productTitle,
        productModelNo: item.productModelNo,
        productThumbnail: thumbnail || item.productThumbnail,
        colorVariant: item.colorVariant,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // Return sanitized order data with registered mobile number for auto-fill
    return NextResponse.json({
      success: true,
      data: {
        orderRef: order.orderRef,
        status: order.status || 'pending',
        createdAt: order.createdAt,
        subtotal: order.subtotal || 0,
        finalTotal: order.finalTotal || order.subtotal || 0,
        mobile: orderMobile,
        items: enrichedItems,
        shippingAddress: {
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          country: order.shippingAddress?.country || 'LK',
          postalCode: order.shippingAddress?.postalCode || '',
          mobile: orderMobile,
          mobileCode: order.shippingAddress?.mobileCode || '',
        },
        guestName: order.guestName || (order.shippingAddress?.address ? 'Valued Client' : 'Customer'),
        customerName: order.customerName || order.guestName || 'Valued Client',
        customerEmail: order.customerEmail || order.guestEmail || '',
        customerMobile: order.customerMobile || order.guestMobile || orderMobile,
        paymentMethod: order.paymentMethod || 'card',
        paymentStatus: order.paymentStatus || (order.paymentMethod === 'bank_transfer' ? 'pending' : 'paid'),
      },
    });
  } catch (error: any) {
    console.error('Order tracking API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error while tracking order.' },
      { status: 500 }
    );
  }
}
