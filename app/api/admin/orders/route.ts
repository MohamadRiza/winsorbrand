import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyPermissions } from '@/lib/authHelper';
import { enrichOrdersForAdmin, reconcilePaymentsLkOrders } from '@/lib/orderFulfillment';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['orders_read', 'orders_manage'], 'any');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Fetch all orders in the system, sorted by newest first
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    // Reconcile pending or unverified Payments.lk card orders directly against Payments.lk API
    const syncedById = await reconcilePaymentsLkOrders(orders);
    const reconciledOrders = orders.map((o: any) => syncedById.get(String(o._id)) || o);

    const enrichedOrders = await enrichOrdersForAdmin(reconciledOrders);

    return NextResponse.json({ success: true, data: enrichedOrders });
  } catch (error: any) {
    console.error('Admin fetch orders error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
