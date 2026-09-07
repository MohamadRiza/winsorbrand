import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PendingApproval from '@/lib/models/PendingApproval';
import { verifyPermissions } from '@/lib/authHelper';

// GET /api/admin/approvals  — list all approvals (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req);
    if (!auth.authorized || auth.payload?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const validStatuses = ['pending', 'approved', 'rejected', 'all'];
    const filter = validStatuses.includes(status) && status !== 'all' ? { status } : {};

    const approvals = await PendingApproval.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = await PendingApproval.countDocuments({ status: 'pending' });

    return NextResponse.json({
      success: true,
      data: approvals,
      pendingCount,
    });
  } catch (error: any) {
    console.error('Fetch approvals error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
