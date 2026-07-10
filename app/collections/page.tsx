'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'react-hot-toast';
import { IProduct, IGiftCategory, CollectionSection } from '@/types';

// Constants for Collection Sections
const SECTIONS: { key: CollectionSection; label: string }[] = [
  { key: 'new', label: 'New Arrivals' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'sports', label: 'Sports' },
  { key: 'limited', label: 'Limited Edition' },
  { key: 'bestsellers', label: 'Best Sellers' },
];

export default function CollectionsPage() {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % 3);
  };

  useEffect(() => {
    // If current slide is NOT the video (slide 0), set an auto-advance timer for images
    if (currentSlide !== 0) {
      const timer = setTimeout(() => {
        nextSlide();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  const SLIDES = useMemo(() => [
    {
      type: 'video',
      videoUrl: '/watch_smoke_vid.webm',
      tag: 'BUILT FOR MOMENTS THAT MATTER',
      title: <>Timeless Craft.<br />Modern Legacy.</>,
      desc: <>Precision, heritage and excellence —<br />crafted for Dubai/UAE Registered brand.</>,
    },
    {
      type: 'image',
      imageUrl: '/winsor_girl_G.png',
      tag: 'ELEGANCE & GRACE',
      title: <>Timeless Beauty.<br />Complements Every You.</>,
      desc: <>A harmony of refined design and exquisite craftsmanship —<br />made to complement your style.</>,
    },
    {
      type: 'image',
      imageUrl: '/winsor_man.png',
      tag: 'BOLD & DISTINGUISHED',
      title: <>Engineered For<br />Those Who Never Settle.</>,
      desc: <>Uncompromising style and robust elegance —<br />built for the modern trailblazer.</>,
    },
  ], []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'gents' | 'ladies' | 'gifts'>('all');
  const [selectedSection, setSelectedSection] = useState<CollectionSection | 'all'>('all');
  const [selectedGift, setSelectedGift] = useState<string | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');

  // Wishlist Local State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Mobile Filters Toggle State
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // API States
  const [products, setProducts] = useState<IProduct[]>([]);
  const [giftCategories, setGiftCategories] = useState<IGiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products and categories on mount
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
          setProducts(prodData.data || []);
        } else {
          throw new Error(prodData.error || 'Failed to fetch products');
        }

        if (catData.success) {
          setGiftCategories(catData.data || []);
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

  // Helper to determine product gender (Gents / Ladies / Unisex)
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

    // Fallbacks based on title or specs
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

  // Toggle wishlist toggle
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

  // Filtered Products Memo
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // 2. Gender/Gifts Filter
    if (selectedGender !== 'all') {
      result = result.filter(p => {
        if (selectedGender === 'gifts') {
          return Array.isArray(p.giftCategories) && p.giftCategories.length > 0;
        }
        const gender = getProductGender(p).toLowerCase();
        if (selectedGender === 'gents') return gender === 'gents' || gender === 'unisex';
        if (selectedGender === 'ladies') return gender === 'ladies' || gender === 'unisex';
        return true;
      });
    }

    // 3. Collection Section Filter
    if (selectedSection !== 'all') {
      result = result.filter(p => p.collectionSections?.includes(selectedSection));
    }

    // 4. Gift Category Filter
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
  }, [products, searchQuery, selectedGender, selectedSection, selectedGift, priceSort]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGender('all');
    setSelectedSection('all');
    setSelectedGift('all');
    setPriceSort('none');
  };

  if (error) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#1a1209', marginBottom: '16px' }}>Connection Error</h2>
          <p style={{ color: 'rgba(26,18,9,0.6)', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: '#8B6914', color: '#fff', border: 'none', padding: '12px 28px', fontFamily: "'Jost', sans-serif", fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        
        .col-container {
          background-color: #faf7f0;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        /* ── HERO BANNER ── */
        .collections-hero-banner {
          position: relative;
          background: radial-gradient(circle at right, #242220 0%, #0a0a0a 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 130px 6% 60px;
          min-height: 520px;
          margin-bottom: 56px;
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
        .hero-btn-secondary {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          padding: 14px 30px;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 4px;
        }
        .hero-btn-secondary:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.05);
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
        .hero-banner-watch-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
        }
        .hero-banner-watch-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #0a0a0a 0%, transparent 40%);
          z-index: 2;
        }
        .hero-banner-slides {
          position: absolute;
          right: 6%;
          bottom: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          z-index: 10;
        }
        .active-slide {
          color: #fff;
          font-weight: 600;
        }
        .slide-progress-line {
          width: 48px;
          height: 1px;
          background: rgba(255,255,255,0.15);
          position: relative;
        }
        .slide-progress-active {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 33%;
          background: #8b6914;
        }

        /* ── INNER BODY PAGE ── */
        .collections-inner-body {
          padding: 0 4% 80px;
        }

        /* ── GENDER FILTER HEADER ── */
        .gender-header-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin: 0 auto 40px;
          max-width: 1400px;
          width: 100%;
        }
        .gender-header-card {
          height: 260px;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s, box-shadow 0.3s;
          border: 2px solid transparent;
        }
        .gender-header-card.active {
          border-color: #8b6914;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.18);
        }
        .gender-header-card:hover {
          transform: translateY(-4px);
        }
        .gender-card-img-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .gender-card-img {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .gender-header-card:hover .gender-card-img {
          transform: scale(1.05);
        }
        .gender-header-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(26, 18, 9, 0.1) 0%, rgba(26, 18, 9, 0.65) 100%);
          transition: background 0.3s;
          z-index: 1;
        }
        .gender-header-card:hover .gender-header-overlay {
          background: linear-gradient(to bottom, rgba(26, 18, 9, 0.05) 0%, rgba(26, 18, 9, 0.75) 100%);
        }
        .gender-header-content {
          position: absolute;
          bottom: 24px;
          left: 24px;
          color: #fff;
          z-index: 2;
        }
        .gender-header-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 2px;
          letter-spacing: 0.04em;
        }
        .gender-header-content span {
          font-size: 11px;
          opacity: 0.75;
          letter-spacing: 0.04em;
          font-weight: 300;
        }
        .gender-header-arrow {
          position: absolute;
          bottom: 24px;
          right: 24px;
          color: #fff;
          opacity: 0.65;
          transition: all 0.3s ease;
          z-index: 2;
        }
        .gender-header-card:hover .gender-header-arrow {
          opacity: 1;
          transform: scale(1.1);
          color: #8b6914;
        }

        /* ── BENEFITS BAR ── */
        .benefits-carousel-wrapper {
          width: 100%;
          overflow: visible;
        }
        .benefits-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          background: #fff;
          padding: 24px 32px;
          border-radius: 12px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          margin: 0 auto 56px;
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

        /* ── FEATURED TITLE BLOCK ── */
        .featured-section-header {
          margin: 0 auto 36px;
          max-width: 1400px;
          width: 100%;
        }
        .featured-title-block {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
          padding-bottom: 16px;
        }
        .featured-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          letter-spacing: 0.06em;
          font-weight: 400;
          text-transform: uppercase;
          margin: 0;
        }
        .view-all-link {
          font-size: 12px;
          color: #8b6914;
          letter-spacing: 0.05em;
          text-decoration: none;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .view-all-link:hover {
          color: #1a1209;
        }

        /* ── CAPSULE FILTER ROW ── */
        .capsule-filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .capsule-btn {
          background: transparent;
          color: #1a1209;
          border: 1px solid rgba(26, 18, 9, 0.15);
          padding: 10px 24px;
          font-size: 10.5px;
          letter-spacing: 0.12em;
          font-weight: 500;
          text-transform: uppercase;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .capsule-btn.active {
          background: #1a1209;
          color: #fff;
          border-color: #1a1209;
        }
        .capsule-btn:hover:not(.active) {
          border-color: #1a1209;
          background: rgba(26, 18, 9, 0.03);
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

        /* ── PRODUCT GRID ── */
        .product-catalog {
          margin: 0 auto;
          max-width: 1400px;
          width: 100%;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }
        
        /* ── WATCH CARD CONTAINER ── */
        .watch-card-container {
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(26,18,9,0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.4s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        .watch-card-container:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(26,18,9,0.06);
          border-color: rgba(139,105,20,0.18);
        }
        .watch-img-container {
          position: relative;
          aspect-ratio: 1;
          background: #fff;
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
          transform: scale(1.04);
        }
        .watch-card-badge {
          position: absolute;
          left: 16px;
          top: 16px;
          background: #1a1209;
          color: #fff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          border-radius: 3px;
          z-index: 2;
          text-transform: uppercase;
        }
        .watch-card-info {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #fff;
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

        /* ── BLACK RIBBON BANNER ── */
        .ribbon-banner {
          background: #000000;
          color: #fff;
          padding: 22px 0;
          overflow: hidden;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          margin-top: 64px;
          margin-bottom: 64px;
        }
        .ribbon-content.marquee-content {
          display: flex;
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
        }
        .marquee-track {
          display: flex;
          align-items: center;
          gap: 28px;
          animation: marquee 25s linear infinite;
          flex-shrink: 0;
          padding-right: 28px;
          font-size: 11px;
          letter-spacing: 0.18em;
          font-weight: 400;
        }
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
        .ribbon-highlight {
          color: #8b6914;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }
        .ribbon-sep {
          opacity: 0.25;
        }

        /* ── NEWSLETTER BANNER ── */
        .newsletter-banner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(26,18,9,0.06);
          background: #fff;
          margin: 0 auto 24px;
          max-width: 1400px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
        }
        .newsletter-image-block {
          height: 100%;
          position: relative;
          min-height: 300px;
        }
        .newsletter-image-block img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .newsletter-form-block {
          padding: 40px 6%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .newsletter-tag {
          font-size: 10px;
          color: #8b6914;
          letter-spacing: 0.25em;
          font-weight: 600;
          margin-bottom: 12px;
          display: block;
        }
        .newsletter-form-block h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 400;
          margin: 0 0 10px;
          letter-spacing: 0.02em;
        }
        .newsletter-form-block p {
          font-size: 13.5px;
          color: rgba(26,18,9,0.55);
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .hero-video-mute-btn {
          position: absolute;
          right: 6%;
          bottom: 90px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 12;
          backdrop-filter: blur(6px);
        }
        .hero-video-mute-btn:hover {
          background: #8b6914;
          border-color: #8b6914;
          transform: scale(1.08);
        }
        .newsletter-form {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .newsletter-form input {
          flex: 1;
          background: #faf7f0;
          border: 1px solid rgba(26,18,9,0.08);
          padding: 14px 20px;
          font-size: 12.5px;
          font-family: inherit;
          border-radius: 4px;
          color: #1a1209;
        }
        .newsletter-form input:focus {
          outline: none;
          border-color: #8b6914;
        }
        .newsletter-form button {
          background: #8b6914;
          color: #fff;
          border: none;
          padding: 14px 28px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
        }
        .newsletter-form button:hover {
          background: #a37c17;
        }
        .newsletter-note {
          font-size: 11px;
          color: rgba(26,18,9,0.4);
        }

        /* ── SKELETON CARD ── */
        .skeleton-card {
          height: 380px;
          background: linear-gradient(90deg, #f3f0e7 25%, #eae6da 50%, #f3f0e7 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 12px;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── RESPONSIVE STYLES ── */
        @media (max-width: 1024px) {
          .collections-hero-banner {
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
          .hero-banner-watch-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.55) 100%) !important;
            z-index: 2;
          }
          .hero-video-mute-btn {
            right: 16px;
            bottom: 24px;
            width: 36px;
            height: 36px;
          }
          .hero-banner-slides {
            display: none;
          }
          .benefits-bar {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 16px;
            padding: 20px 24px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .benefits-bar::-webkit-scrollbar {
            display: none;
          }
          .benefit-item {
            flex: 0 0 65%;
            scroll-snap-align: center;
          }
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .newsletter-banner {
            grid-template-columns: 1fr;
          }
          .newsletter-image-block {
            min-height: 250px;
          }
        }

        @media (max-width: 768px) {
          .gender-header-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .gender-header-card {
            height: 180px;
          }
          .benefits-carousel-wrapper {
            overflow: hidden;
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
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
          @keyframes benefits-marquee {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-100%, 0, 0);
            }
          }
          .capsule-filter-row {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 8px;
            margin-bottom: 24px;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .capsule-filter-row::-webkit-scrollbar {
            display: none;
          }
          .capsule-btn {
            flex: 0 0 auto;
            padding: 8px 16px;
            font-size: 10px;
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
          .col-toolbar {
            display: none;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .col-toolbar.show {
            display: flex;
          }
          .search-wrapper {
            max-width: 100%;
          }
          .toolbar-select {
            width: 100%;
          }
          .toolbar-reset-btn {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
          .ribbon-content {
            font-size: 9px;
            gap: 16px;
          }
          .newsletter-form {
            flex-direction: column;
            gap: 10px;
          }
          .newsletter-form input {
            width: 100%;
          }
          .newsletter-form button {
            width: 100%;
            padding: 14px 20px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .gender-header-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .gender-header-card {
            height: 140px;
          }
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .hero-btn-primary,
          .hero-btn-secondary {
            padding: 12px 18px;
            font-size: 10px;
            letter-spacing: 0.1em;
          }
        }
      `}</style>

      <div className="col-container">
        {/* HERO BANNER SECTION */}
        <section className="collections-hero-banner">
          {/* Active Slide content */}
          <div className="hero-banner-content">
            <span className="hero-banner-tag">{SLIDES[currentSlide].tag}</span>
            <h1 className="hero-banner-title">{SLIDES[currentSlide].title}</h1>
            <div className="hero-banner-desc" style={{ marginBottom: '36px' }}>{SLIDES[currentSlide].desc}</div>
            <div className="hero-banner-actions">
              <button className="hero-btn-primary" onClick={() => setSelectedSection('all')}>EXPLORE COLLECTION</button>
              <button className="hero-btn-secondary">
                <span className="play-icon">▶</span> WATCH FILM
              </button>
            </div>
          </div>

          <div className="hero-banner-image-container">
            <div className="hero-banner-watch-bg" />
            {SLIDES[currentSlide].type === 'video' ? (
              <video
                key={SLIDES[currentSlide].videoUrl}
                src={SLIDES[currentSlide].videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={nextSlide}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={SLIDES[currentSlide].imageUrl}
                alt="Winsor Collection Slide"
                className="hero-banner-watch-img"
              />
            )}
          </div>

          {SLIDES[currentSlide].type === 'video' && (
            <button 
              className="hero-video-mute-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>
          )}

          <div className="hero-banner-slides">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={currentSlide === idx ? 'active-slide' : ''}
                onClick={() => setCurrentSlide(idx)}
                style={{ cursor: 'pointer' }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            ))}
            <div className="slide-progress-line">
              <div
                className="slide-progress-active"
                style={{
                  width: currentSlide === 0 ? '33.3%' : currentSlide === 1 ? '66.6%' : '100%',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </section>

        <div className="collections-inner-body">
          {/* GENDER & COLLECTION FILTER HEADER CARDS (4 Columns) */}
          <div className="gender-header-row">
            {/* Card 1: Gents */}
            <div 
              className={`gender-header-card ${selectedGender === 'gents' ? 'active' : ''}`}
              onClick={() => setSelectedGender(selectedGender === 'gents' ? 'all' : 'gents')}
            >
              <div className="gender-card-img-wrapper">
                <Image 
                  src="/winsor_man.png" 
                  alt="Gents"
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                  className="gender-card-img"
                  priority
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <h2>GENTS</h2>
                <span>Shop Men's Watches</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>
              </div>
            </div>

            {/* Card 2: Ladies */}
            <div 
              className={`gender-header-card ${selectedGender === 'ladies' ? 'active' : ''}`}
              onClick={() => setSelectedGender(selectedGender === 'ladies' ? 'all' : 'ladies')}
            >
              <div className="gender-card-img-wrapper">
                <Image 
                  src="/winsor_girl_G.png" 
                  alt="Ladies"
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  style={{ objectFit: 'cover', objectPosition: 'center 10%' }}
                  className="gender-card-img"
                  priority
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <h2>LADIES</h2>
                <span>Shop Women's Watches</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>
              </div>
            </div>

            {/* Card 3: Gifts */}
            <div 
              className={`gender-header-card ${selectedGender === 'gifts' ? 'active' : ''}`}
              onClick={() => setSelectedGender(selectedGender === 'gifts' ? 'all' : 'gifts')}
            >
              <div className="gender-card-img-wrapper">
                <Image 
                  src="/graduation_gift.png" 
                  alt="Gifts"
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  style={{ objectFit: 'cover', objectPosition: 'center center' }}
                  className="gender-card-img"
                  priority
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <h2>GIFTS</h2>
                <span>Shop Gift Timepieces</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>
              </div>
            </div>

            {/* Card 4: Limited Edition */}
            <div 
              className={`gender-header-card ${selectedSection === 'limited' ? 'active' : ''}`}
              onClick={() => setSelectedSection(selectedSection === 'limited' ? 'all' : 'limited')}
            >
              <div className="gender-card-img-wrapper">
                <Image 
                  src="/watch-hero.jpg" 
                  alt="Limited Edition"
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
                  className="gender-card-img"
                  priority
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <h2>LIMITED EDITION</h2>
                <span>Exclusive Timepieces</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>
              </div>
            </div>
          </div>

          {/* BENEFITS BAR */}
          <div className="benefits-carousel-wrapper">
            <div className="benefits-bar">
              {/* Track 1 */}
              <div className="benefits-marquee-track">
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="m12 6-2 4h4l-2 4"/></svg>
                  <div>
                    <h4>Japan Movement</h4>
                    <span>UAE Registered Brand</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <h4>1 Year Warranty</h4>
                    <span>Sri Lanka & UAE</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><line x1="16" y1="8" x2="20" y2="8"/><line x1="16" y1="12" x2="22" y2="12"/></svg>
                  <div>
                    <h4>Free Shipping</h4>
                    <span>UAE & Sri Lanka</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  <div>
                    <h4>Easy Returns</h4>
                    <span>Within 7 Days</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <div>
                    <h4>Secure Payments</h4>
                    <span>Trusted & Verified</span>
                  </div>
                </div>
              </div>

              {/* Track 2 (Duplicate for Seamless Loop) */}
              <div className="benefits-marquee-track" aria-hidden="true">
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="m12 6-2 4h4l-2 4"/></svg>
                  <div>
                    <h4>Japan Movement</h4>
                    <span>UAE Registered Brand</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <h4>1 Year Warranty</h4>
                    <span>Sri Lanka & UAE</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><line x1="16" y1="8" x2="20" y2="8"/><line x1="16" y1="12" x2="22" y2="12"/></svg>
                  <div>
                    <h4>Free Shipping</h4>
                    <span>UAE & Sri Lanka</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  <div>
                    <h4>Easy Returns</h4>
                    <span>Within 7 Days</span>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <div>
                    <h4>Secure Payments</h4>
                    <span>Trusted & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION TITLE & TABS */}
          <div className="featured-section-header">
            <div className="featured-title-block">
              <h2 className="featured-title">FEATURED TIMEPIECES</h2>
              <Link href="/" className="view-all-link">View All Collections <span className="arrow">→</span></Link>
            </div>

            <div className="capsule-filter-row">
              <button
                onClick={() => { setSelectedSection('all'); setSelectedGender('all'); }}
                className={`capsule-btn ${(selectedSection === 'all' && selectedGender === 'all') ? 'active' : ''}`}
              >
                ALL WATCHES
              </button>
              <button
                onClick={() => setSelectedSection('new')}
                className={`capsule-btn ${selectedSection === 'new' ? 'active' : ''}`}
              >
                NEW ARRIVALS
              </button>
              <button
                onClick={() => setSelectedSection('bestsellers')}
                className={`capsule-btn ${selectedSection === 'bestsellers' ? 'active' : ''}`}
              >
                BEST SELLERS
              </button>
              <button
                onClick={() => setSelectedSection('sports')}
                className={`capsule-btn ${selectedSection === 'sports' ? 'active' : ''}`}
              >
                SPORTS
              </button>
              <button
                onClick={() => setSelectedSection('luxury')}
                className={`capsule-btn ${selectedSection === 'luxury' ? 'active' : ''}`}
              >
                CLASSIC
              </button>
              <button
                onClick={() => setSelectedSection('limited')}
                className={`capsule-btn ${selectedSection === 'limited' ? 'active' : ''}`}
              >
                LIMITED EDITION
              </button>
            </div>
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="mobile-filter-toggle-container md:hidden" style={{ margin: '0 auto 20px', maxWidth: '1400px', width: '100%' }}>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {showMobileFilters ? 'Hide Filters & Search' : 'Show Filters & Search'}
              </span>
              <span>{showMobileFilters ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* TOOLBAR CONTROLS */}
          <div className={`col-toolbar ${showMobileFilters ? 'show' : ''}`}>
            {/* Search bar */}
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search watches..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>

            {/* Gift Occasion Filter */}
            {giftCategories.length > 0 && (
              <select
                value={selectedGift}
                onChange={e => setSelectedGift(e.target.value)}
                className="toolbar-select"
              >
                <option value="all">All Occasions</option>
                {giftCategories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.emoji} {cat.label}
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
            <button onClick={resetFilters} className="toolbar-reset-btn">
              Reset Filters
            </button>
          </div>

          {/* PRODUCT GRID SECTION */}
          <div className="product-catalog">
            {loading ? (
              <div className="product-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Watches Found</h3>
                <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px', marginBottom: '16px' }}>Try resetting filters or search terms.</p>
                <button onClick={resetFilters} style={{ background: '#8B6914', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => {
                  const gender = getProductGender(product);
                  const isSoldOut = product.isSoldOut;
                  const isFav = product._id ? wishlist.includes(product._id) : false;

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
                        <div className="watch-card-footer">
                          <span className="watch-card-price">{convertPrice(product.price)}</span>
                          <div className="watch-card-actions">
                            <button 
                              onClick={() => product._id && toggleWishlist(product._id)}
                              className={`card-action-btn ${isFav ? 'active' : ''}`}
                              aria-label="Toggle Wishlist"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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
                                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                  <line x1="3" y1="6" x2="21" y2="6"/>
                                  <path d="M16 10a4 4 0 0 1-8 0"/>
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

          {/* BLACK RIBBON BANNER */}
          <div className="ribbon-banner">
            <div className="ribbon-content marquee-content">
              <div className="marquee-track">
                <span className="ribbon-highlight font-semibold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  TRUSTED BY WATCH ENTHUSIASTS WORLDWIDE
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  JAPAN MOVEMENT
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M6 3h12l4 6-10 12L2 9z"/></svg>
                  SAPPHIRE CRYSTAL
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>
                  WATER RESISTANT
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
                  PREMIUM MATERIALS
                </span>
              </div>
              <div className="marquee-track" aria-hidden="true">
                <span className="ribbon-highlight font-semibold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  TRUSTED BY WATCH ENTHUSIASTS WORLDWIDE
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  JAPAN MOVEMENT
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M6 3h12l4 6-10 12L2 9z"/></svg>
                  SAPPHIRE CRYSTAL
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>
                  WATER RESISTANT
                </span>
                <span className="ribbon-sep">|</span>
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: '#8b6914' }}><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
                  PREMIUM MATERIALS
                </span>
              </div>
            </div>
          </div>

          {/* NEWSLETTER BANNER */}
          <div className="newsletter-banner">
            <div className="newsletter-image-block">
              <img src="/watch-conquest.jpg" alt="Macro watch movement gears" />
            </div>
            <div className="newsletter-form-block">
              <span className="newsletter-tag">STAY TIMELESS</span>
              <h3>Join The Winsor Circle</h3>
              <p>Get early access to new collections, exclusive offers and insider stories.</p>
              <form onSubmit={e => e.preventDefault()} className="newsletter-form">
                <input type="email" placeholder="Enter your email address" required />
                <button type="submit">SUBSCRIBE</button>
              </form>
              <span className="newsletter-note">No spam. Unsubscribe anytime.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
