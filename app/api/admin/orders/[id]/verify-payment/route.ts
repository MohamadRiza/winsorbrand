import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyPermissions } from '@/lib/authHelper';
import { PaymentsLkApiError } from '@/lib/paymentsLk';
import {
  enrichOrdersForAdmin,
  verifyAndSyncPaymentsLkOrder,
} from '@/lib/orderFulfillment';

/**
 * POST /api/admin/orders/[id]/verify-payment
 *
 * Admin-only endpoint to live-query Payments.lk for an online card order
 * and confirm whether money was 100% received (status=completed, payment.status=succeeded,
 * positive net settlement, matching currency/reference/amount/mode).
 */
export async function POST(
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

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID.' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== 'card') {
      return NextResponse.json(
        { success: false, error: 'Gateway verification only applies to online card orders.' },
        { status: 400 }
      );
    }

    const verification = await verifyAndSyncPaymentsLkOrder(order);
    const [enriched] = await enrichOrdersForAdmin([verification.order]);

    return NextResponse.json({
      success: true,
      confirmed: verification.confirmed,
      gatewayStatus: verification.gatewayStatus,
      message: verification.message,
      data: enriched,
    });
  } catch (error: any) {
    if (error instanceof PaymentsLkApiError) {
      console.error('[Admin Verify Payment] Gateway API error:', {
        status: error.status,
        code: error.code,
        reason: error.reason,
        traceId: error.traceId,
      });
      return NextResponse.json(
        { success: false, error: error.message || 'Unable to verify payment with Payments.lk.' },
        { status: error.status >= 400 && error.status < 500 ? error.status : 502 }
      );
    }

    console.error('[Admin Verify Payment] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error verifying payment.' },
      { status: 500 }
    );
  }
}
