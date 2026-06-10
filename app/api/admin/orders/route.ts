import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyPermissions } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['orders_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    
    // Fetch all orders in the system, sorted by newest first
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Admin fetch orders error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
