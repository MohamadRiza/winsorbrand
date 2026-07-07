'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  /** Optional: admin can attach a hero background per category */
  heroBackground?: string;
}
interface CloudinaryAsset { url: string; publicId: string; }
interface ColorVariant    { colorName: string; colorHex: string; qty: number; }
interface GiftProduct {
  _id:            string;
  title:          string;
  modelNo:        string;
  price:          number;
  thumbnail:      CloudinaryAsset;
  /** Optional transparent watch render for the hero stage */
  heroImage?:     CloudinaryAsset;
  colorVariants:  ColorVariant[];
  stickerEnabled: boolean;
  stickerText:    string;
  giftCategories: string[];
}

// ── Fallback backgrounds (used only if a category has no heroBackground) ──
const FALLBACK_BACKGROUNDS = [
  'https://photographylife.com/wp-content/uploads/2017/01/Dark-landscape-photo.jpg',
  'https://photographylife.com/wp-content/uploads/2018/10/Final-Result-of-Jokulsarlon-Photo.jpg',
];

// Curated luxury background images for each preset gift category
const OCCASION_BACKGROUNDS: Record<string, string> = {
  'eid': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=2000',
  'new-year': 'https://images.unsplash.com/photo-1467810563316-b547d9d57b3b?auto=format&fit=crop&q=80&w=2000',
  'valentines-day': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=2000',
  'christmas': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=2000',
  'graduation': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2000',
  'womens-day': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=2000',
  'easter-sunday': 'https://images.unsplash.com/photo-1522336572018-97d5761f20a3?auto=format&fit=crop&q=80&w=2000',
  'mothers-day': 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2000',
  'fathers-day': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=2000',
  'thai-pongal': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000',
  'sinhala-tamil-new-year': 'https://images.unsplash.com/photo-1601662528567-526cf06f6582?auto=format&fit=crop&q=80&w=2000',
  'esala-perahera': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000',
};

