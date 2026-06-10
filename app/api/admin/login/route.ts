// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import AdminLoginAttempt from '@/lib/models/AdminLoginAttempt';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// 🔐 RATE LIMITER: 5 attempts per 15 minutes per IP
const loginLimiter = new RateLimiterMemory({
  points: parseInt(process.env.LOGIN_RATE_LIMIT_POINTS || '5'),
  duration: parseInt(process.env.LOGIN_RATE_LIMIT_DURATION || '900'), // seconds
});

export async function POST(req: NextRequest) {
  console.log('🔐 [LOGIN] Request received');
  
  try {
    // 🔐 Resolve IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               req.headers.get('cf-connecting-ip') ||
               'unknown';
    
    console.log(`🔐 [LOGIN] Rate limit check for IP: ${ip}`);
    
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
      
      console.warn(`🔐 [LOGIN] Blocked IP attempt: ${ip}. Remaining block time: ${durationStr}`);
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
      console.log('🔐 [LOGIN] Rate limit OK');
    } catch (rateLimiterRes: any) {
      const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
      console.warn(`🔐 [LOGIN] Rate limit exceeded for IP: ${ip}, retry after ${retrySecs}s`);
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
            'X-RateLimit-Limit': loginLimiter.points.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + rateLimiterRes.msBeforeNext).toString(),
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('🔐 [LOGIN] Parsed body:', { 
        username: body?.username, 
        passwordLength: body?.password?.length,
        hasTurnstileToken: !!body?.turnstileToken
      });
    } catch (parseError) {
      console.error('🔐 [LOGIN] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { username, password, turnstileToken } = body;

    // Validate input
    if (!username || !password) {
      console.warn('🔐 [LOGIN] Missing credentials');
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    // 🔐 Verify Cloudflare Turnstile token
    if (!turnstileToken) {
      console.warn('🔐 [LOGIN] Missing Turnstile token');
      return NextResponse.json(
        { success: false, error: 'Security verification required' },
        { status: 400 }
      );
    }

    console.log('🔐 [LOGIN] Verifying Turnstile token...');
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
      console.warn('🔐 [LOGIN] Turnstile verification failed');
      return NextResponse.json(
        { success: false, error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }
    console.log('🔐 [LOGIN] ✅ Turnstile verified');

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

    // Find admin (explicitly select password field and enforce role 'admin')
    console.log(`🔐 [LOGIN] Searching for admin user: ${username.trim()}`);
    const admin = await Admin.findOne({ 
      username: username.trim(), 
      role: 'admin',
      isActive: true 
    }).select('+password');
    
    console.log('🔐 [LOGIN] Admin found:', !!admin);

    if (!admin) {
      console.warn('🔐 [LOGIN] Admin not found or inactive');
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
      return NextResponse.json(
        { success: false, error: attemptMsg },
        { status: 401 }
      );
    }

    // Compare password
    console.log('🔐 [LOGIN] Comparing password...');
    const isMatch = await admin.comparePassword(password);
    console.log('🔐 [LOGIN] Password match:', isMatch);

    if (!isMatch) {
      console.warn('🔐 [LOGIN] Password mismatch');
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
      return NextResponse.json(
        { success: false, error: attemptMsg },
        { status: 401 }
      );
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    console.log('🔐 [LOGIN] Last login updated');

    // Generate tokens
    console.log('🔐 [LOGIN] Generating tokens...');
    const accessToken = generateAccessToken({
      adminId: admin._id.toString(),
      username: admin.username,
      role: admin.role as 'admin' | 'staff',
    });
    
    const refreshToken = generateRefreshToken({ 
      adminId: admin._id.toString() 
    });
    console.log('🔐 [LOGIN] Tokens generated');

    // Create response with cookies
    console.log('🔐 [LOGIN] Setting cookies...');
    const response = NextResponse.json(
      { 
        success: true, 
        data: { 
          username: admin.username, 
          role: admin.role,
          message: 'Login successful' 
        } 
      },
      { status: 200 }
    );

    // Set HTTP-only cookies
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

    response.cookies.set('winsor_user_type', 'admin', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // ✅ Reset rate limit and blocks on successful login
    await loginLimiter.delete(ip).catch(() => {});
    await AdminLoginAttempt.deleteOne({ ip }).catch(() => {});
    
    console.log('🔐 [LOGIN] ✅ Success - cookies set, rate limit and blocks reset');
    return response;

  } catch (error: any) {
    console.error('🔐 [LOGIN] ❌ SERVER ERROR:', {
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    });
    
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}