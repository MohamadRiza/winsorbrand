import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
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

    const orders = await Order.find({ clerkId: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Fetch customer orders API error:', error);
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
    const { orderRef, items, shippingAddress, subtotal } = body;

    if (!orderRef || !items || !shippingAddress || !subtotal) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one timepiece' },
        { status: 400 }
      );
    }

    // 1. Validate stock first to prevent race conditions or partial updates
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Timepiece not found` },
          { status: 404 }
        );
      }
      
      const variant = product.colorVariants.find(v => v.colorName === item.colorVariant);
      if (variant) {
        if (variant.qty < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${product.title} (${item.colorVariant}). Only ${variant.qty} remaining.` },
            { status: 400 }
          );
        }
      } else if (product.colorVariants[0]) {
        if (product.colorVariants[0].qty < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${product.title}. Only ${product.colorVariants[0].qty} remaining.` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: `Timepiece does not have any variants available` },
          { status: 400 }
        );
      }
    }

    // 2. Decrement stock for variants
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.colorVariants.find(v => v.colorName === item.colorVariant);
        if (variant) {
          variant.qty -= item.quantity;
          variant.inStock = variant.qty > 0;
        } else if (product.colorVariants[0]) {
          product.colorVariants[0].qty -= item.quantity;
          product.colorVariants[0].inStock = product.colorVariants[0].qty > 0;
        }
        
        // Re-evaluate global sold out state
        const allOutOfStock = product.colorVariants.every(v => v.qty === 0);
        if (allOutOfStock) {
          product.isSoldOut = true;
        }
        
        await product.save();
      }
    }

    const newOrder = await Order.create({
      clerkId: userId,
      orderRef,
      items,
      shippingAddress,
      subtotal,
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('Create customer order API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
