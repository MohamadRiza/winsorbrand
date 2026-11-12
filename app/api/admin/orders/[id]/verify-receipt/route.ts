import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyPermissions } from '@/lib/authHelper';
import { enrichOrdersForAdmin } from '@/lib/orderFulfillment';

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/[id]/verify-receipt
//
// Admin-only endpoint to confirm or reject a bank transfer receipt.
// - Approve: Marks order as paymentStatus = 'paid' and (if pending) status = 'processing'.
// - Reject: Marks order as paymentStatus = 'failed'.
// Protected by orders_manage permission.
// ──────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['orders_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

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
        { success: false, error: 'This order is not a direct bank transfer order.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'approve';

    if (action === 'reject') {
      order.paymentStatus = 'failed';
      await order.save();
    } else {
      // Approve action
      if (order.paymentStatus === 'paid') {
        return NextResponse.json(
          { success: false, error: 'This bank transfer order has already been verified and marked as paid.' },
          { status: 409 }
        );
      }

      order.paymentStatus = 'paid';
      // If currently in pending status, advance to processing for dispatch preparation
      if (order.status === 'pending') {
        order.status = 'processing';
      }
      await order.save();
    }

    const [enriched] = await enrichOrdersForAdmin([order.toObject()]);

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error('[Admin Verify Receipt] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error verifying receipt.' },
      { status: 500 }
    );
  }
}
