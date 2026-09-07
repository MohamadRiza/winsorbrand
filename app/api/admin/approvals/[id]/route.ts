import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PendingApproval from '@/lib/models/PendingApproval';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { verifyPermissions } from '@/lib/authHelper';

// POST /api/admin/approvals/[id]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req);
    if (!auth.authorized || auth.payload?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const pending = await PendingApproval.findById(id);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: 'Pending approval record not found.' },
        { status: 404 }
      );
    }

    if (pending.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This submission has already been ${pending.status}.` },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      pending.status = 'rejected';
      pending.rejectionReason = rejectionReason || null;
      pending.reviewedBy = auth.payload?.adminId as any;
      pending.reviewedAt = new Date();
      await pending.save();
      return NextResponse.json({ success: true, message: 'Submission rejected.', data: pending });
    }

    // APPROVE: replay the stored payload
    let result: any = null;

    if (pending.actionType === 'product_create') {
      result = await Product.create(pending.payload);

    } else if (pending.actionType === 'product_update') {
      if (!pending.targetId) {
        return NextResponse.json({ success: false, error: 'Missing target product ID for update.' }, { status: 400 });
      }
      result = await Product.findByIdAndUpdate(
        pending.targetId,
        pending.payload,
        { new: true, runValidators: true }
      );
      if (!result) {
        return NextResponse.json({ success: false, error: 'Target product not found.' }, { status: 404 });
      }

    } else if (pending.actionType === 'fake_review_create') {
      const { productId, rating, comment, username: reviewUsername, userAvatar, images, isAnonymous, createdAt } = pending.payload;
      const reviewObj: any = {
        productId,
        userId: 'admin_mock_user',
        username: reviewUsername,
        userAvatar: userAvatar || null,
        rating,
        comment,
        images: images || [],
        isAnonymous: !!isAnonymous,
        isFake: true,
        status: 'approved',
      };
      if (createdAt) reviewObj.createdAt = new Date(createdAt);
      result = await Review.create(reviewObj);

    } else {
      return NextResponse.json(
        { success: false, error: `Unknown action type: ${pending.actionType}` },
        { status: 400 }
      );
    }

    pending.status = 'approved';
    pending.reviewedBy = auth.payload?.adminId as any;
    pending.reviewedAt = new Date();
    await pending.save();

    return NextResponse.json({
      success: true,
      message: 'Submission approved and published successfully.',
      data: { approval: pending, result },
    });
  } catch (error: any) {
    console.error('Approval action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}