import { NextRequest } from 'next/server';
import { verifyAccessToken, JWTPayload } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';

export interface VerifyAuthResult {
  authorized: boolean;
  payload?: JWTPayload;
  error?: string;
  status?: number;
}

/**
 * Helper to verify access tokens and check staff permissions on backend API routes.
 * 
 * @param req NextRequest
 * @param requiredPermissions Array of permissions required. If empty, only valid session is required.
 * @returns Promise<VerifyAuthResult>
 */
export async function verifyPermissions(
  req: NextRequest,
  requiredPermissions: string[] = []
): Promise<VerifyAuthResult> {
  try {
    const accessToken = req.cookies.get('admin_access_token')?.value;

    if (!accessToken) {
      return { authorized: false, error: 'Unauthorized. Please log in.', status: 401 };
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return { authorized: false, error: 'Session expired. Please log in again.', status: 401 };
    }

    // Connect to database
    await connectDB();

    // Query database to check status and permissions in real time
    const user = await Admin.findById(payload.adminId);
    if (!user) {
      return { authorized: false, error: 'Account not found.', status: 401 };
    }

    if (!user.isActive) {
      return { authorized: false, error: 'Your account has been deactivated.', status: 403 };
    }

    // Admins bypass all permissions and expiration checks
    if (user.role === 'admin') {
      return { authorized: true, payload };
    }

    // For staff members, check expiration and permissions
    if (user.role === 'staff') {
      if (user.isTemporary && user.expiresAt && new Date(user.expiresAt) < new Date()) {
        return { authorized: false, error: 'Your staff account has expired.', status: 403 };
      }

      // Check permissions if any are required
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(p => user.permissions.includes(p));
        if (!hasPermission) {
          return { authorized: false, error: 'Access Denied: Insufficient permissions.', status: 403 };
        }
      }

      return { authorized: true, payload };
    }

    return { authorized: false, error: 'Invalid user role.', status: 403 };
  } catch (error: any) {
    console.error('Permission verification error:', error);
    return { authorized: false, error: 'Internal server error.', status: 500 };
  }
}
