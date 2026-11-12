'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { IGiftCategory, IProduct } from '@/types';
import NewsletterCard from '@/components/NewsletterCard';
import { showWishlistToast } from '@/components/WinsorToaster';
import HorologyWaveBackdrop from '@/components/Footer/HorologyWaveBackdrop';
import ProductCardSkeletonGrid from '@/components/ProductCardSkeletonGrid';
import GiftsHeroTypewriter from './GiftsHeroTypewriter';

type WatchTypeFilter = 'all' | 'mens' | 'womens' | 'new' | 'limited';

const WATCH_FILTER_OPTIONS: { id: WatchTypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mens', label: "Men's Watches" },
  { id: 'womens', label: "Women's Watches" },
  { id: 'new', label: 'New Arrivals' },
  { id: 'limited', label: 'Limited Edition' },
];

const stripEmojis = (text: string) => {
  if (!text) return '';
  return text.replace(/[\u00a9\u00ae\u2000-\u3300\ud83c-\udbff\udc00-\udfff]/g, '').trim();
};

function getProductGender(product: IProduct): 'Gents' | 'Ladies' | 'Unisex' {
  const specs = (product.specifications || {}) as Record<string, string>;
  for (const key of Object.keys(specs)) {
    if (key.toLowerCase() === 'gender') {
      const val = String(specs[key]).toLowerCase();
      if (val.includes('lady') || val.includes('women') || val.includes('female') || val.includes('ladies')) {
        return 'Ladies';
      }
      if (val.includes('gent') || val.includes('men') || val.includes('male') || val.includes('gents')) {
        return 'Gents';
      }
      return 'Unisex';
    }
  }
  const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
  if (text.includes('ladies') || text.includes('women') || text.includes('diamond')) return 'Ladies';
  if (text.includes('gents') || text.includes('men')) return 'Gents';
  return 'Unisex';
}

function matchesWatchTypeFilter(product: IProduct, filter: WatchTypeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'mens' || filter === 'womens') {
    const gender = getProductGender(product);
    const target = filter === 'mens' ? 'Gents' : 'Ladies';
    return gender === target || gender === 'Unisex';
  }
  if (product.collectionSections?.includes(filter)) return true;
  const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
  const keywordMap: Record<'new' | 'limited', string[]> = {
    new: ['new', '2026', 'latest'],
    limited: ['limited', 'reserve', 'edition'],
  };
  return keywordMap[filter].some(kw => text.includes(kw));
}

// Slug to image mapping for active gift categories inside public/gift_categories
function getGiftCategoryImage(slug: string, dbImage?: string): string {
  if (dbImage && dbImage.trim() && !dbImage.includes('new_year.avif')) {
    return dbImage;
  }
  const mapping: Record<string, string> = {
    'easter-sunday': '/gift_categories/Easter_sunday.png',
    'graduation': '/gift_categories/Graduation.png',
    'eid': '/gift_categories/eid.png',
    'esala-perahara': '/gift_categories/esala_perahara.png',
    'fathers-day': '/gift_categories/fathers_day.png',
    'mothers-day': '/gift_categories/mothers_day.png',
    'new-year': '/gift_categories/new_year.webp',
    'newyear': '/gift_categories/new_year.webp',
    'new_year': '/gift_categories/new_year.webp',
    'sinhala-tamil-new-year': '/gift_categories/sinhala_tamil_new_year.jpg',
    'taippongal': '/gift_categories/taippongal.png',
    'valentines-day': '/gift_categories/valentines_day.png',
    'womens-day': '/gift_categories/womens_day.avif',
    'xmass': '/gift_categories/xmass1.jpg',
    'christmas': '/gift_categories/xmass1.jpg',
    'xmas': '/gift_categories/xmass1.jpg',
  };
  return mapping[slug] || '/gift_categories/new_year.webp';
}

