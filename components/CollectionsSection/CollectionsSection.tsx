'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

// ── Types ──────────────────────────────────────────────────────────────────
type SectionKey = 'sports' | 'new' | 'luxury' | 'limited' | 'bestsellers';

interface CloudinaryAsset { url: string; publicId: string; }
interface ColorVariant    { colorName: string; colorHex: string; qty: number; image?: CloudinaryAsset; }

interface WatchProduct {
  _id:                string;
  title:              string;
  modelNo:            string;
  price:              number;
  thumbnail:          CloudinaryAsset;
  colorVariants:      ColorVariant[];
  stickerEnabled:     boolean;
  stickerText:        string;
  collectionSections: SectionKey[];
  images?:            CloudinaryAsset[];
  specifications?:    any;
  description?:       string;
}

interface Section {
  key:      SectionKey;
  label:    string;
  heading:  string;
  sub:      string;
}

// ── Section config ─────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  { key:'sports',      label:'Sports',       heading:'Built for Motion',       sub:'Precision engineering for the active lifestyle' },
  { key:'new',         label:'New Arrivals',  heading:'Just Arrived',           sub:'The latest additions to the Winsor family'     },
  { key:'luxury',      label:'Luxury',       heading:'Masterful Craftsmanship', sub:'Where haute horlogerie meets timeless design'  },
  { key:'limited',     label:'Limited Edition', heading:'Rare by Design',         sub:'Exclusive editions crafted in finite numbers'  },
  { key:'bestsellers', label:'Best Sellers', heading:'Beloved Timepieces',     sub:'The watches our clients return to again and again' },
];

// ── Watch Specs Formatter ──────────────────────────────────────────────────
const formatWatchSpecs = (product: WatchProduct) => {
  if (product.specifications) {
    const specs = product.specifications instanceof Map 
      ? Object.fromEntries(product.specifications)
      : product.specifications;
      
    const diameter = specs['Case Size'] || specs['Diameter'] || specs['caseSize'] || specs['diameter'];
    const movement = specs['MovementType'] || specs['Movement'] || specs['movement'];
    const caseMaterial = specs['Case Material'] || specs['Material'] || specs['material'];
    
    const parts = [diameter, movement, caseMaterial].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' - ');
    }
  }
  
  if (product.description) {
    const desc = product.description.split('.')[0];
    if (desc && desc.length < 80) return desc;
  }
  
  return 'Automatic watch - Premium Swiss Made';
};

// ── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ 
      minWidth: '220px', 
      maxWidth: '220px',
      flexShrink: 0,
      display:'flex', 
      flexDirection:'column', 
      gap:'16px',
      background: '#ffffff',
      padding: '24px 0',
    }}>
      <div style={{ aspectRatio:'4/5', background:'rgba(26,18,9,0.04)', borderRadius: '0', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'14px', width:'60%', background:'rgba(26,18,9,0.04)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'12px', width:'80%', background:'rgba(26,18,9,0.04)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'14px', width:'30%', background:'rgba(26,18,9,0.04)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
    </div>
  );
}

