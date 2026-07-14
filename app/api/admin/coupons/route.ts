// app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { verifyPermissions } from '@/lib/authHelper';

// ─── GET /api/admin/coupons — List all coupons ───────────────
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: coupons });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

// ─── POST /api/admin/coupons — Create a new coupon ───────────
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    const body = await req.json();
    const { code, discountPercent, expiresAt, usageLimit } = body;

    // ── Server-side validation ────────────────────────────────
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
    }

    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (sanitizedCode.length === 0 || sanitizedCode.length > 8) {
      return NextResponse.json({ success: false, error: 'Code must be 1–8 alphanumeric characters' }, { status: 400 });
    }

    if (!discountPercent || typeof discountPercent !== 'number' || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ success: false, error: 'Discount must be between 1% and 100%' }, { status: 400 });
    }

    if (!expiresAt) {
      return NextResponse.json({ success: false, error: 'Expiry date is required' }, { status: 400 });
    }

    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime()) || expiry <= new Date()) {
      return NextResponse.json({ success: false, error: 'Expiry date must be a valid future date' }, { status: 400 });
    }

    if (usageLimit !== null && usageLimit !== undefined) {
      if (typeof usageLimit !== 'number' || usageLimit < 1 || !Number.isInteger(usageLimit)) {
        return NextResponse.json({ success: false, error: 'Usage limit must be a positive integer' }, { status: 400 });
      }
    }

    // ── Duplicate check ──────────────────────────────────────
    const existing = await Coupon.findOne({ code: sanitizedCode });
    if (existing) {
      return NextResponse.json({ success: false, error: `Coupon code "${sanitizedCode}" already exists` }, { status: 409 });
    }

    // ── Create ───────────────────────────────────────────────
    const coupon = await Coupon.create({
      code: sanitizedCode,
      discountPercent: Math.round(discountPercent),
      expiresAt: expiry,
      usageLimit: usageLimit ?? null,
      createdBy: auth.payload!.adminId,
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'That coupon code already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
