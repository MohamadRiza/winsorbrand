// lib/turnstile.ts
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error('❌ [TURNSTILE] TURNSTILE_SECRET_KEY is not defined in environment variables!');
    return { success: false, errorCodes: ['missing-secret-key'] };
  }

  if (!token) {
    console.warn('🔐 [TURNSTILE] No token provided');
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.warn('🔐 [TURNSTILE] Verification failed:', {
        errorCodes: data['error-codes'],
        hostname: data.hostname,
        action: data.action,
        cdata: data.cdata,
      });
      return { success: false, errorCodes: data['error-codes'] || [] };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [TURNSTILE] Network error while verifying Turnstile token:', error);
    return { success: false, errorCodes: ['network-error'] };
  }
}
