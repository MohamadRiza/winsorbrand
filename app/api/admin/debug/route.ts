// app/api/admin/debug/route.ts - TEMPORARY DEBUG ENDPOINT
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';

// 🔐 DELETE THIS FILE AFTER DEBUGGING!
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  try {
    await connectDB();
    
    // Fetch admin WITH password field for debugging
    const admin = await Admin.findOne({ username: 'admin' }).select('+password');
    
    if (!admin) {
      return NextResponse.json({ 
        error: 'No admin found',
        hint: 'Run seed script again'
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        isActive: admin.isActive,
        // Show first 30 chars of hashed password to verify it's hashed
        passwordPreview: admin.password?.substring(0, 30) + '...',
        passwordIsHashed: admin.password?.startsWith('$2a$') || admin.password?.startsWith('$2b$')
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}