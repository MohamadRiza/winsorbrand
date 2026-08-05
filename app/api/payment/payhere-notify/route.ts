import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/payment/payhere-notify
//
// PayHere calls this URL automatically after every payment attempt.
// This endpoint MUST respond HTTP 200 or PayHere will retry.
//
// Security: We verify the md5sig signature before trusting any data.
//   Signature formula (PayHere spec):
//     localSig = MD5(merchantId + orderId + amount + currency + statusCode + MD5(secret).upper()).upper()
//     if localSig === md5sig → payment is legitimate
//
// PayHere status codes:
//   2  = Success  → mark order paid, move to processing
//   0  = Pending  → do nothing
//  -1  = Cancelled
//  -2  = Failed
//  -3  = Chargedback
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Always return 200 so PayHere does not retry endlessly
  const ok = new NextResponse('', { status: 200 });

  try {
    // PayHere posts application/x-www-form-urlencoded
    const formData = await req.formData();

    const merchantId    = (formData.get('merchant_id')     as string) ?? '';
    const orderId       = (formData.get('order_id')        as string) ?? '';
    const paymentId     = (formData.get('payment_id')      as string) ?? '';
    const payhereAmount = (formData.get('payhere_amount')  as string) ?? '';
    const currency      = (formData.get('payhere_currency') as string) ?? 'LKR';
    const statusCode    = (formData.get('status_code')     as string) ?? '';
    const md5sig        = (formData.get('md5sig')          as string) ?? '';

    // ── 1. Validate merchant ID ───────────────────────────────────────────────
    const ourMerchantId   = process.env.PAYHERE_MERCHANT_ID ?? '';
    const merchantSecret  = process.env.PAYHERE_MERCHANT_SECRET ?? '';

    if (!ourMerchantId || !merchantSecret) {
      console.error('[PayHere Notify] Credentials missing in environment. Cannot verify.');
      return ok;
    }

    if (merchantId !== ourMerchantId) {
      console.warn('[PayHere Notify] Merchant ID mismatch — possible spoofed request. Ignoring.');
      return ok;
    }

    // ── 2. Verify cryptographic signature ─────────────────────────────────────
    const secretHash = createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const hashInput = `${merchantId}${orderId}${payhereAmount}${currency}${statusCode}${secretHash}`;
    const localSig  = createHash('md5')
      .update(hashInput)
      .digest('hex')
      .toUpperCase();

    if (localSig !== md5sig.toUpperCase()) {
      console.warn(`[PayHere Notify] Signature mismatch for order "${orderId}". Ignoring request.`);
      return ok; // Still 200 to prevent retries, but we do NOT update anything
    }

    // ── 3. Process payment status ─────────────────────────────────────────────
    await connectDB();

    const numStatus = parseInt(statusCode, 10);

    if (numStatus === 2) {
      // ✅ Payment successful
      await Order.findOneAndUpdate(
        { orderRef: orderId },
        {
          paymentStatus: 'paid',
          status: 'processing',
          payhereOrderId: paymentId,
        }
      );
      console.log(`[PayHere Notify] ✅ Order "${orderId}" marked PAID. PayHere payment_id: ${paymentId}`);

    } else if (numStatus === -1 || numStatus === -2 || numStatus === -3) {
      // ❌ Payment cancelled / failed / chargedback
      await Order.findOneAndUpdate(
        { orderRef: orderId },
        { paymentStatus: 'failed' }
      );
      console.log(`[PayHere Notify] ❌ Order "${orderId}" payment FAILED/CANCELLED. Status code: ${statusCode}`);

    } else if (numStatus === 0) {
      // ⏳ Pending (authorisation pending on bank side)
      console.log(`[PayHere Notify] ⏳ Order "${orderId}" payment is PENDING. Status code: ${statusCode}`);
    }

    return ok;
  } catch (error: any) {
    // Log but still return 200 to prevent endless retries from PayHere
    console.error('[PayHere Notify] Unexpected error:', error);
    return ok;
  }
}
