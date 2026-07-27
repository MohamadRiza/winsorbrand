'use client';

import { useState } from 'react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Order Received', color: '#92400e', bg: 'rgba(217,119,6,0.08)', icon: '⏳' },
  processing: { label: 'Processing', color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', icon: '⚙️' },
  shipped: { label: 'Shipped', color: '#065f46', bg: 'rgba(6,95,70,0.08)', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#166534', bg: 'rgba(22,101,52,0.08)', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: 'rgba(153,27,27,0.08)', icon: '❌' },
  cancel_requested: { label: 'Cancellation Requested', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', icon: '🔄' },
};

interface OrderData {
  orderRef: string;
  status: string;
  createdAt: string;
  subtotal: number;
  finalTotal?: number;
  items: {
    productTitle: string;
    productModelNo: string;
    productThumbnail: string;
    colorVariant?: string;
    quantity: number;
    price: number;
  }[];
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
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = order ? (STATUS_LABELS[order.status] || { label: order.status, color: '#1a1209', bg: 'rgba(26,18,9,0.06)', icon: '📦' }) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .track-page {
          min-height: 100vh; background: #faf7f0;
          padding: 120px 20px 80px;
          font-family: 'Jost', sans-serif; color: #1a1209;
        }
        .track-container { max-width: 560px; margin: 0 auto; }
        .track-card {
          background: #fff; border: 1px solid rgba(139,105,20,0.18);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 4px 24px rgba(139,105,20,0.08);
        }
        .track-input {
          width: 100%; box-sizing: border-box;
          background: #faf7f0; border: 1.5px solid rgba(139,105,20,0.2);
          border-radius: 10px; padding: 13px 16px;
          font-family: 'Jost', sans-serif; font-size: 14px; color: #1a1209;
          outline: none; transition: border-color 0.2s ease;
          letter-spacing: 0.02em;
        }
        .track-input:focus { border-color: rgba(139,105,20,0.55); box-shadow: 0 0 0 3px rgba(139,105,20,0.08); }
        .track-input::placeholder { color: rgba(26,18,9,0.35); }
        .track-label {
          display: block; font-size: 10px; font-weight: 700;
          color: rgba(26,18,9,0.5); text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 7px;
        }
        .track-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a1209 0%, #2d1f0a 100%);
          color: #d4af37; border: none; border-radius: 10px;
          cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: all 0.2s ease; margin-top: 18px;
        }
        .track-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2d1f0a 0%, #3d2a10 100%); }
        .track-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .order-item {
          display: flex; gap: 12px; align-items: center;
          padding: 12px 0; border-bottom: 1px solid rgba(26,18,9,0.06);
        }
        .order-item:last-child { border-bottom: none; }
        .section-title {
          font-size: 10px; font-weight: 700; color: rgba(26,18,9,0.45);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;
        }
        @media (max-width: 600px) {
          .track-card { padding: 24px 18px; }
        }
      `}</style>

      <div className="track-page">
        <div className="track-container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(139,105,20,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
              Winsor Maison
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 600, color: '#1a1209', margin: '0 0 10px' }}>
              Track Your Order
            </h1>
            <p style={{ fontSize: '13.5px', color: 'rgba(26,18,9,0.55)', lineHeight: 1.6, margin: 0 }}>
              Enter your order reference and mobile number to check your order status
            </p>
          </div>

          {/* Search Form */}
          <div className="track-card" style={{ marginBottom: 20 }}>
            <form onSubmit={handleTrack}>
              <div style={{ marginBottom: 16 }}>
                <label className="track-label">Order Reference Number</label>
                <input
                  className="track-input"
                  value={orderRef}
                  onChange={e => setOrderRef(e.target.value.toUpperCase())}
                  placeholder="e.g. WG-AB12CD34"
                  autoFocus
                  style={{ fontFamily: 'Jost, monospace', letterSpacing: '0.08em' }}
                />
              </div>
              <div>
                <label className="track-label">Mobile Number (used at checkout)</label>
                <input
                  className="track-input"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 711234567"
                  type="tel"
                />
              </div>

              {error && (
                <div style={{ marginTop: 14, background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: '12.5px', color: '#c62828' }}>
                  {error}
                </div>
              )}

              <button className="track-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Searching...
                  </span>
                ) : '🔍 Track My Order'}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>
          </div>

          {/* Order Result */}
          {order && statusInfo && (
            <div className="track-card" style={{ animation: 'fadeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}>
              <style>{`
                @keyframes fadeSlideIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              {/* Status banner */}
              <div style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`, borderRadius: 12, padding: '16px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{statusInfo.icon}</span>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Order Status
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: statusInfo.color, fontFamily: "'Cormorant Garamond', serif" }}>
                    {statusInfo.label}
                  </div>
                </div>
              </div>

              {/* Order meta */}
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Order Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#faf7f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Reference</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace' }}>{order.orderRef}</div>
                  </div>
                  <div style={{ background: '#faf7f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Order Date</div>
                    <div style={{ fontSize: '12px', color: '#1a1209' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ background: '#faf7f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Customer</div>
                    <div style={{ fontSize: '12px', color: '#1a1209' }}>{order.guestName}</div>
                  </div>
                  <div style={{ background: '#faf7f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace' }}>
                      LKR {(order.finalTotal || order.subtotal).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Items Ordered</div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img
                      src={item.productThumbnail || '/mens-watch-highlight.png'}
                      alt={item.productTitle}
                      style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, background: '#faf7f0', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.productTitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                        {item.colorVariant && `${item.colorVariant} · `}Qty {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', flexShrink: 0 }}>
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery address */}
              <div>
                <div className="section-title">Delivering To</div>
                <div style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.8 }}>
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                </div>
              </div>
            </div>
          )}

          {/* Back to shop */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link
              href="/collections"
              style={{ fontSize: '12px', color: 'rgba(26,18,9,0.5)', textDecoration: 'none', letterSpacing: '0.05em', borderBottom: '1px solid rgba(26,18,9,0.2)', paddingBottom: 2 }}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
