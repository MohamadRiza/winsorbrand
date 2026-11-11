'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClerk, SignInButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { generateReceiptPdf } from '@/lib/utils/generateReceiptPdf';
import {
  ClientCouponResult,
  computeCouponTotals,
  normalizeCouponInput,
  validateCouponCodeRequest,
} from '@/lib/couponClient';

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

interface CompletedReceiptSnapshot {
  items: GuestCheckoutItem[];
  subtotal: number;
  couponCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  finalTotal: number;
}

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GuestCheckoutItem[];
  appliedCoupon?: ClientCouponResult | null;
  onCouponChange?: (coupon: ClientCouponResult | null) => void;
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
  appliedCoupon = null,
  onCouponChange,
  onLoginClick,
  onOrderSuccess,
}: GuestCheckoutModalProps) {
  const { openSignIn } = useClerk();

  const [step, setStep] = useState<Step>('choice');
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Coupon state (synced with CartPage prop and editable inside Step 3 summary)
  const [localCoupon, setLocalCoupon] = useState<ClientCouponResult | null>(appliedCoupon);
  const [modalCouponInput, setModalCouponInput] = useState(appliedCoupon?.code || '');
  const [modalCouponLoading, setModalCouponLoading] = useState(false);
  const [modalCouponError, setModalCouponError] = useState<string | null>(null);
  const [receiptSnapshot, setReceiptSnapshot] = useState<CompletedReceiptSnapshot | null>(null);

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
      setReceiptSnapshot(null);
      setLocalCoupon(appliedCoupon ?? null);
      setModalCouponInput(appliedCoupon?.code || '');
      setModalCouponError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep modal coupon state synced if parent prop updates externally
  useEffect(() => {
    setLocalCoupon(appliedCoupon ?? null);
    setModalCouponInput(appliedCoupon?.code || '');
  }, [appliedCoupon]);

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
  const { discountAmount, finalTotal } = computeCouponTotals(subtotal, localCoupon?.discountPercent);

  const handleApplyModalCoupon = async () => {
    const code = normalizeCouponInput(modalCouponInput.trim());
    if (!code) {
      setModalCouponError('Please enter a coupon code');
      toast.error('Please enter a coupon code');
      return;
    }

    setModalCouponLoading(true);
    setModalCouponError(null);
    const result = await validateCouponCodeRequest(code, null);
    setModalCouponLoading(false);

    if (result.ok) {
      setLocalCoupon(result.data);
      setModalCouponInput(result.data.code);
      setModalCouponError(null);
      onCouponChange?.(result.data);
      toast.success(`Coupon "${result.data.code}" applied — ${result.data.discountPercent}% off!`);
    } else {
      setLocalCoupon(null);
      setModalCouponError(result.error);
      onCouponChange?.(null);
      toast.error(result.error);
    }
  };

  const handleRemoveModalCoupon = () => {
    setLocalCoupon(null);
    setModalCouponInput('');
    setModalCouponError(null);
    onCouponChange?.(null);
    toast.success('Coupon removed');
  };

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

      const resolvedEmail = form.email.trim().toLowerCase();
      const buildOrderRequestBody = (
        method: 'card' | 'bank_transfer',
        status: 'paid' | 'pending',
        paymentId?: string
      ) => ({
        guestInfo: {
          name: form.name.trim(),
          email: resolvedEmail,
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
        couponCode: localCoupon?.code || null,
        validationToken: localCoupon?.validationToken || null,
        paymentMethod: method,
        paymentStatus: status,
        ...(paymentId ? { payhereOrderId: paymentId } : {}),
        customOrderRef: ref,
      });

      const captureOrderSnapshot = (serverData?: any) => {
        setReceiptSnapshot({
          items: items.map(i => ({ ...i })),
          subtotal: serverData?.subtotal ?? subtotal,
          couponCode: serverData?.couponCode || localCoupon?.code || undefined,
          discountPercent: serverData?.couponDiscountPercent ?? localCoupon?.discountPercent ?? undefined,
          discountAmount: serverData?.couponDiscountAmount ?? (localCoupon ? discountAmount : undefined),
          finalTotal: serverData?.finalTotal ?? finalTotal,
        });
      };

      if (payMethod === 'payhere') {
        const hashRes = await fetch('/api/payment/payhere-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: ref, amount: finalTotal, currency: 'LKR', isGuest: true, guestEmail }),
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
            amount: finalTotal.toFixed(2), currency: 'LKR',
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
          body: JSON.stringify(buildOrderRequestBody('card', 'paid', payherePaymentId)),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to place guest order.');

        captureOrderSnapshot(data.data);
        if (onOrderSuccess) onOrderSuccess(ref, form.name.trim());
        setStep('success');
        toast.success('Payment confirmed! Your timepiece order is placed.');
      } else {
        // ── Bank Transfer Guest Order Creation ─────────────────────────────────
        const res = await fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOrderRequestBody('bank_transfer', 'pending')),
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
        captureOrderSnapshot(data.data);
        if (onOrderSuccess) onOrderSuccess(ref, form.name.trim());
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
    const resolvedMobile = `${form.mobileCode} ${form.mobile.trim()}`.trim();
    const snapItems = receiptSnapshot?.items || items;
    const snapSubtotal = receiptSnapshot?.subtotal ?? subtotal;
    const snapFinalTotal = receiptSnapshot?.finalTotal ?? finalTotal;

    generateReceiptPdf({
      orderRef,
      customer: {
        name: form.name.trim() || 'Guest Customer',
        email: form.email.trim(),
        mobile: resolvedMobile,
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: countryName,
      },
      customerMobile: resolvedMobile,
      items: snapItems.map(i => ({
        productTitle: i.productTitle,
        productModelNo: i.productModelNo,
        colorVariant: i.colorVariant,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: snapSubtotal,
      couponCode: receiptSnapshot?.couponCode || localCoupon?.code || undefined,
      discountPercent: receiptSnapshot?.discountPercent ?? localCoupon?.discountPercent ?? undefined,
      discountAmount: receiptSnapshot?.discountAmount ?? (localCoupon ? discountAmount : undefined),
      finalTotal: snapFinalTotal,
      paymentMethod: payMethod === 'payhere' ? 'PayHere Card Payment' : 'Direct Bank Transfer',
      paymentStatus: payMethod === 'payhere' ? 'paid' : 'pending',
    });

    toast.success('PDF Receipt downloaded successfully!');
  };


  // ── Render steps ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes gcm-fade-in {
          from { opacity: 0; transform: scale(0.98) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gcm-spin { to { transform: rotate(360deg); } }

        .gcm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(14, 14, 14, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }

        .gcm-dialog {
          background: #FFFFFF;
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-radius: 18px;
          width: 100%; max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 28px 72px rgba(20, 16, 10, 0.22);
          animation: gcm-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Jost', sans-serif;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 105, 20, 0.25) transparent;
          position: relative;
        }
        .gcm-dialog::-webkit-scrollbar { width: 5px; }
        .gcm-dialog::-webkit-scrollbar-thumb { background: rgba(139, 105, 20, 0.25); border-radius: 4px; }

        .gcm-header {
          padding: 22px 26px 16px;
          display: flex; align-items: flex-start; justify-content: space-between;
          position: sticky; top: 0; background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px); z-index: 5;
          border-bottom: 1px solid rgba(139, 105, 20, 0.12);
          margin-bottom: 18px;
        }

        .gcm-header-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 25px; font-weight: 500;
          color: #141414; margin: 0; letter-spacing: 0.01em; line-height: 1.2;
        }
        .gcm-header-sub {
          font-family: 'Jost', sans-serif;
          font-size: 12.5px; color: #6E675C; margin: 4px 0 0; font-weight: 400;
        }

        .gcm-close {
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid rgba(139, 105, 20, 0.22);
          background: #FAF8F3; color: #6B5B3E; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; transition: all 0.22s ease;
        }
        .gcm-close:hover {
          background: rgba(139, 105, 20, 0.1);
          color: #8B6914;
          border-color: rgba(139, 105, 20, 0.45);
        }

        .gcm-stepper-container { padding: 0 26px 16px; }
        .gcm-stepper-track { display: flex; align-items: center; justify-content: space-between; position: relative; }
        .gcm-stepper-line { flex: 1; height: 1.5px; background: rgba(139, 105, 20, 0.14); margin: 0 8px; transition: background 0.3s ease; }
        .gcm-stepper-line.active { background: linear-gradient(90deg, #9C7A3C, #8B6914); height: 1.5px; }

        .gcm-step-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(139, 105, 20, 0.25); }
        .gcm-step-dot.completed {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          display: flex; align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 2px 8px rgba(139, 105, 20, 0.22);
        }
        .gcm-step-badge {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; box-shadow: 0 4px 12px rgba(139, 105, 20, 0.28);
        }

        .gcm-body { padding: 0 26px 24px; }
        .gcm-card {
          background: #FAF8F4; border: 1px solid rgba(139, 105, 20, 0.15);
          border-radius: 12px; padding: 16px 18px; margin-bottom: 14px;
          position: relative;
        }

        .gcm-input {
          width: 100%; height: 44px; box-sizing: border-box;
          background: #FAF8F4; border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 10px; padding: 0 14px;
          font-family: 'Jost', sans-serif; font-size: 13px; color: #141414;
          outline: none; transition: all 0.2s ease;
          display: flex; align-items: center;
        }
        .gcm-input:focus {
          border-color: #9C7A3C;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }
        .gcm-input.error { border-color: #b91c1c; background: #fffdfd; }
        .gcm-label {
          display: block; font-size: 10.5px; font-weight: 500;
          color: #444444; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 6px;
        }
        .gcm-field { margin-bottom: 14px; }
        .gcm-error { font-size: 10.5px; color: #b91c1c; margin-top: 4px; font-weight: 400; }

        .gcm-btn-primary {
          width: 100%; height: 48px; box-sizing: border-box;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff; border: 1px solid rgba(139, 105, 20, 0.45); border-radius: 999px;
          cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.13em;
          text-transform: uppercase; transition: all 0.22s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 20px rgba(139, 105, 20, 0.24); margin-top: 0;
        }
        .gcm-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #7A5C10 0%, #684E0D 100%); border-color: #684E0D;
          box-shadow: 0 10px 24px rgba(139, 105, 20, 0.32); transform: translateY(-1px);
        }
        .gcm-btn-primary:disabled { opacity: 0.48; cursor: not-allowed; box-shadow: none; }

        .gcm-btn-outline {
          width: 100%; height: 48px; box-sizing: border-box;
          background: #FFFFFF;
          border: 1.5px solid rgba(139, 105, 20, 0.34); color: #7A5C10;
          border-radius: 999px; cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.11em;
          text-transform: uppercase; transition: all 0.22s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 0;
        }
        .gcm-btn-outline:hover {
          border-color: #8B6914; background: #FAF8F3; color: #684E0D;
        }

        .gcm-edit-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #FFFFFF;
          border: 1px solid rgba(139, 105, 20, 0.3);
          color: #7A5C10; border-radius: 999px;
          padding: 4px 11px; font-family: 'Jost', sans-serif;
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; cursor: pointer;
          transition: all 0.2s ease;
        }
        .gcm-edit-btn:hover {
          background: rgba(139, 105, 20, 0.1); color: #684E0D; border-color: #8B6914;
        }

        .gcm-actions-row {
          display: flex; gap: 10px; align-items: center; margin-top: 18px;
        }
        .gcm-btn-back {
          width: 108px; flex-shrink: 0;
        }

        .gcm-city-postal-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; align-items: start;
        }

        .gcm-divider {
          display: flex; align-items: center; gap: 12px; margin: 16px 0;
          color: #888072; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em;
        }
        .gcm-divider::before, .gcm-divider::after { content: ''; flex: 1; height: 1px; background: rgba(139, 105, 20, 0.15); }

        .gcm-corner-ribbon {
          position: absolute; top: 0; right: 0; width: 26px; height: 26px;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          border-bottom-left-radius: 10px; display: flex; align-items: center;
          justify-content: center; color: #ffffff;
        }

        .gcm-pay-option {
          border: 1px solid rgba(139, 105, 20, 0.18); border-radius: 12px;
          padding: 16px 18px; cursor: pointer; transition: all 0.22s ease;
          background: #ffffff; display: flex; align-items: flex-start;
          gap: 14px; width: 100%; box-sizing: border-box; margin-bottom: 12px;
          text-align: left; position: relative; overflow: hidden;
        }
        .gcm-pay-option.active {
          border-color: #8B6914; border-width: 1.5px;
          background: #FFFEFA;
          box-shadow: 0 6px 18px rgba(139, 105, 20, 0.1);
        }
        .gcm-pay-option:hover { border-color: rgba(139, 105, 20, 0.45); }

        .gcm-summary-item {
          display: flex; gap: 12px; align-items: center;
          padding: 10px 0; border-bottom: 1px solid rgba(139, 105, 20, 0.1);
        }
        .gcm-summary-item:last-child { border-bottom: none; }

        .gcm-trust-footer {
          display: flex; align-items: center; justify-content: space-around;
          margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(139, 105, 20, 0.12);
        }
        .gcm-trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 500; color: #555046;
        }

        @media (max-width: 520px) {
          .gcm-dialog { max-height: 92vh; border-radius: 16px; }
          .gcm-header { padding: 18px 20px 14px; }
          .gcm-stepper-container { padding: 0 20px 14px; }
          .gcm-body { padding: 0 20px 20px; }
          .gcm-header-title { font-size: 22px; }
          .gcm-trust-footer { flex-wrap: wrap; gap: 10px; justify-content: center; }
          .gcm-btn-back { width: auto; min-width: 96px; padding-left: 16px; padding-right: 16px; }
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
                <div style={{ background: '#FAF8F4', border: '1px solid rgba(139,105,20,0.16)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#7A5C10', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
                    {totalQty} {totalQty === 1 ? 'Timepiece' : 'Timepieces'} · LKR {subtotal.toLocaleString()}
                  </div>
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="gcm-summary-item">
                      <img
                        src={item.productThumbnail || '/winsor_hero_backgroundremoved.webp'}
                        alt={item.productTitle}
                        style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#ffffff', border: '1px solid rgba(139,105,20,0.14)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productTitle}</div>
                        <div style={{ fontSize: '11px', color: '#666666', marginTop: 2 }}>
                          {item.colorVariant && `${item.colorVariant} · `}Qty {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#141414', fontFamily: "'Jost', sans-serif", flexShrink: 0 }}>
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div style={{ fontSize: '11px', color: '#777777', textAlign: 'center', paddingTop: 8 }}>
                      +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Sign In option */}
                <SignInButton mode="modal">
                  <button className="gcm-btn-primary" onClick={onClose}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Continue as Guest
                  </span>
                </button>

                <p style={{ fontSize: '11px', color: '#777777', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                  Guest purchases are fully insured and tracked via your private order reference.
                </p>
              </div>
            )}

            {/* ═══════════════════════ STEP 2: FORM (DELIVERY INFORMATION) ════════════════════════ */}
            {step === 'form' && (
              <div>
                {/* Full Name */}
                <div className="gcm-field">
                  <label className="gcm-label">Full Name *</label>
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
                  <label className="gcm-label">Email Address *</label>
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
                  <label className="gcm-label">Mobile Number *</label>
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
                <div style={{ borderTop: '1px solid rgba(20, 20, 20, 0.08)', paddingTop: 16, marginTop: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#141414', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>Delivery Address</span>
                  </div>

                  <div className="gcm-field">
                    <label className="gcm-label">Street Address *</label>
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
                      <label className="gcm-label">City *</label>
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
                      <label className="gcm-label">Postal Code *</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(20,20,20,0.06)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: '#141414', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span>Delivering To</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="gcm-edit-btn"
                      title="Edit delivery address"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      Edit
                    </button>
                  </div>

                  <div style={{ fontSize: '13.5px', color: '#141414', fontWeight: 600, marginBottom: 3 }}>
                    {form.name}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#666666', lineHeight: 1.5, marginBottom: 8 }}>
                    {form.address}, {form.city}, {form.postalCode}, {COUNTRIES.find(c => c.code === form.country)?.name || form.country}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(139,105,20,0.12)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', color: '#141414', background: '#FFFFFF', border: '1px solid rgba(139,105,20,0.18)', borderRadius: '6px', padding: '3px 9px', fontFamily: 'monospace' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span>{form.mobileCode} {form.mobile}</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', color: '#141414', background: '#FFFFFF', border: '1px solid rgba(139,105,20,0.18)', borderRadius: '6px', padding: '3px 9px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <span>{form.email}</span>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="gcm-card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(20,20,20,0.06)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: '#141414', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Timepiece Selection ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map((item, idx) => (
                      <div key={idx} className="gcm-summary-item" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: idx < items.length - 1 ? '1px dashed rgba(20,20,20,0.08)' : 'none' }}>
                        <div style={{ width: 48, height: 48, position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#ffffff', border: '1px solid rgba(20,20,20,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={item.productThumbnail || '/winsor_hero_backgroundremoved.webp'}
                            alt={item.productTitle}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.productTitle}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666666', marginTop: 2 }}>
                            Model: {item.productModelNo}{item.colorVariant ? ` · Edition: ${item.colorVariant}` : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666666', marginTop: 2 }}>
                            Qty: {item.quantity} × LKR {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#141414', fontFamily: "'Jost', sans-serif", fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          LKR {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Privilege / Coupon Box */}
                  <div style={{ borderTop: '1px solid rgba(20,20,20,0.08)', paddingTop: 12, marginTop: 12 }}>
                    {!localCoupon ? (
                      <>
                        <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#7A5C10', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                          Privilege / Coupon Code
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Enter code..."
                            value={modalCouponInput}
                            maxLength={24}
                            onChange={e => {
                              setModalCouponInput(normalizeCouponInput(e.target.value));
                              if (modalCouponError) setModalCouponError(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyModalCoupon();
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 11px',
                              border: modalCouponError ? '1px solid #dc2626' : '1px solid rgba(20,20,20,0.14)',
                              borderRadius: 6,
                              fontFamily: "'Jost', sans-serif",
                              fontSize: '12.5px',
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              color: '#141414',
                              background: '#ffffff',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyModalCoupon}
                            disabled={modalCouponLoading || !modalCouponInput.trim()}
                            style={{
                              padding: '8px 14px',
                              background: (modalCouponLoading || !modalCouponInput.trim())
                                ? 'rgba(139,105,20,0.16)'
                                : 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)',
                              color: (modalCouponLoading || !modalCouponInput.trim()) ? 'rgba(20,20,20,0.4)' : '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              fontFamily: "'Jost', sans-serif",
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: (modalCouponLoading || !modalCouponInput.trim()) ? 'not-allowed' : 'pointer',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {modalCouponLoading ? '...' : 'Apply'}
                          </button>
                        </div>
                        {modalCouponError && (
                          <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: 6, fontWeight: 500 }}>
                            {modalCouponError}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 8, padding: '8px 11px' }}>
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#15803d', letterSpacing: '0.06em' }}>
                            ✓ {localCoupon.code} Applied
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#555555' }}>
                            {localCoupon.discountPercent}% discount active
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveModalCoupon}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(220,38,38,0.3)',
                            borderRadius: 6,
                            padding: '3px 9px',
                            color: '#dc2626',
                            fontFamily: "'Jost', sans-serif",
                            fontSize: '10.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div style={{ borderTop: '1px solid rgba(20,20,20,0.08)', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666666' }}>
                      <span>Timepieces Subtotal</span>
                      <span style={{ fontWeight: 500, color: '#141414' }}>LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666666' }}>
                      <span>Insured Express Delivery</span>
                      <span style={{ fontWeight: 600, color: '#15803d', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>Complimentary</span>
                    </div>
                    {localCoupon && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
                        <span>Discount ({localCoupon.discountPercent}% — {localCoupon.code})</span>
                        <span>- LKR {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 4, borderTop: '1px solid rgba(20,20,20,0.1)' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#141414', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Order Total</div>
                        <div style={{ fontSize: '10.5px', color: '#777777' }}>Inclusive of taxes & insured delivery</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {localCoupon && (
                          <div style={{ fontSize: '11px', color: '#777777', textDecoration: 'line-through' }}>
                            LKR {subtotal.toLocaleString()}
                          </div>
                        )}
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#141414', fontFamily: "'Jost', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
                          LKR {finalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#b91c1c' }}>
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
                  <div>
                    <span style={{ fontSize: '11px', color: '#666666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Total</span>
                    {localCoupon && (
                      <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 600, marginTop: 2 }}>
                        {localCoupon.code} ({localCoupon.discountPercent}% off applied)
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {localCoupon && (
                      <div style={{ fontSize: '11px', color: '#777777', textDecoration: 'line-through' }}>
                        LKR {subtotal.toLocaleString()}
                      </div>
                    )}
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#141414' }}>LKR {finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Payment Method</div>

                {/* Option 1: Pay via PayHere */}
                <div
                  className={`gcm-pay-option ${payMethod === 'payhere' ? 'active' : ''}`}
                  onClick={() => setPayMethod('payhere')}
                >
                  {payMethod === 'payhere' && (
                    <div className="gcm-corner-ribbon" title="Selected">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${payMethod === 'payhere' ? '#8B6914' : 'rgba(139,105,20,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: payMethod === 'payhere' ? 'linear-gradient(135deg, #9C7A3C, #8B6914)' : 'transparent', marginTop: 1 }}>
                    {payMethod === 'payhere' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#141414' }}>Pay via PayHere</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666', marginTop: 3 }}>
                      Visa · Mastercard · Amex · eWallet · Bank · USSD
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                      {['VISA', 'mastercard', 'AMEX', 'eWallets', 'BANK', 'USSD'].map((b) => (
                        <span key={b} style={{ fontSize: '8.5px', fontWeight: 600, color: '#6B5B3E', background: '#FAF8F4', border: '1px solid rgba(139,105,20,0.18)', borderRadius: 4, padding: '1.5px 6px', textTransform: 'uppercase' }}>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${payMethod === 'bank_transfer' ? '#8B6914' : 'rgba(139,105,20,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: payMethod === 'bank_transfer' ? 'linear-gradient(135deg, #9C7A3C, #8B6914)' : 'transparent', marginTop: 1 }}>
                    {payMethod === 'bank_transfer' && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 3 2 10 22 10 22 10 12 3" /></svg>
                      <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#141414' }}>Direct Bank Transfer</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#666666', marginTop: 3 }}>
                      Transfer and upload receipt – verified within 24 hrs
                    </div>
                  </div>
                </div>

                {payMethod === 'bank_transfer' && (
                  <>
                    <div style={{ background: '#FAF8F4', border: '1px solid rgba(139, 105, 20, 0.16)', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#7A5C10', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Bank Transfer Details</div>
                      {[['Bank', 'NATIONS TRUST BANK'], ['Account No.', '100460045365'], ['Branch', 'Bankshall Street (PETTAH)'], ['Amount', `LKR ${finalTotal.toLocaleString()}`]].map(([label, value], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: i > 0 ? '1px solid rgba(139,105,20,0.1)' : undefined, marginTop: i > 0 ? 6 : 0, paddingTop: i > 0 ? 6 : 0, color: '#141414' }}>
                          <span style={{ color: '#666666', fontSize: '11.5px' }}>{label}</span>
                          <span style={{ fontWeight: 600, color: '#141414', fontFamily: label === 'Account No.' ? 'monospace' : undefined }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#FAF8F4', border: '1px solid rgba(139, 105, 20, 0.18)', borderRadius: 10, padding: '12px 14px', marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      <span style={{ fontSize: '11.5px', color: '#444444', lineHeight: 1.5 }}>
                        Please upload your payment receipt after completing the transfer. Your order will be verified within 24 hours.
                      </span>
                    </div>

                    <label style={{ display: 'block', fontSize: '9.5px', fontWeight: 600, color: '#7A5C10', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 12, marginBottom: 6 }}>Upload Transfer Receipt</label>
                    <div style={{ border: '1.5px dashed rgba(139,105,20,0.35)', borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', marginBottom: 12, background: '#FAF8F4' }}>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleReceiptSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                      {bankReceiptName ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>{bankReceiptName}</span>
                        </div>
                      ) : (
                        <>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" style={{ marginBottom: 6 }}><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                          <div style={{ fontSize: '12px', color: '#141414', fontWeight: 500 }}>Click to upload receipt</div>
                          <div style={{ fontSize: '10.5px', color: '#777777', marginTop: 2 }}>PDF, JPG, PNG, WEBP · Max 10 MB</div>
                        </>
                      )}
                    </div>

                    <div onClick={() => setBankTransferConfirmed(v => !v)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', cursor: 'pointer', marginBottom: 14 }}>
                      <div style={{ width: 18, height: 18, border: `1.5px solid ${bankTransferConfirmed ? '#8B6914' : 'rgba(139,105,20,0.4)'}`, borderRadius: 4, background: bankTransferConfirmed ? 'linear-gradient(135deg, #9C7A3C, #8B6914)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'all 0.2s ease' }}>
                        {bankTransferConfirmed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      <span style={{ fontSize: '12px', color: '#444444', lineHeight: 1.5 }}>
                        I confirm I have transferred <strong>LKR {finalTotal.toLocaleString()}</strong> to the account above.
                      </span>
                    </div>
                  </>
                )}

                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#b91c1c' }}>
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
                <div style={{ marginTop: '14px', fontSize: '11px', color: '#777777', textAlign: 'center', lineHeight: '1.6' }}>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                    <span>100% Authentic</span>
                  </div>
                  <div className="gcm-trust-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span>Secure Payment</span>
                  </div>
                  <div className="gcm-trust-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.8"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
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
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(21,128,61,0.08)',
                  border: '1.5px solid rgba(21,128,61,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#141414', fontWeight: 500, margin: '0 0 6px' }}>
                  Order Confirmed
                </h3>
                <p style={{ fontSize: '13px', color: '#666666', lineHeight: 1.6, margin: '0 0 12px' }}>
                  Thank you, <strong style={{ color: '#141414' }}>{form.name}</strong>.{' '}
                  {payMethod === 'payhere' ? 'Payment confirmed. Your timepiece order is now being prepared.' : 'Your order is placed. Our team will verify your transfer within 24 hours.'}
                </p>
                {payMethod === 'bank_transfer' && (
                  <div style={{ fontSize: '11.5px', color: '#555555', background: '#FAF8F4', border: '1px solid rgba(139,105,20,0.16)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, textAlign: 'left' }}>
                    Receipt received. You will receive an official update once verified.
                  </div>
                )}

                {/* Order reference box with Copy icon */}
                <div style={{
                  background: 'linear-gradient(135deg, #1E1912 0%, #2B241A 100%)',
                  border: '1px solid rgba(184, 150, 78, 0.4)',
                  borderRadius: '14px', padding: '18px 20px', marginBottom: 16,
                  boxShadow: '0 10px 28px rgba(30, 25, 18, 0.16)',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#D6BE88', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
                    Order Reference Code
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '22px', fontFamily: "'Jost', monospace", fontVariantNumeric: 'tabular-nums', color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.08em' }}>
                      {orderRef}
                    </span>

                    {/* Copy Icon Button (Copies only code) */}
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      title="Copy Reference Code"
                      style={{
                        background: copiedRef ? 'rgba(21,128,61,0.22)' : 'rgba(214,190,136,0.16)',
                        border: `1px solid ${copiedRef ? '#15803d' : 'rgba(214,190,136,0.45)'}`,
                        color: copiedRef ? '#86efac' : '#F3E5C2',
                        borderRadius: '999px', padding: '5px 12px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: '11px', fontWeight: 500, fontFamily: "'Jost', sans-serif",
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {copiedRef ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div style={{ fontSize: '10px', color: 'rgba(243,229,194,0.65)', marginTop: 8 }}>
                    Keep this reference code to track your delivery status
                  </div>
                </div>

                {/* 📄 Download PDF Receipt Button */}
                <button
                  type="button"
                  className="gcm-btn-outline"
                  onClick={handleDownloadReceipt}
                  style={{ marginBottom: 12 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Receipt (PDF)
                </button>

                {/* Track your order info box */}
                <div style={{ background: '#FAF8F4', border: '1px solid rgba(139,105,20,0.16)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#141414', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Order Tracking</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#666666', lineHeight: 1.55 }}>
                    Visit <Link href={`/orders/track?ref=${encodeURIComponent(orderRef)}&mobile=${encodeURIComponent(form.mobile)}`} style={{ color: '#8B6914', fontWeight: 600, textDecoration: 'underline' }}>Track Order Live</Link> or use reference <strong style={{ color: '#141414', fontFamily: 'monospace' }}>{orderRef}</strong> with your mobile number.
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
