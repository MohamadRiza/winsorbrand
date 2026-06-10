import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { verifyPermissions } from '@/lib/authHelper';

// GET all staff accounts (Admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req);
    // Explicitly restrict to role: 'admin'
    if (!auth.authorized || auth.payload?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const staffAccounts = await Admin.find({ role: 'staff' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: staffAccounts });
  } catch (error: any) {
    console.error('Fetch staff accounts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// POST create new staff account (Admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req);
    if (!auth.authorized || auth.payload?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { username, password, isTemporary, expiresAt, permissions } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await Admin.findOne({ username: username.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists.' },
        { status: 400 }
      );
    }

    const newStaff = await Admin.create({
      username: username.trim(),
      password,
      role: 'staff',
      isActive: true,
      isTemporary: !!isTemporary,
      expiresAt: isTemporary && expiresAt ? new Date(expiresAt) : undefined,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    // Don't return the hashed password
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    return NextResponse.json({ success: true, data: staffResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Create staff account error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
