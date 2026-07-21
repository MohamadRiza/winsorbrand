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

    // 1. Fetch ALL delivered orders for this user (no date restriction here — we check per-order below)
    const orders = await Order.find({ clerkId: userId, status: 'delivered' }).sort({ createdAt: -1 });

    const now = new Date();
    const REVIEW_WINDOW_DAYS = 90; // Generous 90-day window from delivery date
    const pendingReviews: any[] = [];

    // 2. Iterate orders and check which items can still be reviewed
    for (const order of orders) {
      // Use deliveredAt if set, otherwise fall back to updatedAt (for legacy orders already marked delivered)
      // This ensures orders marked delivered before this fix still appear for review
      const deliveryDate = (order as any).deliveredAt
        ? new Date((order as any).deliveredAt)
        : new Date((order as any).updatedAt || order.createdAt!);

      const diffMs = now.getTime() - deliveryDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, REVIEW_WINDOW_DAYS - diffDays);

      // Skip orders past the review window
      if (diffDays > REVIEW_WINDOW_DAYS) continue;

      for (const item of order.items) {
        // Check if user already reviewed this item in this order
        const alreadyReviewed = await Review.findOne({
          userId,
          productId: item.productId,
          orderId: order.orderRef,
        });

        if (!alreadyReviewed) {
          pendingReviews.push({
            orderId: order.orderRef,
            orderDate: order.createdAt,
            deliveredAt: (order as any).deliveredAt || (order as any).updatedAt || order.createdAt,
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

