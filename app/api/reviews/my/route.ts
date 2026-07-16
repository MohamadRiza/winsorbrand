import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product'; // Register Product model for populate

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

    // Fetch reviews created by this user and populate product data
    const reviews = await Review.find({ userId })
      .populate({
        path: 'productId',
        select: 'title modelNo thumbnail',
        model: Product,
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('Fetch my reviews API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
