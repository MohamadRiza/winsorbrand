'use client';

import { useState, useEffect } from 'react';
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
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!/^[\d\s\-+]{6,20}$/.test(form.mobile.trim())) errs.mobile = 'Valid mobile number required';
    if (!form.address.trim()) errs.address = 'Delivery address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.postalCode.trim()) errs.postalCode = 'Postal code is required';
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
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Invalid file. Please upload a PDF, JPG, PNG, or WEBP.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum receipt size is 10 MB.'); return; }
    setBankReceipt(file); setBankReceiptName(file.name);
  };

  // ── Step 1: Create guest order → go to payment step ─────────────────────
  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
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
          paymentMethod: payMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderRef(data.data.orderRef);
        setGuestEmail(form.email.trim().toLowerCase());
        setStep('payment');
      } else {
        setErrorMsg(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
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
      if (payMethod === 'payhere') {
        const hashRes = await fetch('/api/payment/payhere-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef, amount: subtotal, currency: 'LKR', isGuest: true, guestEmail }),
        });
        const hashData = await hashRes.json();
        if (!hashData.success) throw new Error('Failed to initialise payment gateway.');
        await loadPayhereSDK();
        await new Promise<void>((resolve, reject) => {
          const payhere = (window as any).payhere;
          payhere.onCompleted = (_id: string) => resolve();
          payhere.onDismissed = () => reject(new Error('Payment cancelled. Your order is saved — use your reference code to retry.'));
          payhere.onError = (error: string) => reject(new Error(`Payment failed: ${error}`));
          payhere.startPayment({
            sandbox: hashData.data.isSandbox,
            merchant_id: hashData.data.merchantId,
            return_url: '', cancel_url: '',
            notify_url: `${window.location.origin}/api/payment/payhere-notify`,
            order_id: orderRef,
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
        if (onOrderSuccess) onOrderSuccess(orderRef, form.name.trim());
        setStep('success');
        toast.success('Payment confirmed! Your timepiece order is placed.');
      } else {
        setBankReceiptUploading(true);
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read receipt file.'));
          reader.readAsDataURL(bankReceipt!);
        });
        const receiptRes = await fetch('/api/payment/bank-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef, fileBase64, fileName: bankReceipt!.name, mimeType: bankReceipt!.type, isGuest: true, guestEmail }),
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
        @keyframes gcm-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .gcm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(10, 6, 2, 0.75);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: gcm-overlay-in 0.25s ease forwards;
        }
        .gcm-dialog {
          background: #faf7f0;
          border: 1px solid rgba(139,105,20,0.22);
          border-radius: 20px;
          width: 100%; max-width: 520px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(212,175,55,0.08);
          animation: gcm-fade-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
          font-family: 'Jost', sans-serif;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,105,20,0.3) transparent;
        }
        .gcm-dialog::-webkit-scrollbar { width: 4px; }
        .gcm-dialog::-webkit-scrollbar-thumb { background: rgba(139,105,20,0.3); border-radius: 4px; }
        .gcm-header {
          background: linear-gradient(135deg, #1a1209 0%, #2d1f0a 100%);
          padding: 20px 24px 18px;
          border-radius: 20px 20px 0 0;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(212,175,55,0.2);
        }
        .gcm-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 600;
          color: #f3e3b8; letter-spacing: 0.03em;
          margin: 0;
        }
        .gcm-header-sub {
          font-size: 10.5px; color: rgba(212,175,55,0.7);
          margin: 3px 0 0; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .gcm-close {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7); width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .gcm-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .gcm-body { padding: 24px; }
        .gcm-input {
          width: 100%; box-sizing: border-box;
          background: #fff; border: 1.5px solid rgba(139,105,20,0.2);
          border-radius: 10px; padding: 11px 14px;
          font-family: 'Jost', sans-serif; font-size: 13.5px; color: #1a1209;
          outline: none; transition: border-color 0.2s ease;
        }
        .gcm-input:focus { border-color: rgba(139,105,20,0.6); box-shadow: 0 0 0 3px rgba(139,105,20,0.08); }
        .gcm-input.error { border-color: #c62828; }
        .gcm-label {
          display: block; font-size: 9.5px; font-weight: 700;
          color: rgba(26,18,9,0.55); text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 6px;
        }
        .gcm-field { margin-bottom: 14px; }
        .gcm-error { font-size: 10.5px; color: #c62828; margin-top: 4px; }
        .gcm-btn-primary {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a1209 0%, #2d1f0a 100%);
          color: #d4af37; border: none;
          border-radius: 10px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 12px;
          font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          transition: all 0.2s ease; margin-top: 8px;
        }
        .gcm-btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #2d1f0a 0%, #3d2a10 100%); }
        .gcm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .gcm-btn-outline {
          width: 100%; padding: 13px;
          background: transparent; border: 1.5px solid rgba(139,105,20,0.35);
          color: #8b6914; border-radius: 10px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 12px;
          font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .gcm-btn-outline:hover { background: rgba(139,105,20,0.06); border-color: rgba(139,105,20,0.5); }
        .gcm-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0;
          color: rgba(26,18,9,0.35); font-size: 11px;
        }
        .gcm-divider::before, .gcm-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(26,18,9,0.1);
        }
        .gcm-step-indicator {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-bottom: 20px;
        }
        .gcm-step-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(139,105,20,0.2);
          transition: all 0.2s ease;
        }
        .gcm-step-dot.active {
          background: #8b6914; width: 20px; border-radius: 3px;
        }
        .gcm-summary-item {
          display: flex; gap: 12px; align-items: center;
          padding: 10px 0; border-bottom: 1px solid rgba(26,18,9,0.06);
        }
        .gcm-summary-item:last-child { border-bottom: none; }
        @media (max-width: 520px) {
          .gcm-dialog { max-height: 96vh; border-radius: 16px; }
          .gcm-body { padding: 18px; }
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
                {step === 'summary' && 'Order Summary'}
                {step === 'payment' && 'Select Payment'}
                {step === 'success' && 'Order Confirmed'}
              </h2>
              <p className="gcm-header-sub">
                {step === 'choice' && 'Sign in or continue as guest'}
                {step === 'form' && 'Where shall we deliver your timepiece?'}
                {step === 'summary' && 'Review your order before confirming'}
                {step === 'payment' && 'Choose how you would like to pay'}
                {step === 'success' && 'Your timepiece is on its way'}
              </p>
            </div>
            <button className="gcm-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          <div className="gcm-body">
            {/* ── Step indicators ────────────────────────────────────────── */}
            {step !== 'choice' && step !== 'success' && (
              <div className="gcm-step-indicator">
                <div className={`gcm-step-dot ${step === 'form' || step === 'summary' || step === 'payment' ? 'active' : ''}`} />
                <div className={`gcm-step-dot ${step === 'summary' || step === 'payment' ? 'active' : ''}`} />
                <div className={`gcm-step-dot ${step === 'payment' ? 'active' : ''}`} />
              </div>
            )}

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
                        src={item.productThumbnail || '/mens-watch-highlight.png'}
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

            {/* ═══════════════════════ STEP 2: FORM ════════════════════════ */}
            {step === 'form' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                  <div className="gcm-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="gcm-label">Full Name *</label>
                    <input
                      className={`gcm-input${formErrors.name ? ' error' : ''}`}
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="John Smith"
                      autoFocus
                    />
                    {formErrors.name && <div className="gcm-error">{formErrors.name}</div>}
                  </div>

                  <div className="gcm-field">
                    <label className="gcm-label">Email Address *</label>
                    <input
                      className={`gcm-input${formErrors.email ? ' error' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@email.com"
                    />
                    {formErrors.email && <div className="gcm-error">{formErrors.email}</div>}
                  </div>

                  <div className="gcm-field">
                    <label className="gcm-label">Mobile Number *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        className="gcm-input"
                        style={{ width: 90, flexShrink: 0, padding: '11px 6px' }}
                        value={form.mobileCode}
                        onChange={e => setForm(p => ({ ...p, mobileCode: e.target.value }))}
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.dial}>{c.dial} {c.code}</option>
                        ))}
                      </select>
                      <input
                        className={`gcm-input${formErrors.mobile ? ' error' : ''}`}
                        style={{ flex: 1 }}
                        value={form.mobile}
                        onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                        placeholder="71 234 5678"
                        type="tel"
                      />
                    </div>
                    {formErrors.mobile && <div className="gcm-error">{formErrors.mobile}</div>}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(26,18,9,0.08)', paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                    Delivery Address
                  </div>

                  <div className="gcm-field">
                    <label className="gcm-label">Street Address *</label>
                    <input
                      className={`gcm-input${formErrors.address ? ' error' : ''}`}
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="123 Main Street"
                    />
                    {formErrors.address && <div className="gcm-error">{formErrors.address}</div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                    <div className="gcm-field">
                      <label className="gcm-label">City *</label>
                      <input
                        className={`gcm-input${formErrors.city ? ' error' : ''}`}
                        value={form.city}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="Colombo"
                      />
                      {formErrors.city && <div className="gcm-error">{formErrors.city}</div>}
                    </div>

                    <div className="gcm-field">
                      <label className="gcm-label">Postal Code *</label>
                      <input
                        className={`gcm-input${formErrors.postalCode ? ' error' : ''}`}
                        value={form.postalCode}
                        onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))}
                        placeholder="00100"
                      />
                      {formErrors.postalCode && <div className="gcm-error">{formErrors.postalCode}</div>}
                    </div>
                  </div>

                  <div className="gcm-field">
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

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="gcm-btn-outline" onClick={() => setStep('choice')} style={{ flex: 0, padding: '13px 20px', width: 'auto' }}>
                    ← Back
                  </button>
                  <button
                    className="gcm-btn-primary"
                    style={{ flex: 1, marginTop: 0 }}
                    onClick={() => {
                      if (validateForm()) setStep('summary');
                    }}
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════ STEP 3: SUMMARY ════════════════════ */}
            {step === 'summary' && (
              <div>
                {/* Delivery info recap */}
                <div style={{ background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Delivering To
                  </div>
                  <div style={{ fontSize: '13px', color: '#1a1209', fontWeight: 600 }}>{form.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.6)', marginTop: 4, lineHeight: 1.6 }}>
                    {form.address}, {form.city}, {form.postalCode}<br />
                    {COUNTRIES.find(c => c.code === form.country)?.name || form.country}<br />
                    {form.mobileCode} {form.mobile}
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    style={{ background: 'none', border: 'none', color: '#8b6914', fontSize: '11px', fontWeight: 600, cursor: 'pointer', marginTop: 8, padding: 0, fontFamily: "'Jost', sans-serif", textDecoration: 'underline' }}
                  >
                    Edit Details
                  </button>
                </div>

                {/* Order items */}
                <div style={{ background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    Order Items
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="gcm-summary-item">
                      <img
                        src={item.productThumbnail || '/mens-watch-highlight.png'}
                        alt={item.productTitle}
                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#faf7f0', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productTitle}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                          {item.colorVariant && `${item.colorVariant} · `}Qty {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', flexShrink: 0 }}>
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid rgba(139,105,20,0.12)', paddingTop: 12, marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1209' }}>Total</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#8b6914', fontFamily: "'Jost', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        LKR {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(26,18,9,0.4)', marginTop: 4 }}>
                      Payment is collected upon delivery confirmation by our team
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="gcm-btn-outline" onClick={() => setStep('form')} style={{ flex: 0, padding: '13px 20px', width: 'auto' }}>
                    &#8592; Back
                  </button>
                  <button
                    className="gcm-btn-primary"
                    style={{ flex: 1, marginTop: 0 }}
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
                    ) : 'Continue to Payment →'}
                  </button>
                </div>
                <style>{`@keyframes gcm-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* ═══════════════════════ STEP 4: PAYMENT ════════════════════ */}
            {step === 'payment' && (
              <div>
                {/* Total bar */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#fff', border:'1px solid rgba(139,105,20,0.15)', borderRadius:10, marginBottom:16 }}>
                  <span style={{ fontSize:'12px', color:'rgba(26,18,9,0.55)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Order Total</span>
                  <span style={{ fontSize:'20px', fontWeight:700, color:'#8b6914', fontFamily:'monospace' }}>LKR {subtotal.toLocaleString()}</span>
                </div>

                <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(26,18,9,0.45)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Payment Method</div>

                {/* PayHere option */}
                <button type="button" onClick={() => setPayMethod('payhere')}
                  style={{ border:`2px solid ${payMethod === 'payhere' ? '#8b6914' : 'rgba(139,105,20,0.2)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.2s ease', background: payMethod === 'payhere' ? 'rgba(139,105,20,0.04)' : '#fff', display:'flex', alignItems:'center', gap:12, width:'100%', boxSizing:'border-box' as const, marginBottom:10, textAlign:'left' as const, boxShadow: payMethod === 'payhere' ? '0 0 0 3px rgba(139,105,20,0.08)' : 'none' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${payMethod === 'payhere' ? '#8b6914' : 'rgba(139,105,20,0.35)'}`, background: payMethod === 'payhere' ? '#8b6914' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {payMethod === 'payhere' && <div style={{ width:6, height:6, background:'#fff', borderRadius:'50%' }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <span style={{ fontWeight:700, fontSize:'13.5px', color:'#1a1209' }}>Pay via PayHere</span>
                      <span style={{ fontSize:'9.5px', fontWeight:700, color:'#2e7d32', background:'rgba(46,125,50,0.1)', border:'1px solid rgba(46,125,50,0.25)', borderRadius:4, padding:'2px 8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Secure</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(26,18,9,0.5)', marginTop:3 }}>Visa · Mastercard · Amex · eWallet · Bank · USSD</div>
                  </div>
                </button>

                {/* Bank Transfer option */}
                <button type="button" onClick={() => setPayMethod('bank_transfer')}
                  style={{ border:`2px solid ${payMethod === 'bank_transfer' ? '#8b6914' : 'rgba(139,105,20,0.2)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.2s ease', background: payMethod === 'bank_transfer' ? 'rgba(139,105,20,0.04)' : '#fff', display:'flex', alignItems:'center', gap:12, width:'100%', boxSizing:'border-box' as const, marginBottom:10, textAlign:'left' as const, boxShadow: payMethod === 'bank_transfer' ? '0 0 0 3px rgba(139,105,20,0.08)' : 'none' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${payMethod === 'bank_transfer' ? '#8b6914' : 'rgba(139,105,20,0.35)'}`, background: payMethod === 'bank_transfer' ? '#8b6914' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {payMethod === 'bank_transfer' && <div style={{ width:6, height:6, background:'#fff', borderRadius:'50%' }} />}
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      <span style={{ fontWeight:700, fontSize:'13.5px', color:'#1a1209' }}>Direct Bank Transfer</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(26,18,9,0.5)', marginTop:3 }}>Transfer and upload receipt — verified within 24 hrs</div>
                  </div>
                </button>

                {payMethod === 'bank_transfer' && (
                  <>
                    <div style={{ background:'rgba(139,105,20,0.05)', border:'1px solid rgba(139,105,20,0.18)', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                      <div style={{ fontSize:'9.5px', fontWeight:700, color:'rgba(26,18,9,0.45)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Bank Transfer Details</div>
                      {[['Bank','Bank of Ceylon'],['Account No.','1234567890'],['Branch','Main Branch'],['Amount',`LKR ${subtotal.toLocaleString()}`]].map(([label,value],i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'12.5px', borderTop: i > 0 ? '1px solid rgba(139,105,20,0.1)' : undefined, marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 6 : 0, color:'#1a1209' }}>
                          <span style={{ color:'rgba(26,18,9,0.5)', fontSize:'11px' }}>{label}</span>
                          <span style={{ fontWeight: label === 'Amount' ? 700 : 600, color: label === 'Amount' ? '#8b6914' : '#1a1209', fontFamily: label === 'Account No.' ? 'monospace' : undefined }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <label style={{ display:'block', fontSize:'9.5px', fontWeight:700, color:'rgba(26,18,9,0.55)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Upload Transfer Receipt</label>
                    <div style={{ border:'2px dashed rgba(139,105,20,0.3)', borderRadius:10, padding:14, textAlign:'center', cursor:'pointer', position:'relative', overflow:'hidden', marginBottom:12 }}>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleReceiptSelect} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
                      {bankReceiptName ? (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize:'13px', color:'#2e7d32', fontWeight:600 }}>{bankReceiptName}</span>
                        </div>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(139,105,20,0.5)" strokeWidth="1.5" style={{ marginBottom:6 }}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                          <div style={{ fontSize:'12.5px', color:'rgba(26,18,9,0.6)', fontWeight:500 }}>Click to upload receipt</div>
                          <div style={{ fontSize:'10.5px', color:'rgba(26,18,9,0.35)', marginTop:3 }}>PDF, JPG, PNG, WEBP · Max 10 MB</div>
                        </>
                      )}
                    </div>

                    <div onClick={() => setBankTransferConfirmed(v => !v)} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', cursor:'pointer', marginBottom:14 }}>
                      <div style={{ width:18, height:18, border:`2px solid ${bankTransferConfirmed ? '#8b6914' : 'rgba(139,105,20,0.35)'}`, borderRadius:4, background: bankTransferConfirmed ? '#8b6914' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1, transition:'all 0.2s ease' }}>
                        {bankTransferConfirmed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize:'12.5px', color:'rgba(26,18,9,0.7)', lineHeight:1.5 }}>
                        I confirm I have transferred <strong>LKR {subtotal.toLocaleString()}</strong> to the account above.
                      </span>
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div style={{ background:'rgba(198,40,40,0.06)', border:'1px solid rgba(198,40,40,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:14, fontSize:'12.5px', color:'#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  className="gcm-btn-primary"
                  style={{ marginTop:0, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                  onClick={handlePay}
                  disabled={submitting || bankReceiptUploading || (payMethod === 'bank_transfer' && (!bankTransferConfirmed || !bankReceipt))}
                >
                  {(submitting || bankReceiptUploading) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'gcm-spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      {bankReceiptUploading ? 'Uploading Receipt...' : 'Processing...'}
                    </>
                  ) : (
                    payMethod === 'payhere' ? 'Pay Now via PayHere' : 'Place Order — Bank Transfer'
                  )}
                </button>
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
                  <div style={{ fontSize:'11.5px', color:'rgba(26,18,9,0.5)', background:'rgba(139,105,20,0.06)', border:'1px solid rgba(139,105,20,0.15)', borderRadius:8, padding:'8px 12px', marginBottom:12, textAlign:'left' }}>
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
                    Visit <strong style={{ color: '#1a1209' }}>/orders/track</strong> and enter your reference code <strong style={{ color: '#8b6914', fontFamily: 'monospace' }}>{orderRef}</strong> with your mobile number.
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
