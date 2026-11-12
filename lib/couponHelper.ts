import jwt from 'jsonwebtoken';
import Coupon from '@/lib/models/Coupon';

export interface CouponTokenPayload {
  code: string;
  discountPercent: number;
  clerkId: string | null;
  type: 'coupon_validation';
}

export type OrderCouponResult =
  | {
      ok: true;
      appliedCouponCode: string | null;
      couponDiscountPercent: number;
      couponDiscountAmount: number;
      finalTotal: number;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

const getCouponSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
};

/** Normalize user-entered coupon input to uppercase alphanumeric, max 8 chars. */
export function sanitizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

/** Sign a short-lived coupon validation JWT for signed-in (clerkId) or guest (null) checkout. */
export function signCouponToken(payload: {
  code: string;
  discountPercent: number;
  clerkId: string | null;
}): string {
  return jwt.sign(
    { ...payload, type: 'coupon_validation' },
    getCouponSecret(),
    { expiresIn: '30m' }
  );
}

/** Verify a coupon validation JWT and ensure expected payload structure. */
export function verifyCouponToken(token: string): CouponTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getCouponSecret()) as Partial<CouponTokenPayload>;
    if (
      !decoded ||
      decoded.type !== 'coupon_validation' ||
      typeof decoded.code !== 'string' ||
      typeof decoded.discountPercent !== 'number'
    ) {
      return null;
    }
    return {
      code: decoded.code,
      discountPercent: decoded.discountPercent,
      clerkId: typeof decoded.clerkId === 'string' ? decoded.clerkId : null,
      type: 'coupon_validation',
    };
  } catch {
    return null;
  }
}

type CouponVerificationResult =
  | {
      ok: true;
      couponId: string | null;
      appliedCouponCode: string | null;
      couponDiscountPercent: number;
      couponDiscountAmount: number;
      finalTotal: number;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

/**
 * Shared read-only coupon check: verifies JWT token, ownership, active status, expiry, and usage limit.
 */
async function verifyCouponEligibility(params: {
  couponCode?: unknown;
  validationToken?: unknown;
  subtotal: number;
  expectedClerkId: string | null;
}): Promise<CouponVerificationResult> {
  const { couponCode, validationToken, subtotal, expectedClerkId } = params;

  if (!couponCode && !validationToken) {
    return {
      ok: true,
      couponId: null,
      appliedCouponCode: null,
      couponDiscountPercent: 0,
      couponDiscountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (typeof couponCode !== 'string' || typeof validationToken !== 'string') {
    return {
      ok: false,
      status: 400,
      error: 'Invalid or incomplete coupon validation. Please re-apply your coupon.',
    };
  }

  const tokenPayload = verifyCouponToken(validationToken);
  if (!tokenPayload) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid or expired coupon validation. Please re-apply your coupon.',
    };
  }

  // Prevent using another user's coupon token; allow guest tokens if customer signs in at checkout
  const ownershipValid = expectedClerkId === null
    ? tokenPayload.clerkId === null
    : tokenPayload.clerkId === expectedClerkId || tokenPayload.clerkId === null;

  if (!ownershipValid) {
    return {
      ok: false,
      status: 403,
      error: 'Coupon validation mismatch. Please re-apply your coupon.',
    };
  }

  const submittedCode = sanitizeCouponCode(couponCode);
  if (!submittedCode || tokenPayload.code !== submittedCode) {
    return {
      ok: false,
      status: 400,
      error: 'Coupon code mismatch. Please re-apply your coupon.',
    };
  }

  const now = new Date();
  const coupon = await Coupon.findOne({
    code: submittedCode,
    isActive: true,
    expiresAt: { $gt: now },
  });

  if (!coupon) {
    return {
      ok: false,
      status: 410,
      error: 'This coupon has expired or been deactivated. Please proceed without it.',
    };
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return {
      ok: false,
      status: 409,
      error: 'This coupon has reached its usage limit.',
    };
  }

  const couponDiscountPercent = coupon.discountPercent;
  const couponDiscountAmount = Math.round((subtotal * couponDiscountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - couponDiscountAmount);

  return {
    ok: true,
    couponId: coupon._id.toString(),
    appliedCouponCode: coupon.code,
    couponDiscountPercent,
    couponDiscountAmount,
    finalTotal,
  };
}

/**
 * Preview and price a coupon without incrementing usageCount (for redirect-based checkouts).
 */
export async function previewCouponForOrder(params: {
  couponCode?: unknown;
  validationToken?: unknown;
  subtotal: number;
  expectedClerkId: string | null;
}): Promise<OrderCouponResult> {
  const check = await verifyCouponEligibility(params);
  if (!check.ok) return check;
  return {
    ok: true,
    appliedCouponCode: check.appliedCouponCode,
    couponDiscountPercent: check.couponDiscountPercent,
    couponDiscountAmount: check.couponDiscountAmount,
    finalTotal: check.finalTotal,
  };
}

/**
 * Atomically increment usageCount for an already-applied coupon code during order fulfillment.
 */
export async function consumeVerifiedCouponCode(couponCode: string): Promise<boolean> {
  const cleanCode = sanitizeCouponCode(couponCode);
  if (!cleanCode) return false;
  const updated = await Coupon.findOneAndUpdate(
    {
      code: cleanCode,
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
      ],
    } as any,
    { $inc: { usageCount: 1 } },
    { new: true }
  );
  return !!updated;
}

/**
 * Re-verify coupon token + live MongoDB state and atomically consume one coupon usage.
 * Call BEFORE decrementing product stock so rejected coupons never leak inventory.
 */
export async function validateAndConsumeCouponForOrder(params: {
  couponCode?: unknown;
  validationToken?: unknown;
  subtotal: number;
  expectedClerkId: string | null;
}): Promise<OrderCouponResult> {
  const check = await verifyCouponEligibility(params);
  if (!check.ok) return check;

  if (!check.couponId) {
    return {
      ok: true,
      appliedCouponCode: null,
      couponDiscountPercent: 0,
      couponDiscountAmount: 0,
      finalTotal: check.finalTotal,
    };
  }

  // Atomic check-and-increment guard against concurrent redemptions
  const updatedCoupon = await Coupon.findOneAndUpdate(
    {
      _id: check.couponId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
      ],
    } as any,
    { $inc: { usageCount: 1 } },
    { new: true }
  );

  if (!updatedCoupon) {
    return {
      ok: false,
      status: 409,
      error: 'This coupon has reached its usage limit or expired.',
    };
  }

  const couponDiscountPercent = updatedCoupon.discountPercent;
  const couponDiscountAmount = Math.round((params.subtotal * couponDiscountPercent) / 100);
  const finalTotal = Math.max(0, params.subtotal - couponDiscountAmount);

  return {
    ok: true,
    appliedCouponCode: updatedCoupon.code,
    couponDiscountPercent,
    couponDiscountAmount,
    finalTotal,
  };
}
