import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/[id]/verify-receipt
//
// Admin-only endpoint to confirm a bank transfer receipt has been verified.
// Marks the order as paid and moves it to 'processing' status.
// Protected by the existing admin middleware on the /api/admin/* route group.
// ──────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || id.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID.' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== 'bank_transfer') {
      return NextResponse.json(
        { success: false, error: 'This order is not a bank transfer order.' },
        { status: 400 }
      );
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { success: false, error: 'This order has already been verified and marked as paid.' },
        { status: 409 }
      );
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      {
        paymentStatus: 'paid',
        status: 'processing',
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Admin Verify Receipt] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error verifying receipt.' },
      { status: 500 }
    );
  }
}
