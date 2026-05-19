import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export interface AdminSession {
  adminId: string;
  username: string;
  role: 'admin' | 'staff';
}

export async function getAdminSession(req: NextRequest): Promise<AdminSession | null> {
  try {
    const accessToken = req.cookies.get('admin_access_token')?.value;
    
    if (!accessToken) {
      console.log('🔐 [AUTH] No access token found');
      return null;
    }
    
    const payload = verifyAccessToken(accessToken);
    
    if (!payload) {
      console.log('🔐 [AUTH] Invalid or expired token');
      return null;
    }
    
    console.log('🔐 [AUTH] Valid session for:', payload.username);
    return {
      adminId: payload.adminId,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    console.error('🔐 [AUTH] Session validation error:', error);
    return null;
  }
}

export async function requireAdmin(
  req: NextRequest, 
  allowedRoles?: ('admin' | 'staff')[]
): Promise<AdminSession | Response> {
  const session = await getAdminSession(req);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return session;
}