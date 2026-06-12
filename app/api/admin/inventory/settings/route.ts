import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import InventorySettings from '@/lib/models/InventorySettings';
import { verifyPermissions } from '@/lib/authHelper';

// GET Inventory Settings (Admin / Staff with permission)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['inventory_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    
    // Find or create default settings
    let settings = await InventorySettings.findOne();
    if (!settings) {
      settings = await InventorySettings.create({
        lowStockThreshold: 10,
        outOfStockThreshold: 0,
        alertNotificationsEnabled: true,
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Fetch inventory settings API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// PUT Update Inventory Settings (Admin / Staff with permission)
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['inventory_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { lowStockThreshold, outOfStockThreshold, alertNotificationsEnabled } = body;

    // Validation
    if (lowStockThreshold === undefined || outOfStockThreshold === undefined || alertNotificationsEnabled === undefined) {
      return NextResponse.json(
        { success: false, error: 'All settings fields are required.' },
        { status: 400 }
      );
    }

    const lowStock = Number(lowStockThreshold);
    const outOfStock = Number(outOfStockThreshold);

    if (isNaN(lowStock) || lowStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Low stock threshold must be a non-negative number.' },
        { status: 400 }
      );
    }

    if (isNaN(outOfStock) || outOfStock < 0 || outOfStock > 5) {
      return NextResponse.json(
        { success: false, error: 'Out of stock threshold must be a number between 0 and 5.' },
        { status: 400 }
      );
    }

    if (lowStock <= outOfStock) {
      return NextResponse.json(
        { success: false, error: 'Low stock threshold must be greater than out of stock threshold.' },
        { status: 400 }
      );
    }

    // Find or create default settings, then update
    let settings = await InventorySettings.findOne();
    if (!settings) {
      settings = new InventorySettings();
    }

    settings.lowStockThreshold = lowStock;
    settings.outOfStockThreshold = outOfStock;
    settings.alertNotificationsEnabled = !!alertNotificationsEnabled;
    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Update inventory settings API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
