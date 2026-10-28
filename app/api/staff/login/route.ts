import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import AdminLoginAttempt from '@/lib/models/AdminLoginAttempt';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '@/lib/jwt';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { verifyTurnstileToken } from '@/lib/turnstile';

// 🔐 RATE LIMITER: 5 attempts per 15 minutes per IP
const loginLimiter = new RateLimiterMemory({
  points: parseInt(process.env.LOGIN_RATE_LIMIT_POINTS || '5'),
  duration: parseInt(process.env.LOGIN_RATE_LIMIT_DURATION || '900'), // seconds
});

export async function POST(req: NextRequest) {
  console.log('🔐 [STAFF LOGIN] Request received');
  
  try {
    // 🔐 Resolve IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               req.headers.get('cf-connecting-ip') ||
               'unknown';
    
    // Connect to database
    await connectDB();

    // 🔐 Check database-backed IP block list
    const attemptRecord = await AdminLoginAttempt.findOne({ ip });
    if (attemptRecord && attemptRecord.blockedUntil && attemptRecord.blockedUntil > new Date()) {
      const msLeft = attemptRecord.blockedUntil.getTime() - Date.now();
      const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
      const minsLeft = Math.ceil((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      let durationStr = `${minsLeft} minutes`;
      if (hoursLeft > 0) {
        durationStr = `${hoursLeft} hours and ${minsLeft} minutes`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many wrong password attempts. This IP has been blocked. Remaining time: ${durationStr}.` 
        },
        { status: 423 } // 423 Locked
      );
    }

    // 🔐 Second tier rate limiter (raw hits count)
    try {
      await loginLimiter.consume(ip);
    } catch (rateLimiterRes: any) {
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: retrySecs,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retrySecs.toString(),
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { username, password, turnstileToken, loginToken, sessionDuration } = body;

    // ── Session Confirmation Step ──────────────────────────────────────────
    if (loginToken && sessionDuration) {
      console.log('🔐 [STAFF LOGIN] Session duration confirmation received:', sessionDuration);

      const decoded = verifyAccessToken(loginToken);
      if (!decoded || decoded.role !== 'staff') {
        return NextResponse.json(
          { success: false, error: 'Login session expired. Please enter credentials again.' },
          { status: 401 }
        );
      }

      const staff = await Admin.findById(decoded.adminId);
      if (!staff || staff.role !== 'staff') {
        return NextResponse.json(
          { success: false, error: 'Staff account does not exist.' },
          { status: 401 }
        );
      }

      if (!staff.isActive) {
        return NextResponse.json(
          { success: false, error: 'Your staff account is deactivated. Please contact your administrator.' },
          { status: 403 }
        );
      }

      if (staff.isTemporary && staff.expiresAt && new Date(staff.expiresAt) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Your staff account has expired. Please contact your administrator to renew access.' },
          { status: 403 }
        );
      }

      // Map session duration to maxAge seconds (MAX: 24h / 1 Day)
      const SESSION_DURATIONS: Record<string, { maxAge: number }> = {
        '15m': { maxAge: 15 * 60 },
        '30m': { maxAge: 30 * 60 },
        '1h': { maxAge: 60 * 60 },
        '2h': { maxAge: 2 * 60 * 60 },
        '4h': { maxAge: 4 * 60 * 60 },
        '8h': { maxAge: 8 * 60 * 60 },
        '12h': { maxAge: 12 * 60 * 60 },
        '24h': { maxAge: 24 * 60 * 60 },
        '1d': { maxAge: 24 * 60 * 60 },
      };

      const durationKey = SESSION_DURATIONS[sessionDuration] ? sessionDuration : '15m';
      let effectiveMaxAge = SESSION_DURATIONS[durationKey].maxAge;

      // Ensure temporary staff session never outlives their account expiration timestamp
      if (staff.isTemporary && staff.expiresAt) {
        const secondsUntilExpiry = Math.max(
          1,
          Math.floor((new Date(staff.expiresAt).getTime() - Date.now()) / 1000)
        );
        effectiveMaxAge = Math.min(effectiveMaxAge, secondsUntilExpiry);
      }

      console.log(`🔐 [STAFF LOGIN] Creating final session. Duration: ${durationKey}, maxAge: ${effectiveMaxAge}s`);

      const accessToken = generateAccessToken(
        {
          adminId: staff._id.toString(),
          username: staff.username,
          role: 'staff',
        },
        effectiveMaxAge
      );

      const refreshToken = generateRefreshToken({
        adminId: staff._id.toString(),
      });

      const response = NextResponse.json(
        {
          success: true,
          data: {
            username: staff.username,
            role: 'staff',
            sessionDuration: durationKey,
            maxAge: effectiveMaxAge,
            message: 'Login successful',
          },
        },
        { status: 200 }
      );

      // Set cookies with dynamic maxAge
      response.cookies.set('admin_access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: effectiveMaxAge,
        path: '/',
      });

      response.cookies.set('admin_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Math.max(effectiveMaxAge, 7 * 24 * 60 * 60),
        path: '/',
      });

      response.cookies.set('winsor_user_type', 'staff', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Math.max(effectiveMaxAge, 7 * 24 * 60 * 60),
        path: '/',
      });

      await loginLimiter.delete(ip).catch(() => {});

      return response;
    }

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    // 🔐 Verify Cloudflare Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: 'Security verification required' },
        { status: 400 }
      );
    }

    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      console.warn('🔐 [STAFF LOGIN] Turnstile verification failed:', turnstileResult.errorCodes);
      return NextResponse.json(
        { success: false, error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Helper to handle and increment failed attempts
    const handleFailedAttempt = async () => {
      let record = await AdminLoginAttempt.findOne({ ip });
      if (!record) {
        record = new AdminLoginAttempt({ ip });
      }
      
      if (record.blockedUntil && record.blockedUntil <= new Date()) {
        record.failedCount = 0;
      }
      
      record.failedCount += 1;
      record.lastAttemptAt = new Date();
      
      let isBlocked = false;
      let duration = 24;
      
      if (record.failedCount > 3) {
        duration = record.previousBlockDuration === 24 ? 48 : 24;
        record.blockedUntil = new Date(Date.now() + duration * 60 * 60 * 1000);
        record.previousBlockDuration = duration;
        record.failedCount = 0;
        isBlocked = true;
      }
      
      await record.save();
      const nextDuration = record.previousBlockDuration === 24 ? 48 : 24;
      return { isBlocked, duration, failedCount: record.failedCount, nextDuration };
    };

    // Find staff user
    const staff = await Admin.findOne({ 
      username: username.trim(), 
      role: 'staff'
    }).select('+password');

    if (!staff) {
      await loginLimiter.penalty(ip).catch(() => {});
      const { isBlocked, duration, failedCount, nextDuration } = await handleFailedAttempt();
      if (isBlocked) {
        return NextResponse.json(
          { success: false, error: `Too many wrong password attempts. This IP has been blocked for ${duration} hours.` },
          { status: 423 }
        );
      }
      
      let attemptMsg = `Invalid credentials. Attempt ${failedCount} of 3.`;
      if (failedCount === 3) {
        attemptMsg = `Invalid credentials. Attempt 3 of 3 (Warning: next wrong attempt will block your IP for ${nextDuration}h).`;
      }
      return NextResponse.json({ success: false, error: attemptMsg }, { status: 401 });
    }

    // Check if account is active
    if (!staff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your staff account is deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if account is expired
    if (staff.isTemporary && staff.expiresAt && new Date(staff.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Your staff account has expired. Please contact your administrator to renew access.' },
        { status: 403 }
      );
    }

    // Compare password
    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      await loginLimiter.penalty(ip).catch(() => {});
      const { isBlocked, duration, failedCount, nextDuration } = await handleFailedAttempt();
      if (isBlocked) {
        return NextResponse.json(
          { success: false, error: `Too many wrong password attempts. This IP has been blocked for ${duration} hours.` },
          { status: 423 }
        );
      }
      
      let attemptMsg = `Invalid credentials. Attempt ${failedCount} of 3.`;
      if (failedCount === 3) {
        attemptMsg = `Invalid credentials. Attempt 3 of 3 (Warning: next wrong attempt will block your IP for ${nextDuration}h).`;
      }
      return NextResponse.json({ success: false, error: attemptMsg }, { status: 401 });
    }

    // Update last login
    staff.lastLogin = new Date();
    await staff.save();

    // Generate temporary verification token for session selection popup
    const tempToken = generateAccessToken(
      {
        adminId: staff._id.toString(),
        username: staff.username,
        role: 'staff',
      },
      '2m' // Expires in 2 minutes
    );

    // Reset attempts on successful credential verification
    await loginLimiter.delete(ip).catch(() => {});
    await AdminLoginAttempt.deleteOne({ ip }).catch(() => {});
    
    console.log('🔐 [STAFF LOGIN] ✅ Credentials verified, temporary token generated');
    return NextResponse.json({
      success: true,
      verified: true,
      loginToken: tempToken,
      username: staff.username,
    });

  } catch (error: any) {
    console.error('🔐 [STAFF LOGIN] Server error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
