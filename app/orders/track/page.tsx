'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useCurrency } from '@/app/context/CurrencyContext';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';
import TrackHeroTypewriter from './TrackHeroTypewriter';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Order Received', color: '#8b6914', bg: 'rgba(139,105,20,0.08)', border: 'rgba(139,105,20,0.25)' },
  processing: { label: 'Processing & Artisan Assembly', color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', border: 'rgba(29,78,216,0.25)' },
  shipped: { label: 'Dispatched & In Transit', color: '#047857', bg: 'rgba(4,120,87,0.08)', border: 'rgba(4,120,87,0.25)' },
  delivered: { label: 'Hand Delivered', color: '#15803d', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.25)' },
  cancelled: { label: 'Cancelled', color: '#b91c1c', bg: 'rgba(185,28,28,0.08)', border: 'rgba(185,28,28,0.25)' },
  cancel_requested: { label: 'Cancellation Requested', color: '#6d28d9', bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)' },
};

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed', sub: 'Details Verified' },
  { key: 'processing', label: 'Artisan Assembly', sub: 'Quality Testing' },
  { key: 'shipped', label: 'In Transit', sub: 'Courier Dispatch' },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy Timepiece' },
];

function getStepIndex(status: string): number {
  switch (status.toLowerCase()) {
    case 'pending': return 0;
    case 'processing': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    case 'cancel_requested': return 0;
    case 'cancelled': return -1;
    default: return 0;
  }
}

function formatTitleCase(str?: string) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

interface OrderItemData {
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderRef: string;
  status: string;
  createdAt: string;
  subtotal: number;
  finalTotal?: number;
  mobile?: string;
  items: OrderItemData[];
  shippingAddress: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    mobile?: string;
    mobileCode?: string;
  };
  guestName?: string;
  guestEmail?: string;
  guestMobile?: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

