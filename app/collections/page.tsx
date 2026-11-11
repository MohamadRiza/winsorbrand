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

/**
 * Clean Editorial Hero Statement
 * Displays the slide headline and description with composed typography
 * and advances the slide timer smoothly.
 */
interface TypewriterHeroTextProps {
  titleL1?: string;
  titleL2?: string;
  descL1?: string;
  descL2?: string;
  onCycleComplete?: () => void;
}

function TypewriterHeroText({
  titleL1 = 'Timeless Craft.',
  titleL2 = 'Modern Legacy.',
  descL1 = 'Precision, heritage and excellence —',
  descL2 = 'crafted with Japanese precision movements and sapphire crystal glass.',
  onCycleComplete,
}: TypewriterHeroTextProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCycleComplete) onCycleComplete();
    }, 6500);
    return () => clearTimeout(timer);
  }, [titleL1, titleL2, descL1, descL2, onCycleComplete]);

  return (
    <>
      <h1 className="hero-banner-title">
        <span className="typewriter-line">{titleL1}</span>
        <span className="typewriter-line">{titleL2}</span>
      </h1>

      <div className="hero-banner-desc" style={{ marginBottom: '36px' }}>
        <span className="typewriter-desc-line">{descL1}</span>
        <span className="typewriter-desc-line">{descL2}</span>
      </div>
    </>
  );
}

