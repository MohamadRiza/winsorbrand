import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import InventorySettings from '@/lib/models/InventorySettings';
import { verifyPermissions } from '@/lib/authHelper';

// GET all products and their stock details for Inventory (Admin / Staff with permission)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['inventory_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Fetch products sorted by name/createdAt, only active products
    const products = await Product.find({ isActive: true })
      .select('title modelNo thumbnail colorVariants isSoldOut createdAt')
      .sort({ title: 1 })
      .lean();

    // Fetch settings to know thresholds on client side
    let settings = await InventorySettings.findOne();
    if (!settings) {
      settings = await InventorySettings.create({
        lowStockThreshold: 10,
        outOfStockThreshold: 0,
        alertNotificationsEnabled: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: products,
      settings: settings
    });
  } catch (error: any) {
    console.error('Fetch inventory admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
