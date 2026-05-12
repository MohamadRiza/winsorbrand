// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  console.log('🔐 [LOGIN] Request received');
  
  try {
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
          remoteip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        }),
      }
    );

    const turnstileData = await turnstileResponse.json();
    console.log('🔐 [LOGIN] Turnstile verification response:', { 
      success: turnstileData?.success, 
      'error-codes': turnstileData?.['error-codes'] 
    });

    if (!turnstileData.success) {
      console.warn('🔐 [LOGIN] Turnstile verification failed');
      return NextResponse.json(
        { success: false, error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }
    console.log('🔐 [LOGIN] ✅ Turnstile verified');

    // Connect to database
    console.log('🔐 [LOGIN] Connecting to DB...');
    await connectDB();
    console.log('🔐 [LOGIN] DB connected');

    // Find admin (explicitly select password field)
    console.log(`🔐 [LOGIN] Searching for user: ${username.trim()}`);
    const admin = await Admin.findOne({ 
      username: username.trim(), 
      isActive: true 
    }).select('+password');
    
    console.log('🔐 [LOGIN] Admin found:', !!admin);

    if (!admin) {
      console.warn('🔐 [LOGIN] Admin not found or inactive');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    console.log('🔐 [LOGIN] Comparing password...');
    const isMatch = await admin.comparePassword(password);
    console.log('🔐 [LOGIN] Password match:', isMatch);

    if (!isMatch) {
      console.warn('🔐 [LOGIN] Password mismatch');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
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

    console.log('🔐 [LOGIN] ✅ Success - cookies set');
    return response;

  } catch (error: any) {
    // 🚨 CRITICAL: Log full error to terminal
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