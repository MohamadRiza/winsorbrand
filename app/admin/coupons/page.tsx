// app/admin/coupons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Coupon {
  _id: string;
  code: string;
  discountPercent: number;
  expiresAt: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

const GOLD = '#8B6914';
const INK = '#1a1209';

// ── Random 8-char alphanumeric generator ─────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ── Fetch coupons ─────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setCoupons(data.data);
      else toast.error(data.error || 'Failed to load coupons');
    } catch {
      toast.error('Network error loading coupons');
    } finally {
      setLoading(false);
    }
  };

  // ── Create coupon ─────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!sanitizedCode || sanitizedCode.length > 8) {
      setFormError('Code must be 1–8 alphanumeric characters');
      return;
    }
    if (!discountPercent || discountPercent < 1 || discountPercent > 100) {
      setFormError('Discount must be between 1% and 100%');
      return;
    }
    if (!expiresAt) {
      setFormError('Please select an expiry date');
      return;
    }
    if (new Date(expiresAt) <= new Date()) {
      setFormError('Expiry date must be in the future');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sanitizedCode,
          discountPercent,
          expiresAt,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon "${sanitizedCode}" created successfully`);
        setCoupons(prev => [data.data, ...prev]);
        setCode('');
        setDiscountPercent(10);
        setExpiresAt('');
        setUsageLimit('');
      } else {
        setFormError(data.error || 'Failed to create coupon');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────
  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentActive } : c));
        toast.success(`Coupon ${!currentActive ? 'activated' : 'deactivated'}`);
      } else {
        toast.error(data.error || 'Failed to update coupon');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // ── Delete coupon ─────────────────────────────────────────
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.filter(c => c._id !== id));
        toast.success(`Coupon "${code}" deleted`);
      } else {
        toast.error(data.error || 'Failed to delete coupon');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // ── Get tomorrow's date as min for date picker ─────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div style={{ padding: '32px', fontFamily: "'Jost', sans-serif", minHeight: '100vh', background: '#f9f8f6' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500;600;700&display=swap');

        .cp-form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid rgba(26,18,9,0.12);
          border-radius: 8px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: ${INK};
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
          text-transform: uppercase;
        }
        .cp-form-input:focus { border-color: ${GOLD}; }
        .cp-form-input.no-upper { text-transform: none; }

        .cp-badge-active {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          background: rgba(34,197,94,0.1); color: #15803d; border: 1px solid rgba(34,197,94,0.2);
        }
        .cp-badge-inactive {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.2);
        }
        .cp-badge-expired {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          background: rgba(107,114,128,0.1); color: #6b7280; border: 1px solid rgba(107,114,128,0.2);
        }
        .cp-action-btn {
          padding: 5px 12px;
          border-radius: 6px;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cp-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        .slider-wrapper { position: relative; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(to right, ${GOLD} 0%, ${GOLD} var(--fill, 10%), rgba(26,18,9,0.1) var(--fill, 10%), rgba(26,18,9,0.1) 100%);
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${GOLD};
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.2);
          transition: box-shadow 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover { box-shadow: 0 0 0 5px rgba(139,105,20,0.3); }

        @media (max-width: 768px) {
          .cp-grid { grid-template-columns: 1fr !important; }
          .cp-table-wrapper { overflow-x: auto; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>
          Marketing Tools
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: INK, margin: 0 }}>
          Coupon Codes
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(26,18,9,0.55)', marginTop: 6 }}>
          Create and manage promotional discount codes for your patrons.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28, alignItems: 'start' }} className="cp-grid">

        {/* ── CREATE FORM ── */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(26,18,9,0.07)', borderRadius: 14, padding: 28, boxShadow: '0 4px 24px rgba(26,18,9,0.04)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: '0 0 22px', paddingBottom: 14, borderBottom: '1.5px solid rgba(26,18,9,0.06)' }}>
            Create New Coupon
          </h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Code field */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(26,18,9,0.65)', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Coupon Code <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="cp-form-input"
                  type="text"
                  placeholder="e.g. ADMIN"
                  value={code}
                  maxLength={8}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  style={{ flex: 1, letterSpacing: '0.12em', fontWeight: 700, fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setCode(generateCode())}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(139,105,20,0.08)',
                    border: '1.5px solid rgba(139,105,20,0.2)',
                    borderRadius: 8,
                    color: GOLD,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,105,20,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,105,20,0.08)')}
                >
                  Generate
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(26,18,9,0.4)', marginTop: 5 }}>
                Max 8 characters — letters and numbers only
              </p>
            </div>

            {/* Discount slider */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'rgba(26,18,9,0.65)', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <span>Discount Percentage <span style={{ color: '#dc2626' }}>*</span></span>
                <span style={{ color: GOLD, fontSize: 16, fontWeight: 700 }}>{discountPercent}%</span>
              </label>
              <div className="slider-wrapper">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    setDiscountPercent(v);
                    e.target.style.setProperty('--fill', `${v}%`);
                  }}
                  style={{ ['--fill' as any]: `${discountPercent}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(26,18,9,0.35)', marginTop: 4 }}>
                <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
              {/* Manual input below slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input
                  className="cp-form-input no-upper"
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ width: 80, textAlign: 'center' }}
                />
                <span style={{ fontSize: 13, color: 'rgba(26,18,9,0.55)' }}>% off total cart value</span>
              </div>

              {/* ⚠ High-discount warning — shows only when > 10% */}
              {discountPercent > 10 && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(234,179,8,0.08)',
                  border: '1.5px solid rgba(234,179,8,0.4)',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                      High Discount — Are you sure?
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#a16207', lineHeight: 1.5 }}>
                      You are setting a <strong>{discountPercent}%</strong> discount. This is above the 10% safety threshold.
                      Please confirm this is intentional before creating the coupon.
                    </p>
                  </div>
                </div>
              )}
            </div>


            {/* Expiry date */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(26,18,9,0.65)', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Expiry Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="cp-form-input no-upper"
                type="date"
                value={expiresAt}
                min={minDate}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>

            {/* Usage limit (optional) */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(26,18,9,0.65)', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Usage Limit <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(26,18,9,0.4)' }}>(leave blank for unlimited)</span>
              </label>
              <input
                className="cp-form-input no-upper"
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
              />
            </div>

            {/* Error */}
            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, color: '#dc2626', fontSize: 12.5 }}>
                {formError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '12px 20px',
                background: creating ? 'rgba(139,105,20,0.4)' : `linear-gradient(135deg, ${GOLD}, #a07820)`,
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: creating ? 'not-allowed' : 'pointer',
                boxShadow: creating ? 'none' : '0 4px 12px rgba(139,105,20,0.3)',
                transition: 'all 0.25s ease',
              }}
            >
              {creating ? 'Creating...' : '+ Create Coupon'}
            </button>
          </form>
        </div>

        {/* ── COUPON TABLE ── */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(26,18,9,0.07)', borderRadius: 14, boxShadow: '0 4px 24px rgba(26,18,9,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '22px 28px', borderBottom: '1.5px solid rgba(26,18,9,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>All Coupons</h2>
              <p style={{ fontSize: 12, color: 'rgba(26,18,9,0.45)', marginTop: 3 }}>{coupons.length} total</p>
            </div>
            <button
              onClick={fetchCoupons}
              style={{ padding: '7px 14px', background: 'transparent', border: '1.5px solid rgba(26,18,9,0.12)', borderRadius: 8, color: 'rgba(26,18,9,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Jost', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,18,9,0.12)'; e.currentTarget.style.color = 'rgba(26,18,9,0.6)'; }}
            >
              Refresh
            </button>
          </div>

          <div className="cp-table-wrapper">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(26,18,9,0.4)', fontSize: 13 }}>
                Loading coupons...
              </div>
            ) : coupons.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD, marginBottom: 12 }}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                <p style={{ fontSize: 14, color: 'rgba(26,18,9,0.5)', margin: 0 }}>No coupon codes yet. Create your first one.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(26,18,9,0.025)' }}>
                    {['Code', 'Discount', 'Status', 'Expiry', 'Used / Limit', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(26,18,9,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(26,18,9,0.06)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon, idx) => {
                    const expired = isExpired(coupon.expiresAt);
                    return (
                      <tr key={coupon._id} style={{ borderBottom: '1px solid rgba(26,18,9,0.04)', background: idx % 2 === 0 ? '#ffffff' : 'rgba(26,18,9,0.012)' }}>
                        {/* Code */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: '0.12em', color: GOLD, background: 'rgba(139,105,20,0.07)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(139,105,20,0.18)', fontFamily: 'monospace' }}>
                            {coupon.code}
                          </span>
                        </td>
                        {/* Discount */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 15, color: '#15803d' }}>
                          {coupon.discountPercent}%
                        </td>
                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {expired ? (
                            <span className="cp-badge-expired">Expired</span>
                          ) : coupon.isActive ? (
                            <span className="cp-badge-active">
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
                              Active
                            </span>
                          ) : (
                            <span className="cp-badge-inactive">Inactive</span>
                          )}
                        </td>
                        {/* Expiry */}
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: expired ? '#dc2626' : 'rgba(26,18,9,0.65)', whiteSpace: 'nowrap' }}>
                          {formatDate(coupon.expiresAt)}
                        </td>
                        {/* Usage */}
                        <td style={{ padding: '14px 16px', fontSize: 12.5, color: 'rgba(26,18,9,0.7)' }}>
                          {coupon.usageCount} / {coupon.usageLimit ?? '∞'}
                        </td>
                        {/* Created */}
                        <td style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(26,18,9,0.45)', whiteSpace: 'nowrap' }}>
                          {formatDate(coupon.createdAt)}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {!expired && (
                              <button
                                className="cp-action-btn"
                                onClick={() => handleToggle(coupon._id, coupon.isActive)}
                                style={{ background: coupon.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: coupon.isActive ? '#dc2626' : '#15803d' }}
                              >
                                {coupon.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            <button
                              className="cp-action-btn"
                              onClick={() => handleDelete(coupon._id, coupon.code)}
                              style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
