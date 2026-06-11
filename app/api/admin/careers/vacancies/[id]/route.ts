import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/lib/models/Vacancy';
import { verifyPermissions } from '@/lib/authHelper';

// PUT update vacancy details or visibility status (Admin / Staff with permission)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['careers_vacancies']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: 'Job vacancy posting not found.' },
        { status: 404 }
      );
    }

    const { title, description, salary, locations, transportProvided, accommodationProvided, accommodationDetails, status } = body;

    if (title) vacancy.title = title.trim();
    if (description) vacancy.description = description;
    if (salary !== undefined) vacancy.salary = salary ? salary.trim() : undefined;
    if (locations && Array.isArray(locations) && locations.length > 0) {
      vacancy.locations = locations.map(l => l.trim()).filter(l => l !== '');
    }
    if (transportProvided !== undefined) vacancy.transportProvided = !!transportProvided;
    if (accommodationProvided !== undefined) {
      vacancy.accommodationProvided = !!accommodationProvided;
      if (!vacancy.accommodationProvided) {
        vacancy.accommodationDetails = undefined;
      }
    }
    if (accommodationProvided && accommodationDetails !== undefined) {
      vacancy.accommodationDetails = accommodationDetails.trim();
    }
    if (status) vacancy.status = status;

    await vacancy.save();

    return NextResponse.json({ success: true, data: vacancy });
  } catch (error: any) {
    console.error('Update vacancy admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE delete vacancy (Admin / Staff with permission)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['careers_vacancies']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;

    const deleted = await Vacancy.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Job vacancy posting not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Job vacancy deleted successfully.' });
  } catch (error: any) {
    console.error('Delete vacancy admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
