'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import HeroLiveWatch from './HeroLiveWatch';
import HeroSportWatch from './HeroSportWatch';
import HeroEditorialTypewriter, { type HeroEditorialPhrase } from './HeroEditorialTypewriter';

export default function Watch3DAssembly() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  interface SlideData {
    preTitle: string;
    phrase: HeroEditorialPhrase;
    description: string;
    cta: string;
    link: string;
    image?: string;
    isVideo?: boolean;
    bgImage?: string;
  }

  const slides: SlideData[] = [
    {
      preTitle: "NEW COLLECTION 2026",
      phrase: { line1: "Crafted to", line2: "Measure Time", accent: "Beautifully" },
      description: "Timeless design. Signature precision. Built for generations.",
      cta: "EXPLORE COLLECTION",
      link: "#collections",
      image: "/winsor_hero_backgroundremoved.webp",
      bgImage: "/hero_silk_pearl.jpg"
    },
    {
      preTitle: "THE HERITAGE SERIES",
      phrase: { line1: "Designed for", line2: "Everyday", accent: "Precision" },
      description: "Engineered for durability, accuracy, and modern performance.",
      cta: "VIEW HERITAGE",
      link: "#collections",
      image: "/winsor_hero_backgroundremoved_sport.webp",
      bgImage: "/hero_silk_greige.jpg"
    },
    {
      preTitle: "THE MASTER COLLECTION",
      phrase: { line1: "Where Precision", line2: "Meets", accent: "Elegance" },
      description: "A Dubai-registered luxury house crafting statement timepieces of enduring refinement.",
      cta: "DISCOVER MASTER",
      link: "#collections",
      isVideo: true
    }
  ];

  const handleAdvanceSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % 3);
  }, []);

  // Pause hero timers when scrolled out of view so downstream sections suffer zero CPU cost
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reduced-motion fallback timer (normal visitors advance directly when typewriter finishes removing text)
  useEffect(() => {
    if (!isHeroVisible || typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!reducedMotion) return;

    const duration = activeSlide === 2 ? 12000 : 6500;
    const timeoutId = setTimeout(handleAdvanceSlide, duration);
    return () => clearTimeout(timeoutId);
  }, [activeSlide, isHeroVisible, handleAdvanceSlide]);

  const handleSelectSlide = (idx: number) => {
    if (idx === activeSlide) return;
    setActiveSlide(idx);
  };

  // Dispatch custom window event when slide changes to allow Navbar to sync contrast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('winsor-hero-slide-change', { detail: { activeSlide } });
      window.dispatchEvent(event);
    }

    // Lazy load and play/pause the 35MB video only when Slide 3 is requested
    if (activeSlide === 2) {
      setVideoLoaded(true);
      if (videoRef.current) {
        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current?.pause();
    }
  }, [activeSlide]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isDarkSlide = activeSlide === 2;

  return (
    <div
      ref={heroRef}
      id="hero"
      className="relative w-full overflow-clip"
      style={{
        height: isMobile ? '380px' : '100vh',
        backgroundColor: isDarkSlide ? '#050302' : '#FFFFFF',
        transition: 'background-color 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        borderBottom: `1px solid ${isDarkSlide ? 'rgba(201, 161, 74, 0.2)' : 'transparent'}`
      }}
    >
      {/* BACKGROUND GRAPHICS */}

      {/* Slide 3 Video (Cinematic Dark Mode Backdrop - Loaded On-Demand) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        src={videoLoaded ? "/watch_smoke_vid.webm" : undefined}
        style={{
          opacity: isDarkSlide ? 0.75 : 0,
          visibility: isDarkSlide ? 'visible' : 'hidden',
          transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
          zIndex: 1
        }}
      />

      {isDarkSlide && (
        <div
          className="absolute inset-0 z-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(5,3,2,0.96) 0%, rgba(5,3,2,0.2) 50%, rgba(5,3,2,0.96) 100%)'
          }}
        />
      )}

      {/* Slide 1 & 2 Luxury Fabric Backdrops (Light Mode Backdrop) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          opacity: isDarkSlide ? 0 : 1,
          visibility: isDarkSlide ? 'hidden' : 'visible',
          transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
          zIndex: 1
        }}
      >
        {/* Slide 0: Ivory & Champagne Silk Fabric Backdrop for Classic Diver */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: activeSlide === 0 ? 1 : 0,
            visibility: activeSlide === 0 ? 'visible' : 'hidden',
          }}
        >
          <Image
            src="/hero_silk_pearl.jpg"
            alt="Winsor Classic Luxury Silk Backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-center"
            style={{
              filter: 'none',
            }}
          />
        </div>

        {/* Slide 1: Sculptural Silver Platinum Liquid Silk & Technical Fabric Backdrop for Sport Watch */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: activeSlide === 1 ? 1 : 0,
            visibility: activeSlide === 1 ? 'visible' : 'hidden',
          }}
        >
          <Image
            src="/hero_silk_greige.jpg"
            alt="Winsor Sport Platinum Silk Backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-center"
            style={{
              filter: 'none',
            }}
          />
        </div>

        {/* Soft warm studio glow behind the watch */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isMobile
              ? 'radial-gradient(ellipse 60% 55% at 78% 48%, rgba(255,252,246,0.75) 0%, rgba(255,252,246,0) 70%)'
              : 'radial-gradient(ellipse 34% 48% at 70% 50%, rgba(255,252,246,0.8) 0%, rgba(255,252,246,0) 72%)',
          }}
        />

        {/* Seamless fade into the white page: top (under navbar) and bottom (into collection cards) */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: isMobile ? '70px' : '140px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: isMobile ? '110px' : '34%',
            background: 'linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0.85) 28%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Restrained Architectural Dial Circles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="1050" cy="430" r="260" stroke="rgba(20, 20, 20, 0.035)" strokeWidth="1" />
          <circle cx="1050" cy="430" r="360" stroke="rgba(20, 20, 20, 0.02)" strokeWidth="1" />
        </svg>
      </div>

      {/* SLIDES CONTAINER */}
      <div className="relative w-full h-full z-10">
        {slides.map((slide, idx) => {
          const isActive = activeSlide === idx;
          return (
            <div
              key={idx}
              className="absolute inset-0 w-full h-full flex flex-row justify-between"
              style={{
                opacity: isActive ? 1 : 0,
                visibility: isActive ? 'visible' : 'hidden',
                transition: 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.8s',
                padding: isMobile ? '106px 16px 0 16px' : '0 12% 0 12%',
                alignItems: isMobile ? 'flex-start' : 'center'
              }}
            >
              {/* Left Column: Text Info */}
              <div
                className="flex flex-col text-left animate-fade-in-up"
                style={{
                  zIndex: 20,
                  width: isMobile ? '55%' : 'auto',
                  maxWidth: isMobile ? 'none' : '540px',
                  transform: isActive ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              >
                {/* Discreet Dubai Registered Luxury House Hallmark */}
                <div
                  className="inline-flex items-center w-fit uppercase"
                  style={{
                    gap: isMobile ? '5px' : '8px',
                    padding: isMobile ? '2.5px 8px' : '4px 12px',
                    marginBottom: isMobile ? '8px' : '14px',
                    borderRadius: '999px',
                    border: `1px solid ${isDarkSlide ? 'rgba(223, 177, 91, 0.34)' : 'rgba(139, 105, 20, 0.24)'}`,
                    backgroundColor: isDarkSlide ? 'rgba(14, 10, 6, 0.55)' : 'rgba(139, 105, 20, 0.045)',
                    backdropFilter: 'blur(6px)',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: isMobile ? '6.5px' : '9.5px',
                    fontWeight: 500,
                    letterSpacing: isMobile ? '0.18em' : '0.24em',
                    color: isDarkSlide ? 'rgba(243, 214, 152, 0.95)' : '#6e5210',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg
                    width={isMobile ? 7 : 9}
                    height={isMobile ? 7 : 9}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 1L10.5 6L6 11L1.5 6L6 1Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle cx="6" cy="6" r="1.4" fill="currentColor" />
                  </svg>
                  <span>Dubai Registered Brand</span>
                </div>

                {/* Pre-Title Label with Architectural Gold Hairline */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: isMobile ? '12px' : '22px',
                      height: '1px',
                      backgroundColor: isDarkSlide ? '#dfb15b' : '#8b6914',
                      opacity: 0.78,
                      flexShrink: 0,
                      transition: 'background-color 0.4s ease',
                    }}
                  />
                  <p
                    className="tracking-[0.22em] font-semibold uppercase"
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: isMobile ? '7.5px' : '11px',
                      color: isDarkSlide ? '#dfb15b' : '#8b6914',
                      margin: 0,
                    }}
                  >
                    {slide.preTitle}
                  </p>
                </div>

                {/* Composed Editorial Typewriter & Erase Heading */}
                <HeroEditorialTypewriter
                  phrase={slide.phrase}
                  asHeading={idx === 0 ? 'h1' : 'h2'}
                  isActive={isActive}
                  isHeroVisible={isHeroVisible}
                  isDarkSlide={isDarkSlide}
                  isMobile={isMobile}
                  startCompleted={idx === 0}
                  initialHoldMs={2300}
                  holdDurationMs={idx === 2 ? 6000 : 2800}
                  onSequenceComplete={handleAdvanceSlide}
                />

                {/* Tagline Description */}
                <p
                  className="leading-relaxed mb-5 font-normal"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: isMobile ? '9.5px' : '14px',
                    color: isDarkSlide ? 'rgba(255,255,255,0.75)' : 'rgba(20,20,20,0.68)',
                    maxWidth: '420px',
                  }}
                >
                  {slide.description}
                </p>

                {/* Call-to-action Button */}
                <div>
                  <a
                    href={slide.link}
                    className="inline-block transition-all duration-300 font-medium tracking-[0.16em]"
                    style={{
                      background: isDarkSlide
                        ? 'linear-gradient(135deg, #E5BA6A 0%, #D4A753 100%)'
                        : 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)',
                      border: `1px solid ${isDarkSlide ? '#D4A753' : '#8B6914'}`,
                      color: isDarkSlide ? '#0A0704' : '#ffffff',
                      padding: isMobile ? '7px 18px' : '13px 32px',
                      fontSize: isMobile ? '8.5px' : '11px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontFamily: "'Jost', sans-serif",
                      boxShadow: isDarkSlide
                        ? '0 4px 16px rgba(212, 167, 83, 0.28)'
                        : '0 4px 16px rgba(139, 105, 20, 0.25)',
                    }}
                    onMouseOver={(e) => {
                      if (isDarkSlide) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ECC478 0%, #DFB460 100%)';
                        e.currentTarget.style.borderColor = '#ECC478';
                        e.currentTarget.style.boxShadow = '0 6px 22px rgba(223, 177, 91, 0.42)';
                      } else {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7A5C10 0%, #684E0D 100%)';
                        e.currentTarget.style.borderColor = '#684E0D';
                        e.currentTarget.style.boxShadow = '0 6px 22px rgba(139, 105, 20, 0.38)';
                      }
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      if (isDarkSlide) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #E5BA6A 0%, #D4A753 100%)';
                        e.currentTarget.style.borderColor = '#D4A753';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 167, 83, 0.28)';
                      } else {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)';
                        e.currentTarget.style.borderColor = '#8B6914';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 105, 20, 0.25)';
                      }
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {slide.cta}
                  </a>
                </div>

                {/* Mobile Slider Dots Indicator */}
                {isMobile && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '12px',
                  }}>
                    {[0, 1, 2].map((slideIdx) => {
                      const isDotActive = activeSlide === slideIdx;
                      return (
                        <button
                          key={slideIdx}
                          onClick={() => handleSelectSlide(slideIdx)}
                          style={{
                            width: isDotActive ? '18px' : '6px',
                            height: '2.5px',
                            borderRadius: '1.2px',
                            backgroundColor: isDotActive
                              ? (isDarkSlide ? '#dfb15b' : '#8b6914')
                              : (isDarkSlide ? 'rgba(255,255,255,0.25)' : 'rgba(26,18,9,0.15)'),
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Watch image (For slide 1 and 2) */}
              {!slide.isVideo && slide.image && (
                <div
                  className="flex items-center justify-center relative"
                  style={{
                    zIndex: 15,
                    width: isMobile ? '45%' : 'auto',
                    transform: isActive ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(15px)',
                    transition: 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  {/* Realistic Ground Shadow under watch on Marble Pedestal */}
                  <div
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '-5px' : '-25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: isMobile ? '75%' : '70%',
                      height: isMobile ? '16px' : '36px',
                      background: 'radial-gradient(ellipse at center, rgba(26,18,9,0.25) 0%, rgba(26,18,9,0.06) 50%, transparent 75%)',
                      borderRadius: '50%',
                      filter: 'blur(5px)',
                      zIndex: 1,
                    }}
                  />
                  {idx === 0 ? (
                    <HeroLiveWatch isMobile={isMobile} />
                  ) : idx === 1 ? (
                    <HeroSportWatch isMobile={isMobile} />
                  ) : (
                    <Image
                      src={slide.image}
                      alt="Winsor Luxury Watch"
                      width={520}
                      height={520}
                      priority={false}
                      sizes="(max-width: 768px) 240px, 520px"
                      className="floating-watch object-contain relative z-10"
                      style={{
                        maxHeight: isMobile ? '160px' : '520px',
                        width: 'auto',
                        height: 'auto',
                        filter: 'drop-shadow(0 20px 30px rgba(26,18,9,0.12))'
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VERTICAL SLIDER CONTROLLER (RIGHT PANEL) */}
      <div
        style={{
          position: 'absolute',
          right: isMobile ? '16px' : '48px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          zIndex: 40,
        }}
      >
        {[0, 1, 2].map((idx) => {
          const numStr = String(idx + 1).padStart(2, '0');
          const isActive = activeSlide === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelectSlide(idx)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                padding: '4px 0',
                outline: 'none'
              }}
            >
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '11px',
                  fontWeight: isActive ? '600' : '400',
                  letterSpacing: '0.05em',
                  color: isActive
                    ? (isDarkSlide ? '#dfb15b' : '#8b6914')
                    : (isDarkSlide ? 'rgba(255,255,255,0.35)' : 'rgba(26,18,9,0.35)'),
                  transition: 'color 0.4s ease',
                }}
              >
                {numStr}
              </span>
              {isActive && (
                <div
                  style={{
                    width: '1.5px',
                    height: '20px',
                    background: isDarkSlide ? '#dfb15b' : '#8b6914',
                    marginTop: '6px',
                    transition: 'background-color 0.4s ease',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* SCROLL DOWN INDICATOR */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '35px' : '105px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          zIndex: 35,
          opacity: isDarkSlide ? 0.5 : 0.8,
          transition: 'opacity 0.4s ease'
        }}
      >
        <span
          style={{
            fontSize: '9px',
            color: isDarkSlide ? '#ffffff' : '#1a1209',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontFamily: "'Jost', sans-serif"
          }}
        >
          Scroll Down
        </span>
        <div style={{
          width: '18px',
          height: '28px',
          border: `1.2px solid ${isDarkSlide ? 'rgba(255,255,255,0.35)' : 'rgba(26,18,9,0.3)'}`,
          borderRadius: '9px',
          position: 'relative',
        }}>
          <div style={{
            width: '3.5px',
            height: '7px',
            background: isDarkSlide ? '#dfb15b' : '#8b6914',
            borderRadius: '2px',
            position: 'absolute',
            left: '50%',
            top: '5px',
            transform: 'translateX(-50%)',
            animation: 'scrollDot 1.8s infinite',
          }} />
        </div>
      </div>

      {/* CORE CSS ANIMATIONS */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .floating-watch {
          animation: float 4.5s ease-in-out infinite;
        }
        @keyframes scrollDot {
          0% { opacity: 0; transform: translate(-50%, 0); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, 10px); }
        }
        .wn-caret-slot[data-caret="idle"]::after,
        .wn-caret-slot[data-caret="moving"]::after {
          content: "";
          display: inline-block;
          width: var(--wn-caret-w, 2px);
          height: 0.86em;
          vertical-align: -0.09em;
          margin-left: 3px;
          border-radius: 1px;
          background: var(--wn-caret-bg);
          box-shadow: var(--wn-caret-glow);
          pointer-events: none;
          user-select: none;
          will-change: opacity;
        }
        .wn-caret-slot--italic[data-caret="idle"]::after,
        .wn-caret-slot--italic[data-caret="moving"]::after {
          margin-left: 4px;
        }
        .wn-caret-spacer::after {
          opacity: 0 !important;
          animation: none !important;
        }
        .wn-caret-slot[data-caret="idle"]::after {
          animation: wn-caret-pulse 1.05s ease-in-out infinite;
        }
        @keyframes wn-caret-pulse {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.14; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wn-caret-slot::after {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
