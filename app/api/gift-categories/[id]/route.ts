// app/api/gift-categories/[id]/route.ts
// DELETE → admin: soft-delete (sets isActive: false — products stay intact)
// PUT    → admin: update label/emoji/sortOrder/isActive
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import GiftCategory from '@/lib/models/GiftCategory';
import { verifyPermissions } from '@/lib/authHelper';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyPermissions(req, ['categories_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const category = await GiftCategory.findByIdAndUpdate(
      id, body, { new: true, runValidators: true }
    );
    if (!category) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyPermissions(req, ['categories_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const category = await GiftCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!category) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Gift category hidden. Products remain intact.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}