// app/api/admin/retailers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Retailer from '@/lib/models/Retailer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, any> = {
      name: body.name,
      address: body.address,
      city: body.city,
      country: body.country,
      googleMapsLink: body.googleMapsLink,
      isActive: body.isActive,
    };

    if (body.image) {
      updateData.image = body.image;
    }

    if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') {
      updateData.latitude = Number(body.latitude);
    } else {
      updateData.latitude = undefined;
    }

    if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') {
      updateData.longitude = Number(body.longitude);
    } else {
      updateData.longitude = undefined;
    }

    const retailer = await Retailer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!retailer) {
      return NextResponse.json(
        { success: false, error: 'Retailer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: retailer });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const retailer = await Retailer.findByIdAndDelete(id);

    if (!retailer) {
      return NextResponse.json(
        { success: false, error: 'Retailer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Retailer deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
