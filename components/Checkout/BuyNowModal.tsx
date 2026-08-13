'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';

export interface BuyNowItem {
  productId: string;
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BuyNowItem | null;
  profile: {
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    mobile?: string;
    mobileCode?: string;
  } | null;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  onOrderSuccess?: (orderRef: string) => void;
}

type PayMethod = 'payhere' | 'bank_transfer';
type Step = 'confirm' | 'payment' | 'success';

function loadPayhereSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).payhere !== 'undefined') { resolve(); return; }
    const existing = document.querySelector('script[src*="payhere.lk"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('PayHere SDK failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment gateway.'));
    document.head.appendChild(script);
  });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

export default function BuyNowModal({
  isOpen, onClose, item, profile,
  userFirstName, userLastName, userEmail, onOrderSuccess,
}: BuyNowModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  const [payMethod, setPayMethod] = useState<PayMethod>('bank_transfer');
  const [bankReceipt, setBankReceipt] = useState<File | null>(null);
  const [bankReceiptName, setBankReceiptName] = useState('');
  const [bankTransferConfirmed, setBankTransferConfirmed] = useState(false);
  const [bankReceiptUploading, setBankReceiptUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm'); setErrorMsg(''); setOrderRef('');
      setPayMethod('bank_transfer'); setBankReceipt(null);
      setBankReceiptName(''); setBankTransferConfirmed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isProfileComplete = !!(
    profile?.address && profile?.city && profile?.postalCode &&
    profile?.country && profile?.mobile && profile?.mobileCode
  );
  const subtotal = item.price * item.quantity;

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Invalid file. Please upload a PDF, JPG, PNG, or WEBP.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum receipt size is 10 MB.'); return; }
    setBankReceipt(file); setBankReceiptName(file.name);
  };

  const handleConfirm = () => {
    if (!isProfileComplete) {
      setErrorMsg('Please complete your shipping address in your Profile settings before purchasing.');
      return;
    }
    setErrorMsg(''); setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    if (payMethod === 'bank_transfer') {
      if (!bankTransferConfirmed) { toast.error('Please confirm you have made the bank transfer.'); return; }
      if (!bankReceipt) { toast.error('Please upload your bank transfer receipt.'); return; }
    }
    setSubmitting(true);
    try {
      const ref = `WN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      setOrderRef(ref);

      if (payMethod === 'payhere') {
        const hashRes = await fetch('/api/payment/payhere-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: ref, amount: subtotal, currency: 'LKR' }),
        });
        const hashData = await hashRes.json();
        if (!hashData.success) throw new Error('Failed to initialise payment gateway.');

        await loadPayhereSDK();

        const payherePaymentId = await new Promise<string>((resolve, reject) => {
          const payhere = (window as any).payhere;
          payhere.onCompleted = (pId: string) => resolve(pId || ref);
          payhere.onDismissed = () => reject(new Error('Payment was cancelled. No order was created and no charges were made.'));
          payhere.onError = (error: string) => reject(new Error(`Payment failed: ${error}`));
          payhere.startPayment({
            sandbox: hashData.data.isSandbox, merchant_id: hashData.data.merchantId,
            return_url: '', cancel_url: '',
            notify_url: `${window.location.origin}/api/payment/payhere-notify`,
            order_id: ref, items: `${item.productTitle}`,
            amount: subtotal.toFixed(2), currency: 'LKR',
            first_name: userFirstName || 'Valued', last_name: userLastName || 'Client',
            email: userEmail || profile?.email || '',
            phone: `${profile?.mobileCode || ''}${profile?.mobile || ''}`.replace(/\s/g, ''),
            address: profile?.address || '', city: profile?.city || '',
            country: profile?.country || 'Sri Lanka', hash: hashData.data.hash,
          });
        });

        const res = await fetch('/api/customer/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: ref,
            items: [{
              productId: item.productId, productTitle: item.productTitle,
              productModelNo: item.productModelNo, productThumbnail: item.productThumbnail,
              colorVariant: item.colorVariant || '', quantity: item.quantity, price: item.price,
              isGift: false, giftNote: '', canvaLink: '', giftAttachmentUrl: '', giftAttachmentName: '',
            }],
            shippingAddress: {
              address: profile!.address, city: profile!.city, postalCode: profile!.postalCode,
              country: profile!.country, mobile: profile!.mobile, mobileCode: profile!.mobileCode,
            },
            subtotal, isGift: false, couponCode: null, validationToken: null,
            paymentMethod: 'card',
            paymentStatus: 'paid',
            payhereOrderId: payherePaymentId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record timepiece purchase.');

        if (onOrderSuccess) onOrderSuccess(ref);
        setStep('success');
        toast.success('Payment confirmed! Your timepiece order is placed.');
      } else {
        const res = await fetch('/api/customer/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: ref,
            items: [{
              productId: item.productId, productTitle: item.productTitle,
              productModelNo: item.productModelNo, productThumbnail: item.productThumbnail,
              colorVariant: item.colorVariant || '', quantity: item.quantity, price: item.price,
              isGift: false, giftNote: '', canvaLink: '', giftAttachmentUrl: '', giftAttachmentName: '',
            }],
            shippingAddress: {
              address: profile!.address, city: profile!.city, postalCode: profile!.postalCode,
              country: profile!.country, mobile: profile!.mobile, mobileCode: profile!.mobileCode,
            },
            subtotal, isGift: false, couponCode: null, validationToken: null,
            paymentMethod: 'bank_transfer',
            paymentStatus: 'pending',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to place order.');

        setBankReceiptUploading(true);
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read receipt file.'));
          reader.readAsDataURL(bankReceipt!);
        });
        const receiptRes = await fetch('/api/payment/bank-receipt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: ref, fileBase64, fileName: bankReceipt!.name, mimeType: bankReceipt!.type, isGuest: false }),
        });
        setBankReceiptUploading(false);
        const receiptData = await receiptRes.json();
        if (!receiptData.success) throw new Error(receiptData.error || 'Failed to upload receipt.');
        if (onOrderSuccess) onOrderSuccess(ref);
        setStep('success');
        toast.success('Order placed! We will verify your bank transfer within 24 hours.');
      }
    } catch (err: any) {
      console.error('[BuyNowModal]', err);
      setBankReceiptUploading(false);
      setErrorMsg(err?.message || 'Order placement failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!orderRef) return;
    navigator.clipboard.writeText(orderRef);
    setCopiedRef(true);
    toast.success(`Reference code "${orderRef}" copied!`);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleDownloadReceipt = () => {
    if (!orderRef || !item) return;
    generateReceiptPdf({
      orderRef,
      customer: {
        name: profile?.name || 'Customer', email: profile?.email || userEmail || 'N/A',
        mobile: `${profile?.mobileCode || ''} ${profile?.mobile || ''}`.trim(),
        address: profile?.address || 'N/A', city: profile?.city || 'N/A',
        postalCode: profile?.postalCode || 'N/A', country: profile?.country || 'N/A',
      },
      items: [{ productTitle: item.productTitle, productModelNo: item.productModelNo, colorVariant: item.colorVariant, quantity: item.quantity, price: item.price }],
      subtotal, finalTotal: subtotal,
      paymentMethod: payMethod === 'payhere' ? 'PayHere Card Payment' : 'Bank Transfer',
    });
    toast.success('PDF Receipt downloaded successfully!');
  };

  return (
    <>
      <style>{`
        @keyframes bnm-fade-in { from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bnm-spin { to{transform:rotate(360deg)} }

        .bnm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(10, 6, 2, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .bnm-dialog {
          background: #faf7f0;
          border: 1px solid rgba(184, 142, 60, 0.25);
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
          animation: bnm-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Jost', sans-serif;
          scrollbar-width: thin;
          scrollbar-color: rgba(184, 142, 60, 0.3) transparent;
          position: relative;
        }

        .bnm-dialog::-webkit-scrollbar { width: 5px; }
        .bnm-dialog::-webkit-scrollbar-thumb { background: rgba(184, 142, 60, 0.3); border-radius: 4px; }

        .bnm-header {
          padding: 24px 28px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: #faf7f0;
          z-index: 5;
        }

        .bnm-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a1209;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .bnm-subtitle {
          font-size: 12px;
          color: #7a6e5d;
          margin: 3px 0 0;
          font-weight: 400;
        }

        .bnm-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(184, 142, 60, 0.3);
          background: #ffffff;
          color: #6e6354;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .bnm-close:hover {
          background: rgba(184, 142, 60, 0.1);
          color: #1a1209;
          border-color: #b88e3c;
        }

        .bnm-stepper-container {
          padding: 0 28px 16px;
        }
        .bnm-stepper-track {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .bnm-stepper-line {
          flex: 1;
          height: 1.5px;
          background: rgba(184, 142, 60, 0.22);
          margin: 0 8px;
          transition: background 0.3s ease;
        }
        .bnm-stepper-line.active {
          background: #b88e3c;
          height: 2px;
        }

        .bnm-step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(184, 142, 60, 0.3);
        }
        .bnm-step-dot.completed {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #b88e3c;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .bnm-step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c59b4e 0%, #9e7529 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(184, 142, 60, 0.35);
        }

        .bnm-body {
          padding: 0 28px 24px;
        }

        .bnm-card {
          background: #ffffff;
          border: 1px solid rgba(184, 142, 60, 0.2);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          position: relative;
        }

        .bnm-section-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #8e7c66;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }

        .bnm-pay-option {
          border: 1.5px solid rgba(184, 142, 60, 0.22);
          border-radius: 14px;
          padding: 16px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #ffffff;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 12px;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .bnm-pay-option.active {
          border-color: #b88e3c;
          border-width: 2px;
          box-shadow: 0 4px 14px rgba(184, 142, 60, 0.12);
        }
        .bnm-pay-option:hover {
          border-color: rgba(184, 142, 60, 0.6);
        }

        .bnm-corner-ribbon {
          position: absolute;
          top: 0;
          right: 0;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #b88e3c, #9e7529);
          border-bottom-left-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(184, 142, 60, 0.3);
        }

        .bnm-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(184, 142, 60, 0.4);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          margin-top: 1px;
        }
        .bnm-radio.active {
          border-color: #b88e3c;
          background: #b88e3c;
        }
        .bnm-radio.active::after {
          content: '';
          width: 7px;
          height: 7px;
          background: #ffffff;
          border-radius: 50%;
        }

        .bnm-bank-details {
          background: #faf7f0;
          border: 1px solid rgba(184, 142, 60, 0.2);
          border-radius: 12px;
          padding: 14px 16px;
          margin-top: 12px;
        }

        .bnm-bank-row {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          line-height: 1.7;
          color: #1a1209;
        }
        .bnm-bank-row + .bnm-bank-row {
          border-top: 1px solid rgba(184, 142, 60, 0.12);
          margin-top: 6px;
          padding-top: 6px;
        }

        .bnm-info-box {
          background: #fffbeb;
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .bnm-receipt-upload {
          border: 2px dashed rgba(184, 142, 60, 0.35);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          margin-top: 12px;
          background: #ffffff;
        }
        .bnm-receipt-upload:hover {
          border-color: #b88e3c;
          background: rgba(184, 142, 60, 0.03);
        }
        .bnm-receipt-upload input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .bnm-btn-primary {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #c59b4e 0%, #936f26 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(184, 142, 60, 0.28);
          margin-top: 4px;
        }
        .bnm-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #d4a755 0%, #a47c2d 100%);
          box-shadow: 0 6px 18px rgba(184, 142, 60, 0.38);
          transform: translateY(-1px);
        }
        .bnm-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .bnm-btn-outline {
          width: 100%;
          height: 46px;
          background: transparent;
          border: 1.5px solid rgba(184, 142, 60, 0.45);
          color: #9e7529;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 10px;
          transition: all 0.2s ease;
        }
        .bnm-btn-outline:hover {
          border-color: #b88e3c;
          background: rgba(184, 142, 60, 0.06);
          color: #b88e3c;
        }

        .bnm-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0 2px;
          cursor: pointer;
          margin-top: 8px;
        }
        .bnm-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(184, 142, 60, 0.4);
          border-radius: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          margin-top: 1px;
        }
        .bnm-checkbox.checked {
          background: #b88e3c;
          border-color: #b88e3c;
        }

        .bnm-trust-footer {
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(184, 142, 60, 0.18);
        }
        .bnm-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #6e6354;
        }

        @media (max-width: 520px) {
          .bnm-dialog { border-radius: 20px; max-height: 92vh; }
          .bnm-header { padding: 20px 20px 14px; }
          .bnm-stepper-container { padding: 0 20px 14px; }
          .bnm-body { padding: 0 20px 20px; }
          .bnm-title { font-size: 20px; }
          .bnm-trust-footer { flex-wrap: wrap; gap: 10px; justify-content: center; }
        }
      `}</style>

      <div className="bnm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bnm-dialog">
          {/* Header */}
          <div className="bnm-header">
            <div>
              <h2 className="bnm-title">
                {step === 'confirm' ? 'Review Purchase' : step === 'payment' ? 'Select Payment' : 'Order Confirmed'}
              </h2>
              <p className="bnm-subtitle">
                {step === 'confirm' ? 'Verify your delivery details' : step === 'payment' ? 'Choose how you would like to pay' : 'Your timepiece order is placed'}
              </p>
            </div>
            <button className="bnm-close" onClick={onClose} aria-label="Close modal">&#215;</button>
          </div>

          {/* Stepper Progress Bar */}
          {step !== 'success' && (
            <div className="bnm-stepper-container">
              <div className="bnm-stepper-track">
                {step === 'confirm' ? (
                  <>
                    <div className="bnm-step-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="bnm-stepper-line" />
                    <div className="bnm-step-dot" />
                    <div className="bnm-stepper-line" />
                    <div className="bnm-step-dot" />
                  </>
                ) : (
                  <>
                    <div className="bnm-step-dot completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="bnm-stepper-line active" />
                    <div className="bnm-step-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="bnm-stepper-line" />
                    <div className="bnm-step-dot" />
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bnm-body">
            {/* ── STEP 1: Review Purchase ── */}
            {step === 'confirm' && (
              <>
                {/* YOUR ITEM */}
                <div className="bnm-section-label">Your Item</div>
                <div className="bnm-card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <img
                      src={item.productThumbnail || '/mens-watch-highlight.png'}
                      alt={item.productTitle}
                      style={{ width: 62, height: 62, objectFit: 'contain', borderRadius: 10, background: '#faf7f0', flexShrink: 0, border: '1px solid rgba(184,142,60,0.15)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1209' }}>{item.productTitle}</div>
                      <div style={{ fontSize: '12px', color: '#7a6e5d', marginTop: 2 }}>
                        Model: {item.productModelNo}{item.colorVariant && ` · ${item.colorVariant}`} · Qty: {item.quantity}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#b88e3c', marginTop: 6 }}>
                        LKR {subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DELIVERING TO */}
                <div className="bnm-section-label">Delivering To</div>
                {isProfileComplete ? (
                  <div className="bnm-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2" style={{ flexShrink: 0, marginTop: 3 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.5 }}>
                          {profile?.address}, {profile?.city}, {profile?.postalCode}, {profile?.country}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        <span style={{ fontSize: '13px', color: '#1a1209' }}>{profile?.mobileCode} {profile?.mobile}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(184,142,60,0.12)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        <span style={{ fontSize: '11.5px', color: '#7a6e5d' }}>
                          To change your address, visit{' '}
                          <a href="/profile" style={{ color: '#b88e3c', fontWeight: 700, textDecoration: 'none' }}>Profile settings.</a>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(198,40,40,0.04)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: '13px', color: '#c62828', fontWeight: 700, marginBottom: 4 }}>
                      Shipping address incomplete
                    </div>
                    <div style={{ fontSize: '12px', color: '#7a6e5d' }}>
                      Please complete your address in{' '}
                      <a href="/profile" style={{ color: '#b88e3c', fontWeight: 700 }}>Profile settings</a>{' '}
                      before purchasing.
                    </div>
                  </div>
                )}

                {/* ORDER TOTAL CARD */}
                <div className="bnm-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(184,142,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b88e3c' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a1209', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order Total</div>
                      <div style={{ fontSize: '11px', color: '#7a6e5d' }}>Inclusive of all taxes</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#b88e3c' }}>
                    LKR {subtotal.toLocaleString()}
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <button className="bnm-btn-primary" onClick={handleConfirm} disabled={!isProfileComplete}>
                  Continue to Payment &#8594;
                </button>
                <button className="bnm-btn-outline" onClick={onClose}>Cancel</button>

                {/* Footer Trust Badges */}
                <div className="bnm-trust-footer">
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                    <span>100% Authentic</span>
                  </div>
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span>Secure Payment</span>
                  </div>
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: Select Payment ── */}
            {step === 'payment' && (
              <>
                {/* ORDER TOTAL BAR */}
                <div className="bnm-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <span style={{ fontSize: '11.5px', color: '#7a6e5d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#b88e3c' }}>LKR {subtotal.toLocaleString()}</span>
                </div>

                <div className="bnm-section-label">Payment Method</div>

                {/* Option 1: Pay via PayHere */}
                <div
                  className={`bnm-pay-option ${payMethod === 'payhere' ? 'active' : ''}`}
                  onClick={() => setPayMethod('payhere')}
                >
                  <div className={`bnm-radio ${payMethod === 'payhere' ? 'active' : ''}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1209' }}>Pay via PayHere</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7a6e5d', marginTop: 3 }}>
                      Visa · Mastercard · Amex · eWallet · Bank · USSD
                    </div>
                    {/* Payment brand badges */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {['VISA', 'mastercard', 'AMEX', 'eWallets', 'BANK', 'USSD'].map((b) => (
                        <span key={b} style={{ fontSize: '8.5px', fontWeight: 800, color: '#4a3f31', background: '#f5f0e6', border: '1px solid rgba(184,142,60,0.25)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Option 2: Direct Bank Transfer */}
                <div
                  className={`bnm-pay-option ${payMethod === 'bank_transfer' ? 'active' : ''}`}
                  onClick={() => setPayMethod('bank_transfer')}
                >
                  {/* Corner Checkmark Badge when active */}
                  {payMethod === 'bank_transfer' && (
                    <div className="bnm-corner-ribbon" title="Selected">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div className={`bnm-radio ${payMethod === 'bank_transfer' ? 'active' : ''}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 3 2 10 22 10 12 3" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1209' }}>Direct Bank Transfer</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7a6e5d', marginTop: 3 }}>
                      Transfer and upload receipt – verified within 24 hrs
                    </div>
                  </div>
                </div>

                {payMethod === 'bank_transfer' && (
                  <>
                    {/* Bank details card */}
                    <div className="bnm-bank-details">
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#8e7c66', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Bank Transfer Details</div>
                      <div className="bnm-bank-row"><span style={{ color: '#7a6e5d', fontSize: '11.5px' }}>Bank</span><span style={{ fontWeight: 700 }}>NATIONS TRUST BANK</span></div>
                      <div className="bnm-bank-row"><span style={{ color: '#7a6e5d', fontSize: '11.5px' }}>Account No.</span><span style={{ fontWeight: 700, fontFamily: 'monospace' }}>100460045365</span></div>
                      <div className="bnm-bank-row"><span style={{ color: '#7a6e5d', fontSize: '11.5px' }}>Branch</span><span style={{ fontWeight: 700 }}>Bankshall Street (PETTAH)</span></div>
                      <div className="bnm-bank-row"><span style={{ color: '#7a6e5d', fontSize: '11.5px' }}>Amount</span><span style={{ fontWeight: 800, color: '#b88e3c' }}>LKR {subtotal.toLocaleString()}</span></div>
                    </div>

                    {/* Yellow/Cream Alert box */}
                    <div className="bnm-info-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      <span style={{ fontSize: '11.5px', color: '#92400e', lineHeight: 1.5 }}>
                        Please upload your payment receipt after completing the transfer. Your order will be verified within 24 hours.
                      </span>
                    </div>

                    {/* Receipt Upload Input */}
                    <div className="bnm-receipt-upload">
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleReceiptSelect} />
                      {bankReceiptName ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600 }}>{bankReceiptName}</span>
                        </div>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="1.5" style={{ margin: '0 auto 6px', display: 'block' }}><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                          <div style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 600 }}>Click to upload transfer receipt</div>
                          <div style={{ fontSize: '10.5px', color: '#7a6e5d', marginTop: 3 }}>PDF, JPG, PNG, WEBP · Max 10 MB</div>
                        </>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div className="bnm-checkbox-row" onClick={() => setBankTransferConfirmed(v => !v)}>
                      <div className={`bnm-checkbox ${bankTransferConfirmed ? 'checked' : ''}`}>
                        {bankTransferConfirmed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#1a1209', lineHeight: 1.5 }}>
                        I confirm I have transferred <strong>LKR {subtotal.toLocaleString()}</strong> to the account above.
                      </span>
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  className="bnm-btn-primary"
                  onClick={handlePlaceOrder}
                  disabled={submitting || bankReceiptUploading || (payMethod === 'bank_transfer' && (!bankTransferConfirmed || !bankReceipt))}
                >
                  {(submitting || bankReceiptUploading) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'bnm-spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      {bankReceiptUploading ? 'Uploading Receipt...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      Confirm &amp; Place Order &#8594;
                    </>
                  )}
                </button>
                <button className="bnm-btn-outline" onClick={() => setStep('confirm')}>Back</button>

                {/* Trust Badges */}
                <div className="bnm-trust-footer">
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                    <span>100% Authentic</span>
                  </div>
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span>Secure Payment</span>
                  </div>
                  <div className="bnm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,125,50,0.1)', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2e7d32' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 style={{ fontSize: '24px', color: '#1a1209', fontWeight: 700, margin: '0 0 6px' }}>Order Confirmed!</h3>
                <p style={{ fontSize: '13px', color: '#7a6e5d', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {payMethod === 'payhere' ? 'Payment successful! Your timepiece order has been placed.' : 'Your order is placed. We will verify your bank transfer within 24 hours.'}
                </p>
                <div style={{ background: '#faf7f0', border: '1px solid rgba(184,142,60,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e7c66', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Order Reference Code</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '20px', fontFamily: 'monospace', color: '#b88e3c', fontWeight: 800 }}>{orderRef}</span>
                    <button type="button" onClick={handleCopyRef} style={{ background: copiedRef ? 'rgba(46,125,50,0.1)' : 'rgba(184,142,60,0.1)', border: `1px solid ${copiedRef ? '#2e7d32' : '#b88e3c'}`, color: copiedRef ? '#2e7d32' : '#9e7529', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                      {copiedRef ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={handleDownloadReceipt} style={{ width: '100%', height: '46px', background: 'linear-gradient(135deg, #c59b4e 0%, #936f26 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(184,142,60,0.25)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download Receipt (PDF)
                </button>
                <button className="bnm-btn-outline" onClick={onClose} style={{ marginTop: 0 }}>Done</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
