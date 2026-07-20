'use client';

import { useState, useEffect } from 'react';

export default function Watch3DAssembly() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-advance slides with dynamic intervals (5s for image slides, 20s for video slide)
  useEffect(() => {
    const delay = activeSlide === 2 ? 20000 : 5000;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, delay);
    return () => clearInterval(timer);
  }, [activeSlide]); // Reset interval whenever slide changes manually

  // Dispatch custom window event when slide changes to allow Navbar to sync contrast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('winsor-hero-slide-change', { detail: { activeSlide } });
      window.dispatchEvent(event);
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

  interface SlideData {
    preTitle: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
    cta: string;
    link: string;
    image?: string;
    isVideo?: boolean;
  }

  const slides: SlideData[] = [
    {
      preTitle: "NEW COLLECTION 2026",
      titleLine1: "Crafted to",
      titleLine2: "Measure Time",
      titleLine3: "Beautifully",
      description: "Timeless design. Precision engineering. Made for generations.",
      cta: "EXPLORE COLLECTION",
      link: "#collections",
      image: "/winsor_hero_backgroundremoved.webp"
    },
    {
      preTitle: "THE HERITAGE SERIES",
      titleLine1: "Designed for",
      titleLine2: "Ultimate",
      titleLine3: "Prestige",
      description: "Elegance in every tick. Hand-finished details for the discerning collector.",
      cta: "VIEW HERITAGE",
      link: "#collections",
      image: "/winsor_hero_backgroundremoved_sport.webp"
    },
    {
      preTitle: "THE MASTER COLLECTION",
      titleLine1: "Where Precision",
      titleLine2: "Meets",
      titleLine3: "Elegance",
      description: "Experience the deconstructed art of automatic timepiece movements.",
      cta: "DISCOVER MASTER",
      link: "#collections",
      isVideo: true
    }
  ];

  const isDarkSlide = activeSlide === 2;

  return (
    <div
      id="hero"
      className="relative w-full overflow-hidden"
      style={{
        height: isMobile ? '380px' : '100vh',
        backgroundColor: isDarkSlide ? '#050302' : '#ffffff',
        transition: 'background-color 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        borderBottom: `1px solid ${isDarkSlide ? 'rgba(201, 161, 74, 0.2)' : 'rgba(139, 105, 20, 0.12)'}`
      }}
    >
      {/* BACKGROUND GRAPHICS */}

      {/* Slide 3 Video (Cinematic Dark Mode Backdrop) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/watch_smoke_vid.webm"
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

      {/* Slide 1 & 2 Golden Waves (Light Mode Backdrop) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDarkSlide ? 0 : 1,
          visibility: isDarkSlide ? 'hidden' : 'visible',
          transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
          zIndex: 1
        }}
      >
        <svg className="absolute right-0 top-0 h-full w-full" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M700 800 C 1100 800, 1440 500, 1440 0 L 1440 800 Z" fill="rgba(139, 105, 20, 0.02)" />
          <path d="M800 800 C 1050 650, 1150 450, 1440 300" stroke="url(#goldGrad)" strokeWidth="3" opacity="0.45" />
          <path d="M600 800 C 950 750, 1200 400, 1440 100" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.2" />
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b6914" />
              <stop offset="50%" stopColor="#dfb15b" />
              <stop offset="100%" stopColor="#f3e3b8" />
            </linearGradient>
          </defs>
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
                padding: isMobile ? '125px 16px 0 16px' : '0 12% 0 12%',
                alignItems: isMobile ? 'flex-start' : 'center'
              }}
            >
              {/* Left Column: Text Info */}
              <div
                className="flex flex-col text-left animate-fade-in-up"
                style={{
                  zIndex: 20,
                  width: isMobile ? '55%' : 'auto',
                  maxWidth: isMobile ? 'none' : '560px',
                  transform: isActive ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                  animationDelay: '0.1s'
                }}
              >
                {/* Pre-Title Label */}
                <p
                  className="tracking-[0.18em] mb-1.5 font-semibold"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: isMobile ? '7.5px' : '12px',
                    color: isDarkSlide ? '#dfb15b' : '#8b6914'
                  }}
                >
                  {slide.preTitle}
                </p>

                {/* Big Serif Heading */}
                <h1
                  className="mb-2 font-normal"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: isMobile ? '20px' : '62px',
                    lineHeight: 1.15,
                    color: isDarkSlide ? '#ffffff' : '#1a1209'
                  }}
                >
                  {slide.titleLine1}<br />
                  {slide.titleLine2} <span style={{ color: isDarkSlide ? '#dfb15b' : '#8b6914', fontStyle: 'italic' }}>{slide.titleLine3}</span>
                </h1>

                {/* Tagline Description */}
                <p
                  className="leading-relaxed mb-4 font-light"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: isMobile ? '9px' : '13.5px',
                    color: isDarkSlide ? 'rgba(255,255,255,0.75)' : 'rgba(26,18,9,0.7)'
                  }}
                >
                  {slide.description}
                </p>

                {/* Call-to-action Button */}
                <div>
                  <a
                    href={slide.link}
                    className="inline-block transition-all duration-300 font-medium tracking-[0.15em]"
                    style={{
                      border: `${isMobile ? '1px' : '1.5px'} solid ${isDarkSlide ? '#dfb15b' : '#8b6914'}`,
                      color: isDarkSlide ? '#dfb15b' : '#8b6914',
                      padding: isMobile ? '5px 12px' : '12px 28px',
                      fontSize: isMobile ? '8px' : '11.5px',
                      borderRadius: '0px',
                      textDecoration: 'none',
                      fontFamily: "'Jost', sans-serif",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkSlide ? '#dfb15b' : '#8b6914';
                      e.currentTarget.style.color = isDarkSlide ? '#050302' : '#ffffff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = isDarkSlide ? '#dfb15b' : '#8b6914';
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
                          onClick={() => setActiveSlide(slideIdx)}
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
                  <img
                    src={slide.image}
                    alt="Winsor Luxury Watch"
                    className="floating-watch object-contain"
                    style={{
                      maxHeight: isMobile ? '160px' : '520px',
                      width: '100%',
                      filter: 'drop-shadow(0 15px 35px rgba(26,18,9,0.06))'
                    }}
                  />
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
              onClick={() => setActiveSlide(idx)}
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
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
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
          0% { opacity: 0; top: 5px; }
          30% { opacity: 1; }
          100% { opacity: 0; top: 15px; }
        }
      `}</style>
    </div>
  );
}
