'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { IProduct, CollectionSection, IGiftCategory } from '@/types';
import NewsletterCard from '@/components/NewsletterCard';
import ProductCard from '@/components/ProductCard';
import { toast } from 'react-hot-toast';

// Helper to determine product gender
const getProductGender = (product: IProduct): 'Gents' | 'Ladies' | 'Unisex' => {
  const specs = product.specifications || {};
  for (const key of Object.keys(specs)) {
    if (key.toLowerCase() === 'gender') {
      const val = specs[key].toLowerCase();
      if (val.includes('lady') || val.includes('women') || val.includes('female') || val.includes('ladies')) {
        return 'Ladies';
      }
      if (val.includes('gent') || val.includes('men') || val.includes('male') || val.includes('gents')) {
        return 'Gents';
      }
      return 'Unisex';
    }
  }

  const titleLower = product.title.toLowerCase();
  const descLower = product.description.toLowerCase();
  if (
    titleLower.includes('ladies') ||
    titleLower.includes('women') ||
    titleLower.includes('diamond') ||
    descLower.includes('ladies') ||
    descLower.includes('women')
  ) {
    return 'Ladies';
  }
  if (
    titleLower.includes('gents') ||
    titleLower.includes('men') ||
    descLower.includes('gents') ||
    descLower.includes('men')
  ) {
    return 'Gents';
  }
  return 'Unisex';
};

const getWatchImageUrl = (p: IProduct): string => {
  if (!p) return '/mens-watch-highlight.png';
  if (p.thumbnail?.url) return p.thumbnail.url;
  if (typeof p.thumbnail === 'string' && p.thumbnail) return p.thumbnail;
  if (Array.isArray(p.images) && p.images.length > 0) {
    const img0 = p.images[0];
    if (typeof img0 === 'string' && img0) return img0;
    if (img0?.url) return img0.url;
  }
  if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
    const v0 = p.colorVariants[0];
    if (Array.isArray(v0.images) && v0.images.length > 0) {
      const vImg0 = v0.images[0];
      if (typeof vImg0 === 'string' && vImg0) return vImg0;
      if (vImg0?.url) return vImg0.url;
    }
  }
  return '/mens-watch-highlight.png';
};

