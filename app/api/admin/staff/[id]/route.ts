import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { verifyPermissions } from '@/lib/authHelper';

// PUT update staff account (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req);
    const { id } = await params;
    
    const isSelfUpdate = auth.authorized && auth.payload?.adminId === id;
    const isAdmin = auth.authorized && auth.payload?.role === 'admin';

    if (!isAdmin && !isSelfUpdate) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Insufficient privileges.' },
        { status: 403 }
      );
    }

    await connectDB();
    const staff = await Admin.findById(id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Prepare update payload
    const body = await req.json();
    const { username, password, isActive, isTemporary, expiresAt, permissions } = body;

    // Security check for self updates
    if (isSelfUpdate) {
      if (staff.isTemporary) {
        return NextResponse.json(
          { success: false, error: 'Temporary accounts cannot modify credentials.' },
          { status: 403 }
        );
      }
      if (isActive !== undefined || isTemporary !== undefined || expiresAt !== undefined || permissions !== undefined) {
        return NextResponse.json(
          { success: false, error: 'Access denied: Cannot modify account settings.' },
          { status: 403 }
        );
      }
    } else {
      // Admin updating staff account: prevent updating other admins
      if (staff.role !== 'staff') {
        return NextResponse.json(
          { success: false, error: 'Access denied: Cannot modify admin accounts.' },
          { status: 403 }
        );
      }
    }

    if (username) {
      // Check if username is taken by another account
      const existing = await Admin.findOne({ username: username.trim(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken.' },
          { status: 400 }
        );
      }
      staff.username = username.trim();
    }

    if (password) {
      staff.password = password; // mongoose hooks handle hashing
    }

    if (isActive !== undefined) {
      staff.isActive = !!isActive;
    }

    if (isTemporary !== undefined) {
      staff.isTemporary = !!isTemporary;
      if (!staff.isTemporary) {
        staff.expiresAt = undefined;
      }
    }

    if (isTemporary && expiresAt) {
      staff.expiresAt = new Date(expiresAt);
    }

    if (permissions) {
      staff.permissions = Array.isArray(permissions) ? permissions : [];
    }

    await staff.save();

    // Remove hashed password from output
    const staffResponse = staff.toObject();
    delete staffResponse.password;

    return NextResponse.json({ success: true, data: staffResponse });
  } catch (error: any) {
    console.error('Update staff account error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE staff account (Admin only)
export async function DELETE(
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
    
    const staff = await Admin.findOneAndDelete({ _id: id, role: 'staff' });
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff account not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Staff account deleted successfully.' });
  } catch (error: any) {
    console.error('Delete staff account error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
