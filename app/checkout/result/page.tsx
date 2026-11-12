'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import WinsorLoader from '@/components/WinsorLoader';
import { useCart } from '@/app/context/CartContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';

interface VerifiedOrderItem {
  productId?: string;
  productTitle: string;
  productModelNo?: string;
  productThumbnail?: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

interface VerifiedOrder {
  orderRef: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProvider?: string;
  paymentsLkCheckoutId?: string | null;
  paymentsLkPaymentId?: string | null;
  checkoutSource?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  shippingAddress?: {
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    mobile?: string;
    mobileCode?: string;
  };
  items: VerifiedOrderItem[];
  subtotal: number;
  couponCode?: string | null;
  couponDiscountPercent?: number;
  couponDiscountAmount?: number;
  finalTotal: number;
  cardScheme?: string | null;
  cardLast4?: string | null;
  returnPath?: string;
}

type ConfirmOutcome =
  | { state: 'loading' }
  | { state: 'paid'; order: VerifiedOrder }
  | {
      state: 'canceled' | 'failed' | 'expired';
      reason: string;
      canRetry: boolean;
      retryUrl: string | null;
      returnPath: string;
      orderRef: string;
      checkoutSource?: string | null;
    }
  | {
      state: 'pending';
      gatewayStatus: string;
      canRetry: boolean;
      retryUrl: string | null;
      returnPath: string;
      orderRef: string;
      checkoutSource?: string | null;
    }
  | { state: 'error'; message: string };

function isSafePaymentsLkUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https:\/\/([a-z0-9-]+\.)?payments\.lk\//i.test(url.trim());
}

function formatGatewayStatusLabel(status: string): string {
  switch (status) {
    case 'requires_payment_method':
      return 'awaiting payment method';
    case 'processing':
      return 'processing with issuer';
    case 'succeeded':
      return 'completed';
    case 'failed':
      return 'declined';
    case 'canceled':
      return 'cancelled';
    default:
      return status.replace(/_/g, ' ');
  }
}

