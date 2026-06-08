import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/lib/models/ContactMessage';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    // 1. Get Requester IP Address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               req.headers.get('cf-connecting-ip') ||
               '127.0.0.1';

    // 2. Database-backed Rate Limiter (Max 3 messages per 24 hours per IP)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const submissionsCount = await ContactMessage.countDocuments({
      ipAddress: ip,
      createdAt: { $gte: oneDayAgo },
    });

    if (submissionsCount >= 3) {
      // Find oldest message in last 24h to calculate exact hours remaining until rate limit resets
      const oldestMessage = await ContactMessage.findOne({
        ipAddress: ip,
        createdAt: { $gte: oneDayAgo },
      }).sort({ createdAt: 1 });

      const resetTime = oldestMessage 
        ? new Date(oldestMessage.createdAt.getTime() + 24 * 60 * 60 * 1000) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const msLeft = resetTime.getTime() - Date.now();
      const hoursLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60)));

      return NextResponse.json(
        { 
          success: false, 
          error: `Too many submissions. You can send a maximum of 3 messages per 24 hours. Please try again in ${hoursLeft} hours.` 
        },
        { status: 429 }
      );
    }

    // 3. Parse and Validate Request Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { name, email, mobile, subject, message, turnstileToken } = body;

    if (!name || !email || !mobile || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields (name, email, mobile, subject, message) are required.' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message cannot exceed 1000 characters.' },
        { status: 400 }
      );
    }

    // 4. Verify Cloudflare Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: 'Security human verification token is required.' },
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

    // 5. Save Inquiry to Database
    const newSupportMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: ip,
      clerkId: userId || undefined,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your inquiry has been successfully submitted. We will contact you soon.' 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Customer Care Inquiry API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
