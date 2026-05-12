import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/middleware/adminAuth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = await getAdminSession(req);
    
    if (!session) {
      // Redirect to login with return URL
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role-based access control example
    if (pathname.startsWith('/admin/dashboard') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/staff', req.url));
    }
  }

  // Redirect logged-in admins away from login page
  if (pathname === '/admin/login') {
    const session = await getAdminSession(req);
    if (session) {
      const returnTo = req.nextUrl.searchParams.get('returnTo') || '/admin/dashboard';
      return NextResponse.redirect(new URL(returnTo, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};