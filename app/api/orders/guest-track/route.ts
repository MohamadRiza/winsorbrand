import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const rawRef = searchParams.get('ref')?.trim() || '';
    const mobile = searchParams.get('mobile')?.trim() || '';

    if (!rawRef || !mobile) {
      return NextResponse.json(
        { success: false, error: 'Order reference and registered mobile number are required.' },
        { status: 400 }
      );
    }

    // Case-insensitive regex query for orderRef (e.g. WNS-2026-373243 or WG-8F9A2B)
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

    // Normalise phone numbers for robust matching (removes +, spaces, dashes, parentheses)
    const normalise = (m?: string | null) => (m ? m.replace(/[\s\-\+\(\)]/g, '') : '');
    const inputMobile = normalise(mobile);
    
    // Extract candidate mobile numbers stored on the order document
    const candidateMobiles = [
      normalise(order.guestMobile),
      normalise(order.shippingAddress?.mobile),
      order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
        ? normalise(`${order.shippingAddress.mobileCode}${order.shippingAddress.mobile}`)
        : '',
    ].filter(Boolean);

    // Verify if any candidate mobile matches input
    const isMobileMatch = candidateMobiles.some(stored => {
      if (!stored || !inputMobile) return false;
      return stored.includes(inputMobile) || inputMobile.includes(stored);
    });

    if (!isMobileMatch) {
      return NextResponse.json(
        { success: false, error: 'Mobile number does not match our records for this order reference.' },
        { status: 403 }
      );
    }

    // Return sanitized order data
    return NextResponse.json({
      success: true,
      data: {
        orderRef: order.orderRef,
        status: order.status || 'pending',
        createdAt: order.createdAt,
        subtotal: order.subtotal || 0,
        finalTotal: order.finalTotal || order.subtotal || 0,
        items: (order.items || []).map((item: any) => ({
          productTitle: item.productTitle,
          productModelNo: item.productModelNo,
          productThumbnail: item.productThumbnail,
          colorVariant: item.colorVariant,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          country: order.shippingAddress?.country || 'LK',
        },
        guestName: order.guestName || (order.shippingAddress?.address ? 'Valued Client' : 'Customer'),
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
