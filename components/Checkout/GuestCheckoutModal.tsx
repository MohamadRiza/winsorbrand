'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClerk, SignInButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';

// ── Types ────────────────────────────────────────────────────────────────────
export interface GuestCheckoutItem {
  productId: string;
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  colorVariant?: string;
  quantity: number;
  price: number;
}

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GuestCheckoutItem[];
  onLoginClick?: () => void;
  onOrderSuccess?: (orderRef: string, guestName: string) => void;
}

const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka', dial: '+94' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'AE', name: 'UAE', dial: '+971' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'MV', name: 'Maldives', dial: '+960' },
];

type Step = 'choice' | 'form' | 'summary' | 'payment' | 'success';

export default function GuestCheckoutModal({
  isOpen,
  onClose,
  items,
  onLoginClick,
  onOrderSuccess,
}: GuestCheckoutModalProps) {
  const { openSignIn } = useClerk();

  const [step, setStep] = useState<Step>('choice');
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Payment state
  const [payMethod, setPayMethod] = useState<'payhere' | 'bank_transfer'>('payhere');
  const [bankReceipt, setBankReceipt] = useState<File | null>(null);
  const [bankReceiptName, setBankReceiptName] = useState('');
  const [bankTransferConfirmed, setBankTransferConfirmed] = useState(false);
  const [bankReceiptUploading, setBankReceiptUploading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // Guest form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    mobileCode: '+94',
    address: '',
    city: '',
    postalCode: '',
    country: 'LK',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setErrorMsg('');
      setOrderRef('');
      setFormErrors({});
      setPayMethod('payhere');
      setBankReceipt(null);
      setBankReceiptName('');
      setBankTransferConfirmed(false);
      setGuestEmail('');
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  // ── Form validation ─────────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Full name is required (min 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!form.mobile.trim() || form.mobile.length < 6 || form.mobile.length > 9) errs.mobile = 'Valid mobile number required (max 9 digits)';
    if (!form.address.trim()) errs.address = 'Delivery address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.postalCode.trim() || !/^\d{1,15}$/.test(form.postalCode.trim())) errs.postalCode = 'Valid postal code is required (numbers only, max 15 digits)';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Load PayHere SDK ────────────────────────────────────────────────────
  const loadPayhereSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).payhere !== 'undefined') { resolve(); return; }
      const existing = document.querySelector('script[src*="payhere.lk"]');
      if (existing) { existing.addEventListener('load', () => resolve()); existing.addEventListener('error', () => reject(new Error('SDK load failed'))); return; }
      const script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load payment gateway.'));
      document.head.appendChild(script);
    });
  };

  // ── Receipt file select ─────────────────────────────────────────────────
  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Invalid file. Please upload a PDF, JPG, PNG, or WEBP.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum receipt size is 10 MB.'); return; }
    setBankReceipt(file); setBankReceiptName(file.name);
  };

  // ── Step 1: Validate guest info → go to payment step ─────────────────────
  const handlePlaceOrder = async () => {
    setErrorMsg('');
    const email = form.email.trim().toLowerCase();
    setGuestEmail(email);
    const ref = orderRef || `WG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    setOrderRef(ref);
    setStep('payment');
  };

  // ── Step 2: Execute payment (PayHere or bank transfer) ───────────────────
  const handlePay = async () => {
    setErrorMsg('');
    if (payMethod === 'bank_transfer') {
      if (!bankTransferConfirmed) { toast.error('Please confirm you have made the bank transfer.'); return; }
      if (!bankReceipt) { toast.error('Please upload your bank transfer receipt.'); return; }
    }
    setSubmitting(true);
    try {
      const ref = orderRef || `WG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      setOrderRef(ref);

      if (payMethod === 'payhere') {
        const hashRes = await fetch('/api/payment/payhere-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: ref, amount: subtotal, currency: 'LKR', isGuest: true, guestEmail }),
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
            sandbox: hashData.data.isSandbox,
            merchant_id: hashData.data.merchantId,
            return_url: '', cancel_url: '',
            notify_url: `${window.location.origin}/api/payment/payhere-notify`,
            order_id: ref,
            items: items.map(i => i.productTitle).join(', ').slice(0, 100),
            amount: subtotal.toFixed(2), currency: 'LKR',
            first_name: form.name.trim().split(' ')[0] || 'Guest',
            last_name: form.name.trim().split(' ').slice(1).join(' ') || 'Customer',
            email: guestEmail,
            phone: `${form.mobileCode}${form.mobile.trim()}`.replace(/\s/g, ''),
            address: form.address.trim(), city: form.city.trim(),
            country: COUNTRIES.find(c => c.code === form.country)?.name || form.country,
            hash: hashData.data.hash,
          });
        });

        // ── Guest Order is created ONLY after payment is confirmed by PayHere ────
        const res = await fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestInfo: {
              name: form.name.trim(),
              email: form.email.trim().toLowerCase(),
              mobile: `${form.mobileCode} ${form.mobile.trim()}`,
            },
            items: items.map(i => ({
              productId: i.productId,
              colorVariant: i.colorVariant,
              quantity: i.quantity,
            })),
            shippingAddress: {
              address: form.address.trim(),
              city: form.city.trim(),
              postalCode: form.postalCode.trim(),
              country: form.country,
              mobile: form.mobile.trim(),
              mobileCode: form.mobileCode,
            },
            paymentMethod: 'card',
            paymentStatus: 'paid',
            payhereOrderId: payherePaymentId,
            customOrderRef: ref,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to place guest order.');

        if (onOrderSuccess) onOrderSuccess(ref, form.name.trim());
        setStep('success');
        toast.success('Payment confirmed! Your timepiece order is placed.');
      } else {
        // ── Bank Transfer Guest Order Creation ─────────────────────────────────
        const res = await fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestInfo: {
              name: form.name.trim(),
              email: form.email.trim().toLowerCase(),
              mobile: `${form.mobileCode} ${form.mobile.trim()}`,
            },
            items: items.map(i => ({
              productId: i.productId,
              colorVariant: i.colorVariant,
              quantity: i.quantity,
            })),
            shippingAddress: {
              address: form.address.trim(),
              city: form.city.trim(),
              postalCode: form.postalCode.trim(),
              country: form.country,
              mobile: form.mobile.trim(),
              mobileCode: form.mobileCode,
            },
            paymentMethod: 'bank_transfer',
            paymentStatus: 'pending',
            customOrderRef: ref,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to place guest order.');

        setBankReceiptUploading(true);
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read receipt file.'));
          reader.readAsDataURL(bankReceipt!);
        });
        const receiptRes = await fetch('/api/payment/bank-receipt', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: ref, fileBase64, fileName: bankReceipt!.name, mimeType: bankReceipt!.type, isGuest: true, guestEmail }),
        });
        setBankReceiptUploading(false);
        const receiptData = await receiptRes.json();
        if (!receiptData.success) throw new Error(receiptData.error || 'Failed to upload receipt.');
        if (onOrderSuccess) onOrderSuccess(orderRef, form.name.trim());
        setStep('success');
        toast.success('Order placed! We will verify your bank transfer within 24 hours.');
      }
    } catch (err: any) {
      console.error('[GuestCheckout handlePay]', err);
      setBankReceiptUploading(false);
      setErrorMsg(err?.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle login click ─────────────────────────────────────────────────
  const handleLoginClick = () => {
    onClose();
    if (onLoginClick) {
      onLoginClick();
    } else if (openSignIn) {
      openSignIn();
    }
  };

  // ── Copy order reference string to clipboard ───────────────────────────
  const handleCopyRef = () => {
    if (!orderRef) return;
    navigator.clipboard.writeText(orderRef);
    setCopiedRef(true);
    toast.success(`Reference code "${orderRef}" copied!`);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // ── Download Receipt as PDF ─────────────────────────────────────────────
  const handleDownloadReceipt = () => {
    if (!orderRef) return;
    const countryName = COUNTRIES.find(c => c.code === form.country)?.name || form.country;

    generateReceiptPdf({
      orderRef,
      customer: {
        name: form.name.trim() || 'Guest Customer',
        email: form.email.trim(),
        mobile: `${form.mobileCode} ${form.mobile.trim()}`,
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: countryName,
      },
      items: items.map(i => ({
        productTitle: i.productTitle,
        productModelNo: i.productModelNo,
        colorVariant: i.colorVariant,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal,
      finalTotal: subtotal,
      paymentMethod: 'Pay on Delivery / Order Confirmation',
    });

    toast.success('PDF Receipt downloaded successfully!');
  };


  // ── Render steps ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes gcm-fade-in {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gcm-spin { to { transform: rotate(360deg); } }

        .gcm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(10, 6, 2, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }

        .gcm-dialog {
          background: #faf7f0;
          border: 1px solid rgba(184, 142, 60, 0.25);
          border-radius: 24px;
          width: 100%; max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25);
          animation: gcm-fade-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
          font-family: 'Jost', sans-serif;
          scrollbar-width: thin;
          scrollbar-color: rgba(184,142,60,0.3) transparent;
          position: relative;
        }
        .gcm-dialog::-webkit-scrollbar { width: 5px; }
        .gcm-dialog::-webkit-scrollbar-thumb { background: rgba(184, 142, 60, 0.3); border-radius: 4px; }

        .gcm-header {
          padding: 24px 28px 16px;
          display: flex; align-items: flex-start; justify-content: space-between;
          position: sticky; top: 0; background: #faf7f0; z-index: 5;
        }

        .gcm-header-title {
          font-size: 22px; font-weight: 700;
          color: #1a1209; margin: 0; letter-spacing: -0.01em;
        }
        .gcm-header-sub {
          font-size: 12px; color: #7a6e5d; margin: 3px 0 0; font-weight: 400;
        }

        .gcm-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(184, 142, 60, 0.3);
          background: #ffffff; color: #6e6354; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .gcm-close:hover { background: rgba(184, 142, 60, 0.1); color: #1a1209; border-color: #b88e3c; }

        .gcm-stepper-container { padding: 0 28px 16px; }
        .gcm-stepper-track { display: flex; align-items: center; justify-content: space-between; position: relative; }
        .gcm-stepper-line { flex: 1; height: 1.5px; background: rgba(184, 142, 60, 0.22); margin: 0 8px; transition: background 0.3s ease; }
        .gcm-stepper-line.active { background: #b88e3c; height: 2px; }

        .gcm-step-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(184, 142, 60, 0.3); }
        .gcm-step-dot.completed {
          width: 24px; height: 24px; border-radius: 50%;
          background: #b88e3c; display: flex; align-items: center; justify-content: center; color: #fff;
        }
        .gcm-step-badge {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #c59b4e 0%, #9e7529 100%);
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; box-shadow: 0 3px 10px rgba(184, 142, 60, 0.35);
        }

        .gcm-body { padding: 0 28px 24px; }
        .gcm-card {
          background: #ffffff; border: 1px solid rgba(184, 142, 60, 0.2);
          border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02); position: relative;
        }

        .gcm-input {
          width: 100%; height: 46px; box-sizing: border-box;
          background: #ffffff; border: 1.5px solid rgba(184, 142, 60, 0.25);
          border-radius: 10px; padding: 0 14px;
          font-family: 'Jost', sans-serif; font-size: 13.5px; color: #1a1209;
          outline: none; transition: all 0.2s ease;
          display: flex; align-items: center;
        }
        .gcm-input:focus {
          border-color: #b88e3c;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(184, 142, 60, 0.12);
        }
        .gcm-input.error { border-color: #c62828; background: #fffcfb; }
        .gcm-label {
          display: block; font-size: 10.5px; font-weight: 700;
          color: #8e7c66; text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 6px;
        }
        .gcm-field { margin-bottom: 14px; }
        .gcm-error { font-size: 10.5px; color: #c62828; margin-top: 4px; font-weight: 500; }

        .gcm-btn-primary {
          width: 100%; height: 48px; box-sizing: border-box;
          background: linear-gradient(135deg, #c59b4e 0%, #936f26 100%);
          color: #ffffff; border: none; border-radius: 12px;
          cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 12.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(184, 142, 60, 0.28); margin-top: 0;
        }
        .gcm-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #d4a755 0%, #a47c2d 100%);
          box-shadow: 0 6px 18px rgba(184, 142, 60, 0.38); transform: translateY(-1px);
        }
        .gcm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

        .gcm-btn-outline {
          width: 100%; height: 48px; box-sizing: border-box;
          background: transparent;
          border: 1.5px solid rgba(184, 142, 60, 0.45); color: #9e7529;
          border-radius: 12px; cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 12.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 0;
        }
        .gcm-btn-outline:hover {
          border-color: #b88e3c; background: rgba(184, 142, 60, 0.06); color: #b88e3c;
        }

        .gcm-edit-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(184, 142, 60, 0.08);
          border: 1px solid rgba(184, 142, 60, 0.25);
          color: #8b6914; border-radius: 100px;
          padding: 4px 12px; font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; cursor: pointer;
          transition: all 0.2s ease;
        }
        .gcm-edit-btn:hover {
          background: #8b6914; color: #ffffff; border-color: #8b6914;
        }

        .gcm-actions-row {
          display: flex; gap: 12px; align-items: center; margin-top: 18px;
        }
        .gcm-btn-back {
          width: 110px; flex-shrink: 0;
        }

        .gcm-city-postal-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; align-items: start;
        }

        .gcm-divider {
          display: flex; align-items: center; gap: 12px; margin: 16px 0;
          color: #7a6e5d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
        }
        .gcm-divider::before, .gcm-divider::after { content: ''; flex: 1; height: 1px; background: rgba(184, 142, 60, 0.2); }

        .gcm-corner-ribbon {
          position: absolute; top: 0; right: 0; width: 28px; height: 28px;
          background: linear-gradient(135deg, #b88e3c, #9e7529);
          border-bottom-left-radius: 10px; display: flex; align-items: center;
          justify-content: center; color: #ffffff; box-shadow: 0 2px 6px rgba(184, 142, 60, 0.3);
        }

        .gcm-pay-option {
          border: 1.5px solid rgba(184, 142, 60, 0.22); border-radius: 14px;
          padding: 16px 18px; cursor: pointer; transition: all 0.2s ease;
          background: #ffffff; display: flex; align-items: flex-start;
          gap: 14px; width: 100%; box-sizing: border-box; margin-bottom: 12px;
          text-align: left; position: relative; overflow: hidden;
        }
        .gcm-pay-option.active {
          border-color: #b88e3c; border-width: 2px;
          box-shadow: 0 4px 14px rgba(184, 142, 60, 0.12);
        }
        .gcm-pay-option:hover { border-color: rgba(184, 142, 60, 0.6); }

        .gcm-summary-item {
          display: flex; gap: 12px; align-items: center;
          padding: 10px 0; border-bottom: 1px solid rgba(184, 142, 60, 0.12);
        }
        .gcm-summary-item:last-child { border-bottom: none; }

        .gcm-trust-footer {
          display: flex; align-items: center; justify-content: space-around;
          margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(184, 142, 60, 0.18);
        }
        .gcm-trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; color: #6e6354;
        }

        @media (max-width: 520px) {
          .gcm-dialog { max-height: 92vh; border-radius: 20px; }
          .gcm-header { padding: 20px 20px 14px; }
          .gcm-stepper-container { padding: 0 20px 14px; }
          .gcm-body { padding: 0 20px 20px; }
          .gcm-header-title { font-size: 20px; }
          .gcm-trust-footer { flex-wrap: wrap; gap: 10px; justify-content: center; }
          .gcm-btn-back { width: 90px; }
        }

        @media (max-width: 480px) {
          .gcm-city-postal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="gcm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="gcm-dialog">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="gcm-header">
            <div>
              <h2 className="gcm-header-title">
                {step === 'choice' && 'Complete Your Purchase'}
                {step === 'form' && 'Delivery Information'}
                {step === 'summary' && 'Review Purchase'}
                {step === 'payment' && 'Select Payment'}
                {step === 'success' && 'Order Confirmed'}
              </h2>
              <p className="gcm-header-sub">
                {step === 'choice' && 'Sign in or continue as guest'}
                {step === 'form' && 'Where shall we deliver your timepiece?'}
                {step === 'summary' && 'Verify your delivery details'}
                {step === 'payment' && 'Choose how you would like to pay'}
                {step === 'success' && 'Your timepiece order is placed'}
              </p>
            </div>
            <button className="gcm-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          {/* ── Stepper Progress Bar ── */}
          {step !== 'choice' && step !== 'success' && (
            <div className="gcm-stepper-container">
              <div className="gcm-stepper-track">
                {step === 'form' && (
                  <>
                    <div className="gcm-step-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="gcm-stepper-line" />
                    <div className="gcm-step-dot" />
                    <div className="gcm-stepper-line" />
                    <div className="gcm-step-dot" />
                  </>
                )}
                {step === 'summary' && (
                  <>
                    <div className="gcm-step-dot completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="gcm-stepper-line active" />
                    <div className="gcm-step-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="gcm-stepper-line" />
                    <div className="gcm-step-dot" />
                  </>
                )}
                {step === 'payment' && (
                  <>
                    <div className="gcm-step-dot completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="gcm-stepper-line active" />
                    <div className="gcm-step-dot completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div className="gcm-stepper-line active" />
                    <div className="gcm-step-badge">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="gcm-body">


            {/* ═══════════════════════ STEP 1: CHOICE ═══════════════════════ */}
            {step === 'choice' && (
              <div>
                {/* Cart preview */}
                <div style={{ background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    {totalQty} {totalQty === 1 ? 'Timepiece' : 'Timepieces'} · LKR {subtotal.toLocaleString()}
                  </div>
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="gcm-summary-item">
                      <img
                        src={item.productThumbnail || '/winsor_hero_backgroundremoved.webp'}
                        alt={item.productTitle}
                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#faf7f0', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productTitle}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                          {item.colorVariant && `${item.colorVariant} · `}Qty {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', flexShrink: 0 }}>
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', textAlign: 'center', paddingTop: 8 }}>
                      +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Sign In option */}
                <SignInButton mode="modal">
                  <button className="gcm-btn-primary" onClick={onClose}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                      </svg>
                      Sign In / Register
                    </span>
                  </button>
                </SignInButton>

                <div className="gcm-divider">or</div>

                {/* Guest option */}
                <button className="gcm-btn-outline" onClick={() => setStep('form')}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Continue as Guest
                  </span>
                </button>

                <p style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.4)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  Guest purchases are secured and tracked via your order reference number.
                </p>
              </div>
            )}

            {/* ═══════════════════════ STEP 2: FORM (DELIVERY INFORMATION) ════════════════════════ */}
            {step === 'form' && (
              <div>
                {/* Full Name */}
                <div className="gcm-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="gcm-label" style={{ marginBottom: 0 }}>Full Name *</label>
                    <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.name.length}/50</span>
                  </div>
                  <input
                    className={`gcm-input${formErrors.name ? ' error' : ''}`}
                    value={form.name}
                    maxLength={50}
                    onChange={e => {
                      const val = e.target.value.slice(0, 50);
                      setForm(p => ({ ...p, name: val }));
                      if (formErrors.name) setFormErrors(p => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. Jonathan Sterling"
                    autoFocus
                  />
                  {formErrors.name && <div className="gcm-error">{formErrors.name}</div>}
                </div>

                {/* Email Address */}
                <div className="gcm-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="gcm-label" style={{ marginBottom: 0 }}>Email Address *</label>
                    <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.email.length}/100</span>
                  </div>
                  <input
                    className={`gcm-input${formErrors.email ? ' error' : ''}`}
                    type="email"
                    maxLength={100}
                    value={form.email}
                    onChange={e => {
                      const val = e.target.value.slice(0, 100);
                      setForm(p => ({ ...p, email: val }));
                      if (formErrors.email) setFormErrors(p => ({ ...p, email: '' }));
                    }}
                    placeholder="jonathan@sterling.com"
                  />
                  {formErrors.email && <div className="gcm-error">{formErrors.email}</div>}
                </div>

                {/* Mobile Number */}
                <div className="gcm-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="gcm-label" style={{ marginBottom: 0 }}>Mobile Number *</label>
                    <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.mobile.length}/9 Digits</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      className="gcm-input"
                      style={{ width: 110, flexShrink: 0, padding: '0 8px', fontSize: '13px' }}
                      value={form.mobileCode}
                      onChange={e => setForm(p => ({ ...p, mobileCode: e.target.value }))}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.dial}>{c.dial} ({c.code})</option>
                      ))}
                    </select>
                    <input
                      className={`gcm-input${formErrors.mobile ? ' error' : ''}`}
                      style={{ flex: 1 }}
                      value={form.mobile}
                      maxLength={9}
                      inputMode="numeric"
                      pattern="[0-9]{1,9}"
                      onKeyDown={(e) => {
                        if (e.key === '0' && (form.mobile.length === 0 || (e.currentTarget.selectionStart === 0 && (e.currentTarget.selectionEnd === 0 || e.currentTarget.selectionEnd === form.mobile.length)))) {
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
                        setForm(p => ({ ...p, mobile: digitsOnly }));
                        if (formErrors.mobile) setFormErrors(p => ({ ...p, mobile: '' }));
                      }}
                      placeholder="712345678"
                      type="tel"
                    />
                  </div>
                  {formErrors.mobile && <div className="gcm-error">{formErrors.mobile}</div>}
                </div>

                {/* Delivery Address Section */}
                <div style={{ borderTop: '1px solid rgba(184, 142, 60, 0.16)', paddingTop: 16, marginTop: 6, marginBottom: 14 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>Delivery Address</span>
                  </div>

                  <div className="gcm-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="gcm-label" style={{ marginBottom: 0 }}>Street Address *</label>
                      <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.address.length}/200</span>
                    </div>
                    <input
                      className={`gcm-input${formErrors.address ? ' error' : ''}`}
                      value={form.address}
                      maxLength={200}
                      onChange={e => {
                        const val = e.target.value.slice(0, 200);
                        setForm(p => ({ ...p, address: val }));
                        if (formErrors.address) setFormErrors(p => ({ ...p, address: '' }));
                      }}
                      placeholder="e.g. 42 Queens Road, Apartment 5B"
                    />
                    {formErrors.address && <div className="gcm-error">{formErrors.address}</div>}
                  </div>

                  <div className="gcm-city-postal-grid">
                    <div className="gcm-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="gcm-label" style={{ marginBottom: 0 }}>City *</label>
                        <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.city.length}/100</span>
                      </div>
                      <input
                        className={`gcm-input${formErrors.city ? ' error' : ''}`}
                        value={form.city}
                        maxLength={100}
                        onChange={e => {
                          const val = e.target.value.slice(0, 100);
                          setForm(p => ({ ...p, city: val }));
                          if (formErrors.city) setFormErrors(p => ({ ...p, city: '' }));
                        }}
                        placeholder="Colombo"
                      />
                      {formErrors.city && <div className="gcm-error">{formErrors.city}</div>}
                    </div>

                    <div className="gcm-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="gcm-label" style={{ marginBottom: 0 }}>Postal Code *</label>
                        <span style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)' }}>{form.postalCode.length}/15</span>
                      </div>
                      <input
                        className={`gcm-input${formErrors.postalCode ? ' error' : ''}`}
                        value={form.postalCode}
                        maxLength={15}
                        inputMode="numeric"
                        pattern="[0-9]{1,15}"
                        onChange={e => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
                          setForm(p => ({ ...p, postalCode: digitsOnly }));
                          if (formErrors.postalCode) setFormErrors(p => ({ ...p, postalCode: '' }));
                        }}
                        placeholder="00100"
                      />
                      {formErrors.postalCode && <div className="gcm-error">{formErrors.postalCode}</div>}
                    </div>
                  </div>

                  <div className="gcm-field" style={{ marginBottom: 4 }}>
                    <label className="gcm-label">Country *</label>
                    <select
                      className="gcm-input"
                      value={form.country}
                      onChange={e => {
                        const country = COUNTRIES.find(c => c.code === e.target.value);
                        setForm(p => ({ ...p, country: e.target.value, mobileCode: country?.dial || p.mobileCode }));
                      }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="gcm-actions-row">
                  <button
                    type="button"
                    className="gcm-btn-outline gcm-btn-back"
                    onClick={() => setStep('choice')}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="gcm-btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (validateForm()) setStep('summary');
                    }}
                  >
                    Review Purchase →
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════ STEP 3: SUMMARY (REVIEW PURCHASE) ════════════════════ */}
            {step === 'summary' && (
              <div>
                {/* Delivery info recap */}
                <div className="gcm-card" style={{ padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(184,142,60,0.12)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span>Delivering To</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="gcm-edit-btn"
                      title="Edit delivery address"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      Edit
                    </button>
                  </div>

                  <div style={{ fontSize: '14px', color: '#1a1209', fontWeight: 700, marginBottom: 4 }}>
                    {form.name}
                  </div>
                  
                  <div style={{ fontSize: '12.5px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.55, marginBottom: 10 }}>
                    {form.address}, {form.city}, {form.postalCode}, {COUNTRIES.find(c => c.code === form.country)?.name || form.country}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(26,18,9,0.06)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11.5px', color: '#1a1209', background: 'rgba(184,142,60,0.06)', border: '1px solid rgba(184,142,60,0.18)', borderRadius: '6px', padding: '3px 8px', fontFamily: 'monospace' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span>{form.mobileCode} {form.mobile}</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11.5px', color: '#1a1209', background: 'rgba(184,142,60,0.06)', border: '1px solid rgba(184,142,60,0.18)', borderRadius: '6px', padding: '3px 8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <span>{form.email}</span>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="gcm-card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(184,142,60,0.12)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Timepiece Selection ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map((item, idx) => (
                      <div key={idx} className="gcm-summary-item" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: idx < items.length - 1 ? '1px dashed rgba(184,142,60,0.15)' : 'none' }}>
                        <div style={{ width: 52, height: 52, position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#ffffff', border: '1px solid rgba(184,142,60,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={item.productThumbnail || '/winsor_hero_backgroundremoved.webp'}
                            alt={item.productTitle}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.productTitle}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#7a6e5d', marginTop: 2 }}>
                            Model: {item.productModelNo}{item.colorVariant ? ` · Edition: ${item.colorVariant}` : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8b6914', fontWeight: 600, marginTop: 2 }}>
                            Qty: {item.quantity} × LKR {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#1a1209', fontFamily: "'Jost', monospace", fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          LKR {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div style={{ borderTop: '1px solid rgba(184,142,60,0.14)', paddingTop: 12, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7a6e5d' }}>
                      <span>Timepieces Subtotal</span>
                      <span style={{ fontWeight: 600, color: '#1a1209' }}>LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#7a6e5d' }}>
                      <span>Insured Atelier Delivery</span>
                      <span style={{ fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>Free / Complimentary</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 4, borderTop: '1.5px solid rgba(184,142,60,0.2)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1a1209', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total Investment</div>
                        <div style={{ fontSize: '10.5px', color: '#7a6e5d' }}>Inclusive of all luxury taxes & insurance</div>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: '#b88e3c', fontFamily: "'Jost', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        LKR {subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <div className="gcm-actions-row">
                  <button
                    type="button"
                    className="gcm-btn-outline gcm-btn-back"
                    onClick={() => setStep('form')}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="gcm-btn-primary"
                    style={{ flex: 1 }}
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'gcm-spin 1s linear infinite' }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Creating Order...
                      </span>
                    ) : (
                      <span>Continue to Payment →</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════ STEP 4: PAYMENT ════════════════════ */}
            {step === 'payment' && (
              <div>
                {/* Total bar */}
                <div className="gcm-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <span style={{ fontSize: '11.5px', color: '#7a6e5d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#b88e3c' }}>LKR {subtotal.toLocaleString()}</span>
                </div>

                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#8e7c66', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Payment Method</div>

                {/* Option 1: Pay via PayHere */}
                <div
                  className={`gcm-pay-option ${payMethod === 'payhere' ? 'active' : ''}`}
                  onClick={() => setPayMethod('payhere')}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #b88e3c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: payMethod === 'payhere' ? '#b88e3c' : 'transparent', marginTop: 1 }}>
                    {payMethod === 'payhere' && <div style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1209' }}>Pay via PayHere</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7a6e5d', marginTop: 3 }}>
                      Visa · Mastercard · Amex · eWallet · Bank · USSD
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {['VISA', 'mastercard', 'AMEX', 'eWallets', 'BANK', 'USSD'].map((b) => (
                        <span key={b} style={{ fontSize: '8.5px', fontWeight: 800, color: '#4a3f31', background: '#f5f0e6', border: '1px solid rgba(184,142,60,0.25)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Option 2: Direct Bank Transfer */}
                <div
                  className={`gcm-pay-option ${payMethod === 'bank_transfer' ? 'active' : ''}`}
                  onClick={() => setPayMethod('bank_transfer')}
                >
                  {payMethod === 'bank_transfer' && (
                    <div className="gcm-corner-ribbon" title="Selected">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #b88e3c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: payMethod === 'bank_transfer' ? '#b88e3c' : 'transparent', marginTop: 1 }}>
                    {payMethod === 'bank_transfer' && <div style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 3 2 10 22 10 22 10 12 3" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1209' }}>Direct Bank Transfer</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7a6e5d', marginTop: 3 }}>
                      Transfer and upload receipt – verified within 24 hrs
                    </div>
                  </div>
                </div>

                {payMethod === 'bank_transfer' && (
                  <>
                    <div style={{ background: '#faf7f0', border: '1px solid rgba(184, 142, 60, 0.2)', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#8e7c66', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Bank Transfer Details</div>
                      {[['Bank', 'NATIONS TRUST BANK'], ['Account No.', '100460045365'], ['Branch', 'Bankshall Street (PETTAH)'], ['Amount', `LKR ${subtotal.toLocaleString()}`]].map(([label, value], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderTop: i > 0 ? '1px solid rgba(184,142,60,0.12)' : undefined, marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 6 : 0, color: '#1a1209' }}>
                          <span style={{ color: '#7a6e5d', fontSize: '11.5px' }}>{label}</span>
                          <span style={{ fontWeight: label === 'Amount' ? 800 : 700, color: label === 'Amount' ? '#b88e3c' : '#1a1209', fontFamily: label === 'Account No.' ? 'monospace' : undefined }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: '12px 14px', marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      <span style={{ fontSize: '11.5px', color: '#92400e', lineHeight: 1.5 }}>
                        Please upload your payment receipt after completing the transfer. Your order will be verified within 24 hours.
                      </span>
                    </div>

                    <label style={{ display: 'block', fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Upload Transfer Receipt</label>
                    <div style={{ border: '2px dashed rgba(139,105,20,0.3)', borderRadius: 10, padding: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleReceiptSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                      {bankReceiptName ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600 }}>{bankReceiptName}</span>
                        </div>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(139,105,20,0.5)" strokeWidth="1.5" style={{ marginBottom: 6 }}><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                          <div style={{ fontSize: '12.5px', color: 'rgba(26,18,9,0.6)', fontWeight: 500 }}>Click to upload receipt</div>
                          <div style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.35)', marginTop: 3 }}>PDF, JPG, PNG, WEBP · Max 10 MB</div>
                        </>
                      )}
                    </div>

                    <div onClick={() => setBankTransferConfirmed(v => !v)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', cursor: 'pointer', marginBottom: 14 }}>
                      <div style={{ width: 18, height: 18, border: `2px solid ${bankTransferConfirmed ? '#8b6914' : 'rgba(139,105,20,0.35)'}`, borderRadius: 4, background: bankTransferConfirmed ? '#8b6914' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'all 0.2s ease' }}>
                        {bankTransferConfirmed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.5 }}>
                        I confirm I have transferred <strong>LKR {subtotal.toLocaleString()}</strong> to the account above.
                      </span>
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  className="gcm-btn-primary"
                  style={{ marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handlePay}
                  disabled={submitting || bankReceiptUploading || (payMethod === 'bank_transfer' && (!bankTransferConfirmed || !bankReceipt))}
                >
                  {(submitting || bankReceiptUploading) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'gcm-spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      {bankReceiptUploading ? 'Uploading Receipt...' : 'Processing...'}
                    </>
                  ) : (
                    payMethod === 'payhere' ? 'Pay Now via PayHere' : 'Place Order — Bank Transfer'
                  )}
                </button>

                {/* Legal Policy Links Notice */}
                <div style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(26,18,9,0.55)', textAlign: 'center', lineHeight: '1.6' }}>
                  By placing your order, you agree to Winsor's{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#8B6914', textDecoration: 'underline', fontWeight: 600 }}>
                    Terms &amp; Conditions
                  </a>
                  ,{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#8B6914', textDecoration: 'underline', fontWeight: 600 }}>
                    Privacy Policy
                  </a>
                  , and{' '}
                  <a href="/warranty" target="_blank" rel="noopener noreferrer" style={{ color: '#8B6914', textDecoration: 'underline', fontWeight: 600 }}>
                    Warranty Policy
                  </a>
                  .
                </div>

                {/* Trust Badges */}
                <div className="gcm-trust-footer">
                  <div className="gcm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                    <span>100% Authentic</span>
                  </div>
                  <div className="gcm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span>Secure Payment</span>
                  </div>
                  <div className="gcm-trust-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b88e3c" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════ STEP 5: SUCCESS ════════════════════ */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                {/* Success icon */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(46,125,50,0.12), rgba(46,125,50,0.06))',
                  border: '2px solid rgba(46,125,50,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 20px rgba(46,125,50,0.15)',
                }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#1a1209', fontWeight: 600, margin: '0 0 6px' }}>
                  Order Confirmed!
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.6)', lineHeight: 1.6, margin: '0 0 10px' }}>
                  Thank you, <strong style={{ color: '#1a1209' }}>{form.name}</strong>!{' '}
                  {payMethod === 'payhere' ? 'Payment successful. Your timepiece order has been placed.' : 'Your order is placed. We will verify your bank transfer within 24 hours.'}
                </p>
                {payMethod === 'bank_transfer' && (
                  <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.5)', background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, textAlign: 'left' }}>
                    Receipt uploaded. Our team will verify and update your order status within 24 hours.
                  </div>
                )}

                {/* Order reference box with Copy icon */}
                <div style={{
                  background: 'linear-gradient(135deg, #1a1209, #2d1f0a)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  borderRadius: '16px', padding: '20px 22px', marginBottom: 16,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(212,175,55,0.75)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
                    Order Reference Code
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '24px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#d4af37', fontWeight: 700, letterSpacing: '0.08em' }}>
                      {orderRef}
                    </span>

                    {/* Copy Icon Button (Copies only code) */}
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      title="Copy Reference Code"
                      style={{
                        background: copiedRef ? 'rgba(46,125,50,0.25)' : 'rgba(212,175,55,0.15)',
                        border: `1px solid ${copiedRef ? '#2e7d32' : '#d4af37'}`,
                        color: copiedRef ? '#81c784' : '#f3e3b8',
                        borderRadius: '8px', padding: '6px 10px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: '11px', fontWeight: 600, fontFamily: 'Jost, sans-serif',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {copiedRef ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  <div style={{ fontSize: '10px', color: 'rgba(212,175,55,0.55)', marginTop: 10 }}>
                    Keep this code handy to track your delivery status
                  </div>
                </div>

                {/* 📄 Download PDF Receipt Button */}
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'linear-gradient(135deg, #8b6914 0%, #a67c1e 100%)',
                    color: '#ffffff', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'Jost, sans-serif',
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(139,105,20,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Receipt (PDF)
                </button>

                {/* Track your order info box */}
                <div style={{ background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.18)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, textAlign: 'left' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#8b6914', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔍 Order Tracking:</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.6 }}>
                    Visit <Link href={`/orders/track?ref=${encodeURIComponent(orderRef)}&mobile=${encodeURIComponent(form.mobile)}`} style={{ color: '#8b6914', fontWeight: 700, textDecoration: 'underline' }}>Track Timepiece Live</Link> or enter reference code <strong style={{ color: '#8b6914', fontFamily: 'monospace' }}>{orderRef}</strong> with your mobile number.
                  </div>
                </div>

                <button className="gcm-btn-primary" onClick={onClose} style={{ marginTop: 0 }}>
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
