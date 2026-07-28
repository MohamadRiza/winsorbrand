// app/api/reviews/ratings/route.ts
// GET /api/reviews/ratings?ids=id1,id2,id3
// Returns average rating and review count for each product

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const idsParam = req.nextUrl.searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ success: false, error: 'No product IDs provided' }, { status: 400 });
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Aggregate average rating and count per product in one DB query
    const agg = await Review.aggregate([
      {
        $match: {
          productId: { $in: ids.map(id => {
            try {
              const mongoose = require('mongoose');
              return new mongoose.Types.ObjectId(id);
            } catch {
              return id;
            }
          })},
          status: 'approved',
        }
      },
      {
        $group: {
          _id: { $toString: '$productId' },
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        }
      }
    ]);

    // Build a map: productId -> { averageRating, reviewCount }
    const ratingsMap: Record<string, { averageRating: number; reviewCount: number }> = {};
    for (const item of agg) {
      ratingsMap[item._id] = {
        averageRating: Math.round(item.averageRating * 10) / 10,
        reviewCount: item.reviewCount,
      };
    }

    return NextResponse.json({ success: true, data: ratingsMap });
  } catch (error: any) {
    console.error('Bulk ratings fetch error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
