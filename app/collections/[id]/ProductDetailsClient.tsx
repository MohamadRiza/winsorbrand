'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Cart Mock Interaction States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);

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

  // Helper to determine product gender (Gents / Ladies / Unisex)
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

  // Real Add to Cart trigger
  const handleAddToCart = () => {
    if (!product) return;
    const colorVariantName = selectedVariant?.colorName || '';
    addToCart(product._id!, 1, colorVariantName, product);

    const variantStr = selectedVariant ? ` (${selectedVariant.colorName})` : '';
    setToastMessage(`"${product.title}${variantStr}" has been added to your cart.`);
    setShowToast(true);
  };

  // Real Buy Now trigger
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
        }
        .thumbnail-item {
          aspect-ratio: 1;
          border-radius: 4px;
          border: 1px solid rgba(26, 18, 9, 0.06);
          background-color: rgba(26, 18, 9, 0.01);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
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
          border-radius: 6px;
          border: 1px solid rgba(26, 18, 9, 0.04);
          background-color: rgba(26, 18, 9, 0.02);
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
          background: #8B6914;
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
          font-size: 40px;
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 4px;
          color: #1a1209;
        }
        .model-no {
          font-size: 12px;
          color: rgba(26, 18, 9, 0.45);
          letter-spacing: 0.05em;
          margin-bottom: 24px;
        }
        .detail-price {
          font-size: 26px;
          font-weight: 500;
          color: #8B6914;
          margin-bottom: 28px;
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
          margin-bottom: 30px;
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
          margin-bottom: 32px;
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

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(26, 18, 9, 0.5);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-decoration: none;
          margin-top: auto;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #8b6914;
        }

        /* SPECS TABLE & TABS */
        .specs-section {
          margin-top: 48px;
          border-top: 1px solid rgba(26,18,9,0.08);
          padding-top: 40px;
        }
        .specs-section h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .spec-item {
          display: flex;
          flex-direction: column;
          padding: 12px 0;
          border-bottom: 1px solid rgba(26, 18, 9, 0.05);
        }
        .spec-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(26, 18, 9, 0.4);
          margin-bottom: 4px;
        }
        .spec-value {
          font-size: 13.5px;
          color: #1a1209;
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
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .large-gallery-item {
          width: 100%;
          position: relative;
          aspect-ratio: 1.5;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(26,18,9,0.04);
          border: 1px solid rgba(26,18,9,0.03);
          background-color: rgba(26,18,9,0.01);
        }
        .large-gallery-video-item {
          width: 100%;
          aspect-ratio: 1.777;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(26,18,9,0.04);
          background: #000;
          margin-bottom: 20px;
        }
        .large-video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
          border-radius: 4px;
          overflow: hidden;
          background: rgba(26,18,9,0.02);
          border: 1px solid rgba(26, 18, 9, 0.03);
        }
        .suggested-card:hover .suggested-img {
          transform: scale(1.05);
        }
        .suggested-card:hover {
          transform: translateY(-4px);
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

        /* Responsive */
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
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
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
          .suggestions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      <div className={`toast-box ${showToast ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
            {/* Brand and Sticker */}
            <span className="brand-label">{product.brand}</span>
            {product.stickerEnabled && product.stickerText && (
              <span className="detail-sticker">{product.stickerText}</span>
            )}

            {/* Title */}
            <h1 className="detail-title">{product.title}</h1>
            <div className="model-no">Model Number: {product.modelNo}</div>

            {/* Price */}
            <div className="detail-price">{convertPrice(product.price)}</div>

            {/* Color Variants */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div>
                <h3 className="swatch-label">
                  Variant: <span style={{ color: '#1a1209', fontWeight: 500 }}>{selectedVariant?.colorName || ''}</span>
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
                style={{ backgroundColor: isSoldOut ? 'rgba(26,18,9,0.3)' : '#2e7d32' }}
              />
              <span style={{ color: isSoldOut ? 'rgba(26,18,9,0.6)' : '#2e7d32' }}>
                {isSoldOut ? 'Sold Out' : `In Stock ${selectedVariant && selectedVariant.qty < 5 ? `(Only ${selectedVariant.qty} left)` : ''}`}
              </span>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="actions-buttons-container">
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="cart-action-btn"
              >
                {isSoldOut ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="buy-now-btn"
              >
                {isSoldOut ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(26,18,9,0.7)', margin: '0 0 24px' }}>
              {product.description}
            </p>

            {/* Warranty Details */}
            {product.warranty && product.warranty !== 'no_warranty' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#8B6914', marginBottom: '24px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Winsor Warranty: {WARRANTY_LABELS[product.warranty]}</span>
              </div>
            )}

            {/* Back to Catalog */}
            <Link href="/collections" className="back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Collections
            </Link>
          </div>
        </div>

        {/* BOTTOM: SPECIFICATIONS TABLE */}
        {specs.length > 0 && (
          <div className="detail-wrapper specs-section">
            <div style={{ width: '100%' }}>
              <h3>Timepiece Specifications</h3>
              <div className="specs-grid">
                {specs.map(([label, value]) => (
                  <div key={label} className="spec-item">
                    <span className="spec-label">{label}</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LARGE IMAGES DETAILS GRID */}
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
                {galleryImages.map((imgUrl, i) => (
                  <div key={i} className="large-gallery-item">
                    <Image
                      src={imgUrl}
                      alt={`${product.title} detailed zoom ${i}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 1000px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUGGESTED WATCHES / Timeless Pairings */}
        {suggestions.length > 0 && (
          <div className="detail-wrapper suggestions-section">
            <div style={{ width: '100%' }}>
              <h3>Timeless Pairings</h3>
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

      </div>
    </>
  );
}
