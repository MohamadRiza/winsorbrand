'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const WatchShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const video360Ref = useRef<HTMLVideoElement>(null);
  const videoSpaceRef = useRef<HTMLVideoElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [pieceCount, setPieceCount] = useState(1);

  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;

    let animId: number | null = null;

    const startCountUp = () => {
      let startTime: number | null = null;
      const duration = 2400; // 2.4 seconds (within 2-3s)
      const startVal = 1;
      const targetVal = 100;

      setPieceCount(1);

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth ease-out cubic curve: fast start, graceful deceleration into 100
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startVal + (targetVal - startVal) * easeOut);
        setPieceCount(current);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setPieceCount(100);
        }
      };

      animId = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCountUp();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    // Explicitly enforce muted property for strict browser autoplay compliance
    const v1 = video360Ref.current;
    const v2 = videoSpaceRef.current;

    [v1, v2].forEach(v => {
      if (v) {
        v.defaultMuted = true;
        v.muted = true;
        v.play().catch(() => { });
      }
    });

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v1?.play().catch(() => { });
          v2?.play().catch(() => { });
        } else {
          v1?.pause();
          v2?.pause();
        }
      },
      { rootMargin: '150px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-24" style={{ background: '#F8F7F4', color: '#141414' }}>
      {/* Heading */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-[28px] font-normal leading-tight tracking-tight sm:text-3xl md:text-[40px] md:leading-tight" style={{ color: '#141414' }}>
          Winsor Royal Steel 42mm Edition
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:mt-6 md:text-base" style={{ color: '#555555' }}>
          Forged from surgical-grade 316L stainless steel with an engraved caseback, sapphire crystal glass, and Japanese precision movement engineered for everyday wear.
        </p>
      </div>

      {/* Hero block: product card + large lifestyle image */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:mt-14 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-10">
        {/* Product card */}
        <Link href="/collections" className="group flex flex-col cursor-pointer no-underline">
          <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-xl border border-black/[0.08] flex flex-col justify-between h-full shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(20,20,20,0.06)] hover:border-black/20">
            <span className="absolute left-6 top-6 z-10 bg-[#141414] text-white px-3 py-1 text-[10px] tracking-widest uppercase font-medium">
              Flagship
            </span>
            <video
              ref={video360Ref}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              title="Winsor Royal Steel 360 Degree Rotating View"
              className="aspect-[4/5] w-full object-cover rounded-lg transition-transform duration-700 hover:scale-[1.03]"
              src="/watch360rotate.webm"
            />
            <div className="mt-5 space-y-1">
              <h3 className="text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-300 group-hover:text-[#8B6914]" style={{ color: '#141414' }}>
                WINSOR ROYAL STEEL 42MM EDITION
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#666666' }}>
                42 mm — Stainless steel case & bracelet — Japanese movement
              </p>
            </div>
          </div>
        </Link>

        {/* Large lifestyle video */}
        <div className="overflow-hidden rounded-xl border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <video
            ref={videoSpaceRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            title="Winsor Craftsmanship Showcase"
            className="aspect-[4/3] h-full max-h-[720px] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:aspect-auto"
            src="/winsor_video.webm"
          />
        </div>
      </div>

      {/* Two Horizontal Editorial Banners */}
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6 space-y-5 sm:space-y-6">

        {/* Banner 1: ABOUT WINSOR */}
        <div className="group relative overflow-hidden rounded-xl bg-white border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] grid grid-cols-[1.3fr_1fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Text Content */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col justify-center items-start text-left z-10 space-y-1.5 sm:space-y-2.5">
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase">
              ABOUT WINSOR
            </span>
            <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#141414]">
              Designed for lasting precision.
            </h3>
            <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#555555] leading-relaxed max-w-md hidden xs:block sm:block">
              Every Winsor timepiece combines enduring materials, reliable movements, and balanced proportions for everyday confidence.
            </p>
            <div className="pt-1 sm:pt-3">
              <Link
                href="/our-story"
                className="inline-block rounded-[4px] border border-[#141414] text-[#141414] px-4 sm:px-5 py-1.5 sm:py-2 text-[9.5px] sm:text-[10.5px] lg:text-[11px] font-semibold tracking-[0.16em] uppercase"
                style={{
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)';
                  e.currentTarget.style.borderColor = '#8B6914';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(139, 105, 20, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#141414';
                  e.currentTarget.style.color = '#141414';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                OUR STORY
              </Link>
            </div>
          </div>

          {/* Right Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px]">
            <Image
              src="/hmebnr1.webp"
              alt="Designed for lasting precision"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Left-to-Right gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.85) 15%, transparent 50%)',
              }}
            />
          </div>
        </div>

        {/* Banner 2: LIMITED EDITION */}
        <div className="group relative overflow-hidden rounded-xl bg-white border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] grid grid-cols-[1fr_1.4fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px] order-1">
            <Image
              src="/hmebnr2.webp"
              alt="Numbered Limited Series"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Right-to-Left gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, #ffffff 0%, rgba(255,255,255,0.85) 15%, transparent 50%)',
              }}
            />
          </div>

          {/* Right Text Content & Badge */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 text-left z-10 order-2">
            <div className="space-y-1.5 sm:space-y-2.5 max-w-xs sm:max-w-sm">
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase">
                LIMITED EDITION
              </span>
              <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#141414]">
                Numbered Collector Series
              </h3>
              <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#555555] leading-relaxed hidden xs:block sm:block">
                Produced in strictly numbered batches of 100 pieces worldwide.
              </p>
              <div className="pt-1 sm:pt-3">
                <Link
                  href="/limited-edition"
                  className="inline-block rounded-[4px] border border-[#141414] text-[#141414] px-4 sm:px-5 py-1.5 sm:py-2 text-[9.5px] sm:text-[10.5px] lg:text-[11px] font-semibold tracking-[0.16em] uppercase"
                  style={{
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)';
                    e.currentTarget.style.borderColor = '#8B6914';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(139, 105, 20, 0.32)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#141414';
                    e.currentTarget.style.color = '#141414';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  VIEW SERIES
                </Link>
              </div>
            </div>

            {/* Badge Box (100 PIECES ONLY) */}
            <div
              ref={badgeRef}
              className="relative overflow-hidden self-start sm:self-center border border-black/10 bg-[#F8F7F4] px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-lg text-center min-w-[85px] sm:min-w-[115px] flex-shrink-0 transition-all duration-300"
            >
              <span className="block font-serif text-lg sm:text-2xl lg:text-3xl font-semibold leading-none select-none relative z-10 text-[#141414] tracking-tight">
                {pieceCount}
              </span>

              <span className="block text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold tracking-[0.18em] uppercase mt-1 select-none relative z-10 text-[#8B6914]">
                PIECES ONLY
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WatchShowcase;

