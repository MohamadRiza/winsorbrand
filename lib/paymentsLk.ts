import crypto from 'node:crypto';
import https from 'node:https';
import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import type { CheckoutSource } from '@/types';

if (typeof window !== 'undefined') {
  throw new Error('lib/paymentsLk must only be imported on the server.');
}

const PAYMENTS_LK_API_HOST = 'api.payments.lk';
const PAYMENTS_LK_TIMEOUT_MS = 15_000;
const PAYMENTS_LK_MAX_RETRIES = 2;

export type PaymentsLkMode = 'test' | 'live';

export interface PaymentsLkCheckoutLine {
  id: string;
  name: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
}

export interface PaymentsLkPayment {
  object: 'payment';
  id: string;
  mode: PaymentsLkMode;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'failed' | 'canceled' | string;
  amountCents: number;
  currency: 'LKR' | 'USD' | 'GBP' | 'EUR' | string;
  description: string | null;
  reference: string | null;
  customer: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  card: {
    scheme?: string | null;
    last4?: string | null;
  } | null;
  feeCents: number | null;
  netCents: number | null;
  refundedCents?: number | null;
  failureMessage: string | null;
  checkoutId: string | null;
  createdAt: string;
  succeededAt: string | null;
  failure: {
    code: string | null;
    message: string | null;
    reason: string | null;
  } | null;
}

export interface PaymentsLkCheckout {
  object: 'checkout';
  id: string;
  mode: PaymentsLkMode;
  status: 'open' | 'completed' | 'expired' | string;
  url: string;
  expiresAt: string;
  payment: PaymentsLkPayment;
}

export interface PaymentsLkWebhookEvent {
  id: string;
  object: 'event';
  type:
    | 'payment.succeeded'
    | 'payment.failed'
    | 'checkout.expired'
    | 'card.saved'
    | 'card.save_failed'
    | 'refund.succeeded'
    | 'refund.failed'
    | string;
  mode: PaymentsLkMode;
  created: string;
  data: any;
}

export class PaymentsLkApiError extends Error {
  status: number;
  code: string;
  reason: string | null;
  traceId: string | null;
  fields: Array<{ path?: string; message?: string }>;

  constructor(params: {
    status: number;
    message: string;
    code?: string;
    reason?: string | null;
    traceId?: string | null;
    fields?: Array<{ path?: string; message?: string }>;
  }) {
    super(params.message);
    this.name = 'PaymentsLkApiError';
    this.status = params.status;
    this.code = params.code || 'PAYMENTS_LK_ERROR';
    this.reason = params.reason || null;
    this.traceId = params.traceId || null;
    this.fields = params.fields || [];
  }
}

