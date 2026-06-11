import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const vacancy = await Vacancy.findOne({ _id: id, status: 'active' }).lean();

    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: 'Vacancy not found or has been filled.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vacancy });
  } catch (error: any) {
    console.error('Fetch public single vacancy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vacancy details' },
      { status: 500 }
    );
  }
}
