import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';

// GET: Fetch approved reviews for a given product
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ productId, status: 'approved' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('Fetch product reviews error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// POST: Submit a customer review
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
    const { productId, orderId, rating, comment, images, isAnonymous, username, userAvatar } = body;

    if (!productId || !orderId || rating === undefined || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      );
    }

    // 1. Verify purchase: check if order exists for this user, status is 'delivered'
    const order = await Order.findOne({ clerkId: userId, orderRef: orderId, status: 'delivered' });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No delivered order found matching this purchase.' },
        { status: 400 }
      );
    }

    // 2. Check if purchase is within 30 days
    const orderDate = new Date(order.createdAt!);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return NextResponse.json(
        { success: false, error: 'Review period has expired (30 days from purchase).' },
        { status: 400 }
      );
    }

    // 3. Verify item is in order
    const itemInOrder = order.items.some((item: any) => item.productId.toString() === productId.toString());
    if (!itemInOrder) {
      return NextResponse.json(
        { success: false, error: 'Product not found in this order.' },
        { status: 400 }
      );
    }

    // 4. Check if user has already reviewed this product for this order
    const existingReview = await Review.findOne({ userId, productId, orderId });
    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product for this order.' },
        { status: 400 }
      );
    }

    // 5. Create review
    const newReview = await Review.create({
      productId,
      orderId,
      userId,
      username: username || 'Verified Customer',
      userAvatar: userAvatar || null,
      rating,
      comment,
      images: images || [],
      isAnonymous: !!isAnonymous,
      isFake: false,
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: newReview });
  } catch (error: any) {
    console.error('Submit customer review error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
