import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Review from '@/lib/models/Review';

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

    // 1. Fetch delivered orders for this user
    const orders = await Order.find({ clerkId: userId, status: 'delivered' }).sort({ createdAt: -1 });

    const now = new Date();
    const pendingReviews: any[] = [];

    // 2. Iterate orders and check which items can be reviewed (within 30 days and not reviewed yet)
    for (const order of orders) {
      const orderDate = new Date(order.createdAt!);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Exclude orders older than 30 days
      if (diffDays > 30) continue;

      for (const item of order.items) {
        // Check if user already reviewed this item in this order
        const alreadyReviewed = await Review.findOne({
          userId,
          productId: item.productId,
          orderId: order.orderRef,
        });

        if (!alreadyReviewed) {
          const daysLeft = Math.max(0, 30 - Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          pendingReviews.push({
            orderId: order.orderRef,
            orderDate: order.createdAt,
            productId: item.productId,
            productTitle: item.productTitle,
            productModelNo: item.productModelNo,
            productThumbnail: item.productThumbnail,
            colorVariant: item.colorVariant,
            price: item.price,
            daysLeft,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: pendingReviews });
  } catch (error: any) {
    console.error('Fetch pending reviews API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
