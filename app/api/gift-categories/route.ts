// app/api/gift-categories/route.ts
// GET  → list all active categories
// POST → admin: create new category

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import GiftCategory from '@/lib/models/GiftCategory';

const PRESETS = [
  { slug: 'eid', label: 'Eid', emoji: '🕌', sortOrder: 1 },
  { slug: 'new-year', label: 'New Year', emoji: '🎉', sortOrder: 2 },
  { slug: 'valentines-day', label: "Valentine's Day", emoji: '💖', sortOrder: 3 },
  { slug: 'christmas', label: 'Christmas', emoji: '🎄', sortOrder: 4 },
  { slug: 'graduation', label: 'Graduation', emoji: '🎓', sortOrder: 5 },
  { slug: 'womens-day', label: "Women's Day", emoji: '👩', sortOrder: 6 },
  { slug: 'easter-sunday', label: 'Easter Sunday', emoji: '🐣', sortOrder: 7 },
  { slug: 'mothers-day', label: "Mother's Day", emoji: '👩‍👧‍👦', sortOrder: 8 },
  { slug: 'fathers-day', label: "Father's Day", emoji: '👨‍👧‍👦', sortOrder: 9 },
  { slug: 'thai-pongal', label: 'Thai Pongal', emoji: '🌾', sortOrder: 10 },
  { slug: 'sinhala-tamil-new-year', label: 'Sinhala & Tamil New Year', emoji: '🌞', sortOrder: 11 },
  { slug: 'esala-perahera', label: 'Esala Perahera', emoji: '🐘', sortOrder: 12 },
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auto-seed presets if they don't exist
    for (const preset of PRESETS) {
      const exists = await GiftCategory.findOne({ slug: preset.slug });
      if (!exists) {
        await GiftCategory.create({
          slug: preset.slug,
          label: preset.label,
          emoji: preset.emoji,
          sortOrder: preset.sortOrder,
          isActive: true,
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';

    const filter = showAll ? {} : { isActive: true };

    const categories = await GiftCategory
      .find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { verifyPermissions } = await import('@/lib/authHelper');
    const auth = await verifyPermissions(req, ['categories_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

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