export function getPaymentsLkSecretKey(): { secretKey: string; mode: PaymentsLkMode } {
  const secretKey = (process.env.PAYMENTS_LK_SECRET_KEY || '').trim();
  if (!secretKey || (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
    throw new Error('PAYMENTS_LK_SECRET_KEY is not properly configured on the server.');
  }
  return {
    secretKey,
    mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
  };
}

export function getPaymentsLkMode(): PaymentsLkMode {
  return getPaymentsLkSecretKey().mode;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendHttpsRequest(params: {
  method: 'GET' | 'POST';
  path: string;
  headers: Record<string, string>;
  body?: string;
  family?: 4 | 6;
}): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: PAYMENTS_LK_API_HOST,
        port: 443,
        path: params.path,
        method: params.method,
        ...(params.family ? { family: params.family } : {}),
        headers: params.headers,
        timeout: PAYMENTS_LK_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Payments.lk API timeout after ${PAYMENTS_LK_TIMEOUT_MS}ms`));
    });
    req.on('error', reject);
    if (params.body) req.write(params.body);
    req.end();
  });
}

async function paymentsLkRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  options?: {
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  }
): Promise<T> {
  const { secretKey } = getPaymentsLkSecretKey();
  const payload = options?.body ? JSON.stringify(options.body) : undefined;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    Accept: 'application/json',
    'User-Agent': 'winsorbrand-nextjs/1.0',
  };

  if (payload) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload).toString();
  }
  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= PAYMENTS_LK_MAX_RETRIES; attempt++) {
    try {
      // Force IPv4 first because Cloudflare IPv6 routes stall on some hosts; retry default lookup if needed
      let res;
      try {
        res = await sendHttpsRequest({ method, path, headers, body: payload, family: 4 });
      } catch (err: any) {
        if (err?.code === 'ENOTFOUND' || err?.code === 'EAI_NONAME') {
          res = await sendHttpsRequest({ method, path, headers, body: payload });
        } else {
          throw err;
        }
      }

      let parsed: any = null;
      try {
        parsed = res.body ? JSON.parse(res.body) : null;
      } catch {
        parsed = null;
      }

      if (res.status >= 200 && res.status < 300 && parsed) {
        return parsed as T;
      }

      const retryable = res.status === 429 || (res.status >= 500 && res.status < 600);
      if (retryable && attempt < PAYMENTS_LK_MAX_RETRIES) {
        const retryAfterRaw = res.headers['retry-after'];
        const retryAfterSec = typeof retryAfterRaw === 'string' ? Number(retryAfterRaw) : NaN;
        const delayMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? Math.min(retryAfterSec * 1000, 5000)
          : 400 * (attempt + 1);
        await sleep(delayMs);
        continue;
      }

      const apiErr = parsed?.error || parsed || {};
      const errMsg =
        apiErr.message ||
        parsed?.message ||
        `Payments.lk returned HTTP ${res.status}`;

      throw new PaymentsLkApiError({
        status: res.status,
        message: errMsg,
        code: apiErr.code || parsed?.code,
        reason: apiErr.reason ?? parsed?.reason ?? null,
        traceId:
          apiErr.traceId ||
          parsed?.traceId ||
          (typeof res.headers['x-trace-id'] === 'string' ? res.headers['x-trace-id'] : null),
        fields: Array.isArray(apiErr.fields) ? apiErr.fields : Array.isArray(parsed?.fields) ? parsed.fields : [],
      });
    } catch (err) {
      if (err instanceof PaymentsLkApiError) {
        throw err;
      }
      lastError = err;
      if (attempt < PAYMENTS_LK_MAX_RETRIES) {
        await sleep(350 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to reach Payments.lk payment gateway.');
}

/**
 * Normalize Sri Lankan mobile numbers for Payments.lk's SL phone validator.
 * International non-LK numbers are omitted cleanly because `customer.phone` is optional in Payments.lk.
 */
export function normalizeSriLankanPhoneForPaymentsLk(mobileCode?: string, mobile?: string): string | undefined {
  const code = (mobileCode || '').replace(/[^\d+]/g, '');
  const digits = (mobile || '').replace(/\D/g, '');
  if (!digits) return undefined;

  if (code && code !== '+94' && code !== '94') {
    return undefined;
  }

  if (digits.startsWith('94') && digits.length === 11 && digits[2] === '7') {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10 && digits[1] === '7') {
    return digits;
  }
  if (digits.length === 9 && digits[0] === '7') {
    return `+94${digits}`;
  }
  // Also allow valid 9-digit landline starting with 0xx/area code only if code === '+94'
  if (code === '+94' && digits.length === 9 && digits[0] !== '0') {
    return `+94${digits}`;
  }
  if (code === '+94' && digits.length === 10 && digits[0] === '0') {
    return digits;
  }
  return undefined;
}

export function toLkrCents(amountLkr: number): number {
  const cents = Math.round(amountLkr * 100);
  if (!Number.isSafeInteger(cents) || cents < 1000 || cents > 100_000_000) {
    throw new PaymentsLkApiError({
      status: 400,
      code: 'AMOUNT_OUT_OF_RANGE',
      message: 'Online card payments via Payments.lk require a total between LKR 10 and LKR 1,000,000.',
    });
  }
  return cents;
}

export function isTrustedPaymentsLkUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return parsed.hostname === 'payments.lk' || parsed.hostname.endsWith('.payments.lk');
  } catch {
    return false;
  }
}

export async function createPaymentsLkCheckout(params: {
  amountLkr: number;
  description: string;
  reference: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  expiresInMinutes?: number;
}): Promise<PaymentsLkCheckout> {
  const amountCents = toLkrCents(params.amountLkr);

  const safeDescription = params.description.replace(/\s+/g, ' ').trim().slice(0, 120) || `Winsor Order ${params.reference}`;
  const safeReference = params.reference.trim().slice(0, 64);

  const body: Record<string, unknown> = {
    amountCents,
    currency: 'LKR',
    description: safeDescription,
    reference: safeReference,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    expiresInMinutes: params.expiresInMinutes ?? 30,
  };

  const name = params.customer?.name?.trim().slice(0, 80);
  const email = params.customer?.email?.trim().toLowerCase().slice(0, 254);
  if (name && name.length >= 2 && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    body.customer = {
      name,
      email,
      ...(params.customer?.phone ? { phone: params.customer.phone } : {}),
    };
  }

  const checkout = await paymentsLkRequest<PaymentsLkCheckout>('POST', '/v1/checkouts', {
    body,
    idempotencyKey: params.idempotencyKey.replace(/[^A-Za-z0-9_\-:.]/g, '_').slice(0, 255),
  });

  if (!checkout?.id || !checkout?.url || !isTrustedPaymentsLkUrl(checkout.url)) {
    throw new Error('Payments.lk returned an invalid or untrusted checkout redirect URL.');
  }

  return checkout;
}

export async function retrievePaymentsLkCheckout(checkoutId: string): Promise<PaymentsLkCheckout> {
  const cleanId = checkoutId.trim();
  if (!/^chk_[A-Za-z0-9]+$/.test(cleanId)) {
    throw new PaymentsLkApiError({
      status: 400,
      code: 'INVALID_CHECKOUT_ID',
      message: 'Invalid Payments.lk checkout identifier.',
    });
  }
  return paymentsLkRequest<PaymentsLkCheckout>('GET', `/v1/checkouts/${encodeURIComponent(cleanId)}`);
}

/**
 * Verify Payments-Signature header against raw request bytes using HMAC-SHA256 + timingSafeEqual.
 */
export function verifyPaymentsLkWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  webhookSecret?: string;
  toleranceSeconds?: number;
}): { valid: boolean; reason?: string } {
  const secret = (params.webhookSecret ?? process.env.PAYMENTS_LK_WEBHOOK_SECRET ?? '').trim();
  if (!secret) {
    return { valid: false, reason: 'Webhook signing secret is not configured.' };
  }

  const header = params.signatureHeader ?? '';
  if (!header) {
    return { valid: false, reason: 'Missing Payments-Signature header.' };
  }

  const tolerance = params.toleranceSeconds ?? 300;
  let timestamp: number | undefined;
  const v1Signatures: string[] = [];

  for (const part of header.split(',')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === 't' && /^[0-9]{1,12}$/.test(val)) {
      timestamp = Number(val);
    } else if (key === 'v1' && /^[0-9a-f]{64}$/i.test(val)) {
      v1Signatures.push(val.toLowerCase());
    }
  }

  if (timestamp === undefined || v1Signatures.length === 0) {
    return { valid: false, reason: 'Malformed Payments-Signature header.' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > tolerance) {
    return { valid: false, reason: 'Webhook signature timestamp outside tolerance window.' };
  }

  const expectedDigest = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${params.rawBody}`, 'utf8')
    .digest();

  const matched = v1Signatures.some((hexSig) => {
    const sigBuf = Buffer.from(hexSig, 'hex');
    return sigBuf.length === expectedDigest.length && crypto.timingSafeEqual(expectedDigest, sigBuf);
  });

  return matched ? { valid: true } : { valid: false, reason: 'Webhook HMAC digest mismatch.' };
}

function getAppSigningSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured (min 32 chars).');
  }
  return secret;
}

export interface CheckoutResultTokenPayload {
  type: 'payments_lk_result';
  orderRef: string;
  source: CheckoutSource;
  returnPath: string;
}

export function sanitizeInternalReturnPath(rawPath: unknown, fallback = '/cart'): string {
  if (typeof rawPath !== 'string') return fallback;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  if (/[\r\n\0]/.test(trimmed) || trimmed.length > 200) {
    return fallback;
  }
  return trimmed;
}

export function signCheckoutResultToken(params: {
  orderRef: string;
  source: CheckoutSource;
  returnPath: string;
}): string {
  return jwt.sign(
    {
      type: 'payments_lk_result',
      orderRef: params.orderRef,
      source: params.source,
      returnPath: sanitizeInternalReturnPath(params.returnPath),
    },
    getAppSigningSecret(),
    { algorithm: 'HS256', expiresIn: '2h' }
  );
}

export function verifyCheckoutResultToken(token: string): CheckoutResultTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getAppSigningSecret(), {
      algorithms: ['HS256'],
    }) as Partial<CheckoutResultTokenPayload>;
    if (
      !decoded ||
      decoded.type !== 'payments_lk_result' ||
      typeof decoded.orderRef !== 'string' ||
      !decoded.orderRef
    ) {
      return null;
    }
    return {
      type: 'payments_lk_result',
      orderRef: decoded.orderRef,
      source: (decoded.source as CheckoutSource) || 'cart',
      returnPath: sanitizeInternalReturnPath(decoded.returnPath, '/cart'),
    };
  } catch {
    return null;
  }
}

export function resolvePublicOrigin(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').trim();
  if (configured) {
    try {
      const u = new URL(configured);
      if (u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === 'localhost')) {
        return u.origin;
      }
    } catch {
      // ignore invalid env URL and derive safely from request
    }
  }

  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = req.headers.get('host')?.trim();
  const rawHost = forwardedHost || hostHeader || req.nextUrl.host;

  // Guard against host header injection
  const safeHost = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(rawHost) ? rawHost : req.nextUrl.host;
  const hostnameOnly = safeHost.split(':')[0]?.toLowerCase();

  if (hostnameOnly === 'localhost') {
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.nextUrl.protocol.replace(':', '');
    return `${proto === 'https' ? 'https' : 'http'}://${safeHost}`;
  }
  if (hostnameOnly === '127.0.0.1') {
    const portPart = safeHost.includes(':') ? `:${safeHost.split(':')[1]}` : '';
    return `http://localhost${portPart}`;
  }

  return `https://${safeHost}`;
}
