'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { IGiftCategory, IProduct } from '@/types';
import NewsletterCard from '@/components/NewsletterCard';
import { toast } from 'react-hot-toast';

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
          background-color: #faf7f0;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
          padding: 0 4% 60px;
        }

        /* ── CIRCULAR LUXURY OCCASION BADGES (.|.) ── */
        .gifts-category-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: center;
          gap: 20px 32px;
          margin-bottom: 32px;
          padding: 0;
        }

        .gift-circle-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
          outline: none;
          max-width: 125px;
          width: 100%;
        }

        /* ── ATTACHED BENEFITS BAR (MATCHING IMG2 LUXURY ATTACHED DESIGN) ── */
        .hero-attached-benefits-wrapper {
          position: relative;
          z-index: 30;
          max-width: 1400px;
          margin: -34px auto 16px;
          padding: 0 4%;
          width: 100%;
        }
        .hero-attached-benefits-bar {
          position: relative;
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.09);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          padding: 20px 32px;
          align-items: center;
          backdrop-filter: blur(12px);
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

        .gift-circle-badge {
          position: relative;
          width: 108px;
          height: 108px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, rgba(139,105,20,0.3) 0%, rgba(223,177,91,0.65) 50%, rgba(139,105,20,0.3) 100%);
          border: 1.5px solid rgba(139,105,20,0.35);
          box-shadow: 0 4px 16px rgba(26,18,9,0.06);
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .gift-circle-item:hover .gift-circle-badge {
          transform: translateY(-4px) scale(1.05);
          border-color: #8b6914;
          background: linear-gradient(135deg, #8b6914 0%, #dfb15b 50%, #8b6914 100%);
          box-shadow: 0 8px 24px rgba(139,105,20,0.3), 0 0 16px rgba(223,177,91,0.25);
        }

        .gift-circle-item.active .gift-circle-badge {
          transform: translateY(-2px) scale(1.06);
          border-color: #8b6914;
          background: linear-gradient(135deg, #8b6914 0%, #dfb15b 50%, #8b6914 100%);
          box-shadow: 0 0 20px rgba(139,105,20,0.4), 0 6px 20px rgba(26,18,9,0.12);
        }

        .gift-circle-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: #110e0b;
        }

        .gift-circle-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .gift-circle-item:hover .gift-circle-bg-img {
          transform: scale(1.12);
        }

        .gift-circle-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(17,14,11,0.35) 0%, rgba(17,14,11,0.75) 100%);
          z-index: 2;
          transition: opacity 0.3s ease;
        }

        .gift-circle-item:hover .gift-circle-overlay {
          background: radial-gradient(circle at center, rgba(17,14,11,0.25) 0%, rgba(17,14,11,0.65) 100%);
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
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65));
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .gift-circle-item:hover .gift-circle-watch-img {
          transform: scale(1.14);
        }

        .gift-circle-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(26,18,9,0.75);
          text-transform: uppercase;
          text-align: center;
          margin-top: 12px;
          transition: color 0.3s ease;
          line-height: 1.25;
        }

        .gift-circle-item:hover .gift-circle-label,
        .gift-circle-item.active .gift-circle-label {
          color: #8b6914;
        }

        .gift-by-occasion-wrapper {
          border-top: 1px solid rgba(26,18,9,0.08);
          padding-top: 20px;
          margin-top: 8px;
          margin-bottom: 24px;
        }
        .gift-by-occasion-title {
          font-family: 'Cormorant Garamond', 'Cinzel', serif;
          font-size: 19px;
          font-weight: 500;
          letter-spacing: 0.18em;
          color: #1a1209;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 20px 0;
        }

        .gift-circle-active-bar {
          width: 32px;
          height: 2px;
          background: #8b6914;
          margin: 6px auto 0;
          border-radius: 2px;
          box-shadow: 0 0 6px rgba(139,105,20,0.5);
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
          .gifts-category-row {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            justify-content: flex-start;
            padding: 8px 12px 20px;
            gap: 18px;
            margin-bottom: 36px;
            -webkit-overflow-scrolling: touch;
          }
          .gifts-category-row::-webkit-scrollbar {
            display: none;
          }
          .gift-circle-item {
            flex-shrink: 0;
            scroll-snap-align: start;
            max-width: 90px;
          }
          .gift-circle-badge {
            width: 82px;
            height: 82px;
          }
          .gift-circle-label {
            font-size: 11.5px;
            margin-top: 8px;
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
          .gift-circle-badge {
            width: 74px;
            height: 74px;
          }
          .gift-circle-label {
            font-size: 10.5px;
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
            <h1 style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.4vw, 44px)', fontWeight: 600, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '0.02em', color: '#fff' }}>
              Curated Gifts for Memorable Milestones
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 'clamp(13px, 1.1vw, 15px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', maxWidth: '480px', margin: '0 0 22px', fontWeight: 300 }}>
              Express your gratitude and love with a timeless Winsor timepiece. Crafted with Japanese precision movements and Dubai-verified quality.
            </p>
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

      {/* ── ATTACHED BENEFITS BAR (DIRECTLY ATTACHED TO HERO BANNER - IMG2 REPLICATE) ── */}
      <div className="hero-attached-benefits-wrapper">
        <div className="hero-attached-benefits-bar">
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



            {/* GIFT CATEGORIES (SHOW CARDS THAT ADMIN TURNED ON) */}
            {giftCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.45)', marginBottom: '56px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Active Gift Collections</h3>
                <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px' }}>
                  We are currently preparing our seasonal collections. Please contact our concierge service for customized gifting options.
                </p>
              </div>
            ) : (
              <div className="gift-by-occasion-wrapper">
                <h2 className="gift-by-occasion-title">GIFT BY OCCASION</h2>

                <div className="gifts-category-row">
                  {/* Reset / All Occasions option */}
                  <div
                    className={`gift-circle-item ${selectedCategorySlug === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategorySlug('all')}
                  >
                    <div className="gift-circle-badge">
                      <div className="gift-circle-inner" style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#110e0b' }}>
                        <Image
                          src="/graduation_gift.png"
                          alt="All Occasions"
                          fill
                          sizes="110px"
                          style={{ objectFit: 'cover', objectPosition: 'center center' }}
                          className="gift-circle-bg-img"
                          priority
                        />
                        <div className="gift-circle-overlay" />
                        <div className="gift-circle-watch-wrapper">
                          <Image
                            src="/winsor_hero_backgroundremoved.webp"
                            alt="Luxury Watch"
                            width={65}
                            height={65}
                            style={{ objectFit: 'contain' }}
                            className="gift-circle-watch-img"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="gift-circle-label">ALL OCCASIONS</span>
                    {selectedCategorySlug === 'all' && <div className="gift-circle-active-bar" />}
                  </div>

                  {/* Categories cards dynamically mapped */}
                  {giftCategories.map(cat => (
                    <div
                      key={cat._id}
                      className={`gift-circle-item ${selectedCategorySlug === cat.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategorySlug(cat.slug)}
                    >
                      <div className="gift-circle-badge">
                        <div className="gift-circle-inner" style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#110e0b' }}>
                          <Image
                            src={getGiftCategoryImage(cat.slug, cat.image)}
                            alt={cat.label}
                            fill
                            sizes="110px"
                            style={{ objectFit: 'cover', objectPosition: 'center center' }}
                            className="gift-circle-bg-img"
                            priority
                          />
                          <div className="gift-circle-overlay" />
                          <div className="gift-circle-watch-wrapper">
                            <Image
                              src={cat.slug.includes('sport') ? "/winsor_hero_backgroundremoved_sport.webp" : "/winsor_hero_backgroundremoved.webp"}
                              alt="Luxury Watch"
                              width={65}
                              height={65}
                              style={{ objectFit: 'contain' }}
                              className="gift-circle-watch-img"
                            />
                          </div>
                        </div>
                      </div>
                      <span className="gift-circle-label">{stripEmojis(cat.label)}</span>
                      {selectedCategorySlug === cat.slug && <div className="gift-circle-active-bar" />}
                    </div>
                  ))}
                </div>
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
