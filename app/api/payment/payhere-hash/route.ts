import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payment/payhere-hash
//
// Generates the MD5 hash required for PayHere payment initiation.
// The merchant secret NEVER leaves the server.
//
// Hash algorithm (PayHere spec):
//   Step 1:  secretHash = MD5(merchantSecret).toUpperCase()
//   Step 2:  hash = MD5(merchantId + orderId + amount + currency + secretHash).toUpperCase()
//
// Supports both signed-in users and guest orders.
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderRef, amount, currency = 'LKR', isGuest = false, guestEmail } = body;

    // ── 1. Basic input validation ─────────────────────────────────────────────
    if (!orderRef || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: orderRef and a positive amount are required.' },
        { status: 400 }
      );
    }

    // ── 2. Authorization verification ─────────────────────────────────────────
    if (!isGuest) {
      // Signed-in user: verify via Clerk session
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }
      await connectDB();
      const existingOrder = await Order.findOne({ orderRef });
      if (existingOrder && existingOrder.clerkId !== userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Guest user: verify guest email format
      if (!guestEmail || typeof guestEmail !== 'string') {
        return NextResponse.json(
          { success: false, error: 'guestEmail is required for guest payment.' },
          { status: 400 }
        );
      }
      await connectDB();
      const existingOrder = await Order.findOne({ orderRef });
      if (existingOrder && existingOrder.guestEmail !== guestEmail.trim().toLowerCase()) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // ── 3. Load PayHere credentials from environment ──────────────────────────
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const isSandbox = process.env.PAYHERE_SANDBOX === 'true';

    if (!merchantId || !merchantSecret) {
      console.error('[PayHere Hash] Merchant credentials not configured in environment variables.');
      return NextResponse.json(
        { success: false, error: 'Payment gateway is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // ── 4. Compute hash (server-side only) ────────────────────────────────────
    // Amount must be formatted to 2 decimal places per PayHere specification
    const formattedAmount = amount.toFixed(2);

    // Step 1: Hash the merchant secret
    const secretHash = createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    // Step 2: Compute the final payment hash
    const hashInput = `${merchantId}${orderRef}${formattedAmount}${currency}${secretHash}`;
    const hash = createHash('md5')
      .update(hashInput)
      .digest('hex')
      .toUpperCase();

    return NextResponse.json({
      success: true,
      data: {
        hash,
        merchantId,
        isSandbox,
        formattedAmount,
        currency,
      },
    });
  } catch (error: any) {
    console.error('[PayHere Hash] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate payment hash. Please try again.' },
      { status: 500 }
    );
  }
}
