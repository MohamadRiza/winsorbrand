'use client';

import { useState, useEffect, useRef } from 'react';

const IMAGES_COUNT = 600;

export default function Watch3DAssembly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [loadedCount, setLoadedCount] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [assemblyPercent, setAssemblyPercent] = useState(0);

  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);

  // Detect mobile view on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Opacities for smooth transitions during scroll
  const heroOpacity = Math.max(0, 1 - progress / 0.12);
  const scrollIndicatorOpacity = Math.max(0, 1 - progress / 0.05);
  const hudOpacity = Math.max(0, Math.min(1, (progress - 0.08) / 0.08));

  // Preload all WebP frames
  useEffect(() => {
    if (isMobile) {
      setImagesLoaded(true);
      return;
    }
    let loaded = 0;
    const imagesArray: HTMLImageElement[] = [];

    for (let i = 1; i <= IMAGES_COUNT; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames_webp/frame_${frameNum}.webp`;

      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === IMAGES_COUNT) {
          setImagesLoaded(true);
        }
      };

      img.onerror = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === IMAGES_COUNT) {
          setImagesLoaded(true);
        }
      };

      imagesArray.push(img);
    }

    imagesRef.current = imagesArray;
  }, [isMobile]);

  // Listen to scroll events to update target frame index
  useEffect(() => {
    if (isMobile || !imagesLoaded) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = -rect.top;
      const scrollHeight = rect.height - window.innerHeight;

      let scrollPercent = scrollTop / scrollHeight;
      scrollPercent = Math.max(0, Math.min(1, scrollPercent));
      setProgress(scrollPercent);

      // Determine the target frame (1 to 300)
      let targetFrame = 1;
      if (scrollPercent > 0.08) {
        const activeProgress = (scrollPercent - 0.08) / (0.92 - 0.08); // map [0.08, 0.92] to [0, 1]
        const clampedActive = Math.max(0, Math.min(1, activeProgress));
        targetFrame = Math.floor(clampedActive * (IMAGES_COUNT - 1)) + 1;
      }
      targetFrameRef.current = targetFrame;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run

    return () => window.removeEventListener('scroll', handleScroll);
  }, [imagesLoaded]);

  // Canvas drawing loop with frame LERP easing
  useEffect(() => {
    if (isMobile || !imagesLoaded) return;

    let animationFrameId: number;
    let localFrame = 1;

    const drawCanvas = (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imagesRef.current[frameIndex - 1];
      if (!img || !img.complete) return;

      // Get client size
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // High-DPI Retina scaling
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Ambient background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, '#100a06'); // Warm deep chocolate core
      bgGrad.addColorStop(1, '#050302'); // Pure black edges
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw deconstructed components frame (Cover Fit)
      const iw = img.width;
      const ih = img.height;
      const r = Math.max(width / iw, height / ih);
      const nw = iw * r;
      const nh = ih * r;
      const cx = (width - nw) / 2;
      const cy = (height - nh) / 2;
      ctx.drawImage(img, cx, cy, nw, nh);
    };

    const updateFrame = () => {
      const target = targetFrameRef.current;
      // Easing LERP equation
      localFrame += (target - localFrame) * 0.12;

      if (Math.abs(target - localFrame) < 0.05) {
        localFrame = target;
      }

      currentFrameRef.current = localFrame;
      const roundedFrame = Math.round(localFrame);

      // Draw current frame
      drawCanvas(roundedFrame);

      animationFrameId = requestAnimationFrame(updateFrame);
    };

    animationFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile, imagesLoaded]);

  // Mobile Hero View (using watch_smoke_vid.webm without loading frames)
  if (isMobile) {
    return (
      <div 
        id="hero" 
        className="w-full bg-[#050302] border-b border-[#8B6914]/20 overflow-hidden"
        style={{ 
          height: '50vh', 
          position: 'sticky', 
          top: '76px', // Position right below sticky mobile navbar
          zIndex: 10 
        }}
      >
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/watch_smoke_vid.webm"
        />

        {/* Ambient Overlay Gradient */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15)_20%,rgba(5,3,2,0.95)_90%)]" />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
          <p
            className="text-white/70 tracking-[0.35em] text-[10px] mb-2 uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
          >
            THE MASTER COLLECTION
          </p>

          <h1
            className="text-white text-4xl mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              letterSpacing: '0.12em',
              lineHeight: 1.1,
            }}
          >
            WINSOR
          </h1>

          <p
            className="text-white/80 tracking-[0.2em] text-[10px] mb-6 max-w-[260px] mx-auto leading-relaxed"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
          >
            WHERE PRECISION MEETS ELEGANCE
          </p>

          <div className="flex flex-row items-center gap-6">
            <a
              href="#collections"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.2em] text-[9px] uppercase font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                DISCOVER MORE
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-px bg-white/40" />
            </a>

            <a
              href="#shop"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.2em] text-[9px] uppercase font-medium"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                SHOP NOW
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-px bg-white/40" />
            </a>
          </div>
        </div>

        <style>{`
          @media (max-width: 767px) {
            /* Ensure subsequent home page elements scroll over the sticky hero */
            main > *:not(#hero) {
              position: relative;
              z-index: 20;
              background-color: #faf7f0; /* Match Winsor boutique cream background */
            }
          }
        `}</style>
      </div>
    );
  }

  // Luxury Loading Screen
  if (!imagesLoaded) {
    const loadedPercent = Math.round((loadedCount / IMAGES_COUNT) * 100);
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          background: '#050302',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dfb15b',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* Elegant loading spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '2px solid rgba(223, 177, 91, 0.1)',
              borderTopColor: '#dfb15b',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '24px',
              fontWeight: 300,
              letterSpacing: '0.25em',
              color: '#ffffff',
              margin: '10px 0 2px 0',
              textTransform: 'uppercase',
            }}
          >
            WINSOR
          </h2>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Loading Timepiece {loadedPercent}%
          </p>
        </div>
      </div>
    );
  }

  // Interactive 3D Scroll Assembly Container
  return (
    <div
      id="hero"
      ref={containerRef}
      className="relative w-full bg-[#050302] border-b border-[#8B6914]/20"
      style={{ height: '350vh' }}
    >
      {/* Sticky Canvas Box */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-[#050302]">

        {/* Full-screen webp animation canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ maxHeight: '100vh', maxWidth: '100vw' }}
        />

        {/* Ambient shadow gradient */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(5,3,2,0.9)_90%)]" />

        {/* Brand/Hero text overlay */}
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4"
          style={{
            opacity: heroOpacity,
            pointerEvents: heroOpacity > 0 ? 'auto' : 'none',
            transition: 'opacity 0.15s ease-out'
          }}
        >
          {/* Collection Name */}
          <p
            className="text-white/70 tracking-[0.45em] text-[10px] md:text-xs mb-6 uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
          >
            THE MASTER COLLECTION
          </p>

          {/* Brand Name */}
          <h1
            className="text-white text-5xl md:text-7xl lg:text-6xl mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              letterSpacing: '0.15em',
              lineHeight: 1.1,
            }}
          >
            WINSOR
          </h1>

          {/* Tagline */}
          <p
            className="text-white/80 tracking-[0.25em] text-xs md:text-sm mb-12 max-w-md mx-auto"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
          >
            WHERE PRECISION MEETS ELEGANCE
          </p>

          {/* Underlined Links - Longines Style */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <a
              href="#collections"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                DISCOVER MORE
              </span>
              <span
                className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"
              />
            </a>

            <a
              href="#shop"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                SHOP THE COLLECTION
              </span>
              <span
                className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"
              />
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30"
          style={{
            opacity: scrollIndicatorOpacity,
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease-out'
          }}
        >
          <p
            className="text-white/50 text-[9px] tracking-[0.35em] uppercase"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Scroll
          </p>
          <div className="w-px h-16 bg-white/20 relative overflow-hidden rounded-full">
            <div
              className="absolute top-0 left-0 w-full bg-white/70"
              style={{
                height: '35%',
                animation: 'scrollDrop 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-150%); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(350%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
