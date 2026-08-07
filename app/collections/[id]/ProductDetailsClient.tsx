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

interface ProductDetailsClientProps {
  id: string;
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Buy Now modal states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState<any>(null);

  // API States
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');

  // Cart Interaction States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);

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

  // Fetch product data on mount/id change
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const prod: IProduct = data.data;
          setProduct(prod);
          // Set default image to thumbnail
          setSelectedImage(prod.thumbnail?.url || '');
          // Set default color variant to first variant
          if (prod.colorVariants && prod.colorVariants.length > 0) {
            setSelectedVariant(prod.colorVariants[0]);
            if (prod.colorVariants[0].image?.url) {
              setSelectedImage(prod.colorVariants[0].image.url);
            }
          }
        } else {
          throw new Error(data.error || 'Failed to load timepiece details');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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

    const variantStr = selectedVariant ? ` (${selectedVariant.colorName})` : '';
    setToastMessage(`"${product.title}${variantStr}" has been added to your cart.`);
    setShowToast(true);
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
      const res = await fetch('/api/customer/profile');
      const data = await res.json();
      if (data.success && data.data) {
        setBuyerProfile(data.data);
      } else {
        setBuyerProfile(null);
      }
    } catch {
      setBuyerProfile(null);
    }
    setShowBuyNowModal(true);
  };

  // Close toast automatically after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-circle" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(139,105,20,0.1)', borderTopColor: '#8B6914', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.05em' }}>Loading Timepiece...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#1a1209', marginBottom: '12px' }}>Timepiece Not Found</h2>
          <p style={{ color: 'rgba(26,18,9,0.6)', marginBottom: '24px' }}>{error || 'The requested timepiece could not be found.'}</p>
          <Link href="/collections" style={{ background: '#1a1209', color: '#fff', textDecoration: 'none', padding: '12px 28px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = !!(product.isSoldOut || (selectedVariant && selectedVariant.qty === 0));
  const specs = Object.entries(product.specifications || {});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

        .detail-container {
          background-color: #faf7f0;
          min-height: 100vh;
          padding: 130px 40px 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }
        .detail-wrapper {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          gap: 60px;
        }
        
        /* GALLERY SECTION */
        .gallery-container {
          width: 55%;
          display: flex;
          gap: 20px;
        }
        .thumbnails-column {
          width: 80px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 560px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .thumbnails-column::-webkit-scrollbar {
          display: none;
        }
        .thumbnail-item {
          aspect-ratio: 1;
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.08);
          background-color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .thumbnail-item.active {
          border-color: #8B6914;
          box-shadow: 0 0 6px rgba(139, 105, 20, 0.15);
        }
        .thumbnail-item:hover {
          border-color: #8b6914;
        }
        .main-image-view {
          flex-grow: 1;
          aspect-ratio: 1;
          max-height: 560px;
          position: relative;
          border-radius: 12px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          background-color: #fff;
          overflow: hidden;
        }
        
        /* DETAILS INFO SECTION */
        .info-container {
          width: 45%;
          display: flex;
          flex-direction: column;
        }
        .brand-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #8B6914;
          margin-bottom: 6px;
        }
        .detail-sticker {
          display: inline-block;
          background: #1a1209;
          color: #fff;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 2px;
          align-self: flex-start;
          margin-bottom: 12px;
        }
        .detail-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 4px;
          color: #1a1209;
        }
        .detail-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.55);
          letter-spacing: 0.02em;
          margin-bottom: 18px;
          font-weight: 300;
        }
        .model-no {
          font-size: 11px;
          color: rgba(26, 18, 9, 0.4);
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }
        .detail-price {
          font-size: 26px;
          font-weight: 500;
          color: #8B6914;
          margin-bottom: 24px;
        }
        
        /* COLOR VARIANTS Swatches */
        .swatch-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(26, 18, 9, 0.5);
          margin-bottom: 12px;
        }
        .swatches-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          align-items: flex-start;
        }
        .swatch-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .swatch-btn {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          border: 2px solid rgba(26, 18, 9, 0.12);
          padding: 2px;
          background: none;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .swatch-btn:hover {
          border-color: #8B6914;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.2);
        }
        .swatch-btn.active {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.2);
          transform: scale(1.05);
        }
        .swatch-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          display: block;
        }
        .swatch-fallback {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, #d4c5a0, #b8a882);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 600;
          color: #6b5a30;
          text-align: center;
          letter-spacing: 0.02em;
          padding: 2px;
          line-height: 1.2;
        }
        .swatch-name {
          font-size: 9px;
          font-weight: 500;
          color: rgba(26, 18, 9, 0.55);
          text-align: center;
          max-width: 56px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Jost', sans-serif;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .swatch-item:has(.swatch-btn.active) .swatch-name {
          color: #8B6914;
          font-weight: 600;
        }
        
        /* INVENTORY STOCK STATUS */
        .stock-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 500;
          margin-bottom: 24px;
        }
        .stock-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        /* ACTION BUTTONS CONTAINER */
        .actions-buttons-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
        }
        .cart-action-btn {
          flex: 1;
          background: #1a1209;
          color: #faf7f0;
          border: none;
          border-radius: 4px;
          padding: 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .cart-action-btn:hover:not(:disabled) {
          background: #8B6914;
          box-shadow: 0 4px 12px rgba(139,105,20,0.2);
        }
        .cart-action-btn:disabled {
          background: rgba(26, 18, 9, 0.15);
          color: rgba(26, 18, 9, 0.4);
          cursor: not-allowed;
        }
        .buy-now-btn {
          flex: 1;
          background: #8B6914;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
        }
        .buy-now-btn:hover:not(:disabled) {
          background: #1a1209;
          box-shadow: 0 4px 12px rgba(26,18,9,0.25);
        }
        .buy-now-btn:disabled {
          background: rgba(26, 18, 9, 0.15);
          color: rgba(26, 18, 9, 0.4);
          cursor: not-allowed;
        }
        .find-retailer-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: transparent;
          color: #8B6914;
          border: 1.5px solid #8B6914;
          border-radius: 4px;
          padding: 14px 20px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .find-retailer-btn:hover {
          background: #8B6914;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(139,105,20,0.25);
        }

        /* THREE ACCENTED BADGES */
        .features-badge-bar {
          display: flex;
          justify-content: space-between;
          padding: 14px 4px;
          border-top: 1px solid rgba(26,18,9,0.06);
          border-bottom: 1px solid rgba(26,18,9,0.06);
          margin-bottom: 24px;
          font-size: 11px;
          color: rgba(26,18,9,0.65);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* ACCORDIONS */
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          padding: 15px 0;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #1a1209;
          cursor: pointer;
          transition: color 0.2s;
        }
        .accordion-header:hover {
          color: #8B6914;
        }
        .accordion-content {
          padding: 0 0 16px 0;
          font-size: 13px;
          line-height: 1.5;
          color: rgba(26,18,9,0.7);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(26, 18, 9, 0.4);
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-decoration: none;
          margin-top: 24px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #8b6914;
        }

        /* LARGE IMAGES DETAILS GRID */
        .large-gallery-section {
          margin-top: 60px;
          border-top: 1px solid rgba(26,18,9,0.08);
          padding-top: 50px;
        }
        .large-gallery-section h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 36px;
          letter-spacing: 0.05em;
        }
        .large-gallery-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1300px;
          margin: 0 auto;
        }
        .large-gallery-item {
          width: 100%;
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          border: 1px solid rgba(26,18,9,0.05);
          background-color: #fff;
        }
        .large-gallery-video-item {
          width: 100%;
          aspect-ratio: 1.777;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          background: #000;
          margin-bottom: 30px;
          max-width: 1300px;
          margin-left: auto;
          margin-right: auto;
        }
        .large-video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* STORE BANNER */
        .store-banner-wrapper {
          max-width: 1300px;
          margin: 80px auto 0;
          padding: 0;
        }
        .store-banner-container {
          position: relative;
          width: 100%;
          height: 420px;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-left: 80px;
          border: 1px solid rgba(26,18,9,0.06);
          box-shadow: 0 8px 30px rgba(0,0,0,0.02);
        }
        .store-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(15, 12, 10, 0.98) 0%, rgba(15, 12, 10, 0.75) 35%, rgba(15, 12, 10, 0.15) 100%);
          z-index: 1;
        }
        .store-banner-content {
          position: relative;
          z-index: 2;
          max-width: 480px;
          color: #fff;
        }
        .store-banner-tag {
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 12px;
          font-weight: 500;
          display: block;
        }
        .store-banner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 300;
          line-height: 1.2;
          margin-bottom: 16px;
          color: #fff;
        }
        .store-banner-p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 28px;
          font-family: 'Jost', sans-serif;
        }
        .store-banner-btn {
          display: inline-block;
          background: #8B6914;
          color: #fff;
          border: none;
          text-decoration: none;
          padding: 12px 28px;
          font-size: 11px;
          letter-spacing: 0.15em;
          font-weight: 500;
          text-transform: uppercase;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .store-banner-btn:hover {
          background: #fff;
          color: #1a1209;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* BRAND LIFESTYLE BANNER */
        .brand-banner-wrapper {
          max-width: 1300px;
          margin: 60px auto 0;
          padding: 0;
        }
        .brand-banner-container {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-left: 80px;
          border: 1px solid rgba(26,18,9,0.06);
          box-shadow: 0 8px 30px rgba(0,0,0,0.02);
        }
        .brand-banner-bg {
          object-fit: cover;
          object-position: center 20%;
        }
        .brand-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(26,18,9,0.85) 0%, rgba(26,18,9,0.45) 50%, rgba(26,18,9,0.15) 100%);
          z-index: 1;
        }
        .brand-banner-content {
          position: relative;
          z-index: 2;
          max-width: 480px;
          color: #fff;
        }
        .brand-banner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 300;
          letter-spacing: 0.05em;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .brand-banner-p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255,255,255,0.75);
          margin-bottom: 28px;
          font-family: 'Jost', sans-serif;
        }
        .brand-banner-btn {
          display: inline-block;
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.4);
          text-decoration: none;
          padding: 12px 28px;
          font-size: 11px;
          letter-spacing: 0.15em;
          font-weight: 500;
          text-transform: uppercase;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .brand-banner-btn:hover {
          background: #fff;
          color: #1a1209;
          border-color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* TIMELESS PAIRINGS CATEGORY GRID */
        .pairings-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .pairing-card {
          display: flex;
          flex-direction: column;
          background: #FAF7F0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(26,18,9,0.05);
          text-decoration: none;
          color: inherit;
          transition: all 0.4s;
        }
        .pairing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(139,105,20,0.06);
          border-color: rgba(139,105,20,0.25);
        }
        .pairing-img-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1.35;
          overflow: hidden;
        }
        .pairing-img {
          transition: transform 0.6s ease;
        }
        .pairing-card:hover .pairing-img {
          transform: scale(1.05);
        }
        .pairing-info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex-grow: 1;
          justify-content: space-between;
        }
        .pairing-card-title {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #1a1209;
          margin: 0 0 4px 0;
        }
        .pairing-card-desc {
          font-size: 11px;
          color: rgba(26,18,9,0.5);
          margin: 0 0 12px 0;
        }
        .pairing-card-link {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #8B6914;
          border-bottom: 1.5px solid transparent;
          padding-bottom: 2px;
          transition: all 0.3s;
        }
        .pairing-card:hover .pairing-card-link {
          color: #1a1209;
          border-color: #1a1209;
        }

        /* SUGGESTIONS SECTION */
        .suggestions-section {
          margin-top: 80px;
          border-top: 1px solid rgba(26,18,9,0.08);
          padding-top: 60px;
          margin-bottom: 40px;
        }
        .suggestions-section h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 36px;
          letter-spacing: 0.05em;
        }
        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }
        .suggested-card {
          display: flex;
          flex-direction: column;
          transition: transform 0.3s;
        }
        .suggested-img-container {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(26,18,9,0.02);
          border: 1px solid rgba(26, 18, 9, 0.04);
        }
        .suggested-card:hover .suggested-img {
          transform: scale(1.05);
        }
        .suggested-card:hover {
          transform: translateY(-4px);
        }

        /* FOOTER FEATURES BANNER */
        .features-footer-banner {
          max-width: 1300px;
          margin: 80px auto 0;
          padding: 0;
        }
        .features-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          border-top: 1px solid rgba(26,18,9,0.06);
          padding-top: 40px;
        }
        .feature-footer-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .feature-footer-item h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1a1209;
          margin: 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .feature-footer-item p {
          font-size: 11px;
          color: rgba(26,18,9,0.5);
          margin: 2px 0 0 0;
        }

        /* TOAST SUCCESS BOX */
        .toast-box {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 100;
          background: #faf7f0;
          border: 1px solid #8B6914;
          box-shadow: 0 10px 30px rgba(139,105,20,0.15);
          border-radius: 6px;
          padding: 16px 24px;
          max-width: 380px;
          display: flex;
          align-items: center;
          gap: 16px;
          transform: translateY(-20px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .toast-box.active {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Responsive styling */
        @media (max-width: 1024px) {
          .detail-container {
            padding: 100px 24px 60px;
          }
          .detail-wrapper {
            flex-direction: column;
            gap: 40px;
          }
          .gallery-container {
            width: 100%;
          }
          .info-container {
            width: 100%;
          }
          .large-gallery-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .pairings-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .features-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        
        @media (max-width: 640px) {
          .gallery-container {
            flex-direction: column-reverse;
            gap: 16px;
          }
          .thumbnails-column {
            width: 100%;
            flex-direction: row;
            max-height: none;
            overflow-x: auto;
          }
          .thumbnail-item {
            width: 68px;
            flex-shrink: 0;
          }
          .detail-title {
            font-size: 32px;
          }
          .specs-grid {
            grid-template-columns: 1fr;
          }
          .actions-buttons-container {
            flex-direction: column;
            gap: 12px;
          }
          .large-gallery-container {
            grid-template-columns: 1fr;
          }
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .pairings-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .pairing-info {
            padding: 10px 8px;
          }
          .pairing-card-title {
            font-size: 11.5px;
            margin-bottom: 2px;
          }
          .pairing-card-desc {
            font-size: 9.5px;
            margin-bottom: 6px;
          }
          .pairing-card-link {
            font-size: 8.5px;
          }
          .features-footer-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .store-banner-container {
            padding-left: 24px;
            padding-right: 24px;
            height: 380px;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .store-banner-overlay {
            background: rgba(15, 12, 10, 0.85);
          }
          .store-banner-title {
            font-size: 32px;
          }
          .brand-banner-container {
            padding-left: 20px;
            padding-right: 20px;
            height: 300px;
            align-items: flex-end;
            justify-content: center;
            text-align: center;
            padding-bottom: 24px;
          }
          .brand-banner-bg {
            object-position: 53% center !important;
          }
          .brand-banner-overlay {
            background: rgba(26,18,9,0.85);
          }
          .brand-banner-title {
            font-size: 26px;
            margin-bottom: 8px;
          }
          .brand-banner-p {
            font-size: 11px;
            max-width: 280px;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 16px;
          }
          .brand-banner-btn {
            padding: 8px 18px;
            font-size: 9.5px;
          }
          .reviews-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .rev-summary-sidebar {
            position: relative !important;
            top: 0 !important;
            padding: 20px !important;
          }
          .rev-photo-strip {
            gap: 6px !important;
          }
          .rev-filter-row {
            gap: 6px !important;
          }
          .rev-filter-btn {
            padding: 6px 10px !important;
            font-size: 10px !important;
          }
          .rev-card {
            padding: 16px !important;
          }
          .rev-img-thumb {
            width: 56px !important;
            height: 56px !important;
          }
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      <div className={`toast-box ${showToast ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#8B6914', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>Shopping Bag</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.3 }}>{toastMessage}</p>
        </div>
        <button onClick={() => setShowToast(false)} style={{ background: 'none', border: 'none', fontSize: '16px', color: 'rgba(26,18,9,0.3)', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
      </div>

      <div className="detail-container">
        {/* BREADCRUMB TRAIL */}
        <div className="max-w-[1300px] mx-auto mb-6 text-xs text-[#1a1209]/60 flex items-center gap-2 flex-wrap font-['Jost',sans-serif]">
          <Link href="/" className="hover:text-[#8b6914] transition-colors">Home</Link>
          <span>&gt;</span>
          <Link href={getProductGender(product) === 'Ladies' ? '/womens' : '/mens'} className="hover:text-[#8b6914] transition-colors">
            {getProductGender(product) === 'Ladies' ? "Women's" : "Men's"}
          </Link>
          <span>&gt;</span>
          <Link href="/collections" className="hover:text-[#8b6914] transition-colors">Classic Collection</Link>
          <span>&gt;</span>
          <span className="text-[#1a1209] font-medium">{product.title}</span>
        </div>

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
                    alt={`${product.title} gallery ${i}`}
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}

              {/* Video Thumbnail Button */}
              {product.video?.url && (
                <div
                  className={`thumbnail-item relative flex items-center justify-center bg-black overflow-hidden ${activeMediaType === 'video' ? 'active ring-2 ring-[#8b6914]' : ''}`}
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
                  <div className="w-9 h-9 rounded-full bg-[#8b6914] text-white flex items-center justify-center shadow-md absolute z-10 hover:scale-110 transition-transform">
                    <span className="text-white text-xs pl-0.5 font-bold">▶</span>
                  </div>
                </div>
              )}
            </div>

            <div className="main-image-view">
              {activeMediaType === 'video' && product.video?.url ? (
                <video
                  src={product.video.url}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                selectedImage && (
                  <Image
                    src={selectedImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                )
              )}
            </div>
          </div>

          {/* RIGHT: INFO DETAILS */}
          <div className="info-container">
            {/* Sticker / Badge */}
            <div className="mb-3">
              <span className="inline-block bg-[#f4ebd0] text-[#8b6914] border border-[#8b6914]/30 text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full">
                {product.stickerEnabled && product.stickerText ? product.stickerText : 'NEW ARRIVAL'}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-['Cinzel',serif] text-3xl md:text-4xl font-medium text-[#1a1209] mb-1.5 tracking-wide lining-nums">
              {product.title}
            </h1>

            {/* Sub-header */}
            <p className="text-xs md:text-sm text-[#1a1209]/60 mb-4 font-['Jost',sans-serif]">
              {getProductGender(product) === 'Ladies' ? "Women's Watch" : "Men's Watch"} | Classic Collection
            </p>

            {/* Reviews Rating Row */}
            <div className="flex items-center gap-2 mb-4 text-xs">
              <div className="flex gap-0.5 text-[#dfb15b]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-sm">★</span>
                ))}
              </div>
              <span className="font-semibold text-[#1a1209]">
                {reviewsStats.count > 0 ? reviewsStats.average : '4.8'}
              </span>
              <span className="text-[#1a1209]/50">
                ({reviewsStats.count > 0 ? reviewsStats.count : '125'} reviews)
              </span>
            </div>

            {/* Price Tag & Tax Notice */}
            <div className="mb-6">
              <div className="font-['Cinzel',serif] text-2xl md:text-3xl font-semibold text-[#8b6914] lining-nums">
                {convertPrice(product.price)}
              </div>
              <span className="text-[11px] text-[#1a1209]/50 italic block mt-0.5">
                Inclusive of all taxes
              </span>
            </div>

            {/* Color Variants Circle Swatches */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1a1209]/70 mb-2.5">
                  COLOR: <span className="text-[#8b6914]">{selectedVariant?.colorName || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {product.colorVariants.map((variant) => {
                    const isSelected = selectedVariant?.colorName === variant.colorName;
                    return (
                      <button
                        key={variant.colorName}
                        onClick={() => handleVariantSelect(variant)}
                        title={variant.colorName}
                        className={`w-9 h-9 rounded-full p-0.5 border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected ? 'border-[#8b6914] ring-2 ring-[#8b6914]/30 scale-105' : 'border-[#1a1209]/15 hover:border-[#8b6914]/60'
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

            {/* Stock Level Status */}
            <div className="flex items-center gap-2 mb-6 text-xs font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${isSoldOut ? 'bg-red-600' : 'bg-emerald-600 animate-pulse'}`} />
              <span className={isSoldOut ? 'text-red-700' : 'text-emerald-700'}>
                {isSoldOut ? 'Out of Stock' : 'In Stock — Delivery in 2-3 days'}
              </span>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="py-3.5 px-4 bg-[#1a1209] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-[#8b6914] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ADD TO CART</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="py-3.5 px-4 bg-[#8b6914] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-[#a07d1a] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSoldOut ? 'OUT OF STOCK' : 'BUY NOW'}
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-white rounded-xl border border-[#8b6914]/20 mb-6 text-[11px] text-[#1a1209]/80 font-medium text-center">
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>1 Year Warranty</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 border-x border-[#1a1209]/10">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>100% Authentic</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Secure Payment</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1a1209] mb-2">
                Product Description
              </h3>
              <p className="text-xs md:text-sm text-[#1a1209]/75 leading-relaxed font-['Jost',sans-serif]">
                {product.description || `The ${product.title} is a bold statement of elegance and precision. Featuring a striking custom dial, premium stainless steel build, and scratch-resistant glass, this timepiece is engineered for those who value style and reliability.`}
              </p>
            </div>

            {/* Accordion Panel */}
            <div className="border-t border-[#1a1209]/10 space-y-2 pt-2 mb-6">
              {/* SPECIFICATIONS */}
              <div className="border-b border-[#1a1209]/08 pb-2">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="w-full py-2.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-[#1a1209] cursor-pointer"
                >
                  <span>SPECIFICATIONS</span>
                  <span className="text-[#8b6914] text-base">{detailsOpen ? '−' : '+'}</span>
                </button>
                {detailsOpen && (
                  <div className="text-xs text-[#1a1209]/70 pt-1 pb-2 space-y-1.5 leading-relaxed">
                    <p>Handcrafted using selected premium materials with Japanese movement reliability.</p>
                    {specs.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 pt-3">
                        {specs.map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between border-b border-[#8b6914]/15 pb-2">
                            <span className="text-[11px] font-semibold text-[#8b6914] uppercase tracking-wider font-['Jost',sans-serif]">
                              {label}
                            </span>
                            <span className="text-xs font-medium text-[#1a1209] capitalize font-['Jost',sans-serif]">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SHIPPING & RETURNS */}
              <div className="border-b border-[#1a1209]/08 pb-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOpen(!deliveryOpen)}
                  className="w-full py-2.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-[#1a1209] cursor-pointer"
                >
                  <span>SHIPPING & RETURNS</span>
                  <span className="text-[#8b6914] text-base">{deliveryOpen ? '−' : '+'}</span>
                </button>
                {deliveryOpen && (
                  <div className="text-xs text-[#1a1209]/70 pt-1 pb-2 leading-relaxed">
                    Enjoy FREE island-wide delivery in Sri Lanka on all orders. Returns are accepted within 7 days of delivery in pristine, unworn condition with original packaging.
                  </div>
                )}
              </div>

              {/* CARE INSTRUCTIONS */}
              <div className="border-b border-[#1a1209]/08 pb-2">
                <button
                  type="button"
                  onClick={() => setWarrantyOpen(!warrantyOpen)}
                  className="w-full py-2.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-[#1a1209] cursor-pointer"
                >
                  <span>CARE INSTRUCTIONS</span>
                  <span className="text-[#8b6914] text-base">{warrantyOpen ? '−' : '+'}</span>
                </button>
                {warrantyOpen && (
                  <div className="text-xs text-[#1a1209]/70 pt-1 pb-2 leading-relaxed">
                    Avoid magnetic fields and extreme temperature variations. Clean casing and bracelet gently with a soft microfiber cloth. Free 1-year battery replacement & servicing available nationwide.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── LOWER SECTION: THE TIMEPIECE IN FOCUS ── */}
        <section className="max-w-[1300px] mx-auto mt-20 mb-16 pt-12 border-t border-[#8b6914]/20 text-center">
          <h2 className="font-['Cinzel',serif] text-2xl md:text-4xl font-medium text-[#1a1209] mb-8 tracking-wide">
            The Timepiece in Focus
          </h2>

          {/* Large Video Banner OR 3-Column Image Grid (When No Video Available) */}
          {product.video?.url ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[#8b6914]/30 shadow-2xl bg-black max-w-4xl mx-auto mb-10">
              <video
                src={product.video.url}
                controls
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative max-w-5xl mx-auto mb-10 px-2 sm:px-4">
              {/* FLOWER / FAN PETAL COVERFLOW CAROUSEL */}
              <div className="flex items-center justify-center gap-1 sm:gap-4 py-4 min-h-[300px] sm:min-h-[380px]">
                {[0, 1, 2].map((idx) => {
                  const imgSrc = galleryImages[idx] || galleryImages[0] || '/winsor_man.png';
                  const isCenter = idx === focusSlideIdx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setFocusSlideIdx(idx)}
                      className={`relative cursor-pointer transition-all duration-500 ease-out rounded-2xl overflow-hidden bg-white border flex items-center justify-center p-3 sm:p-5 ${
                        isCenter
                          ? 'w-[68vw] sm:w-[300px] md:w-[320px] aspect-[4/5] z-20 scale-100 opacity-100 shadow-2xl border-[#8b6914]/40 ring-2 ring-[#8b6914]/25'
                          : 'w-[45vw] sm:w-[200px] md:w-[240px] aspect-[4/5] z-10 scale-90 opacity-70 shadow-md hover:opacity-90 border-[#1a1209]/08'
                      }`}
                      style={{
                        transform: `scale(${isCenter ? 1 : 0.88}) translateY(${isCenter ? '0px' : '8px'})`,
                        filter: isCenter ? 'none' : 'brightness(0.96)'
                      }}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={imgSrc}
                          alt={`${product.title} focus ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 70vw, 33vw"
                          className="object-contain transition-transform duration-500 hover:scale-105"
                        />
                      </div>

                      {/* Center Focus Badge Icon (No Text) */}
                      {isCenter && (
                        <div className="absolute top-3 right-3 bg-[#8b6914] text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-md border border-white/30 backdrop-blur-sm">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Interactive Navigation Dots */}
              <div className="flex justify-center items-center gap-2 mt-2 mb-6">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFocusSlideIdx(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer border-none ${
                      focusSlideIdx === idx
                        ? 'w-7 h-2 bg-[#8b6914]'
                        : 'w-2 h-2 bg-[#1a1209]/20 hover:bg-[#8b6914]/50'
                    }`}
                    aria-label={`View focus shot ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4-Column Feature Bar Below Video — Dynamic & Authentic Specifications (2x2 Mobile Grid) */}
          {(() => {
            const specs = product.specifications || {};
            const getVal = (keys: string[]) => {
              for (const k of Object.keys(specs)) {
                if (keys.some(key => k.toLowerCase().includes(key.toLowerCase()))) {
                  return specs[k];
                }
              }
              return null;
            };

            const caseMat = getVal(['case', 'material', 'build']);
            const glassMat = getVal(['glass', 'crystal', 'lens', 'dial']);
            
            const rawWaterRes = getVal(['water', 'atm', 'depth', 'resistant']);
            const waterRes = (!rawWaterRes || rawWaterRes.toLowerCase() === 'no' || rawWaterRes.toLowerCase() === 'none') ? 'Water Resistant' : rawWaterRes;
            
            const movement = getVal(['movement', 'engine', 'mechanism']);

            const dynamicFeatures = [
              {
                title: 'Craft & Build',
                desc: caseMat || 'Dubai Certified Quality',
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: 'Dial & Glass',
                desc: glassMat || 'Protective Dial Glass',
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9z" />
                  </svg>
                )
              },
              {
                title: 'Water Protection',
                desc: waterRes,
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 007 7z" />
                  </svg>
                )
              },
              {
                title: 'Precision Engine',
                desc: movement || 'Japanese Precision Engine',
                icon: (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )
              }
            ];

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto text-left px-2 sm:px-0">
                {dynamicFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 sm:gap-3.5 py-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8b6914]/10 border border-[#8b6914]/30 flex items-center justify-center text-[#8b6914] flex-shrink-0">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-semibold text-[#1a1209] leading-tight">{feat.title}</h4>
                      <p className="text-[9.5px] sm:text-[10.5px] text-[#1a1209]/60 font-['Jost',sans-serif] leading-tight mt-0.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* ── SIDE-BY-SIDE EXPERIENCE & STORY BANNERS (RESPONSIVE FOR MOBILE & DESKTOP) ── */}
        <div className="max-w-[1300px] mx-auto my-8 md:my-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* TOP / LEFT: OUR STORES / FIND A STORE */}
          <div
            className="relative min-h-[170px] sm:min-h-[200px] md:h-[360px] rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex flex-col justify-center md:justify-end p-5 md:p-8 border border-[#8b6914]/25 transition-all duration-300 hover:shadow-2xl"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(10,8,4,0.92) 0%, rgba(10,8,4,0.65) 55%, rgba(10,8,4,0.15) 100%), url('/KCC.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 45%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="relative z-10 text-white space-y-1.5 md:space-y-3">
              <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.2em] text-[#dfb15b] uppercase block">
                OUR STORES
              </span>
              <h3 className="font-['Cinzel',serif] text-lg sm:text-xl md:text-3xl font-medium text-white tracking-wide">
                Experience <span className="text-[#dfb15b]">Winsor</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-white/85 max-w-[240px] sm:max-w-md leading-relaxed font-['Jost',sans-serif]">
                Visit our exclusive stores and explore premium timepieces.
              </p>
              <div className="pt-1.5 md:pt-2">
                <Link
                  href="/retailers"
                  className="inline-block py-2 px-4 md:py-3 md:px-6 bg-[#8b6914] hover:bg-[#a07d1a] text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-semibold tracking-widest uppercase transition-all shadow-md hover:shadow-gold cursor-pointer"
                >
                  FIND A STORE
                </Link>
              </div>
            </div>
          </div>

          {/* BOTTOM / RIGHT: CRAFTED FOR MOMENTS / DISCOVER OUR STORY */}
          <div
            className="relative min-h-[170px] sm:min-h-[200px] md:h-[360px] rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex flex-col justify-center md:justify-end p-5 md:p-8 border border-[#8b6914]/25 transition-all duration-300 hover:shadow-2xl"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(10,8,4,0.92) 0%, rgba(10,8,4,0.65) 55%, rgba(10,8,4,0.15) 100%), url('/actor_actress_winsor.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="relative z-10 text-white space-y-1.5 md:space-y-3">
              <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.2em] text-[#dfb15b] uppercase block">
                HERITAGE & CRAFT
              </span>
              <h3 className="font-['Cinzel',serif] text-lg sm:text-xl md:text-3xl font-medium text-white tracking-wide">
                Crafted for <span className="text-[#dfb15b]">Moments</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-white/85 max-w-[240px] sm:max-w-md leading-relaxed font-['Jost',sans-serif]">
                Timeless designs for every occasion. Every second is a step.
              </p>
              <div className="pt-1.5 md:pt-2">
                <Link
                  href="/our-story"
                  className="inline-block py-2 px-4 md:py-3 md:px-6 bg-transparent border border-white/80 hover:bg-white hover:text-[#1a1209] text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-semibold tracking-widest uppercase transition-all shadow-md cursor-pointer"
                >
                  DISCOVER OUR STORY
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* TIMELESS PAIRINGS */}
        <div className="detail-wrapper pairings-section" style={{ marginTop: '80px', borderTop: '1px solid rgba(26,18,9,0.08)', paddingTop: '60px' }}>
          <div style={{ width: '100%' }}>
            <span className="pairings-tag" style={{ display: 'block', textAlign: 'center', fontSize: '9px', letterSpacing: '0.3em', color: '#8B6914', textTransform: 'uppercase', marginBottom: '8px' }}>
              Style Match
            </span>
            <h3 className="pairings-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500, textAlign: 'center', marginBottom: '6px', letterSpacing: '0.05em' }}>
              Timeless Pairings
            </h3>
            <p className="pairings-desc" style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', marginBottom: '40px' }}>
              Discover watches that complement your style
            </p>

            <div className="pairings-grid">
              {/* Card 1: New Arrivals */}
              <Link href="/collections?section=new" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/category_HomeS/new_arrivals_bg.webp" alt="New Arrivals" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">New Arrivals</h4>
                  <p className="pairing-card-desc">Explore Our Latest Additions</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 2: Classic */}
              <Link href="/collections?section=classic" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/category_HomeS/classic_bg.webp" alt="Classic" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Classic</h4>
                  <p className="pairing-card-desc">Elegance Beyond Time</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 3: Sport */}
              <Link href="/collections?section=sports" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/category_HomeS/sport_bg.webp" alt="Sport" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Sport</h4>
                  <p className="pairing-card-desc">Built for Performance</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 4: Limited Edition */}
              <Link href="/collections?section=limited" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/category_HomeS/limitted_bg.webp" alt="Limited Edition" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Limited Edition</h4>
                  <p className="pairing-card-desc">Exclusivity at Its Finest</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* DYNAMIC SUGGESTIONS LIST (If any) */}
        {suggestions.length > 0 && (
          <div className="detail-wrapper suggestions-section">
            <div style={{ width: '100%' }}>
              <h3>Suggested Timepieces</h3>
              <div className="suggestions-grid">
                {suggestions.map((p) => {
                  const gender = getProductGender(p);
                  return (
                    <Link
                      key={p._id}
                      href={`/collections/${p._id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      className="suggested-card"
                    >
                      <div className="suggested-img-container">
                        {p.thumbnail?.url && (
                          <Image
                            src={p.thumbnail.url}
                            alt={p.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
                            className="suggested-img"
                          />
                        )}
                      </div>
                      <div style={{ padding: '12px 4px 4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(26,18,9,0.4)', display: 'block', marginBottom: '4px' }}>
                          {gender}
                        </span>
                        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 500, margin: '0 0 6px', color: '#1a1209' }}>
                          {p.title}
                        </h4>
                        <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#8B6914' }}>
                          {convertPrice(p.price)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER REVIEWS SECTION */}
        <div className="detail-wrapper reviews-section" style={{ marginTop: '80px', borderTop: '1px solid rgba(26,18,9,0.08)', paddingTop: '60px' }}>
          <div style={{ width: '100%' }}>
            <span style={{ display: 'block', textAlign: 'center', fontSize: '9px', letterSpacing: '0.3em', color: '#8B6914', textTransform: 'uppercase', marginBottom: '8px' }}>
              Verified Feedback
            </span>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 500, textAlign: 'center', marginBottom: '6px', letterSpacing: '0.05em' }}>
              Customer Reviews
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', marginBottom: '40px' }}>
              What our patrons have to say about this timepiece
            </p>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(26,18,9,0.12)', borderRadius: '8px' }}>
                <p style={{ fontSize: '14.5px', color: 'rgba(26,18,9,0.5)', margin: 0 }}>
                  No reviews submitted yet for this timepiece.
                </p>
              </div>
            ) : (() => {
              // Compute filtered reviews
              const filteredRevs = reviews.filter(r => {
                if (reviewFilter === 'photos') return r.images && r.images.length > 0;
                if (typeof reviewFilter === 'number') return Math.round(r.rating) === reviewFilter;
                return true;
              });

              // Take initial 5 or expanded visible count
              const visibleRevs = filteredRevs.slice(0, visibleReviewsCount);
              const allPhotoUrls = reviews.flatMap(r => r.images || []);

              return (
                <div className="reviews-layout-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '48px', alignItems: 'flex-start' }}>

                  {/* ── LEFT: Summary Sidebar ── */}
                  <div className="rev-summary-sidebar" style={{ background: '#FAF7F0', border: '1px solid rgba(26,18,9,0.07)', borderRadius: '16px', padding: '28px', position: 'sticky', top: '100px' }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1209', borderBottom: '1px solid rgba(26,18,9,0.07)', paddingBottom: '14px' }}>Rating Summary</h4>

                    {/* Big score */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '60px', fontWeight: 500, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1, color: '#1a1209' }}>{reviewsStats.average}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '8px 0 6px' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.round(reviewsStats.average) ? '#8B6914' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: 'rgba(26,18,9,0.45)' }}>{reviewsStats.count} verified review{reviewsStats.count !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Distribution bars — also act as filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' }}>
                      {([5, 4, 3, 2, 1] as const).map(stars => {
                        const count = starDistribution[stars] || 0;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        const isActive = reviewFilter === stars;
                        return (
                          <button
                            key={stars}
                            onClick={() => { setReviewFilter(isActive ? 'all' : stars); setVisibleReviewsCount(5); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', background: isActive ? 'rgba(139,105,20,0.08)' : 'none', border: isActive ? '1px solid rgba(139,105,20,0.3)' : '1px solid transparent', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}
                          >
                            <span style={{ width: '38px', color: 'rgba(26,18,9,0.7)', fontWeight: 600, fontFamily: "'Jost',sans-serif", fontSize: '11px' }}>{stars} ★</span>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(26,18,9,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#8B6914', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ width: '22px', textAlign: 'right', color: 'rgba(26,18,9,0.4)', fontSize: '11px' }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Horizontal Scroll Photo gallery strip */}
                    {allPhotoUrls.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Customer Photos ({allPhotoUrls.length})</span>
                          {allPhotoUrls.length > 3 && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => scrollPhotos('left')}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(26,18,9,0.2)', background: '#fff', color: '#1a1209', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Scroll Left"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() => scrollPhotos('right')}
                                style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid rgba(26,18,9,0.2)', background: '#fff', color: '#1a1209', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Scroll Right"
                              >
                                ›
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Horizontal Scroll Container */}
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
                              onClick={() => { setLightboxImg(url); setReviewFilter('photos'); setVisibleReviewsCount(5); }}
                              className="rev-img-thumb"
                              style={{ width: '68px', height: '68px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid rgba(26,18,9,0.1)', cursor: 'pointer', padding: 0, background: '#fff', flexShrink: 0, transition: 'all 0.2s' }}
                            >
                              <img src={url} alt={`Review photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => { setReviewFilter('photos'); setVisibleReviewsCount(5); }}
                          style={{ marginTop: '10px', width: '100%', background: reviewFilter === 'photos' ? '#8B6914' : 'transparent', color: reviewFilter === 'photos' ? '#fff' : '#8B6914', border: '1.5px solid #8B6914', borderRadius: '8px', padding: '9px 14px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'Jost',sans-serif" }}
                        >
                          {reviewFilter === 'photos' ? '✓ Showing Photos Only' : 'Show Reviews with Photos'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT: Filter Tabs + Cards ── */}
                  <div>
                    {/* Filter pill row */}
                    <div className="rev-filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                      {(['all', 'photos', 5, 4, 3, 2, 1] as const).map(f => {
                        const label = f === 'all' ? `All (${reviews.length})` : f === 'photos' ? `📷 With Photos (${allPhotoUrls.length})` : `${'★'.repeat(f)} ${f} Star (${starDistribution[f as 1 | 2 | 3 | 4 | 5] || 0})`;
                        const isActive = reviewFilter === f;
                        return (
                          <button
                            key={String(f)}
                            className="rev-filter-btn"
                            onClick={() => { setReviewFilter(f); setVisibleReviewsCount(5); }}
                            style={{ padding: '7px 14px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 600, fontFamily: "'Jost',sans-serif", letterSpacing: '0.05em', cursor: 'pointer', border: isActive ? '1.5px solid #8B6914' : '1.5px solid rgba(26,18,9,0.12)', background: isActive ? '#8B6914' : '#fff', color: isActive ? '#fff' : 'rgba(26,18,9,0.7)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Results count */}
                    {filteredRevs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed rgba(26,18,9,0.12)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '14px', color: 'rgba(26,18,9,0.4)', margin: 0 }}>No reviews match this filter.</p>
                        <button onClick={() => { setReviewFilter('all'); setVisibleReviewsCount(5); }} style={{ marginTop: '12px', background: 'none', border: '1px solid rgba(26,18,9,0.2)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', color: '#8B6914', fontWeight: 600 }}>Clear Filter</button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: '12px', color: 'rgba(26,18,9,0.5)', marginBottom: '18px', fontFamily: "'Jost',sans-serif" }}>
                          Showing 1–{Math.min(visibleReviewsCount, filteredRevs.length)} of {filteredRevs.length} review{filteredRevs.length !== 1 ? 's' : ''}
                        </p>

                        {/* Review cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                          {visibleRevs.map((rev, idx) => {
                            const dispName = rev.isAnonymous ? maskReviewerName(rev.username) : rev.username;
                            return (
                              <div
                                key={idx}
                                className="rev-card"
                                style={{ padding: '20px 0', borderBottom: '1px solid rgba(26,18,9,0.07)', display: 'flex', gap: '14px' }}
                              >
                                {/* Avatar */}
                                <div style={{ flexShrink: 0 }}>
                                  {rev.isAnonymous || !rev.userAvatar ? (
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B6914, #b8922a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '17px', textTransform: 'uppercase', fontFamily: "'Jost',sans-serif", flexShrink: 0 }}>
                                      {dispName ? dispName[0] : 'C'}
                                    </div>
                                  ) : (
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(139,105,20,0.2)', flexShrink: 0 }}>
                                      <img src={rev.userAvatar} alt={dispName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
                                    <div>
                                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1209', fontFamily: "'Jost',sans-serif" }}>{dispName}</span>
                                      <span style={{ marginLeft: '8px', fontSize: '10px', color: '#8B6914', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>✓ Verified Purchase</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.35)', fontFamily: "'Jost',sans-serif", flexShrink: 0 }}>
                                      {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>

                                  {/* Stars */}
                                  <div style={{ display: 'flex', gap: '3px', marginBottom: '10px', alignItems: 'center' }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rev.rating ? '#8B6914' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    ))}
                                    <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.45)', marginLeft: '4px', fontFamily: "'Jost',sans-serif" }}>{rev.rating}/5</span>
                                  </div>

                                  {/* Comment */}
                                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', lineHeight: 1.65, color: 'rgba(26,18,9,0.72)', fontFamily: "'Jost',sans-serif" }}>{rev.comment}</p>

                                  {/* Images */}
                                  {rev.images && rev.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      {rev.images.map((url: string, i: number) => (
                                        <button
                                          key={i}
                                          onClick={() => setLightboxImg(url)}
                                          className="rev-img-thumb"
                                          style={{ width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid rgba(26,18,9,0.08)', cursor: 'pointer', padding: 0, background: 'none', transition: 'border-color 0.2s, transform 0.2s', flexShrink: 0 }}
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

                        {/* SEE MORE REVIEWS BUTTON */}
                        {visibleReviewsCount < filteredRevs.length && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                            <button
                              onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                              style={{
                                padding: '13px 32px',
                                background: '#1a1209',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 14px rgba(26,18,9,0.18)',
                                transition: 'all 0.25s ease'
                              }}
                              className="hover:bg-[#8b6914] transition-colors"
                            >
                              <span>SEE MORE REVIEWS</span>
                              <span style={{ color: '#dfb15b', fontWeight: 500 }}>({visibleReviewsCount} of {filteredRevs.length})</span>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
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
        </div>

        {/* LIGHTBOX */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out', backdropFilter: 'blur(4px)' }}
          >
            <button
              onClick={() => setLightboxImg(null)}
              style={{ position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '44px', height: '44px', color: '#fff', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, lineHeight: 1, transition: 'background 0.2s' }}
            >✕</button>
            <img
              src={lightboxImg}
              alt="Review photo"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', cursor: 'default' }}
            />
          </div>
        )}

        {/* FEATURES FOOTER BANNER */}
        <div className="features-footer-banner">
          <div className="features-footer-grid">
            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              <div>
                <h4>FREE ISLAND-WIDE SHIPPING</h4>
                <p>Island-wide free delivery in Sri Lanka</p>
              </div>
            </div>

            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
              <div>
                <h4>Easy Returns</h4>
                <p>Easy Return Within 7 Days</p>
              </div>
            </div>

            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <div>
                <h4>Genuine Products</h4>
                <p>100% Authentic</p>
              </div>
            </div>

            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <div>
                <h4>Secure Payments</h4>
                <p>100% Secure Checkout with payhere.lk</p>
              </div>
            </div>
          </div>
        </div>

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
            productThumbnail: product.thumbnail?.url || '',
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
            productThumbnail: product.thumbnail?.url || '',
            colorVariant: selectedVariant?.colorName,
            quantity: 1,
            price: product.price,
          }}
          profile={buyerProfile}
          onOrderSuccess={() => {
            // Keep modal open so step 4 success popup (ref code + copy button + PDF receipt) is shown
          }}
        />
      )}

    </>
  );
}
