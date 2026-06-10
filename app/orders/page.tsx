'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

interface OrderAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  mobile: string;
  mobileCode: string;
}

interface Order {
  _id: string;
  orderRef: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  subtotal: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'cancel_requested';
  cancelReason?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Order Pending', color: '#8B6914', bg: 'rgba(139, 105, 20, 0.06)', border: 'rgba(139, 105, 20, 0.2)' },
  processing: { label: 'Processing', color: '#2b5c8f', bg: 'rgba(43, 92, 143, 0.06)', border: 'rgba(43, 92, 143, 0.2)' },
  shipped: { label: 'Shipped', color: '#0f6e52', bg: 'rgba(15, 110, 82, 0.06)', border: 'rgba(15, 110, 82, 0.2)' },
  delivered: { label: 'Delivered', color: '#1b5e20', bg: 'rgba(27, 94, 32, 0.06)', border: 'rgba(27, 94, 32, 0.2)' },
  cancelled: { label: 'Cancelled', color: '#c62828', bg: 'rgba(198, 40, 40, 0.06)', border: 'rgba(198, 40, 40, 0.2)' },
  cancel_requested: { label: 'Cancellation Requested', color: '#c9a14a', bg: 'rgba(201, 161, 74, 0.08)', border: 'rgba(201, 161, 74, 0.25)' },
};

