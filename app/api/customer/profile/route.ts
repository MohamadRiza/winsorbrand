import { NextRequest, NextResponse } from 'next/server';
import { getAuth, currentUser } from '@clerk/nextjs/server';
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

    let customer = await Customer.findOne({ clerkId: userId });

    // Fallback: If not found by clerkId, match by user's email to auto-link
    if (!customer) {
      try {
        const clerkUser = await currentUser();
        const primaryEmail = clerkUser?.emailAddresses?.find(
          e => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress;

        if (primaryEmail) {
          customer = await Customer.findOne({ email: primaryEmail.toLowerCase().trim() });
          if (customer) {
            customer.clerkId = userId;
            await customer.save();
          }
        }
      } catch (e) {
        console.warn('Auto-link customer by email fallback error:', e);
      }
    }

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

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent duplicate key error (E11000) by finding existing customer by clerkId OR email
    let customer = await Customer.findOne({
      $or: [
        { clerkId: userId },
        { email: normalizedEmail }
      ]
    });

    if (customer) {
      // Re-link clerkId to current user session & update details
      customer.clerkId = userId;
      customer.email = normalizedEmail;
      if (mobileCode !== undefined) customer.mobileCode = mobileCode;
      if (mobile !== undefined) customer.mobile = mobile;
      if (profileImage !== undefined) customer.profileImage = profileImage;
      if (country !== undefined) customer.country = country;
      if (address !== undefined) customer.address = address;
      if (city !== undefined) customer.city = city;
      if (postalCode !== undefined) customer.postalCode = postalCode;
      await customer.save();
    } else {
      customer = await Customer.create({
        clerkId: userId,
        email: normalizedEmail,
        mobileCode,
        mobile,
        profileImage,
        country,
        address,
        city,
        postalCode,
      });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error('Save customer profile API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
