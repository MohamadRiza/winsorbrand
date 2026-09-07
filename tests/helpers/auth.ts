import jwt from 'jsonwebtoken';
import { BrowserContext } from '@playwright/test';

const DEFAULT_SECRET = 'ca74cc641618f602056786d939fe09b8cf82f6911b3eed3fe24cf2c29238ccd75eace3535542f3630bd947eaf1bf9606de31d12cd17f650a35ab60845b595138';
const REAL_ADMIN_ID = '6a02d3c9bed6cdc39ffaf76f';

export function getAdminToken(): string {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return jwt.sign(
    {
      adminId: REAL_ADMIN_ID,
      username: 'admin',
      role: 'admin',
    },
    secret,
    { expiresIn: '2h' }
  );
}

export async function setupAdminSession(context: BrowserContext): Promise<void> {
  const token = getAdminToken();
  await context.addCookies([
    {
      name: 'admin_access_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'winsor_user_type',
      value: 'admin',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
