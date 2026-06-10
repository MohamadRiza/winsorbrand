import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import AdminLoginAttempt from '@/lib/models/AdminLoginAttempt';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// 🔐 RATE LIMITER: 5 attempts per 15 minutes per IP
const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900, // seconds
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
    const body = await req.json();
    const { username, password, turnstileToken } = body;

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

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }),
      }
    );

    const turnstileData = await turnstileResponse.json();
    if (!turnstileData.success) {
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

    // Generate tokens
    const accessToken = generateAccessToken({
      adminId: staff._id.toString(),
      username: staff.username,
      role: 'staff',
    });
    
    const refreshToken = generateRefreshToken({ 
      adminId: staff._id.toString() 
    });

    const response = NextResponse.json(
      { 
        success: true, 
        data: { 
          username: staff.username, 
          role: 'staff',
          message: 'Login successful' 
        } 
      },
      { status: 200 }
    );

    // Set cookies
    response.cookies.set('admin_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('admin_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Reset attempts on success
    await loginLimiter.delete(ip).catch(() => {});
    await AdminLoginAttempt.deleteOne({ ip }).catch(() => {});
    
    return response;

  } catch (error: any) {
    console.error('🔐 [STAFF LOGIN] Server error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