function OrderTrackingContent() {
  const { convertPrice } = useCurrency();
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();

  const urlRef = searchParams.get('ref')?.trim() || '';
  const urlMobile = searchParams.get('mobile')?.trim() || searchParams.get('phone')?.trim() || '';

  const [orderRef, setOrderRef] = useState(urlRef ? urlRef.toUpperCase() : '');
  const [mobile, setMobile] = useState(urlMobile || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasAutoTrackedRef = useRef(false);

  // Synchronize state if search parameters change in URL
  useEffect(() => {
    if (urlRef && !orderRef) setOrderRef(urlRef.toUpperCase());
    if (urlMobile && !mobile) setMobile(urlMobile);
  }, [urlRef, urlMobile]);

  // Execute tracking query
  const executeTrack = async (targetRef?: string, targetMob?: string) => {
    const ref = (targetRef !== undefined ? targetRef : orderRef).trim().toUpperCase();
    const mob = (targetMob !== undefined ? targetMob : mobile).trim();

    setError('');

    if (!ref) {
      setError('Please enter your order reference number.');
      return;
    }

    // If no mobile provided and user is not signed in, prompt for mobile
    if (!mob && !user?.id) {
      setError('Please enter your registered mobile number to verify your order.');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('ref', ref);
      if (mob) params.set('mobile', mob);
      if (user?.id) params.set('clerkId', user.id);

      const res = await fetch(`/api/orders/guest-track?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        if (data.data.orderRef) {
          setOrderRef(data.data.orderRef);
        }
        if (data.data.mobile) {
          setMobile(data.data.mobile);
        }
        // Smooth scroll to tracking results card
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        setError(data.error || 'Order not found. Please verify your reference number & mobile.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically track on mount if order reference is present in URL
  useEffect(() => {
    if (!urlRef || hasAutoTrackedRef.current) return;

    // Once Clerk auth is resolved (isLoaded), attempt automatic tracking
    if (isLoaded) {
      hasAutoTrackedRef.current = true;
      executeTrack(urlRef, urlMobile);
    }
  }, [urlRef, urlMobile, isLoaded]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack();
  };

  const handleCopyRef = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderRef);
    setCopied(true);
    toast.success(`Reference code "${order.orderRef}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReceipt = () => {
    if (!order) return;
    const isBank = order.paymentMethod === 'bank_transfer' || (order.paymentMethod || '').toLowerCase().includes('bank');
    const isPaid = order.paymentStatus === 'paid';
    const resolvedMobile = mobile || order.customerMobile || order.guestMobile || `${order.shippingAddress?.mobileCode || ''} ${order.shippingAddress?.mobile || ''}`.trim() || order.shippingAddress?.mobile || 'N/A';

    generateReceiptPdf({
      orderRef: order.orderRef,
      date: new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      customer: {
        name: order.customerName || order.guestName || 'Valued Patron',
        email: order.customerEmail || order.guestEmail || 'N/A',
        mobile: resolvedMobile,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode || 'N/A',
        country: order.shippingAddress.country,
      },
      customerMobile: resolvedMobile,
      items: order.items.map(i => ({
        productTitle: i.productTitle,
        productModelNo: i.productModelNo,
        colorVariant: i.colorVariant,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: order.subtotal,
      finalTotal: order.finalTotal || order.subtotal,
      paymentMethod: isBank ? 'Direct Bank Transfer' : 'PayHere Card Payment',
      paymentStatus: isPaid ? 'paid' : 'pending',
    });
    toast.success('Official PDF Receipt downloaded!');
  };

  const statusInfo = order ? (STATUS_CONFIG[order.status] || { label: order.status, color: '#1a1209', bg: 'rgba(26,18,9,0.06)', border: 'rgba(26,18,9,0.2)' }) : null;
  const currentStepIndex = order ? getStepIndex(order.status) : 0;

  return (
    <main>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600;700&display=swap');
        
        .track-page-container {
          min-height: 100vh;
          background: #faf7f0;
          padding: 40px 20px 90px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .track-wrapper {
          max-width: 680px;
          margin: 0 auto;
        }

        /* ── Luxury Card Container ── */
        .track-card {
          background: #FAF7F0;
          border: 1.5px solid rgba(184, 142, 60, 0.22);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 12px 40px rgba(26, 18, 9, 0.04);
          transition: all 0.3s ease;
        }

        .track-input {
          width: 100%;
          box-sizing: border-box;
          background: #faf7f0;
          border: 1px solid rgba(26, 18, 9, 0.12);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #1a1209;
          outline: none;
          transition: all 0.25s ease;
        }
        .track-input:focus {
          border-color: #8b6914;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
        }
        .track-input::placeholder {
          color: rgba(26,18,9,0.38);
        }

        .track-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 600;
          color: #1a1209;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }

        .track-btn {
          width: 100%;
          padding: 16px;
          background: #1a1209;
          color: #ffffff;
          border: 1px solid #1a1209;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 6px 20px rgba(26,18,9,0.12);
        }
        .track-btn:hover:not(:disabled) {
          background: #8b6914;
          border-color: #8b6914;
          box-shadow: 0 10px 28px rgba(139,105,20,0.3);
          transform: translateY(-1px);
        }
        .track-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .item-card-row {
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(26,18,9,0.06);
        }
        .item-card-row:last-child {
          border-bottom: none;
        }

        @keyframes trackFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: trackFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 640px) {
          .track-page-container { padding: 30px 14px 60px; }
          .track-card { padding: 24px 18px; border-radius: 16px; }
        }
      `}</style>

      {/* 🌟 LUXURY HERO BANNER WITH ATELIER BENCH PHOTO */}
      <section className="order-tracking-hero relative w-full min-h-[380px] sm:min-h-[440px] bg-[#0a0a0a] overflow-hidden flex items-center justify-center text-center pt-28 sm:pt-36 pb-16 sm:pb-24">
        <Image
          src="/order_tracking_hero.jpg"
          alt="Winsor Haute Horlogerie Atelier"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf7f0] via-black/45 to-black/70" />
        
        <div className="relative z-10 max-w-2xl px-6">
          <div className="inline-flex items-center gap-2 bg-[#8B6914]/25 border border-[#8B6914]/40 backdrop-blur-md px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B6914] animate-pulse" />
            <span className="text-[10px] font-semibold text-[#d4af37] tracking-[0.25em] uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>
              WINSOR MAISON HOROLOGY LOGISTICS
            </span>
          </div>
          {/* Animated Hero Title & Subtitle with Luxury Typewriter & Erase Effect */}
          <TrackHeroTypewriter />
        </div>
      </section>

      <div className="track-page-container">
        <div className="track-wrapper">

          {/* 🌟 SEARCH FORM CARD */}
          <div className="track-card" style={{ marginBottom: 28 }}>
            <form onSubmit={handleTrack}>
              <div style={{ marginBottom: 20 }}>
                <label className="track-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" />
                  </svg>
                  Order Reference Code *
                </label>
                <input
                  className="track-input"
                  value={orderRef}
                  onChange={e => setOrderRef(e.target.value.toUpperCase())}
                  placeholder="e.g. WG-8F9A2B"
                  autoFocus
                  style={{ fontFamily: "'Cinzel', 'Jost', monospace", letterSpacing: '0.08em', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="track-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Registered Mobile Number *
                </label>
                <input
                  className="track-input"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 711234567 or +94711234567"
                  type="tel"
                />
              </div>

              {error && (
                <div style={{
                  marginTop: 18, background: 'rgba(185,28,28,0.05)',
                  border: '1px solid rgba(185,28,28,0.2)', borderRadius: 12,
                  padding: '14px 18px', fontSize: '13px', color: '#b91c1c',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button className="track-btn" type="submit" disabled={loading} style={{ marginTop: 22 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Searching Records...
                  </span>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Track Timepiece Order
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>
          </div>

          {/* 🌟 ORDER RESULTS CARD */}
          {order && statusInfo && (
            <div ref={resultsRef} className="track-card animate-fade-up">
              
              {/* Header Status & Action Buttons */}
              <div style={{
                background: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
                    Current Order Status
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 600, color: statusInfo.color, fontFamily: "'Cormorant Garamond', serif" }}>
                    {statusInfo.label}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* Copy Ref Button */}
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(139,105,20,0.3)',
                      color: '#8b6914',
                      borderRadius: '10px',
                      padding: '9px 14px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        Copy Ref
                      </>
                    )}
                  </button>

                  {/* Download PDF Receipt Button */}
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    style={{
                      background: '#8b6914',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(139,105,20,0.25)'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    PDF Receipt
                  </button>
                </div>
              </div>

              {/* 🌟 4-STEP VISUAL PROGRESS TIMELINE */}
              {order.status !== 'cancelled' && (
                <div style={{ marginBottom: 32, padding: '20px 16px', background: '#faf7f0', borderRadius: 16, border: '1px solid rgba(139,105,20,0.12)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20, textAlign: 'center' }}>
                    Shipment Journey Progress
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative', textAlign: 'center' }}>
                    {TRACKING_STEPS.map((step, idx) => {
                      const isCompleted = currentStepIndex >= idx;
                      const isCurrent = currentStepIndex === idx;

                      return (
                        <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                          {/* Circle Node */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: isCompleted ? '#8b6914' : '#ffffff',
                            color: isCompleted ? '#ffffff' : 'rgba(26,18,9,0.4)',
                            border: `2px solid ${isCompleted ? '#8b6914' : 'rgba(26,18,9,0.15)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700,
                            boxShadow: isCurrent ? '0 0 0 4px rgba(139,105,20,0.2)' : 'none',
                            transition: 'all 0.3s ease', marginBottom: 8
                          }}>
                            {isCompleted && currentStepIndex > idx ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          
                          {/* Label */}
                          <div style={{
                            fontSize: '11px', fontWeight: isCurrent || isCompleted ? 700 : 500,
                            color: isCompleted ? '#1a1209' : 'rgba(26,18,9,0.4)',
                            lineHeight: 1.25, marginBottom: 2
                          }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: '9px', color: 'rgba(26,18,9,0.45)', display: 'none' }} className="sm:block">
                            {step.sub}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid Summary Info */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                  Order Details Overview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="sm:grid-cols-4">
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Reference</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: "'Cinzel', monospace" }}>{order.orderRef}</div>
                  </div>

                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Order Date</div>
                    <div style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 500 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Client Name</div>
                    <div style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.guestName || 'Valued Client'}</div>
                  </div>

                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Grand Total</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: "'Cinzel', sans-serif" }}>
                      {convertPrice(order.finalTotal || order.subtotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                  Timepieces In This Order ({order.items.length})
                </div>
                <div style={{ border: '1px solid rgba(139,105,20,0.12)', borderRadius: 14, padding: '0 18px', background: '#faf7f0' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-card-row">
                      <div style={{ width: 52, height: 52, position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#ffffff', border: '1px solid rgba(26,18,9,0.08)', flexShrink: 0 }}>
                        <Image
                          src={item.productThumbnail || '/winsor_hero_backgroundremoved.webp'}
                          alt={item.productTitle}
                          fill
                          sizes="52px"
                          style={{ objectFit: 'contain', padding: '4px' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Cormorant Garamond', serif" }}>
                          {item.productTitle}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                          Model: {item.productModelNo || 'N/A'} {item.colorVariant ? `· ${item.colorVariant}` : ''} · Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#8b6914', fontFamily: "'Cinzel', sans-serif", flexShrink: 0 }}>
                        {convertPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
                  Delivery Destination
                </div>
                <div style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.7, background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{formatTitleCase(order.shippingAddress.address)}, {formatTitleCase(order.shippingAddress.city)}, {order.shippingAddress.country === 'LK' ? 'Sri Lanka' : formatTitleCase(order.shippingAddress.country)}</span>
                </div>
              </div>

              {/* Concierge Assistance Banner */}
              <div style={{
                background: '#1a1209', color: '#ffffff', borderRadius: 14, padding: '18px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#d4af37', letterSpacing: '0.05em' }}>
                    Need Assistance With Your Shipment?
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Our dedicated Concierge Service is available 24/7 for shipping inquiries.
                  </div>
                </div>
                <Link
                  href="/customer-care"
                  style={{
                    background: '#8b6914', color: '#ffffff', padding: '8px 16px', borderRadius: 8,
                    fontSize: '11px', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase'
                  }}
                >
                  Contact Concierge →
                </Link>
              </div>

            </div>
          )}

          {/* Back Navigation */}
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link
              href="/collections"
              style={{
                fontSize: '11.5px', color: '#8b6914', textDecoration: 'none',
                letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase',
                borderBottom: '1px dashed rgba(139,105,20,0.4)', paddingBottom: 2,
                transition: 'all 0.2s ease'
              }}
            >
              ← Explore Winsor Timepiece Collections
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function GuestOrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(139,105,20,0.15)', borderTop: '3px solid #8B6914', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
