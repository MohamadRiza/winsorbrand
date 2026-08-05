import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { uploadToCloudinary } from '@/lib/models/uploadToCloudinary';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payment/bank-receipt
//
// Accepts a base64-encoded bank transfer receipt (PDF / image) from the
// customer, validates it, uploads it to Cloudinary, and stores the URL on
// the order document. The admin then manually verifies and confirms payment.
//
// Security controls:
//   • MIME type validated server-side (never trust file extension alone)
//   • File size limited to 10 MB
//   • Order ownership verified before accepting the upload
//   • Cloudinary folder isolated to winsor/receipts
// ──────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderRef, fileBase64, fileName, mimeType, isGuest = false, guestEmail } = body;

    // ── 1. Presence validation ────────────────────────────────────────────────
    if (!orderRef || !fileBase64 || !mimeType) {
      return NextResponse.json(
        { success: false, error: 'orderRef, fileBase64, and mimeType are required.' },
        { status: 400 }
      );
    }

    // ── 2. MIME type whitelist (server-enforced) ──────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, JPG, PNG, or WEBP are accepted.' },
        { status: 400 }
      );
    }

    // ── 3. File size check (approximate via base64 length) ────────────────────
    // base64 encodes 3 bytes → 4 chars, so raw bytes ≈ base64Length * 0.75
    const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const estimatedBytes = Math.ceil(base64Data.length * 0.75);
    if (estimatedBytes > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum allowed size is 10 MB.' },
        { status: 400 }
      );
    }

    // ── 4. Order ownership verification ──────────────────────────────────────
    let order;

    if (!isGuest) {
      // Signed-in user — verify via Clerk session
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }
      order = await Order.findOne({ orderRef, clerkId: userId });
    } else {
      // Guest user — verify via email address
      if (!guestEmail || typeof guestEmail !== 'string') {
        return NextResponse.json(
          { success: false, error: 'guestEmail is required for guest receipt uploads.' },
          { status: 400 }
        );
      }
      order = await Order.findOne({
        orderRef,
        isGuestOrder: true,
        guestEmail: guestEmail.trim().toLowerCase(),
      });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or you are not authorised to submit a receipt for this order.' },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== 'bank_transfer') {
      return NextResponse.json(
        { success: false, error: 'Receipt upload is only valid for bank transfer orders.' },
        { status: 400 }
      );
    }

    // ── 5. Upload receipt to Cloudinary ───────────────────────────────────────
    const cloudinaryResourceType =
      mimeType === 'application/pdf' ? 'auto' : 'image';

    const asset = await uploadToCloudinary(fileBase64, {
      folder: 'winsor/receipts',
      resourceType: cloudinaryResourceType,
    });

    // ── 6. Persist receipt URL on the order ───────────────────────────────────
    await Order.findOneAndUpdate(
      { orderRef },
      {
        receiptUrl: asset.url,
        receiptPublicId: asset.publicId,
        paymentStatus: 'pending',  // Admin must manually verify before marking paid
      }
    );

    return NextResponse.json({
      success: true,
      data: { receiptUrl: asset.url },
    });
  } catch (error: any) {
    console.error('[Bank Receipt] Upload failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload receipt. Please try again.' },
      { status: 500 }
    );
  }
}
