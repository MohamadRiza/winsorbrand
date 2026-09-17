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

function formatTitleCase(str?: string) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatAddress(addr?: OrderAddress) {
  if (!addr) return 'Boutique Pickup / Standard Delivery';
  const parts = [
    formatTitleCase(addr.address),
    formatTitleCase(addr.city),
    addr.postalCode ? addr.postalCode.toUpperCase() : '',
    addr.country === 'LK' ? 'Sri Lanka' : formatTitleCase(addr.country),
  ].filter(Boolean);
  return parts.join(', ');
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Order Pending', color: '#8B6914', bg: 'rgba(139, 105, 20, 0.1)', border: 'rgba(139, 105, 20, 0.3)' },
  processing: { label: 'Processing Dispatch', color: '#1e5385', bg: 'rgba(30, 83, 133, 0.1)', border: 'rgba(30, 83, 133, 0.3)' },
  shipped: { label: 'In Transit / Shipped', color: '#0d6b50', bg: 'rgba(13, 107, 80, 0.1)', border: 'rgba(13, 107, 80, 0.3)' },
  delivered: { label: 'Delivered', color: '#1b5e20', bg: 'rgba(27, 94, 32, 0.1)', border: 'rgba(27, 94, 32, 0.3)' },
  cancelled: { label: 'Cancelled', color: '#b71c1c', bg: 'rgba(183, 28, 28, 0.1)', border: 'rgba(183, 28, 28, 0.3)' },
  cancel_requested: { label: 'Cancellation Requested', color: '#b88e3c', bg: 'rgba(184, 142, 60, 0.12)', border: 'rgba(184, 142, 60, 0.35)' },
};

