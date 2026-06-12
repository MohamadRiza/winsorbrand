import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { verifyPermissions } from '@/lib/authHelper';

// POST Adjust Variant Stock (Admin / Staff with permission)
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['inventory_manage']);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { productId, variantId, qty } = body;

    // Validate inputs
    if (!productId || !variantId || qty === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID, Variant ID, and Quantity are required.' },
        { status: 400 }
      );
    }

    const newQty = Number(qty);
    if (isNaN(newQty) || newQty < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a non-negative number.' },
        { status: 400 }
      );
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 }
      );
    }

    // Find variant
    const variant = (product.colorVariants as any).id
      ? (product.colorVariants as any).id(variantId)
      : product.colorVariants.find((v: any) => v._id && v._id.toString() === variantId);
    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Color variant not found.' },
        { status: 404 }
      );
    }

    // Update quantity and inStock flag
    variant.qty = newQty;
    variant.inStock = newQty > 0;

    // Re-evaluate global sold out state (if all variants have qty == 0, isSoldOut is true)
    const anyInStock = product.colorVariants.some(v => v.qty > 0);
    product.isSoldOut = !anyInStock;

    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully.',
      data: {
        productId: product._id,
        variantId: variant._id,
        qty: variant.qty,
        inStock: variant.inStock,
        isSoldOut: product.isSoldOut
      }
    });
  } catch (error: any) {
    console.error('Adjust stock admin API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