export default function GiftsPage() {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();

  // Data states
  const [products, setProducts] = useState<IProduct[]>([]);
  const [giftCategories, setGiftCategories] = useState<IGiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});

  // Filter states
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedWatchType, setSelectedWatchType] = useState<WatchTypeFilter>('all');
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Fetch products and active categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products/gifts?limit=10'),
          fetch('/api/gift-categories'),
        ]);

        let prodData: any = { success: false };
        let catData: any = { success: false };

        try {
          if (prodRes.ok && prodRes.headers.get('content-type')?.includes('application/json')) {
            prodData = await prodRes.json();
          }
        } catch (e) {
          console.warn('Failed to parse products response:', e);
        }

        try {
          if (catRes.ok && catRes.headers.get('content-type')?.includes('application/json')) {
            catData = await catRes.json();
          }
        } catch (e) {
          console.warn('Failed to parse categories response:', e);
        }

        if (prodData.success) {
          // Use the same curated gift set as the homepage so counts and products agree.
          setProducts(prodData.data || []);
        } else {
          throw new Error(prodData.error || 'Failed to fetch products');
        }

        if (catData.success) {
          // Filter to only show active categories
          setGiftCategories((catData.data || []).filter((c: IGiftCategory) => c.isActive));
        } else {
          throw new Error(catData.error || 'Failed to fetch categories');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Read local wishlist safely on mount
    const savedWishlist = localStorage.getItem('winsor_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.warn('Failed to parse wishlist JSON:', e);
      }
    }
  }, []);

  // Fetch review ratings once products are loaded
  useEffect(() => {
    if (products.length === 0) return;
    const ids = products.map(p => p._id).filter(Boolean).join(',');
    fetch(`/api/reviews/ratings?ids=${ids}`)
      .then(r => r.json())
      .then(data => { if (data.success) setReviewRatings(data.data || {}); })
      .catch(() => { });
  }, [products]);

  // Toggle wishlist item
  const toggleWishlist = (productId: string) => {
    const prod = products.find(p => p._id === productId);
    const isFav = wishlist.includes(productId);
    let updated: string[];
    if (isFav) {
      updated = wishlist.filter(id => id !== productId);
      showWishlistToast({ added: false, title: prod?.title, image: prod?.thumbnail?.url, productId });
    } else {
      updated = [...wishlist, productId];
      showWishlistToast({ added: true, title: prod?.title, image: prod?.thumbnail?.url, productId });
    }
    setWishlist(updated);
    localStorage.setItem('winsor_wishlist', JSON.stringify(updated));
  };

  // Reset filters helper
  const resetFilters = () => {
    setSelectedCategorySlug('all');
    setSelectedWatchType('all');
  };

  // Products come from the curated gifts endpoint; retain the category guard for resilience.
  const giftingProducts = products.filter(p => p.giftCategories && p.giftCategories.length > 0);

  const filteredProducts = giftingProducts.filter(p => {
    // Occasion category filter
    const catMatch = selectedCategorySlug === 'all' || p.giftCategories.includes(selectedCategorySlug);
    // Watch type / collection pill filter
    const watchTypeMatch = matchesWatchTypeFilter(p, selectedWatchType);
    return catMatch && watchTypeMatch;
  });

  return (
    <main style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', paddingBottom: '20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Jost:wght@300;400;500;600&display=swap');

        /* ── HERO BANNER (VIDEO + IMAGE COMBINED) ── */
        .gifts-hero-grid {
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
        .gifts-hero-img-card {
          position: relative;
          height: 380px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(139,105,20,0.4);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          transition: transform 0.4s ease, border-color 0.4s ease;
        }
        .gifts-hero-img-card:hover {
          transform: translateY(-4px) scale(1.015);
          border-color: rgba(223,177,91,0.8);
        }
        .hero-btn-primary {
          background: #8b6914;
          color: #fff;
          border: none;
          padding: 12px 26px;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
        }
        .hero-btn-primary:hover {
          background: #a37c17;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139,105,20,0.35);
        }
        @media (max-width: 900px) {
          .gifts-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
          .gifts-hero-text-block {
            text-align: center !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .gifts-hero-img-card {
            height: 240px;
            max-width: 480px;
            margin: 0 auto;
            width: 100%;
          }
        }

        /* ── BODY CONTAINER ── */
        .gifts-container {
          background-color: #ffffff;
          min-height: 60vh;
          font-family: 'Jost', sans-serif;
          color: #141414;
          padding: 20px 4% 60px;
        }

        /* ── FULL-BLEED PEARL WAVE SHOWCASE BAND ── */
        .gifts-showcase-outer {
          position: relative;
          width: 100%;
          background-color: #ffffff;
          z-index: 20;
        }
        .gifts-showcase-wave-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .gifts-showcase-content {
          position: relative;
          z-index: 15;
          max-width: 1400px;
          margin: 0 auto;
          padding: 36px 4% 46px;
        }

        /* ── CIRCULAR LUXURY OCCASION BADGES ── */
        .gifts-category-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: center;
          gap: 24px 36px;
          margin-bottom: 34px;
          padding: 4px 0;
        }

        .gift-circle-item {
          background: transparent;
          border: none;
          padding: 0;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
          outline: none;
          min-width: 118px;
          max-width: 152px;
        }

        /* ── ATTACHED BENEFITS BAR (DIRECTLY OVERLAPS HERO SEAM) ── */
        @keyframes hero-benefits-marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .hero-attached-benefits-wrapper {
          position: relative;
          z-index: 30;
          max-width: 1400px;
          margin: -34px auto 0;
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
          .hero-attached-benefits-marquee-container {
            display: block;
          }
          .hero-attached-benefits-track {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
            align-items: center;
            width: 100%;
          }
          .hero-attached-benefits-track.duplicate {
            display: none !important;
          }
        }

        @media (max-width: 1024px) {
          .hero-attached-benefits-wrapper {
            margin: -24px auto 0;
            padding: 0 16px;
          }
          .hero-attached-benefits-bar {
            padding: 16px 0;
            display: flex;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .hero-attached-benefits-bar::before,
          .hero-attached-benefits-bar::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 24px;
            z-index: 5;
            pointer-events: none;
          }
          .hero-attached-benefits-bar::before {
            left: 0;
            background: linear-gradient(to right, #ffffff 0%, transparent 100%);
          }
          .hero-attached-benefits-bar::after {
            right: 0;
            background: linear-gradient(to left, #ffffff 0%, transparent 100%);
          }
          .hero-attached-benefits-marquee-container {
            display: flex;
            width: max-content;
            animation: hero-benefits-marquee 25s linear infinite;
            will-change: transform;
          }
          .hero-attached-benefits-marquee-container:hover {
            animation-play-state: paused;
          }
          .hero-attached-benefits-track {
            display: flex;
            align-items: center;
            gap: 32px;
            padding-right: 32px;
            flex-shrink: 0;
          }
          .hero-attached-benefit-item {
            flex-shrink: 0;
          }
        }

        .gift-circle-badge {
          position: relative;
          width: 118px;
          height: 118px;
          border-radius: 50%;
          padding: 4.5px;
          background: conic-gradient(
            from 135deg,
            #9A7222 0deg,
            #E8CE82 65deg,
            #FFF3C4 120deg,
            #C79739 195deg,
            #8B6418 270deg,
            #E2BE68 325deg,
            #9A7222 360deg
          );
          box-shadow: 0 10px 26px rgba(139, 105, 20, 0.15), 0 4px 12px rgba(26, 18, 9, 0.08);
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .gift-circle-item:hover .gift-circle-badge {
          transform: translateY(-4px) scale(1.045);
          box-shadow: 0 14px 30px rgba(139, 105, 20, 0.24), 0 0 0 3px rgba(223, 177, 91, 0.24);
        }

        .gift-circle-item.active .gift-circle-badge {
          transform: translateY(-3px) scale(1.055);
          box-shadow: 0 14px 32px rgba(139, 105, 20, 0.3), 0 0 0 3.5px rgba(212, 175, 55, 0.34);
        }

        .gift-circle-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: #14110e;
          box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 248, 226, 0.72);
        }

        .gift-circle-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .gift-circle-item:hover .gift-circle-bg-img {
          transform: scale(1.1);
        }

        .gift-circle-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(16, 13, 10, 0.14) 0%, rgba(16, 13, 10, 0.54) 100%);
          z-index: 2;
          transition: background 0.3s ease;
        }

        .gift-circle-item:hover .gift-circle-overlay {
          background: radial-gradient(circle at center, rgba(16, 13, 10, 0.08) 0%, rgba(16, 13, 10, 0.42) 100%);
        }

        .gift-circle-watch-wrapper {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .gift-circle-watch-img {
          width: 58%;
          height: 58%;
          object-fit: contain;
          filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.58));
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .gift-circle-item:hover .gift-circle-watch-img {
          transform: scale(1.12);
        }

        .gift-circle-label {
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(26, 18, 9, 0.68);
          text-transform: uppercase;
          text-align: center;
          margin-top: 13px;
          transition: color 0.3s ease;
          line-height: 1.3;
          white-space: nowrap;
        }

        .gift-circle-item:hover .gift-circle-label {
          color: #8b6914;
        }

        .gift-circle-item.active .gift-circle-label {
          color: #8b6914;
          font-weight: 700;
        }

        .gift-by-occasion-wrapper {
          padding-top: 4px;
          margin: 0;
        }

        .gift-occasion-heading-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          max-width: 620px;
          margin: 0 auto 30px;
        }

        .gift-heading-rule {
          flex: 1;
          height: 1px;
          max-width: 112px;
        }
        .gift-heading-rule.left {
          background: linear-gradient(90deg, rgba(184, 138, 40, 0) 0%, rgba(184, 138, 40, 0.42) 55%, rgba(154, 114, 34, 0.78) 100%);
        }
        .gift-heading-rule.right {
          background: linear-gradient(90deg, rgba(154, 114, 34, 0.78) 0%, rgba(184, 138, 40, 0.42) 45%, rgba(184, 138, 40, 0) 100%);
        }

        .gift-by-occasion-title {
          font-family: 'Cormorant Garamond', 'Cinzel', serif;
          font-size: 21px;
          font-weight: 600;
          letter-spacing: 0.16em;
          color: #1a1209;
          text-transform: uppercase;
          text-align: center;
          margin: 0;
          white-space: nowrap;
        }

        /* ── WATCH FILTER PILL CAPSULE BELOW OCCASION CIRCLES ── */
        .gift-watch-pills-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 2px;
        }
        .gift-watch-pills-bar {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px;
          background: rgba(246, 243, 236, 0.94);
          border: 1px solid rgba(184, 146, 62, 0.18);
          border-radius: 999px;
          box-shadow: 0 8px 24px rgba(26, 18, 9, 0.045), inset 0 1px 0 rgba(255, 255, 255, 0.85);
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .gift-watch-pills-bar::-webkit-scrollbar {
          display: none;
        }
        .gift-watch-pill-btn {
          border: none;
          background: transparent;
          color: rgba(26, 18, 9, 0.78);
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.03em;
          padding: 9px 22px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .gift-watch-pill-btn:hover:not(.active) {
          color: #1a1209;
          background: rgba(184, 146, 62, 0.09);
        }
        .gift-watch-pill-btn.active {
          background: linear-gradient(135deg, #BA8E34 0%, #9A6F1A 55%, #C79A3E 100%);
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(154, 111, 26, 0.28), inset 0 1px 0 rgba(255, 240, 195, 0.35);
        }

        /* ── PRODUCT SECTION ── */
        .section-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          color: #1a1209;
          letter-spacing: 0.02em;
          margin-bottom: 32px;
          text-transform: uppercase;
          text-align: center;
          position: relative;
        }
        .section-header-title::after {
          content: '';
          display: block;
          width: 40px;
          height: 1.5px;
          background: #8b6914;
          margin: 12px auto 0;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }
        .watch-card-container {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid rgba(20, 20, 20, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .watch-card-container:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.06);
          border-color: rgba(20, 20, 20, 0.16);
          background: #ffffff;
        }
        .watch-img-container {
          position: relative;
          aspect-ratio: 1;
          background: #F6F5F2;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          text-decoration: none;
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
          left: 14px;
          top: 14px;
          background: #141414;
          color: #fff;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.14em;
          padding: 4px 10px;
          border-radius: 2px;
          z-index: 2;
          text-transform: uppercase;
        }
        .watch-card-info {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff;
        }
        .watch-card-title-link {
          text-decoration: none;
          color: inherit;
        }
        .watch-card-title {
          font-size: 15px;
          font-weight: 500;
          margin: 0 0 6px;
          color: #141414;
          letter-spacing: 0.01em;
        }
        .watch-card-specs {
          font-size: 11.5px;
          color: rgba(20, 20, 20, 0.52);
          margin: 0;
        }
        .watch-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          border-top: 1px solid rgba(20, 20, 20, 0.06);
          padding-top: 14px;
        }
        .watch-card-price {
          font-size: 14.5px;
          font-weight: 600;
          color: #141414;
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

        /* ── ERROR STATE ── */

        /* ── BENEFITS BAR ── */
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
          grid-template-columns: repeat(5, 1fr);
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
          gap: 16px;
          color: #1a1209;
        }
        .benefit-item svg {
          color: #8b6914;
          flex-shrink: 0;
        }
        .benefit-item h4 {
          font-size: 13.5px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.02em;
        }
        .benefit-item span {
          font-size: 11px;
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
            animation: benefits-marquee 25s linear infinite;
            flex-shrink: 0;
            padding-right: 16px;
          }
          .benefits-marquee-track[aria-hidden="true"] {
            display: flex !important;
          }
          .benefit-item {
            flex: 0 0 280px;
            width: 280px;
            box-sizing: border-box;
            background: #fff;
            border-radius: 12px;
            padding: 16px 20px;
            border: 1px solid rgba(26, 18, 9, 0.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.015);
          }
        }

        .toolbar-reset-btn {
          background: transparent;
          border: 1px dashed rgba(26,18,9,0.25);
          color: rgba(26, 18, 9, 0.7);
          padding: 10px 20px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          margin-left: auto;
        }
        .toolbar-reset-btn:hover {
          border-color: #1a1209;
          color: #1a1209;
          background: rgba(26,18,9,0.02);
        }

        /* ── RESPONSIVE OVERRIDES ── */
        @media (max-width: 1024px) {
          .benefits-bar {
            grid-template-columns: repeat(2, 1fr);
            padding: 20px;
          }
          .gifts-hero-banner {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 100px 24px 40px;
            text-align: center;
            min-height: 520px;
            height: 80vh;
            position: relative;
          }
          .hero-banner-content {
            max-width: 100%;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
          .hero-banner-image-container {
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
            margin-top: 0 !important;
            z-index: 1;
          }
          .hero-banner-image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .hero-banner-watch-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.55) 100%) !important;
            z-index: 2;
          }
          .gifts-category-row {
            gap: 20px 24px;
          }
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

        @media (max-width: 768px) {
          .gifts-showcase-content {
            padding: 26px 3.5% 32px;
          }
          .gift-occasion-heading-row {
            gap: 12px;
            margin-bottom: 22px;
          }
          .gift-by-occasion-title {
            font-size: 17px;
            letter-spacing: 0.14em;
          }
          .gifts-category-row {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            justify-content: flex-start;
            width: fit-content;
            max-width: 100%;
            margin: 0 auto 24px;
            padding: 8px 6px 12px;
            gap: 18px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .gifts-category-row::-webkit-scrollbar {
            display: none;
          }
          .gift-circle-item {
            flex-shrink: 0;
            scroll-snap-align: start;
            min-width: 90px;
            max-width: 112px;
          }
          .gift-circle-badge {
            width: 88px;
            height: 88px;
            padding: 4px;
          }
          .gift-circle-label {
            font-size: 10.5px;
            margin-top: 9px;
            white-space: normal;
          }
          .gift-watch-pills-bar {
            padding: 4px;
          }
          .gift-watch-pill-btn {
            padding: 8px 16px;
            font-size: 11.5px;
          }
          .benefits-bar {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 16px;
            padding: 16px;
          }
          .benefit-item {
            flex-shrink: 0;
            scroll-snap-align: start;
            min-width: 220px;
          }
          .toolbar-reset-btn {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .gift-watch-pills-bar {
            flex-wrap: wrap;
            justify-content: center;
            border-radius: 20px;
            padding: 5px 6px;
            gap: 4px;
          }
          .gift-watch-pill-btn {
            padding: 7px 14px;
            font-size: 11.5px;
          }
        }

        @media (max-width: 480px) {
          .gift-circle-badge {
            width: 78px;
            height: 78px;
            padding: 3.5px;
          }
          .gift-circle-item {
            min-width: 82px;
            max-width: 100px;
          }
          .gift-circle-label {
            font-size: 10px;
          }
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .hero-btn-primary {
            padding: 12px 18px;
            font-size: 10px;
            letter-spacing: 0.1em;
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
          src="/winsor_gift_vid.webm" 
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
        <div className="gifts-hero-grid">
          {/* Left Column: Text & Badge */}
          <div style={{ textAlign: 'left' }} className="gifts-hero-text-block">
            <div style={{ fontSize: '10px', letterSpacing: '0.28em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>
              THE ART OF GIVING
            </div>
            <GiftsHeroTypewriter
              title="Curated Gifts for Memorable Milestones"
              subtitle="Express your gratitude and love with a timeless Winsor timepiece. Crafted with Japanese precision movements and Dubai-verified quality."
            />
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="hero-btn-primary" onClick={() => setSelectedCategorySlug('all')}>EXPLORE ALL GIFTS</button>
              <div style={{ padding: '8px 18px', background: 'rgba(139,105,20,0.2)', border: '1px solid rgba(223,177,91,0.45)', borderRadius: '20px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: '#dfb15b' }}>
                {filteredProducts.length} TIMEPIECE GIFTS AVAILABLE
              </div>
            </div>
          </div>

          {/* Right Column: Featured Image Card */}
          <div className="gifts-hero-img-card">
            <Image 
              src="/graduation_gift.png" 
              alt="Winsor Gifting Collection" 
              fill 
              sizes="(max-width: 900px) 100vw, 500px" 
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,5,0.85) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>WINSOR LUXURY GIFTS</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#ffffff', fontWeight: 500 }}>The Art of Giving</span>
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px' }}>DUBAI & SRI LANKA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED SCULPTED PEARL WAVE SHOWCASE (BENEFITS BAR + SHOP BY OCCASION + PILL BAR) ── */}
      <div className="gifts-showcase-outer">
        <div className="gifts-showcase-wave-bg">
          <HorologyWaveBackdrop variant="occasion" />
        </div>

        {/* ── ATTACHED BENEFITS BAR (OVERLAPS HERO SEAM ABOVE WAVE BACKDROP) ── */}
        <div className="hero-attached-benefits-wrapper">
        <div className="hero-attached-benefits-bar">
          <div className="hero-attached-benefits-marquee-container">
            {/* Track 1 */}
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
                  <span>Within 14 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with Payments.lk</span>
                </div>
              </div>
            </div>

            {/* Track 2 (Duplicate for Seamless Infinite Marquee Loop on Mobile) */}
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
                  <span>Within 14 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with Payments.lk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* OCCASION MEDALLIONS & WATCH TYPE PILL BAR OVER WAVE BACKDROP */}
        {!loading && !error && (
          <div className="gifts-showcase-content">
            {giftCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.6)', marginBottom: '22px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: '#1a1209', marginBottom: '6px' }}>No Active Gift Collections</h3>
                <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', margin: 0 }}>
                  We are currently preparing our seasonal collections. Please browse our full timepiece filter below or contact our concierge service.
                </p>
              </div>
            ) : (
              <div className="gift-by-occasion-wrapper">
                <div className="gift-occasion-heading-row">
                  <span className="gift-heading-rule left" aria-hidden="true" />
                  <h2 className="gift-by-occasion-title">SHOP BY OCCASION</h2>
                  <span className="gift-heading-rule right" aria-hidden="true" />
                </div>

                <div className="gifts-category-row">
                  {[
                    {
                      key: 'all',
                      slug: 'all',
                      label: 'ALL OCCASIONS',
                      bgSrc: '/graduation_gift.png',
                      watchSrc: '/winsor_hero_backgroundremoved.webp',
                    },
                    ...giftCategories.map(cat => ({
                      key: cat._id || cat.slug,
                      slug: cat.slug,
                      label: stripEmojis(cat.label),
                      bgSrc: getGiftCategoryImage(cat.slug, cat.image),
                      watchSrc: cat.slug.includes('sport')
                        ? '/winsor_hero_backgroundremoved_sport.webp'
                        : '/winsor_hero_backgroundremoved.webp',
                    })),
                  ].map(item => {
                    const isActive = selectedCategorySlug === item.slug;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`gift-circle-item ${isActive ? 'active' : ''}`}
                        aria-pressed={isActive}
                        onClick={() => setSelectedCategorySlug(item.slug)}
                      >
                        <div className="gift-circle-badge">
                          <div className="gift-circle-inner">
                            <Image
                              src={item.bgSrc}
                              alt={item.label}
                              fill
                              sizes="120px"
                              style={{ objectFit: 'cover', objectPosition: 'center center' }}
                              className="gift-circle-bg-img"
                              priority
                            />
                            <div className="gift-circle-overlay" />
                            <div className="gift-circle-watch-wrapper">
                              <Image
                                src={item.watchSrc}
                                alt={`${item.label} Watch`}
                                width={68}
                                height={68}
                                style={{ objectFit: 'contain' }}
                                className="gift-circle-watch-img"
                              />
                            </div>
                          </div>
                        </div>
                        <span className="gift-circle-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Centered luxury pill capsule below circular occasion medallions */}
            <div className="gift-watch-pills-wrap" role="tablist" aria-label="Filter curated gifts by timepiece category">
              <div className="gift-watch-pills-bar">
                {WATCH_FILTER_OPTIONS.map(opt => {
                  const isActive = selectedWatchType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`gift-watch-pill-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedWatchType(opt.id)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BODY CONTENT */}
      <div className="gifts-container">
        {loading ? (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <ProductCardSkeletonGrid count={8} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ff3b30' }}>
            <h3>Error Loading Page</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* PRODUCT GRID SECTION */}
            <h2 className="section-header-title">
              {selectedCategorySlug === 'all'
                ? 'All Curated Gifts'
                : `${stripEmojis(giftCategories.find(c => c.slug === selectedCategorySlug)?.label || 'Curated')} Selection`}
              {selectedWatchType !== 'all' && ` — ${WATCH_FILTER_OPTIONS.find(o => o.id === selectedWatchType)?.label}`}
            </h2>

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.45)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Watches Available</h3>
                <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px', marginBottom: '18px' }}>
                  There are no watches currently matching your selected filters. Select another option or view all gifts.
                </p>
                <button onClick={resetFilters} className="toolbar-reset-btn" style={{ marginLeft: 0 }}>
                  View All Gifts
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => {
                  const isSoldOut = product.isSoldOut;
                  const isFav = product._id ? wishlist.includes(product._id) : false;
                  const ratingData = product._id ? reviewRatings[product._id] : undefined;
                  const avgRating = ratingData?.averageRating || 0;
                  const reviewCount = ratingData?.reviewCount || 0;

                  return (
                    <div key={product._id} className="watch-card-container">
                      {/* Image block inside a click Link */}
                      <Link href={`/collections/${product._id}`} className="watch-img-container">
                        {isSoldOut ? (
                          <span className="watch-card-badge">Sold Out</span>
                        ) : product.stickerEnabled && product.stickerText ? (
                          <span className="watch-card-badge">{product.stickerText}</span>
                        ) : product.collectionSections?.includes('new') ? (
                          <span className="watch-card-badge">NEW</span>
                        ) : product.collectionSections?.includes('bestsellers') ? (
                          <span className="watch-card-badge">BEST SELLER</span>
                        ) : product.collectionSections?.includes('limited') ? (
                          <span className="watch-card-badge">LIMITED</span>
                        ) : null}

                        {product.thumbnail?.url && (
                          <Image
                            src={product.thumbnail.url}
                            alt={product.title}
                            fill
                            className="watch-card-image"
                            sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            priority
                          />
                        )}
                      </Link>

                      {/* Info & CTA details */}
                      <div className="watch-card-info">
                        <Link href={`/collections/${product._id}`} className="watch-card-title-link">
                          <h3 className="watch-card-title">{product.title}</h3>
                          <p className="watch-card-specs">
                            {product.specifications?.Material || 'Stainless Steel'} - {product.specifications?.['Case Size'] || '40mm'}
                          </p>
                        </Link>

                        {/* ⭐ Review Stars */}
                        {reviewCount > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '5px 0 2px' }}>
                            {[1, 2, 3, 4, 5].map(s => {
                              const filled = avgRating >= s;
                              const half = !filled && avgRating >= s - 0.5;
                              return (
                                <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={filled ? '#8B6914' : half ? 'url(#half-g)' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                                  {half && (
                                    <defs>
                                      <linearGradient id="half-g">
                                        <stop offset="50%" stopColor="#8B6914" />
                                        <stop offset="50%" stopColor="transparent" />
                                      </linearGradient>
                                    </defs>
                                  )}
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              );
                            })}
                            <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.45)', fontFamily: "'Jost',sans-serif", fontWeight: 500, marginLeft: '2px' }}>
                              {avgRating.toFixed(1)} ({reviewCount})
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '5px 0 2px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.18)" strokeWidth="1.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                            <span style={{ fontSize: '9.5px', color: 'rgba(26,18,9,0.3)', fontFamily: "'Jost',sans-serif", marginLeft: '2px' }}>No reviews</span>
                          </div>
                        )}

                        <div className="watch-card-footer">
                          <span className="watch-card-price">{convertPrice(product.price)}</span>
                          <div className="watch-card-actions">
                            <button
                              onClick={() => product._id && toggleWishlist(product._id)}
                              className={`card-action-btn ${isFav ? 'active' : ''}`}
                              aria-label="Toggle Wishlist"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                            {!isSoldOut && (
                              <button
                                onClick={() => {
                                  product._id && addToCart(product._id, 1, undefined, product);
                                }}
                                className="card-action-btn highlight"
                                aria-label="Add to cart"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                  <line x1="3" y1="6" x2="21" y2="6" />
                                  <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Black Moving Marquee Ribbon & VIP Newsletter Card */}
        <NewsletterCard imageSrc="/graduation_gift.png" badgeText="WINSOR GIFTS CONCIERGE" />
      </div>
    </main>
  );
}
