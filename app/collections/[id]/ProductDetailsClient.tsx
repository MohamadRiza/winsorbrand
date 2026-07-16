'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { IProduct, ColorVariant, WARRANTY_LABELS } from '@/types';
import { useCart } from '@/app/context/CartContext';
import { useRouter } from 'next/navigation';

interface ProductDetailsClientProps {
  id: string;
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const { convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const router = useRouter();

  // API States
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery and Selection States
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);

  // Cart Interaction States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);

  // Accordion States
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

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

  // Buy Now
  const handleBuyNow = () => {
    if (!product) return;
    const colorVariantName = selectedVariant?.colorName || '';
    addToCart(product._id!, 1, colorVariantName, product);
    router.push('/cart');
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
          gap: 12px;
          margin-bottom: 24px;
        }
        .swatch-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(26, 18, 9, 0.15);
          padding: 2px;
          background: none;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .swatch-btn:hover {
          transform: scale(1.08);
        }
        .swatch-btn.active {
          border-color: #8B6914;
          transform: scale(1.08);
        }
        .swatch-fill {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
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
        .brand-banner-logo {
          margin-bottom: 24px;
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
            grid-template-columns: 1fr;
            gap: 16px;
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
            padding-left: 24px;
            padding-right: 24px;
            height: 380px;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .brand-banner-overlay {
            background: rgba(26,18,9,0.8);
          }
          .brand-banner-title {
            font-size: 32px;
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
        <div className="detail-wrapper">

          {/* LEFT: GALLERY */}
          <div className="gallery-container">
            <div className="thumbnails-column">
              {galleryImages.map((imgUrl, i) => (
                <div
                  key={i}
                  className={`thumbnail-item ${selectedImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
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
            </div>

            <div className="main-image-view">
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              )}
            </div>
          </div>

          {/* RIGHT: INFO DETAILS */}
          <div className="info-container">
            {/* Brand */}
            <span className="brand-label">{product.brand}</span>

            {/* Sticker */}
            {product.stickerEnabled && product.stickerText && (
              <span className="detail-sticker">{product.stickerText}</span>
            )}

            {/* Title */}
            <h1 className="detail-title">{product.title}</h1>

            {/* Tagline */}
            <p className="detail-subtitle">Timeless Elegance for Every Space</p>

            {/* Model Number */}
            <div className="model-no">Model Number: {product.modelNo}</div>

            {/* Price */}
            <div className="detail-price">{convertPrice(product.price)}</div>

            {/* Color Variants */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div>
                <h3 className="swatch-label">
                  Variants : {product.colorVariants.length} Size / Color
                </h3>
                <div className="swatches-row">
                  {product.colorVariants.map((variant) => (
                    <button
                      key={variant.colorName}
                      className={`swatch-btn ${selectedVariant?.colorName === variant.colorName ? 'active' : ''}`}
                      onClick={() => handleVariantSelect(variant)}
                      title={variant.colorName}
                    >
                      <div className="swatch-fill" style={{ backgroundColor: variant.colorHex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Level Status */}
            <div className="stock-badge">
              <div
                className="stock-dot"
                style={{ backgroundColor: isSoldOut ? '#d32f2f' : '#2e7d32' }}
              />
              <span style={{ color: isSoldOut ? '#d32f2f' : '#2e7d32', fontSize: '13px', fontWeight: 500 }}>
                {isSoldOut ? '● Out of Stock' : `● In Stock – Delivery in 2-3 days`}
              </span>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="actions-buttons-container">
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="cart-action-btn"
              >
                <span>Add to Cart</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="buy-now-btn"
              >
                {isSoldOut ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            {/* Three inline trust badges */}
            <div className="features-badge-bar">
              <span>🛡️ 100% Genuine</span>
              <span>⏰ {product.warranty && product.warranty !== 'no_warranty' ? WARRANTY_LABELS[product.warranty] : '1 Year Warranty'}</span>
              <span>🔒 Secure Payment</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(26,18,9,0.7)', margin: '0 0 20px' }}>
              {product.description}
            </p>

            {/* Accordion Panel */}
            <div className="accordion-section" style={{ marginTop: '10px', borderTop: '1px solid rgba(26,18,9,0.08)' }}>
              {/* Product Details */}
              <div style={{ borderBottom: '1px solid rgba(26,18,9,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="accordion-header"
                >
                  <span>Product Details</span>
                  <span>{detailsOpen ? '−' : '+'}</span>
                </button>
                {detailsOpen && (
                  <div className="accordion-content">
                    <p>Experience precision craftsmanship built to stand the test of time. Handcrafted using selected premium materials with attention to every minute detail.</p>
                    {specs.length > 0 && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                        {specs.map(([label, value]) => (
                          <li key={label} style={{ fontSize: '12.5px', color: 'rgba(26,18,9,0.7)', marginBottom: '4px' }}>
                            <strong>{label}:</strong> {value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Warranty Information */}
              <div style={{ borderBottom: '1px solid rgba(26,18,9,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setWarrantyOpen(!warrantyOpen)}
                  className="accordion-header"
                >
                  <span>Warranty Information</span>
                  <span>{warrantyOpen ? '−' : '+'}</span>
                </button>
                {warrantyOpen && (
                  <div className="accordion-content">
                    <p>Every Winsor timepiece is accompanied by a 1-Year or 2-Year international warranty, securing your investment against any manufacturing anomalies. Service and repair are provided directly by our master horologists.</p>
                  </div>
                )}
              </div>

              {/* Delivery & Returns */}
              <div style={{ borderBottom: '1px solid rgba(26,18,9,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryOpen(!deliveryOpen)}
                  className="accordion-header"
                >
                  <span>Delivery & Returns</span>
                  <span>{deliveryOpen ? '−' : '+'}</span>
                </button>
                {deliveryOpen && (
                  <div className="accordion-content">
                    <p>Enjoy free secured worldwide express shipping on all orders. Returns are accepted within 14 days of delivery, provided the item is in pristine, unworn condition with its original packaging intact.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Back to Catalog */}
            <Link href="/collections" className="back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back to Collections
            </Link>
          </div>
        </div>

        {/* BOTTOM: THE TIMEPIECE IN FOCUS */}
        {galleryImages.length > 0 && (
          <div className="detail-wrapper large-gallery-section">
            <div style={{ width: '100%' }}>
              <h3>The Timepiece in Focus</h3>

              {/* Product video if uploaded */}
              {product.video?.url && (
                <div className="large-gallery-video-item">
                  <video
                    src={product.video.url}
                    controls
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="large-video-element"
                  />
                </div>
              )}

              <div className="large-gallery-container">
                {/* Take up to 3 gallery images or supplement with fallback */}
                {(galleryImages.slice(0, 3).length >= 3
                  ? galleryImages.slice(0, 3)
                  : [...galleryImages, "/watch-conquest.jpg", "/watch-gmt.jpg"].slice(0, 3)
                ).map((imgUrl, i) => (
                  <div key={i} className="large-gallery-item">
                    <Image
                      src={imgUrl}
                      alt={`${product.title} detailed zoom ${i}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OUR STORES EXPERIENCE */}
        <div className="store-banner-wrapper">
          <div className="store-banner-container">
            <Image
              src="/KCC.webp"
              alt="Winsor store interior"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 45%' }}
            />
            <div className="store-banner-overlay" />
            <div className="store-banner-content">
              <span className="store-banner-tag">OUR STORES</span>
              <h2 className="store-banner-title">
                Experience <span style={{ color: '#dfb15b', fontWeight: 'inherit' }}>Winsor</span>
              </h2>
              <p className="store-banner-p">
                Visit our exclusive stores and explore premium timepieces crafted for every moment.
              </p>
              <Link href="/customer-care" className="store-banner-btn">
                FIND A STORE
              </Link>
            </div>
          </div>
        </div>

        {/* BRAND BANNER - Crafted for Moments */}
        <div className="brand-banner-wrapper">
          <div className="brand-banner-container">
            <Image
              src="/winsor_man.png"
              alt="Winsor Crafted for Moments"
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            />
            <div className="brand-banner-overlay" />
            <div className="brand-banner-content">
              <div className="brand-banner-logo">
                <Image src="/Winsor.png" alt="Winsor Logo" width={140} height={44} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h2 className="brand-banner-title">Crafted for Moments</h2>
              <p className="brand-banner-p">
                Winsor represents more than time – it represents you. Every second is a step towards your next adventure.
              </p>
              <Link href="/customer-care" className="brand-banner-btn">
                DISCOVER OUR STORY
              </Link>
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
              {/* Card 1: Collections */}
              <Link href="/collections" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/Home1.webp" alt="Collections" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Collections</h4>
                  <p className="pairing-card-desc">Explore Our Premium Collection</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 2: Classic */}
              <Link href="/collections?type=classic" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/mens-watch-highlight.png" alt="Classic" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Classic</h4>
                  <p className="pairing-card-desc">Elegance Beyond Time</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 3: Sport */}
              <Link href="/collections?type=sports" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/watch-gmt.jpg" alt="Sport" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
                </div>
                <div className="pairing-info">
                  <h4 className="pairing-card-title">Sport</h4>
                  <p className="pairing-card-desc">Built for Performance</p>
                  <span className="pairing-card-link">VIEW ALL</span>
                </div>
              </Link>

              {/* Card 4: Limited Edition */}
              <Link href="/collections?type=limited" className="pairing-card">
                <div className="pairing-img-container">
                  <Image src="/gifts-highlight.png" alt="Limited Edition" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="pairing-img" />
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

        {/* FEATURES FOOTER BANNER */}
        <div className="features-footer-banner">
          <div className="features-footer-grid">
            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              <div>
                <h4>Free Shipping</h4>
                <p>On All Orders</p>
              </div>
            </div>

            <div className="feature-footer-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
              <div>
                <h4>Easy Returns</h4>
                <p>14-Day Return Policy</p>
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
                <p>Protected Checkout</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