// ── Dual Layer Cross-Fading Card Image component (Slow Transition) ─────────
function CardImage({ src, alt, cardHovered, priority, isMobile }: { src: string, alt: string, cardHovered: boolean, priority: boolean, isMobile: boolean }) {
  const [img1, setImg1] = useState(src);
  const [img2, setImg2] = useState('');
  const [showImg2, setShowImg2] = useState(false);

  useEffect(() => {
    if (src === img1 && !showImg2) return;
    if (src === img2 && showImg2) return;

    if (showImg2) {
      setImg1(src);
      setShowImg2(false);
    } else {
      setImg2(src);
      setShowImg2(true);
    }
  }, [src, img1, img2, showImg2]);

  const padSize = isMobile ? '16px' : '24px';

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Image Layer 1 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: showImg2 ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: showImg2 ? 1 : 2,
        }}
      >
        <Image
          src={img1}
          alt={alt}
          fill
          sizes="(max-width: 768px) 220px, 290px"
          style={{
            objectFit: 'contain',
            transform: cardHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: padSize,
          }}
          priority={priority}
        />
      </div>
      {/* Image Layer 2 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: showImg2 ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: showImg2 ? 2 : 1,
        }}
      >
        <Image
          src={img2 || src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 220px, 290px"
          style={{
            objectFit: 'contain',
            transform: cardHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: padSize,
          }}
          priority={false}
        />
      </div>
    </div>
  );
}

// ── Watch Card Component ───────────────────────────────────────────────────
function WatchCard({ product, index }: { product: WatchProduct; index: number }) {
  const { convertPrice } = useCurrency();
  const [cardHovered, setCardHovered] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compile all unique images for this watch
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.thumbnail?.url) {
      list.push(product.thumbnail.url);
    }
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img?.url) list.push(img.url);
      });
    }
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((v) => {
        if (v?.image?.url) list.push(v.image.url);
      });
    }
    return list.filter((url, idx, self) => self.indexOf(url) === idx);
  }, [product]);

  // Reset image index on product change
  useEffect(() => {
    setImgIndex(0);
  }, [product]);

  const nextImage = () => {
    setImgIndex((prev) => (prev + 1) % allImages.length);
  };
  const prevImage = () => {
    setImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Mobile swipe gestures
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  const formattedSpecs = useMemo(() => formatWatchSpecs(product), [product]);

  const cardWidth = isMobile ? '220px' : '290px';

  return (
    <div
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        width: cardWidth,
        minWidth: cardWidth,
        maxWidth: cardWidth,
        flexShrink: 0,
        animationDelay: `${index * 80}ms`,
        background: '#ffffff',
        padding: '0 0 24px 0',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease',
        transform: (!isMobile && cardHovered) ? 'translateY(-6px)' : 'none',
        boxShadow: (!isMobile && cardHovered) ? '0 12px 28px rgba(0, 0, 0, 0.05)' : 'none',
      }}
      className="wn-card-fade"
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Image container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          position: 'relative', 
          width: '100%',
          aspectRatio: '4/5', 
          overflow: 'hidden', 
          background: '#f5f5f5', 
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link 
          href={`/collections/${product._id}`}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        >
          {/* Main Thumbnail image with slow fading transition */}
          <CardImage
            src={allImages[imgIndex] || product.thumbnail.url}
            alt={product.title}
            cardHovered={!isMobile && cardHovered}
            priority={index < 4}
            isMobile={isMobile}
          />
        </Link>

        {/* Sticker badge */}
        {product.stickerEnabled && product.stickerText && (
          <div style={{
            position: 'absolute', 
            top: '12px', 
            left: '12px',
            background: '#ffffff', 
            color: '#1a1209',
            fontFamily: "'Jost', sans-serif", 
            fontSize: '9px', 
            fontWeight: 500,
            letterSpacing: '0.1em', 
            padding: '4px 8px',
            textTransform: 'uppercase',
            zIndex: 2,
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {product.stickerText}
          </div>
        )}

        {/* Mini-Carousel Arrow Overlays (Desktop ONLY, visible on hover) */}
        {allImages.length > 1 && !isMobile && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 12px',
            opacity: cardHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 3,
            pointerEvents: 'none',
          }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevImage();
              }}
              style={miniArrowStyle}
              aria-label="Previous watch view"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextImage();
              }}
              style={miniArrowStyle}
              aria-label="Next watch view"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails Row (Desktop ONLY, visible on hover to avoid layout clutter) */}
      {allImages.length > 1 && !isMobile && (
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: cardHovered ? '4px 0 12px' : '0px',
          justifyContent: 'flex-start',
          overflowX: 'auto',
          opacity: cardHovered ? 1 : 0,
          maxHeight: cardHovered ? '48px' : '0px',
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          overflowY: 'hidden',
        }}>
          {allImages.slice(0, 5).map((imgUrl, i) => {
            const isActive = i === imgIndex;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImgIndex(i);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  border: isActive ? '1px solid #1a1209' : '1px solid rgba(26, 18, 9, 0.12)',
                  background: '#ffffff',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={imgUrl}
                    alt={`${product.title} view ${i + 1}`}
                    fill
                    sizes="36px"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </button>
            );
          })}
          {allImages.length > 5 && (
            <Link
              href={`/collections/${product._id}`}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid rgba(26, 18, 9, 0.12)',
                background: '#f5f5f5',
                color: '#1a1209',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              +{allImages.length - 5}
            </Link>
          )}
        </div>
      )}

      {/* Info and text area */}
      <Link href={`/collections/${product._id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          {/* Watch Title */}
          <h3 style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: '#1a1209',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: '1.4',
            margin: '0 0 6px 0',
            minHeight: '38px',
            overflow: 'hidden',
          }}>
            {product.title}
          </h3>
          
          {/* Specifications subtitle formatted dynamically */}
          <p style={{
            fontFamily: "'Jost', sans-serif", 
            fontSize: '12px', 
            fontWeight: 400,
            letterSpacing: '0.04em', 
            color: '#666666',
            margin: '0 0 10px 0',
            lineHeight: 1.4,
            minHeight: '34px',
            overflow: 'hidden',
          }}>
            {formattedSpecs}
          </p>
          
          {/* Pricing */}
          <p style={{
            fontFamily: "'Jost', sans-serif", 
            fontSize: '14px', 
            fontWeight: 500,
            color: '#1a1209',
            margin: 0,
          }}>
            {convertPrice(product.price)}
          </p>

          {/* Underlined action link */}
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: '#1a1209',
            fontFamily: "'Jost', sans-serif",
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            fontWeight: 500,
          }}>
            Discover timepiece
          </div>
        </div>
      </Link>
    </div>
  );
}

const miniArrowStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.95)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  color: '#1a1209',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pointerEvents: 'auto',
};

// ── Main Section Component ─────────────────────────────────────────────────
export default function CollectionsSection() {
  const [activeSection, setActiveSection] = useState<SectionKey>('sports');
  const [products, setProducts] = useState<WatchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Record<SectionKey, WatchProduct[]>>({} as Record<SectionKey, WatchProduct[]>);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all products for all sections on mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        const productsData: Record<SectionKey, WatchProduct[]> = {} as Record<SectionKey, WatchProduct[]>;
        
        for (const section of SECTIONS) {
          const res = await fetch(`/api/products/collections?section=${section.key}&limit=10`);
          const data = await res.json();
          if (data.success) {
            productsData[section.key] = data.data;
          }
        }
        
        setAllProducts(productsData);
        setProducts(productsData['sports'] || []);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllProducts();
  }, []);

  // Update products when active section changes
  useEffect(() => {
    if (allProducts[activeSection]) {
      setProducts(allProducts[activeSection]);
    }
  }, [activeSection, allProducts]);

  // Reset scroll progress and offset when section tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setScrollProgress(0);
  }, [activeSection]);

  // Track scrolling to update progress indicator bar
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [products, handleScroll]);

  // Scroll left/right handlers for product carousel
  const scrollProducts = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = isMobile ? 232 : 306; // card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Scroll tabs on mobile if needed
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 150;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const activeSectionData = SECTIONS.find(s => s.key === activeSection);

  const wrapperPadding = isMobile ? '0 16px' : '0 80px';
  const cardGap = isMobile ? '12px' : '16px';

  return (
    <section id="collections" style={{ 
      background:'#ffffff', 
      padding:'0 0 54px',
      fontFamily: "'Jost', sans-serif",
      borderBottom: '1px solid rgba(26,18,9,0.06)',
    }}>
      <style>{`
        @keyframes wn-pulse {
          0%, 100% { opacity:1; }
          50%       { opacity:0.4; }
        }
        .wn-card-fade {
          opacity: 0;
          transform: translateY(24px);
          animation: wn-card-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes wn-card-in {
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
          .wn-card-fade {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth:'1400px', margin:'0 auto' }}>

        {/* Centered Navigation Tabs */}
        <div style={{
          display:'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid rgba(26,18,9,0.08)',
          padding: '0 16px',
          background: '#ffffff',
        }}>
          
          {/* Mobile scroll arrows */}
          <button
            onClick={() => scrollTabs('left')}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px',
              color: '#8B6914',
              zIndex: 5,
            }}
            className="mobile-tab-arrow"
            aria-label="Scroll tabs left"
          >
            ‹
          </button>

          <div 
            ref={tabsContainerRef}
            id="tabs-container"
            style={{
              display:'flex',
              justifyContent: 'center',
              gap: '8px',
              maxWidth: '100%',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              padding: '0 40px',
              scrollPaddingLeft: '16px',
              scrollPaddingRight: '16px',
            }} 
            className="hide-scrollbar"
          >
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  style={{
                    fontFamily:"'Jost',sans-serif",
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing:'0.12em',
                    textTransform:'uppercase',
                    padding: '20px 24px',
                    border:'none',
                    background:'none',
                    cursor:'pointer',
                    color: isActive ? '#1a1209' : 'rgba(26, 18, 9, 0.55)',
                    borderBottom: isActive ? '2px solid #1a1209' : '2px solid transparent',
                    transition:'all 0.3s ease',
                    whiteSpace:'nowrap',
                    flexShrink:0,
                    marginBottom:'-1px',
                  }}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs('right')}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px',
              color: '#8B6914',
              zIndex: 5,
            }}
            className="mobile-tab-arrow"
            aria-label="Scroll tabs right"
          >
            ›
          </button>
        </div>

        {/* Section Header */}
        {activeSectionData && (
          <div style={{
            padding: '44px 20px 28px',
            textAlign: 'center',
            background: '#ffffff',
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(28px, 4.5vw, 36px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#1a1209',
              letterSpacing: '0.04em',
              margin: '0 0 10px 0',
              lineHeight: 1.2,
            }}>
              {activeSectionData.heading}
            </h2>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(26, 18, 9, 0.45)',
              letterSpacing: '0.12em',
              margin: 0,
              lineHeight: 1.5,
              textTransform: 'uppercase',
            }}>
              {activeSectionData.sub}
            </p>
          </div>
        )}

        {/* Horizontal Carousel */}
        <div style={{
          position: 'relative',
          background: '#ffffff', 
          padding: '10px 0 24px',
        }}>
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            style={{
              display:'flex',
              gap: cardGap,
              overflowX:'auto',
              padding: wrapperPadding,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollPaddingLeft: isMobile ? '16px' : '24px',
              scrollPaddingRight: isMobile ? '16px' : '24px',
            }}
            className="hide-scrollbar"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((p, i) => (
                  <WatchCard key={p._id} product={p} index={i} />
                ))
            }
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '24px auto 0',
          padding: '0 80px',
        }} className="desktop-only">
          {/* Scroll progress line */}
          <div style={{
            flexGrow: 1,
            height: '2px',
            background: 'rgba(26, 18, 9, 0.08)',
            position: 'relative',
            marginRight: '40px',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${(scrollProgress / 100) * 80}%`,
              width: '20%',
              height: '100%',
              background: '#1a1209',
              transition: 'left 0.1s ease-out',
            }} />
          </div>

          {/* Navigation Arrows */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => scrollProducts('left')}
              aria-label="Scroll left"
              style={bottomArrowStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8B6914';
                e.currentTarget.style.color = '#8B6914';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26, 18, 9, 0.12)';
                e.currentTarget.style.color = '#1a1209';
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scrollProducts('right')}
              aria-label="Scroll right"
              style={bottomArrowStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8B6914';
                e.currentTarget.style.color = '#8B6914';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26, 18, 9, 0.12)';
                e.currentTarget.style.color = '#1a1209';
              }}
            >
              ›
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-tab-arrow {
            display: flex !important;
          }
          #tabs-container {
            justify-content: flex-start !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-tab-arrow {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

const bottomArrowStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: '1px solid rgba(26, 18, 9, 0.12)',
  background: '#ffffff',
  color: '#1a1209',
  fontSize: '18px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  outline: 'none',
};