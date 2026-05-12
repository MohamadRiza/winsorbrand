// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Admin from '@/lib/models/Admin';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const [totalProducts, totalCustomers, totalOrders] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Admin.countDocuments({ isActive: true }),
      // TODO: Replace with actual Order model when created
      Promise.resolve(0),
    ]);

    // Calculate revenue (placeholder - replace with actual calculation)
    const revenue = 0; // TODO: Calculate from orders

    return NextResponse.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      revenue,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}