function MensCollectionContent() {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<CollectionSection | 'all'>('all');
  const [selectedGift, setSelectedGift] = useState<string | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // API States
  const [products, setProducts] = useState<IProduct[]>([]);
  const [giftCategories, setGiftCategories] = useState<IGiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/gift-categories')
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) {
          setProducts(prodData.data || []);
        } else {
          throw new Error(prodData.error || 'Failed to fetch timepieces');
        }

        if (catData.success) {
          setGiftCategories(catData.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading products');
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

  // Filtered Products Memo (strictly defaults to Gents)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // 2. Gender Filter (Strictly Men's & Unisex for Men's Page)
    result = result.filter(p => {
      const g = getProductGender(p).toLowerCase();
      return g === 'gents' || g === 'unisex';
    });

    // 3. Collection Section Filter
    if (selectedSection !== 'all') {
      result = result.filter(p => p.collectionSections?.includes(selectedSection));
    }

    // 4. Seasonal / Occasion Filter
    if (selectedGift !== 'all') {
      result = result.filter(p => p.giftCategories?.includes(selectedGift));
    }

    // 5. Price Sorting
    if (priceSort === 'low-to-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-to-low') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedSection, selectedGift, priceSort]);

  return (
    <div style={{ backgroundColor: '#faf7f0', color: '#1a1209', minHeight: '100vh', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        .mens-hero-grid {
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
        .mens-hero-img-card {
          position: relative;
          height: 380px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(139,105,20,0.4);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          transition: transform 0.4s ease, border-color 0.4s ease;
        }
        .mens-hero-img-card:hover {
          transform: translateY(-4px) scale(1.015);
          border-color: rgba(223,177,91,0.8);
        }
        @media (max-width: 900px) {
          .mens-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
          .mens-hero-img-card {
            height: 240px;
            max-width: 480px;
            margin: 0 auto;
            width: 100%;
          }
        }
        /* ── BENEFITS MARQUEE SLIDER FOR MOBILE ── */
        @keyframes benefits-marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
        .benefits-carousel-wrapper {
          width: 100%;
          overflow: hidden;
          margin-bottom: 40px;
        }
        .benefits-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          background: #fff;
          padding: 24px 32px;
          border-radius: 12px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          margin: 0 auto;
          max-width: 1400px;
          width: 100%;
        }
        .benefits-marquee-track {
          display: contents;
        }
        .benefits-marquee-track[aria-hidden="true"] {
          display: none;
        }
        .benefit-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #1a1209;
        }
        .benefit-item svg {
          color: #8b6914;
          flex-shrink: 0;
        }
        .benefit-item h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.01em;
        }
        .benefit-item span {
          font-size: 10.5px;
          color: rgba(26, 18, 9, 0.5);
          margin: 0;
          display: block;
        }

        @media (max-width: 1024px) {
          .benefits-carousel-wrapper {
            margin-bottom: 32px;
            overflow: hidden;
            width: 100vw;
            margin-left: calc(-50vw + 50%);
            padding: 0 0 10px;
          }
          .benefits-bar {
            display: flex;
            flex-wrap: nowrap;
            width: max-content;
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            gap: 0;
          }
          .benefits-marquee-track {
            display: flex !important;
            align-items: center;
            gap: 16px;
            animation: benefits-marquee 22s linear infinite;
            flex-shrink: 0;
            padding-right: 16px;
          }
          .benefits-marquee-track[aria-hidden="true"] {
            display: flex !important;
          }
          .benefit-item {
            flex: 0 0 270px;
            width: 270px;
            box-sizing: border-box;
            background: #fff;
            border-radius: 12px;
            padding: 16px 20px;
            border: 1px solid rgba(26, 18, 9, 0.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.015);
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
        .watch-card-title-link {
          text-decoration: none;
          color: inherit;
        }
        .watch-card-title {
          font-size: 15.5px;
          font-weight: 500;
          margin: 0 0 6px;
          color: #1a1209;
          letter-spacing: 0.01em;
          font-variant-numeric: lining-nums;
          font-feature-settings: "lnum" 1;
        }
        .watch-card-specs {
          font-size: 12px;
          color: rgba(26,18,9,0.5);
          margin: 0;
        }
        .watch-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          border-top: 1px solid rgba(26,18,9,0.05);
          padding-top: 14px;
        }
        .watch-card-price {
          font-size: 14.5px;
          font-weight: 600;
          color: #8b6914;
        }
        .watch-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .card-action-btn {
          background: transparent;
          border: 1px solid rgba(26,18,9,0.1);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(26, 18, 9, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .card-action-btn:hover {
          background: rgba(26, 18, 9, 0.04);
          color: #1a1209;
          border-color: #1a1209;
        }
        .card-action-btn.active {
          background: #ffebeb;
          color: #ff3b30;
          border-color: #ff3b30;
        }
        .card-action-btn.highlight:hover {
          background: #1a1209;
          color: #fff;
          border-color: #1a1209;
        }

        @media (max-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .watch-img-container {
            padding: 12px;
          }
          .watch-card-info {
            padding: 12px;
          }
          .watch-card-title {
            font-size: 13.5px;
            margin-bottom: 4px;
          }
          .watch-card-specs {
            font-size: 11px;
          }
          .watch-card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            margin-top: 12px;
            padding-top: 10px;
          }
          .watch-card-price {
            font-size: 13px;
          }
          .watch-card-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .card-action-btn {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>

      {/* ── HERO BANNER (VIDEO + IMAGE COMBINED) ── */}
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
          background: '#0a0a0a'
        }}
      >
        {/* Background Video */}
        <video 
          src="/Winsor_men_vid.webm" 
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

        {/* Foreground Content */}
        <div className="mens-hero-grid">
          {/* Left Column: Text & Badge */}
          <div style={{ textAlign: 'left' }} className="mens-hero-text-block">
            <div style={{ fontSize: '10px', letterSpacing: '0.28em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>
              WINSOR MAISON HORLOGERIE
            </div>
            <h1 style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.4vw, 44px)', fontWeight: 600, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '0.02em', color: '#fff' }}>
              Men's Timepiece Collection
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 'clamp(13px, 1.1vw, 15px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', maxWidth: '480px', margin: '0 0 22px', fontWeight: 300 }}>
              Engineered for those who never settle. Discover bold, distinguished timepieces crafted with Japanese precision movements and Dubai-certified quality.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ padding: '8px 18px', background: 'rgba(139,105,20,0.2)', border: '1px solid rgba(223,177,91,0.45)', borderRadius: '20px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: '#dfb15b' }}>
                {filteredProducts.length} MEN'S TIMEPIECES AVAILABLE
              </div>
            </div>
          </div>

          {/* Right Column: Featured Image Card */}
          <div className="mens-hero-img-card">
            <Image 
              src="/winsor_man.png" 
              alt="Winsor Men's Collection" 
              fill 
              sizes="(max-width: 900px) 100vw, 500px" 
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              priority
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,5,0.85) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>EXECUTIVE COLLECTION</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#ffffff', fontWeight: 500 }}>Precision & Performance</span>
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px' }}>DUBAI 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 4% 100px' }}>
        
        {/* BENEFITS BAR (MAISON TRUST HIGHLIGHTS) */}
        <div className="benefits-carousel-wrapper">
          <div className="benefits-bar">
            {/* Track 1 */}
            <div className="benefits-marquee-track">
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div><h4>Japan Movement</h4><span>UAE Registered Brand</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div><h4>1 Year International Warranty</h4><span>Official Coverage</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div><h4>Free Shipping</h4><span>Island-wide in Sri Lanka</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div><h4>Easy Returns</h4><span>Within 7 Days</span></div>
              </div>
            </div>

            {/* Track 2 (Duplicate for Seamless Infinite Mobile Loop) */}
            <div className="benefits-marquee-track" aria-hidden="true">
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div><h4>Japan Movement</h4><span>UAE Registered Brand</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div><h4>1 Year International Warranty</h4><span>Official Coverage</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div><h4>Free Shipping</h4><span>Island-wide in Sri Lanka</span></div>
              </div>
              <div className="benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div><h4>Easy Returns</h4><span>Within 7 Days</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div style={{ background: '#fff', border: '1px solid rgba(26,18,9,0.06)', borderRadius: '12px', padding: '20px 24px', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Seasonal / Occasion Filter Dropdown */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10.5px', letterSpacing: '0.15em', color: '#8b6914', textTransform: 'uppercase', fontWeight: 600 }}>SEASON & OCCASION:</span>
            <select
              value={selectedGift}
              onChange={e => setSelectedGift(e.target.value)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(139,105,20,0.3)',
                background: '#faf7f0',
                color: '#1a1209',
                fontSize: '12px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Seasons & Occasions</option>
              {giftCategories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Section Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedSection('all')} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', background: selectedSection === 'all' ? 'rgba(139,105,20,0.12)' : 'transparent', color: selectedSection === 'all' ? '#8b6914' : 'rgba(26,18,9,0.6)', border: '1px solid rgba(26,18,9,0.08)', cursor: 'pointer' }}>All</button>
            <button onClick={() => setSelectedSection('sports')} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', background: selectedSection === 'sports' ? 'rgba(139,105,20,0.12)' : 'transparent', color: selectedSection === 'sports' ? '#8b6914' : 'rgba(26,18,9,0.6)', border: '1px solid rgba(26,18,9,0.08)', cursor: 'pointer' }}>Sports</button>
            <button onClick={() => setSelectedSection('luxury')} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', background: selectedSection === 'luxury' ? 'rgba(139,105,20,0.12)' : 'transparent', color: selectedSection === 'luxury' ? '#8b6914' : 'rgba(26,18,9,0.6)', border: '1px solid rgba(26,18,9,0.08)', cursor: 'pointer' }}>Classic</button>
            <button onClick={() => setSelectedSection('new')} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', background: selectedSection === 'new' ? 'rgba(139,105,20,0.12)' : 'transparent', color: selectedSection === 'new' ? '#8b6914' : 'rgba(26,18,9,0.6)', border: '1px solid rgba(26,18,9,0.08)', cursor: 'pointer' }}>New Arrivals</button>
            <button onClick={() => setSelectedSection('limited')} style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', background: selectedSection === 'limited' ? 'rgba(139,105,20,0.12)' : 'transparent', color: selectedSection === 'limited' ? '#8b6914' : 'rgba(26,18,9,0.6)', border: '1px solid rgba(26,18,9,0.08)', cursor: 'pointer' }}>Limited</button>
          </div>

          {/* Search & Sort */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search men's watches..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(26,18,9,0.12)', fontSize: '12px', width: '180px', outline: 'none' }}
            />
            <select 
              value={priceSort} 
              onChange={e => setPriceSort(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(26,18,9,0.12)', fontSize: '12px', outline: 'none', background: '#fff', cursor: 'pointer' }}
            >
              <option value="none">Default Sort</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ── PRODUCT GRID ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(26,18,9,0.45)' }}>
            <p>Loading Men's Timepieces…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ff3b30' }}>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '12px', border: '1px border rgba(26,18,9,0.06)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', margin: '0 0 10px' }}>No Timepieces Found</h3>
            <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', margin: '0 0 20px' }}>Try resetting your filter selection or search query.</p>
            <button onClick={() => { setSelectedSection('all'); setSelectedGender('all'); setSearchQuery(''); }} style={{ padding: '10px 24px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Reset All Filters</button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                convertPrice={convertPrice}
                addToCart={addToCart}
                toggleWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(product._id)}
                ratingData={reviewRatings[product._id]}
              />
            ))}
          </div>
        )}

        {/* Black Moving Marquee Ribbon & VIP Newsletter Card */}
        <NewsletterCard imageSrc="/winsor_man.png" badgeText="WINSOR GENTS CONCIERGE" />
      </div>
    </div>
  );
}

export default function MensCollectionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center' }}>Loading Men's Collection…</div>}>
      <MensCollectionContent />
    </Suspense>
  );
}
