import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderRef = searchParams.get('ref')?.trim().toUpperCase() || '';
    const mobile = searchParams.get('mobile')?.trim() || '';

    if (!orderRef || !mobile) {
      return NextResponse.json(
        { success: false, error: 'Order reference and mobile number are required' },
        { status: 400 }
      );
    }

    // Find guest order by reference (case-insensitive on guestMobile)
    const order = await Order.findOne({
      orderRef,
      isGuestOrder: true,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found. Please check your order reference.' },
        { status: 404 }
      );
    }

    // Verify mobile matches (strips spaces/dashes for comparison)
    const normalise = (m: string) => m.replace(/[\s\-]/g, '');
    const storedMobile = normalise(order.guestMobile || '');
    const inputMobile = normalise(mobile);

    if (!storedMobile || !inputMobile || !storedMobile.includes(inputMobile) && !inputMobile.includes(storedMobile)) {
      return NextResponse.json(
        { success: false, error: 'Mobile number does not match our records for this order.' },
        { status: 403 }
      );
    }

    // Return safe subset — never expose internal IDs or full guest email
    return NextResponse.json({
      success: true,
      data: {
        orderRef: order.orderRef,
        status: order.status,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        finalTotal: order.finalTotal,
        items: order.items.map((item: any) => ({
          productTitle: item.productTitle,
          productModelNo: item.productModelNo,
          productThumbnail: item.productThumbnail,
          colorVariant: item.colorVariant,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          country: order.shippingAddress.country,
        },
        guestName: order.guestName,
      },
    });
  } catch (error: any) {
    console.error('Guest order tracking error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
