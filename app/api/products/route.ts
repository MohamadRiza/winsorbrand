import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { verifyPermissions } from '@/lib/authHelper';

// GET /api/products?home=true  (home=true returns homepage products only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const home = req.nextUrl.searchParams.get('home');

    const filter = home === 'true'
      ? { isActive: true, showOnHome: true }
      : { isActive: true };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('API Products GET Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/products  — create new product (requires products_create permission)
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['products_create']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const product = await Product.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}