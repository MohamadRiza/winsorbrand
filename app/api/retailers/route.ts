// app/api/retailers/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Retailer from '@/lib/models/Retailer';

export async function GET() {
  try {
    await connectDB();

    const retailers = await Retailer.find({ isActive: true }).sort({ name: 1 }).lean();

    // Get unique cities and countries from active retailers for the filters
    const cities = Array.from(
      new Set(retailers.map((r: any) => r.city.trim()).filter(Boolean))
    ).sort();

    const countries = Array.from(
      new Set(retailers.map((r: any) => r.country.trim()).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      data: retailers,
      cities,
      countries,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
