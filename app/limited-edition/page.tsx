'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { IProduct, CollectionSection } from '@/types';
import NewsletterCard from '@/components/NewsletterCard';
import ProductCard from '@/components/ProductCard';
import { toast } from 'react-hot-toast';

interface IGiftCategory {
  _id: string;
  name: string;
  slug: string;
}

const getWatchImageUrl = (p: IProduct): string => {
  if (!p) return '/winsor_man.png';
  if (p.thumbnail?.url) return p.thumbnail.url;
  if (typeof p.thumbnail === 'string' && p.thumbnail) return p.thumbnail;
  if (Array.isArray((p as any).images) && (p as any).images.length > 0) {
    const img0 = (p as any).images[0];
    if (typeof img0 === 'string' && img0) return img0;
    if (img0?.url) return img0.url;
  }
  if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
    const v0 = p.colorVariants[0] as any;
    const vImgs = v0.images || v0.image;
    if (Array.isArray(vImgs) && vImgs.length > 0) {
      const vImg0 = vImgs[0];
      if (typeof vImg0 === 'string' && vImg0) return vImg0;
      if (vImg0?.url) return vImg0.url;
    }
  }
  return '/winsor_man.png';
};

function LimitedEditionContent() {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<CollectionSection | 'all'>('limited');
  const [selectedGift, setSelectedGift] = useState<string | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');
  const [wishlist, setWishlist] = useState<string[]>([]);

  // API States
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const prodData = await res.json();

        if (prodData.success) {
          setProducts(prodData.data || []);
        } else {
          setError(prodData.error || 'Failed to fetch products');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const savedWishlist = localStorage.getItem('winsor_wishlist');
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const ids = products.map(p => p._id).filter(Boolean).join(',');
    fetch(`/api/reviews/ratings?ids=${ids}`)
      .then(r => r.json())
      .then(data => { if (data.success) setReviewRatings(data.data || {}); })
      .catch(() => {});
  }, [products]);

  const toggleWishlist = (productId: string) => {
    const isFav = wishlist.includes(productId);
    let updated: string[];
    if (isFav) {
      updated = wishlist.filter(id => id !== productId);
      toast.success('Removed from Wishlist');
    } else {
      updated = [...wishlist, productId];
      toast.success('Added to Wishlist');
    }
    setWishlist(updated);
    localStorage.setItem('winsor_wishlist', JSON.stringify(updated));
  };

  // Filtered Products Memo (Limited Edition Focus)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // 2. Collection Section Filter (Defaults to 'limited' or limited matches)
    if (selectedSection !== 'all') {
      result = result.filter(p => {
        if (p.collectionSections?.includes(selectedSection)) return true;
        const titleLower = p.title.toLowerCase();
        const descLower = p.description.toLowerCase();
        if (selectedSection === 'limited') {
          return titleLower.includes('limited') || titleLower.includes('reserve') || titleLower.includes('anniversary') || titleLower.includes('edition') || descLower.includes('limited');
        }
        return false;
      });
    } else {
      result = result.filter(p => {
        const titleLower = p.title.toLowerCase();
        const descLower = p.description.toLowerCase();
        return p.collectionSections?.includes('limited') || titleLower.includes('limited') || titleLower.includes('reserve') || titleLower.includes('edition') || descLower.includes('limited');
      });
    }

    // 3. Price Sorting
    if (priceSort === 'low-to-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-to-low') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedSection, priceSort]);

  return (
    <div style={{ backgroundColor: '#faf7f0', color: '#1a1209', minHeight: '100vh', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        .limited-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
          max-width: 1320px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          width: 100%;
        }
        .limited-hero-img-card {
          position: relative;
          height: 380px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(223,177,91,0.6);
          box-shadow: 0 24px 60px rgba(0,0,0,0.7);
          transition: transform 0.4s ease;
        }
        .limited-hero-img-card:hover {
          transform: translateY(-4px) scale(1.015);
        }
        @media (max-width: 900px) {
          .limited-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
          .limited-hero-img-card {
            height: 240px;
            max-width: 480px;
            margin: 0 auto;
            width: 100%;
          }
        }

        /* ── PRODUCT GRID & WATCH CARD CONTAINER ── */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }
        .watch-card-container {
          background: #faf7f0;
          border-radius: 16px;
          border: 1px solid rgba(26,18,9,0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 4px 16px rgba(26,18,9,0.02);
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        .watch-card-container:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(26,18,9,0.08);
          border-color: rgba(139,105,20,0.3);
          background: #ffffff;
        }
        .watch-img-container {
          position: relative;
          aspect-ratio: 1;
          background: transparent;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .watch-card-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.6s ease;
        }
        .watch-card-container:hover .watch-card-image {
          transform: scale(1.06);
        }
        .watch-card-badge {
          position: absolute;
          left: 16px;
          top: 16px;
          background: #1a1209;
          color: #fff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          padding: 4px 10px;
          border-radius: 4px;
          z-index: 2;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .watch-card-info {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: transparent;
        }
        .watch-card-title-link { text-decoration: none; color: inherit; }
        .watch-card-title {
          font-size: 15.5px;
          font-weight: 500;
          margin: 0 0 6px;
          color: #1a1209;
          letter-spacing: 0.01em;
        }
        .watch-card-specs { font-size: 12px; color: rgba(26,18,9,0.5); margin: 0; }
        .watch-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          border-top: 1px solid rgba(26,18,9,0.05);
          padding-top: 14px;
        }
        .watch-card-price { font-size: 14.5px; font-weight: 600; color: #8b6914; }
        .watch-card-actions { display: flex; gap: 8px; align-items: center; }
        .card-action-btn {
          background: transparent;
          border: 1px solid rgba(26,18,9,0.1);
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(26,18,9,0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .card-action-btn:hover { background: rgba(26,18,9,0.04); color: #1a1209; border-color: #1a1209; }
        .card-action-btn.active { background: #ffebeb; color: #ff3b30; border-color: #ff3b30; }
        .card-action-btn.highlight:hover { background: #1a1209; color: #fff; border-color: #1a1209; }

        @keyframes hero-benefits-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .hero-attached-benefits-wrapper {
          position: relative;
          z-index: 30;
          max-width: 1400px;
          margin: -34px auto 20px;
          padding: 0 4%;
          width: 100%;
        }
        .hero-attached-benefits-bar {
          position: relative;
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.09);
          padding: 20px 32px;
          backdrop-filter: blur(12px);
          overflow: hidden;
        }
        .hero-attached-benefit-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #1a1209;
        }
        .hero-attached-benefit-item svg {
          color: #8b6914;
          flex-shrink: 0;
        }
        .hero-attached-benefit-item h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.01em;
          color: #1a1209;
          white-space: nowrap;
        }
        .hero-attached-benefit-item span {
          font-size: 10.5px;
          color: rgba(26, 18, 9, 0.5);
          margin: 0;
          display: block;
          white-space: nowrap;
        }

        @media (min-width: 1025px) {
          .hero-attached-benefits-marquee-container { display: block; }
          .hero-attached-benefits-track {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
            align-items: center;
            width: 100%;
          }
          .hero-attached-benefits-track.duplicate { display: none !important; }
        }

        @media (max-width: 1024px) {
          .hero-attached-benefits-wrapper { margin: -24px auto 16px; padding: 0 16px; }
          .hero-attached-benefits-bar { padding: 16px 0; display: flex; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
          .hero-attached-benefits-bar::before, .hero-attached-benefits-bar::after {
            content: ''; position: absolute; top: 0; bottom: 0; width: 24px; z-index: 5; pointer-events: none;
          }
          .hero-attached-benefits-bar::before { left: 0; background: linear-gradient(to right, #ffffff 0%, transparent 100%); }
          .hero-attached-benefits-bar::after { right: 0; background: linear-gradient(to left, #ffffff 0%, transparent 100%); }
          .hero-attached-benefits-marquee-container {
            display: flex; width: max-content; animation: hero-benefits-marquee 25s linear infinite; will-change: transform;
          }
          .hero-attached-benefits-marquee-container:hover { animation-play-state: paused; }
          .hero-attached-benefits-track { display: flex; align-items: center; gap: 32px; padding-right: 32px; flex-shrink: 0; }
          .hero-attached-benefit-item { flex-shrink: 0; }
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
        }

        @media (max-width: 768px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .watch-img-container { padding: 12px; }
          .watch-card-info { padding: 12px; }
          .watch-card-title { font-size: 13.5px; margin-bottom: 4px; }
          .watch-card-specs { font-size: 11px; }
          .watch-card-footer { flex-direction: column; align-items: flex-start; gap: 10px; margin-top: 12px; padding-top: 10px; }
          .watch-card-price { font-size: 13px; }
          .watch-card-actions { width: 100%; justify-content: flex-end; }
          .card-action-btn { width: 28px; height: 28px; }
        }
      `}</style>

      {/* ── HERO BANNER ── */}
      <section 
        style={{ 
          position: 'relative', 
          minHeight: 'min(82vh, 680px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          overflow: 'hidden',
          color: '#ffffff',
          padding: '130px 24px 70px',
          background: '#090806'
        }}
      >
        {/* Background Video */}
        <video 
          src="/winsor_limited_actor_video.webm" 
          autoPlay 
          muted 
          loop 
          playsInline 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, opacity: 0.55 }}
        />

        {/* Gradient Overlay */}
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(10,8,5,0.85) 0%, rgba(10,8,5,0.65) 50%, rgba(10,8,5,0.95) 100%)' }} 
        />

        {/* Hero Content */}
        <div className="limited-hero-grid">
          {/* Left Column: Text & Badge */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.28em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>
              EXCLUSIVITY & RARE CRAFTSMANSHIP
            </div>
            <h1 style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.4vw, 44px)', fontWeight: 600, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '0.02em', color: '#fff' }}>
              Limited Edition Reserve
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 'clamp(13px, 1.1vw, 15px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', maxWidth: '480px', margin: '0 0 22px', fontWeight: 300 }}>
              Strictly numbered production runs. Mastercrafted with premium materials, automatic & precision movements, and bespoke luxury packaging.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ padding: '8px 18px', background: 'rgba(139,105,20,0.2)', border: '1px solid rgba(223,177,91,0.45)', borderRadius: '20px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: '#dfb15b' }}>
                {filteredProducts.length} LIMITED EDITIONS PRODUCED
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image Card */}
          <div className="limited-hero-img-card">
            <Image
              src="/winsor_limited_actor.webp"
              alt="Winsor Limited Edition Watch"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 500px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,5,0.85) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>INDIVIDUALLY NUMBERED</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#ffffff', fontWeight: 500 }}>Rare Horological Masterpiece</span>
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px' }}>DUBAI 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATTACHED BENEFITS BAR ── */}
      <div className="hero-attached-benefits-wrapper">
        <div className="hero-attached-benefits-bar">
          <div className="hero-attached-benefits-marquee-container">
            <div className="hero-attached-benefits-track">
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 7 Days</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>
            <div className="hero-attached-benefits-track duplicate" aria-hidden="true">
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 7 Days</span>
                </div>
              </div>
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CATALOG CONTENT ── */}
      <main id="limited-catalog" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px 100px' }}>

        {/* ── TOOLBAR & FILTERS ── */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '16px', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px',
            background: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(26,18,9,0.06)'
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search limited editions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '6px',
                border: '1px solid rgba(26,18,9,0.15)',
                fontSize: '12.5px',
                outline: 'none',
                background: '#faf7f0'
              }}
            />
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="rgba(26,18,9,0.4)" 
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['limited', 'new', 'sports', 'luxury', 'all'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  border: selectedSection === sec ? '1.5px solid #8b6914' : '1px solid rgba(26,18,9,0.12)',
                  background: selectedSection === sec ? '#8b6914' : '#ffffff',
                  color: selectedSection === sec ? '#ffffff' : 'rgba(26,18,9,0.7)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase'
                }}
              >
                {sec === 'limited' ? 'Limited Editions' : sec === 'new' ? 'New Additions' : sec === 'sports' ? 'Sports' : sec === 'luxury' ? 'Executive' : 'All'}
              </button>
            ))}
          </div>

          {/* Price Sorting */}
          <select
            value={priceSort}
            onChange={(e: any) => setPriceSort(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(26,18,9,0.15)',
              fontSize: '12px',
              background: '#ffffff',
              color: '#1a1209',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="none">Sort by Price</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>
        </div>

        {/* ── PRODUCT GRID ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div 
              style={{ 
                width: '36px', height: '36px', border: '3px solid rgba(139,105,20,0.2)', borderTopColor: '#8b6914', 
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' 
              }} 
            />
            <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px' }}>Loading Limited Edition timepieces…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#c93b2b' }}>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '16px', border: '1px dashed rgba(26,18,9,0.15)' }}>
            <p style={{ fontSize: '15px', color: 'rgba(26,18,9,0.5)', margin: 0 }}>No limited edition timepieces matched your search criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSection('all'); setPriceSort('none'); }}
              style={{ marginTop: '16px', padding: '10px 24px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                convertPrice={convertPrice}
                addToCart={addToCart}
                toggleWishlist={toggleWishlist}
                isWishlisted={Boolean(p._id && wishlist.includes(p._id))}
                ratingData={p._id ? reviewRatings[p._id] : undefined}
              />
            ))}
          </div>
        )}

      </main>

      {/* ── NEWSLETTER FOOTER CARD ── */}
      <NewsletterCard imageSrc="/Home1.webp" />
    </div>
  );
}

export default function LimitedEditionPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf7f0' }} />}>
      <LimitedEditionContent />
    </Suspense>
  );
}
