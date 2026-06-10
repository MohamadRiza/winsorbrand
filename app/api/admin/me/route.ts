import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('admin_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyAccessToken(accessToken);
  
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await Admin.findById(payload.adminId);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
    }

    // Expiry check for temporary staff
    if (user.role === 'staff' && user.isTemporary && user.expiresAt && new Date(user.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Staff account has expired', expired: true }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      adminId: user._id.toString(),
      permissions: user.permissions || [],
      isTemporary: user.isTemporary,
      expiresAt: user.expiresAt,
    });
  } catch (error: any) {
    console.error('Fetch profile me API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}