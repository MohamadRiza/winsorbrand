// app/admin/coupons/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'expired'>('all');

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
      if (data.success) setCoupons(data.data || []);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied coupon code "${text}"!`);
  };

  // ── Get tomorrow's date as min for date picker ─────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Aggregates
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && !isExpired(c.expiresAt)).length;
  const expiredCoupons = coupons.filter(c => isExpired(c.expiresAt)).length;
  const inactiveCoupons = coupons.filter(c => !c.isActive && !isExpired(c.expiresAt)).length;

  // Filtered List
  const filteredCoupons = useMemo(() => {
    const q = searchQuery.toUpperCase().trim();
    return coupons.filter(c => {
      const matchesSearch = !q || c.code.includes(q) || c.discountPercent.toString().includes(q);
      
      let matchesTab = true;
      if (filterTab === 'active') {
        matchesTab = c.isActive && !isExpired(c.expiresAt);
      } else if (filterTab === 'expired') {
        matchesTab = isExpired(c.expiresAt);
      }

      return matchesSearch && matchesTab;
    });
  }, [coupons, searchQuery, filterTab]);

  return (
    <div 
      className="min-h-screen font-['Jost'] text-[#1a1209] p-4 sm:p-8 select-none"
      style={{
        backgroundImage: `linear-gradient(rgba(250, 247, 240, 0.93), rgba(250, 247, 240, 0.93)), url('/hero_bg_marble.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Font Imports & Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');
        
        .slider-wrapper { position: relative; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(to right, #8B6914 0%, #8B6914 var(--fill, 10%), rgba(26,18,9,0.1) var(--fill, 10%), rgba(26,18,9,0.1) 100%);
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #8B6914;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.25);
          transition: box-shadow 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(139,105,20,0.35); }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/20 pb-5">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              PROMOTIONAL COUPONS & DISCOUNTS
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-0.5">
              Create, configure, and issue luxury voucher codes for Winsor Maison patrons.
            </p>
          </div>
          
          <button
            onClick={fetchCoupons}
            className="self-start sm:self-center px-4 py-2.5 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-[#1a1209] hover:text-[#8B6914] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Vouchers
          </button>
        </div>

        {/* ── Professional Tabular Metrics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL PROMOTIONS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalCoupons.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">ACTIVE & LIVE</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{activeCoupons.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">PAUSED / INACTIVE</p>
            <p className="font-['Jost'] text-3xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{inactiveCoupons.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">EXPIRED PROMOTIONS</p>
            <p className="font-['Jost'] text-3xl font-bold text-gray-500 mt-1 tabular-nums font-mono">{expiredCoupons.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Main Workspace Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── CREATE FORM CARD (Left Side 5 Columns) ── */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm border border-[#8B6914]/25 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="border-b border-[#1a1209]/10 pb-4">
              <h2 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209] uppercase tracking-wider">
                CREATE NEW PROMOTIONAL COUPON
              </h2>
              <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Configure discount percentage and usage rules</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">

              {/* Code field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                  COUPON VOUCHER CODE <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WINSOR20"
                    value={code}
                    maxLength={8}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="flex-1 px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-sm font-bold text-[#1a1209] uppercase tracking-wider focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setCode(generateCode())}
                    className="px-3.5 py-2.5 bg-[#faf7f0] border border-[#8B6914]/30 hover:bg-[#8B6914] hover:text-white text-[#8B6914] text-xs font-bold font-mono rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    ⚡ Generate
                  </button>
                </div>
                <p className="text-[10px] text-[#1a1209]/50">
                  Max 8 characters — letters and numbers only.
                </p>
              </div>

              {/* Discount slider */}
              <div className="space-y-2 bg-[#faf7f0]/60 border border-[#1a1209]/10 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    DISCOUNT PERCENTAGE <span className="text-red-500">*</span>
                  </span>
                  <span className="text-base font-bold font-mono text-[#8B6914]">{discountPercent}% OFF</span>
                </div>
                
                <div className="slider-wrapper pt-2">
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
                
                <div className="flex justify-between text-[9px] font-mono text-[#1a1209]/40 pt-1">
                  <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-1.5 bg-white border border-[#1a1209]/15 rounded-lg text-center font-mono text-xs font-bold text-[#1a1209]"
                  />
                  <span className="text-xs text-[#1a1209]/60 font-medium">% off cart subtotal</span>
                </div>

                {/* ⚠ High-discount warning — shows only when > 10% */}
                {discountPercent > 10 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex gap-2.5 items-start">
                    <svg className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-amber-900">High Discount Warning</p>
                      <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                        Discount is set to <strong>{discountPercent}%</strong>. Exceeds the standard 10% promotional limit.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expiry date */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                  EXPIRY DATE <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  min={minDate}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              {/* Usage limit (optional) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                  USAGE LIMIT <span className="text-[10px] font-normal text-[#1a1209]/40">(LEAVE BLANK FOR UNLIMITED)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Creating Voucher…' : '+ Publish Coupon Code'}
              </button>
            </form>
          </div>

          {/* ── COUPONS LIST TABLE (Right Side 7 Columns) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search Toolbar & Tabs */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search coupons by code or discount percentage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              <div className="flex bg-[#fbf9f4] border border-[#1a1209]/10 rounded-lg p-1">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    filterTab === 'all' ? 'bg-[#1a1209] text-white shadow-sm' : 'text-[#1a1209]/60 hover:text-[#1a1209]'
                  }`}
                >
                  All ({totalCoupons})
                </button>
                <button
                  onClick={() => setFilterTab('active')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    filterTab === 'active' ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-800/70 hover:text-emerald-800'
                  }`}
                >
                  Active ({activeCoupons})
                </button>
                <button
                  onClick={() => setFilterTab('expired')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    filterTab === 'expired' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Expired ({expiredCoupons})
                </button>
              </div>
            </div>

            {/* Coupons Table Card */}
            <div className="bg-white/95 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B6914] mx-auto" />
                    <p className="mt-3 text-xs font-semibold text-[#8B6914] uppercase tracking-wider">Loading Vouchers…</p>
                  </div>
                ) : filteredCoupons.length === 0 ? (
                  <div className="p-16 text-center">
                    <svg className="w-12 h-12 text-[#8B6914]/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-sm font-semibold text-[#1a1209]">No coupons found matching your criteria</p>
                    <p className="text-xs text-[#1a1209]/50 mt-1">Create a new coupon code using the form on the left.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1a1209] text-[#f3e3b8]">
                      <tr>
                        <th className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">VOUCHER CODE</th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">DISCOUNT</th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">STATUS</th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">EXPIRY</th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">USED / LIMIT</th>
                        <th className="px-5 py-3.5 text-right text-[10px] font-semibold tracking-[0.15em] uppercase">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1209]/5">
                      {filteredCoupons.map((coupon) => {
                        const expired = isExpired(coupon.expiresAt);

                        return (
                          <tr key={coupon._id} className="hover:bg-[#faf7f0]/60 transition-colors">
                            {/* Code */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-xs tracking-wider text-[#8B6914] bg-[#faf7f0] border border-[#8B6914]/30 px-2.5 py-1 rounded-lg">
                                  {coupon.code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(coupon.code)}
                                  className="text-[10px] font-bold text-[#8B6914] hover:text-[#1a1209] underline cursor-pointer"
                                  title="Copy Code"
                                >
                                  Copy
                                </button>
                              </div>
                            </td>

                            {/* Discount */}
                            <td className="px-5 py-4">
                              <span className="font-mono font-bold text-sm text-emerald-700">
                                {coupon.discountPercent}% OFF
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="px-5 py-4">
                              {expired ? (
                                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold rounded-full">
                                  ⌛ Expired
                                </span>
                              ) : coupon.isActive ? (
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
                                  ⏸ Inactive
                                </span>
                              )}
                            </td>

                            {/* Expiry */}
                            <td className="px-5 py-4 text-xs font-mono">
                              <span className={expired ? 'text-red-600 font-bold' : 'text-[#1a1209]/70'}>
                                {formatDate(coupon.expiresAt)}
                              </span>
                            </td>

                            {/* Usage */}
                            <td className="px-5 py-4 text-xs font-mono font-semibold text-[#1a1209]/80">
                              {coupon.usageCount} / {coupon.usageLimit ?? '∞'}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {!expired && (
                                  <button
                                    onClick={() => handleToggle(coupon._id, coupon.isActive)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                      coupon.isActive
                                        ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {coupon.isActive ? 'Pause' : 'Activate'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(coupon._id, coupon.code)}
                                  className="px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
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

      </div>
    </div>
  );
}
