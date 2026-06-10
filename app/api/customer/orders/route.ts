import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const orders = await Order.find({ clerkId: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orders });
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
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderRef, items, shippingAddress, subtotal } = body;

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

    const newOrder = await Order.create({
      clerkId: userId,
      orderRef,
      items,
      shippingAddress,
      subtotal,
      status: 'pending',
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
