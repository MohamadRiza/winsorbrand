'use client';

import { useState, useEffect } from 'react';

interface GiftsHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function GiftsHeroTypewriter({
  title = 'Curated Gifts for Memorable Milestones',
  subtitle = 'Express your gratitude and love with a timeless Winsor timepiece. Crafted with Japanese precision movements and Dubai-verified quality.',
}: GiftsHeroTypewriterProps) {
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSubtitle, setTypedSubtitle] = useState('');
  const [cursorPos, setCursorPos] = useState<'title' | 'sub' | 'none'>('title');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedTitle(title);
      setTypedSubtitle(subtitle);
      setCursorPos('none');
      return;
    }

    let isCancelled = false;
    let activeTimer: any = null;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (isCancelled) return resolve();
        activeTimer = setTimeout(() => {
          activeTimer = null;
          resolve();
        }, ms);
      });

    const runLoop = async () => {
      while (!isCancelled) {
        // 1. Initial breath with cursor at title
        setTypedTitle('');
        setTypedSubtitle('');
        setCursorPos('title');
        await wait(450);
        if (isCancelled) return;

        // 2. Type Title ("Curated Gifts for Memorable Milestones")
        for (let i = 1; i <= title.length; i++) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          const char = title[i - 1];
          await wait(char === ' ' ? 70 : 50);
        }
        if (isCancelled) return;
        await wait(320);

        // 3. Move cursor to Subtitle and type
        setCursorPos('sub');
        for (let i = 1; i <= subtitle.length; i++) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          const char = subtitle[i - 1];
          await wait(
            char === '.'
              ? 220
              : char === ','
              ? 140
              : char === ' '
              ? 35
              : 25
          );
        }
        if (isCancelled) return;

        // 4. Reading Hold Duration (4.5 seconds)
        await wait(4500);
        if (isCancelled) return;

        // 5. Deliberate Removal - Subtitle backspaces smoothly
        setCursorPos('sub');
        for (let i = subtitle.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          await wait(20);
        }
        if (isCancelled) return;
        await wait(240);

        // 6. Deliberate Removal - Title backspaces smoothly
        setCursorPos('title');
        for (let i = title.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          await wait(38);
        }
        if (isCancelled) return;

        // 7. Empty pause on clean canvas with pulsing cursor before next loop
        setCursorPos('title');
        await wait(600);
      }
    };

    runLoop();

    return () => {
      isCancelled = true;
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, [title, subtitle, prefersReducedMotion]);

  return (
    <>
      <style>{`
        .gifts-typewriter-container {
          width: 100%;
        }
        .gifts-title-ghost {
          font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(26px, 3.4vw, 44px);
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: 0.02em;
          margin: 0;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .gifts-title-live {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(26px, 3.4vw, 44px);
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: 0.02em;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
        }
        .gifts-subtitle-ghost {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0;
          font-weight: 300;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .gifts-subtitle-live {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0;
          font-weight: 300;
        }
        .gifts-caret {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          margin-left: 6px;
          vertical-align: -0.06em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 50%, #8B6914 100%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.35);
          border-radius: 1px;
          animation: gifts-caret-pulse 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .gifts-caret-sub {
          width: 1.8px;
          height: 0.88em;
          margin-left: 5px;
          vertical-align: -0.05em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 70%, #8B6914 100%);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }
        @keyframes gifts-caret-pulse {
          0%, 100% {
            opacity: 1;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.15;
            transform: scaleY(0.85);
          }
        }
        @media (max-width: 900px) {
          .gifts-title-live {
            justify-content: center;
            text-align: center;
          }
          .gifts-subtitle-ghost, .gifts-subtitle-live {
            margin: 0 auto;
            text-align: center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gifts-caret {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen-reader text for SEO & Accessibility */}
      <span className="sr-only">
        {title}. {subtitle}
      </span>

      <div className="gifts-typewriter-container">
        {/* Title with Ghost Lock */}
        <div style={{ position: 'relative', marginBottom: '14px', width: '100%' }}>
          <h1 className="gifts-title-ghost" aria-hidden="true">
            {title}
          </h1>
          <h1 className="gifts-title-live" aria-hidden="true">
            <span>
              {typedTitle}
              {cursorPos === 'title' && <span className="gifts-caret" />}
            </span>
          </h1>
        </div>

        {/* Subtitle with Ghost Lock */}
        <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '22px', width: '100%' }}>
          <p className="gifts-subtitle-ghost" aria-hidden="true">
            {subtitle}
          </p>
          <p className="gifts-subtitle-live" aria-hidden="true">
            <span>
              {typedSubtitle}
              {cursorPos === 'sub' && <span className="gifts-caret gifts-caret-sub" />}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
