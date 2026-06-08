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
  // '/gif2.jpeg',
  // '/gif2.jpeg',
  // '/gif2.jpeg',
];

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
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        userSelect: 'none',
        cursor: products.length > 1 ? 'grab' : 'default',
      }}
    >
      {/* Soft vignette so text + watch read clearly on any image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)',
          pointerEvents: 'none',
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
        }}
      >
        {active && (
          <div
            key={active._id}
            className="hero-watch-in"
            data-dir={direction === 1 ? 'right' : 'left'}
            style={{
              width: 'min(420px, 60vw)',
              height: 'min(560px, 70vh)',
              position: 'relative',
              filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.45))',
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
            style={arrowStyle('left')}
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next watch"
            style={arrowStyle('right')}
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
  zIndex: 5,
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
  // otherwise pick a stable fallback based on category slug (so it doesn't
  // flicker between renders).
  const background = useMemo(() => {
    if (activeCat?.heroBackground) return activeCat.heroBackground;
    if (!activeCat) return FALLBACK_BACKGROUNDS[0];
    const idx =
      Math.abs(
        activeCat.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
      ) % FALLBACK_BACKGROUNDS.length;
    return FALLBACK_BACKGROUNDS[idx];
  }, [activeCat]);

  return (
    <section style={{ background: '#fff' }}>
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
        .gift-tabs::-webkit-scrollbar { display: none; }
        .gift-tabs { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Top tabs (categories from admin) */}
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
              Celebrate moments with elegance
            </h2>
            <p style={{
              fontFamily:"'Jost',sans-serif",
              fontSize:'13px',
              color:'#666666',
              letterSpacing:'0.05em',
              margin:0,
              lineHeight: 1.5,
            }}>
              A gift that lasts forever
            </p>
          </div>
      <div
        style={{
          borderBottom: '1px solid #eee',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          className="gift-tabs"
          style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          {loadingCats
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 120,
                    height: 18,
                    margin: '20px 12px',
                    background: '#eee',
                    borderRadius: 4,
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
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '18px 20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: isActive ? '#1a1a1a' : '#666',
                      borderBottom: isActive
                        ? '2px solid #1a1a1a'
                        : '2px solid transparent',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      marginBottom: '-1px',
                    }}
                  >
                    {cat.emoji} {cat.label}
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
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {activeCat.emoji ?? '🎁'}
          </div>
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
          View All Gift Collections → {activeCat?.emoji}
        </Link>
      </div>
    </section>
  );
}
