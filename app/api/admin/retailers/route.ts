// app/api/admin/retailers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Retailer from '@/lib/models/Retailer';
import { verifyPermissions } from '@/lib/authHelper';

// GET all retailers (including inactive ones)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['retailers_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const retailers = await Retailer.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: retailers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST create new retailer
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['retailers_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();

    const { name, address, city, country, googleMapsLink, image, latitude, longitude, isActive } = body;

    if (!name || !address || !city || !country || !googleMapsLink) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const retailer = await Retailer.create({
      name,
      address,
      city,
      country,
      googleMapsLink,
      image: image || { url: '', publicId: '' },
      latitude: latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, data: retailer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
