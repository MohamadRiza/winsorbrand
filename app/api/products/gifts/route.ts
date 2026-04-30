// app/api/products/gifts/route.ts
// GET /api/products/gifts?category=christmas&limit=10

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const category = req.nextUrl.searchParams.get('category');
    const limit    = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10'), 10);

    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter['giftCategories'] = category;
    else filter['giftCategories'] = { $exists: true, $not: { $size: 0 } };

    const products = await Product
      .find(filter)
      .select('title modelNo price thumbnail colorVariants stickerEnabled stickerText giftCategories')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}