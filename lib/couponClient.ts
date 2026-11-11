export interface ClientCouponResult {
  code: string;
  discountPercent: number;
  expiresAt?: string;
  validationToken: string;
}

/** Normalize interactive or pasted coupon text to uppercase alphanumeric, max 8 chars. */
export function normalizeCouponInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

/** Compute rounded discount amount and non-negative final total from a subtotal. */
export function computeCouponTotals(
  subtotal: number,
  discountPercent?: number | null
): { discountAmount: number; finalTotal: number } {
  const pct = typeof discountPercent === 'number' && discountPercent > 0 ? discountPercent : 0;
  const discountAmount = Math.round((subtotal * pct) / 100);
  return {
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
  };
}

/** Validate a coupon code against the API for either signed-in or guest checkout. */
export async function validateCouponCodeRequest(
  rawCode: string,
  clerkId?: string | null
): Promise<{ ok: true; data: ClientCouponResult } | { ok: false; error: string }> {
  const code = normalizeCouponInput(rawCode.trim());
  if (!code) {
    return { ok: false, error: 'Please enter a coupon code' };
  }

  try {
    const res = await fetch('/api/customer/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, clerkId: clerkId || null }),
    });

    const rawText = await res.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (res.ok && data?.success && data?.data) {
      return { ok: true, data: data.data as ClientCouponResult };
    }

    return {
      ok: false,
      error: data?.error || 'This coupon code is invalid or has expired',
    };
  } catch {
    return {
      ok: false,
      error: 'Failed to validate coupon. Please try again.',
    };
  }
}
