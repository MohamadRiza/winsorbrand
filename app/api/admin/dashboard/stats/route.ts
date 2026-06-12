import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Admin from '@/lib/models/Admin';
import Vacancy from '@/lib/models/Vacancy';
import JobApplication from '@/lib/models/JobApplication';
import InventorySettings from '@/lib/models/InventorySettings';
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

    // Load Inventory settings for dynamic thresholds
    let settings = await InventorySettings.findOne();
    if (!settings) {
      settings = await InventorySettings.create({
        lowStockThreshold: 10,
        outOfStockThreshold: 0,
        alertNotificationsEnabled: true,
      });
    }

    const [
      totalProducts,
      totalCustomers,
      lowStockCount,
      openVacanciesCount,
      pendingApplicationsCount,
      hasLowStockOrOutOfStock,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Admin.countDocuments({ role: 'staff', isActive: true }),
      Product.countDocuments({ 
        isActive: true, 
        colorVariants: { 
          $elemMatch: { 
            qty: { 
              $lte: settings.lowStockThreshold, 
              $gt: settings.outOfStockThreshold 
            } 
          } 
        } 
      }),
      Vacancy.countDocuments({ status: 'active' }),
      JobApplication.countDocuments({ status: 'pending' }),
      Product.exists({
        isActive: true,
        colorVariants: {
          $elemMatch: {
            qty: { $lte: settings.lowStockThreshold }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalCustomers,
        pendingOrders: 0,
        openVacancies: openVacanciesCount,
        jobApplications: pendingApplicationsCount,
        newMessages: 0,
        lowStockItems: lowStockCount,
        onlineCustomers: 0,
        lastUpdated: new Date().toISOString(),
        alertNotificationsEnabled: settings.alertNotificationsEnabled,
        hasLowStockOrOutOfStock: !!hasLowStockOrOutOfStock,
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