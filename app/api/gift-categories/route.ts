// app/api/gift-categories/route.ts
// GET  → list all active categories
// POST → admin: create new category

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import GiftCategory from '@/lib/models/GiftCategory';

export async function GET() {
  try {
    await connectDB();
    const categories = await GiftCategory
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const slug = body.label
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const existing = await GiftCategory.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      );
    }
    const category = await GiftCategory.create({ ...body, slug });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}