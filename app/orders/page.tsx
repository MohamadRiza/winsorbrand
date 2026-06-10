'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Order Pending', color: '#8B6914', bg: 'rgba(139, 105, 20, 0.06)', border: 'rgba(139, 105, 20, 0.2)' },
  processing: { label: 'Processing', color: '#2b5c8f', bg: 'rgba(43, 92, 143, 0.06)', border: 'rgba(43, 92, 143, 0.2)' },
  shipped: { label: 'Shipped', color: '#0f6e52', bg: 'rgba(15, 110, 82, 0.06)', border: 'rgba(15, 110, 82, 0.2)' },
  delivered: { label: 'Delivered', color: '#1b5e20', bg: 'rgba(27, 94, 32, 0.06)', border: 'rgba(27, 94, 32, 0.2)' },
  cancelled: { label: 'Cancelled', color: '#c62828', bg: 'rgba(198, 40, 40, 0.06)', border: 'rgba(198, 40, 40, 0.2)' },
};

export default function CustomerOrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { convertPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}
