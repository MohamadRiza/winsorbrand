'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Order Received', color: '#8b6914', bg: 'rgba(139,105,20,0.08)', border: 'rgba(139,105,20,0.25)' },
  processing: { label: 'Processing & Assembly', color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', border: 'rgba(29,78,216,0.25)' },
  shipped: { label: 'Shipped & In Transit', color: '#047857', bg: 'rgba(4,120,87,0.08)', border: 'rgba(4,120,87,0.25)' },
  delivered: { label: 'Delivered', color: '#15803d', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.25)' },
  cancelled: { label: 'Cancelled', color: '#b91c1c', bg: 'rgba(185,28,28,0.08)', border: 'rgba(185,28,28,0.25)' },
  cancel_requested: { label: 'Cancellation Requested', color: '#6d28d9', bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)' },
};

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
  items: OrderItemData[];
  shippingAddress: {
    address: string;
    city: string;
    country: string;
  };
  guestName: string;
}

export default function GuestOrderTrackingPage() {
  const [orderRef, setOrderRef] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);

    const ref = orderRef.trim().toUpperCase();
    const mob = mobile.trim();

    if (!ref) { setError('Please enter your order reference number.'); return; }
    if (!mob) { setError('Please enter your mobile number.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/guest-track?ref=${encodeURIComponent(ref)}&mobile=${encodeURIComponent(mob)}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.error || 'Order not found. Please check your details.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderRef);
    setCopied(true);
    toast.success(`Reference code "${order.orderRef}" copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReceipt = () => {
    if (!order) return;
    generateReceiptPdf({
      orderRef: order.orderRef,
      date: new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      customer: {
        name: order.guestName || 'Customer',
        email: 'N/A',
        mobile: mobile,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: 'N/A',
        country: order.shippingAddress.country,
      },
      items: order.items.map(i => ({
        productTitle: i.productTitle,
        productModelNo: i.productModelNo,
        colorVariant: i.colorVariant,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: order.subtotal,
      finalTotal: order.finalTotal || order.subtotal,
      paymentMethod: 'Pay on Delivery / Order Confirmation',
    });
    toast.success('PDF Receipt downloaded successfully!');
  };

  const statusInfo = order ? (STATUS_CONFIG[order.status] || { label: order.status, color: '#1a1209', bg: 'rgba(26,18,9,0.06)', border: 'rgba(26,18,9,0.2)' }) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');
        
        .track-page-bg {
          min-height: 100vh;
          background-image: linear-gradient(to bottom, rgba(250,247,240,0.88), rgba(250,247,240,0.95)), url('/collections_bg_texture.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          padding: 130px 20px 90px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .track-main-wrapper {
          max-width: 620px;
          margin: 0 auto;
        }

        /* ── Crisp Pure White Card ── */
        .track-card-white {
          background: #ffffff;
          border: 1px solid rgba(139,105,20,0.2);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 16px 48px rgba(26,18,9,0.06), 0 2px 6px rgba(139,105,20,0.04);
          transition: all 0.3s ease;
        }

        .track-input-field {
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border: 1.5px solid rgba(139,105,20,0.22);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #1a1209;
          outline: none;
          transition: all 0.2s ease;
        }
        .track-input-field:focus {
          border-color: #8b6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.12);
        }
        .track-input-field::placeholder {
          color: rgba(26,18,9,0.38);
        }

        .track-field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(26,18,9,0.55);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        .track-submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #1a1209 0%, #2d1f0a 100%);
          color: #d4af37;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(26,18,9,0.15);
        }
        .track-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2d1f0a 0%, #3d2a10 100%);
          box-shadow: 0 10px 28px rgba(139,105,20,0.25);
          transform: translateY(-1px);
        }
        .track-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .item-row {
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(26,18,9,0.06);
        }
        .item-row:last-child {
          border-bottom: none;
        }

        @keyframes trackFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-track-fade {
          animation: trackFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 640px) {
          .track-page-bg { padding: 110px 14px 60px; }
          .track-card-white { padding: 24px 20px; border-radius: 16px; }
        }
      `}</style>

      <div className="track-page-bg">
        <div className="track-main-wrapper">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#8b6914',
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10
            }}>
              Winsor Maison Horology
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '42px', fontWeight: 600, color: '#1a1209',
              margin: '0 0 10px', letterSpacing: '0.02em', lineHeight: 1.1
            }}>
              Track Your Order
            </h1>
            <p style={{
              fontSize: '14px', color: 'rgba(26,18,9,0.6)',
              lineHeight: 1.6, margin: 0, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto'
            }}>
              Enter your unique order reference code and registered mobile number below to view realtime status.
            </p>
          </div>

          {/* ── White Search Form Card ───────────────────────────────────── */}
          <div className="track-card-white" style={{ marginBottom: 24 }}>
            <form onSubmit={handleTrack}>
              <div style={{ marginBottom: 18 }}>
                <label className="track-field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" />
                  </svg>
                  Order Reference Code *
                </label>
                <input
                  className="track-input-field"
                  value={orderRef}
                  onChange={e => setOrderRef(e.target.value.toUpperCase())}
                  placeholder="e.g. WG-AB12CD34"
                  autoFocus
                  style={{ fontFamily: 'Jost, monospace', letterSpacing: '0.08em', fontWeight: 600 }}
                />
              </div>

              <div>
                <label className="track-field-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Mobile Number *
                </label>
                <input
                  className="track-input-field"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 711234567"
                  type="tel"
                />
              </div>

              {error && (
                <div style={{
                  marginTop: 16, background: 'rgba(185,28,28,0.05)',
                  border: '1px solid rgba(185,28,28,0.2)', borderRadius: 10,
                  padding: '12px 16px', fontSize: '13px', color: '#b91c1c',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button className="track-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Searching Record...
                  </span>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Track Order Status
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>
          </div>

          {/* ── White Result Card ───────────────────────────────────────── */}
          {order && statusInfo && (
            <div className="track-card-white animate-track-fade">
              {/* Status Header Banner */}
              <div style={{
                background: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
                borderRadius: 14,
                padding: '18px 22px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
                    Current Order Status
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: statusInfo.color, fontFamily: "'Cormorant Garamond', serif" }}>
                    {statusInfo.label}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Copy Ref Button */}
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(139,105,20,0.3)',
                      color: '#8b6914',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease'
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
                      borderRadius: '8px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    PDF Receipt
                  </button>
                </div>
              </div>

              {/* Grid Summary Info */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                  Order Details Overview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Reference</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace' }}>{order.orderRef}</div>
                  </div>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Order Date</div>
                    <div style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 500 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Customer</div>
                    <div style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 500 }}>{order.guestName}</div>
                  </div>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Grand Total</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace' }}>
                      LKR {(order.finalTotal || order.subtotal).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                  Timepieces In This Order
                </div>
                <div style={{ border: '1px solid rgba(139,105,20,0.12)', borderRadius: 12, padding: '0 16px', background: '#faf7f0' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <img
                        src={item.productThumbnail || '/mens-watch-highlight.png'}
                        alt={item.productTitle}
                        style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#ffffff', border: '1px solid rgba(26,18,9,0.08)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.productTitle}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                          Model: {item.productModelNo || 'N/A'} {item.colorVariant ? `· ${item.colorVariant}` : ''} · Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', flexShrink: 0 }}>
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                  Delivery Destination
                </div>
                <div style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.7, background: '#faf7f0', border: '1px solid rgba(139,105,20,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                </div>
              </div>
            </div>
          )}

          {/* Back Navigation */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              href="/collections"
              style={{
                fontSize: '12px', color: '#8b6914', textDecoration: 'none',
                letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase',
                borderBottom: '1px dashed rgba(139,105,20,0.4)', paddingBottom: 2,
                transition: 'all 0.2s ease'
              }}
            >
              ← Explore Collections
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
