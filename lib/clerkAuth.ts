import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { getAuth, verifyToken } from '@clerk/nextjs/server';
import { getExpectedClerkIssuerHost } from '@/lib/clerkIssuer';

interface ClerkJwk extends crypto.JsonWebKey {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
}

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
let jwksCache: { host: string; keys: ClerkJwk[]; fetchedAt: number } | null = null;

async function fetchJwksForHost(host: string, forceRefresh = false): Promise<ClerkJwk[]> {
  const now = Date.now();
  if (!forceRefresh && jwksCache && jwksCache.host === host && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  const res = await fetch(`https://${host}/.well-known/jwks.json`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Clerk JWKS (${res.status})`);
  }
  const data = (await res.json()) as { keys?: ClerkJwk[] };
  const keys = Array.isArray(data?.keys) ? data.keys : [];
  jwksCache = { host, keys, fetchedAt: now };
  return keys;
}

/**
 * Cryptographically verifies a Clerk RS256 session JWT against the public JWKS
 * published by the Clerk instance derived from NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
 * Enforces alg === 'RS256', strict iss match, valid exp/nbf window, and non-empty sub.
 */
async function verifyWithPublishableKeyJwks(token: string): Promise<string | null> {
  const expectedHost = getExpectedClerkIssuerHost();
  if (!expectedHost) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header: { alg?: string; kid?: string };
  let payload: { sub?: unknown; iss?: unknown; exp?: unknown; nbf?: unknown };
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    return null;
  }
  if (payload.iss !== `https://${expectedHost}`) {
    return null;
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    return null;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const clockSkewSec = 10;
  if (typeof payload.exp !== 'number' || nowSec - clockSkewSec >= payload.exp) {
    return null;
  }
  if (typeof payload.nbf === 'number' && nowSec + clockSkewSec < payload.nbf) {
    return null;
  }

  let keys = await fetchJwksForHost(expectedHost, false);
  let matchingJwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  if (!matchingJwk) {
    keys = await fetchJwksForHost(expectedHost, true);
    matchingJwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
  }
  if (!matchingJwk) return null;

  const publicKey = crypto.createPublicKey({ key: matchingJwk, format: 'jwk' });
  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
  const signature = Buffer.from(parts[2], 'base64url');
  const valid = crypto.verify('RSA-SHA256', signingInput, publicKey, signature);

  return valid ? payload.sub : null;
}

/**
 * Resolves the verified Clerk userId for an API route request.
 * Checks middleware auth (`getAuth`), then cryptographically verifies either a Bearer
 * session token or the `__session` cookie via `CLERK_SECRET_KEY` and, if env keys point
 * to split dev instances, the publishable key's RS256 JWKS endpoint.
 */
export async function getVerifiedClerkUserId(req: NextRequest): Promise<string | null> {
  try {
    const { userId } = getAuth(req);
    if (userId) return userId;
  } catch {
    // Middleware auth headers may be absent if called outside matcher; fall through to cryptographic verification.
  }

  const authHeader = req.headers.get('authorization');
  const hasExplicitBearer = Boolean(authHeader && authHeader.toLowerCase().startsWith('bearer '));
  const bearerToken = hasExplicitBearer ? authHeader!.slice(7).trim() : '';
  const candidateToken = hasExplicitBearer ? bearerToken : req.cookies.get('__session')?.value || '';

  if (!candidateToken) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    try {
      const payload = await verifyToken(candidateToken, { secretKey });
      if (typeof payload?.sub === 'string' && payload.sub.length > 0) {
        return payload.sub;
      }
    } catch {
      // Fall through to publishable-key JWKS verification (e.g. when PK and SK come from different dev instances).
    }
  }

  try {
    return await verifyWithPublishableKeyJwks(candidateToken);
  } catch {
    return null;
  }
}