// ── Hero stage: one big background + swipeable watch (book-page feel) ─────
function HeroStage({
  background,
  products,
  activeIndex,
  setActiveIndex,
  categoryLabel,
  categoryTagline,
}: {
  background: string;
  products: GiftProduct[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  categoryLabel: string;
  categoryTagline?: string;
}) {
  const dragStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // States for background cross-fading
  const [bg1, setBg1] = useState(background);
  const [bg2, setBg2] = useState('');
  const [showBg2, setShowBg2] = useState(false);

  useEffect(() => {
    if (background === bg1 && !showBg2) return;
    if (background === bg2 && showBg2) return;

    if (showBg2) {
      setBg1(background);
      setShowBg2(false);
    } else {
      setBg2(background);
      setShowBg2(true);
    }
  }, [background, bg1, bg2, showBg2]);

  const goTo = useCallback(
    (next: number) => {
      if (!products.length) return;
      const wrapped = (next + products.length) % products.length;
      setDirection(wrapped > activeIndex || (activeIndex === products.length - 1 && wrapped === 0) ? 1 : -1);
      setActiveIndex(wrapped);
    },
    [activeIndex, products.length, setActiveIndex],
  );

  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, products.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  };

  const active = products[activeIndex];

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'min(98vh, 920px)',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: products.length > 1 ? 'grab' : 'default',
        background: '#0a0a0a',
      }}
    >
      {/* Background Layer 1 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: bg1 ? `url(${bg1})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: showBg2 ? 0 : 1,
          transition: 'opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 0,
        }}
      />
      {/* Background Layer 2 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: bg2 ? `url(${bg2})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: showBg2 ? 1 : 0,
          transition: 'opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 0,
        }}
      />

      {/* Soft vignette so text + watch read clearly on any image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Giant ghost word — Rolex Oyster vibe */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: 'clamp(80px, 18vw, 280px)',
            color: 'rgba(255,255,255,0.18)',
            whiteSpace: 'nowrap',
            mixBlendMode: 'overlay',
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Watch stage — animated swap */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {/* Soft Radial Backing Glow behind the watch to enhance depth */}
        <div
          style={{
            position: 'absolute',
            width: 'min(450px, 75vw)',
            height: 'min(450px, 75vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 105, 20, 0.22) 0%, rgba(139, 105, 20, 0.06) 50%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
        {active && (
          <div
            key={active._id}
            className="hero-watch-in"
            data-dir={direction === 1 ? 'right' : 'left'}
            style={{
              width: 'min(420px, 60vw)',
              height: 'min(560px, 70vh)',
              position: 'relative',
              filter: 'drop-shadow(0 35px 55px rgba(0,0,0,0.55))',
            }}
          >
            <Image
              src={active.heroImage?.url || active.thumbnail.url}
              alt={active.title}
              fill
              sizes="(max-width: 768px) 80vw, 420px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        )}
      </div>

      {/* Bottom-left caption */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(20px, 5vw, 64px)',
          bottom: 'clamp(40px, 8vh, 96px)',
          color: '#fff',
          maxWidth: '520px',
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          zIndex: 3,
        }}
      >
        <h2
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(22px, 3vw, 36px)',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {active?.title ?? `Gifts for ${categoryLabel}`}
        </h2>
        {(active?.modelNo || categoryTagline) && (
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              opacity: 0.9,
              marginTop: '8px',
              letterSpacing: '0.05em',
            }}
          >
            {active?.modelNo || categoryTagline}
          </p>
        )}
        {active && (
          <Link
            href={`/collections/${active._id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '18px',
              color: '#fff',
              fontFamily: "'Jost', sans-serif",
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.6)',
              paddingBottom: '4px',
              pointerEvents: 'auto',
            }}
          >
            Discover more ›
          </Link>
        )}
      </div>

      {/* Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous watch"
            style={{ ...arrowStyle('left'), zIndex: 5 }}
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next watch"
            style={{ ...arrowStyle('right'), zIndex: 5 }}
          >
            ›
          </button>
        </>
      )}

      {/* Pagination dots */}
      {products.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: 'clamp(20px, 5vw, 64px)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            zIndex: 3,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontFamily: "'Jost', sans-serif",
              fontSize: '12px',
              letterSpacing: '0.1em',
              opacity: 0.85,
              marginRight: '10px',
            }}
          >
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(products.length).padStart(2, '0')}
          </span>
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to watch ${i + 1}`}
              style={{
                width: i === activeIndex ? '22px' : '8px',
                height: '3px',
                background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const arrowStyle = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute',
  top: '50%',
  [side]: 'clamp(12px, 2vw, 28px)',
  transform: 'translateY(-50%)',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.5)',
  background: 'rgba(0,0,0,0.25)',
  color: '#fff',
  fontSize: '24px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(6px)',
});

// ── Main component ─────────────────────────────────────────────────────────
export default function GiftSection() {
  const [categories, setCategories] = useState<GiftCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [products, setProducts] = useState<GiftProduct[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCats(true);
      try {
        const res = await fetch('/api/gift-categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCategories(data.data);
          setActiveSlug(data.data[0].slug);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  // Fetch products for active category
  useEffect(() => {
    if (!activeSlug) return;
    const fetchProds = async () => {
      setLoadingProds(true);
      setProducts([]);
      setActiveIndex(0);
      try {
        const res = await fetch(
          `/api/products/gifts?category=${activeSlug.toLowerCase()}&limit=20`,
        );
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

  const activeCat = useMemo(
    () => categories.find((c) => c.slug === activeSlug),
    [categories, activeSlug],
  );

  // One background per category. Use admin-provided heroBackground if present;
  // otherwise check the custom lookups for our 12 default presets, falling back
  // to a stable gradient fallback as needed.
  const background = useMemo(() => {
    if (activeCat?.heroBackground) return activeCat.heroBackground;
    if (!activeCat) return FALLBACK_BACKGROUNDS[0];
    const slugLower = activeCat.slug.toLowerCase();
    if (OCCASION_BACKGROUNDS[slugLower]) {
      return OCCASION_BACKGROUNDS[slugLower];
    }
    const idx =
      Math.abs(
        activeCat.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
      ) % FALLBACK_BACKGROUNDS.length;
    return FALLBACK_BACKGROUNDS[idx];
  }, [activeCat]);

  return (
    <section style={{ background: '#faf7f0' }}>
      <style>{`
        @keyframes hero-watch-from-right {
          from { opacity: 0; transform: translateX(60px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes hero-watch-from-left {
          from { opacity: 0; transform: translateX(-60px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
        .hero-watch-in[data-dir="right"] { animation: hero-watch-from-right 0.6s cubic-bezier(.2,.7,.2,1) both; }
        .hero-watch-in[data-dir="left"]  { animation: hero-watch-from-left  0.6s cubic-bezier(.2,.7,.2,1) both; }
        
        .gift-tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 12px 20px 24px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          justify-content: center;
          flex-wrap: wrap;
        }
        .gift-tabs::-webkit-scrollbar {
          display: none;
        }
        .gift-tab-btn {
          background: #fff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          color: #1a1209;
          padding: 8px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gift-tab-btn.active {
          background: #8B6914;
          border-color: #8B6914;
          color: #fff;
          box-shadow: 0 4px 15px rgba(139, 105, 20, 0.25);
        }
        .gift-tab-btn:hover:not(.active) {
          border-color: #8B6914;
          color: #8B6914;
          background: rgba(139, 105, 20, 0.04);
        }
        @media (max-width: 768px) {
          .gift-tabs {
            justify-content: flex-start;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            padding: 8px 16px 16px;
          }
          .gift-tab-btn {
            padding: 6px 14px;
            font-size: 11px;
          }
        }
      `}</style>

      {/* Top tabs (categories from admin) */}
      <div style={{
        padding: '48px 20px 32px',
        textAlign: 'center',
        background: '#faf7f0',
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 300,
          color: '#1a1a1a',
          letterSpacing: '0.06em',
          margin: '0 0 10px 0',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}>
          Celebrate moments with elegance
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          fontStyle: 'italic',
          color: '#8B6914',
          letterSpacing: '0.08em',
          margin: 0,
          lineHeight: 1.5,
        }}>
          A gift that lasts forever
        </p>
      </div>

      <div
        style={{
          borderBottom: '1px solid rgba(26, 18, 9, 0.05)',
          background: '#faf7f0',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="gift-tabs">
          {loadingCats
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 120,
                    height: 36,
                    margin: '8px',
                    background: '#f5f5f5',
                    borderRadius: 30,
                    animation: 'pulse 1.4s infinite',
                  }}
                />
              ))
            : categories.map((cat) => {
                const isActive = cat.slug === activeSlug;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setActiveSlug(cat.slug)}
                    className={`gift-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Hero stage with swipeable watch */}
      {activeCat && (
        <HeroStage
          background={background}
          products={products}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          categoryLabel={activeCat.label}
          categoryTagline={`Gift Ideas for ${activeCat.label}`}
        />
      )}

      {/* Loading / empty states under the stage */}
      {loadingProds && (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            fontFamily: "'Jost', sans-serif",
            color: '#666',
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Loading {activeCat?.label} selection…
        </div>
      )}
      {!loadingProds && products.length === 0 && activeCat && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            fontFamily: "'Jost', sans-serif",
          }}
        >
          <div style={{ color: '#1a1a1a', fontSize: 16, fontWeight: 500 }}>
            Selections for {activeCat.label}
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            Coming soon
          </div>
        </div>
      )}

      {/* View All */}
      <div style={{ textAlign: 'center', padding: '32px 20px 64px' }}>
        <Link
          href="/gifts"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            border: '1px solid #1a1a1a',
            color: '#1a1a1a',
            textDecoration: 'none',
            fontFamily: "'Jost', sans-serif",
            fontSize: 13,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
          }}
        >
          View All Gift Collections →
        </Link>
      </div>
    </section>
  );
}
