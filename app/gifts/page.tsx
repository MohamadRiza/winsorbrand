'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { IGiftCategory, IProduct } from '@/types';
import NewsletterCard from '@/components/NewsletterCard';

const stripEmojis = (text: string) => {
  if (!text) return '';
  return text.replace(/[\u00a9\u00ae\u2000-\u3300\ud83c-\udbff\udc00-\udfff]/g, '').trim();
};

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

  // Filter & Search states
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceSort, setPriceSort] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Fetch products and active categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
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
          // Filter to only show active products
          setProducts((prodData.data || []).filter((p: IProduct) => p.isActive));
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
    const isFav = wishlist.includes(productId);
    let updated: string[];
    if (isFav) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
      toast.success('Added to wishlist');
    }
    setWishlist(updated);
    localStorage.setItem('winsor_wishlist', JSON.stringify(updated));
  };

  // Reset filters helper
  const resetFilters = () => {
    setSelectedCategorySlug('all');
    setSearchQuery('');
    setPriceSort('none');
  };

  // Filter products: must be active, have gift categories mapped, match category, search query & price sort
  const giftingProducts = products.filter(p => p.giftCategories && p.giftCategories.length > 0);

  let filteredProducts = giftingProducts.filter(p => {
    // Category filter
    const catMatch = selectedCategorySlug === 'all' || p.giftCategories.includes(selectedCategorySlug);
    // Search query filter
    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title?.toLowerCase().includes(q);
      const modelMatch = p.modelNo?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const specMatch = p.specifications && Object.values(p.specifications).some(val => String(val).toLowerCase().includes(q));
      searchMatch = Boolean(titleMatch || modelMatch || descMatch || specMatch);
    }
    return catMatch && searchMatch;
  });

  // Price sorting
  if (priceSort === 'low-to-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (priceSort === 'high-to-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  return (
    <div style={{ backgroundColor: '#faf7f0', minHeight: '100vh', width: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Jost:wght@300;400;500;600&display=swap');

        /* ── HERO BANNER ── */
        .gifts-hero-banner {
          position: relative;
          background: radial-gradient(circle at right, #242220 0%, #0a0a0a 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 130px 6% 60px;
          min-height: 520px;
          margin-bottom: 0;
          border-bottom: 1.5px solid rgba(139,105,20,0.15);
        }
        .hero-banner-content {
          max-width: 48%;
          position: relative;
          z-index: 10;
        }
        .hero-banner-tag {
          color: #8b6914;
          font-size: 10px;
          letter-spacing: 0.35em;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: block;
        }
        .hero-banner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4vw, 56px);
          line-height: 1.15;
          font-weight: 300;
          letter-spacing: 0.02em;
          margin-bottom: 20px;
          color: #fff;
        }
        .hero-banner-desc {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(15px, 2vw, 20px);
          color: rgba(255,255,255,0.7);
          line-height: 1.45;
          margin-bottom: 36px;
        }
        .hero-banner-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .hero-btn-primary {
          background: #8b6914;
          color: #fff;
          border: none;
          padding: 14px 30px;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
        }
        .hero-btn-primary:hover {
          background: #a37c17;
          transform: translateY(-2px);
        }
        .hero-banner-image-container {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 50%;
          z-index: 1;
        }
        .hero-banner-watch-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, #0a0a0a 0%, transparent 40%);
          z-index: 2;
        }
        .hero-banner-watch-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }

        /* ── BODY CONTAINER ── */
        .gifts-container {
          background-color: #faf7f0;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
          padding: 40px 4% 100px;
        }

        /* ── CATEGORY GRID ── */
        .gifts-category-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 64px;
        }
        .gender-header-card {
          position: relative;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid rgba(26, 18, 9, 0.05);
          transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .gender-header-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(26, 18, 9, 0.08);
          border-color: rgba(139,105,20,0.2);
        }
        .gender-header-card.active {
          border-color: #8b6914;
          border-width: 2px;
          box-shadow: 0 8px 30px rgba(139,105,20,0.12);
        }
        .gender-card-img-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          background: #eee;
        }
        .gender-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .gender-header-card:hover .gender-card-img {
          transform: scale(1.05);
        }
        .gender-header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(10,8,6,0.85) 0%, rgba(10,8,6,0.3) 50%, rgba(10,8,6,0.2) 100%);
          z-index: 2;
        }
        .gender-header-content {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          z-index: 3;
          color: #fff;
        }
        .gender-header-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 0.1em;
          margin: 0 0 4px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gender-header-content span {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.05em;
          display: block;
        }
        .gender-header-arrow {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 3;
          color: rgba(255,255,255,0.6);
          transition: all 0.3s ease;
          opacity: 0;
          transform: scale(0.9);
        }
        .gender-header-card:hover .gender-header-arrow {
          opacity: 1;
          transform: scale(1.1);
          color: #8b6914;
        }
        .gender-header-card.active .gender-header-arrow {
          opacity: 1;
          transform: scale(1.1);
          color: #8b6914;
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
          background: #faf7f0;
          border-radius: 16px;
          border: 1px solid rgba(26, 18, 9, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          box-shadow: 0 4px 16px rgba(26,18,9,0.02);
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

        /* ── LOADING & ERROR SKELETON ── */
        .gifts-loader {
          text-align: center;
          padding: 80px 20px;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(139,105,20,0.15);
          border-top-color: #8b6914;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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

        /* ── TOOLBAR CONTROLS ── */
        .col-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          margin: 0 auto 36px;
          padding: 16px 24px;
          background-color: #fff;
          border: 1px solid rgba(26, 18, 9, 0.06);
          border-radius: 12px;
          max-width: 1400px;
          width: 100%;
        }
        .search-wrapper {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 320px;
        }
        .search-input {
          width: 100%;
          background: #faf7f0;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 6px;
          padding: 10px 16px 10px 38px;
          font-size: 12.5px;
          color: #1a1209;
          font-family: inherit;
        }
        .search-input:focus {
          outline: none;
          border-color: #8b6914;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(26, 18, 9, 0.4);
          pointer-events: none;
        }
        .toolbar-select {
          background: #faf7f0;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 12.5px;
          color: #1a1209;
          cursor: pointer;
          font-family: inherit;
          min-width: 160px;
        }
        .toolbar-select:focus {
          outline: none;
          border-color: #8b6914;
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
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
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
          .col-toolbar {
            display: none;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
          .col-toolbar.show {
            display: flex;
          }
          .search-wrapper {
            max-width: 100%;
          }
          .toolbar-reset-btn {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .gifts-category-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .gender-header-card {
            height: 150px;
          }
          .gender-header-content {
            bottom: 16px;
            left: 16px;
            right: 16px;
          }
          .gender-header-content h2 {
            font-size: 15px;
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

      {/* HERO BANNER SECTION */}
      <section className="gifts-hero-banner">
        <div className="hero-banner-content">
          <span className="hero-banner-tag">THE ART OF GIVING</span>
          <h1 className="hero-banner-title">Curated Gifts for Memorable Milestones</h1>
          <div className="hero-banner-desc" style={{ marginBottom: '36px' }}>
            Express your gratitude and love with a timeless Winsor timepiece. Crafted with Japanese movements and Dubai verification.
          </div>
          <div className="hero-banner-actions">
            <button className="hero-btn-primary" onClick={() => setSelectedCategorySlug('all')}>EXPLORE ALL GIFTS</button>
          </div>
        </div>

        <div className="hero-banner-image-container">
          <div className="hero-banner-watch-bg" />
          <Image
            src="/graduation_gift.png"
            alt="Winsor Gifting Collection"
            fill
            priority
            className="hero-banner-watch-img"
          />
        </div>
      </section>

      {/* BODY CONTENT */}
      <div className="gifts-container">
        {loading ? (
          <div className="gifts-loader">
            <div className="spinner" />
            <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px' }}>Loading Gifting Collections…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ff3b30' }}>
            <h3>Error Loading Page</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* BENEFITS BAR (MAISON TRUST HIGHLIGHTS) */}
            <div className="benefits-carousel-wrapper">
              <div className="benefits-bar">
                {/* Track 1 */}
                <div className="benefits-marquee-track">
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                    <div>
                      <h4>Japan Movement</h4>
                      <span>UAE Registered Brand</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <div>
                      <h4>International Warranty</h4>
                      <span>Sri Lanka & UAE</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                    <div>
                      <h4>Free Shipping</h4>
                      <span>Island-wide in Sri Lanka</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                    <div>
                      <h4>Easy Returns</h4>
                      <span>Within 7 Days</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <div>
                      <h4>Secure Payments</h4>
                      <span>100% Secure Checkout with payhere.lk</span>
                    </div>
                  </div>
                </div>

                {/* Track 2 (Duplicate for Seamless Infinite Loop) */}
                <div className="benefits-marquee-track" aria-hidden="true">
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                    <div>
                      <h4>Japan Movement</h4>
                      <span>UAE Registered Brand</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <div>
                      <h4>1 Year International Warranty</h4>
                      <span>Official Coverage</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                    <div>
                      <h4>Free Shipping</h4>
                      <span>Island-wide in Sri Lanka</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                    <div>
                      <h4>Easy Returns</h4>
                      <span>Within 7 Days</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <div>
                      <h4>Secure Payments</h4>
                      <span>100% Secure Checkout with payhere.lk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GIFT CATEGORIES (SHOW CARDS THAT ADMIN TURNED ON) */}
            {giftCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.45)', marginBottom: '56px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Active Gift Collections</h3>
                <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px' }}>
                  We are currently preparing our seasonal collections. Please contact our concierge service for customized gifting options.
                </p>
              </div>
            ) : (
              <div className="gifts-category-row">
                {/* Reset Option card */}
                <div
                  className={`gender-header-card ${selectedCategorySlug === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategorySlug('all')}
                >
                  <div className="gender-card-img-wrapper">
                    <Image
                      src="/graduation_gift.png"
                      alt="All Gifts"
                      fill
                      sizes="(max-width: 768px) 50vw, 350px"
                      style={{ objectFit: 'cover', objectPosition: 'center center' }}
                      className="gender-card-img"
                      priority
                    />
                  </div>
                  <div className="gender-header-overlay" />
                  <div className="gender-header-content">
                    <h2>ALL OCCASIONS</h2>
                    <span>View all gifting watches</span>
                  </div>
                  <div className="gender-header-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8l4 4-4 4" /></svg>
                  </div>
                </div>

                {/* Categories cards dynamically mapped */}
                {giftCategories.map(cat => (
                  <div
                    key={cat._id}
                    className={`gender-header-card ${selectedCategorySlug === cat.slug ? 'active' : ''}`}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                  >
                    <div className="gender-card-img-wrapper">
                      <Image
                        src={getGiftCategoryImage(cat.slug, cat.image)}
                        alt={cat.label}
                        fill
                        sizes="(max-width: 768px) 50vw, 350px"
                        style={{ objectFit: 'cover', objectPosition: 'center center' }}
                        className="gender-card-img"
                        priority
                      />
                    </div>
                    <div className="gender-header-overlay" />
                    <div className="gender-header-content">
                      <h2>{stripEmojis(cat.label)}</h2>
                      <span>Explore this curated collection</span>
                    </div>
                    <div className="gender-header-arrow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8l4 4-4 4" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Filter Toggle Button */}
            <div className="mobile-filter-toggle-container md:hidden" style={{ margin: '30px auto 16px', maxWidth: '1400px', width: '100%' }}>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="mobile-filter-toggle-btn"
                style={{
                  width: '100%',
                  background: '#fff',
                  border: '1px solid rgba(26,18,9,0.08)',
                  borderRadius: '8px',
                  padding: '14px 20px',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#1a1209',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  {showMobileFilters ? 'Hide Filters & Search' : 'Show Filters & Search'}
                </span>
                <span>{showMobileFilters ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* TOOLBAR CONTROLS (SEARCH BAR & FILTERING) */}
            <div className={`col-toolbar ${showMobileFilters ? 'show' : ''}`} style={{ marginTop: '30px' }}>
              {/* Search bar */}
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search gifting watches..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </div>

              {/* Gift Occasion Filter */}
              {giftCategories.length > 0 && (
                <select
                  value={selectedCategorySlug}
                  onChange={e => setSelectedCategorySlug(e.target.value)}
                  className="toolbar-select"
                >
                  <option value="all">All Occasions</option>
                  {giftCategories.map(cat => (
                    <option key={cat.slug} value={cat.slug}>
                      {stripEmojis(cat.label)}
                    </option>
                  ))}
                </select>
              )}

              {/* Price Sorting */}
              <select
                value={priceSort}
                onChange={e => setPriceSort(e.target.value as any)}
                className="toolbar-select"
              >
                <option value="none">Sort By: Featured</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>

              {/* Results Count */}
              <span style={{ fontSize: '12.5px', color: 'rgba(26, 18, 9, 0.45)', marginLeft: '12px' }} className="hidden md:inline">
                {!loading && `${filteredProducts.length} Timepiece${filteredProducts.length === 1 ? '' : 's'} found`}
              </span>

              {/* Reset button */}
              {(selectedCategorySlug !== 'all' || searchQuery || priceSort !== 'none') && (
                <button onClick={resetFilters} className="toolbar-reset-btn">
                  Reset Filters
                </button>
              )}
            </div>

            {/* PRODUCT GRID SECTION */}
            <h2 className="section-header-title">
              {selectedCategorySlug === 'all'
                ? 'All Curated Gifts'
                : `${stripEmojis(giftCategories.find(c => c.slug === selectedCategorySlug)?.label || 'Curated')} Selection`}
            </h2>

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.45)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Watches Available</h3>
                <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px' }}>
                  There are no watches currently allocated to this gifting category. Select another category or view all gifts.
                </p>
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
    </div>
  );
}
