'use client';

import { useState, useEffect } from 'react';

export default function Watch3DAssembly() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      id="hero" 
      className="relative w-full bg-[#050302] border-b border-[#8B6914]/20 overflow-hidden"
      style={{ height: isMobile ? '80vh' : '100vh' }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/watch_smoke_vid.webm"
        style={{ opacity: 0.85 }}
      />

      {/* Ambient shadow gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15)_20%,rgba(5,3,2,0.95)_90%)]" />

      {/* Brand/Hero text overlay */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4"
        style={{
          background: 'linear-gradient(to top, rgba(5,3,2,0.96) 0%, rgba(5,3,2,0.15) 50%, rgba(5,3,2,0.96) 100%)'
        }}
      >
        {/* Collection Name */}
        <p
          className="text-white/80 tracking-[0.45em] text-[10px] md:text-xs mb-6 uppercase animate-fade-in-up"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, animationDelay: '0.2s' }}
        >
          THE MASTER COLLECTION
        </p>

        {/* Brand Name */}
        <h1
          className="text-white text-6xl md:text-8xl lg:text-9xl mb-6 uppercase animate-fade-in-up"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            letterSpacing: '0.18em',
            lineHeight: 1.1,
            animationDelay: '0.4s'
          }}
        >
          WINSOR
        </h1>

        {/* Tagline */}
        <p
          className="text-white/80 tracking-[0.25em] text-xs md:text-sm mb-12 max-w-md mx-auto animate-fade-in-up"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, animationDelay: '0.6s' }}
        >
          WHERE PRECISION MEETS ELEGANCE
        </p>

        {/* Underlined Links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <a
            href="#collections"
            className="group relative inline-block"
            style={{ textDecoration: 'none' }}
          >
            <span
              className="text-[#f3e3b8] tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
            >
              DISCOVER MORE
            </span>
            <span
              className="absolute -bottom-1 left-0 w-0 h-px bg-[#c9a14a] transition-all duration-500 group-hover:w-full"
            />
          </a>

          <a
            href="#shop"
            className="group relative inline-block"
            style={{ textDecoration: 'none' }}
          >
            <span
              className="text-[#f3e3b8] tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
            >
              SHOP THE COLLECTION
            </span>
            <span
              className="absolute -bottom-1 left-0 w-0 h-px bg-[#c9a14a] transition-all duration-500 group-hover:w-full"
            />
          </a>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div 
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 35,
        }}
      >
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Scroll
        </span>
        <div style={{
          width: '20px',
          height: '32px',
          border: '1.5px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          position: 'relative',
        }}>
          <div style={{
            width: '4px',
            height: '8px',
            background: '#c9a14a',
            borderRadius: '2px',
            position: 'absolute',
            left: '50%',
            top: '6px',
            transform: 'translateX(-50%)',
            animation: 'scrollDot 1.8s infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes scrollDot {
          0% { opacity: 0; top: 6px; }
          30% { opacity: 1; }
          100% { opacity: 0; top: 18px; }
        }
      `}</style>
    </div>
  );
}