export default function CustomerOrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { convertPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Wrong variant selected');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch('/api/customer/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to retrieve orders');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [isSignedIn]);

  // Open Cancel Request Dialog
  const handleCancelRequestClick = (order: Order) => {
    setSelectedOrderForCancel(order);
    setCancelReason('Wrong variant selected');
    setCustomCancelReason('');
    setAgreedToTerms(false);
    setShowCancelModal(true);
  };

  // Submit Cancel Request to Backend
  const handleConfirmCancel = async () => {
    if (!selectedOrderForCancel) return;

    const finalReason = cancelReason === 'Other' ? customCancelReason.trim() : cancelReason;
    if (!finalReason) {
      toast.error('Please specify a cancellation reason.');
      return;
    }

    try {
      setSubmittingCancel(true);
      const res = await fetch(`/api/customer/orders/${selectedOrderForCancel._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: finalReason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request order cancellation.');
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === selectedOrderForCancel._id 
            ? { ...o, status: 'cancel_requested', cancelReason: finalReason }
            : o
        )
      );

      toast.success('Order cancellation requested successfully.');
      setShowCancelModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div className="orders-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(139,105,20,0.1)', borderTopColor: '#8B6914', animation: 'orders-spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.05em' }}>Loading your orders...</p>
        </div>
        <style>{`
          @keyframes orders-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '450px', width: '100%', background: '#ffffff', border: '1px solid rgba(26, 18, 9, 0.08)', borderRadius: '8px', padding: '40px 30px', boxShadow: '0 8px 30px rgba(0,0,0,0.02)', textAlign: 'center' }}>
          <div style={{ color: '#8B6914', marginBottom: '20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', color: '#1a1209', margin: '0 0 12px', fontWeight: 500 }}>Sign In Required</h2>
          <p style={{ color: 'rgba(26,18,9,0.55)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 28px' }}>
            Please sign in to view your timepiece orders and check their dispatch status.
          </p>
          <SignInButton mode="modal">
            <button style={{ width: '100%', background: '#1a1209', color: '#faf7f0', border: 'none', borderRadius: '30px', padding: '14px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }} onMouseEnter={e => e.currentTarget.style.background='#8B6914'} onMouseLeave={e => e.currentTarget.style.background='#1a1209'}>
              Sign In to Account
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

        .orders-container {
          background-color: #f5f5f0;
          min-height: 100vh;
          padding: 120px 24px 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .orders-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }

        .orders-header {
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
          padding-bottom: 20px;
        }

        .orders-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 6px;
        }

        .orders-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.5);
          margin: 0;
        }

        .profile-link {
          color: #8B6914;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }

        .profile-link:hover {
          opacity: 0.8;
        }

        /* ORDER CARD */
        .order-card {
          background: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.015);
          margin-bottom: 28px;
          overflow: hidden;
        }

        .order-card-header {
          background-color: rgba(26, 18, 9, 0.015);
          border-bottom: 1px solid rgba(26, 18, 9, 0.06);
          padding: 18px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .order-meta {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .order-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-meta-label {
          font-size: 10.5px;
          color: rgba(26, 18, 9, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .order-meta-value {
          font-size: 13.5px;
          color: #1a1209;
          font-weight: 600;
        }

        .order-status-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        /* ORDER BODY */
        .order-card-body {
          padding: 24px;
        }

        /* ORDER ITEMS */
        .order-item-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          align-items: center;
          gap: 20px;
          padding: 16px 0;
          border-bottom: 1px dashed rgba(26, 18, 9, 0.06);
        }

        .order-item-row:first-child {
          padding-top: 0;
        }

        .order-item-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .order-item-img {
          width: 80px;
          height: 80px;
          position: relative;
          border-radius: 6px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          background-color: rgba(26, 18, 9, 0.01);
          overflow: hidden;
        }

        .order-item-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .order-item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 600;
          color: #1a1209;
          margin: 0;
        }

        .order-item-meta {
          font-size: 12px;
          color: rgba(26, 18, 9, 0.5);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-item-price-calc {
          font-size: 13px;
          font-weight: 500;
          color: #8B6914;
          margin-top: 2px;
        }

        .order-item-total {
          font-size: 16px;
          font-weight: 600;
          color: #1a1209;
          text-align: right;
        }

        /* SHIPPING COLLAPSIBLE / DETAIL BLOCK */
        .order-shipping-section {
          background-color: rgba(26, 18, 9, 0.01);
          border-top: 1px solid rgba(26, 18, 9, 0.06);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .shipping-info-block {
          font-size: 12.5px;
          color: rgba(26, 18, 9, 0.65);
          line-height: 1.5;
        }

        .shipping-info-title {
          font-size: 10px;
          font-weight: 600;
          color: #8B6914;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .orders-cancel-btn {
          background: transparent;
          border: 1px solid rgba(198, 40, 40, 0.4);
          color: #c62828;
          padding: 8px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .orders-cancel-btn:hover {
          background: rgba(198, 40, 40, 0.05);
          border-color: #c62828;
        }

        /* MODALS */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background-color: rgba(26, 18, 9, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal-box {
          background-color: #ffffff;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          padding: 30px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
          position: relative;
          border: 1px solid rgba(26, 18, 9, 0.08);
        }

        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 600;
          color: #1a1209;
          margin: 0 0 8px;
          text-align: center;
        }

        .modal-subtitle {
          font-size: 13px;
          color: rgba(26, 18, 9, 0.45);
          text-align: center;
          margin: 0 0 24px;
          line-height: 1.4;
        }

        .modal-block {
          border: 1px solid rgba(26, 18, 9, 0.08);
          background-color: rgba(26, 18, 9, 0.01);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 18px;
          font-size: 12.5px;
          line-height: 1.5;
        }

        .modal-block-header {
          font-size: 10.5px;
          font-weight: 600;
          color: #8B6914;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .modal-btn.cancel {
          border: 1px solid rgba(26, 18, 9, 0.15);
          background: #ffffff;
          color: #1a1209;
        }

        .modal-btn.cancel:hover:not(:disabled) {
          background-color: rgba(26, 18, 9, 0.04);
        }

        .modal-btn.confirm {
          border: none;
          background-color: #8B6914;
          color: #ffffff;
        }

        .modal-btn.confirm:hover:not(:disabled) {
          background-color: #1a1209;
        }
        
        .modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* EMPTY VIEW */
        .empty-orders-view {
          text-align: center;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.08);
          padding: 80px 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.01);
        }

        .empty-orders-icon {
          color: rgba(26, 18, 9, 0.15);
          margin-bottom: 20px;
        }

        .empty-orders-btn {
          display: inline-flex;
          background-color: #1a1209;
          color: #faf7f0;
          border: none;
          border-radius: 30px;
          padding: 12px 36px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s;
        }

        .empty-orders-btn:hover {
          background-color: #8B6914;
          box-shadow: 0 4px 14px rgba(139,105,20,0.25);
        }

        @media (max-width: 768px) {
          .orders-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .order-card-header {
            padding: 16px;
          }

          .order-meta {
            gap: 16px;
          }

          .order-card-body {
            padding: 16px;
          }

          .order-item-row {
            grid-template-columns: 64px 1fr;
            gap: 14px;
            padding: 14px 0;
          }

          .order-item-img {
            width: 64px;
            height: 64px;
          }

          .order-item-total {
            grid-column: 2;
            text-align: left;
            margin-top: 6px;
            border-top: 1px dashed rgba(26,18,9,0.06);
            padding-top: 6px;
          }

          .order-shipping-section {
            padding: 14px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }
      `}</style>

      {/* CANCELLATION REQUEST MODAL */}
      {showCancelModal && selectedOrderForCancel && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h3 className="modal-title" style={{ color: '#c62828' }}>Cancel Order Request</h3>
            <p className="modal-subtitle">
              Order Ref: <strong style={{ color: '#1a1209', fontFamily: 'monospace' }}>{selectedOrderForCancel.orderRef}</strong>
            </p>

            <div className="modal-block">
              <div className="modal-block-header">Reason for Cancellation</div>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(26, 18, 9, 0.15)',
                  background: '#ffffff',
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '13.5px',
                  color: '#1a1209',
                  marginBottom: '12px',
                  outline: 'none',
                }}
              >
                <option value="Wrong variant selected">Wrong variant/color selected</option>
                <option value="Changed my mind">Changed my mind / Do not need anymore</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Delivery time too long">Delivery time is too long</option>
                <option value="Other">Other (specify below)</option>
              </select>

              {(cancelReason === 'Other' || cancelReason === '') && (
                <textarea
                  value={customCancelReason}
                  onChange={e => setCustomCancelReason(e.target.value)}
                  placeholder="Please describe your reason for cancellation..."
                  maxLength={300}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(26, 18, 9, 0.15)',
                    background: '#ffffff',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '13px',
                    color: '#1a1209',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              )}
            </div>

            <div className="modal-block" style={{ fontSize: '12px', color: 'rgba(26, 18, 9, 0.7)' }}>
              <div className="modal-block-header" style={{ color: '#c62828' }}>Cancellation Terms & Conditions</div>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Cancellation requests are subject to approval by the store administrator.</li>
                <li>If the order has already been shipped or processed, the request might be rejected.</li>
                <li>Once approved by the admin, a full refund will be processed back to your original payment source within **24 hours**.</li>
                <li>Reserved timepiece variant stock quantities will be restored automatically upon approval.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 4px 28px' }}>
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#8B6914',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="agree-terms" style={{ fontSize: '13px', color: '#1a1209', cursor: 'pointer', fontWeight: 500 }}>
                I agree to the cancellation terms and conditions
              </label>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowCancelModal(false)}
                disabled={submittingCancel}
              >
                Close
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={handleConfirmCancel}
                disabled={submittingCancel || !agreedToTerms || (cancelReason === 'Other' && !customCancelReason.trim())}
                style={{
                  backgroundColor: '#c62828',
                  color: '#ffffff',
                }}
              >
                {submittingCancel ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="orders-container">
        <div className="orders-wrapper">
          
          <div className="orders-header">
            <div>
              <h1 className="orders-title">Timepiece Orders</h1>
              <p className="orders-subtitle">Track your handcrafted timepiece dispatch and delivery status.</p>
            </div>
            <Link href="/profile" className="profile-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Shipping Profile
            </Link>
          </div>

          {error && (
            <div style={{ padding: '16px', background: 'rgba(198, 40, 40, 0.05)', border: '1px solid rgba(198, 40, 40, 0.2)', color: '#c62828', borderRadius: '6px', fontSize: '13.5px', marginBottom: '24px' }}>
              Error: {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="empty-orders-view">
              <div className="empty-orders-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#1a1209', margin: '0 0 10px', fontWeight: 500 }}>No Orders Found</h2>
              <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13.5px', margin: '0 0 28px' }}>
                You have not placed any timepiece orders yet. Browse our boutique collections.
              </p>
              <Link href="/collections" className="empty-orders-btn">
                Discover Timepieces
              </Link>
            </div>
          ) : (
            orders.map(order => {
              const statusCfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={order._id} className="order-card">
                  
                  {/* CARD HEADER */}
                  <div className="order-card-header">
                    <div className="order-meta">
                      <div className="order-meta-item">
                        <span className="order-meta-label">Reference</span>
                        <span className="order-meta-value" style={{ fontFamily: 'monospace', color: '#8B6914' }}>
                          {order.orderRef}
                        </span>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">Order Placed</span>
                        <span className="order-meta-value">{orderDate}</span>
                      </div>
                      <div className="order-meta-item">
                        <span className="order-meta-label">Selected Items</span>
                        <span className="order-meta-value">
                          {order.items.reduce((sum, it) => sum + it.quantity, 0)} timepiece(s)
                        </span>
                      </div>
                    </div>
                    
                    <span 
                      className="order-status-badge" 
                      style={{
                        color: statusCfg.color,
                        backgroundColor: statusCfg.bg,
                        borderColor: statusCfg.border,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* CARD BODY: ORDERED PRODUCTS */}
                  <div className="order-card-body">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="order-item-img">
                          {item.productThumbnail ? (
                            <Image
                              src={item.productThumbnail}
                              alt={item.productTitle}
                              fill
                              sizes="80px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'rgba(26,18,9,0.04)' }} />
                          )}
                        </div>
                        
                        <div className="order-item-details">
                          <h4 className="order-item-title">{item.productTitle}</h4>
                          <div className="order-item-meta">
                            <span>Model: {item.productModelNo}</span>
                            {item.colorVariant && (
                              <>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(26,18,9,0.2)' }} />
                                <span style={{ color: '#8B6914', fontWeight: 500 }}>Edition: {item.colorVariant}</span>
                              </>
                            )}
                          </div>
                          <div className="order-item-price-calc">
                            {convertPrice(item.price)} × {item.quantity}
                          </div>
                        </div>

                        <div className="order-item-total">
                          {convertPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SHIPPING INFO FOOTER */}
                  <div className="order-shipping-section">
                    <div className="shipping-info-block">
                      <div className="shipping-info-title">Secured Dispatch Address</div>
                      {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </div>
                    
                    <div className="shipping-info-block" style={{ textAlign: 'right' }}>
                      <div className="shipping-info-title">Dispatch Phone Contact</div>
                      {order.shippingAddress.mobileCode} {order.shippingAddress.mobile}
                    </div>
                  </div>

                  {/* CUSTOMER ACTIONS ROW */}
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(26, 18, 9, 0.06)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(26, 18, 9, 0.005)' }}>
                      <button 
                        onClick={() => handleCancelRequestClick(order)}
                        className="orders-cancel-btn"
                      >
                        Request Cancellation
                      </button>
                    </div>
                  )}

                  {order.status === 'cancel_requested' && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(26, 18, 9, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(201, 161, 74, 0.02)' }}>
                      <span style={{ fontSize: '12.5px', color: 'rgba(26, 18, 9, 0.55)', fontStyle: 'italic' }}>
                        Reason: {order.cancelReason || 'Not provided'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8B6914', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Awaiting Admin Approval
                      </span>
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}
