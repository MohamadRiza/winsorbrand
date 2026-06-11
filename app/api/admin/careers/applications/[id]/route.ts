import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import JobApplication from '@/lib/models/JobApplication';
import { verifyPermissions } from '@/lib/authHelper';

// PATCH update application status (Admin / Staff with permission)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['careers_applications']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['pending', 'under_review', 'interview_scheduled', 'offered', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid application status value' },
        { status: 400 }
      );
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Job application not found.' },
        { status: 404 }
      );
    }

    application.status = status;
    await application.save();

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Update job application status error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE delete application (Admin / Staff with permission)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyPermissions(req, ['careers_applications']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;

    const deleted = await JobApplication.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Job application not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Job application deleted successfully.' });
  } catch (error: any) {
    console.error('Delete job application error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
