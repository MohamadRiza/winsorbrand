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

  // Gifting Options States
  interface GiftConfig {
    isGift: boolean;
    giftNote: string;
    canvaLink: string;
    giftAttachmentUrl: string;
    giftAttachmentName: string;
  }
  const [giftDetails, setGiftDetails] = useState<{ [key: string]: GiftConfig }>({});
  const [activeGiftKey, setActiveGiftKey] = useState<string | null>(null);

  // Modal Editing States
  const [modalIsGift, setModalIsGift] = useState(false);
  const [modalGiftNote, setModalGiftNote] = useState('');
  const [modalCanvaLink, setModalCanvaLink] = useState('');
  const [modalAttachmentUrl, setModalAttachmentUrl] = useState('');
  const [modalAttachmentName, setModalAttachmentName] = useState('');
  const [modalUploadingFile, setModalUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Open Gifting Modal
  const openGiftingModal = (key: string) => {
    const existing = giftDetails[key] || {
      isGift: false,
      giftNote: '',
      canvaLink: '',
      giftAttachmentUrl: '',
      giftAttachmentName: ''
    };
    setModalIsGift(existing.isGift);
    setModalGiftNote(existing.giftNote);
    setModalCanvaLink(existing.canvaLink);
    setModalAttachmentUrl(existing.giftAttachmentUrl);
    setModalAttachmentName(existing.giftAttachmentName);
    setActiveGiftKey(key);
  };

  // Save Gifting Details
  const saveGiftingDetails = () => {
    if (!activeGiftKey) return;
    setGiftDetails(prev => ({
      ...prev,
      [activeGiftKey]: {
        isGift: modalIsGift,
        giftNote: modalGiftNote,
        canvaLink: modalCanvaLink,
        giftAttachmentUrl: modalAttachmentUrl,
        giftAttachmentName: modalAttachmentName
      }
    }));
    setActiveGiftKey(null);
    toast.success('Gifting options saved successfully.');
  };

  // Clear Gifting Details
  const clearGiftingDetails = (key: string) => {
    setGiftDetails(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast.success('Gifting options removed.');
  };

  // File Upload Handler (for Gifting Modal) with XHR progress calculation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB.');
      return;
    }

    setModalUploadingFile(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          setModalUploadingFile(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success && data.data) {
                setModalAttachmentUrl(data.data.url);
                setModalAttachmentName(file.name);
                toast.success('Wishing card uploaded successfully.');
              } else {
                toast.error(data.error || 'Failed to upload document.');
              }
            } catch (err) {
              toast.error('Failed to parse upload response.');
            }
          } else {
            toast.error(`Upload failed with status ${xhr.status}`);
          }
        };

        xhr.onerror = () => {
          setModalUploadingFile(false);
          toast.error('Upload failed due to connection error.');
        };

        xhr.send(JSON.stringify({ file: base64, type: 'document', name: file.name }));
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to upload wishing card.');
      setModalUploadingFile(false);
    }
  };

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

  const hasGiftItem = selectedItemsList.some(item => 
    item.product?.giftCategories && item.product.giftCategories.length > 0
  );

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
      
      const orderItems = selectedItemsList.map(item => {
        const key = `${item.productId}-${item.colorVariant || ''}`;
        const gift = giftDetails[key];
        return {
          productId: item.productId,
          productTitle: item.product?.title || 'Unknown Timepiece',
          productModelNo: item.product?.modelNo || 'N/A',
          productThumbnail: item.product?.thumbnail?.url || '',
          colorVariant: item.colorVariant,
          quantity: item.quantity,
          price: item.product?.price || 0,
          isGift: !!gift?.isGift,
          giftNote: gift?.giftNote || '',
          canvaLink: gift?.canvaLink || '',
          giftAttachmentUrl: gift?.giftAttachmentUrl || '',
          giftAttachmentName: gift?.giftAttachmentName || '',
        };
      });

      const orderHasGifts = orderItems.some(i => i.isGift);

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
          isGift: orderHasGifts,
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
          background-color: #faf7f0;
          min-height: 100vh;
          padding: 160px 4% 100px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .cart-wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* HEADER BLOCK */
        .cart-header-section {
          margin-bottom: 32px;
        }
        
        .cart-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4vw, 42px);
          font-weight: 300;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #1a1209;
          margin: 0 0 6px;
        }

        .cart-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.5);
          letter-spacing: 0.02em;
          margin: 0;
        }

        /* LAYOUT GRID */
        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: flex-start;
        }

        /* LEFT BLOCK - ITEMS CONTAINER */
        .cart-items-panel {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(139, 105, 20, 0.12);
          box-shadow: 0 10px 30px rgba(26, 18, 9, 0.02);
          overflow: hidden;
        }

        .store-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1.5px solid rgba(139, 105, 20, 0.1);
          background-color: rgba(139, 105, 20, 0.03);
        }

        .store-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .store-badge {
          background: #8b6914;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .store-name {
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #1a1209;
        }

        .store-shipping-notice {
          font-size: 11.5px;
          color: #2e7d32;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        /* SELECT ALL CONTROL ROW */
        .select-all-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 28px;
          background-color: #ffffff;
          border-bottom: 1px solid rgba(26, 18, 9, 0.06);
          font-size: 13px;
          color: rgba(26, 18, 9, 0.6);
          font-weight: 600;
        }

        /* PREMIUM CHECKBOX SYSTEM */
        .custom-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(139, 105, 20, 0.25);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: #ffffff;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .custom-checkbox:hover {
          border-color: #8b6914;
          background: rgba(139, 105, 20, 0.04);
        }

        .custom-checkbox.checked {
          background-color: #8b6914;
          border-color: #8b6914;
          box-shadow: 0 2px 8px rgba(139, 105, 20, 0.25);
        }

        /* ITEM CARD ROW */
        .cart-item-card {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          align-items: center;
          gap: 24px;
          padding: 28px;
          border-bottom: 1px solid rgba(26, 18, 9, 0.06);
          background-color: #ffffff;
          transition: all 0.3s ease;
        }

        .cart-item-card:last-child {
          border-bottom: none;
        }

        .cart-item-card:hover {
          background-color: rgba(139, 105, 20, 0.01);
        }

        .cart-item-img-container {
          width: 120px;
          height: 120px;
          position: relative;
          border-radius: 8px;
          border: 1px solid rgba(139, 105, 20, 0.12);
          overflow: hidden;
          background-color: #faf7f0;
          flex-shrink: 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .cart-item-img-container:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 20px rgba(139, 105, 20, 0.1);
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          color: #1a1209;
          margin: 0;
          line-height: 1.25;
          transition: color 0.2s;
        }
        
        .item-title:hover {
          color: #8b6914;
        }

        .item-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          font-size: 11.5px;
          color: rgba(26, 18, 9, 0.55);
          margin-top: 2px;
        }

        .meta-divider {
          width: 1px;
          height: 12px;
          background-color: rgba(26, 18, 9, 0.12);
        }

        .item-variant-tag {
          font-size: 11.5px;
          color: #8b6914;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .item-stock-status {
          font-size: 11.5px;
          color: #2e7d32;
          font-weight: 600;
        }

        /* ACTIONS PANEL (Qty + Remove) */
        .item-actions-panel {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 16px;
        }

        .qty-controller {
          display: flex;
          align-items: center;
          border: 1px solid rgba(139, 105, 20, 0.2);
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.01);
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #1a1209;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          font-weight: 600;
        }

        .qty-btn:hover:not(:disabled) {
          background: rgba(139, 105, 20, 0.06);
        }

        .qty-btn:disabled {
          color: rgba(26, 18, 9, 0.2);
          cursor: not-allowed;
        }

        .qty-val {
          width: 36px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: #1a1209;
        }

        .text-action-btn {
          background: none;
          border: none;
          color: rgba(26, 18, 9, 0.4);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .text-action-btn:hover {
          color: #8b6914;
        }
        
        .text-action-btn.delete:hover {
          color: #c62828;
        }

        /* PRICING ALIGNMENT */
        .item-price-column {
          text-align: right;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-price-total {
          font-size: 19px;
          font-weight: 600;
          color: #8b6914;
          letter-spacing: 0.01em;
        }

        .item-price-unit {
          font-size: 11.5px;
          color: rgba(26, 18, 9, 0.4);
        }

        /* RIGHT BLOCK - SUMMARY SIDEBAR */
        .cart-summary-panel {
          background: #ffffff;
          border: 1px solid rgba(139, 105, 20, 0.12);
          border-radius: 16px;
          padding: 32px 28px;
          position: sticky;
          top: 120px;
          box-shadow: 0 10px 35px rgba(26, 18, 9, 0.03);
        }

        .summary-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin: 0 0 24px;
          color: #1a1209;
          border-bottom: 1.5px solid rgba(139, 105, 20, 0.12);
          padding-bottom: 14px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.6);
          margin-bottom: 14px;
        }

        .summary-row.total-row {
          border-top: 1.5px solid rgba(139, 105, 20, 0.12);
          padding-top: 20px;
          margin-top: 20px;
          font-size: 19px;
          font-weight: 600;
          color: #1a1209;
          margin-bottom: 28px;
        }

        .shipping-detail-txt {
          color: #2e7d32;
          font-weight: 700;
        }

        .checkout-action-btn {
          width: 100%;
          background-color: #1a1209;
          color: #faf7f0;
          border: 1px solid #1a1209;
          border-radius: 30px;
          padding: 16px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(26,18,9,0.15);
        }

        .checkout-action-btn:hover:not(:disabled) {
          background-color: #8b6914;
          border-color: #8b6914;
          box-shadow: 0 6px 20px rgba(139,105,20,0.3);
        }

        .checkout-action-btn:disabled {
          background-color: rgba(26, 18, 9, 0.08);
          border-color: rgba(26, 18, 9, 0.02);
          color: rgba(26, 18, 9, 0.3);
          cursor: not-allowed;
          box-shadow: none;
        }

        /* GUARD BANNER BLOCKS INSIDE SIDEBAR */
        .guard-banner {
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          font-size: 12px;
          line-height: 1.5;
          border: 1px solid transparent;
        }

        .banner-warning {
          background-color: rgba(139, 105, 20, 0.04);
          border-color: rgba(139, 105, 20, 0.15);
          color: #8b6914;
        }

        .banner-title {
          font-weight: 700;
          margin: 0 0 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .banner-text {
          margin: 0 0 14px;
          color: rgba(26, 18, 9, 0.7);
        }

        /* SECURITY BADGES */
        .security-badges {
          margin-top: 28px;
          border-top: 1.5px solid rgba(139, 105, 20, 0.1);
          padding-top: 20px;
          text-align: center;
        }

        .security-badge-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(26, 18, 9, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .payment-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        
        .payment-logo {
          border-radius: 4px;
          border: 1px solid rgba(139,105,20,0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: all 0.2s;
        }
        .payment-logo:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(139,105,20,0.15);
          border-color: #8b6914;
        }

        /* MODALS */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background-color: rgba(10, 8, 6, 0.5);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal-box {
          background-color: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          padding: 36px;
          box-shadow: 0 24px 60px rgba(26, 18, 9, 0.15);
          position: relative;
          border: 1px solid rgba(139, 105, 20, 0.15);
          animation: modal-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 95vh;
          display: flex;
          flex-direction: column;
        }
        
        @keyframes modal-enter {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #1a1209;
          margin: 0 0 10px;
          text-align: center;
          text-transform: uppercase;
        }

        .modal-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.5);
          text-align: center;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .modal-block {
          border: 1px solid rgba(139, 105, 20, 0.12);
          background-color: rgba(26, 18, 9, 0.01);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
          font-size: 13px;
          line-height: 1.55;
        }

        .modal-block-header {
          font-size: 10.5px;
          font-weight: 700;
          color: #8b6914;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          border-bottom: 1px dashed rgba(139, 105, 20, 0.15);
          padding-bottom: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 14px;
          margin-top: 32px;
        }

        .modal-btn {
          flex: 1;
          padding: 14px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }

        .modal-btn.cancel {
          border: 1.5px solid rgba(26, 18, 9, 0.15);
          background: #ffffff;
          color: #1a1209;
        }

        .modal-btn.cancel:hover {
          background-color: rgba(26, 18, 9, 0.04);
          border-color: #1a1209;
        }

        .modal-btn.confirm {
          border: none;
          background-color: #8b6914;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(139,105,20,0.25);
        }

        .modal-btn.confirm:hover {
          background-color: #1a1209;
          box-shadow: 0 4px 12px rgba(26,18,9,0.25);
        }

        /* SUCCESS STATE SCREEN */
        .success-screen {
          max-width: 620px;
          margin: 60px auto 0;
          text-align: center;
          background: #ffffff;
          border: 1px solid rgba(139, 105, 20, 0.15);
          border-radius: 16px;
          padding: 56px 40px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.03);
        }

        .success-tick {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(46, 125, 50, 0.08);
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border: 1px solid rgba(46, 125, 50, 0.15);
        }

        .ref-box {
          background: rgba(139, 105, 20, 0.03);
          border: 1px solid rgba(139, 105, 20, 0.15);
          padding: 16px 24px;
          border-radius: 8px;
          margin-bottom: 32px;
          display: inline-block;
        }

        /* EMPTY STATE VIEW */
        .empty-cart-view {
          text-align: center;
          padding: 96px 24px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(139, 105, 20, 0.12);
          box-shadow: 0 10px 30px rgba(0,0,0,0.015);
          max-width: 600px;
          margin: 40px auto 0;
        }

        .empty-cart-icon {
          color: rgba(139, 105, 20, 0.2);
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .empty-cart-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          color: #1a1209;
          margin: 0 0 10px;
          font-weight: 500;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .cart-container {
            padding: 120px 24px 80px;
          }
          .cart-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .cart-summary-panel {
            position: static;
          }
        }

        /* GIFTING PANEL CARD */
        .gifting-panel-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(139, 105, 20, 0.12);
          box-shadow: 0 10px 30px rgba(26, 18, 9, 0.02);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .gifting-checkbox-row {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }

        .gifting-inputs-section {
          border-top: 1px dashed rgba(139, 105, 20, 0.15);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: slide-down 0.25s ease-out;
        }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gifting-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gifting-label {
          font-size: 11px;
          font-weight: 700;
          color: #8b6914;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .gifting-textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.15);
          background: #fbf9f4;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .gifting-textarea:focus {
          border-color: #8b6914;
        }

        .gifting-text-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.15);
          background: #fbf9f4;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #1a1209;
          outline: none;
          transition: border-color 0.2s;
        }

        .gifting-text-input:focus {
          border-color: #8b6914;
        }

        .file-upload-zone {
          border: 2px dashed rgba(139, 105, 20, 0.25);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          background: rgba(139, 105, 20, 0.02);
          transition: all 0.2s;
          position: relative;
        }

        .file-upload-zone:hover {
          border-color: #8b6914;
          background: rgba(139, 105, 20, 0.04);
        }

        .file-upload-zone input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .file-preview-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(139, 105, 20, 0.05);
          border: 1px solid rgba(139, 105, 20, 0.15);
          border-radius: 6px;
          font-size: 12px;
        }

        .gifting-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1.2px solid #8b6914;
          background: #ffffff;
          color: #8b6914;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 650;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .gifting-trigger-btn:hover {
          background: #8b6914;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.12);
        }

        .gifting-trigger-btn.added {
          background: rgba(139, 105, 20, 0.08);
          border-color: #8b6914;
          color: #8b6914;
        }

        .gifting-trigger-btn.added:hover {
          background: #8b6914;
          color: #ffffff;
        }

        .modal-custom-checkbox {
          width: 20px;
          height: 20px;
          border: 1.5px solid rgba(139, 105, 20, 0.4);
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          transition: all 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .modal-custom-checkbox:hover {
          border-color: #8b6914;
        }

        .modal-custom-checkbox.checked {
          background-color: #8b6914;
          border-color: #8b6914;
        }

        @media (max-width: 768px) {
          .modal-box {
            padding: 24px 20px;
          }
          .cart-item-card {
            grid-template-columns: auto 1fr;
            gap: 16px;
            padding: 20px;
            position: relative;
          }
          
          .custom-checkbox {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 10;
          }

          .cart-item-img-container {
            width: 90px;
            height: 90px;
            margin-left: 28px;
          }

          .item-price-column {
            grid-column: 2;
            text-align: left;
            min-width: 0;
            margin-top: 12px;
            border-top: 1px dashed rgba(139, 105, 20, 0.15);
            padding-top: 12px;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .item-actions-panel {
            grid-column: 1 / span 2;
            justify-content: space-between;
            margin-top: 14px;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .store-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 16px 20px;
          }
          .empty-cart-view {
            padding: 60px 20px;
            margin: 20px 16px 0;
            border-radius: 12px;
          }
          .empty-cart-title {
            font-size: 22px;
          }
        }
      `}</style>

      {/* GIFTING OPTIONS POP-UP MODAL */}
      {activeGiftKey !== null && (() => {
        const item = cartItems.find(i => `${i.productId}-${i.colorVariant || ''}` === activeGiftKey);
        return (
          <div className="modal-overlay" onClick={() => setActiveGiftKey(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(139,105,20,0.12)', paddingBottom: '14px' }}>
                <div style={{ color: '#8b6914', marginBottom: '6px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12v10H4V12" />
                    <path d="M2 7h20v5H2z" />
                    <path d="M12 22V7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '24px' }}>Gifting Options</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(26,18,9,0.5)', fontFamily: "'Jost', sans-serif" }}>
                  For timepiece: <strong style={{ color: '#1a1209' }}>{item?.product?.title}</strong> {item?.colorVariant ? `(${item.colorVariant})` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setModalIsGift(!modalIsGift)}>
                <button 
                  className={`modal-custom-checkbox ${modalIsGift ? 'checked' : ''}`}
                  type="button"
                >
                  {modalIsGift && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1209', fontFamily: "'Jost', sans-serif" }}>
                  Enable Complimentary Gift Wrapping & Card
                </span>
              </div>

              {modalIsGift && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px dashed rgba(139,105,20,0.15)', paddingTop: '16px' }}>
                  <div className="gifting-input-group">
                    <label className="gifting-label">Personal Greeting Note (Free)</label>
                    <textarea 
                      value={modalGiftNote}
                      onChange={e => setModalGiftNote(e.target.value)}
                      placeholder="Write a greeting note wishing your recipient the best..."
                      className="gifting-textarea"
                      maxLength={300}
                      style={{ minHeight: '75px' }}
                    />
                    <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.4)', textAlign: 'right', marginTop: '2px' }}>
                      {modalGiftNote.length} / 300 characters
                    </span>
                  </div>

                  <div className="gifting-input-group">
                    <label className="gifting-label">Canva Card Design Link (Optional)</label>
                    <input 
                      type="text"
                      value={modalCanvaLink}
                      onChange={e => setModalCanvaLink(e.target.value)}
                      placeholder="Paste your Canva card view link (https://canva.com/...)"
                      className="gifting-text-input"
                    />
                  </div>

                  <div className="gifting-input-group">
                    <label className="gifting-label">Upload Wishes Card / Image (PDF, JPG, PNG, Max 5MB, Optional)</label>
                    {modalUploadingFile ? (
                      <div className="file-upload-zone" style={{ padding: '18px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2.5" style={{ animation: 'spin 1.2s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(139,105,20,0.15)" strokeWidth="2.5" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#8b6914" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '12px', color: '#1a1209', fontWeight: 650 }}>
                            Uploading Wishes Card: {uploadProgress}%
                          </span>
                          <div style={{ width: '80%', height: '4px', background: 'rgba(139,105,20,0.12)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#8b6914', transition: 'width 0.15s ease-out' }} />
                          </div>
                        </div>
                      </div>
                    ) : modalAttachmentUrl ? (
                      <div className="file-preview-box" style={{ background: 'rgba(139, 105, 20, 0.04)', border: '1px solid rgba(139, 105, 20, 0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B6914', fontWeight: 500, fontSize: '12px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                            {modalAttachmentName}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => { setModalAttachmentUrl(''); setModalAttachmentName(''); }}
                          style={{ background: 'none', border: 'none', color: '#c62828', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload-zone" style={{ padding: '14px' }}>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={handleFileUpload}
                          disabled={modalUploadingFile}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(139,105,20,0.5)" strokeWidth="2" style={{ marginBottom: '2px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span style={{ fontSize: '12px', color: '#1a1209', fontStyle: 'normal', fontWeight: 500 }}>
                            Choose file to upload wishes card
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.38)' }}>
                            PDF, PNG, JPG (Max 5MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '12px' }}>
                <button className="modal-btn cancel" onClick={() => setActiveGiftKey(null)} type="button">
                  Cancel
                </button>
                <button className="modal-btn confirm" onClick={saveGiftingDetails} type="button">
                  Save Gifting Wishes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION PURCHASE MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Confirm Purchase</h3>
            <p className="modal-subtitle">
              Verify your dispatch address and the selected timepieces before completing checkout.
            </p>

            {/* Scrollable Content Wrapper */}
            <div style={{ maxHeight: 'calc(95vh - 260px)', overflowY: 'auto', paddingRight: '6px', margin: '0 -6px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modal-block" style={{ margin: 0 }}>
                <div className="modal-block-header">Contact Patron</div>
                <p style={{ margin: 0, color: '#1a1209' }}>
                  <strong>Email:</strong> {profile?.email}<br />
                  <strong>Mobile:</strong> {profile?.mobileCode} {profile?.mobile}
                </p>
              </div>

              <div className="modal-block" style={{ margin: 0 }}>
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

              <div className="modal-block" style={{ margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <div className="modal-block-header">Purchase Timepieces ({selectedCount})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedItemsList.map((item, idx) => {
                    const key = `${item.productId}-${item.colorVariant || ''}`;
                    const gift = giftDetails[key];
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: idx < selectedItemsList.length - 1 ? '1px dashed rgba(139,105,20,0.1)' : 'none', paddingBottom: idx < selectedItemsList.length - 1 ? '8px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap: '8px' }}>
                          <span style={{ color: 'rgba(26, 18, 9, 0.7)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {item.product?.title} {item.colorVariant ? `(${item.colorVariant})` : ''} × {item.quantity}
                          </span>
                          <span style={{ fontWeight: 600, color: '#8B6914', flexShrink: 0 }}>
                            {convertPrice((item.product?.price || 0) * item.quantity)}
                          </span>
                        </div>
                        {gift?.isGift && (
                          <div style={{ fontSize: '11px', color: '#8b6914', background: 'rgba(139,105,20,0.03)', padding: '6px 10px', borderRadius: '4px', marginTop: '2px', lineHeight: 1.45, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <strong>Gifting Options:</strong><br />
                            {gift.giftNote && <span style={{ fontStyle: 'italic', display: 'block', margin: '2px 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>"{gift.giftNote}"</span>}
                            {gift.canvaLink && <span style={{ display: 'block', wordBreak: 'break-all' }}>Canva Link: {gift.canvaLink}</span>}
                            {gift.giftAttachmentName && <span style={{ display: 'block', wordBreak: 'break-all' }}>Wishing Card: {gift.giftAttachmentName}</span>}
                            {!gift.giftNote && !gift.canvaLink && !gift.giftAttachmentName && <span>Gift Wrap & Empty Card</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  
                  {/* Left Column: Items Panel & Gifting Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                              <img
                                src={item.product.thumbnail.url}
                                alt={item.product.title || 'Winsor product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#1a1209]/5" />
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

                            {/* Gifting Options Trigger (if gifts category product) */}
                            {item.product?.giftCategories && item.product.giftCategories.length > 0 && (
                              <div style={{ marginTop: '10px', display: 'flex' }}>
                                {giftDetails[itemKey]?.isGift ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                      onClick={() => openGiftingModal(itemKey)}
                                      className="gifting-trigger-btn added"
                                      type="button"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                        <path d="M20 12v10H4V12" />
                                        <path d="M2 7h20v5H2z" />
                                        <path d="M12 22V7" />
                                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                                      </svg>
                                      Gift Options Added (Edit)
                                    </button>
                                    <button
                                      onClick={() => clearGiftingDetails(itemKey)}
                                      style={{ background: 'none', border: 'none', color: '#c62828', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Jost', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                      type="button"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => openGiftingModal(itemKey)}
                                    className="gifting-trigger-btn"
                                    type="button"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                      <path d="M20 12v10H4V12" />
                                      <path d="M2 7h20v5H2z" />
                                      <path d="M12 22V7" />
                                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                                    </svg>
                                    Add Gift Options (Free)
                                  </button>
                                )}
                              </div>
                            )}

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
                        <img 
                          src="https://cdn.jsdelivr.net/gh/datatrans/payment-logos@master/assets/cards/visa.svg" 
                          alt="Visa" 
                          className="payment-logo" 
                          style={{ width: '38px', height: '24px', display: 'block', objectFit: 'contain' }}
                        />
                        {/* Mastercard */}
                        <img 
                          src="https://cdn.jsdelivr.net/gh/datatrans/payment-logos@master/assets/cards/mastercard.svg" 
                          alt="Mastercard" 
                          className="payment-logo" 
                          style={{ width: '38px', height: '24px', display: 'block', objectFit: 'contain' }}
                        />
                        {/* Amex */}
                        <img 
                          src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@master/flat/amex.svg" 
                          alt="American Express" 
                          className="payment-logo" 
                          style={{ width: '38px', height: '24px', display: 'block', objectFit: 'contain' }}
                        />
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
