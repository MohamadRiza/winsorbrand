'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { IProduct, ColorVariant, WARRANTY_LABELS } from '@/types';
import { useCart } from '@/app/context/CartContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import GuestCheckoutModal from '@/components/Checkout/GuestCheckoutModal';
import BuyNowModal from '@/components/Checkout/BuyNowModal';
import AmbientVideoPlayer from '@/components/Video/AmbientVideoPlayer';
import WinsorLoader from '@/components/WinsorLoader';

interface ProductDetailsClientProps {
  id: string;
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Buy Now modal states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState<any>(null);

  // Preload buyer profile when signed in & refresh on window focus
  useEffect(() => {
    if (!isSignedIn || !user) {
      setBuyerProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const params = new URLSearchParams();
        if (user.id) params.set('clerkId', user.id);
        if (userEmail) params.set('email', userEmail);
        const res = await fetch(`/api/customer/profile?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data) {
          setBuyerProfile(data.data);
        }
      } catch (e) {
        console.warn('Failed to preload buyer profile:', e);
      }
    };

    loadProfile();

    const handleWindowFocus = () => {
      loadProfile();
    };
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleWindowFocus);
    };
  }, [isSignedIn, user]);

  // API States
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');

  // Cart Interaction States
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);
  const [suggestionRatings, setSuggestionRatings] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});
  const [storyVideoPlaying, setStoryVideoPlaying] = useState(false);
  const [storySlideState, setStorySlideState] = useState<{ active: number; prev: number | null }>({
    active: 0,
    prev: null,
  });
  const [storySlideshowPaused, setStorySlideshowPaused] = useState(false);

  // Accordion States
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  // Reviews States
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'photos' | 1 | 2 | 3 | 4 | 5>('all');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(5);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [focusSlideIdx, setFocusSlideIdx] = useState<number>(1);
  const photoStripRef = useRef<HTMLDivElement>(null);

  const scrollPhotos = (direction: 'left' | 'right') => {
    if (photoStripRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      photoStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mobile Timeless Pairings Carousel States & Handlers
  const pairingsScrollRef = useRef<HTMLDivElement>(null);
  const [activePairingIdx, setActivePairingIdx] = useState<number>(0);

  const handlePairingsScroll = () => {
    if (!pairingsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = pairingsScrollRef.current;
    
    // Near end of carousel
    if (scrollLeft + clientWidth >= scrollWidth - 25) {
      setActivePairingIdx((prev) => (prev !== 4 ? 4 : prev));
      return;
    }

    const containerLeft = pairingsScrollRef.current.getBoundingClientRect().left;
    const cards = pairingsScrollRef.current.children;
    let closestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const cardRect = cards[i].getBoundingClientRect();
      const distance = Math.abs(cardRect.left - containerLeft - 24);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    }
    setActivePairingIdx((prev) => (prev !== closestIdx ? closestIdx : prev));
  };

  const scrollToPairing = (index: number) => {
    if (!pairingsScrollRef.current) return;
    const cards = pairingsScrollRef.current.children;
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      pairingsScrollRef.current.scrollTo({
        left: card.offsetLeft - 24,
        behavior: 'smooth',
      });
      setActivePairingIdx(index);
    }
  };

  const scrollPairingsByDir = (direction: 'left' | 'right') => {
    const nextIdx = direction === 'left'
      ? Math.max(0, activePairingIdx - 1)
      : Math.min(4, activePairingIdx + 1);
    scrollToPairing(nextIdx);
  };

  // Fetch product data on mount/id change
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/products/${id}`);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.data) {
            const prod: IProduct = data.data;
            setProduct(prod);
            setSelectedImage(prod.thumbnail?.url || '');
            if (prod.colorVariants && prod.colorVariants.length > 0) {
              setSelectedVariant(prod.colorVariants[0]);
              if (prod.colorVariants[0].image?.url) {
                setSelectedImage(prod.colorVariants[0].image.url);
              }
            }
            return;
          }
        }

        // Fallback: fetch available products if specific ID lookup was not found
        const fallbackRes = await fetch('/api/products');
        if (fallbackRes.ok && fallbackRes.headers.get('content-type')?.includes('application/json')) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
            const prod: IProduct = fallbackData.data[0];
            setProduct(prod);
            setSelectedImage(prod.thumbnail?.url || '');
            if (prod.colorVariants && prod.colorVariants.length > 0) {
              setSelectedVariant(prod.colorVariants[0]);
              if (prod.colorVariants[0].image?.url) {
                setSelectedImage(prod.colorVariants[0].image.url);
              }
            }
            return;
          }
        }

        setError('Timepiece details currently unavailable.');
      } catch (err: unknown) {
        console.error('Error loading product details:', err);
        setError('Timepiece details currently unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const res = await fetch(`/api/reviews?productId=${id}`);
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          setReviews([]);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setReviews(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [id]);

  // Create list of all gallery images for thumbnails
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imagesList: string[] = [];

    // Add primary thumbnail
    if (product.thumbnail?.url) {
      imagesList.push(product.thumbnail.url);
    }

    // Add variant images
    product.colorVariants?.forEach(v => {
      if (v.image?.url && !imagesList.includes(v.image.url)) {
        imagesList.push(v.image.url);
      }
    });

    // Add additional gallery images
    product.images?.forEach(img => {
      if (img.url && !imagesList.includes(img.url)) {
        imagesList.push(img.url);
      }
    });

    return imagesList;
  }, [product]);

  const hasUploadedVideo = Boolean(product?.video?.url?.trim());
  const storyImages = useMemo(() => {
    if (galleryImages.length > 0) return galleryImages;
    return ['/collections_pg.webp'];
  }, [galleryImages]);

  useEffect(() => {
    setStoryVideoPlaying(false);
    setStorySlideshowPaused(false);
    setStorySlideState({ active: 0, prev: null });
  }, [id]);

  useEffect(() => {
    if (!product || hasUploadedVideo || storySlideshowPaused || storyImages.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setStorySlideState((s) => ({
        prev: s.active,
        active: (s.active + 1) % storyImages.length,
      }));
    }, 4500);
    return () => clearInterval(timer);
  }, [product, hasUploadedVideo, storySlideshowPaused, storyImages.length]);

  const goToStorySlide = (targetIdx: number) => {
    setStorySlideState((s) => (s.active === targetIdx ? s : { prev: s.active, active: targetIdx }));
  };

  const reviewsStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { count: 0, average: 0 };
    }
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return {
      count: reviews.length,
      average: parseFloat((sum / reviews.length).toFixed(1)),
    };
  }, [reviews]);

  const starDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviews || reviews.length === 0) return dist;
    reviews.forEach(r => {
      const ratingKey = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (dist[ratingKey] !== undefined) {
        dist[ratingKey]++;
      }
    });
    return dist;
  }, [reviews]);

  const maskReviewerName = (name: string) => {
    if (!name) return 'Customer';
    const trimmed = name.trim();
    if (trimmed.length <= 2) {
      return trimmed[0] + '*';
    }
    return trimmed[0] + '*'.repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
  };

  // Handle color variant selection
  const handleVariantSelect = (variant: ColorVariant) => {
    setSelectedVariant(variant);
    if (variant.image?.url) {
      setSelectedImage(variant.image.url);
    }
  };

  // Helper to determine product gender
  const getProductGender = (prod: IProduct): 'Gents' | 'Ladies' | 'Unisex' => {
    const specs = prod.specifications || {};
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

    const titleLower = prod.title.toLowerCase();
    const descLower = prod.description.toLowerCase();
    if (
      titleLower.includes('ladies') ||
      titleLower.includes('women') ||
      titleLower.includes('diamond') ||
      descLower.includes('ladies') ||
      descLower.includes('women')
    ) {
      return 'Ladies';
    }

    return 'Gents';
  };

  // Fetch suggestions
  useEffect(() => {
    if (!product) return;
    const currentProduct = product;
    async function loadSuggestions() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.data) {
          const allProd: IProduct[] = data.data;
          const filtered = allProd.filter(p => p._id !== currentProduct._id);

          const currentGender = getProductGender(currentProduct);
          const matchingGender = filtered.filter(p => getProductGender(p) === currentGender);
          const otherGender = filtered.filter(p => getProductGender(p) !== currentGender);

          const combined = [...matchingGender, ...otherGender].slice(0, 4);
          setSuggestions(combined);

          const ids = combined.map(p => p._id).filter(Boolean).join(',');
          if (ids) {
            try {
              const rRes = await fetch(`/api/reviews/ratings?ids=${ids}`);
              if (rRes.ok) {
                const rData = await rRes.json();
                if (rData.success && rData.data) {
                  setSuggestionRatings(rData.data);
                }
              }
            } catch {
              // non-blocking ratings fetch
            }
          }
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    }
    loadSuggestions();
  }, [product]);

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    const colorVariantName = selectedVariant?.colorName || '';
    addToCart(product._id!, 1, colorVariantName, product);
  };

  // Buy Now — auth-aware
  const handleBuyNow = async () => {
    if (!product) return;

    if (!isSignedIn) {
      // Guest flow — open guest checkout modal
      setShowGuestModal(true);
      return;
    }

    // Signed-in flow — fetch profile then open direct purchase modal
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress || '';
      const params = new URLSearchParams();
      if (user?.id) params.set('clerkId', user.id);
      if (userEmail) params.set('email', userEmail);
      const res = await fetch(`/api/customer/profile?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBuyerProfile(data.data);
      }
    } catch {
      // keep preloaded profile if present
    }
    setShowBuyNowModal(true);
  };

  if (loading) {
    return (
      <>
        <h1 className="sr-only">Timepiece Details</h1>
        <WinsorLoader fullScreen size="lg" label="Loading Timepiece…" />
      </>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '80vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#141414', marginBottom: '12px' }}>Timepiece Not Found</h2>
          <p style={{ color: 'rgba(20,20,20,0.6)', marginBottom: '24px' }}>{error || 'The requested timepiece could not be found.'}</p>
          <Link href="/collections" style={{ background: '#141414', color: '#fff', textDecoration: 'none', padding: '12px 28px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = !!(product.isSoldOut || (selectedVariant && selectedVariant.qty === 0));
  const specs = Object.entries(product.specifications || {});
  const whatsappMessage = [
    `Hello Winsor, I would like to inquire about "${product.title}"`,
    product.modelNo ? `(Model: ${product.modelNo})` : '',
    selectedVariant?.colorName ? `- Color: ${selectedVariant.colorName}` : '',
  ].filter(Boolean).join(' ') + '.';
  const whatsappContactUrl = `https://wa.me/94770716212?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600;700&display=swap');

        .pdp-page {
          background-color: #FFFFFF;
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
          color: #141414;
          overflow-x: hidden;
        }

        /* ── 1. LUMINOUS SILK PRODUCT HERO BAND ── */
        .pdp-hero-band {
          position: relative;
          width: 100%;
          padding: 122px 40px 56px;
          background-color: #FFFFFF;
          overflow: hidden;
        }
        .pdp-hero-silk-bg {
          position: absolute;
          inset: 0;
          background-image: url('/hero_silk_pearl.jpg');
          background-size: cover;
          background-position: right center;
          opacity: 0.72;
          pointer-events: none;
          z-index: 0;
        }
        .pdp-hero-silk-scrim {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.75) 84%, #FFFFFF 100%),
            linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.34) 48%, rgba(255,255,255,0.45) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .pdp-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1300px;
          margin: 0 auto;
        }
        .pdp-breadcrumb {
          margin-bottom: 24px;
          font-size: 12px;
          color: rgba(20, 20, 20, 0.56);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          letter-spacing: 0.02em;
        }
        .pdp-breadcrumb a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .pdp-breadcrumb a:hover {
          color: #8B6914;
        }
        .detail-wrapper {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          gap: 56px;
          align-items: flex-start;
        }

        /* GALLERY */
        .gallery-container {
          width: 54%;
          display: flex;
          gap: 18px;
          position: sticky;
          top: 108px;
        }
        .thumbnails-column {
          width: 76px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
          max-height: 556px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .thumbnails-column::-webkit-scrollbar {
          display: none;
        }
        .thumbnail-item {
          aspect-ratio: 1;
          border-radius: 10px;
          border: 1px solid rgba(20, 20, 20, 0.1);
          background: #FFFFFF;
          padding: 4px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
          box-shadow: 0 2px 10px rgba(20, 16, 10, 0.04);
        }
        .thumbnail-item.active {
          border-color: #8B6914;
          box-shadow: 0 0 0 1.5px #8B6914, 0 6px 16px rgba(139, 105, 20, 0.14);
        }
        .thumbnail-item:hover:not(.active) {
          border-color: rgba(139, 105, 20, 0.55);
          transform: translateY(-1px);
        }
        .main-image-view {
          flex-grow: 1;
          aspect-ratio: 1;
          max-height: 556px;
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(20, 20, 20, 0.07);
          background: #FFFFFF;
          box-shadow: 0 22px 54px rgba(20, 16, 10, 0.06);
          overflow: hidden;
          isolation: isolate;
        }
        .main-watch-img {
          padding: 18px;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
          transform-origin: center center !important;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        @media (min-width: 1025px) {
          .main-image-view:hover .main-watch-img {
            transform: scale(1.06) !important;
          }
        }
        @media (max-width: 1024px) {
          .gallery-container {
            position: relative;
            top: 0;
          }
          .main-watch-img {
            transform: none !important;
            transition: none !important;
          }
        }

        /* INFO PANEL */
        .info-container {
          width: 46%;
          display: flex;
          flex-direction: column;
        }
        .pdp-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .pdp-gold-pill {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.2);
        }
        .pdp-gold-pill.sold-out {
          background: rgba(20, 20, 20, 0.72);
          box-shadow: none;
        }
        .pdp-ref-chip {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(20, 20, 20, 0.5);
        }
        .pdp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 3.4vw, 44px);
          font-weight: 500;
          line-height: 1.08;
          color: #141414;
          margin: 0 0 6px 0;
          letter-spacing: 0.01em;
          overflow-wrap: anywhere;
        }
        .pdp-tagline {
          font-size: 14px;
          color: rgba(20, 20, 20, 0.62);
          margin: 0 0 12px 0;
          font-weight: 400;
          letter-spacing: 0.01em;
        }
        .pdp-price {
          font-family: 'Jost', sans-serif;
          font-size: clamp(24px, 2.3vw, 30px);
          font-weight: 600;
          color: #141414;
          letter-spacing: 0.01em;
          line-height: 1.15;
        }
        .pdp-tax-note {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.5);
          margin-top: 3px;
        }
        .pdp-cta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .pdp-btn-cart {
          height: 48px;
          padding: 0 20px;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(139, 105, 20, 0.24);
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }
        .pdp-btn-cart:hover:not(:disabled) {
          background: linear-gradient(135deg, #7A5C10 0%, #684E0D 100%);
          transform: translateY(-1.5px);
          box-shadow: 0 10px 26px rgba(139, 105, 20, 0.32);
        }
        .pdp-btn-cart:disabled {
          background: rgba(20, 20, 20, 0.18);
          color: rgba(20, 20, 20, 0.45);
          box-shadow: none;
          cursor: not-allowed;
        }
        .pdp-btn-buy {
          height: 48px;
          padding: 0 20px;
          background: #FFFFFF;
          color: #8B6914;
          border: 1.5px solid #8B6914;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.22s ease, background 0.22s ease, color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .pdp-btn-buy:hover:not(:disabled) {
          background: #141414;
          border-color: #141414;
          color: #FFFFFF;
          transform: translateY(-1.5px);
          box-shadow: 0 8px 22px rgba(20, 20, 20, 0.16);
        }
        .pdp-btn-buy:disabled {
          border-color: rgba(20, 20, 20, 0.15);
          color: rgba(20, 20, 20, 0.35);
          cursor: not-allowed;
        }
        .pdp-btn-whatsapp {
          width: 100%;
          height: 42px;
          padding: 0 18px;
          background: rgba(255, 255, 255, 0.92);
          color: #141414;
          border: 1px solid rgba(20, 20, 20, 0.14);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.22s ease;
          margin-bottom: 18px;
        }
        .pdp-btn-whatsapp:hover {
          border-color: #8B6914;
          color: #8B6914;
          background: #FFFFFF;
        }
        .pdp-inline-trust {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 10px;
          padding: 11px 10px;
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(20, 20, 20, 0.82);
        }
        .pdp-inline-trust-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          padding: 0 6px;
        }
        .pdp-inline-trust-cell:nth-child(2) {
          border-left: 1px solid rgba(20, 20, 20, 0.08);
          border-right: 1px solid rgba(20, 20, 20, 0.08);
        }
        .pdp-accordion-wrap {
          border-top: 1px solid rgba(20, 20, 20, 0.08);
          margin-top: 16px;
        }
        .pdp-accordion-item {
          border-bottom: 1px solid rgba(20, 20, 20, 0.08);
        }
        .pdp-accordion-btn {
          width: 100%;
          padding: 13px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #141414;
          cursor: pointer;
          text-align: left;
        }
        .pdp-accordion-btn:hover {
          color: #8B6914;
        }

        /* ── 2. 4-PILLAR CRAFTSMANSHIP BAR ── */
        .pdp-craft-bar {
          background: #FFFFFF;
          border-top: 1px solid rgba(20, 20, 20, 0.07);
          border-bottom: 1px solid rgba(20, 20, 20, 0.07);
          padding: 28px 40px;
        }
        .pdp-craft-grid {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .pdp-craft-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 6px 20px;
          border-right: 1px solid rgba(20, 20, 20, 0.07);
          gap: 8px;
        }
        .pdp-craft-cell:last-child {
          border-right: none;
        }
        .pdp-craft-cell h4 {
          margin: 0;
          font-size: 12.5px;
          font-weight: 600;
          color: #141414;
          letter-spacing: 0.02em;
        }
        .pdp-craft-cell span {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.52);
        }

        /* ── 3. DARK STORYTELLING CINEMA BAND ── */
        .pdp-story-band {
          position: relative;
          background: #0A0806;
          color: #FFFFFF;
          padding: 88px 40px;
          overflow: hidden;
          border-top: 1px solid rgba(212, 175, 99, 0.22);
          border-bottom: 1px solid rgba(212, 175, 99, 0.22);
        }
        .pdp-story-backdrop {
          position: absolute;
          inset: 0;
          background-image: url('/pdp_story_luxury_bg.jpg');
          background-size: cover;
          background-position: right center;
          opacity: 0.92;
          pointer-events: none;
        }
        .pdp-story-scrim {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(95deg, rgba(9, 7, 5, 0.9) 0%, rgba(11, 9, 6, 0.56) 44%, rgba(10, 8, 6, 0.16) 76%, rgba(10, 8, 6, 0.42) 100%),
            linear-gradient(180deg, rgba(9, 7, 5, 0.45) 0%, rgba(9, 7, 5, 0) 24%, rgba(9, 7, 5, 0) 76%, rgba(9, 7, 5, 0.52) 100%);
          pointer-events: none;
        }
        .pdp-story-inner {
          position: relative;
          z-index: 2;
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 56px;
          align-items: center;
        }
        .pdp-story-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #D4AF63;
          margin-bottom: 14px;
        }
        .pdp-story-eyebrow::before {
          content: '';
          width: 24px;
          height: 1px;
          background: #D4AF63;
        }
        .pdp-story-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 400;
          line-height: 1.06;
          color: #FFFFFF;
          margin: 0 0 18px 0;
          letter-spacing: 0.01em;
        }
        .pdp-story-desc {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.72);
          max-width: 470px;
          margin: 0 0 24px 0;
        }
        .pdp-story-specs-mini {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 20px;
          margin-bottom: 28px;
          padding: 16px 0;
          border-top: 1px solid rgba(212, 175, 99, 0.18);
          border-bottom: 1px solid rgba(212, 175, 99, 0.18);
        }
        .pdp-story-spec-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pdp-story-spec-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 99, 0.35);
          background: rgba(212, 175, 99, 0.08);
          color: #D4AF63;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pdp-story-cta-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .pdp-story-btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 24px;
          border-radius: 999px;
          border: 1.5px solid #D4AF63;
          background: rgba(212, 175, 99, 0.12);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
        }
        .pdp-story-btn-gold:hover {
          background: #D4AF63;
          color: #141414;
        }
        .pdp-story-btn-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          padding: 8px 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.25);
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .pdp-story-btn-link:hover {
          color: #D4AF63;
          border-color: #D4AF63;
        }
        .pdp-story-frame {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16 / 9;
          background: #120F0B;
          border: 1px solid rgba(212, 175, 99, 0.44);
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.72), 0 0 48px rgba(212, 175, 99, 0.12);
        }
        .pdp-story-play-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.94);
          color: #141414;
          border: 4px solid rgba(212, 175, 99, 0.38);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
          transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }
        .pdp-story-frame-trigger:hover .pdp-story-play-circle {
          transform: scale(1.08);
          background: #D4AF63;
          border-color: rgba(255, 255, 255, 0.55);
          color: #FFFFFF;
        }

        /* ── KEN BURNS HOROLOGY SLIDESHOW (WHEN NO VIDEO UPLOADED) ── */
        @keyframes pdpKenBurnsA {
          0% { transform: scale(1.02) translate3d(0%, 0%, 0); }
          100% { transform: scale(1.18) translate3d(-1.2%, -0.8%, 0); }
        }
        @keyframes pdpKenBurnsB {
          0% { transform: scale(1.03) translate3d(-0.6%, 0.4%, 0); }
          100% { transform: scale(1.19) translate3d(1%, -0.8%, 0); }
        }
        @keyframes pdpKenBurnsSingle {
          0% { transform: scale(1.02) translate3d(0%, 0%, 0); }
          50% { transform: scale(1.16) translate3d(-0.7%, -0.6%, 0); }
          100% { transform: scale(1.02) translate3d(0%, 0%, 0); }
        }
        @keyframes pdpSlideProgress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes pdpPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.8); }
        }
        .pdp-kb-stage {
          position: relative;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at 50% 46%, #FFFFFF 68%, #FAF8F4 100%);
          overflow: hidden;
        }
        .pdp-slide-media {
          position: absolute;
          inset: 0;
          opacity: 0;
          z-index: 0;
          transition: opacity 1.15s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          overflow: hidden;
        }
        .pdp-slide-media.is-prev {
          opacity: 1;
          z-index: 1;
        }
        .pdp-slide-media.is-active {
          opacity: 1;
          z-index: 2;
          pointer-events: auto;
        }
        .pdp-slide-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 44%, rgba(255, 255, 255, 0) 62%, rgba(139, 105, 20, 0.06) 100%);
          box-shadow: inset 0 0 0 1px rgba(212, 175, 99, 0.25);
          pointer-events: none;
          z-index: 3;
        }
        .pdp-slide-zoom-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform;
        }
        .pdp-slide-zoom-wrap.is-animating.is-pan-a {
          animation: pdpKenBurnsA 6.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        .pdp-slide-zoom-wrap.is-animating.is-pan-b {
          animation: pdpKenBurnsB 6.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        .pdp-slide-zoom-wrap.is-single {
          animation: pdpKenBurnsSingle 14s ease-in-out infinite;
        }
        .pdp-slide-zoom-wrap.is-paused {
          animation-play-state: paused !important;
        }
        .pdp-slide-watch-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 16px 24px 44px;
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 85%, transparent 100%);
          mask-image: radial-gradient(ellipse at 50% 50%, #000 85%, transparent 100%);
          user-select: none;
        }
        .pdp-kb-hud {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 6;
          padding: 20px 16px 12px;
          background: linear-gradient(to top, rgba(10, 8, 6, 0.72) 0%, rgba(10, 8, 6, 0.25) 68%, transparent 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .pdp-kb-caption-col {
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 150px;
        }
        .pdp-kb-progress-track {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.26);
          border-radius: 99px;
          overflow: hidden;
        }
        .pdp-kb-progress-fill {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #8B6914, #D4AF63);
          transform-origin: left center;
          animation: pdpSlideProgress 4.5s linear forwards;
        }
        .pdp-kb-progress-fill.is-paused {
          animation-play-state: paused !important;
        }
        .pdp-kb-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pdp-kb-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .pdp-kb-dot {
          width: 6px;
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.28s ease;
        }
        .pdp-kb-dot:hover {
          background: rgba(255, 255, 255, 0.78);
        }
        .pdp-kb-dot.active {
          width: 20px;
          background: #D4AF63;
        }
        .pdp-kb-toggle-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 99, 0.45);
          background: rgba(18, 14, 10, 0.75);
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .pdp-kb-toggle-btn:hover {
          background: #D4AF63;
          border-color: #D4AF63;
          color: #141414;
        }

        /* ── SHARED EDITORIAL SECTION HEADER ── */
        .pdp-sec-header {
          text-align: center;
          margin-bottom: 38px;
        }
        .pdp-sec-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #8B6914;
          margin-bottom: 8px;
        }
        .pdp-sec-eyebrow span.rule {
          width: 22px;
          height: 1px;
          background: rgba(139, 105, 20, 0.45);
        }
        .pdp-sec-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 500;
          color: #141414;
          margin: 0 0 6px 0;
          letter-spacing: 0.02em;
        }
        .pdp-sec-sub {
          font-size: 13.5px;
          color: rgba(20, 20, 20, 0.55);
          margin: 0;
        }

        /* ── 4. 5-COLUMN EXPLORE COLLECTIONS ── */
        .pdp-collections-band {
          background: #FFFFFF;
          padding: 76px 40px 80px;
        }
        .pdp-collections-inner {
          max-width: 1300px;
          margin: 0 auto;
        }
        .pairings-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 18px;
          position: relative;
        }
        .pairing-card {
          position: relative;
          display: block;
          aspect-ratio: 4 / 4.8;
          border-radius: 12px;
          overflow: hidden;
          background: #141210;
          border: 1px solid rgba(20, 20, 20, 0.08);
          text-decoration: none;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .pairing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(20, 16, 10, 0.14);
          border-color: rgba(139, 105, 20, 0.5);
        }
        .pairing-img {
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pairing-card:hover .pairing-img {
          transform: scale(1.06);
        }
        .pairing-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10, 9, 8, 0.9) 0%, rgba(10, 9, 8, 0.36) 48%, rgba(10, 9, 8, 0.05) 100%);
          z-index: 1;
        }
        .pairing-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          padding: 18px 16px;
          text-align: center;
          color: #FFFFFF;
        }
        .pairing-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          color: #FFFFFF;
          margin: 0 0 4px 0;
          letter-spacing: 0.02em;
        }
        .pairing-card-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          transition: color 0.25s ease, gap 0.25s ease;
        }
        .pairing-card:hover .pairing-card-link {
          color: #D4AF63;
          gap: 7px;
        }
        .pairings-mobile-controls {
          display: none;
        }
        .pairings-nav-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(20, 20, 20, 0.12);
          background: #FFFFFF;
          color: #141414;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .pairings-nav-arrow:active:not(:disabled) {
          background: #8B6914;
          color: #ffffff;
          border-color: #8B6914;
        }
        .pairings-nav-arrow:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .pairings-dots-container {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .pairings-dot {
          height: 6px;
          width: 6px;
          border-radius: 50%;
          background: rgba(20, 20, 20, 0.2);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .pairings-dot.active {
          width: 22px;
          border-radius: 10px;
          background: #8B6914;
        }

        /* ── 5. CURATED SUGGESTED TIMEPIECES ── */
        .suggestions-section {
          background: #FFFFFF;
          padding: 76px 40px 80px;
        }
        .suggestions-inner {
          max-width: 1300px;
          margin: 0 auto;
        }
        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }
        .suggested-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          height: 100%;
        }
        .suggested-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #9C7A3C 0%, #D4AF63 50%, #8B6914 100%);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.35s ease;
          z-index: 5;
        }
        .suggested-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139, 105, 20, 0.28);
          box-shadow: 0 18px 38px rgba(20, 16, 10, 0.08);
        }
        .suggested-card:hover::before {
          transform: scaleX(1);
        }
        .suggested-img-container {
          position: relative;
          aspect-ratio: 1;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(20, 20, 20, 0.05);
          padding: 18px;
          display: block;
          overflow: hidden;
        }
        .suggested-img {
          padding: 16px;
          transition: transform 0.5s ease;
        }
        .suggested-card:hover .suggested-img {
          transform: scale(1.05);
        }
        .suggested-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .suggested-badge.sold-out {
          background: rgba(20, 20, 20, 0.72);
        }
        .suggested-bag-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.12);
          color: #141414;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
        }
        .suggested-bag-btn:hover {
          background: #8B6914;
          border-color: #8B6914;
          color: #FFFFFF;
          transform: scale(1.06);
        }
        .suggested-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          justify-content: space-between;
          gap: 10px;
        }
        .suggested-title {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #141414;
          margin: 0 0 4px 0;
          line-height: 1.35;
          min-height: 2.7em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          overflow-wrap: anywhere;
        }
        .pdp-view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 32px;
          background: #141414;
          color: #FFFFFF;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 8px 20px rgba(20, 20, 20, 0.15);
        }
        .pdp-view-all-btn:hover {
          background: #8B6914;
          transform: translateY(-1.5px);
          box-shadow: 0 10px 24px rgba(139, 105, 20, 0.26);
        }

        /* ── 7. REVIEWS & TESTIMONIALS + BOTTOM TRUST BAR ── */
        .reviews-band {
          background: #FAF9F6;
          border-top: 1px solid rgba(20, 20, 20, 0.06);
          border-bottom: 1px solid rgba(20, 20, 20, 0.06);
          padding: 76px 40px 80px;
        }
        .reviews-band-inner {
          max-width: 1300px;
          margin: 0 auto;
        }
        .reviews-layout-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 40px;
          align-items: flex-start;
        }
        .rev-summary-sidebar {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 14px;
          padding: 26px;
          position: sticky;
          top: 100px;
          box-shadow: 0 8px 26px rgba(20, 16, 10, 0.03);
        }
        .rev-card-editorial {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          gap: 16px;
          margin-bottom: 14px;
          box-shadow: 0 4px 18px rgba(20, 16, 10, 0.025);
        }
        .rev-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .rev-filter-btn {
          padding: 7px 14px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 600;
          font-family: 'Jost', sans-serif;
          letter-spacing: 0.04em;
          cursor: pointer;
          border: 1px solid rgba(20, 20, 20, 0.14);
          background: #FFFFFF;
          color: rgba(20, 20, 20, 0.72);
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rev-filter-btn:hover {
          border-color: #8B6914;
          color: #8B6914;
        }
        .rev-filter-btn.active {
          border-color: #8B6914;
          background: #8B6914;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.24);
        }
        .see-more-rev-btn {
          padding: 13px 32px;
          background: #8B6914;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 6px 18px rgba(139, 105, 20, 0.25);
          transition: all 0.25s ease;
        }
        .see-more-rev-btn:hover {
          background: #70540e;
          transform: translateY(-1.5px);
        }
        .show-photos-btn {
          margin-top: 10px;
          width: 100%;
          border: 1.5px solid #8B6914;
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .show-photos-btn:not(.active) {
          background: transparent;
          color: #8B6914;
        }
        .show-photos-btn:not(.active):hover,
        .show-photos-btn.active {
          background: #8B6914;
          color: #FFFFFF;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 1100px) and (min-width: 769px) {
          .pairings-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          .pdp-story-inner {
            gap: 36px;
          }
        }
        @media (max-width: 1024px) {
          .pdp-hero-band {
            padding: 100px 24px 42px;
          }
          .detail-wrapper {
            flex-direction: column;
            gap: 30px;
          }
          .gallery-container,
          .info-container {
            width: 100%;
          }
          .pdp-craft-bar {
            padding: 24px 20px;
          }
          .pdp-craft-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .pdp-craft-cell {
            border-right: none;
            padding: 10px 12px;
          }
          .pdp-story-band {
            padding: 56px 24px;
          }
          .pdp-story-inner {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .pdp-collections-band,
          .suggestions-section,
          .reviews-band {
            padding: 56px 24px;
          }
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .reviews-layout-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .rev-summary-sidebar {
            position: relative;
            top: 0;
            padding: 22px;
          }
        }

        @media (max-width: 768px) {
          .pairings-grid {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            gap: 12px !important;
            padding: 4px 24px 14px 24px !important;
            margin-left: -24px !important;
            margin-right: -24px !important;
          }
          .pairings-grid::-webkit-scrollbar {
            display: none !important;
          }
          .pairing-card {
            flex: 0 0 230px !important;
            width: 230px !important;
            scroll-snap-align: start !important;
          }
          .pairing-card-title {
            font-size: 18px;
          }
          .pairings-mobile-controls {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-top: 8px;
          }
          .rev-filter-row {
            flex-wrap: wrap;
            gap: 8px;
          }
        }

        @media (max-width: 640px) {
          .pdp-hero-band {
            padding: 82px 16px 32px;
          }
          .pdp-breadcrumb {
            margin-bottom: 12px;
            font-size: 11px;
          }
          .gallery-container {
            flex-direction: column-reverse;
            gap: 10px;
          }
          .main-image-view {
            border-radius: 14px;
            padding: 16px;
          }
          .thumbnails-column {
            width: 100%;
            flex-direction: row;
            max-height: none;
            overflow-x: auto;
            gap: 8px;
            padding-bottom: 2px;
            scrollbar-width: none;
          }
          .thumbnails-column::-webkit-scrollbar {
            display: none;
          }
          .thumbnail-item {
            width: 60px;
            border-radius: 10px;
            flex-shrink: 0;
          }
          .pdp-title {
            font-size: 32px;
          }
          .pdp-price-main {
            font-size: 25px;
          }
          .pdp-cta-row {
            gap: 10px;
          }
          .pdp-btn-cart,
          .pdp-btn-buy {
            height: 46px;
            font-size: 11px;
            letter-spacing: 0.1em;
            padding: 0 12px;
          }
          .pdp-inline-trust {
            font-size: 10px;
            padding: 10px 4px;
          }
          .pdp-inline-trust-cell {
            flex-direction: column;
            gap: 4px;
            padding: 4px;
            line-height: 1.25;
          }
          .pdp-craft-bar {
            background: #FAF9F6;
            padding: 20px 16px;
          }
          .pdp-craft-grid {
            gap: 10px;
          }
          .pdp-craft-cell {
            background: #FFFFFF;
            border: 1px solid rgba(20, 20, 20, 0.06);
            border-radius: 12px;
            padding: 14px 10px;
            gap: 6px;
          }
          .pdp-craft-cell h4 {
            font-size: 11.5px;
          }
          .pdp-craft-cell span {
            font-size: 10px;
            line-height: 1.3;
          }
          .pdp-story-band {
            padding: 48px 16px;
          }
          .pdp-story-title {
            font-size: 32px;
            margin-bottom: 12px;
          }
          .pdp-story-desc {
            font-size: 13.5px;
            margin-bottom: 18px;
          }
          .pdp-story-specs-mini {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 10px;
            margin-bottom: 22px;
            padding: 14px 0;
          }
          .pdp-story-cta-row {
            gap: 12px 18px;
          }
          .pdp-story-btn-gold {
            width: 100%;
            justify-content: center;
          }
          .pdp-story-frame {
            aspect-ratio: 4 / 3;
            border-radius: 14px;
          }
          .pdp-slide-watch-img {
            padding: 14px 18px 42px;
          }
          .pdp-kb-hud {
            padding: 14px 12px 10px;
          }
          .pdp-kb-caption-col {
            max-width: 110px;
          }
          .pdp-collections-band,
          .suggestions-section,
          .reviews-band {
            padding: 44px 16px;
          }
          .pdp-sec-header {
            margin-bottom: 26px;
          }
          .pairings-grid {
            padding: 4px 16px 14px 16px !important;
            margin-left: -16px !important;
            margin-right: -16px !important;
          }
          .pairing-card {
            flex: 0 0 68% !important;
            width: 68% !important;
            max-width: 245px !important;
          }
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .suggested-img-container {
            padding: 10px;
          }
          .suggested-body {
            padding: 10px 11px 12px;
            gap: 6px;
          }
          .suggested-title {
            font-size: 12.5px;
          }
          .suggested-badge {
            top: 8px;
            left: 8px;
            font-size: 8px;
            padding: 3px 7px;
          }
          .suggested-bag-btn {
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
          }
          .rev-summary-sidebar {
            padding: 18px;
            border-radius: 12px;
          }
          .rev-filter-row {
            gap: 7px;
            margin-bottom: 16px;
          }
          .rev-filter-pill {
            padding: 6px 11px;
            font-size: 11px;
          }
          .rev-card-editorial {
            padding: 16px;
            border-radius: 12px;
          }
        }
      `}</style>

      <div className="pdp-page">
        {/* ── BAND 1: LUMINOUS SILK PRODUCT HERO SHOWCASE ── */}
        <section className="pdp-hero-band">
          <div className="pdp-hero-silk-bg" aria-hidden="true" />
          <div className="pdp-hero-silk-scrim" aria-hidden="true" />

          <div className="pdp-hero-inner">
            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="pdp-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={getProductGender(product) === 'Ladies' ? '/womens' : '/mens'}>
                {getProductGender(product) === 'Ladies' ? "Women's" : "Men's"}
              </Link>
              <span>/</span>
              <Link href="/collections">Collections</Link>
              <span>/</span>
              <span className="text-[#141414] font-medium capitalize">{product.title}</span>
            </nav>

            <div className="detail-wrapper">
              {/* LEFT: GALLERY */}
              <div className="gallery-container">
                <div className="thumbnails-column">
                  {galleryImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      className={`thumbnail-item ${activeMediaType === 'image' && selectedImage === imgUrl ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedImage(imgUrl);
                        setActiveMediaType('image');
                      }}
                    >
                      <Image
                        src={imgUrl}
                        alt={`${product.title} view ${i + 1}`}
                        fill
                        sizes="76px"
                        style={{ objectFit: 'contain', padding: '4px' }}
                      />
                    </div>
                  ))}

                  {/* Video Thumbnail Button */}
                  {product.video?.url && (
                    <div
                      className={`thumbnail-item relative flex items-center justify-center bg-[#141414] overflow-hidden ${activeMediaType === 'video' ? 'active' : ''}`}
                      onClick={() => setActiveMediaType('video')}
                      title="Watch Product Video"
                    >
                      <video
                        src={`${product.video.url}#t=0.1`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-80 pointer-events-none"
                      />
                      <div className="w-8 h-8 rounded-full bg-[#8B6914] text-white flex items-center justify-center shadow-md absolute z-10 hover:scale-105 transition-transform">
                        <span className="text-white text-[10px] pl-0.5 font-bold">▶</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`main-image-view ${activeMediaType === 'video' ? '!overflow-visible' : ''}`}>
                  {activeMediaType === 'video' && product.video?.url ? (
                    <AmbientVideoPlayer
                      src={product.video.url}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      aspectRatio="aspect-square"
                      roundedClassName="rounded-2xl"
                      borderClassName="border border-[#c5a059]/40"
                      className="w-full h-full"
                      containerClassName="w-full h-full"
                      showAmbientToggle={true}
                      defaultAmbientOn={false}
                      title={`${product.title} Product Video`}
                    />
                  ) : (
                    selectedImage && (
                      <Image
                        src={selectedImage}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 54vw"
                        style={{ objectFit: 'contain' }}
                        className="main-watch-img"
                        priority
                      />
                    )
                  )}
                </div>
              </div>

              {/* RIGHT: DETAILS PANEL */}
              <div className="info-container">
                {/* Badge + Ref */}
                <div className="pdp-badge-row">
                  <span className={`pdp-gold-pill ${isSoldOut ? 'sold-out' : ''}`}>
                    {isSoldOut ? 'SOLD OUT' : product.stickerEnabled && product.stickerText ? product.stickerText : 'NEW ARRIVAL'}
                  </span>
                  {product.modelNo && (
                    <span className="pdp-ref-chip">Ref. {product.modelNo}</span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <h1 className="pdp-title capitalize lining-nums">{product.title}</h1>
                <p className="pdp-tagline">
                  Elegance in Every Second · {getProductGender(product) === 'Ladies' ? "Women's Collection" : "Men's Classic Collection"}
                </p>

                {/* Reviews Rating Row — shown cleanly when verified customer reviews exist */}
                {reviewsStats.count > 0 && (
                  <div
                    className="flex items-center gap-2 mb-4 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const el = document.querySelector('#customer-reviews-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < Math.round(reviewsStats.average) ? '#8B6914' : 'none'} stroke="#8B6914" strokeWidth="1.6">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold text-[#141414]">{reviewsStats.average}</span>
                    <span className="text-[#141414]/55">
                      ({reviewsStats.count} {reviewsStats.count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-5">
                  <div className="pdp-price lining-nums">{convertPrice(product.price)}</div>
                  <div className="pdp-tax-note">Inclusive of all taxes · Nationwide Fixed MRP</div>
                </div>

                {/* Color Variant Swatches */}
                {product.colorVariants && product.colorVariants.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#141414]/65 mb-2.5">
                      Color: <span className="text-[#8B6914]">{selectedVariant?.colorName || 'Standard'}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {product.colorVariants.map((variant) => {
                        const isSelected = selectedVariant?.colorName === variant.colorName;
                        return (
                          <button
                            key={variant.colorName}
                            type="button"
                            onClick={() => {
                              handleVariantSelect(variant);
                              setActiveMediaType('image');
                            }}
                            title={variant.colorName}
                            className={`w-9 h-9 rounded-full p-0.5 border-2 transition-all duration-200 cursor-pointer overflow-hidden bg-white ${
                              isSelected
                                ? 'border-[#8B6914] ring-2 ring-[#8B6914]/25 scale-105'
                                : 'border-[#141414]/15 hover:border-[#8B6914]/60'
                            }`}
                          >
                            {variant.image?.url ? (
                              <img src={variant.image.url} alt={variant.colorName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#d4af37] to-[#8b6914] text-[9px] font-bold text-white flex items-center justify-center">
                                {variant.colorName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-5 text-xs font-medium">
                  <span className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-red-600' : 'bg-emerald-600'}`} />
                  <span className={isSoldOut ? 'text-red-700' : 'text-[#141414]/80'}>
                    {isSoldOut ? 'Currently Out of Stock' : 'In Stock — Ready to Ship (2–3 Days)'}
                  </span>
                </div>

                {/* Primary CTA Grid */}
                <div className="pdp-cta-grid">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className="pdp-btn-cart"
                  >
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>ADD TO CART</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isSoldOut}
                    className="pdp-btn-buy"
                  >
                    {isSoldOut ? 'OUT OF STOCK' : 'BUY NOW'}
                  </button>
                </div>

                {/* Concierge WhatsApp CTA */}
                <a
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Inquire via WhatsApp (+94 77 071 6212)"
                  className="pdp-btn-whatsapp group"
                >
                  <svg className="w-4 h-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.301-.15-1.78-.877-2.056-.977-.276-.101-.477-.15-.678.15-.2.301-.778.977-.954 1.177-.176.2-.351.226-.652.075-.302-.15-1.272-.469-2.423-1.496-.897-.801-1.503-1.79-1.68-2.091-.176-.301-.019-.464.132-.614.136-.135.302-.351.452-.527.151-.176.201-.301.302-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.633-.929-2.235-.244-.587-.492-.507-.678-.517-.176-.01-.377-.01-.578-.01s-.527.075-.802.376c-.276.301-1.054 1.03-1.054 2.511s1.079 2.911 1.23 3.112c.151.201 2.124 3.243 5.145 4.547.719.311 1.281.497 1.719.636.722.23 1.378.197 1.898.12.579-.086 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.351zM12.04 21.75c-1.748 0-3.46-.46-4.96-1.33l-.356-.21-3.684.966.983-3.593-.23-.367A9.774 9.774 0 0 1 2.25 12.04C2.25 6.64 6.64 2.25 12.04 2.25c2.618 0 5.079 1.02 6.93 2.871a9.754 9.754 0 0 1 2.87 6.919c0 5.4-4.39 9.71-9.8 9.71zm0-17.75a7.95 7.95 0 0 0-7.95 7.95c0 1.54.44 3.03 1.28 4.32l.21.32-.57 2.08 2.13-.56.31.18c1.25.75 2.68 1.14 4.14 1.14 4.38 0 7.95-3.57 7.95-7.95 0-2.12-.83-4.12-2.33-5.62A7.904 7.904 0 0 0 12.04 4z" />
                  </svg>
                  <span>Inquire Via Concierge</span>
                </a>

                {/* Compact 3-Column Trust Row */}
                <div className="pdp-inline-trust">
                  <div className="pdp-inline-trust-cell">
                    <svg className="w-3.5 h-3.5 text-[#8B6914] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span>Free Delivery</span>
                  </div>
                  <Link href="/warranty" target="_blank" className="pdp-inline-trust-cell hover:text-[#8B6914] transition-colors">
                    <svg className="w-3.5 h-3.5 text-[#8B6914] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="underline decoration-[#8B6914]/35">1-Year Warranty</span>
                  </Link>
                  <div className="pdp-inline-trust-cell">
                    <svg className="w-3.5 h-3.5 text-[#8B6914] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5" />
                    </svg>
                    <span>14-Day Exchange</span>
                  </div>
                </div>

                {/* Discreet Policy Links */}
                <div className="text-[10.5px] text-[#141414]/50 text-center mb-5 leading-relaxed">
                  Covered by Winsor&apos;s{' '}
                  <Link href="/terms" target="_blank" className="text-[#8B6914] underline font-medium hover:text-[#141414]">
                    Terms &amp; Conditions
                  </Link>
                  ,{' '}
                  <Link href="/privacy" target="_blank" className="text-[#8B6914] underline font-medium hover:text-[#141414]">
                    Privacy Policy
                  </Link>
                  , and{' '}
                  <Link href="/warranty" target="_blank" className="text-[#8B6914] underline font-medium hover:text-[#141414]">
                    Warranty Policy
                  </Link>
                  .
                </div>

                {/* Product Description */}
                <div className="mb-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#141414] mb-1.5">
                    Timepiece Notes
                  </h3>
                  <p className="text-[13px] text-[#141414]/72 leading-relaxed">
                    {product.description || `The ${product.title} embodies timeless restraint and everyday precision — pairing a balanced case silhouette with dependable Japanese movement architecture.`}
                  </p>
                </div>

                {/* Hairline Specification & Care Accordions */}
                <div className="pdp-accordion-wrap">
                  <div className="pdp-accordion-item">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      className="pdp-accordion-btn"
                    >
                      <span>Specifications</span>
                      <span className="text-[#8B6914] text-base leading-none">{detailsOpen ? '−' : '+'}</span>
                    </button>
                    {detailsOpen && (
                      <div className="text-xs text-[#141414]/68 pt-1 pb-3 space-y-2 leading-relaxed">
                        <p className="m-0">Hand-finished housing engineered around tested Japanese calibre accuracy.</p>
                        {specs.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pt-2">
                            {specs.map(([label, value]) => (
                              <div key={label} className="flex items-center justify-between border-b border-[#8B6914]/15 pb-1.5">
                                <span className="text-[10.5px] font-semibold text-[#8B6914] uppercase tracking-wider">
                                  {label}
                                </span>
                                <span className="text-xs font-medium text-[#141414] capitalize">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pdp-accordion-item">
                    <button
                      type="button"
                      onClick={() => setDeliveryOpen(!deliveryOpen)}
                      className="pdp-accordion-btn"
                    >
                      <span>Shipping &amp; Returns</span>
                      <span className="text-[#8B6914] text-base leading-none">{deliveryOpen ? '−' : '+'}</span>
                    </button>
                    {deliveryOpen && (
                      <div className="text-xs text-[#141414]/68 pt-1 pb-3 leading-relaxed">
                        Complimentary insured courier delivery island-wide in Sri Lanka. Exchanges or returns accepted within 14 days in unworn condition with original presentation box.
                      </div>
                    )}
                  </div>

                  <div className="pdp-accordion-item">
                    <button
                      type="button"
                      onClick={() => setWarrantyOpen(!warrantyOpen)}
                      className="pdp-accordion-btn"
                    >
                      <span>Care &amp; Servicing</span>
                      <span className="text-[#8B6914] text-base leading-none">{warrantyOpen ? '−' : '+'}</span>
                    </button>
                    {warrantyOpen && (
                      <div className="text-xs text-[#141414]/68 pt-1 pb-3 leading-relaxed">
                        Avoid prolonged exposure to strong magnetic fields. Wipe casing and strap gently with a clean microfiber cloth. Supported by Winsor&apos;s 1-year official service &amp; battery care warranty.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BAND 2: HERITAGE & CRAFTSMANSHIP PILLARS (SINGLE AUTHORITATIVE BAR) ── */}
        <div className="pdp-craft-bar">
          <div className="pdp-craft-grid">
            <div className="pdp-craft-cell">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
              <h4>Est. 2023 · Dubai</h4>
              <span>Registered Horological Atelier</span>
            </div>
            <div className="pdp-craft-cell">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9z" />
              </svg>
              <h4>Japanese Calibre</h4>
              <span>Tested Movement Accuracy</span>
            </div>
            <div className="pdp-craft-cell">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <h4>Fixed Official MRP</h4>
              <span>Authentic Boutique Pricing</span>
            </div>
            <div className="pdp-craft-cell">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
              <h4>Signature Gifting</h4>
              <span>Luxury Presentation Case</span>
            </div>
          </div>
        </div>

        {/* ── BAND 3: WATCH OUR STORY (DARK CINEMA SHOWCASE + DYNAMIC SPECIFICATIONS) ── */}
        <section className="pdp-story-band">
          <div className="pdp-story-backdrop" aria-hidden="true" />
          <div className="pdp-story-scrim" aria-hidden="true" />
          <div className="pdp-story-inner">
            <div>
              <span className="pdp-story-eyebrow">Watch Our Story</span>
              <h2 className="pdp-story-title">Timeless Elegance</h2>
              <p className="pdp-story-desc">
                Discover the blend of restrained aesthetics, regulated Japanese precision, and enduring architecture inside{' '}
                {product.title && product.title.length > 42 ? (
                  'this Winsor timepiece'
                ) : (
                  <>
                    the <span className="capitalize">{product.title}</span>
                  </>
                )}
                .
              </p>

              {(() => {
                const productSpecs = product.specifications || {};
                const getVal = (keys: string[]) => {
                  for (const k of Object.keys(productSpecs)) {
                    if (keys.some(key => k.toLowerCase().includes(key.toLowerCase()))) {
                      return productSpecs[k];
                    }
                  }
                  return null;
                };
                const caseMat = getVal(['case', 'material', 'build']);
                const glassMat = getVal(['glass', 'crystal', 'lens', 'dial']);
                const rawWaterRes = getVal(['water', 'atm', 'depth', 'resistant']);
                const waterRes = (!rawWaterRes || rawWaterRes.toLowerCase() === 'no' || rawWaterRes.toLowerCase() === 'none') ? 'Water Resistant' : rawWaterRes;
                const movement = getVal(['movement', 'engine', 'mechanism']);

                const storyFeatures = [
                  {
                    title: 'Craft & Build',
                    desc: caseMat || '316L Stainless Steel',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Dial & Crystal',
                    desc: glassMat || 'Protective Crystal Lens',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9z" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Water Protection',
                    desc: waterRes,
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 007 7z" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Precision Movement',
                    desc: movement || 'Regulated Precision',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ),
                  },
                ];

                return (
                  <div className="pdp-story-specs-mini">
                    {storyFeatures.map((feat) => (
                      <div key={feat.title} className="pdp-story-spec-item">
                        <div className="pdp-story-spec-icon">{feat.icon}</div>
                        <div>
                          <div className="text-[11px] font-semibold text-white tracking-wide">{feat.title}</div>
                          <div className="text-[11px] text-white/55">{feat.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="pdp-story-cta-row">
                {hasUploadedVideo ? (
                  <button
                    type="button"
                    onClick={() => setStoryVideoPlaying((v) => !v)}
                    className="pdp-story-btn-gold"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>{storyVideoPlaying ? 'Playing Film' : 'Watch Video'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStorySlideshowPaused((p) => !p)}
                    className="pdp-story-btn-gold"
                  >
                    {storySlideshowPaused ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Play Showcase</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        <span>Pause Showcase</span>
                      </>
                    )}
                  </button>
                )}
                <Link href="/our-story" className="pdp-story-btn-link">
                  Discover Our Story →
                </Link>
                <Link href="/retailers" className="pdp-story-btn-link">
                  Find a Store →
                </Link>
              </div>
            </div>

            <div className="pdp-story-frame">
              {hasUploadedVideo ? (
                storyVideoPlaying ? (
                  <AmbientVideoPlayer
                    src={product.video!.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    aspectRatio="aspect-video"
                    roundedClassName="rounded-2xl"
                    containerClassName="w-full h-full"
                    className="w-full h-full"
                    showAmbientToggle={false}
                    defaultAmbientOn={false}
                    title={`${product.title} Craft Film`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setStoryVideoPlaying(true)}
                    className="pdp-story-frame-trigger w-full h-full relative block border-none p-0 bg-transparent cursor-pointer"
                    aria-label="Play Winsor craft video"
                  >
                    <Image
                      src="/collections_pg.webp"
                      alt={`${product.title} Craftsmanship Film`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'radial-gradient(circle, rgba(15,14,11,0.22) 0%, rgba(15,14,11,0.62) 100%)' }}
                    >
                      <span className="pdp-story-play-circle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </span>
                    </div>
                  </button>
                )
              ) : (
                <div className="pdp-kb-stage" aria-label={`${product.title} Timepiece Slideshow`}>
                  {storyImages.map((imgSrc, idx) => {
                    const isActive = idx === storySlideState.active;
                    const isPrev = idx === storySlideState.prev && idx !== storySlideState.active;
                    const isSingle = storyImages.length <= 1;
                    const panVariant = idx % 2 === 0 ? 'is-pan-a' : 'is-pan-b';
                    return (
                      <div
                        key={`${imgSrc}-${idx}`}
                        className={`pdp-slide-media ${isActive ? 'is-active' : ''} ${isPrev ? 'is-prev' : ''}`}
                      >
                        <div className="pdp-slide-vignette" aria-hidden="true" />
                        <div
                          className={`pdp-slide-zoom-wrap ${
                            isSingle
                              ? 'is-single'
                              : isActive || isPrev
                                ? `is-animating ${panVariant}`
                                : ''
                          } ${storySlideshowPaused ? 'is-paused' : ''}`}
                        >
                          <img
                            src={imgSrc}
                            alt={`${product.title} showcase view ${idx + 1}`}
                            className="pdp-slide-watch-img"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Minimal Editorial Timeline & Playback Controls */}
                  <div className="pdp-kb-hud">
                    <div className="pdp-kb-caption-col">
                      {storyImages.length > 1 && (
                        <div className="pdp-kb-progress-track">
                          <div
                            key={`prog-${storySlideState.active}`}
                            className={`pdp-kb-progress-fill ${storySlideshowPaused ? 'is-paused' : ''}`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pdp-kb-controls">
                      {storyImages.length > 1 && (
                        <div className="pdp-kb-dots" role="tablist" aria-label="Slideshow angles">
                          {storyImages.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              role="tab"
                              aria-selected={idx === storySlideState.active}
                              aria-label={`View watch angle ${idx + 1}`}
                              onClick={() => goToStorySlide(idx)}
                              className={`pdp-kb-dot ${idx === storySlideState.active ? 'active' : ''}`}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setStorySlideshowPaused((p) => !p)}
                        className="pdp-kb-toggle-btn"
                        aria-label={storySlideshowPaused ? 'Resume slideshow motion' : 'Pause slideshow motion'}
                        title={storySlideshowPaused ? 'Resume slideshow' : 'Pause slideshow'}
                      >
                        {storySlideshowPaused ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '1px' }}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── BAND 4: EXPLORE OUR COLLECTIONS (5-CARD EDITORIAL STRIP) ── */}
        <section className="pdp-collections-band">
          <div className="pdp-collections-inner">
            <div className="pdp-sec-header">
              <div className="pdp-sec-eyebrow">
                <span className="rule" />
                <span>Our Collections</span>
                <span className="rule" />
              </div>
              <h2 className="pdp-sec-title">Explore Our Collections</h2>
              <p className="pdp-sec-sub">Find the curated Winsor calibre tailored to every occasion</p>
            </div>

            <div className="pairings-grid" ref={pairingsScrollRef} onScroll={handlePairingsScroll}>
              {[
                { title: "Men's Watches", href: '/mens', img: '/category_HomeS/classic_bg.webp' },
                { title: "Women's Watches", href: '/womens', img: '/category_HomeS/ladies_bg.webp' },
                { title: 'Sport Watches', href: '/sports', img: '/category_HomeS/sport_bg.webp' },
                { title: 'Classic Series', href: '/collections?section=luxury', img: '/category_HomeS/new_arrivals_bg.webp' },
                { title: 'Limited Edition', href: '/limited-edition', img: '/category_HomeS/limitted_bg.webp' },
              ].map((col) => (
                <Link key={col.title} href={col.href} className="pairing-card" draggable={false}>
                  <Image
                    src={col.img}
                    alt={col.title}
                    fill
                    sizes="(max-width: 768px) 60vw, 20vw"
                    style={{ objectFit: 'cover' }}
                    className="pairing-img"
                    draggable={false}
                  />
                  <div className="pairing-overlay" />
                  <div className="pairing-info">
                    <h4 className="pairing-card-title">{col.title}</h4>
                    <span className="pairing-card-link">Shop Now →</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pairings-mobile-controls" aria-label="Collections Navigation">
              <button
                type="button"
                className="pairings-nav-arrow"
                onClick={() => scrollPairingsByDir('left')}
                disabled={activePairingIdx === 0}
                aria-label="Previous collection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="pairings-dots-container">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pairings-dot ${activePairingIdx === idx ? 'active' : ''}`}
                    onClick={() => scrollToPairing(idx)}
                    aria-label={`Go to collection ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="pairings-nav-arrow"
                onClick={() => scrollPairingsByDir('right')}
                disabled={activePairingIdx === 4}
                aria-label="Next collection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── BAND 5: FEATURED COMPLEMENTARY TIMEPIECES ── */}
        {suggestions.length > 0 && (
          <section className="suggestions-section">
            <div className="suggestions-inner">
              <div className="pdp-sec-header">
                <div className="pdp-sec-eyebrow">
                  <span className="rule" />
                  <span>Curated Additions</span>
                  <span className="rule" />
                </div>
                <h2 className="pdp-sec-title">Featured Timepieces</h2>
                <p className="pdp-sec-sub">Complementing watches from our current studio collection</p>
              </div>

              <div className="suggestions-grid">
                {suggestions.map((p) => {
                  const gender = getProductGender(p);
                  const rData = p._id ? suggestionRatings[p._id] : undefined;
                  const rAvg = rData?.averageRating || 0;
                  const rCount = rData?.reviewCount || 0;
                  const badgeLabel = p.isSoldOut
                    ? 'SOLD OUT'
                    : p.stickerEnabled && p.stickerText
                      ? p.stickerText
                      : p.collectionSections?.includes('new')
                        ? 'NEW'
                        : p.collectionSections?.includes('limited')
                          ? 'LIMITED'
                          : null;

                  return (
                    <div key={p._id} className="suggested-card">
                      <div className="relative">
                        {badgeLabel && (
                          <span className={`suggested-badge ${p.isSoldOut ? 'sold-out' : ''}`}>
                            {badgeLabel}
                          </span>
                        )}

                        {!p.isSoldOut && p._id && (
                          <button
                            type="button"
                            className="suggested-bag-btn"
                            aria-label={`Add ${p.title} to shopping bag`}
                            onClick={() => {
                              addToCart(p._id!, 1, '', p);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                          </button>
                        )}

                        <Link href={`/collections/${p._id}`} className="suggested-img-container">
                          {p.thumbnail?.url && (
                            <Image
                              src={p.thumbnail.url}
                              alt={p.title}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              style={{ objectFit: 'contain' }}
                              className="suggested-img"
                            />
                          )}
                        </Link>
                      </div>

                      <div className="suggested-body">
                        <div>
                          <span className="block text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#8B6914] mb-1">
                            {gender}
                          </span>
                          <Link href={`/collections/${p._id}`} className="no-underline">
                            <h4 className="suggested-title capitalize">{p.title}</h4>
                          </Link>

                          {rCount > 0 ? (
                            <div className="flex items-center gap-1 mt-1.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <svg
                                  key={s}
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill={rAvg >= s ? '#8B6914' : 'none'}
                                  stroke="#8B6914"
                                  strokeWidth="1.6"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                              <span className="text-[10.5px] text-[#141414]/55 ml-1">
                                {rAvg.toFixed(1)} ({rCount})
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-[#141414]/55">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.8">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                              </svg>
                              <span>Official Warranty · Authentic</span>
                            </div>
                          )}
                        </div>

                        <div className="text-[14px] font-semibold text-[#141414] lining-nums pt-1 border-t border-[#141414]/[0.06]">
                          {convertPrice(p.price)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-10">
                <Link href="/collections" className="pdp-view-all-btn">
                  <span>View All Timepieces</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── BAND 7: WHAT OUR CUSTOMERS SAY (VERIFIED REVIEWS & TESTIMONIALS) ── */}
        <section id="customer-reviews-section" className="reviews-band">
          <div className="reviews-band-inner">
            <div className="pdp-sec-header">
              <div className="pdp-sec-eyebrow">
                <span className="rule" />
                <span>Verified Patron Feedback</span>
                <span className="rule" />
              </div>
              <h2 className="pdp-sec-title">What Our Customers Say</h2>
              <p className="pdp-sec-sub">Authentic impressions shared by verified Winsor watch owners</p>
            </div>

            {reviews.length === 0 ? (
              <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '44px 24px', border: '1px solid rgba(20,20,20,0.08)', borderRadius: '14px', background: '#FFFFFF' }}>
                <p style={{ fontSize: '14px', color: 'rgba(20,20,20,0.58)', margin: 0 }}>
                  No verified patron reviews have been posted yet for this timepiece.
                </p>
              </div>
            ) : (() => {
              const filteredRevs = reviews.filter(r => {
                if (reviewFilter === 'photos') return r.images && r.images.length > 0;
                if (typeof reviewFilter === 'number') return Math.round(r.rating) === reviewFilter;
                return true;
              });

              const visibleRevs = filteredRevs.slice(0, visibleReviewsCount);
              const allPhotoUrls = reviews.flatMap(r => r.images || []);

              return (
                <div className="reviews-layout-grid">
                  {/* Rating Summary Sidebar */}
                  <div className="rev-summary-sidebar">
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#141414', borderBottom: '1px solid rgba(20,20,20,0.08)', paddingBottom: '12px' }}>
                      Rating Summary
                    </h4>

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '58px', fontWeight: 500, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1, color: '#141414' }}>{reviewsStats.average}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '8px 0 6px' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < Math.round(reviewsStats.average) ? '#8B6914' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(20,20,20,0.5)' }}>
                        {reviewsStats.count} verified review{reviewsStats.count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {([5, 4, 3, 2, 1] as const).map(stars => {
                        const count = starDistribution[stars] || 0;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        const isActive = reviewFilter === stars;
                        return (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => { setReviewFilter(isActive ? 'all' : stars); setVisibleReviewsCount(5); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', background: isActive ? 'rgba(139,105,20,0.08)' : 'none', border: isActive ? '1px solid rgba(139,105,20,0.3)' : '1px solid transparent', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}
                          >
                            <span style={{ width: '38px', color: 'rgba(20,20,20,0.75)', fontWeight: 600, fontSize: '11px' }}>{stars} ★</span>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(20,20,20,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#8B6914', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ width: '22px', textAlign: 'right', color: 'rgba(20,20,20,0.45)', fontSize: '11px' }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {allPhotoUrls.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(20,20,20,0.55)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Customer Photos ({allPhotoUrls.length})</span>
                          {allPhotoUrls.length > 3 && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => scrollPhotos('left')}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(20,20,20,0.18)', background: '#fff', color: '#141414', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Scroll Left"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() => scrollPhotos('right')}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(20,20,20,0.18)', background: '#fff', color: '#141414', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Scroll Right"
                              >
                                ›
                              </button>
                            </div>
                          )}
                        </div>

                        <div
                          ref={photoStripRef}
                          style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            gap: '8px',
                            paddingBottom: '6px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          {allPhotoUrls.map((url: string, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { setLightboxImg(url); setReviewFilter('photos'); setVisibleReviewsCount(5); }}
                              className="rev-img-thumb"
                              style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(20,20,20,0.1)', cursor: 'pointer', padding: 0, background: '#fff', flexShrink: 0 }}
                            >
                              <img src={url} alt={`Review photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReviewFilter(reviewFilter === 'photos' ? 'all' : 'photos');
                            setVisibleReviewsCount(5);
                          }}
                          className={`show-photos-btn ${reviewFilter === 'photos' ? 'active' : ''}`}
                        >
                          {reviewFilter === 'photos' ? '✓ Showing Photos Only' : 'Show Reviews with Photos'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Pills + Editorial Quote Review Cards */}
                  <div style={{ minWidth: 0 }}>
                    <div className="rev-filter-row">
                      {(['all', 'photos', 5, 4, 3, 2, 1] as const).map(f => {
                        const label = f === 'all' ? `All (${reviews.length})` : f === 'photos' ? `With Photos (${allPhotoUrls.length})` : `${'★'.repeat(f)} ${f} Star (${starDistribution[f as 1 | 2 | 3 | 4 | 5] || 0})`;
                        const isActive = reviewFilter === f;
                        return (
                          <button
                            key={String(f)}
                            type="button"
                            className={`rev-filter-btn ${isActive ? 'active' : ''}`}
                            onClick={(e) => {
                              setReviewFilter(f);
                              setVisibleReviewsCount(5);
                              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {filteredRevs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '44px 20px', border: '1px solid rgba(20,20,20,0.08)', borderRadius: '14px', background: '#FFFFFF' }}>
                        <p style={{ fontSize: '14px', color: 'rgba(20,20,20,0.48)', margin: 0 }}>No reviews match this filter.</p>
                        <button onClick={() => { setReviewFilter('all'); setVisibleReviewsCount(5); }} style={{ marginTop: '12px', background: 'none', border: '1px solid rgba(20,20,20,0.2)', borderRadius: '999px', padding: '8px 18px', fontSize: '11.5px', cursor: 'pointer', color: '#8B6914', fontWeight: 600 }}>Clear Filter</button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: '12px', color: 'rgba(20,20,20,0.52)', marginBottom: '16px' }}>
                          Showing 1–{Math.min(visibleReviewsCount, filteredRevs.length)} of {filteredRevs.length} review{filteredRevs.length !== 1 ? 's' : ''}
                        </p>

                        <div>
                          {visibleRevs.map((rev, idx) => {
                            const dispName = rev.isAnonymous ? maskReviewerName(rev.username) : rev.username;
                            return (
                              <div key={idx} className="rev-card-editorial">
                                <div style={{ flexShrink: 0 }}>
                                  {rev.isAnonymous || !rev.userAvatar ? (
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #9C7A3C, #8B6914)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '17px', textTransform: 'uppercase' }}>
                                      {dispName ? dispName[0] : 'C'}
                                    </div>
                                  ) : (
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(139,105,20,0.28)' }}>
                                      <img src={rev.userAvatar} alt={dispName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                                    <div>
                                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#141414' }}>{dispName}</span>
                                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#8B6914', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>✓ Verified Purchase</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(20,20,20,0.42)' }}>
                                      {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '3px', marginBottom: '10px', alignItems: 'center' }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < rev.rating ? '#8B6914' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    ))}
                                    <span style={{ fontSize: '11px', color: 'rgba(20,20,20,0.45)', marginLeft: '4px' }}>{rev.rating}/5</span>
                                  </div>

                                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', lineHeight: 1.65, color: 'rgba(20,20,20,0.78)' }}>
                                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#8B6914', lineHeight: 0, marginRight: '4px', verticalAlign: '-2px' }}>&ldquo;</span>
                                    {rev.comment}
                                  </p>

                                  {rev.images && rev.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      {rev.images.map((url: string, i: number) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => setLightboxImg(url)}
                                          className="rev-img-thumb"
                                          style={{ width: '68px', height: '68px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(20,20,20,0.1)', cursor: 'pointer', padding: 0, background: '#FFFFFF' }}
                                        >
                                          <img src={url} alt={`Review image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {visibleReviewsCount < filteredRevs.length && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
                            <button
                              type="button"
                              onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                              className="see-more-rev-btn"
                            >
                              <span>SEE MORE REVIEWS</span>
                              <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>({visibleReviewsCount} of {filteredRevs.length})</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* LIGHTBOX */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out', backdropFilter: 'blur(4px)' }}
          >
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              style={{ position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '44px', height: '44px', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
            >✕</button>
            <img
              src={lightboxImg}
              alt="Review photo"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', cursor: 'default' }}
            />
          </div>
        )}
      </div>

      {/* ── Guest Checkout Modal (not signed in) ──────────────────────── */}
      {product && (
        <GuestCheckoutModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          items={[{
            productId: product._id!,
            productTitle: product.title,
            productModelNo: product.modelNo,
            productThumbnail: selectedVariant?.image?.url || product.thumbnail?.url || '',
            colorVariant: selectedVariant?.colorName,
            quantity: 1,
            price: product.price,
          }]}
          onLoginClick={() => setShowGuestModal(false)}
          onOrderSuccess={(ref) => {
            // Keep modal open so step 4 success popup (ref code + copy button + PDF receipt) is shown to guest
          }}
        />
      )}

      {/* ── Buy Now Modal (signed in — direct purchase) ───────────────── */}
      {product && (
        <BuyNowModal
          isOpen={showBuyNowModal}
          onClose={() => setShowBuyNowModal(false)}
          item={{
            productId: product._id!,
            productTitle: product.title,
            productModelNo: product.modelNo,
            productThumbnail: selectedVariant?.image?.url || product.thumbnail?.url || '',
            colorVariant: selectedVariant?.colorName,
            quantity: 1,
            price: product.price,
          }}
          profile={buyerProfile}
          userFirstName={user?.firstName || ''}
          userLastName={user?.lastName || ''}
          userEmail={user?.primaryEmailAddress?.emailAddress || ''}
          onOrderSuccess={() => {
            // Keep modal open so step 4 success popup (ref code + copy button + PDF receipt) is shown
          }}
        />
      )}

    </>
  );
}
