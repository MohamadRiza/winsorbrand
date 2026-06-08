import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
// Import Product model to register it in Mongoose schemas for populate
import Product from '@/lib/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Populate the product details
    const cart = await Cart.findOne({ clerkId: userId }).populate({
      path: 'items.productId',
      model: Product,
    });

    if (!cart) {
      return NextResponse.json({ success: true, data: { clerkId: userId, items: [] } });
    }

    // Filter out items where the product no longer exists
    const validItems = cart.items.filter((item: any) => item.productId !== null);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    return NextResponse.json({ success: true, data: cart });
  } catch (error: any) {
    console.error('Fetch customer cart API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Validate items
    const formattedItems = items.map((item: any) => {
      if (!item.productId) {
        throw new Error('Each item must contain a productId');
      }
      return {
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        colorVariant: item.colorVariant || '',
      };
    });

    // Find and update or create
    const cart = await Cart.findOneAndUpdate(
      { clerkId: userId },
      { items: formattedItems },
      { new: true, upsert: true }
    ).populate({
      path: 'items.productId',
      model: Product,
    });

    return NextResponse.json({ success: true, data: cart });
  } catch (error: any) {
    console.error('Save customer cart API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
