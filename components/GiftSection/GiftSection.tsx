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

const OCCASION_BACKGROUNDS: Record<string, string> = {
  'eid': '/gift_categories/eid.png',
  'new-year': '/gift_categories/new_year.avif',
  'valentines-day': "/gift_categories/valentines_day.png",
  'christmas': '/gift_categories/xmass.avif',
  'graduation': '/gift_categories/Graduation.png',
  'womens-day': '/gift_categories/womens_day.avif',
  'easter-sunday': '/gift_categories/Easter_sunday.png',
  'mothers-day': '/gift_categories/mothers_day.png',
  'fathers-day': '/gift_categories/fathers_day.png',
  'thai-pongal': '/gift_categories/taippongal.png',
  'sinhala-tamil-new-year': '/gift_categories/sinhala_tamil_new_year.jpg',
  'esala-perahera': '/gift_categories/esala_perahara.png',
};

// ── Occasion Vibe SVG Icons ───────────────────────────────────────────────
const SnowflakeIcon = ({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
    <polyline points="10 4 12 6 14 4" />
    <polyline points="10 20 12 18 14 20" />
    <polyline points="20 10 18 12 20 14" />
    <polyline points="4 10 6 12 4 14" />
  </svg>
);

const GraduationCapIcon = ({ size = 20, color = '#dfb15b' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const HeartIcon = ({ size = 20, color = '#ff4d6d' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SparkleIcon = ({ size = 20, color = '#ffd700' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
    <path d="M12 2l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6-6.6-2.4 6.6-2.4z" />
  </svg>
);

const BlossomIcon = ({ size = 20, color = '#fbcfe8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    <path d="M12 16a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    <path d="M5 12a3 3 0 0 0 3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0-3-3z" />
    <path d="M19 12a3 3 0 0 0-3-3 3 3 0 0 0 3 3 3 3 0 0 0-3 3 3 3 0 0 0 3-3z" />
  </svg>
);

const LuxuryDotIcon = ({ size = 8, color = '#c9a14a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" fill="currentColor" style={{ color }}>
    <circle cx="4" cy="4" r="3" />
  </svg>
);

// ── Occasion Vibe Particles Overlay ───────────────────────────────────────
function OccasionVibe({ slug }: { slug: string }) {
  const normalizedSlug = slug.toLowerCase();

  const config = useMemo(() => {
    switch (normalizedSlug) {
      case 'christmas':
        return {
          type: 'snow',
          count: 24,
          IconComponent: SnowflakeIcon,
          color: '#ffffff',
          glow: '0 0 8px rgba(255,255,255,0.6)',
          animationName: 'vibe-snow',
        };
      case 'valentines-day':
      case 'womens-day':
        return {
          type: 'hearts',
          count: 18,
          IconComponent: HeartIcon,
          color: '#ff4d6d',
          glow: '0 0 12px rgba(255,77,109,0.7)',
          animationName: 'vibe-swirl',
        };
      case 'graduation':
        return {
          type: 'confetti',
          count: 22,
          IconComponent: GraduationCapIcon,
          color: '#dfb15b',
          glow: '0 0 8px rgba(223,177,91,0.6)',
          animationName: 'vibe-swirl',
        };
      case 'new-year':
      case 'sinhala-tamil-new-year':
      case 'eid':
      case 'esala-perahera':
        return {
          type: 'sparkles',
          count: 20,
          IconComponent: SparkleIcon,
          color: '#ffd700',
          glow: '0 0 10px rgba(255,215,0,0.8)',
          animationName: 'vibe-snow',
        };
      case 'mothers-day':
      case 'fathers-day':
      case 'easter-sunday':
      case 'thai-pongal':
        return {
          type: 'blossom',
          count: 16,
          IconComponent: BlossomIcon,
          color: '#fbcfe8',
          glow: '0 0 6px rgba(251,207,232,0.4)',
          animationName: 'vibe-swirl',
        };
      default:
        // Default luxury vibe: elegant gold sparkles
        return {
          type: 'luxury',
          count: 14,
          IconComponent: LuxuryDotIcon,
          color: '#c9a14a',
          glow: '0 0 6px rgba(201,161,74,0.5)',
          animationName: 'vibe-snow',
        };
    }
  }, [normalizedSlug]);

  const particles = useMemo(() => {
    return Array.from({ length: config.count }).map((_, i) => {
      const left = `${Math.random() * 100}%`;
      const delay = `${Math.random() * 8}s`;
      const duration = `${12 + Math.random() * 14}s`;
      const size = `${12 + Math.random() * 14}px`;
      const opacity = 0.15 + Math.random() * 0.45;
      return { id: i, left, delay, duration, size, opacity };
    });
  }, [config]);

  const IconComponent = config.IconComponent;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 2,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes vibe-snow {
          0% { transform: translateY(-25px) rotate(0deg) translateX(0); opacity: 0; }
          15% { opacity: var(--op, 0.7); }
          85% { opacity: var(--op, 0.7); }
          100% { transform: translateY(105vh) rotate(360deg) translateX(-15px); opacity: 0; }
        }
        @keyframes vibe-float-up {
          0% { transform: translateY(105vh) rotate(0deg) scale(0.8); opacity: 0; }
          15% { opacity: var(--op, 0.7); }
          85% { opacity: var(--op, 0.7); }
          100% { transform: translateY(-25px) rotate(180deg) scale(1.2); opacity: 0; }
        }
        @keyframes vibe-swirl {
          0% { transform: translateY(-25px) rotate(0deg) translateX(0); opacity: 0; }
          15% { opacity: var(--op, 0.7); }
          85% { opacity: var(--op, 0.7); }
          100% { transform: translateY(105vh) rotate(360deg) translateX(15px); opacity: 0; }
        }
      `}</style>

      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-25px',
            bottom: 'auto',
            left: p.left,
            animationName: config.animationName,
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            opacity: 0,
            display: 'inline-block',
            transformOrigin: 'center',
            filter: config.glow ? `drop-shadow(${config.glow})` : 'none',
            ['--op' as any]: p.opacity,
          }}
        >
          <IconComponent size={parseInt(p.size)} color={config.color} />
        </span>
      ))}
    </div>
  );
}

// ── Hero stage: one big background + swipeable watch (book-page feel) ─────
function HeroStage({
  background,
  products,
  activeIndex,
  setActiveIndex,
  categoryLabel,
  categoryTagline,
  categorySlug,
}: {
  background: string;
  products: GiftProduct[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  categoryLabel: string;
  categoryTagline?: string;
  categorySlug: string;
}) {
  const dragStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // States for background cross-fading
  const [bg1, setBg1] = useState(background);
  const [bg2, setBg2] = useState('');
  const [showBg2, setShowBg2] = useState(false);

  const ambientGlow = useMemo(() => {
    const slug = categorySlug.toLowerCase();
    switch (slug) {
      case 'christmas':
        return 'radial-gradient(circle at 10% 10%, rgba(220, 38, 38, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(22, 101, 52, 0.15) 0%, transparent 50%)';
      case 'valentines-day':
        return 'radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.18) 0%, transparent 80%)';
      case 'graduation':
        return 'radial-gradient(circle at 10% 90%, rgba(201, 161, 74, 0.15) 0%, transparent 60%)';
      default:
        return 'none';
    }
  }, [categorySlug]);

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
        minHeight: 'clamp(460px, 72vh, 680px)',
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

      {/* Soft vignette + dark overlay so text + watch read clearly on any image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Ambient Vibe light leak leak overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: ambientGlow,
          pointerEvents: 'none',
          zIndex: 1,
          mixBlendMode: 'screen',
        }}
      />

      {/* Occasion Particle Effects Vibe overlay */}
      <OccasionVibe slug={categorySlug} />

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
            fontSize: 'clamp(32px, 7.5vw, 105px)',
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
              width: 'min(360px, 50vw)',
              height: 'min(460px, 50vh)',
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
          bottom: 'clamp(20px, 5vh, 60px)',
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
                const getActiveTabStyle = (slug: string) => {
                  const norm = slug.toLowerCase();
                  switch (norm) {
                    case 'christmas':
                      return {
                        background: '#a81c1c',
                        borderColor: '#a81c1c',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(168, 28, 28, 0.35)',
                      };
                    case 'valentines-day':
                      return {
                        background: '#db2777',
                        borderColor: '#db2777',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(219, 39, 119, 0.35)',
                      };
                    case 'graduation':
                      return {
                        background: '#8b6914',
                        borderColor: '#8b6914',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(139, 105, 20, 0.35)',
                      };
                    case 'new-year':
                    case 'sinhala-tamil-new-year':
                      return {
                        background: '#c9a14a',
                        borderColor: '#c9a14a',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(201, 161, 74, 0.35)',
                      };
                    default:
                      return {
                        background: '#1a1209',
                        borderColor: '#1a1209',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(26, 18, 9, 0.25)',
                      };
                  }
                };

                return (
                  <button
                    key={cat._id}
                    onClick={() => setActiveSlug(cat.slug)}
                    className={`gift-tab-btn ${isActive ? 'active' : ''}`}
                    style={isActive ? getActiveTabStyle(cat.slug) : {}}
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
          categorySlug={activeCat.slug}
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
