import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const customer = await Customer.findOne({ clerkId: userId });
    return NextResponse.json({ success: true, data: customer || null });
  } catch (error: any) {
    console.error('Fetch customer profile API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, mobileCode, mobile, profileImage, country, address, city, postalCode } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const customer = await Customer.findOneAndUpdate(
      { clerkId: userId },
      {
        email,
        mobileCode,
        mobile,
        profileImage,
        country,
        address,
        city,
        postalCode,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('Save customer profile API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
