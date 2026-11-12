import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { verifyPermissions } from '@/lib/authHelper';
import { enrichOrdersForAdmin } from '@/lib/orderFulfillment';

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
    const body = await req.json();
    const { status, paymentStatus } = body;

    const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested'];
    const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

    if (!status && !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing status/paymentStatus' },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status' },
        { status: 400 }
      );
    }

    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Never allow manual override of paymentStatus for Payments.lk card orders
    if (paymentStatus && order.paymentMethod !== 'bank_transfer') {
      return NextResponse.json(
        {
          success: false,
          error: 'Online card payments can only be confirmed via Payments.lk gateway verification.',
        },
        { status: 400 }
      );
    }

    const previousStatus = order.status;

    // Stock replenishment check:
    // If the status is changing to 'cancelled' from a non-cancelled active state,
    // restore inventory stock in parallel ONLY when inventory was previously committed.
    if (status && status === 'cancelled' && previousStatus !== 'cancelled' && order.inventoryCommitted !== false) {
      await Promise.all(
        order.items.map(async (item: any) => {
          const product = await Product.findById(item.productId);
          if (product) {
            const variant = product.colorVariants.find(v => v.colorName === item.colorVariant);
            if (variant) {
              variant.qty += item.quantity;
              variant.inStock = variant.qty > 0;
            } else if (product.colorVariants[0]) {
              product.colorVariants[0].qty += item.quantity;
              product.colorVariants[0].inStock = product.colorVariants[0].qty > 0;
            }
            
            const anyInStock = product.colorVariants.some(v => v.qty > 0);
            if (anyInStock) {
              product.isSoldOut = false;
            }
            
            await product.save();
          }
        })
      );
    }

    if (status) {
      order.status = status;
      if (status === 'delivered' && !(order as any).deliveredAt) {
        (order as any).deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    const [enriched] = await enrichOrdersForAdmin([order.toObject()]);

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error('Admin update order error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