export default function CollectionsPage() {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilmModalOpen(false);
    };
    if (isFilmModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFilmModalOpen]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % 3);
  };

  const SLIDES = useMemo(() => [
    {
      type: 'video',
      videoUrl: '/watch_smoke_vid.webm',
      tag: 'BUILT FOR MOMENTS THAT MATTER',
      titleL1: 'Timeless Craft.',
      titleL2: 'Modern Legacy.',
      descL1: 'Precision, heritage and excellence —',
      descL2: 'crafted with Japanese precision movements and sapphire crystal glass.',
      title: <>Timeless Craft.<br />Modern Legacy.</>,
      desc: <>Precision, heritage and excellence —<br />crafted with Japanese precision movements and sapphire crystal glass.</>,
    },
    {
      type: 'image',
      imageUrl: '/winsor_girl_G.png',
      tag: 'ELEGANCE & GRACE',
      titleL1: 'Timeless Beauty.',
      titleL2: 'Complements Every You.',
      descL1: 'A harmony of refined design and exquisite craftsmanship —',
      descL2: 'made to complement your style.',
      title: <>Timeless Beauty.<br />Complements Every You.</>,
      desc: <>A harmony of refined design and exquisite craftsmanship —<br />made to complement your style.</>,
    },
    {
      type: 'image',
      imageUrl: '/winsor_man.png',
      tag: 'BOLD & DISTINGUISHED',
      titleL1: 'Engineered For',
      titleL2: 'Those Who Never Settle.',
      descL1: 'Uncompromising style and robust elegance —',
      descL2: 'built for the modern trailblazer.',
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

  // Newsletter Subscribe State
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    setTimeout(() => {
      toast.success('Welcome to The Winsor Circle! Check your inbox shortly.');
      setSubscriberEmail('');
      setSubscribing(false);
    }, 800);
  };

  // API States
  const [products, setProducts] = useState<IProduct[]>([]);
  const [giftCategories, setGiftCategories] = useState<IGiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});

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

  // Fetch review ratings once products are loaded
  useEffect(() => {
    if (products.length === 0) return;
    const ids = products.map(p => p._id).filter(Boolean).join(',');
    fetch(`/api/reviews/ratings?ids=${ids}`)
      .then(r => (r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : { success: false, data: {} }))
      .then(data => { if (data.success) setReviewRatings(data.data || {}); })
      .catch(() => { });
  }, [products]);

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

  // Scroll smoothly to products section when filter cards/buttons are clicked
  const scrollToProducts = () => {
    setTimeout(() => {
      const element = document.getElementById('featured-products-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
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
      <div style={{ minHeight: '80vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", paddingTop: '110px' }}>
        <div style={{ textAlign: 'center', padding: '44px 36px', maxWidth: '440px', width: '100%', background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', borderTop: '2.5px solid #8B6914', borderRadius: '12px', boxShadow: '0 12px 36px rgba(20,16,10,0.04)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6914', marginBottom: '10px' }}>Winsor Boutique</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#141414', marginBottom: '12px', fontWeight: 500 }}>Connection Error</h2>
          <p style={{ color: 'rgba(20,20,20,0.58)', fontSize: '14px', lineHeight: 1.6, marginBottom: '26px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)', color: '#fff', border: 'none', borderRadius: '4px', padding: '13px 30px', fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600;700&display=swap');
        
        .col-container {
          background-color: #ffffff;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          color: #141414;
          padding-bottom: 40px;
        }

        /* ── HERO BANNER ── */
        .collections-hero-banner {
          position: relative;
          background: radial-gradient(circle at right, #1c1a17 0%, #0c0b09 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 138px 6% 74px;
          min-height: 520px;
          margin-bottom: 0;
        }
        .hero-banner-content {
          max-width: 48%;
          position: relative;
          z-index: 10;
        }
        .hero-banner-tag {
          color: #D4AF63;
          font-size: 10.5px;
          letter-spacing: 0.3em;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .hero-banner-tag::before {
          content: '';
          width: 24px;
          height: 1px;
          background: #D4AF63;
          display: inline-block;
        }
        .hero-banner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 4vw, 56px);
          line-height: 1.12;
          font-weight: 400;
          letter-spacing: -0.01em;
          margin-bottom: 20px;
          color: #fff;
          min-height: calc(2 * 1.12em);
        }
        .hero-banner-desc {
          font-family: 'Jost', sans-serif;
          font-size: clamp(14px, 1.4vw, 15.5px);
          font-weight: 300;
          color: rgba(255,255,255,0.8);
          line-height: 1.65;
          margin-bottom: 36px;
          min-height: calc(2 * 1.45em);
        }
        .typewriter-line {
          display: block;
          min-height: 1.12em;
          line-height: 1.12;
        }
        .typewriter-desc-line {
          display: block;
          min-height: 1.45em;
          line-height: 1.45;
        }
        .hero-banner-actions {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .hero-btn-primary {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          border: 1px solid #8B6914;
          padding: 14px 30px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 4px;
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .hero-btn-primary:hover {
          background: linear-gradient(135deg, #B58F49 0%, #9C7A3C 100%);
          border-color: #B58F49;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(160, 124, 39, 0.42);
        }
        .hero-btn-secondary {
          background: rgba(16, 14, 10, 0.52);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.34);
          padding: 14px 28px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border-radius: 4px;
        }
        .hero-btn-secondary .play-icon {
          color: #D4AF63;
          font-size: 10px;
          transition: transform 0.3s ease, color 0.3s ease;
        }
        .hero-btn-secondary:hover {
          border-color: #9C7A3C;
          background: rgba(139, 105, 20, 0.24);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.25);
        }
        .hero-btn-secondary:hover .play-icon {
          color: #ffffff;
          transform: scale(1.15);
        }
        .hero-banner-image-container {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 52%;
          z-index: 1;
          overflow: hidden;
        }
        .hero-banner-watch-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
        }
        @keyframes hero-media-fade-in {
          0% {
            opacity: 0.35;
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .hero-banner-media-active {
          animation: hero-media-fade-in 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .hero-banner-watch-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #0c0b09 0%, rgba(12, 11, 9, 0.65) 28%, transparent 58%);
          z-index: 2;
        }
        .hero-banner-slides {
          position: absolute;
          right: 6%;
          bottom: 46px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          z-index: 10;
        }
        .active-slide {
          color: #fff;
          font-weight: 600;
        }
        .slide-progress-line {
          width: 48px;
          height: 1.5px;
          background: rgba(255,255,255,0.18);
          position: relative;
        }
        .slide-progress-active {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 33%;
          background: #9C7A3C;
        }

        /* ── INNER BODY PAGE ── */
        .collections-inner-body {
          padding: 0 4% 64px;
        }

        /* ── GENDER FILTER HEADER ── */
        .gender-header-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
          margin: 0 auto 48px;
          max-width: 1400px;
          width: 100%;
        }
        .gender-header-card {
          height: 256px;
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s, box-shadow 0.35s;
          border: 1px solid rgba(20, 20, 20, 0.08);
          display: block;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(20, 16, 10, 0.06);
        }
        .gender-header-card.active,
        .gender-header-card:hover {
          transform: translateY(-4px);
          border-color: #8b6914;
          box-shadow: 0 16px 36px rgba(20, 16, 10, 0.14);
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
          background: linear-gradient(to top, rgba(12, 10, 8, 0.82) 0%, rgba(12, 10, 8, 0.25) 52%, rgba(12, 10, 8, 0.04) 100%);
          transition: background 0.3s;
          z-index: 1;
        }
        .gender-header-card:hover .gender-header-overlay {
          background: linear-gradient(to top, rgba(12, 10, 8, 0.88) 0%, rgba(12, 10, 8, 0.3) 55%, rgba(12, 10, 8, 0.06) 100%);
        }
        .gender-header-content {
          position: absolute;
          bottom: 22px;
          left: 22px;
          right: 54px;
          color: #fff;
          z-index: 2;
          text-decoration: none;
        }
        .gender-card-eyebrow {
          display: block;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #D4AF63;
          margin-bottom: 4px;
        }
        .gender-header-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 2px;
          letter-spacing: 0.04em;
          color: #ffffff;
          line-height: 1.15;
        }
        .gender-header-content span.gender-sub {
          font-size: 11.5px;
          opacity: 0.8;
          letter-spacing: 0.02em;
          font-weight: 300;
          color: #ffffff;
          display: block;
        }
        .gender-header-arrow {
          position: absolute;
          bottom: 22px;
          right: 20px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(16, 14, 10, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.3s ease;
          z-index: 2;
        }
        .gender-header-card:hover .gender-header-arrow {
          border-color: #D4AF63;
          background: #8B6914;
          color: #FFFFFF;
          transform: translateX(2px);
        }

        /* ── ATTACHED BENEFITS / PROVENANCE BAR ── */
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
          margin: -34px auto 32px;
          padding: 0 4%;
          width: 100%;
        }
        .hero-attached-benefits-bar {
          position: relative;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-top: 2px solid #8B6914;
          box-shadow: 0 14px 36px rgba(20, 16, 10, 0.06);
          padding: 20px 28px;
          overflow: hidden;
        }
        .hero-attached-benefit-item {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #141414;
        }
        .hero-attached-benefit-item svg {
          color: #8b6914;
          flex-shrink: 0;
        }
        .hero-attached-benefit-item h4 {
          font-size: 12.5px;
          font-weight: 600;
          margin: 0 0 2px;
          letter-spacing: 0.02em;
          color: #141414;
          white-space: nowrap;
        }
        .hero-attached-benefit-item span {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.56);
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
          .hero-attached-benefits-track .hero-attached-benefit-item:not(:last-child) {
            border-right: 1px solid rgba(20, 20, 20, 0.07);
            padding-right: 14px;
          }
          .hero-attached-benefits-track.duplicate {
            display: none !important;
          }
        }

        @media (max-width: 1024px) {
          .hero-attached-benefits-wrapper {
            margin: -26px auto 24px;
            padding: 0 16px;
          }
          .hero-attached-benefits-bar {
            padding: 15px 0;
            display: flex;
            box-shadow: 0 10px 28px rgba(20, 16, 10, 0.07);
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
            animation: hero-benefits-marquee 26s linear infinite;
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

        /* ── FEATURED TITLE BLOCK ── */
        .featured-section-header {
          margin: 0 auto 28px;
          max-width: 1400px;
          width: 100%;
        }
        .featured-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8B6914;
          margin-bottom: 8px;
        }
        .featured-eyebrow-rule {
          width: 24px;
          height: 1px;
          background: #8B6914;
          display: inline-block;
        }
        .featured-title-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.08);
          padding-bottom: 18px;
        }
        .featured-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          letter-spacing: 0.03em;
          font-weight: 500;
          text-transform: uppercase;
          margin: 0 0 4px;
          color: #141414;
          line-height: 1.1;
        }
        .featured-subtitle {
          font-size: 13px;
          color: rgba(20, 20, 20, 0.56);
          margin: 0;
        }
        .view-all-link {
          font-size: 11.5px;
          font-weight: 600;
          color: #8b6914;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .view-all-link:hover {
          color: #141414;
        }

        /* ── CAPSULE FILTER ROW ── */
        .capsule-filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .capsule-btn {
          background: #FFFFFF;
          color: rgba(20, 20, 20, 0.72);
          border: 1px solid rgba(20, 20, 20, 0.12);
          padding: 9px 20px;
          font-size: 11px;
          letter-spacing: 0.14em;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .capsule-btn.active {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          border-color: #8B6914;
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.22);
        }
        .capsule-btn:hover:not(.active) {
          border-color: rgba(139, 105, 20, 0.45);
          background: #FAF8F4;
          color: #8B6914;
        }

        /* ── TOOLBAR CONTROLS ── */
        .col-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          margin: 0 auto 36px;
          padding: 16px 22px;
          background-color: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(20, 16, 10, 0.025);
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
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 4px;
          padding: 10px 16px 10px 38px;
          font-size: 13px;
          color: #141414;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .search-input:focus {
          outline: none;
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
          background: #ffffff;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(139, 105, 20, 0.75);
          pointer-events: none;
        }
        .toolbar-select {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #141414;
          cursor: pointer;
          font-family: inherit;
          min-width: 160px;
          transition: border-color 0.2s ease;
        }
        .toolbar-select:focus {
          outline: none;
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
          background: #ffffff;
        }
        .toolbar-reset-btn {
          background: #FFFFFF;
          border: 1px solid rgba(139, 105, 20, 0.34);
          color: #8B6914;
          padding: 10px 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          margin-left: auto;
        }
        .toolbar-reset-btn:hover {
          border-color: #8B6914;
          color: #684E0D;
          background: #FAF8F4;
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
          gap: 26px;
        }
        
        /* ── WATCH CARD CONTAINER ── */
        .watch-card-container {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid rgba(20, 20, 20, 0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 4px 16px rgba(20, 16, 10, 0.025);
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        .watch-card-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #9C7A3C 0%, #8B6914 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 4;
          pointer-events: none;
        }
        .watch-card-container:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(20, 16, 10, 0.08);
          border-color: rgba(139, 105, 20, 0.42);
          background: #ffffff;
        }
        .watch-card-container:hover::before {
          opacity: 1;
        }
        .watch-img-container {
          position: relative;
          aspect-ratio: 1;
          background: #FFFFFF;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-bottom: 1px solid rgba(20, 20, 20, 0.06);
        }
        .watch-card-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .watch-card-container:hover .watch-card-image {
          transform: scale(1.05);
        }
        .watch-card-badge {
          position: absolute;
          left: 14px;
          top: 14px;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          padding: 4px 10px;
          border-radius: 3px;
          z-index: 2;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(139, 105, 20, 0.2);
        }
        .watch-card-badge.sold-out {
          background: #F4F3F0;
          color: rgba(20, 20, 20, 0.68);
          border: 1px solid rgba(20, 20, 20, 0.1);
          box-shadow: none;
        }
        .watch-card-info {
          padding: 18px 20px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff;
        }
        .watch-card-title-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .watch-card-title {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          line-height: 1.4;
          margin: 0 0 6px;
          min-height: 36px;
          color: #141414;
          word-break: break-word;
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.25s ease;
        }
        .watch-card-container:hover .watch-card-title {
          color: #8B6914;
        }
        .watch-card-specs {
          font-size: 11.5px;
          color: rgba(20, 20, 20, 0.56);
          margin: 0;
          line-height: 1.45;
          word-break: break-word;
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .watch-card-meta-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 8px 0 2px;
          min-height: 18px;
        }
        .watch-card-verified-tag {
          font-size: 10.5px;
          color: #8B6914;
          font-weight: 500;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .watch-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          border-top: 1px solid rgba(20, 20, 20, 0.06);
          padding-top: 14px;
        }
        .watch-card-price {
          font-size: 14.5px;
          font-weight: 600;
          color: #141414;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.01em;
        }
        .watch-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .card-action-btn {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.1);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(20, 20, 20, 0.72);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .card-action-btn:hover {
          background: #FAF8F4;
          color: #8B6914;
          border-color: rgba(139, 105, 20, 0.45);
        }
        .card-action-btn.active {
          background: #8B6914;
          color: #FFFFFF;
          border-color: #8B6914;
        }
        .card-action-btn.highlight:hover {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #fff;
          border-color: #8B6914;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.22);
        }

        /* ── PRIVATE CLIENTELE BANNER ── */
        .newsletter-banner {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-top: 2.5px solid #8B6914;
          background: #FFFFFF;
          margin: 68px auto 30px;
          max-width: 1400px;
          width: 100%;
          box-shadow: 0 14px 40px rgba(20, 16, 10, 0.04);
          transition: box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .newsletter-banner:hover {
          box-shadow: 0 20px 50px rgba(20, 16, 10, 0.07);
        }
        .newsletter-image-block {
          height: 100%;
          position: relative;
          min-height: 410px;
          overflow: hidden;
        }
        .newsletter-image-block img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .newsletter-banner:hover .newsletter-image-block img {
          transform: scale(1.03);
        }
        .newsletter-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(14, 12, 10, 0.68) 0%, rgba(14, 12, 10, 0.18) 55%, rgba(14, 12, 10, 0.08) 100%);
        }
        .newsletter-image-badge {
          position: absolute;
          bottom: 24px;
          left: 24px;
          background: rgba(16, 14, 10, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(212, 175, 99, 0.35);
          padding: 8px 16px;
          border-radius: 4px;
          color: #D4AF63;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .newsletter-form-block {
          padding: 52px 8%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          background: #FFFFFF;
        }
        .newsletter-tag-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .gold-line {
          height: 1px;
          width: 24px;
          background: #8B6914;
        }
        .newsletter-tag {
          font-size: 10.5px;
          color: #8B6914;
          letter-spacing: 0.22em;
          font-weight: 600;
          text-transform: uppercase;
        }
        .newsletter-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 500;
          color: #141414;
          margin: 0 0 12px;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .newsletter-desc {
          font-size: 14px;
          color: rgba(20, 20, 20, 0.6);
          line-height: 1.65;
          margin: 0 0 26px;
          max-width: 480px;
        }
        .newsletter-privileges {
          display: flex;
          flex-wrap: wrap;
          gap: 18px 28px;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.07);
        }
        .newsletter-privilege-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #141414;
        }
        .newsletter-form {
          display: flex;
          flex-direction: row;
          gap: 10px;
          margin-bottom: 14px;
        }
        .input-wrapper {
          position: relative;
          flex: 1;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #8B6914;
          pointer-events: none;
        }
        .input-wrapper input {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(20, 20, 20, 0.14);
          padding: 14px 16px 14px 44px;
          font-size: 13px;
          font-family: inherit;
          border-radius: 4px;
          color: #141414;
          transition: all 0.25s ease;
        }
        .input-wrapper input:focus {
          outline: none;
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
          background: #ffffff;
        }
        .newsletter-submit-btn {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          border: none;
          padding: 14px 26px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          font-family: 'Jost', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.2);
        }
        .newsletter-submit-btn:hover {
          background: linear-gradient(135deg, #7A5C10 0%, #684E0D 100%);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.28);
        }
        .newsletter-submit-btn svg {
          transition: transform 0.25s ease;
        }
        .newsletter-submit-btn:hover svg {
          transform: translateX(3px);
        }

        .newsletter-footer-note {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          line-height: 1.45;
          color: rgba(20, 20, 20, 0.52);
        }
        .newsletter-footer-note svg {
          flex-shrink: 0;
        }

        .hero-video-mute-btn {
          position: absolute;
          right: 6%;
          bottom: 94px;
          background: rgba(16, 14, 10, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          width: 40px;
          height: 40px;
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
          transform: scale(1.06);
        }

        /* ── SKELETON CARD ── */
        .skeleton-card {
          height: 390px;
          background: linear-gradient(90deg, #fafafa 25%, #f2f2f2 50%, #fafafa 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 10px;
          border: 1px solid rgba(20, 20, 20, 0.06);
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
            padding: 120px 24px 72px;
            text-align: center;
            min-height: 480px;
            height: auto;
            position: relative;
          }
          .hero-banner-content {
            max-width: 560px;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
          .hero-banner-tag {
            justify-content: center;
          }
          .hero-banner-actions {
            justify-content: center;
          }
          .hero-banner-image-container {
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
            margin-top: 0 !important;
            z-index: 1;
            overflow: hidden;
          }
          .hero-banner-watch-img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center 20% !important;
          }
          .hero-banner-watch-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(10, 9, 8, 0.58) 0%, rgba(10, 9, 8, 0.52) 50%, rgba(10, 9, 8, 0.82) 100%) !important;
            z-index: 2;
          }
          .hero-video-mute-btn {
            right: 16px;
            bottom: 34px;
            width: 36px;
            height: 36px;
          }
          .hero-banner-slides {
            display: flex;
            position: absolute;
            bottom: 34px;
            left: 50%;
            transform: translateX(-50%);
            right: auto;
            z-index: 15;
            gap: 8px;
          }
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .newsletter-banner {
            grid-template-columns: 1fr;
          }
          .newsletter-image-block {
            min-height: 260px;
          }
        }

        @media (max-width: 768px) {
          .gender-header-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-bottom: 36px;
          }
          .gender-header-card {
            height: 175px;
          }
          .gender-header-content {
            bottom: 16px;
            left: 16px;
            right: 48px;
          }
          .gender-header-content h2 {
            font-size: 20px;
          }
          .gender-header-arrow {
            bottom: 16px;
            right: 14px;
            width: 28px;
            height: 28px;
          }
          .capsule-filter-row {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 8px;
            margin-bottom: 20px;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .capsule-filter-row::-webkit-scrollbar {
            display: none;
          }
          .capsule-btn {
            flex: 0 0 auto;
            padding: 8px 15px;
            font-size: 10px;
          }
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .watch-img-container {
            padding: 14px;
          }
          .watch-card-info {
            padding: 14px;
          }
          .watch-card-title {
            font-size: 12px;
            min-height: 34px;
          }
          .watch-card-specs {
            font-size: 11px;
          }
          .watch-card-footer {
            gap: 8px;
            margin-top: 12px;
            padding-top: 10px;
          }
          .watch-card-price {
            font-size: 13px;
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
            padding: 16px;
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
          .newsletter-banner {
            margin: 44px auto 24px;
          }
          .newsletter-form-block {
            padding: 36px 24px;
          }
          .newsletter-title {
            font-size: 30px;
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
          }
        }

        @media (max-width: 480px) {
          .gender-header-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .gender-header-card {
            height: 158px;
          }
          .gender-header-content {
            left: 12px;
            right: 40px;
            bottom: 12px;
          }
          .gender-card-eyebrow {
            font-size: 8px;
            margin-bottom: 3px;
          }
          .gender-header-content h2 {
            font-size: 14.5px;
            letter-spacing: 0.08em;
          }
          .gender-header-content span.gender-sub {
            font-size: 9.5px;
            line-height: 1.25;
          }
          .gender-header-arrow {
            width: 24px;
            height: 24px;
            bottom: 12px;
            right: 10px;
          }
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .watch-card-info {
            padding: 12px 11px 13px;
          }
          .watch-card-title {
            min-height: 36px;
          }
          .watch-card-meta-row {
            min-height: 20px;
          }
          .watch-card-verified-tag {
            font-size: 9px;
            gap: 4px;
            white-space: nowrap;
          }
          .watch-card-verified-tag svg {
            flex-shrink: 0;
          }
          .watch-card-footer {
            gap: 6px;
          }
          .watch-card-price {
            font-size: 12.5px;
            white-space: nowrap;
          }
          .watch-card-actions {
            gap: 5px;
          }
          .card-action-btn {
            width: 26px;
            height: 26px;
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
            <TypewriterHeroText
              key={`hero-typewriter-${currentSlide}`}
              titleL1={SLIDES[currentSlide].titleL1}
              titleL2={SLIDES[currentSlide].titleL2}
              descL1={SLIDES[currentSlide].descL1}
              descL2={SLIDES[currentSlide].descL2}
              onCycleComplete={nextSlide}
            />
            <div className="hero-banner-actions">
              <button
                className="hero-btn-primary"
                onClick={() => { setSelectedSection('all'); setSelectedGender('all'); scrollToProducts(); }}
              >
                EXPLORE COLLECTION
              </button>
              <button
                className="hero-btn-secondary"
                onClick={() => setIsFilmModalOpen(true)}
              >
                <span className="play-icon">▶</span> WATCH FILM
              </button>
            </div>
          </div>

          <div className="hero-banner-image-container">
            <div className="hero-banner-watch-bg" />
            {SLIDES[currentSlide].type === 'video' ? (
              <video
                key={`hero-video-${currentSlide}-${SLIDES[currentSlide].videoUrl}`}
                src={SLIDES[currentSlide].videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={nextSlide}
                className="hero-banner-watch-img hero-banner-media-active"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
              />
            ) : (
              <Image
                key={`hero-img-${currentSlide}-${SLIDES[currentSlide].imageUrl}`}
                src={SLIDES[currentSlide].imageUrl || '/winsor_girl_G.png'}
                alt="Winsor Collection Slide"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="hero-banner-watch-img hero-banner-media-active"
                style={{
                  objectFit: 'cover',
                  objectPosition: currentSlide === 1 ? 'center 20%' : 'center 25%',
                }}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
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
          {/* Brand Film Lightbox Modal */}
          {isFilmModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(5, 5, 5, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setIsFilmModalOpen(false)}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '960px',
                  backgroundColor: '#0c0c0c',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(139, 105, 20, 0.35)',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(139, 105, 20, 0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: '#121212',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B6914', display: 'inline-block' }} />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#DFB15B', fontWeight: 600 }}>
                      WINSOR HOROLOGY CINEMATIC FILM
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFilmModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#aaaaaa',
                      fontSize: '24px',
                      lineHeight: 1,
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#aaaaaa'}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                {/* Video Player */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000000' }}>
                  <video
                    src="/watch_smoke_vid.webm"
                    controls
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── ATTACHED BENEFITS BAR (DIRECTLY ATTACHED TO HERO BANNER - IMG2 REPLICATE) ── */}
        <div className="hero-attached-benefits-wrapper">
          <div className="hero-attached-benefits-bar">
            <div className="hero-attached-benefits-marquee-container">
              {/* Track 1 */}
              <div className="hero-attached-benefits-track">
                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <div>
                    <h4>Japanese Calibre</h4>
                    <span>Tested Precision Movements</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <div>
                    <h4>24-Month Warranty</h4>
                    <span>Official Winsor Coverage</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                  <div>
                    <h4>Insured Delivery</h4>
                    <span>Complimentary Island-Wide</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                  <div>
                    <h4>14-Day Exchange</h4>
                    <span>Hassle-Free Inspection</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <div>
                    <h4>Verified Checkout</h4>
                    <span>Encrypted PayHere Gateway</span>
                  </div>
                </div>
              </div>

              {/* Track 2 (Duplicate for Seamless Infinite Marquee Loop on Mobile) */}
              <div className="hero-attached-benefits-track duplicate" aria-hidden="true">
                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <div>
                    <h4>Japanese Calibre</h4>
                    <span>Tested Precision Movements</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  <div>
                    <h4>24-Month Warranty</h4>
                    <span>Official Winsor Coverage</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                  <div>
                    <h4>Insured Delivery</h4>
                    <span>Complimentary Island-Wide</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                  <div>
                    <h4>14-Day Exchange</h4>
                    <span>Hassle-Free Inspection</span>
                  </div>
                </div>

                <div className="hero-attached-benefit-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <div>
                    <h4>Verified Checkout</h4>
                    <span>Encrypted PayHere Gateway</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="collections-inner-body">
          {/* GENDER & COLLECTION FILTER HEADER CARDS (4 Columns) */}
          <div className="gender-header-row">
            {/* Card 1: Gents -> Redirects directly to /mens */}
            <Link
              href="/mens"
              className="gender-header-card"
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
                  unoptimized
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <span className="gender-card-eyebrow">Collection</span>
                <h2>GENTS</h2>
                <span className="gender-sub">Explore Men&apos;s Calibres</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </Link>

            {/* Card 2: Ladies -> Redirects directly to /womens */}
            <Link
              href="/womens"
              className="gender-header-card"
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
                  unoptimized
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <span className="gender-card-eyebrow">Collection</span>
                <h2>LADIES</h2>
                <span className="gender-sub">Explore Women&apos;s Editions</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </Link>

            {/* Card 3: Gifts -> Redirects directly to /gifts */}
            <Link
              href="/gifts"
              className="gender-header-card"
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
                  unoptimized
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <span className="gender-card-eyebrow">Collection</span>
                <h2>GIFTS</h2>
                <span className="gender-sub">Curated Presentation Sets</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </Link>

            {/* Card 4: Limited Edition -> Redirects directly to /limited-edition */}
            <Link
              href="/limited-edition"
              className="gender-header-card"
            >
              <div className="gender-card-img-wrapper">
                <Image
                  src="/category_HomeS/limitted_bg.webp"
                  alt="Limited Edition"
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  style={{ objectFit: 'cover', objectPosition: 'center center' }}
                  className="gender-card-img"
                  priority
                  unoptimized
                />
              </div>
              <div className="gender-header-overlay" />
              <div className="gender-header-content">
                <span className="gender-card-eyebrow">Atelier Reserve</span>
                <h2>LIMITED EDITION</h2>
                <span className="gender-sub">Numbered Collector Runs</span>
              </div>
              <div className="gender-header-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </Link>
          </div>



          {/* SECTION TITLE & TABS */}
          <div className="featured-section-header" id="featured-products-section">
            <div className="featured-title-block">
              <div>
                <div className="featured-eyebrow">
                  <span className="featured-eyebrow-rule" />
                  <span>Winsor Catalogue</span>
                </div>
                <h2 className="featured-title">FEATURED TIMEPIECES</h2>
                <p className="featured-subtitle">Curated quartz and automatic calibres backed by our official 24-month warranty.</p>
              </div>
              <Link
                href="#featured-products-section"
                onClick={(e) => {
                  e.preventDefault();
                  resetFilters();
                  document.getElementById('featured-products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="view-all-link"
              >
                View All Collections <span className="arrow">→</span>
              </Link>
            </div>

            <div className="capsule-filter-row">
              <button
                onClick={() => { setSelectedSection('all'); setSelectedGender('all'); }}
                className={`capsule-btn ${(selectedSection === 'all' && selectedGender === 'all') ? 'active' : ''}`}
              >
                ALL WATCHES
              </button>
              <button
                onClick={() => { setSelectedSection('new'); setSelectedGender('all'); }}
                className={`capsule-btn ${selectedSection === 'new' ? 'active' : ''}`}
              >
                NEW ARRIVALS
              </button>
              <button
                onClick={() => { setSelectedSection('bestsellers'); setSelectedGender('all'); }}
                className={`capsule-btn ${selectedSection === 'bestsellers' ? 'active' : ''}`}
              >
                BEST SELLERS
              </button>
              <button
                onClick={() => { setSelectedSection('sports'); setSelectedGender('all'); }}
                className={`capsule-btn ${selectedSection === 'sports' ? 'active' : ''}`}
              >
                SPORTS
              </button>
              <button
                onClick={() => { setSelectedSection('luxury'); setSelectedGender('all'); }}
                className={`capsule-btn ${selectedSection === 'luxury' ? 'active' : ''}`}
              >
                CLASSIC
              </button>
              <button
                onClick={() => { setSelectedSection('limited'); setSelectedGender('all'); }}
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
                background: '#FFFFFF',
                border: '1px solid rgba(20,20,20,0.12)',
                borderRadius: '8px',
                padding: '13px 18px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#141414',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                {showMobileFilters ? 'Hide Filters & Search' : 'Filter & Search Timepieces'}
              </span>
              <span style={{ color: '#8B6914', fontSize: '10px' }}>{showMobileFilters ? '▲' : '▼'}</span>
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
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </div>

            {/* Gift Occasion Filter */}
            {giftCategories.length > 0 && (
              <select
                value={selectedGift}
                onChange={e => setSelectedGift(e.target.value)}
                className="toolbar-select"
                aria-label="Filter by gift occasion"
              >
                <option value="all">All Occasions</option>
                {giftCategories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            )}

            {/* Target Audience / Gender Filter */}
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value as any)}
              className="toolbar-select"
              aria-label="Filter by gender"
            >
              <option value="all">All Watches</option>
              <option value="gents">Gents Watches</option>
              <option value="ladies">Ladies Watches</option>
            </select>

            {/* Price Sorting */}
            <select
              value={priceSort}
              onChange={e => setPriceSort(e.target.value as any)}
              className="toolbar-select"
              aria-label="Sort by price"
            >
              <option value="none">Sort By: Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>

            {/* Results Count */}
            <span style={{ fontSize: '12px', color: 'rgba(20, 20, 20, 0.5)', letterSpacing: '0.02em', marginLeft: '10px' }} className="hidden md:inline">
              {!loading && `${filteredProducts.length} Timepiece${filteredProducts.length === 1 ? '' : 's'} shown`}
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
              <div style={{ textAlign: 'center', padding: '72px 24px', border: '1px solid rgba(20,20,20,0.08)', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 6px 24px rgba(17,17,17,0.03)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#141414', marginBottom: '8px' }}>No Matching Timepieces</h3>
                <p style={{ color: 'rgba(20,20,20,0.52)', fontSize: '13.5px', marginBottom: '20px' }}>Adjust your collection filter or search query to explore the full Winsor catalogue.</p>
                <button onClick={resetFilters} style={{ background: 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)', color: '#FFFFFF', border: 'none', padding: '11px 24px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '6px' }}>
                  View All Timepieces
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => {
                  const gender = getProductGender(product);
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
                          <span className="watch-card-badge sold-out">Sold Out</span>
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
                            {product.specifications?.Material || '316L Stainless Steel'} · {product.specifications?.['Case Size'] || '40mm'}
                          </p>
                        </Link>

                        {/* Rating or Official Warranty Cue */}
                        {reviewCount > 0 ? (
                          <div className="watch-card-meta-row">
                            {[1, 2, 3, 4, 5].map(s => {
                              const filled = avgRating >= s;
                              const half = !filled && avgRating >= s - 0.5;
                              const gradId = `half-${product._id}-${s}`;
                              return (
                                <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={filled ? '#8B6914' : half ? `url(#${gradId})` : 'none'} stroke="#8B6914" strokeWidth="1.5">
                                  {half && (
                                    <defs>
                                      <linearGradient id={gradId}>
                                        <stop offset="50%" stopColor="#8B6914" />
                                        <stop offset="50%" stopColor="transparent" />
                                      </linearGradient>
                                    </defs>
                                  )}
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              );
                            })}
                            <span style={{ fontSize: '10.5px', color: 'rgba(20,20,20,0.58)', fontFamily: "'Jost',sans-serif", fontWeight: 500, marginLeft: '2px' }}>
                              {avgRating.toFixed(1)} ({reviewCount})
                            </span>
                          </div>
                        ) : (
                          <div className="watch-card-meta-row">
                            <span className="watch-card-verified-tag">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                              </svg>
                              24M Warranty · Authentic
                            </span>
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

          {/* PRIVATE CLIENTELE — INVITATION DISPATCH */}
          <div className="newsletter-banner">
            <div className="newsletter-image-block">
              <Image src="/collections_pg.webp" alt="Winsor Private Clientele Collection" width={600} height={400} className="w-full h-full object-cover" />
              <div className="newsletter-image-overlay" />
              <div className="newsletter-image-badge">
                <span className="badge-text font-mono uppercase tracking-[0.22em] text-[10px]">WINSOR PRIVATE CLIENTELE</span>
              </div>
            </div>

            <div className="newsletter-form-block">
              <div className="newsletter-header">
                <div className="newsletter-tag-container">
                  <span className="gold-line" />
                  <span className="newsletter-tag">PRIVATE REGISTRY</span>
                  <span className="gold-line" />
                </div>
                <h3 className="newsletter-title font-serif">Private Release Invitations</h3>
                <p className="newsletter-desc">
                  Receive quiet dispatches on numbered timepiece allocations, seasonal atelier releases, and private collector viewings.
                </p>
              </div>

              <div className="newsletter-privileges">
                <span className="newsletter-privilege-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Priority access to numbered drops
                </span>
                <span className="newsletter-privilege-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Private collector trunk invitations
                </span>
              </div>

              <form onSubmit={handleSubscribe} className="newsletter-form">
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <button type="submit" disabled={subscribing} className="newsletter-submit-btn">
                  {subscribing ? 'JOINING…' : 'JOIN LIST'}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <div className="newsletter-footer-note">
                <svg className="w-3.5 h-3.5 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Discreet quarterly dispatches. Private client data is never shared.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Winsor Watch Collections | Japanese Movement Timepieces',
            description:
              'Explore precision Japanese movement watches, sports chronographs, and limited edition timepieces by Winsor.',
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com'}/collections`,
            publisher: {
              '@type': 'Organization',
              name: 'Winsor Watches',
              logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com'}/icon.png`,
            },
          }),
        }}
      />
    </>
  );
}
