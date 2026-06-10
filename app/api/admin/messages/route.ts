import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/lib/models/ContactMessage';
import Customer from '@/lib/models/Customer';
import { verifyPermissions } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['messages_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Fetch all contact messages, sorted by newest first
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();

    // Extract unique clerkIds of logged-in customers
    const clerkIds = messages
      .map((m: any) => m.clerkId)
      .filter((id): id is string => typeof id === 'string' && id.trim() !== '');

    // Fetch matching customers from database to get their profileImage
    const customers = await Customer.find({ clerkId: { $in: clerkIds } }).lean();

    // Map customer data by clerkId
    const customerMap = new Map(customers.map(c => [c.clerkId, c]));

    // Enrich messages with profileImage, login status, and read status
    const enrichedMessages = messages.map((m: any) => {
      const customer = m.clerkId ? customerMap.get(m.clerkId) : null;
      return {
        ...m,
        _id: m._id.toString(),
        isLoggedIn: !!m.clerkId,
        profileImage: customer?.profileImage || null,
        read: m.read || false,
      };
    });

    return NextResponse.json({ success: true, data: enrichedMessages });
  } catch (error: any) {
    console.error('Fetch admin messages API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['messages_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { read } = body;

    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Read status must be a boolean' },
        { status: 400 }
      );
    }

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { read },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update admin message API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['messages_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Delete admin message API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
