import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('admin_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyAccessToken(accessToken);
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    username: payload.username,
    role: payload.role,
    adminId: payload.adminId,
  });
}