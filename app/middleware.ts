import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // ✅ ALLOW access to login page (no redirect loop)
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
    
    if (!accessToken) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = verifyAccessToken(accessToken);
    
    if (!payload) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access
    if (pathname.startsWith('/admin/dashboard') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/staff', req.url));
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ],
};