export default function CustomerOrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { convertPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Wrong variant selected');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Filter Calculations
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
    processing: orders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
    shipped: orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
    cancelled: orders.filter(o => ['cancelled', 'cancel_requested'].includes((o.status || '').toLowerCase())).length,
  };

  const filteredOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    if (orderFilter === 'pending' && s !== 'pending') return false;
    if (orderFilter === 'processing' && s !== 'processing') return false;
    if (orderFilter === 'shipped' && s !== 'shipped') return false;
    if (orderFilter === 'delivered' && s !== 'delivered') return false;
    if (orderFilter === 'cancelled' && !['cancelled', 'cancel_requested'].includes(s)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = (o.orderRef || '').toLowerCase().includes(q);
      const matchItem = Array.isArray(o.items) && o.items.some(item =>
        (item.productTitle || '').toLowerCase().includes(q) ||
        (item.productModelNo || '').toLowerCase().includes(q) ||
        (item.colorVariant || '').toLowerCase().includes(q)
      );
      if (!matchRef && !matchItem) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch('/api/customer/orders');
        let data: any = { success: false };
        try {
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            data = await res.json();
          }
        } catch (e) {
          console.warn('Failed to parse orders JSON:', e);
        }
        
        if (data.success) {
          setOrders(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to retrieve orders');
        }
      } catch (err: any) {
        console.warn(err);
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
        <div style={{ maxWidth: '450px', width: '100%', background: '#FAF7F0', border: '1.5px solid rgba(184, 142, 60, 0.25)', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 8px 30px rgba(26,18,9,0.04)', textAlign: 'center' }}>
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
          background-color: #FAF7F0;
          min-height: 100vh;
          padding: 120px 24px 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .orders-wrapper {
          max-width: 920px;
          margin: 0 auto;
        }

        .orders-header {
          margin-bottom: 36px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1.5px solid rgba(184, 142, 60, 0.18);
          padding-bottom: 22px;
        }

        .orders-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 6px;
          letter-spacing: 0.02em;
        }

        .orders-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.55);
          margin: 0;
        }

        .profile-link {
          color: #8B6914;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 100px;
          background: rgba(184, 142, 60, 0.08);
          border: 1px solid rgba(184, 142, 60, 0.22);
          transition: all 0.25s ease;
        }

        .profile-link:hover {
          background: #8B6914;
          color: #FAF7F0;
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.25);
        }

        /* ── Luxury Order Filter Bar ── */
        .orders-filter-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1.5px solid rgba(184, 142, 60, 0.18);
        }
        .orders-filter-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          max-width: 100%;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .orders-filter-pills::-webkit-scrollbar {
          display: none;
        }
        .orders-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.03em;
          background: #FAF7F0;
          color: #1a1209;
          border: 1.5px solid rgba(184, 142, 60, 0.22);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .orders-filter-pill:hover {
          border-color: #8B6914;
          background: rgba(184, 142, 60, 0.08);
          color: #8B6914;
        }
        .orders-filter-pill.active {
          background: #1a1209;
          color: #FAF7F0;
          border-color: #1a1209;
          box-shadow: 0 4px 14px rgba(26, 18, 9, 0.18);
        }
        .orders-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(184, 142, 60, 0.18);
          color: #8B6914;
          transition: all 0.25s ease;
        }
        .orders-filter-pill.active .orders-pill-badge {
          background: #8B6914;
          color: #FAF7F0;
        }
        .orders-search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 340px;
        }
        .orders-search-box .search-icon {
          position: absolute;
          left: 14px;
          color: rgba(139, 105, 20, 0.7);
          pointer-events: none;
        }
        .orders-search-input {
          width: 100%;
          padding: 9px 36px 9px 38px;
          border-radius: 100px;
          border: 1.5px solid rgba(184, 142, 60, 0.25);
          background: #FFFFFF;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          color: #1a1209;
          outline: none;
          transition: all 0.25s ease;
        }
        .orders-search-input:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
        }
        .orders-search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          font-size: 16px;
          color: rgba(26, 18, 9, 0.4);
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .orders-search-clear:hover {
          color: #1a1209;
        }

        /* ORDER CARD */
        .order-card {
          background: #FAF7F0;
          border: 1.5px solid rgba(184, 142, 60, 0.22);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(26, 18, 9, 0.03);
          margin-bottom: 32px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .order-card:hover {
          border-color: rgba(184, 142, 60, 0.4);
          box-shadow: 0 12px 36px rgba(184, 142, 60, 0.12);
        }

        .order-card-header {
          background-color: rgba(184, 142, 60, 0.06);
          border-bottom: 1.5px solid rgba(184, 142, 60, 0.15);
          padding: 20px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .order-meta {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }

        .order-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-meta-label {
          font-size: 10.5px;
          color: rgba(26, 18, 9, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .order-meta-value {
          font-size: 13.5px;
          color: #1a1209;
          font-weight: 600;
        }

        .order-status-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 100px;
          border: 1.5px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        /* ORDER BODY */
        .order-card-body {
          padding: 24px 28px;
        }

        /* ORDER ITEMS */
        .order-item-row {
          display: grid;
          grid-template-columns: 84px 1fr auto;
          align-items: center;
          gap: 20px;
          padding: 18px 0;
          border-bottom: 1px dashed rgba(184, 142, 60, 0.18);
        }

        .order-item-row:first-child {
          padding-top: 0;
        }

        .order-item-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .order-item-img {
          width: 84px;
          height: 84px;
          position: relative;
          border-radius: 10px;
          border: 1px solid rgba(184, 142, 60, 0.18);
          background-color: transparent;
          overflow: hidden;
          flex-shrink: 0;
        }

        .order-item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
          color: #1a1209;
          margin: 0;
        }

        .order-item-meta {
          font-size: 12px;
          color: rgba(26, 18, 9, 0.55);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-item-price-calc {
          font-size: 13px;
          font-weight: 600;
          color: #8B6914;
          margin-top: 2px;
        }

        .order-item-total {
          font-size: 17px;
          font-weight: 700;
          color: #1a1209;
          text-align: right;
        }

        /* SHIPPING COLLAPSIBLE / DETAIL BLOCK */
        .order-shipping-section {
          background-color: rgba(184, 142, 60, 0.04);
          border-top: 1.5px solid rgba(184, 142, 60, 0.12);
          padding: 20px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .shipping-info-block {
          font-size: 13px;
          color: rgba(26, 18, 9, 0.7);
          line-height: 1.55;
        }

        .shipping-info-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #8B6914;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .orders-cancel-btn {
          background: rgba(198, 40, 40, 0.04);
          border: 1.5px solid rgba(198, 40, 40, 0.35);
          color: #c62828;
          padding: 9px 22px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .orders-cancel-btn:hover {
          background: #c62828;
          color: #ffffff;
          border-color: #c62828;
          box-shadow: 0 4px 14px rgba(198, 40, 40, 0.25);
        }

        .order-track-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #1a1209;
          color: #FAF7F0;
          border: 1px solid #1a1209;
          padding: 9px 20px;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(26, 18, 9, 0.12);
        }
        .order-track-action-btn:hover {
          background: #8B6914;
          border-color: #8B6914;
          color: #FAF7F0;
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.3);
          transform: translateY(-1px);
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 640px) {
          .orders-container { padding: 90px 16px 60px; }
          .orders-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .order-card-header { padding: 16px 20px; flex-direction: column; align-items: flex-start; }
          .order-meta { gap: 14px 20px; }
          .order-card-body { padding: 18px 20px; }
          .order-item-row { grid-template-columns: 68px 1fr; gap: 14px; }
          .order-item-total { grid-column: 1 / -1; text-align: right; border-top: 1px dashed rgba(184,142,60,0.15); padding-top: 8px; }
          .order-shipping-section { flex-direction: column; align-items: flex-start; gap: 16px; padding: 18px 20px; }
          .text-right-mobile-left { text-align: left !important; }
          .orders-filter-container { flex-direction: column; align-items: stretch; gap: 12px; }
          .orders-search-box { max-width: 100%; }
          .orders-filter-pill { padding: 6px 12px; font-size: 11.5px; }
          .order-customer-actions { flex-direction: column; align-items: stretch !important; gap: 12px; }
          .order-track-action-btn { justify-content: center; width: 100%; box-sizing: border-box; }
          .orders-cancel-btn { width: 100%; text-align: center; }
        }

        /* MODALS */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background-color: rgba(10, 6, 2, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal-box {
          background-color: #FAF7F0;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          padding: 32px;
          box-shadow: 0 24px 60px rgba(26, 18, 9, 0.2);
          position: relative;
          border: 1.5px solid rgba(184, 142, 60, 0.3);
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

          {/* FILTER & SEARCH BAR */}
          {orders.length > 0 && (
            <div className="orders-filter-container">
              <div className="orders-filter-pills">
                {[
                  { key: 'all', label: 'All Orders', count: orderCounts.all },
                  { key: 'pending', label: 'Pending', count: orderCounts.pending },
                  { key: 'processing', label: 'Processing', count: orderCounts.processing },
                  { key: 'shipped', label: 'In Transit', count: orderCounts.shipped },
                  { key: 'delivered', label: 'Delivered', count: orderCounts.delivered },
                  { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOrderFilter(tab.key as any)}
                    className={`orders-filter-pill ${orderFilter === tab.key ? 'active' : ''}`}
                  >
                    <span>{tab.label}</span>
                    <span className="orders-pill-badge">{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="orders-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by Order # or Watch Name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="orders-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="orders-search-clear"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
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
          ) : filteredOrders.length === 0 ? (
            <div className="empty-orders-view">
              <div className="empty-orders-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', margin: '0 0 8px', fontWeight: 500 }}>
                No {orderFilter !== 'all' ? `${orderFilter.toUpperCase()} ` : ''}Orders Found
              </h2>
              <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13.5px', margin: '0 0 24px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                {searchQuery
                  ? `No timepiece orders matched "${searchQuery}". Clear your search query or choose another filter.`
                  : `You currently have no orders in "${orderFilter}" status.`}
              </p>
              <button
                type="button"
                onClick={() => { setOrderFilter('all'); setSearchQuery(''); }}
                className="empty-orders-btn"
              >
                View All Orders ({orders.length})
              </button>
            </div>
          ) : (
            filteredOrders.map(order => {
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
                        <Link
                          href={`/orders/track?ref=${encodeURIComponent(order.orderRef)}${order.shippingAddress?.mobile ? `&mobile=${encodeURIComponent(order.shippingAddress.mobile)}` : ''}`}
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          title="Click to track timepiece live"
                        >
                          <span className="order-meta-value" style={{ fontFamily: 'monospace', color: '#8B6914', fontWeight: 600 }}>
                            {order.orderRef}
                          </span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </Link>
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
                              sizes="84px"
                              style={{ objectFit: 'contain' }}
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
                                <span style={{ color: '#8B6914', fontWeight: 600 }}>Edition: {item.colorVariant}</span>
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
                      <div className="shipping-info-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        Secured Dispatch Address
                      </div>
                      <div style={{ color: '#1a1209', fontWeight: 500 }}>
                        {formatAddress(order.shippingAddress)}
                      </div>
                    </div>
                    
                    <div className="shipping-info-block text-right-mobile-left" style={{ textAlign: 'right' }}>
                      <div className="shipping-info-title" style={{ justifyContent: 'flex-end' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Dispatch Phone Contact
                      </div>
                      <div style={{ color: '#1a1209', fontWeight: 600, fontFamily: 'monospace' }}>
                        {order.shippingAddress?.mobileCode || '+94'} {order.shippingAddress?.mobile || ''}
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER ACTIONS ROW */}
                  <div className="order-customer-actions" style={{ padding: '16px 24px', borderTop: '1px solid rgba(184, 142, 60, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(184, 142, 60, 0.02)' }}>
                    <Link
                      href={`/orders/track?ref=${encodeURIComponent(order.orderRef)}${order.shippingAddress?.mobile ? `&mobile=${encodeURIComponent(order.shippingAddress.mobile)}` : ''}`}
                      className="order-track-action-btn"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Live Tracking
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button 
                          onClick={() => handleCancelRequestClick(order)}
                          className="orders-cancel-btn"
                        >
                          Request Cancellation
                        </button>
                      )}

                      {order.status === 'cancel_requested' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '12px', color: 'rgba(26, 18, 9, 0.55)', fontStyle: 'italic' }}>
                            Reason: {order.cancelReason || 'Not provided'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#8B6914', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Awaiting Admin Approval
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}
