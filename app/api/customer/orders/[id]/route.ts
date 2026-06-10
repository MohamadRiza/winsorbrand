import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = getAuth(req);
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // High security: Verify that the user owns the order
    if (order.clerkId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not own this order.' },
        { status: 403 }
      );
    }

    // Restrict cancellation to pending/processing orders
    if (order.status !== 'pending' && order.status !== 'processing') {
      return NextResponse.json(
        { success: false, error: `Cannot request cancellation. Order is already ${order.status}.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { cancelReason } = body;

    if (!cancelReason || !cancelReason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide a reason for cancelling the order.' },
        { status: 400 }
      );
    }

    order.status = 'cancel_requested';
    order.cancelReason = cancelReason;
    await order.save();

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Request order cancellation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
