import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import { verifyPermissions } from '@/lib/authHelper';

// GET: List all reviews (with filters for fake vs real)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['products_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'all' | 'real' | 'fake'

    const filter: any = {};
    if (type === 'real') {
      filter.isFake = false;
    } else if (type === 'fake') {
      filter.isFake = true;
    }

    const reviews = await Review.find(filter)
      .populate({
        path: 'productId',
        select: 'title modelNo thumbnail',
        model: Product,
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('Admin fetch reviews error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// POST: Create a fake/mock review
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['products_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { productId, rating, comment, username, userAvatar, images, isAnonymous, createdAt } = body;

    if (!productId || rating === undefined || !comment || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing required mock review fields' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 400 });
    }

    const reviewObj: any = {
      productId,
      userId: 'admin_mock_user',
      username,
      userAvatar: userAvatar || null,
      rating,
      comment,
      images: images || [],
      isAnonymous: !!isAnonymous,
      isFake: true,
      status: 'approved', // Fake reviews are automatically approved
    };

    if (createdAt) {
      reviewObj.createdAt = new Date(createdAt);
    }

    const newReview = await Review.create(reviewObj);

    return NextResponse.json({ success: true, data: newReview });
  } catch (error: any) {
    console.error('Admin create mock review error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// PUT: Approve / reject customer reviews
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['products_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { reviewId, status } = body;

    if (!reviewId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Review ID and valid status (approved/rejected) are required' },
        { status: 400 }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!updatedReview) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedReview });
  } catch (error: any) {
    console.error('Admin update review status error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a review (fake or real)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['products_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete review error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
