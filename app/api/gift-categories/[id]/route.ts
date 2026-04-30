// app/api/gift-categories/[id]/route.ts
// DELETE → admin: soft-delete (sets isActive: false — products stay intact)
// PUT    → admin: update label/emoji/sortOrder/isActive

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import GiftCategory from '@/lib/models/GiftCategory';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const category = await GiftCategory.findByIdAndUpdate(
      params.id, body, { new: true, runValidators: true }
    );
    if (!category) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    // Soft-delete: set isActive false so products are NOT deleted
    const category = await GiftCategory.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Gift category hidden. Products remain intact.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}