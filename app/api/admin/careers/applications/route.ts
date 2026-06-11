import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import JobApplication from '@/lib/models/JobApplication';
import Vacancy from '@/lib/models/Vacancy'; // Ensure Vacancy model is loaded for populate
import { verifyPermissions } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['careers_applications']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Fetch all job applications, populate vacancy title
    const applications = await JobApplication.find({})
      .sort({ createdAt: -1 })
      .populate('vacancyId', 'title')
      .lean();

    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    console.error('Fetch job applications admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