function sanitizeReturnPath(path: unknown): string {
  if (typeof path !== 'string') return '/cart';
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/cart';
  return trimmed;
}

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const { clearCart } = useCart();
  const { convertPrice } = useCurrency();

  const orderRefParam = (searchParams.get('ref') || searchParams.get('orderRef') || '').trim();
  const tokenParam = (searchParams.get('token') || '').trim();
  const checkoutIdParam = (
    searchParams.get('checkout_id') ||
    searchParams.get('checkoutId') ||
    ''
  ).trim();
  const canceledParam =
    searchParams.get('flow') === 'cancel' ||
    searchParams.get('canceled') === 'true' ||
    searchParams.get('cancelled') === 'true';

  const [outcome, setOutcome] = useState<ConfirmOutcome>({ state: 'loading' });
  const [checkingAgain, setCheckingAgain] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const cartClearedRef = useRef(false);
  const pollCountRef = useRef(0);

  const verifyPayment = useCallback(
    async (isManualRefresh = false) => {
      if (!orderRefParam || !tokenParam) {
        setOutcome({
          state: 'error',
          message: 'Missing payment verification details in return URL.',
        });
        return;
      }

      if (isManualRefresh) {
        setCheckingAgain(true);
      }

      try {
        const res = await fetch('/api/payment/payments-lk/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: orderRefParam,
            token: tokenParam,
            ...(checkoutIdParam ? { checkoutId: checkoutIdParam } : {}),
            canceled: canceledParam,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data?.data) {
          setOutcome({
            state: 'error',
            message:
              data?.error ||
              'We could not verify this payment session. Please check your order status or contact Winsor Support.',
          });
          return;
        }

        const payload = data.data;
        if (payload.state === 'paid' && payload.order) {
          const verifiedOrder: VerifiedOrder = payload.order;
          setOutcome({ state: 'paid', order: verifiedOrder });

          if (
            !cartClearedRef.current &&
            (verifiedOrder.checkoutSource === 'cart' ||
              verifiedOrder.checkoutSource === 'guest_cart')
          ) {
            cartClearedRef.current = true;
            try {
              await clearCart();
            } catch {
              // Cart clearing best-effort; server already clears signed-in DB cart
            }
          }
          return;
        }

        if (
          payload.state === 'canceled' ||
          payload.state === 'failed' ||
          payload.state === 'expired'
        ) {
          setOutcome({
            state: payload.state,
            reason: payload.reason || 'Payment was not completed.',
            canRetry: Boolean(payload.canRetry && isSafePaymentsLkUrl(payload.retryUrl)),
            retryUrl: isSafePaymentsLkUrl(payload.retryUrl) ? payload.retryUrl : null,
            returnPath: sanitizeReturnPath(payload.returnPath),
            orderRef: payload.orderRef || orderRefParam,
            checkoutSource: payload.checkoutSource || null,
          });
          return;
        }

        setOutcome({
          state: 'pending',
          gatewayStatus: payload.gatewayStatus || 'processing',
          canRetry: Boolean(payload.canRetry && isSafePaymentsLkUrl(payload.retryUrl)),
          retryUrl: isSafePaymentsLkUrl(payload.retryUrl) ? payload.retryUrl : null,
          returnPath: sanitizeReturnPath(payload.returnPath),
          orderRef: payload.orderRef || orderRefParam,
          checkoutSource: payload.checkoutSource || null,
        });
      } catch {
        setOutcome({
          state: 'error',
          message: 'Network error while verifying payment with the gateway.',
        });
      } finally {
        if (isManualRefresh) {
          setCheckingAgain(false);
        }
      }
    },
    [orderRefParam, tokenParam, checkoutIdParam, canceledParam, clearCart]
  );

  useEffect(() => {
    verifyPayment(false);
  }, [verifyPayment]);

  // Poll briefly if gateway settlement lags slightly behind redirect
  useEffect(() => {
    if (outcome.state !== 'pending' || canceledParam) return;
    if (pollCountRef.current >= 4) return;

    const timer = setTimeout(() => {
      pollCountRef.current += 1;
      verifyPayment(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [outcome.state, canceledParam, verifyPayment]);

  const handleCopyRef = (ref: string) => {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    toast.success('Order reference copied!');
  };

  const handleDownloadPdf = (order: VerifiedOrder) => {
    setDownloadingPdf(true);
    try {
      const mobileString =
        order.customerMobile ||
        (order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
          ? `${order.shippingAddress.mobileCode} ${order.shippingAddress.mobile}`.trim()
          : order.shippingAddress?.mobile || '');

      generateReceiptPdf({
        orderRef: order.orderRef,
        date: order.paidAt || order.createdAt || new Date().toISOString(),
        customer: {
          name: order.customerName || 'Valued Patron',
          email: order.customerEmail || '',
          mobile: mobileString,
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          postalCode: order.shippingAddress?.postalCode || '',
          country: order.shippingAddress?.country || 'Sri Lanka',
        },
        items: order.items.map((item) => ({
          productTitle: item.productTitle,
          productModelNo: item.productModelNo,
          colorVariant: item.colorVariant,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: order.subtotal,
        couponCode: order.couponCode || undefined,
        discountPercent: order.couponDiscountPercent || undefined,
        discountAmount: order.couponDiscountAmount || undefined,
        finalTotal: order.finalTotal,
        paymentMethod: 'Payments.lk Card Payment',
        paymentStatus: 'paid',
        mobile: mobileString,
        customerMobile: mobileString,
      });
    } catch {
      toast.error('Unable to generate receipt PDF right now.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRetryPayment = (retryUrl: string | null) => {
    if (!isSafePaymentsLkUrl(retryUrl)) {
      toast.error('Payment link is no longer valid. Please initiate checkout again.');
      return;
    }
    window.location.assign(retryUrl);
  };

  if (outcome.state === 'loading') {
    return <WinsorLoader fullScreen size="lg" label="Verifying Payment…" />;
  }

  return (
    <main className="min-h-[82vh] bg-[#FAF7F0] pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {outcome.state === 'paid' && (
          <div className="bg-white rounded-3xl border border-[#E8DFCE] shadow-[0_24px_60px_-20px_rgba(26,18,9,0.12)] overflow-hidden">
            {/* Luxury Top Banner */}
            <div className="bg-[#1A1209] px-6 sm:px-10 py-8 text-center relative overflow-hidden">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#D4AF37] mb-2">
                Payments.lk Verified Transaction
              </p>
              <h1
                className="text-3xl sm:text-4xl font-semibold text-[#FAF7F0] tracking-tight"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              >
                Order Confirmed
              </h1>
              <p className="mt-2 text-sm text-[#D6CEBF] max-w-md mx-auto">
                Thank you for acquiring with Winsor Maison. Your payment has been confirmed and your timepiece order is now in preparation.
              </p>
            </div>

            <div className="p-6 sm:p-10 space-y-6">
              {/* Order Reference & Payment Details */}
              <div className="bg-[#FAF7F0] border border-[#E8DFCE] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B6914]">
                    Order Reference
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-lg sm:text-xl font-bold tracking-wider text-[#1A1209] font-mono">
                      {outcome.order.orderRef}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyRef(outcome.order.orderRef)}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-[#D4AF37]/50 text-[#8B6914] hover:bg-[#F3E3B8]/40 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Paid via Payments.lk
                  </span>
                  {(outcome.order.cardScheme || outcome.order.cardLast4) && (
                    <p className="mt-1.5 text-xs text-[#6B5D47]">
                      {(outcome.order.cardScheme || 'Card').toUpperCase()}
                      {outcome.order.cardLast4 ? ` •••• ${outcome.order.cardLast4}` : ''}
                    </p>
                  )}
                  {outcome.order.paymentsLkPaymentId && (
                    <p className="mt-0.5 text-[11px] text-[#8B7D66] font-mono">
                      TXN: {outcome.order.paymentsLkPaymentId}
                    </p>
                  )}
                </div>
              </div>

              {/* Purchased Items */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B6914] mb-3">
                  Timepiece Summary
                </h2>
                <div className="divide-y divide-[#F0E9DA] border border-[#E8DFCE] rounded-2xl overflow-hidden bg-white">
                  {outcome.order.items.map((item, idx) => (
                    <div
                      key={`${item.productId || item.productTitle}-${idx}`}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.productThumbnail && (
                          <img
                            src={item.productThumbnail}
                            alt={item.productTitle}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E8DFCE] flex-shrink-0 bg-[#FAF7F0]"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1A1209] truncate">
                            {item.productTitle}
                          </p>
                          <p className="text-xs text-[#6B5D47]">
                            {item.colorVariant ? `${item.colorVariant} • ` : ''}
                            Qty: {item.quantity}
                            {item.productModelNo ? ` • ${item.productModelNo}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#1A1209] whitespace-nowrap">
                        {convertPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}

                  <div className="p-4 bg-[#FAF7F0]/70 space-y-1.5 text-sm">
                    <div className="flex justify-between text-[#6B5D47]">
                      <span>Subtotal</span>
                      <span>{convertPrice(outcome.order.subtotal)}</span>
                    </div>
                    {outcome.order.couponCode && (outcome.order.couponDiscountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Promo ({outcome.order.couponCode})</span>
                        <span>-{convertPrice(outcome.order.couponDiscountAmount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[#E8DFCE] text-base font-bold text-[#1A1209]">
                      <span>Total Paid</span>
                      <span className="text-[#8B6914]">
                        {convertPrice(outcome.order.finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {outcome.order.shippingAddress?.address && (
                <div className="text-xs text-[#6B5D47] bg-[#FAF7F0] rounded-xl px-4 py-3 border border-[#E8DFCE]">
                  <span className="font-semibold text-[#1A1209]">Delivery Destination: </span>
                  {outcome.order.customerName} — {outcome.order.shippingAddress.address},{' '}
                  {outcome.order.shippingAddress.city}
                  {outcome.order.shippingAddress.postalCode
                    ? ` ${outcome.order.shippingAddress.postalCode}`
                    : ''}
                  , {outcome.order.shippingAddress.country || 'Sri Lanka'}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={() => handleDownloadPdf(outcome.order)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#1A1209] text-[#F3E3B8] text-sm font-semibold hover:bg-[#2B2014] transition disabled:opacity-60"
                >
                  {downloadingPdf ? 'Generating Receipt…' : 'Download Official Receipt (PDF)'}
                </button>
                <Link
                  href="/orders/track"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#D4AF37] text-[#8B6914] text-sm font-semibold hover:bg-[#FAF7F0] transition text-center"
                >
                  Track Order Live
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-1 text-xs font-medium text-[#6B5D47]">
                {isSignedIn && (
                  <Link href="/orders" className="hover:text-[#8B6914] underline underline-offset-4">
                    View My Orders
                  </Link>
                )}
                <Link href="/collections" className="hover:text-[#8B6914] underline underline-offset-4">
                  Continue Exploring Collections
                </Link>
              </div>
            </div>
          </div>
        )}

        {(outcome.state === 'canceled' ||
          outcome.state === 'failed' ||
          outcome.state === 'expired') && (
          <div className="bg-white rounded-3xl border border-[#E8DFCE] shadow-[0_24px_60px_-20px_rgba(26,18,9,0.12)] overflow-hidden p-8 sm:p-10 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B6914] mb-1">
                Payments.lk Checkout
              </p>
              <h1
                className="text-2xl sm:text-3xl font-semibold text-[#1A1209]"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              >
                {outcome.state === 'failed'
                  ? 'Payment Was Not Completed'
                  : outcome.state === 'expired'
                  ? 'Checkout Session Expired'
                  : 'Payment Cancelled'}
              </h1>
              <p className="mt-2 text-sm text-[#6B5D47] max-w-md mx-auto">
                {outcome.reason}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F0] border border-[#E8DFCE] text-xs font-mono text-[#1A1209]">
              Ref: {outcome.orderRef}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
              {outcome.canRetry && outcome.retryUrl && (
                <button
                  type="button"
                  onClick={() => handleRetryPayment(outcome.retryUrl)}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3.5 rounded-xl bg-[#8B6914] text-white text-sm font-semibold hover:bg-[#70540F] transition"
                >
                  Retry Payment →
                </button>
              )}
              <Link
                href={outcome.returnPath}
                className="flex-1 inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-[#D4AF37] text-[#1A1209] text-sm font-semibold hover:bg-[#FAF7F0] transition text-center"
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}

        {outcome.state === 'pending' && (
          <div className="bg-white rounded-3xl border border-[#E8DFCE] shadow-[0_24px_60px_-20px_rgba(26,18,9,0.12)] overflow-hidden p-8 sm:p-10 text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#FAF7F0] border border-[#D4AF37]/40 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#8B6914] border-t-transparent animate-spin" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B6914] mb-1">
                Awaiting Confirmation
              </p>
              <h1
                className="text-2xl sm:text-3xl font-semibold text-[#1A1209]"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              >
                Payment Pending Verification
              </h1>
              <p className="mt-2 text-sm text-[#6B5D47] max-w-md mx-auto">
                Your transaction (<span className="font-mono font-semibold">{outcome.orderRef}</span>) is currently{' '}
                <span className="font-semibold">{formatGatewayStatusLabel(outcome.gatewayStatus)}</span> on Payments.lk.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
              <button
                type="button"
                disabled={checkingAgain}
                onClick={() => verifyPayment(true)}
                className="flex-1 px-5 py-3.5 rounded-xl bg-[#1A1209] text-[#F3E3B8] text-sm font-semibold hover:bg-[#2B2014] transition disabled:opacity-60"
              >
                {checkingAgain ? 'Checking Status…' : 'Check Payment Status'}
              </button>
              {outcome.canRetry && outcome.retryUrl && (
                <button
                  type="button"
                  onClick={() => handleRetryPayment(outcome.retryUrl)}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-[#8B6914] text-white text-sm font-semibold hover:bg-[#70540F] transition"
                >
                  Complete Payment →
                </button>
              )}
            </div>

            <div className="pt-1">
              <Link
                href={outcome.returnPath}
                className="text-xs font-medium text-[#6B5D47] hover:text-[#8B6914] underline underline-offset-4"
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}

        {outcome.state === 'error' && (
          <div className="bg-white rounded-3xl border border-[#E8DFCE] shadow-[0_24px_60px_-20px_rgba(26,18,9,0.12)] overflow-hidden p-8 sm:p-10 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B6914] mb-1">
                Payment Verification
              </p>
              <h1
                className="text-2xl sm:text-3xl font-semibold text-[#1A1209]"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              >
                Unable to Verify Payment
              </h1>
              <p className="mt-2 text-sm text-[#6B5D47] max-w-md mx-auto">
                {outcome.message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
              <Link
                href="/orders/track"
                className="flex-1 px-5 py-3.5 rounded-xl bg-[#1A1209] text-[#F3E3B8] text-sm font-semibold hover:bg-[#2B2014] transition text-center"
              >
                Track Your Order
              </Link>
              <Link
                href="/cart"
                className="flex-1 px-5 py-3.5 rounded-xl border border-[#D4AF37] text-[#1A1209] text-sm font-semibold hover:bg-[#FAF7F0] transition text-center"
              >
                Return to Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<WinsorLoader fullScreen size="lg" label="Verifying Payment…" />}>
      <CheckoutResultContent />
    </Suspense>
  );
}
