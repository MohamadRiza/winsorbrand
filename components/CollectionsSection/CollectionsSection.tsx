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
  { key:'new',         label:'New',          heading:'Just Arrived',           sub:'The latest additions to the Winsor family'     },
  { key:'luxury',      label:'Luxury',       heading:'Masterful Craftsmanship', sub:'Where haute horlogerie meets timeless design'  },
  { key:'limited',     label:'Limited',      heading:'Rare by Design',         sub:'Exclusive editions crafted in finite numbers'  },
  { key:'bestsellers', label:'Best Sellers', heading:'Beloved Timepieces',     sub:'The watches our clients return to again and again' },
];

// Sticker colour map - Updated for Longines style
const STICKER_COLORS: Record<string, { bg: string; text: string }> = {
  default:      { bg: '#ffffff', text: '#1a1a1a'     },
  new:          { bg: '#ffffff', text: '#1a1a1a'     },
  limited:      { bg: '#ffffff', text: '#1a1a1a'     },
  bestsellers:  { bg: '#ffffff', text: '#1a1a1a'     },
  sports:       { bg: '#ffffff', text: '#1a1a1a'     },
  luxury:       { bg: '#ffffff', text: '#1a1a1a'     },
  exclusive:    { bg: '#ffffff', text: '#1a1a1a'     },
};

function getStickerStyle(stickerText: string, sections: SectionKey[]) {
  const t = stickerText.toLowerCase();
  if (t.includes('exclusive')) return STICKER_COLORS.exclusive;
  if (sections.includes('new'))         return STICKER_COLORS.new;
  if (sections.includes('limited'))     return STICKER_COLORS.limited;
  if (sections.includes('bestsellers')) return STICKER_COLORS.bestsellers;
  if (sections.includes('sports'))      return STICKER_COLORS.sports;
  if (sections.includes('luxury'))      return STICKER_COLORS.luxury;
  return STICKER_COLORS.default;
}

// ── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ 
      minWidth: '260px', 
      maxWidth: '260px',
      flexShrink: 0,
      display:'flex', 
      flexDirection:'column', 
      gap:'12px',
      background: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{ aspectRatio:'3/4', background:'rgba(26,18,9,0.06)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'10px', width:'40%', background:'rgba(26,18,9,0.06)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'14px', width:'75%', background:'rgba(26,18,9,0.06)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
      <div style={{ height:'12px', width:'35%', background:'rgba(26,18,9,0.06)', animation:'wn-pulse 1.5s ease-in-out infinite' }}/>
    </div>
  );
}

// ── Watch Card ─────────────────────────────────────────────────────────────
function WatchCard({ product, index }: { product: WatchProduct; index: number }) {
  const { convertPrice } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const stickerStyle = getStickerStyle(product.stickerText, product.collectionSections);

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
      className="wn-card-fade"
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

        {/* Thumbnail */}
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

        {/* Sticker badge */}
        {product.stickerEnabled && product.stickerText && (
          <div style={{
            position:'absolute', 
            top:'0', 
            left:'0',
            background: stickerStyle.bg, 
            color: stickerStyle.text,
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
          {product.title.toUpperCase()}
        </p>
        
        <p style={{
          fontFamily:"'Jost',sans-serif", 
          fontSize:'11px', 
          fontWeight:400,
          letterSpacing:'0.05em', 
          color:'#666666',
          marginBottom:'12px',
          lineHeight: 1.5,
        }}>
          42 mm - Automatic watch - Stainless steel and ceramic bezel
        </p>
        
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
      const scrollAmount = 280; // card width + gap
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
    <section style={{ 
      background:'#ffffff', 
      padding:'0',
      fontFamily: "'Jost', sans-serif",
    }}>
      <style>{`
        @keyframes wn-pulse {
          0%, 100% { opacity:1; }
          50%       { opacity:0.4; }
        }
        .wn-card-fade {
          opacity: 0;
          transform: translateY(24px);
          animation: wn-card-in 0.6s ease forwards;
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

        {/* Horizontal Navigation Tabs - Longines Style */}
        <div style={{
          display:'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
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
              fontSize: '16px',
              color: '#666666',
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
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                style={{
                  fontFamily:"'Jost',sans-serif",
                  fontSize: '13px',
                  fontWeight: activeSection === section.key ? 600 : 400,
                  letterSpacing:'0.1em',
                  textTransform:'uppercase',
                  padding: '18px 20px',
                  border:'none',
                  background:'none',
                  cursor:'pointer',
                  color: activeSection === section.key ? '#1a1a1a' : '#666666',
                  borderBottom: activeSection === section.key ? '2px solid #1a1a1a' : '2px solid transparent',
                  transition:'all 0.3s ease',
                  whiteSpace:'nowrap',
                  flexShrink:0,
                  marginBottom:'-1px',
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.color = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.color = '#666666';
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
              fontSize: '16px',
              color: '#666666',
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
            padding: '32px 20px 24px',
            textAlign: 'center',
            background: '#ffffff',
          }}>
            <h2 style={{
              fontFamily:"'Jost',sans-serif",
              fontSize: 'clamp(20px, 4vw, 28px)',
              fontWeight:600,
              color:'#1a1a1a',
              letterSpacing:'0.1em',
              margin:'0 0 8px 0',
              textTransform:'uppercase',
              lineHeight: 1.3,
            }}>
              {activeSectionData.heading}
            </h2>
            <p style={{
              fontFamily:"'Jost',sans-serif",
              fontSize:'13px',
              color:'#666666',
              letterSpacing:'0.05em',
              margin:0,
              lineHeight: 1.5,
            }}>
              {activeSectionData.sub}
            </p>
          </div>
        )}

        {/* Horizontal Scrollable Product Grid */}
        <div style={{
          position: 'relative',
          background: '#f5f5f5',
          padding: '24px 0 40px',
        }}>
          {/* Scroll Left Button - Hidden on Mobile */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: '16px',
              color: '#1a1a1a',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
            className="desktop-only"
            aria-label="Scroll products left"
          >
            ‹
          </button>

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
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
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((p, i) => (
                  <WatchCard key={p._id} product={p} index={i} />
                ))
            }
          </div>

          {/* Scroll Right Button - Hidden on Mobile */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: '16px',
              color: '#1a1a1a',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
            className="desktop-only"
            aria-label="Scroll products right"
          >
            ›
          </button>
        </div>

        {/* View All Link */}
        {/* <div style={{
          textAlign: 'center',
          padding: '20px 20px 40px',
          background: '#ffffff',
        }}>
          <Link
            href={`/collections/${activeSection}`}
            style={{
              fontFamily:"'Jost',sans-serif",
              fontSize:'11px',
              fontWeight:600,
              letterSpacing:'0.15em',
              color:'#1a1a1a',
              textDecoration:'none',
              textTransform:'uppercase',
              borderBottom: '1px solid #1a1a1a',
              paddingBottom: '2px',
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
            View All {activeSectionData?.label} →
          </Link>
        </div> */}

      </div>

      {/* Mobile Styles - Fixed tab visibility */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-tab-arrow {
            display: flex !important;
          }
          /* Fix: On mobile, align tabs to the left so SPORTS is always visible */
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