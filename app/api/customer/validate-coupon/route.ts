// app/api/customer/validate-coupon/route.ts
//
// SECURITY DESIGN:
// 1. Rate-limited: max 5 attempts per IP per 2 minutes (brute-force protection)
// 2. Server-side validation only — discount percent never trusted from client
// 3. Returns a short-lived signed JWT (10 min) containing the validated discount
// 4. JWT is verified again at checkout (order creation) before discount is applied
// 5. JWT contains clerkId so it cannot be reused by a different user
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { getAuth } from '@clerk/nextjs/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import jwt from 'jsonwebtoken';

// ── Rate limiter: 5 attempts per IP per 2 minutes ────────────
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 120, // seconds
});

const getCouponSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET not configured');
  return secret;
};

// Sign a short-lived validation token (10 minutes)
export function signCouponToken(payload: {
  code: string;
  discountPercent: number;
  clerkId: string;
}): string {
  return jwt.sign(
    { ...payload, type: 'coupon_validation' },
    getCouponSecret(),
    { expiresIn: '10m' }
  );
}

// Verify a coupon validation token — used by orders route
export function verifyCouponToken(token: string): {
  code: string;
  discountPercent: number;
  clerkId: string;
  type: string;
} | null {
  try {
    const payload = jwt.verify(token, getCouponSecret()) as any;
    if (payload?.type !== 'coupon_validation') return null;
    return payload;
  } catch {
    return null;
  }
}

// ── POST /api/customer/validate-coupon ────────────────────────
export async function POST(req: NextRequest) {
  // ① Customer must be signed in
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Please sign in to apply a coupon' }, { status: 401 });
  }

  // ② Rate limiting by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

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

  // Sanitize: uppercase, alphanumeric only, max 8 chars
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (code.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code format' }, { status: 400 });
  }

  // ④ DB lookup — single query with all guard conditions
  try {
    await connectDB();

    const now = new Date();
    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: now },
    }).lean();

    // Generic error — do NOT reveal whether code exists to prevent enumeration
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'This coupon code is invalid or has expired' },
        { status: 404 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'This coupon code has reached its maximum usage limit' },
        { status: 409 }
      );
    }

    // ⑤ Issue signed validation token (10 minutes)
    const validationToken = signCouponToken({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      clerkId: userId,
    });

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        expiresAt: coupon.expiresAt,
        validationToken, // client passes this back on checkout
      },
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
