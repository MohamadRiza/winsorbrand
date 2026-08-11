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

  const [payMethod, setPayMethod] = useState<PayMethod>('payhere');
  const [bankReceipt, setBankReceipt] = useState<File | null>(null);
  const [bankReceiptName, setBankReceiptName] = useState('');
  const [bankTransferConfirmed, setBankTransferConfirmed] = useState(false);
  const [bankReceiptUploading, setBankReceiptUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm'); setErrorMsg(''); setOrderRef('');
      setPayMethod('payhere'); setBankReceipt(null);
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

        // ── Order is created ONLY after payment is confirmed by PayHere ────────
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
        // ── Bank Transfer Order Creation ──────────────────────────────────────
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
        .bnm-overlay{position:fixed;inset:0;z-index:9998;background:rgba(10,6,2,0.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}
        .bnm-dialog{background:#faf7f0;border:1px solid rgba(139,105,20,0.22);border-radius:20px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.35);animation:bnm-fade-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards;font-family:'Jost',sans-serif;scrollbar-width:thin;scrollbar-color:rgba(139,105,20,0.3) transparent}
        .bnm-dialog::-webkit-scrollbar{width:4px}.bnm-dialog::-webkit-scrollbar-thumb{background:rgba(139,105,20,0.3);border-radius:4px}
        .bnm-header{background:linear-gradient(135deg,#1a1209,#2d1f0a);padding:20px 24px 18px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(212,175,55,0.2);position:sticky;top:0;z-index:2}
        .bnm-body{padding:22px 24px}
        .bnm-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:all 0.2s ease}
        .bnm-close:hover{background:rgba(255,255,255,0.15);color:#fff}
        .bnm-section{background:#fff;border:1px solid rgba(139,105,20,0.15);border-radius:12px;padding:14px 16px;margin-bottom:14px}
        .bnm-section-label{font-size:9.5px;font-weight:700;color:rgba(26,18,9,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px}
        .bnm-pay-option{border:2px solid rgba(139,105,20,0.2);border-radius:12px;padding:14px 16px;cursor:pointer;transition:all 0.2s ease;background:#fff;display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;margin-bottom:10px;text-align:left}
        .bnm-pay-option.active{border-color:#8b6914;background:rgba(139,105,20,0.04);box-shadow:0 0 0 3px rgba(139,105,20,0.08)}
        .bnm-pay-option:hover{border-color:rgba(139,105,20,0.5)}
        .bnm-radio{width:18px;height:18px;border-radius:50%;border:2px solid rgba(139,105,20,0.35);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease}
        .bnm-radio.active{border-color:#8b6914;background:#8b6914}
        .bnm-radio.active::after{content:'';width:6px;height:6px;background:#fff;border-radius:50%}
        .bnm-bank-details{background:rgba(139,105,20,0.05);border:1px solid rgba(139,105,20,0.18);border-radius:10px;padding:12px 14px;margin-bottom:12px}
        .bnm-receipt-upload{border:2px dashed rgba(139,105,20,0.3);border-radius:10px;padding:14px;text-align:center;cursor:pointer;transition:all 0.2s ease;position:relative;overflow:hidden;margin-bottom:12px}
        .bnm-receipt-upload:hover{border-color:rgba(139,105,20,0.6);background:rgba(139,105,20,0.03)}
        .bnm-receipt-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
        .bnm-btn-primary{width:100%;padding:14px;background:linear-gradient(135deg,#1a1209,#2d1f0a);color:#d4af37;border:none;border-radius:10px;cursor:pointer;font-family:'Jost',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;gap:8px}
        .bnm-btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .bnm-btn-outline{width:100%;padding:13px;background:transparent;border:1.5px solid rgba(139,105,20,0.35);color:#8b6914;border-radius:10px;cursor:pointer;font-family:'Jost',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-top:10px;transition:all 0.2s ease}
        .bnm-checkbox-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;cursor:pointer;margin-bottom:14px}
        .bnm-checkbox{width:18px;height:18px;border:2px solid rgba(139,105,20,0.35);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;margin-top:1px}
        .bnm-checkbox.checked{background:#8b6914;border-color:#8b6914}
        .bnm-step-nav{display:flex;align-items:center;gap:8px;margin-bottom:18px}
        .bnm-step-dot{width:8px;height:8px;border-radius:50%;background:rgba(139,105,20,0.2);transition:all 0.2s ease}
        .bnm-step-dot.active{background:#8b6914;transform:scale(1.2)}
        .bnm-bank-row{display:flex;justify-content:space-between;font-size:12.5px;line-height:1.7;color:#1a1209}
        .bnm-bank-row+.bnm-bank-row{border-top:1px solid rgba(139,105,20,0.1);margin-top:6px;padding-top:6px}
      `}</style>
      <div className="bnm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bnm-dialog">
          {/* Header */}
          <div className="bnm-header">
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: '#f3e3b8', margin: 0, letterSpacing: '0.03em' }}>
                {step === 'confirm' ? 'Review Purchase' : step === 'payment' ? 'Select Payment' : 'Order Confirmed'}
              </h2>
              <p style={{ fontSize: '10.5px', color: 'rgba(212,175,55,0.7)', margin: '3px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {step === 'confirm' ? 'Verify your delivery details' : step === 'payment' ? 'Choose how you would like to pay' : 'Your timepiece order is placed'}
              </p>
            </div>
            <button className="bnm-close" onClick={onClose}>&#215;</button>
          </div>

          <div className="bnm-body">
            {/* Step dots */}
            {step !== 'success' && (
              <div className="bnm-step-nav">
                <div className={`bnm-step-dot ${step === 'confirm' ? 'active' : ''}`} />
                <div style={{ flex: 1, height: '1px', background: 'rgba(139,105,20,0.15)' }} />
                <div className={`bnm-step-dot ${step === 'payment' ? 'active' : ''}`} />
                <div style={{ flex: 1, height: '1px', background: 'rgba(139,105,20,0.15)' }} />
                <div className="bnm-step-dot" />
              </div>
            )}

            {/* ── STEP 1: Review ── */}
            {step === 'confirm' && (
              <>
                <div className="bnm-section">
                  <div className="bnm-section-label">Timepiece</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={item.productThumbnail || '/mens-watch-highlight.png'} alt={item.productTitle}
                      style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#faf7f0', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1209' }}>{item.productTitle}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                        Model: {item.productModelNo}{item.colorVariant && ` · ${item.colorVariant}`} · Qty: {item.quantity}
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', marginTop: 6 }}>
                        LKR {subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {isProfileComplete ? (
                  <div className="bnm-section">
                    <div className="bnm-section-label">Delivering To</div>
                    <div style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.7 }}>
                      {profile?.address}, {profile?.city}, {profile?.postalCode}<br />
                      {profile?.country}<br />
                      <span style={{ color: 'rgba(26,18,9,0.6)', fontSize: '12px' }}>{profile?.mobileCode} {profile?.mobile}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.4)', marginTop: 8 }}>
                      To change your address, visit{' '}
                      <a href="/profile" style={{ color: '#8b6914', fontWeight: 600 }}>Profile settings</a>.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: '12.5px', color: '#c62828', fontWeight: 600, marginBottom: 4 }}>
                      Shipping address incomplete
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.6)' }}>
                      Please complete your address in{' '}
                      <a href="/profile" style={{ color: '#8b6914', fontWeight: 600 }}>Profile &#8594; Profile Details</a>{' '}
                      before purchasing.
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}
                <button className="bnm-btn-primary" onClick={handleConfirm} disabled={!isProfileComplete}>
                  Continue to Payment &#8594;
                </button>
                <button className="bnm-btn-outline" onClick={onClose}>Cancel</button>
              </>
            )}

            {/* ── STEP 2: Payment ── */}
            {step === 'payment' && (
              <>
                {/* Total bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: '12px', color: 'rgba(26,18,9,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace' }}>LKR {subtotal.toLocaleString()}</span>
                </div>

                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Payment Method</div>

                {/* PayHere */}
                <button type="button" className={`bnm-pay-option ${payMethod === 'payhere' ? 'active' : ''}`} onClick={() => setPayMethod('payhere')}>
                  <div className={`bnm-radio ${payMethod === 'payhere' ? 'active' : ''}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1a1209' }}>Pay via PayHere</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 3 }}>Visa · Mastercard · Amex · eWallet · Bank · USSD</div>
                  </div>
                  {payMethod === 'payhere' && (
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#2e7d32', background: 'rgba(46,125,50,0.1)', border: '1px solid rgba(46,125,50,0.25)', borderRadius: 4, padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Secure</span>
                  )}
                </button>

                {/* Bank Transfer */}
                <button type="button" className={`bnm-pay-option ${payMethod === 'bank_transfer' ? 'active' : ''}`} onClick={() => setPayMethod('bank_transfer')}>
                  <div className={`bnm-radio ${payMethod === 'bank_transfer' ? 'active' : ''}`} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1a1209' }}>Direct Bank Transfer</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 3 }}>Transfer and upload receipt — verified within 24 hrs</div>
                  </div>
                </button>

                {payMethod === 'bank_transfer' && (
                  <>
                    <div className="bnm-bank-details">
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Bank Transfer Details</div>
                      <div className="bnm-bank-row"><span style={{ color: 'rgba(26,18,9,0.5)', fontSize: '11px' }}>Bank</span><span style={{ fontWeight: 600 }}>NATIONS TRUST BANK</span></div>
                      <div className="bnm-bank-row"><span style={{ color: 'rgba(26,18,9,0.5)', fontSize: '11px' }}>Account No.</span><span style={{ fontWeight: 600, fontFamily: 'monospace' }}>100460045365</span></div>
                      <div className="bnm-bank-row"><span style={{ color: 'rgba(26,18,9,0.5)', fontSize: '11px' }}>Branch</span><span style={{ fontWeight: 600 }}>Bankshall Street (PETTAH)</span></div>
                      <div className="bnm-bank-row"><span style={{ color: 'rgba(26,18,9,0.5)', fontSize: '11px' }}>Amount</span><span style={{ fontWeight: 700, color: '#8b6914' }}>LKR {subtotal.toLocaleString()}</span></div>
                    </div>

                    <label style={{ display: 'block', fontSize: '9.5px', fontWeight: 700, color: 'rgba(26,18,9,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Upload Transfer Receipt</label>
                    <div className="bnm-receipt-upload">
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleReceiptSelect} />
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

                    <div className="bnm-checkbox-row" onClick={() => setBankTransferConfirmed(v => !v)}>
                      <div className={`bnm-checkbox ${bankTransferConfirmed ? 'checked' : ''}`}>
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
                    payMethod === 'payhere' ? 'Pay Now via PayHere' : 'Place Order — Bank Transfer'
                  )}
                </button>
                <button className="bnm-btn-outline" onClick={() => setStep('confirm')}>&#8592; Back</button>
              </>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(46,125,50,0.12),rgba(46,125,50,0.06))', border: '2px solid rgba(46,125,50,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(46,125,50,0.15)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '26px', color: '#1a1209', fontWeight: 600, margin: '0 0 6px' }}>Order Confirmed!</h3>
                <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.6)', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {payMethod === 'payhere' ? 'Payment successful! Your timepiece order has been placed.' : 'Your order is placed. We will verify your bank transfer within 24 hours.'}
                </p>
                {payMethod === 'bank_transfer' && (
                  <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.5)', background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, textAlign: 'left' }}>
                    Receipt uploaded successfully. Our team will verify and update your order status within 24 hours.
                  </div>
                )}
                <div style={{ background: 'linear-gradient(135deg,#1a1209,#2d1f0a)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '16px', padding: '18px 22px', marginBottom: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(212,175,55,0.75)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Order Reference Code</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '22px', fontFamily: 'Jost,monospace', color: '#d4af37', fontWeight: 700, letterSpacing: '0.08em' }}>{orderRef}</span>
                    <button type="button" onClick={handleCopyRef} style={{ background: copiedRef ? 'rgba(46,125,50,0.25)' : 'rgba(212,175,55,0.15)', border: `1px solid ${copiedRef ? '#2e7d32' : '#d4af37'}`, color: copiedRef ? '#81c784' : '#f3e3b8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, fontFamily: 'Jost,sans-serif', transition: 'all 0.2s ease' }}>
                      {copiedRef ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Copied!</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy Code</>
                      )}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={handleDownloadReceipt} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#8b6914 0%,#a67c1e 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Jost,sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(139,105,20,0.25)', transition: 'all 0.2s ease' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download Receipt (PDF)
                </button>
                <button className="bnm-btn-primary" onClick={onClose}>Done</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
