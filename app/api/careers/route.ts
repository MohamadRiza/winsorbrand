import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch only active vacancies
    const vacancies = await Vacancy.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate unique locations from active vacancies
    const allLocationsSet = new Set<string>();
    vacancies.forEach((v: any) => {
      if (Array.isArray(v.locations)) {
        v.locations.forEach((l: string) => {
          if (l) allLocationsSet.add(l.trim());
        });
      }
    });

    const locations = Array.from(allLocationsSet).sort();

    return NextResponse.json({
      success: true,
      data: vacancies,
      locations,
    });
  } catch (error: any) {
    console.error('Fetch public vacancies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job vacancies' },
      { status: 500 }
    );
  }
}
