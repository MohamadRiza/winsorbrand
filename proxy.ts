import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

// Custom admin route checking
async function handleAdminAuth(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ ALLOW access to login page
  if (pathname === '/admin/login') {
    const accessToken = req.cookies.get('admin_access_token')?.value;
    
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        const returnTo = req.nextUrl.searchParams.get('redirect') || '/admin/dashboard';
        return NextResponse.redirect(new URL(returnTo, req.url));
      }
    }
    return NextResponse.next();
  }

  // ✅ PROTECT all other /admin routes
  if (pathname.startsWith('/admin')) {
    const accessToken = req.cookies.get('admin_access_token')?.value;
    const userType = req.cookies.get('winsor_user_type')?.value;
    const loginPath = userType === 'staff' ? '/staff/login' : '/admin/login';
    
    if (!accessToken) {
      const loginUrl = new URL(loginPath, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = verifyAccessToken(accessToken);
    
    if (!payload) {
      const loginUrl = new URL(loginPath, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access
    if (pathname.startsWith('/admin/dashboard') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/settings', req.url));
    }
  }

  // ✅ PROTECT admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (['/api/admin/login', '/api/admin/logout', '/api/admin/debug'].includes(pathname)) {
      return NextResponse.next();
    }

    const accessToken = req.cookies.get('admin_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  return null;
}

function isStaleClerkSession(token?: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    // The active Clerk instance key id is 'ins_3Hlk2s3HqcNnByzqXuX1cTj4pNf'.
    // Any session token signed with a different instance key (e.g. ins_2voZuNySdIp39pQgtQeQLkSXNb5) is stale.
    if (header.kid && header.kid !== 'ins_3Hlk2s3HqcNnByzqXuX1cTj4pNf') {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

const clerkHandler = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Staff portal routes do not use Clerk or admin checks
  if (pathname.startsWith('/staff') || pathname.startsWith('/api/staff')) {
    return NextResponse.next();
  }

  // Run admin authentication check if path is for admin area
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminRes = await handleAdminAuth(req);
    if (adminRes) return adminRes;
    return NextResponse.next();
  }

  return NextResponse.next();
});

const middleware = async (req: NextRequest, event: NextFetchEvent) => {
  let hadStaleCookie = false;
  const sessionToken = req.cookies.get('__session')?.value;

  if (isStaleClerkSession(sessionToken)) {
    hadStaleCookie = true;
    req.cookies.delete('__session');
    req.cookies.delete('__client_uat');
    req.cookies.delete('__clerk_handshake');
    req.cookies.delete('__clerk_db_jwt');
  }

  try {
    const res = await clerkHandler(req, event);
    if (hadStaleCookie && res) {
      if ('cookies' in res && (res as NextResponse).cookies) {
        (res as NextResponse).cookies.delete('__session');
        (res as NextResponse).cookies.delete('__client_uat');
        (res as NextResponse).cookies.delete('__clerk_handshake');
        (res as NextResponse).cookies.delete('__clerk_db_jwt');
      } else if (res.headers) {
        res.headers.append('Set-Cookie', '__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
        res.headers.append('Set-Cookie', '__client_uat=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
      }
    }
    return res;
  } catch (err: any) {
    console.warn('[Proxy] Handled Clerk token verification error:', err?.message || err);
    const fallbackRes = NextResponse.next();
    fallbackRes.cookies.delete('__session');
    fallbackRes.cookies.delete('__client_uat');
    fallbackRes.cookies.delete('__clerk_handshake');
    fallbackRes.cookies.delete('__clerk_db_jwt');
    return fallbackRes;
  }
};

export default middleware;
export const proxy = middleware;

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/api/admin/:path*',
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
