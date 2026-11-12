import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import {
  getPaymentsLkMode,
  PaymentsLkApiError,
  PaymentsLkPayment,
  PaymentsLkWebhookEvent,
  retrievePaymentsLkCheckout,
  verifyPaymentsLkWebhookSignature,
} from '@/lib/paymentsLk';
import {
  finalizePaidOrderFromCheckout,
  markPendingCardOrderFailed,
} from '@/lib/orderFulfillment';

/**
 * POST /api/payment/payments-lk/webhook
 *
 * Receives asynchronous signed webhook events from Payments.lk.
 * Verifies raw request bytes against `Payments-Signature` before parsing JSON
 * and atomically fulfills/updates orders idempotently.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (rawBody.length > 262_144) {
    return NextResponse.json(
      { success: false, error: 'Webhook payload too large.' },
      { status: 413 }
    );
  }

  const webhookSecret = (process.env.PAYMENTS_LK_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    console.error('[Payments.lk Webhook] PAYMENTS_LK_WEBHOOK_SECRET is not configured. Refusing unsigned webhook.');
    return NextResponse.json(
      { success: false, error: 'Webhook verification is not configured.' },
      { status: 500 }
    );
  }

  const signatureHeader = req.headers.get('payments-signature');
  const sigCheck = verifyPaymentsLkWebhookSignature({
    rawBody,
    signatureHeader,
    webhookSecret,
  });

  if (!sigCheck.valid) {
    console.warn('[Payments.lk Webhook] Invalid signature rejected:', sigCheck.reason);
    return NextResponse.json(
      { success: false, error: 'Invalid webhook signature.' },
      { status: 400 }
    );
  }

  let event: PaymentsLkWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON webhook payload.' },
      { status: 400 }
    );
  }

  if (!event || typeof event.type !== 'string' || !event.data) {
    return NextResponse.json(
      { success: false, error: 'Malformed webhook event.' },
      { status: 400 }
    );
  }

  // Enforce strict mode isolation (test key cannot fulfill live orders or vice versa)
  const expectedMode = getPaymentsLkMode();
  if (event.mode !== expectedMode) {
    console.warn(`[Payments.lk Webhook] Mode mismatch: got ${event.mode}, expected ${expectedMode}. Ignoring.`);
    return NextResponse.json({ received: true, ignored: 'mode_mismatch' }, { status: 200 });
  }

  await connectDB();

  if (event.type === 'payment.succeeded') {
    const payment = event.data as PaymentsLkPayment;
    const checkoutId = typeof payment?.checkoutId === 'string' ? payment.checkoutId.trim() : '';
    const reference = typeof payment?.reference === 'string' ? payment.reference.trim() : '';

    if (!checkoutId || !payment?.id) {
      return NextResponse.json(
        { success: false, error: 'Missing checkoutId or payment id in payment.succeeded event.' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ paymentsLkCheckoutId: checkoutId });

    if (!order) {
      console.warn(`[Payments.lk Webhook] payment.succeeded for unknown checkout=${checkoutId} ref=${reference}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Independently fetch the authoritative Checkout from Payments.lk before fulfilling
    let liveCheckout;
    try {
      liveCheckout = await retrievePaymentsLkCheckout(checkoutId);
    } catch (err) {
      if (err instanceof PaymentsLkApiError && err.status >= 400 && err.status < 500) {
        console.warn(`[Payments.lk Webhook] Rejected unverifiable checkout=${checkoutId}: ${err.message}`);
        return NextResponse.json(
          { success: false, error: 'Unable to verify checkout with Payments.lk.' },
          { status: 400 }
        );
      }
      console.error(`[Payments.lk Webhook] Transient verification error for checkout=${checkoutId}:`, err);
      return NextResponse.json(
        { success: false, error: 'Temporary error verifying checkout with Payments.lk.' },
        { status: 502 }
      );
    }

    const result = await finalizePaidOrderFromCheckout({
      order,
      checkout: liveCheckout,
      eventId: event.id || null,
    });

    if (!result.ok) {
      console.warn(`[Payments.lk Webhook] Rejected fulfillment for ${order.orderRef}: ${result.reason}`);
    } else {
      console.log(`[Payments.lk Webhook] Order ${order.orderRef} confirmed PAID (payment=${payment.id}, alreadyPaid=${result.alreadyPaid})`);
    }
  } else if (event.type === 'payment.failed') {
    const payment = event.data as PaymentsLkPayment;
    const checkoutId = payment.checkoutId || '';
    const reference = payment.reference || '';
    const order = await Order.findOne(
      checkoutId
        ? { $or: [{ paymentsLkCheckoutId: checkoutId }, ...(reference ? [{ orderRef: reference }] : [])] }
        : { orderRef: reference }
    );

    if (order) {
      const reason =
        payment.failure?.reason ||
        payment.failureMessage ||
        'Payment was declined.';
      await markPendingCardOrderFailed({
        orderId: order._id.toString(),
        reason,
      });
      console.log(`[Payments.lk Webhook] Order ${order.orderRef} marked failed: ${reason}`);
    }
  } else if (event.type === 'checkout.expired') {
    const checkoutId = event.data?.id || '';
    if (checkoutId) {
      const order = await Order.findOne({ paymentsLkCheckoutId: checkoutId });
      if (order) {
        await markPendingCardOrderFailed({
          orderId: order._id.toString(),
          reason: 'Checkout session expired.',
        });
        console.log(`[Payments.lk Webhook] Order ${order.orderRef} marked failed due to expired checkout.`);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
