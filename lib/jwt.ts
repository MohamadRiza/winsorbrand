// lib/jwt.ts
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  adminId: string;
  username: string;
  role: 'admin' | 'staff';
}

// 🔴 CRITICAL: Read env vars at runtime, not module load time
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short. ' +
      'Ensure .env.local contains: JWT_SECRET=your_secret_key_min_32_chars'
    );
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_REFRESH_SECRET is missing. ' +
      'Add to .env.local or JWT_SECRET will be used as fallback.'
    );
  }
  return secret;
};

const JWT_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
};

export const generateRefreshToken = (payload: { adminId: string }): string => {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: REFRESH_EXPIRY });
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { adminId: string } | null => {
  try {
    return jwt.verify(token, getRefreshSecret()) as { adminId: string };
  } catch {
    return null;
  }
};