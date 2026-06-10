import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing status' },
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

    const previousStatus = order.status;

    // Stock replenishment check:
    // If the status is changing to 'cancelled' from a non-cancelled active state, restore inventory stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
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
          
          // Re-evaluate global sold out state (if any variant has qty > 0, isSoldOut is false)
          const anyInStock = product.colorVariants.some(v => v.qty > 0);
          if (anyInStock) {
            product.isSoldOut = false;
          }
          
          await product.save();
        }
      }
    }

    // If we are reverting/rejecting a cancellation request and status is not cancelled,
    // (no stock change is needed since stock was already decremented at checkout)
    order.status = status;
    await order.save();

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Admin update order error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
