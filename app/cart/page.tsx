'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useCart } from '@/app/context/CartContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { cartItems, loading: cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { convertPrice } = useCurrency();

  // Selection state
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modal & success states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  // Fetch customer profile details if signed in
  useEffect(() => {
    if (!isSignedIn) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      setProfileLoading(true);
      try {
        const res = await fetch('/api/customer/profile');
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [isSignedIn]);

  // Sync selection state when cart items change
  useEffect(() => {
    const nextSelected = { ...selectedItems };
    let changed = false;

    cartItems.forEach(item => {
      const key = `${item.productId}-${item.colorVariant || ''}`;
      if (nextSelected[key] === undefined) {
        nextSelected[key] = true; // Select by default when added
        changed = true;
      }
    });

    // Clean up keys for items no longer in cart
    Object.keys(nextSelected).forEach(key => {
      const exists = cartItems.some(item => `${item.productId}-${item.colorVariant || ''}` === key);
      if (!exists) {
        delete nextSelected[key];
        changed = true;
      }
    });

    if (changed) {
      setSelectedItems(nextSelected);
    }
  }, [cartItems]);

  // Check if profile is complete
  const isProfileComplete = !!(
    profile &&
    profile.mobile &&
    profile.mobileCode &&
    profile.address &&
    profile.city &&
    profile.postalCode &&
    profile.country
  );

  // Toggle selection
  const toggleItem = (productId: string, colorVariant?: string) => {
    const key = `${productId}-${colorVariant || ''}`;
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Select all / Deselect all
  const allSelected = cartItems.length > 0 && cartItems.every(item => {
    const key = `${item.productId}-${item.colorVariant || ''}`;
    return selectedItems[key];
  });

  const toggleSelectAll = () => {
    const nextVal = !allSelected;
    const nextSelected: { [key: string]: boolean } = {};
    cartItems.forEach(item => {
      const key = `${item.productId}-${item.colorVariant || ''}`;
      nextSelected[key] = nextVal;
    });
    setSelectedItems(nextSelected);
  };

  // Calculations for selected items
  const selectedItemsList = cartItems.filter(item => {
    const key = `${item.productId}-${item.colorVariant || ''}`;
    return selectedItems[key];
  });

  const selectedSubtotal = selectedItemsList.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const selectedCount = selectedItemsList.reduce((acc, item) => acc + item.quantity, 0);

  // Handle Checkout Click
  const handleCheckoutClick = () => {
    if (selectedItemsList.length === 0) {
      toast.error('Please select at least one timepiece to checkout.');
      return;
    }

    if (!isSignedIn) {
      toast.error('Please sign in to proceed to checkout.');
      return;
    }

    if (!isProfileComplete) {
      toast.error('Please complete your shipping address details in your profile first.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Place order mock action
  const handlePlaceOrder = async () => {
    try {
      const ref = `WNS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const orderItems = selectedItemsList.map(item => ({
        productId: item.productId,
        productTitle: item.product?.title || 'Unknown Timepiece',
        productModelNo: item.product?.modelNo || 'N/A',
        productThumbnail: item.product?.thumbnail?.url || '',
        colorVariant: item.colorVariant,
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef: ref,
          items: orderItems,
          shippingAddress: {
            address: profile.address,
            city: profile.city,
            postalCode: profile.postalCode,
            country: profile.country,
            mobile: profile.mobile,
            mobileCode: profile.mobileCode,
          },
          subtotal: selectedSubtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record timepiece purchase');
      }

      setOrderRef(ref);
      
      // Clear the items from cart context (mutates DB if signed in)
      await clearCart();
      
      setOrderSuccess(true);
      setShowConfirmModal(false);
      toast.success('Timepiece purchase successful!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Order placement failed. Please try again.');
    }
  };

  if (cartLoading || !userLoaded) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-circle" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(139,105,20,0.1)', borderTopColor: '#8B6914', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.05em' }}>Loading Shopping Bag...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

        .cart-container {
          background-color: #f5f5f0;
          min-height: 100vh;
          padding: 120px 40px 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .cart-wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* HEADER BLOCK */
        .cart-header-section {
          margin-bottom: 24px;
        }
        
        .cart-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 4px;
        }

        .cart-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.5);
          margin: 0;
        }

        /* LAYOUT GRID */
        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: flex-start;
        }

        /* LEFT BLOCK - ITEMS CONTAINER (AMAZON-STYLE PANEL) */
        .cart-items-panel {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }

        .store-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
          background-color: rgba(26, 18, 9, 0.01);
        }

        .store-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .store-badge {
          background: #8B6914;
          color: #ffffff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 2.5px 6px;
          border-radius: 3px;
        }

        .store-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1209;
        }

        .store-shipping-notice {
          font-size: 12px;
          color: #2e7d32;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        /* SELECT ALL CONTROL ROW */
        .select-all-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background-color: #ffffff;
          border-bottom: 1px solid rgba(26, 18, 9, 0.06);
          font-size: 13px;
          color: rgba(26, 18, 9, 0.65);
          font-weight: 500;
        }

        /* PREMIUM CHECKBOX SYSTEM */
        .custom-checkbox {
          width: 19px;
          height: 19px;
          border: 2px solid rgba(26, 18, 9, 0.25);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: #ffffff;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .custom-checkbox:hover {
          border-color: #8B6914;
        }

        .custom-checkbox.checked {
          background-color: #8B6914;
          border-color: #8B6914;
        }

        /* ITEM CARD ROW */
        .cart-item-card {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          align-items: center;
          gap: 24px;
          padding: 24px;
          border-bottom: 1px solid rgba(26, 18, 9, 0.06);
          background-color: #ffffff;
          transition: background-color 0.2s;
        }

        .cart-item-card:last-child {
          border-bottom: none;
        }

        .cart-item-card:hover {
          background-color: rgba(26, 18, 9, 0.005);
        }

        .cart-item-img-container {
          width: 110px;
          height: 110px;
          position: relative;
          border-radius: 6px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          background-color: rgba(26, 18, 9, 0.015);
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .cart-item-img-container:hover {
          transform: scale(1.02);
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
          color: #1a1209;
          margin: 0;
          line-height: 1.25;
          transition: color 0.2s;
        }
        
        .item-title:hover {
          color: #8B6914;
        }

        .item-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          font-size: 11.5px;
          color: rgba(26, 18, 9, 0.5);
          margin-top: 2px;
        }

        .meta-divider {
          width: 1px;
          height: 10px;
          background-color: rgba(26, 18, 9, 0.15);
        }

        .item-variant-tag {
          font-size: 11.5px;
          color: #8B6914;
          font-weight: 500;
        }

        .item-stock-status {
          font-size: 11.5px;
          color: #2e7d32;
          font-weight: 500;
        }

        /* ACTIONS PANEL (Qty + Remove / Wishlist) */
        .item-actions-panel {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 14px;
        }

        .qty-controller {
          display: flex;
          align-items: center;
          border: 1px solid rgba(26, 18, 9, 0.15);
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 13px;
          color: #1a1209;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          font-weight: 500;
        }

        .qty-btn:hover:not(:disabled) {
          background: rgba(26, 18, 9, 0.05);
        }

        .qty-btn:disabled {
          color: rgba(26, 18, 9, 0.25);
          cursor: not-allowed;
        }

        .qty-val {
          width: 32px;
          text-align: center;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1209;
        }

        .text-action-btn {
          background: none;
          border: none;
          color: rgba(26, 18, 9, 0.45);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 0;
        }

        .text-action-btn:hover {
          color: #8B6914;
        }
        
        .text-action-btn.delete:hover {
          color: #c62828;
        }

        /* PRICING ALIGNMENT (FAR RIGHT, AMAZON STYLE) */
        .item-price-column {
          text-align: right;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-price-total {
          font-size: 18px;
          font-weight: 600;
          color: #8B6914;
        }

        .item-price-unit {
          font-size: 11.5px;
          color: rgba(26, 18, 9, 0.4);
        }

        /* RIGHT BLOCK - SUMMARY SIDEBAR (AMAZON-STYLE) */
        .cart-summary-panel {
          background: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 8px;
          padding: 24px;
          position: sticky;
          top: 110px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .summary-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px;
          color: #1a1209;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
          padding-bottom: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(26, 18, 9, 0.6);
          margin-bottom: 12px;
        }

        .summary-row.total-row {
          border-top: 1px solid rgba(26, 18, 9, 0.08);
          padding-top: 16px;
          margin-top: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #1a1209;
          margin-bottom: 24px;
        }

        .shipping-detail-txt {
          color: #2e7d32;
          font-weight: 600;
        }

        .checkout-action-btn {
          width: 100%;
          background-color: #1a1209;
          color: #faf7f0;
          border: none;
          border-radius: 30px; /* rounded pill like amazon/ali */
          padding: 15px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .checkout-action-btn:hover:not(:disabled) {
          background-color: #8B6914;
          box-shadow: 0 4px 14px rgba(139,105,20,0.25);
        }

        .checkout-action-btn:disabled {
          background-color: rgba(26, 18, 9, 0.12);
          color: rgba(26, 18, 9, 0.35);
          cursor: not-allowed;
        }

        /* GUARD BANNER BLOCKS INSIDE SIDEBAR */
        .guard-banner {
          border-radius: 6px;
          padding: 14px 16px;
          margin-bottom: 18px;
          font-size: 12px;
          line-height: 1.45;
          border: 1px solid transparent;
        }

        .banner-warning {
          background-color: rgba(139, 105, 20, 0.05);
          border-color: rgba(139, 105, 20, 0.2);
          color: #8B6914;
        }

        .banner-title {
          font-weight: 600;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
        }

        .banner-text {
          margin: 0 0 10px;
          color: rgba(139, 105, 20, 0.9);
        }

        /* SECURITY BADGES block */
        .security-badges {
          margin-top: 20px;
          border-top: 1px solid rgba(26, 18, 9, 0.06);
          padding-top: 16px;
          text-align: center;
        }

        .security-badge-title {
          font-size: 11px;
          color: rgba(26, 18, 9, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .payment-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0.5;
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

        .modal-btn.cancel:hover {
          background-color: rgba(26, 18, 9, 0.04);
        }

        .modal-btn.confirm {
          border: none;
          background-color: #8B6914;
          color: #ffffff;
        }

        .modal-btn.confirm:hover {
          background-color: #1a1209;
        }

        /* SUCCESS STATE SCREEN */
        .success-screen {
          max-width: 580px;
          margin: 40px auto 0;
          text-align: center;
          background: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 8px;
          padding: 48px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
        }

        .success-tick {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(46, 125, 50, 0.08);
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .ref-box {
          background: rgba(26, 18, 9, 0.015);
          border: 1px solid rgba(26, 18, 9, 0.06);
          padding: 14px 20px;
          border-radius: 6px;
          margin-bottom: 28px;
          display: inline-block;
        }

        /* EMPTY STATE VIEW */
        .empty-cart-view {
          text-align: center;
          padding: 80px 24px;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.08);
        }

        .empty-cart-icon {
          color: rgba(26, 18, 9, 0.18);
          margin-bottom: 16px;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .cart-container {
            padding: 100px 24px 60px;
          }
          .cart-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cart-summary-panel {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .cart-item-card {
            grid-template-columns: auto 1fr;
            gap: 16px;
            padding: 16px;
            position: relative;
          }
          
          .custom-checkbox {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 10;
          }

          .cart-item-img-container {
            width: 80px;
            height: 80px;
            margin-left: 24px;
          }

          .item-price-column {
            grid-column: 2;
            text-align: left;
            min-width: 0;
            margin-top: 10px;
            border-top: 1px dashed rgba(26, 18, 9, 0.08);
            padding-top: 10px;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .item-actions-panel {
            grid-column: 1 / span 2;
            justify-content: space-between;
            margin-top: 12px;
          }
          
          .store-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding: 14px 16px;
          }
        }
      `}</style>

      {/* CONFIRMATION PURCHASE MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Confirm Purchase</h3>
            <p className="modal-subtitle">
              Verify your dispatch address and the selected timepieces before completing checkout.
            </p>

            <div className="modal-block">
              <div className="modal-block-header">Contact Patron</div>
              <p style={{ margin: 0, color: '#1a1209' }}>
                <strong>Email:</strong> {profile?.email}<br />
                <strong>Mobile:</strong> {profile?.mobileCode} {profile?.mobile}
              </p>
            </div>

            <div className="modal-block">
              <div className="modal-block-header">Delivery Destination</div>
              <p style={{ margin: 0, color: '#1a1209' }}>
                {profile?.address}<br />
                {profile?.city}, {profile?.postalCode}<br />
                {profile?.country}
              </p>
              <div style={{ marginTop: '8px' }}>
                <Link href="/profile" onClick={() => setShowConfirmModal(false)} style={{ color: '#8B6914', fontSize: '11.5px', textDecoration: 'underline', fontWeight: 500 }}>
                  Edit Shipping Profile
                </Link>
              </div>
            </div>

            <div className="modal-block">
              <div className="modal-block-header">Purchase Timepieces ({selectedCount})</div>
              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedItemsList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(26, 18, 9, 0.7)' }}>
                      {item.product?.title} {item.colorVariant ? `(${item.colorVariant})` : ''} × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600, color: '#8B6914' }}>
                      {convertPrice((item.product?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', margin: '20px 0 28px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(26,18,9,0.5)' }}>Total Amount:</span>
              <span style={{ fontSize: '22px', fontWeight: 600, color: '#8B6914' }}>{convertPrice(selectedSubtotal)}</span>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-container">
        <div className="cart-wrapper">
          {orderSuccess ? (
            /* PURCHASE SUCCESS SCREEN */
            <div className="success-screen">
              <div className="success-tick">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#1a1209', margin: '0 0 10px', fontWeight: 500 }}>
                Timepiece Order Placed!
              </h2>
              <p style={{ fontSize: '14.5px', color: 'rgba(26, 18, 9, 0.55)', margin: '0 0 24px', lineHeight: 1.5 }}>
                Thank you for choosing Winsor. Your handcrafted timepiece order has been successfully recorded. Our boutique dispatch will email courier information shortly.
              </p>
              
              <div className="ref-box">
                <p style={{ margin: '0 0 4px', fontSize: '10.5px', color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                  Transaction Reference
                </p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#8B6914', fontFamily: 'monospace' }}>
                  {orderRef}
                </p>
              </div>

              <div>
                <Link href="/collections" className="checkout-action-btn" style={{ width: 'auto', display: 'inline-flex', padding: '12px 36px', textDecoration: 'none' }}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* PAGE HEADER */}
              <div className="cart-header-section">
                <h1 className="cart-title">Shopping Bag</h1>
                <p className="cart-subtitle">
                  {cartItems.length === 0 
                    ? 'Your shopping bag is empty.' 
                    : `You have ${cartItems.length} timepiece${cartItems.length > 1 ? 's' : ''} in your bag.`}
                </p>
              </div>

              {cartItems.length === 0 ? (
                /* EMPTY BAG VIEW */
                <div className="empty-cart-view">
                  <div className="empty-cart-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <h2 className="empty-cart-title">Your shopping bag is empty.</h2>
                  <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13.5px', margin: '0 0 28px' }}>
                    Indulge in our collection of handcrafted, high-precision luxury timepieces.
                  </p>
                  <Link href="/collections" className="checkout-action-btn" style={{ width: 'auto', display: 'inline-flex', padding: '12px 36px', textDecoration: 'none' }}>
                    Discover Timepieces
                  </Link>
                </div>
              ) : (
                /* CART LAYOUT GRID */
                <div className="cart-grid">
                  
                  {/* Left Column: Items Panel */}
                  <div className="cart-items-panel">
                    
                    {/* Store / Boutique Grouping Header */}
                    <div className="store-header">
                      <div className="store-info">
                        <span className="store-badge">Official Store</span>
                        <span className="store-name">Winsor Brand Official Boutique</span>
                      </div>
                      <div className="store-shipping-notice">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                        </svg>
                        <span>Free Secured Worldwide Express Shipping</span>
                      </div>
                    </div>

                    {/* Checkbox Select All Controls */}
                    <div className="select-all-row">
                      <button
                        onClick={toggleSelectAll}
                        className={`custom-checkbox ${allSelected ? 'checked' : ''}`}
                        aria-label="Select all items"
                      >
                        {allSelected && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                      <span>Select All Items ({cartItems.length})</span>
                    </div>

                    {/* Cart Items List */}
                    {cartItems.map(item => {
                      const itemKey = `${item.productId}-${item.colorVariant || ''}`;
                      const isChecked = !!selectedItems[itemKey];
                      const productPrice = item.product?.price || 0;
                      const productTotal = productPrice * item.quantity;
                      const isProductSoldOut = item.product?.isSoldOut;

                      return (
                        <div key={itemKey} className="cart-item-card">
                          
                          {/* Row Checkbox */}
                          <button
                            onClick={() => toggleItem(item.productId, item.colorVariant)}
                            className={`custom-checkbox ${isChecked ? 'checked' : ''}`}
                            aria-label={`Select ${item.product?.title || 'item'}`}
                          >
                            {isChecked && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>

                          {/* Image Container */}
                          <div className="cart-item-img-container">
                            {item.product?.thumbnail?.url ? (
                              <Image
                                src={item.product.thumbnail.url}
                                alt={item.product.title || 'Winsor product'}
                                fill
                                sizes="110px"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'rgba(26,18,9,0.04)' }} />
                            )}
                          </div>

                          {/* Info Column */}
                          <div className="cart-item-info">
                            <h3 className="item-title">
                              {item.product ? (
                                <Link href={`/collections/${item.productId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                  {item.product.title}
                                </Link>
                              ) : (
                                'Timepiece details unavailable'
                              )}
                            </h3>
                            
                            <div className="item-meta-row">
                              <span>Model: {item.product?.modelNo || 'N/A'}</span>
                              {item.colorVariant && (
                                <>
                                  <div className="meta-divider" />
                                  <span className="item-variant-tag">Edition: {item.colorVariant}</span>
                                </>
                              )}
                              <div className="meta-divider" />
                              <span className="item-stock-status">
                                {isProductSoldOut ? 'Sold Out' : 'In Stock'}
                              </span>
                            </div>

                            {/* Row Action Controls */}
                            <div className="item-actions-panel">
                              {/* Quantity Control Pill */}
                              <div className="qty-controller">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.colorVariant)}
                                  disabled={item.quantity <= 1}
                                  className="qty-btn"
                                >
                                  −
                                </button>
                                <span className="qty-val">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.colorVariant)}
                                  className="qty-btn"
                                >
                                  +
                                </button>
                              </div>

                              {/* Remove Link Button */}
                              <button
                                onClick={() => removeFromCart(item.productId, item.colorVariant)}
                                className="text-action-btn delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Pricing Column (Far Right, Amazon-style) */}
                          <div className="item-price-column">
                            <span className="item-price-total">
                              {convertPrice(productTotal)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="item-price-unit">
                                ({convertPrice(productPrice)} / unit)
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}

                  </div>

                  {/* Right Column: Checkout Summary & Sticky Actions */}
                  <div className="cart-summary-panel">
                    <h3 className="summary-title">Order Summary</h3>
                    
                    <div className="summary-row">
                      <span>Items Selected ({selectedCount}):</span>
                      <span>{convertPrice(selectedSubtotal)}</span>
                    </div>
                    
                    <div className="summary-row">
                      <span>Shipping & Transit:</span>
                      <span className="shipping-detail-txt">FREE</span>
                    </div>
                    
                    <div className="summary-row">
                      <span>Customs Duties & Tax:</span>
                      <span style={{ color: 'rgba(26,18,9,0.5)', fontWeight: 500 }}>Included</span>
                    </div>

                    <div className="summary-row total-row">
                      <span>Order Total:</span>
                      <span>{convertPrice(selectedSubtotal)}</span>
                    </div>

                    {/* GATE 1: GUEST BANNER */}
                    {!isSignedIn && (
                      <div className="guard-banner banner-warning">
                        <div className="banner-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <span>Sign In Required</span>
                        </div>
                        <p className="banner-text">
                          You can add timepieces to your bag as a guest. To complete checkout and secure transit, please sign in.
                        </p>
                        <SignInButton mode="modal" forceRedirectUrl="/cart">
                          <button className="checkout-action-btn" style={{ fontSize: '11px', padding: '9px 12px', borderRadius: '20px' }}>
                            Sign In to Account
                          </button>
                        </SignInButton>
                      </div>
                    )}

                    {/* GATE 2: INCOMPLETE PROFILE DETAILS */}
                    {isSignedIn && !profileLoading && !isProfileComplete && (
                      <div className="guard-banner banner-warning">
                        <div className="banner-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span>Address Incomplete</span>
                        </div>
                        <p className="banner-text">
                          To dispatch high-value timepieces securely, we require a verified delivery address and contact number.
                        </p>
                        <Link href="/profile" className="checkout-action-btn" style={{ fontSize: '11px', padding: '9px 12px', borderRadius: '20px', textDecoration: 'none' }}>
                          Complete Shipping Info
                        </Link>
                      </div>
                    )}

                    {/* CHECKOUT PROMPT CTA */}
                    <button
                      onClick={handleCheckoutClick}
                      disabled={selectedItemsList.length === 0 || !isSignedIn || !isProfileComplete}
                      className="checkout-action-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {selectedItemsList.length === 0 
                        ? 'Select Timepieces' 
                        : !isSignedIn 
                          ? 'Sign In to Purchase' 
                          : !isProfileComplete 
                            ? 'Complete Shipping Info' 
                            : 'Proceed to Checkout'}
                    </button>
                    
                    {/* Secure Checkout details */}
                    <div className="security-badges">
                      <div className="security-badge-title">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span>Secure SSL Checkout</span>
                      </div>
                      <div className="payment-logo-row">
                        {/* Visa */}
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="currentColor"><rect width="24" height="16" rx="2" fill="#1A1F71"/><path d="M8.2 11.2L9.3 6H11l-1.1 5.2H8.2zm6.2-4.9c-.3-.2-.8-.4-1.3-.4-1.4 0-2.3.7-2.3 1.7 0 .8.7 1.2 1.3 1.5.6.3.8.5.8.7 0 .4-.5.6-1 .6-.6 0-1.1-.2-1.4-.4l-.2-.1-.2 1.1c.3.1.9.3 1.6.3 1.4 0 2.3-.7 2.3-1.8 0-.8-.5-1.4-1.6-1.9-.5-.3-.9-.5-.9-.7 0-.3.3-.5.8-.5.5 0 .9.1 1.2.3l.1.1.2-1.1zm3.8 2.2l-.7-3.5h-1.3c-.3 0-.5.2-.6.4L13.8 11.2h1.7l.3-.9h2.1l.2.9h1.5zm-2.1-2.1l-.3 1.2h1.3l-.2-1.2h-.8zM5.7 6h-1.6L2.3 10c-.2.5-.3.7-.6.9l-.6.3v.1h2.8l.6-3.6 1.8 3.6h1.8L5.7 6z" fill="#FFF"/></svg>
                        {/* Mastercard */}
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="currentColor"><rect width="24" height="16" rx="2" fill="#222"/><circle cx="10" cy="8" r="5" fill="#EB001B"/><circle cx="14" cy="8" r="5" fill="#FF5F00" fillOpacity="0.8"/></svg>
                        {/* Amex */}
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="currentColor"><rect width="24" height="16" rx="2" fill="#016FD0"/><path d="M3.7 10.4h1v-4.1h-.9V10.4zm1.8 0h1.8v-.9H6.5v-.8h.8v-.9h-.8v-.7h1v-.8H5.5v4.1zm4.1-4.1L8.3 8.3l1.3 2.1h1.2L9.5 8.3l1.3-2h-1zm-4.7 2.2L4 6.3 3.1 8.5h1.8z" fill="#FFF"/></svg>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
