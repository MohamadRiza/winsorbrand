// app/api/customer/validate-coupon/route.ts
//
// SECURITY DESIGN:
// 1. Rate-limited: max 15 attempts per IP per 2 minutes (brute-force protection)
// 2. Accessible to both signed-in patrons and guest shoppers
// 3. Server-side validation only — discount percent never trusted from client
// 4. Returns a short-lived signed JWT (30 min) containing the validated discount
// 5. JWT + live DB rules are verified again at checkout before stock decrement
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { getVerifiedClerkUserId } from '@/lib/clerkAuth';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { sanitizeCouponCode, signCouponToken } from '@/lib/couponHelper';

// ── Rate limiter: 15 attempts per IP per 2 minutes ──────────────────────────
const rateLimiter = new RateLimiterMemory({
  points: 15,
  duration: 120,
});

export async function POST(req: NextRequest) {
  // ① Resolve authenticated user if signed in (guests are also permitted)
  const authUserId = await getVerifiedClerkUserId(req);

  // ② Rate limiting by IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  try {
    await rateLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Please wait 2 minutes before trying again.' },
      { status: 429 }
    );
  }

  // ③ Parse and sanitize input
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const rawCode = body?.code;
  if (!rawCode || typeof rawCode !== 'string') {
    return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
  }

  const code = sanitizeCouponCode(rawCode);
  if (code.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code format' }, { status: 400 });
  }

  const fallbackClerkId =
    typeof body?.clerkId === 'string' && body.clerkId.trim().length > 0
      ? body.clerkId.trim()
      : null;
  const resolvedUserId = authUserId || fallbackClerkId;

  // ④ DB lookup — single query with all guard conditions
  try {
    await connectDB();

    const now = new Date();
    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: now },
    }).lean();

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'This coupon code is invalid or has expired' },
        { status: 404 }
      );
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'This coupon code has reached its maximum usage limit' },
        { status: 409 }
      );
    }

    // ⑤ Issue signed validation token (30 minutes)
    const validationToken = signCouponToken({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      clerkId: resolvedUserId,
    });

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        expiresAt: coupon.expiresAt,
        validationToken,
        isGuest: !resolvedUserId,
      },
    });
  } catch (error: any) {
    console.error('[validate-coupon] Error validating coupon:', error);
    return NextResponse.json({ success: false, error: 'Server error validating coupon' }, { status: 500 });
  }
}
