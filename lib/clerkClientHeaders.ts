/**
 * Builds request headers for authenticated storefront API calls, attaching a
 * fresh Clerk session Bearer token when available so requests remain resilient
 * even if the short-lived `__session` cookie has not yet refreshed.
 */
export async function buildClerkAuthHeaders(
  getToken: () => Promise<string | null>,
  extraHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
): Promise<Record<string, string>> {
  try {
    const token = await getToken();
    if (token) {
      return { ...extraHeaders, Authorization: `Bearer ${token}` };
    }
  } catch {
    // Fall back to cookie-based session auth if getToken() cannot refresh client-side.
  }
  return { ...extraHeaders };
}
