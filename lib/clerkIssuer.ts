/**
 * Decodes the Clerk Frontend API hostname from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
 * (e.g. `apt-walrus-40.clerk.accounts.dev`). Used to pin JWT issuer checks and
 * fetch the matching tenant's public JWKS without hardcoding hostnames.
 */
export function getExpectedClerkIssuerHost(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const encoded = pk.replace(/^pk_(test|live)_/, '');
  if (!encoded || encoded === pk) return null;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '').trim();
    return decoded || null;
  } catch {
    return null;
  }
}
