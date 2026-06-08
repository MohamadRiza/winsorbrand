'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

// ── Types ──────────────────────────────────────────────────────────────────
type SectionKey = 'sports' | 'new' | 'luxury' | 'limited' | 'bestsellers';

interface CloudinaryAsset { url: string; publicId: string; }
interface ColorVariant    { colorName: string; colorHex: string; qty: number; }

interface WatchProduct {
  _id:               string;
  title:             string;
  modelNo:           string;
  price:             number;
  thumbnail:         CloudinaryAsset;
  colorVariants:     ColorVariant[];
  stickerEnabled:    boolean;
  stickerText:       string;
  collectionSections: SectionKey[];
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

// ── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ 
      minWidth: '290px', 
      maxWidth: '290px',
      flexShrink: 0,
      display:'flex', 
      flexDirection:'column', 
      gap:'16px',
      background: '#ffffff',
      border: '1px solid rgba(26, 18, 9, 0.05)',
      borderRadius: '8px',
      padding: '24px',
    }}>
      <div style={{ aspectRatio:'1', background:'rgba(26,18,9,0.04)', borderRadius: '6px', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'12px', width:'30%', background:'rgba(26,18,9,0.04)', alignSelf: 'center', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'20px', width:'70%', background:'rgba(26,18,9,0.04)', alignSelf: 'center', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'12px', width:'40%', background:'rgba(26,18,9,0.04)', alignSelf: 'center', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
    </div>
  );
}

// ── Scroll Button Component ────────────────────────────────────────────────
interface ScrollBtnProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

function ScrollBtn({ direction, onClick }: ScrollBtnProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        [direction === 'left' ? 'left' : 'right']: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        backgroundColor: hovered ? '#8B6914' : 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #8B6914',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: hovered ? '0 4px 12px rgba(139, 105, 20, 0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
        fontSize: '20px',
        color: hovered ? '#ffffff' : '#8B6914',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        outline: 'none',
      }}
      className="desktop-only"
      aria-label={`Scroll products ${direction}`}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );
}

// ── Watch Card ─────────────────────────────────────────────────────────────
function WatchCard({ product, index }: { product: WatchProduct; index: number }) {
  const { convertPrice } = useCurrency();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/collections/${product._id}`} // ✅ FIXED ROUTE: correctly link to detail page
      style={{ 
        textDecoration: 'none', 
        display: 'flex',
        flexDirection: 'column',
        minWidth: '290px',
        maxWidth: '290px',
        flexShrink: 0,
        animationDelay: `${index * 80}ms`,
        background: '#ffffff',
        border: '1px solid rgba(26, 18, 9, 0.06)',
        borderRadius: '8px',
        padding: '24px',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s ease, border-color 0.4s ease',
        transform: hovered ? 'translateY(-8px)' : 'none',
        boxShadow: hovered 
          ? '0 16px 36px rgba(26, 18, 9, 0.08)' 
          : '0 4px 20px rgba(26, 18, 9, 0.02)',
        borderColor: hovered ? 'rgba(139, 105, 20, 0.35)' : 'rgba(26, 18, 9, 0.06)',
      }}
      className="wn-card-fade"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div style={{ 
        position: 'relative', 
        aspectRatio: '1', 
        overflow: 'hidden', 
        background: '#ffffff', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Thumbnail */}
        <Image
          src={product.thumbnail.url}
          alt={product.title}
          fill
          sizes="290px"
          style={{
            objectFit: 'contain',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: '12px',
          }}
          priority={index < 4}
        />

        {/* Sticker badge */}
        {product.stickerEnabled && product.stickerText && (
          <div style={{
            position: 'absolute', 
            top: '0', 
            left: '0',
            background: '#8B6914', 
            color: '#ffffff',
            fontFamily: "'Jost', sans-serif", 
            fontSize: '8px', 
            fontWeight: 600,
            letterSpacing: '0.15em', 
            padding: '4px 8px',
            textTransform: 'uppercase',
            borderRadius: '2px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}>
            {product.stickerText}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Model Identifier */}
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          color: '#8B6914',
          textTransform: 'uppercase',
          marginBottom: '6px',
          display: 'block',
        }}>
          {product.modelNo ? `WINSOR ${product.modelNo}` : 'WINSOR CLASSIC'}
        </span>

        {/* Serif Watch Title */}
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '19px',
          fontWeight: 500,
          color: '#1a1209',
          lineHeight: '1.3',
          margin: '0 0 6px 0',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {product.title}
        </h3>
        
        {/* Specifications Descriptor */}
        <p style={{
          fontFamily: "'Jost', sans-serif", 
          fontSize: '11px', 
          fontWeight: 400,
          letterSpacing: '0.05em', 
          color: 'rgba(26,18,9,0.5)',
          margin: '0 0 16px 0',
          lineHeight: 1.4,
        }}>
          Luxury Timepiece • Swiss Heritage
        </p>
        
        {/* Pricing and Action Row */}
        <div style={{ marginTop: 'auto' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", 
            fontSize: '14px', 
            fontWeight: 600,
            letterSpacing: '0.05em', 
            color: '#1a1209',
            margin: 0,
          }}>
            {convertPrice(product.price)}
          </p>

          {/* Action indicator line */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(26,18,9,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: hovered ? '#8B6914' : '#1a1209',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'color 0.2s ease',
          }}>
            <span>Discover</span>
            <span style={{ 
              transform: hovered ? 'translateX(4px)' : 'none', 
              transition: 'transform 0.2s ease',
              display: 'inline-block'
            }}>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Section Component ─────────────────────────────────────────────────
export default function CollectionsSection() {
  const [activeSection, setActiveSection] = useState<SectionKey>('sports');
  const [products, setProducts] = useState<WatchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Record<SectionKey, WatchProduct[]>>({} as Record<SectionKey, WatchProduct[]>);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

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

  // Scroll left/right handlers for product carousel
  const scrollProducts = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 306; // card width (290) + gap (16)
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

  return (
    <section id="collections" style={{ 
      background:'#ffffff', 
      padding:'0',
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

        {/* Horizontal Navigation Tabs */}
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
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                style={{
                  fontFamily:"'Jost',sans-serif",
                  fontSize: '12px',
                  fontWeight: activeSection === section.key ? 600 : 400,
                  letterSpacing:'0.15em',
                  textTransform:'uppercase',
                  padding: '20px 24px',
                  border:'none',
                  background:'none',
                  cursor:'pointer',
                  color: activeSection === section.key ? '#8B6914' : 'rgba(26, 18, 9, 0.6)',
                  borderBottom: activeSection === section.key ? '2px solid #8B6914' : '2px solid transparent',
                  transition:'all 0.3s ease',
                  whiteSpace:'nowrap',
                  flexShrink:0,
                  marginBottom:'-1px',
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.color = '#8B6914';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.color = 'rgba(26, 18, 9, 0.6)';
                  }
                }}
              >
                {section.label}
              </button>
            ))}
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
          background: '#fbf9f5', // ✅ Soft warm cream background
          padding: '40px 0 54px',
          borderTop: '1px solid rgba(26,18,9,0.04)',
          borderBottom: '1px solid rgba(26,18,9,0.04)',
        }}>
          {/* Scroll Left */}
          <ScrollBtn direction="left" onClick={() => scrollProducts('left')} />

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            style={{
              display:'flex',
              gap:'16px',
              overflowX:'auto',
              padding: '0 80px',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollPaddingLeft: '24px',
              scrollPaddingRight: '24px',
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

          {/* Scroll Right */}
          <ScrollBtn direction="right" onClick={() => scrollProducts('right')} />
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