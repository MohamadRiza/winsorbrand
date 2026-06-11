import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';
import { verifyPermissions } from '@/lib/authHelper';

// GET all vacancies (Admin / Staff with permission)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['careers_vacancies']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const vacancies = await Vacancy.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: vacancies });
  } catch (error: any) {
    console.error('Fetch vacancies admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// POST create new vacancy (Admin / Staff with permission)
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['careers_vacancies']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, salary, locations, transportProvided, accommodationProvided, accommodationDetails } = body;

    if (!title || !description || !locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and at least one location are required.' },
        { status: 400 }
      );
    }

    const vacancy = await Vacancy.create({
      title: title.trim(),
      description,
      salary: salary ? salary.trim() : undefined,
      locations: locations.map(l => l.trim()).filter(l => l !== ''),
      transportProvided: !!transportProvided,
      accommodationProvided: !!accommodationProvided,
      accommodationDetails: accommodationProvided ? accommodationDetails?.trim() : undefined,
      status: 'active',
      applicantCount: 0,
    });

    return NextResponse.json({ success: true, data: vacancy }, { status: 201 });
  } catch (error: any) {
    console.error('Create vacancy admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
