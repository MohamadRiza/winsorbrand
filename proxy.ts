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

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // Run admin authentication check first if path is for admin area
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminRes = await handleAdminAuth(req);
    if (adminRes) return adminRes;
  }

  // ✅ BYPASS Clerk middleware for all API routes and public page routes to prevent external server timeouts/CORS blocks
  const isPublicPath = 
    pathname === '/' ||
    pathname.startsWith('/collections') ||
    pathname.startsWith('/our-story') ||
    pathname.startsWith('/retailers') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/customer')) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Otherwise, run Clerk middleware for other page routes
  return clerkMiddleware()(req, event);
}

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
