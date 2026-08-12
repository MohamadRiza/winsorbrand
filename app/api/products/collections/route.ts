// app/api/products/collections/route.ts
// GET /api/products/collections?section=sports&limit=10
// Returns products filtered by section flag (showOnHome must be true)

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

export type CollectionSection = 'sports' | 'new' | 'luxury' | 'limited' | 'bestsellers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const section = req.nextUrl.searchParams.get('section') as CollectionSection | null;
    const limit   = parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10);

    let filter: Record<string, unknown> = { isActive: true };

    if (section) {
      filter['$or'] = [
        { collectionSections: section },
        { stickerText: new RegExp(section, 'i') },
        { title: new RegExp(section, 'i') },
        { description: new RegExp(section, 'i') }
      ];
    }

    let products = await Product
      .find(filter)
      .select('title modelNo price thumbnail colorVariants stickerEnabled stickerText collectionSections images specifications description')
      .limit(Math.min(limit, 10))
      .sort({ createdAt: -1 })
      .lean();

    if (products.length === 0) {
      products = await Product
        .find({ isActive: true })
        .select('title modelNo price thumbnail colorVariants stickerEnabled stickerText collectionSections images specifications description')
        .limit(Math.min(limit, 10))
        .sort({ createdAt: -1 })
        .lean();
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}