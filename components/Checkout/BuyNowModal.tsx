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
  onOrderSuccess?: (orderRef: string) => void;
}

export default function BuyNowModal({
  isOpen,
  onClose,
  item,
  profile,
  onOrderSuccess,
}: BuyNowModalProps) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setErrorMsg('');
      setOrderRef('');
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isProfileComplete = !!(
    profile?.address &&
    profile?.city &&
    profile?.postalCode &&
    profile?.country &&
    profile?.mobile &&
    profile?.mobileCode
  );

  const handlePlaceOrder = async () => {
    if (!isProfileComplete) {
      setErrorMsg('Please complete your shipping address in your Profile settings before purchasing.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const ref = `WN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef: ref,
          items: [{
            productId: item.productId,
            productTitle: item.productTitle,
            productModelNo: item.productModelNo,
            productThumbnail: item.productThumbnail,
            colorVariant: item.colorVariant || '',
            quantity: item.quantity,
            price: item.price,
            isGift: false,
            giftNote: '',
            canvaLink: '',
            giftAttachmentUrl: '',
            giftAttachmentName: '',
          }],
          shippingAddress: {
            address: profile!.address,
            city: profile!.city,
            postalCode: profile!.postalCode,
            country: profile!.country,
            mobile: profile!.mobile,
            mobileCode: profile!.mobileCode,
          },
          subtotal: item.price * item.quantity,
          isGift: false,
          couponCode: null,
          validationToken: null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderRef(ref);
        setStep('success');
        if (onOrderSuccess) onOrderSuccess(ref);
      } else {
        setErrorMsg(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Copy ref code ───────────────────────────────────────────────────────
  const handleCopyRef = () => {
    if (!orderRef) return;
    navigator.clipboard.writeText(orderRef);
    setCopiedRef(true);
    toast.success(`Reference code "${orderRef}" copied!`);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // ── Download PDF Receipt ────────────────────────────────────────────────
  const handleDownloadReceipt = () => {
    if (!orderRef || !item) return;

    generateReceiptPdf({
      orderRef,
      customer: {
        name: profile?.name || 'Customer',
        email: profile?.email || 'N/A',
        mobile: `${profile?.mobileCode || ''} ${profile?.mobile || ''}`.trim(),
        address: profile?.address || 'N/A',
        city: profile?.city || 'N/A',
        postalCode: profile?.postalCode || 'N/A',
        country: profile?.country || 'N/A',
      },
      items: [{
        productTitle: item.productTitle,
        productModelNo: item.productModelNo,
        colorVariant: item.colorVariant,
        quantity: item.quantity,
        price: item.price,
      }],
      subtotal: item.price * item.quantity,
      finalTotal: item.price * item.quantity,
      paymentMethod: 'Pay on Delivery / Direct Purchase',
    });

    toast.success('PDF Receipt downloaded successfully!');
  };


  return (
    <>
      <style>{`
        @keyframes bnm-fade-in {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .bnm-overlay {
          position: fixed; inset: 0; z-index: 9998;
          background: rgba(10,6,2,0.75); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .bnm-dialog {
          background: #faf7f0; border: 1px solid rgba(139,105,20,0.22);
          border-radius: 20px; width: 100%; max-width: 480px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.32);
          animation: bnm-fade-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
          font-family: 'Jost', sans-serif;
        }
        .bnm-header {
          background: linear-gradient(135deg, #1a1209, #2d1f0a);
          padding: 20px 24px 18px; border-radius: 20px 20px 0 0;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(212,175,55,0.2);
        }
        .bnm-body { padding: 22px 24px; }
        .bnm-close {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7); width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0; transition: all 0.2s ease;
        }
        .bnm-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .bnm-section {
          background: #fff; border: 1px solid rgba(139,105,20,0.15);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
        }
        .bnm-section-label {
          font-size: 9.5px; font-weight: 700;
          color: rgba(26,18,9,0.45); text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 10px;
        }
        .bnm-btn-primary {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a1209, #2d1f0a);
          color: #d4af37; border: none; border-radius: 10px;
          cursor: pointer; font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .bnm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .bnm-btn-outline {
          width: 100%; padding: 13px;
          background: transparent; border: 1.5px solid rgba(139,105,20,0.35);
          color: #8b6914; border-radius: 10px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 12px;
          font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-top: 10px;
          transition: all 0.2s ease;
        }
        @keyframes bnm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bnm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bnm-dialog">
          <div className="bnm-header">
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#f3e3b8', margin: 0, letterSpacing: '0.03em' }}>
                {step === 'confirm' ? 'Confirm Purchase' : 'Order Confirmed'}
              </h2>
              <p style={{ fontSize: '10.5px', color: 'rgba(212,175,55,0.7)', margin: '3px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {step === 'confirm' ? 'Direct purchase — no cart needed' : 'Your timepiece order is placed'}
              </p>
            </div>
            <button className="bnm-close" onClick={onClose}>×</button>
          </div>

          <div className="bnm-body">
            {step === 'confirm' && (
              <>
                {/* Product */}
                <div className="bnm-section">
                  <div className="bnm-section-label">Timepiece</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.productThumbnail || '/mens-watch-highlight.png'}
                      alt={item.productTitle}
                      style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#faf7f0', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1209' }}>{item.productTitle}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: 2 }}>
                        Model: {item.productModelNo}
                        {item.colorVariant && ` · ${item.colorVariant}`}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#8b6914', fontFamily: 'monospace', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery address */}
                {isProfileComplete ? (
                  <div className="bnm-section">
                    <div className="bnm-section-label">Delivering To</div>
                    <div style={{ fontSize: '13px', color: '#1a1209', lineHeight: 1.7 }}>
                      {profile?.address}, {profile?.city}, {profile?.postalCode}<br />
                      {profile?.country}<br />
                      <span style={{ color: 'rgba(26,18,9,0.6)', fontSize: '12px' }}>{profile?.mobileCode} {profile?.mobile}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.4)', marginTop: 8 }}>
                      To change your address, update your Profile settings.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: '12.5px', color: '#c62828', fontWeight: 600 }}>Shipping address incomplete</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(26,18,9,0.6)', marginTop: 4 }}>
                      Please complete your address in <strong>Profile → Profile Details</strong> before purchasing.
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '12.5px', color: '#c62828' }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  className="bnm-btn-primary"
                  onClick={handlePlaceOrder}
                  disabled={submitting || !isProfileComplete}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'bnm-spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Placing Order...
                    </span>
                  ) : '✓ Confirm Order — Pay on Delivery'}
                </button>

                <button className="bnm-btn-outline" onClick={onClose}>
                  Cancel
                </button>
              </>
            )}

            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
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
                <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.6)', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Your timepiece order has been successfully created.
                </p>

                {/* Order reference box with Copy Code button */}
                <div style={{
                  background: 'linear-gradient(135deg, #1a1209, #2d1f0a)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  borderRadius: '16px', padding: '18px 22px', marginBottom: 16,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(212,175,55,0.75)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
                    Order Reference Code
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: '22px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#d4af37', fontWeight: 700, letterSpacing: '0.08em' }}>
                      {orderRef}
                    </span>

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
                </div>

                {/* Download Receipt PDF Button */}
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

                <button className="bnm-btn-primary" onClick={onClose} style={{ marginTop: 0 }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
