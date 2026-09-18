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
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-28" style={{ background: '#faf7f0', color: '#1a1209' }}>
      {/* Heading */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-[28px] font-normal leading-tight tracking-tight sm:text-3xl md:text-[40px] md:leading-tight" style={{ color: '#1a1209' }}>
          Winsor Royal Steel 42mm Edition
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:mt-6 md:text-base" style={{ color: '#555555' }}>
          Forged from surgical-grade 316L stainless steel with an engraved caseback, sapphire crystal glass, and Japanese precision movement engineered for everyday prestige.
        </p>
      </div>

      {/* Hero block: product card + large lifestyle image */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:mt-14 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-10">
        {/* Product card */}
        <Link href="/collections" className="group flex flex-col cursor-pointer no-underline">
          <div className="relative overflow-hidden bg-[#faf7f0] p-4 sm:p-5 rounded-2xl border border-[rgba(26,18,9,0.06)] flex flex-col justify-between h-full shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(26,18,9,0.06)] hover:border-[#8B6914]/40">
            <span className="absolute left-6 top-6 z-10 bg-[#1a1209] text-white px-3 py-1 text-[10px] tracking-widest uppercase font-medium">
              Exclusive
            </span>
            <video
              ref={video360Ref}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              title="Winsor Royal Steel 360 Degree Rotating View"
              className="aspect-[4/5] w-full object-cover rounded-xl transition-transform duration-700 hover:scale-[1.03]"
              src="/watch360rotate.webm"
            />
            <div className="mt-5 space-y-1">
              <h3 className="text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-300 group-hover:text-[#8B6914]" style={{ color: '#1a1209' }}>
                WINSOR ROYAL STEEL 42MM EDITION
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#666666' }}>
                42 mm — Stainless steel case & bracelet — Japanese movement
              </p>
            </div>
          </div>
        </Link>

        {/* Large lifestyle video */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(26,18,9,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <video
            ref={videoSpaceRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            title="Winsor Atelier Craftsmanship Showcase"
            className="aspect-[4/3] h-full max-h-[720px] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:aspect-auto"
            src="/winsor_video.webm"
          />
        </div>
      </div>

      {/* Two Horizontal Banners (Slim, Ultra-Luxury Img 2 Match) */}
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6 space-y-5 sm:space-y-6">

        {/* Banner 1: ABOUT WINSOR */}
        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#faf7f0] border border-[rgba(26,18,9,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-[1.3fr_1fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Text Content */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col justify-center items-start text-left z-10 space-y-1.5 sm:space-y-2.5">
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase gold-reflect-text">
              ABOUT WINSOR
            </span>
            <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#1a1209] heading-reflect-text">
              Crafting timeless elegance since day one.
            </h3>
            <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#666666] leading-relaxed max-w-md hidden xs:block sm:block body-reflect-text">
              Winsor is more than a watch. It&apos;s a legacy of precision, craftsmanship and timeless style.
            </p>
            <div className="pt-1 sm:pt-3">
              <Link
                href="/our-story"
                className="inline-block border border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914] hover:text-white px-3.5 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-sm"
              >
                DISCOVER OUR STORY
              </Link>
            </div>
          </div>

          {/* Right Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px]">
            <Image
              src="/hmebnr1.webp"
              alt="Crafting timeless elegance"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Left-to-Right gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, #faf7f0 0%, rgba(250,247,240,0.85) 15%, transparent 50%)',
              }}
            />
          </div>
        </div>

        {/* Banner 2: LIMITED EDITION */}
        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#faf7f0] border border-[rgba(26,18,9,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-[1fr_1.4fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px] order-1">
            <Image
              src="/hmebnr2.webp"
              alt="Exclusivity Redefined"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Right-to-Left gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, #faf7f0 0%, rgba(250,247,240,0.85) 15%, transparent 50%)',
              }}
            />
          </div>

          {/* Right Text Content & Badge */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 text-left z-10 order-2">
            <div className="space-y-1.5 sm:space-y-2.5 max-w-xs sm:max-w-sm">
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase gold-reflect-text">
                LIMITED EDITION
              </span>
              <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#1a1209] heading-reflect-text">
                Exclusivity Redefined
              </h3>
              <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#666666] leading-relaxed hidden xs:block sm:block body-reflect-text">
                Only 100 pieces worldwide. Own a masterpiece.
              </p>
              <div className="pt-1 sm:pt-3">
                <Link
                  href="/collections"
                  className="inline-block border border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914] hover:text-white px-3.5 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-sm"
                >
                  RESERVE YOURS
                </Link>
              </div>
            </div>

            {/* Badge Box (100 PIECES ONLY) */}
            <div
              ref={badgeRef}
              className="relative overflow-hidden self-start sm:self-center border border-[#8B6914]/40 bg-[#FAF4E8] px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-md sm:rounded-lg text-center min-w-[85px] sm:min-w-[115px] flex-shrink-0 shadow-[0_4px_16px_rgba(139,105,20,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)] transition-all duration-300 hover:border-[#8B6914]/70 hover:shadow-[0_6px_20px_rgba(139,105,20,0.12)]"
            >
              {/* Subtle glass reflection sheen sliding across the badge box */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-md sm:rounded-lg"
              >
                <div className="badge-light-sheen" />
              </div>

              {/* Animated number 1-100 with left-to-right reflective gold shine */}
              <span className="block font-serif text-lg sm:text-2xl lg:text-3xl font-bold leading-none select-none relative z-10 gold-reflect-text tracking-tight">
                {pieceCount}
              </span>

              {/* PIECES ONLY text with left-to-right reflective gold shine */}
              <span className="block text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold tracking-[0.18em] uppercase mt-1 select-none relative z-10 gold-reflect-text">
                PIECES ONLY
              </span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes text-reflect-sweep {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: 0% 0;
          }
        }

        .gold-reflect-text {
          background: linear-gradient(
            90deg,
            #8B6914 0%,
            #8B6914 12%,
            #C5A059 22%,
            #FFF6D6 26%,
            #D4AF37 30%,
            #8B6914 40%,
            #8B6914 62%,
            #C5A059 72%,
            #FFF6D6 76%,
            #D4AF37 80%,
            #8B6914 90%,
            #8B6914 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-reflect-sweep 6s linear infinite;
          filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.15));
        }

        .heading-reflect-text {
          background: linear-gradient(
            90deg,
            #1a1209 0%,
            #1a1209 12%,
            #5a4632 22%,
            #e2d2b5 26%,
            #5a4632 30%,
            #1a1209 40%,
            #1a1209 62%,
            #5a4632 72%,
            #e2d2b5 76%,
            #5a4632 80%,
            #1a1209 90%,
            #1a1209 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-reflect-sweep 6s linear infinite;
          filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.1));
        }

        .body-reflect-text {
          background: linear-gradient(
            90deg,
            #666666 0%,
            #666666 12%,
            #8a7b6a 22%,
            #ded2bd 26%,
            #8a7b6a 30%,
            #666666 40%,
            #666666 62%,
            #8a7b6a 72%,
            #ded2bd 76%,
            #8a7b6a 80%,
            #666666 90%,
            #666666 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-reflect-sweep 6s linear infinite;
        }

        @keyframes badge-sheen-sweep {
          0% {
            transform: translateX(-160%) skewX(-20deg);
          }
          100% {
            transform: translateX(280%) skewX(-20deg);
          }
        }

        .badge-light-sheen {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: badge-sheen-sweep 6s linear infinite;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
};

export default WatchShowcase;

