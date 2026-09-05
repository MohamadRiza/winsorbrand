// app/api/admin/coupons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { verifyPermissions } from '@/lib/authHelper';

// ─── PATCH /api/admin/coupons/[id] — Toggle active/update ────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['coupons_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const { isActive, adminPassword } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isActive must be a boolean' }, { status: 400 });
    }

    const existing = await Coupon.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    // High discount security check when activating a coupon with > 10% discount
    if (isActive && existing.discountPercent > 10) {
      if (!adminPassword || typeof adminPassword !== 'string' || !adminPassword.trim()) {
        return NextResponse.json({
          success: false,
          error: 'Admin password is required to activate a coupon with discount exceeding 10%',
          requiresPassword: true,
        }, { status: 400 });
      }

      const Admin = (await import('@/lib/models/Admin')).default;
      let isPasswordValid = false;

      const currentUser = await Admin.findById(auth.payload!.adminId).select('+password');
      if (currentUser && typeof currentUser.comparePassword === 'function') {
        isPasswordValid = await currentUser.comparePassword(adminPassword);
      }

      if (!isPasswordValid) {
        const adminAccounts = await Admin.find({ role: 'admin', isActive: true }).select('+password');
        for (const adm of adminAccounts) {
          if (typeof adm.comparePassword === 'function' && await adm.comparePassword(adminPassword)) {
            isPasswordValid = true;
            break;
          }
        }
      }

      if (!isPasswordValid) {
        return NextResponse.json({
          success: false,
          error: 'Incorrect admin password. Authorization failed to activate this coupon.',
          requiresPassword: true,
        }, { status: 403 });
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    return NextResponse.json({ success: true, data: coupon });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

// ─── DELETE /api/admin/coupons/[id] — Delete coupon ──────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['coupons_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    await connectDB();

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
