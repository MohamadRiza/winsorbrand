'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

// ── Types ─────────────────────────────────────────────────────────────────
interface GiftCategory {
  _id:       string;
  slug:      string;
  label:     string;
  emoji:     string;
  sortOrder: number;
}
interface CloudinaryAsset { url: string; publicId: string; }
interface ColorVariant    { colorName: string; colorHex: string; qty: number; }
interface GiftProduct {
  _id:            string;
  title:          string;
  modelNo:        string;
  price:          number;
  thumbnail:      CloudinaryAsset;
  colorVariants:  ColorVariant[];
  stickerEnabled: boolean;
  stickerText:    string;
  giftCategories: string[];
}

// ── Background Images ─────────────────────────────────────────────────────
const BACKGROUND_IMAGES = [
  '/gif2.jpeg',
  '/gif2.jpeg', 
  '/gif2.jpeg',
  '/gif2.jpeg',
  '/gif2.jpeg'
];

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard({ id }: { id: string }) {
  return (
    <div key={id} style={{ 
      minWidth: '260px', 
      maxWidth: '260px',
      flexShrink: 0,
      display:'flex', 
      flexDirection:'column', 
      gap:'12px',
      background: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{ aspectRatio:'3/4', background:'rgba(26,18,9,0.06)', animation:'gft-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'10px', width:'40%', background:'rgba(26,18,9,0.06)', animation:'gft-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'14px', width:'75%', background:'rgba(26,18,9,0.06)', animation:'gft-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'12px', width:'35%', background:'rgba(26,18,9,0.06)', animation:'gft-pulse 1.5s ease-in-out infinite' }}/>
    </div>
  );
}

// ── Gift watch card ───────────────────────────────────────────────────────
function GiftWatchCard({ product, index }: { product: GiftProduct; index: number }) {
  const { convertPrice } = useCurrency();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/watches/${product._id}`}
      style={{ 
        textDecoration:'none', 
        display:'flex',
        flexDirection: 'column',
        minWidth: '260px',
        maxWidth: '260px',
        flexShrink: 0,
        animationDelay:`${index * 80}ms`,
        background: '#f5f5f5',
        padding: '20px',
      }}
      className="gft-card-fade"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div style={{ 
        position:'relative', 
        aspectRatio:'3/4', 
        overflow:'hidden', 
        background:'#f5f5f5', 
        marginBottom:'16px',
      }}>
        <Image
          src={product.thumbnail.url}
          alt={product.title}
          fill
          sizes="260px"
          style={{
            objectFit:  'contain',
            transform:  hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
        
        {product.stickerEnabled && product.stickerText && (
          <div style={{
            position:'absolute', 
            top:'0', 
            left:'0',
            background: '#ffffff', 
            color: '#1a1a1a',
            fontFamily:"'Jost',sans-serif", 
            fontSize:'9px', 
            fontWeight:500,
            letterSpacing:'0.1em', 
            padding:'6px 12px',
            textTransform:'uppercase',
            border: '1px solid rgba(0,0,0,0.1)',
          }}>
            {product.stickerText}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'left' }}>
        <p style={{
          fontFamily:"'Jost',sans-serif", 
          fontSize:'11px', 
          fontWeight:600,
          letterSpacing:'0.15em', 
          color:'#1a1a1a',
          marginBottom:'8px', 
          textTransform:'uppercase',
        }}>
          {product.modelNo}
        </p>
        
        <h3 style={{
          fontFamily:"'Cormorant Garamond',serif", 
          fontSize:'16px', 
          fontWeight:400,
          letterSpacing:'0.02em', 
          color:'#1a1a1a',
          marginBottom:'12px',
          lineHeight: 1.3,
          minHeight: '42px'
        }}>
          {product.title}
        </h3>
        
        <p style={{
          fontFamily:"'Jost',sans-serif", 
          fontSize:'13px', 
          fontWeight:500,
          letterSpacing:'0.05em', 
          color:'#1a1a1a',
        }}>
          {convertPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

// ── Horizontal scroll track ────────────────────────────────────────────────
function ScrollTrack({ products, loading }: { products: GiftProduct[]; loading: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = 280;
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{
      position: 'relative',
      background: '#f5f5f5',
      padding: '24px 0 40px',
    }}>
      <button
        onClick={() => scrollProducts('left')}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #e0e0e0',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontSize: '16px',
          color: '#1a1a1a',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
        aria-label="Scroll products left"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        style={{
          display:'flex',
          gap:'16px',
          overflowX:'auto',
          padding: '0 60px',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingLeft: '16px',
          scrollPaddingRight: '16px',
        }}
        className="hide-scrollbar"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} id={`sk${i}`} />)
          : products.map((p, i) => (
              <GiftWatchCard key={p._id} product={p} index={i} />
            ))
        }
      </div>

      <button
        onClick={() => scrollProducts('right')}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #e0e0e0',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontSize: '16px',
          color: '#1a1a1a',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
        aria-label="Scroll products right"
      >
        ›
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GiftSection() {
  const [categories,      setCategories]      = useState<GiftCategory[]>([]);
  const [activeSlug,      setActiveSlug]      = useState('');
  const [products,        setProducts]        = useState<GiftProduct[]>([]);
  const [loadingCats,     setLoadingCats]     = useState(true);
  const [loadingProds,    setLoadingProds]    = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  const getRandomBackground = () => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[randomIndex];
  };

  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCats(true);
      try {
        const res  = await fetch('/api/gift-categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCategories(data.data);
          setActiveSlug(data.data[0].slug);
          setBackgroundImage(getRandomBackground());
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (activeSlug) {
      setBackgroundImage(getRandomBackground());
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!activeSlug) return;
    
    const fetchProds = async () => {
      setLoadingProds(true);
      setProducts([]);
      try {
        const res  = await fetch(`/api/products/gifts?category=${activeSlug.toLowerCase()}&limit=10`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoadingProds(false);
      }
    };
    
    fetchProds();
  }, [activeSlug]);

  const activeCat = categories.find(c => c.slug === activeSlug);

  // 🎨 PERFECTED: Subtle, elegant overlay (much less white)
  const headerStyle = {
    padding: '80px 20px 40px',
    textAlign: 'center' as const,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative' as const,
    transition: 'opacity 0.6s ease-in-out',
  };

  const backgroundStyle = backgroundImage 
    ? `linear-gradient(135deg, 
        rgba(255,255,255,0.75) 0%,      /* Less white at top */
        rgba(245,245,245,0.65) 30%,     /* Subtle fade */
        rgba(235,235,235,0.85) 70%,     /* Stronger coverage bottom */
        rgba(225,225,225,0.95) 100%),   /* Clean base */
        url(${backgroundImage})`
    : '#f8f8f8';

  return (
    <section style={{ 
      background:'#ffffff', 
      padding:'0',
      fontFamily: "'Jost', sans-serif",
    }}>
      <style>{`
        @keyframes gft-pulse {
          0%, 100% { opacity:1; }
          50%       { opacity:0.4; }
        }
        .gft-card-fade {
          opacity: 0;
          transform: translateY(24px);
          animation: gft-card-in 0.6s ease forwards;
        }
        @keyframes gft-card-in {
          to { opacity:1; transform:translateY(0); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 768px) {
          .gft-card-fade {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .gift-header {
            background-size: cover !important;
            background-position: center !important;
            padding: 60px 20px 40px !important;
          }
        }
      `}</style>

      <div style={{ maxWidth:'1400px', margin:'0 auto' }}>

        {/* Horizontal Navigation Tabs */}
        <div style={{
          display:'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 16px',
          background: '#ffffff',
        }}>
          <div 
            style={{
              display:'flex',
              justifyContent: 'center',
              gap: '0',
              maxWidth: '100%',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              padding: '0 40px',
              scrollPaddingLeft: '16px',
              scrollPaddingRight: '16px',
            }} 
            className="hide-scrollbar"
          >
            {loadingCats
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    minWidth:'120px', 
                    height:'48px', 
                    background:'#f5f5f5',
                    animation:'gft-pulse 1.5s ease-in-out infinite' 
                  }} />
                ))
              : categories.map((cat) => {
                  const isActive = cat.slug === activeSlug;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setActiveSlug(cat.slug)}
                      style={{
                        fontFamily:"'Jost',sans-serif",
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing:'0.1em',
                        textTransform:'uppercase',
                        padding: '18px 20px',
                        border:'none',
                        background:'none',
                        cursor:'pointer',
                        color: isActive ? '#1a1a1a' : '#666666',
                        borderBottom: isActive ? '2px solid #1a1a1a' : '2px solid transparent',
                        transition:'all 0.3s ease',
                        whiteSpace:'nowrap',
                        flexShrink:0,
                        marginBottom:'-1px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#1a1a1a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#666666';
                        }
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })
            }
          </div>
        </div>

        {/* 🎨 PERFECTED Section Header */}
        {activeCat && (
          <div 
            className="gift-header"
            style={{
              ...headerStyle,
              backgroundImage: backgroundStyle,
            }}
          >
            {/* Subtle texture overlay for elegance */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.01) 100%)
              `,
              pointerEvents: 'none',
              zIndex: 1,
            }} />
            
            <div style={{ 
              position: 'relative',
              zIndex: 2,
              fontSize:'56px', 
              marginBottom:'12px',
              opacity:0.85
            }}>
              {activeCat.emoji}
            </div>
            <h2 style={{
              position: 'relative',
              zIndex: 2,
              fontFamily:"'Cormorant Garamond',serif",
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight:400,
              color:'#1a1a1a',
              letterSpacing:'0.02em',
              margin:'0 0 16px 0',
              lineHeight: 1.2,
            }}>
              Gift Ideas for {activeCat.label}
            </h2>
            <p style={{
              position: 'relative',
              zIndex: 2,
              fontFamily:"'Jost',sans-serif",
              fontSize:'13px',
              color:'#2a2a2a',  /* Slightly darker for perfect contrast */
              letterSpacing:'0.05em',
              margin:0,
              lineHeight: 1.5,
              maxWidth: '500px',
              margin: '0 auto',
              fontWeight: 400,
            }}>
              Curated timepieces perfect for celebrating life's most meaningful moments
            </p>
          </div>
        )}

        {/* Products */}
        {!loadingProds && products.length === 0 ? (
          <div style={{ 
            textAlign:'center',
            padding:'clamp(60px, 10vw, 100px) 24px',
            background:'#f5f5f5'
          }}>
            <div style={{ 
              fontSize:'72px', 
              marginBottom:'24px',
              opacity:0.3
            }}>
              {activeCat?.emoji ?? '🎁'}
            </div>
            <h3 style={{ 
              fontFamily:"'Cormorant Garamond',serif", 
              fontSize:'clamp(24px, 5vw, 32px)', 
              color:'#1a1a1a', 
              fontWeight:400, 
              marginBottom:'12px'
            }}>
              Selections for {activeCat?.label}
            </h3>
            <p style={{ 
              fontFamily:"'Jost',sans-serif", 
              fontSize:'13px', 
              color:'rgba(0,0,0,0.4)', 
              letterSpacing:'0.05em'
            }}>
              Coming soon
            </p>
          </div>
        ) : (
          <ScrollTrack products={products} loading={loadingProds} />
        )}

        {/* View All Link */}
        <div style={{
          textAlign: 'center',
          padding: '32px 20px 60px',
          background: '#ffffff',
        }}>
          <Link
            href="/gifts"
            style={{
              fontFamily:"'Jost',sans-serif",
              fontSize:'11px',
              fontWeight:600,
              letterSpacing:'0.15em',
              color:'#1a1a1a',
              textDecoration:'none',
              textTransform:'uppercase',
              borderBottom: '1px solid #1a1a1a',
              paddingBottom: '4px',
              display: 'inline-block',
              transition:'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#666666';
              e.currentTarget.style.borderColor = '#666666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1a1a1a';
              e.currentTarget.style.borderColor = '#1a1a1a';
            }}
          >
            View All Gift Collections →
          </Link>
        </div>

      </div>
    </section>
  );
}