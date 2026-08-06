'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import { IProduct, IGiftCategory, CollectionSection } from '@/types';

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
  if (!p) return '/womens-watch-highlight.png';
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
  return '/womens-watch-highlight.png';
};

function WomensCollectionContent() {
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

  // Filtered Products Memo (strictly defaults to Ladies)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // 2. Gender Filter (Strictly Women's & Unisex for Women's Page)
    result = result.filter(p => {
      const g = getProductGender(p).toLowerCase();
      return g === 'ladies' || g === 'unisex';
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
        .womens-hero-grid {
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
        .womens-hero-img-card {
          position: relative;
          height: 380px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(139,105,20,0.4);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          transition: transform 0.4s ease, border-color 0.4s ease;
        }
        .womens-hero-img-card:hover {
          transform: translateY(-4px) scale(1.015);
          border-color: rgba(223,177,91,0.8);
        }
        @media (max-width: 900px) {
          .womens-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
          .womens-hero-img-card {
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
          src="/winsor_gir_vid.webm" 
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
        <div className="womens-hero-grid">
          {/* Left Column: Text & Badge */}
          <div style={{ textAlign: 'left' }} className="womens-hero-text-block">
            <div style={{ fontSize: '11px', letterSpacing: '0.35em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px' }}>
              ELEGANCE & REFINED GRACE
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(36px, 5.2vw, 68px)', fontWeight: 500, lineHeight: 1.06, margin: '0 0 18px', letterSpacing: '0.01em', color: '#fff' }}>
              Women's Timepiece Collection
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(15px, 1.6vw, 20px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.88)', maxWidth: '580px', margin: '0 0 28px', fontWeight: 300 }}>
              Timeless beauty designed to complement every moment. Explore delicate dials, gold accents, and Japanese movement reliability.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ padding: '12px 24px', background: 'rgba(139,105,20,0.22)', border: '1px solid #8b6914', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: '#dfb15b' }}>
                {filteredProducts.length} WOMEN'S TIMEPIECES AVAILABLE
              </div>
            </div>
          </div>

          {/* Right Column: Featured Image Card */}
          <div className="womens-hero-img-card">
            <Image 
              src="/winsor_girl_G.png" 
              alt="Winsor Women's Collection" 
              fill 
              sizes="(max-width: 900px) 100vw, 500px" 
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              priority
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,5,0.85) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>LADIES ELEGANCE</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#ffffff', fontWeight: 500 }}>Timeless & Graceful</span>
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
              placeholder="Search women's watches..." 
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
            <p>Loading Women's Timepieces…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ff3b30' }}>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '12px', border: '1px border rgba(26,18,9,0.06)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', margin: '0 0 10px' }}>No Timepieces Found</h3>
            <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', margin: '0 0 20px' }}>Try resetting your filter selection or search query.</p>
            <button onClick={() => { setSelectedSection('all'); setSelectedGift('all'); setSearchQuery(''); }} style={{ padding: '10px 24px', background: '#8b6914', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>Reset All Filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
            {filteredProducts.map(product => {
              const ratingData = reviewRatings[product._id] || { averageRating: 5, reviewCount: 0 };
              const isFav = wishlist.includes(product._id);
              const isOut = product.stock <= 0;

              return (
                <div 
                  key={product._id} 
                  style={{ background: '#fff', borderRadius: '14px', border: '1px solid rgba(26,18,9,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', position: 'relative' }}
                >
                  {/* Image Block */}
                  <Link href={`/collections/${product._id}`} style={{ position: 'relative', aspectRatio: '1', display: 'block', padding: '20px', background: '#fcfaf5', textDecoration: 'none' }}>
                    <Image 
                      src={getWatchImageUrl(product)} 
                      alt={product.title} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: 'contain' }}
                    />
                    <button 
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }}
                      style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,18,9,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3 }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? '#8b6914' : 'none'} stroke={isFav ? '#8b6914' : '#1a1209'} strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </Link>

                  {/* Card Info */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', letterSpacing: '0.22em', color: '#8b6914', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', fontFamily: "'Jost', sans-serif" }}>
                        {product.modelNo || 'WINSOR ORIGINAL'}
                      </div>
                      <Link href={`/collections/${product._id}`} style={{ textDecoration: 'none', color: '#1a1209' }}>
                        <h3 style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 600, margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '0.02em', fontVariantNumeric: 'lining-nums' }}>
                          {product.title}
                        </h3>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8b6914', marginBottom: '14px' }}>
                        <span>★ {ratingData.averageRating.toFixed(1)}</span>
                        <span style={{ color: 'rgba(26,18,9,0.4)' }}>({ratingData.reviewCount})</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 600, color: '#1a1209', marginBottom: '14px' }}>
                        {convertPrice(product.price)}
                      </div>
                      <button 
                        disabled={isOut}
                        onClick={() => {
                          addToCart({
                            productId: product._id,
                            title: product.title,
                            price: product.price,
                            colorVariant: product.colorVariants?.[0]?.colorName || 'Default',
                            strapType: 'Standard',
                            thumbnail: getWatchImageUrl(product),
                          });
                          toast.success('Added to Cart');
                        }}
                        style={{ width: '100%', padding: '12px 0', background: isOut ? '#ccc' : '#1a1209', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, cursor: isOut ? 'not-allowed' : 'pointer', transition: 'background 0.2s ease' }}
                      >
                        {isOut ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WomensCollectionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center' }}>Loading Women's Collection…</div>}>
      <WomensCollectionContent />
    </Suspense>
  );
}
