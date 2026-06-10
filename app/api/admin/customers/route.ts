import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { verifyPermissions } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['customers_read']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    
    // Retrieve all customer profiles, sorted by newest first
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('Fetch admin customers API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
