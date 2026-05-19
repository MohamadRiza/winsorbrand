import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Admin from '@/lib/models/Admin';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  // ✅ VERIFY AUTHENTICATION
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

    const [
      totalProducts,
      totalCustomers,
      lowStockCount,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Admin.countDocuments({ role: 'staff', isActive: true }),
      Product.countDocuments({ 
        isActive: true, 
        colorVariants: { $elemMatch: { qty: { $lte: 10, $gt: 0 } } } 
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalCustomers,
        pendingOrders: 0,
        openVacancies: 0,
        jobApplications: 0,
        newMessages: 0,
        lowStockItems: lowStockCount,
        onlineCustomers: 0,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}