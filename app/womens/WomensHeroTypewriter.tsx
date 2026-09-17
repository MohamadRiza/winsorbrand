'use client';

import { useState, useEffect } from 'react';

interface WomensHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function WomensHeroTypewriter({
  title = "Women's Timepiece Collection",
  subtitle = "Timeless beauty designed to complement every moment. Explore delicate dials, gold accents, and Japanese movement reliability.",
}: WomensHeroTypewriterProps) {
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

        // 2. Type Title ("Women's Timepiece Collection")
        for (let i = 1; i <= title.length; i++) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          const char = title[i - 1];
          await wait(char === "'" ? 100 : char === ' ' ? 70 : 52);
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
              : 26
          );
        }
        if (isCancelled) return;

        // 4. Reading Hold Duration (4.5 seconds)
        await wait(4500);
        if (isCancelled) return;

        // 5. Deliberate Slow Removal - Subtitle backspaces smoothly
        setCursorPos('sub');
        for (let i = subtitle.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          await wait(22);
        }
        if (isCancelled) return;
        await wait(240);

        // 6. Deliberate Slow Removal - Title backspaces smoothly
        setCursorPos('title');
        for (let i = title.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          await wait(42);
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
        .womens-title-ghost {
          font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(26px, 3.4vw, 44px);
          font-weight: 600;
          line-height: 1.15;
          margin: 0;
          letter-spacing: 0.02em;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .womens-title-live {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(26px, 3.4vw, 44px);
          font-weight: 600;
          line-height: 1.15;
          margin: 0;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .womens-subtitle-ghost {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.6;
          max-width: 480px;
          margin: 0;
          font-weight: 300;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .womens-subtitle-live {
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
        .womens-caret {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          margin-left: 6px;
          vertical-align: -0.06em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 50%, #8B6914 100%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.35);
          border-radius: 1px;
          animation: womens-caret-pulse 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .womens-caret-sub {
          width: 1.8px;
          height: 0.88em;
          margin-left: 5px;
          vertical-align: -0.05em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 70%, #8B6914 100%);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }
        @keyframes womens-caret-pulse {
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
          .womens-title-ghost {
            text-align: center;
          }
          .womens-title-live {
            justify-content: center;
            text-align: center;
          }
          .womens-sub-container {
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .womens-subtitle-ghost,
          .womens-subtitle-live {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .womens-caret {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen-reader text for SEO & Accessibility */}
      <span className="sr-only">
        {title}. {subtitle}
      </span>

      {/* Title with Ghost Lock */}
      <div className="womens-title-container" style={{ position: 'relative', marginBottom: '14px', width: '100%' }}>
        <h1 className="womens-title-ghost" aria-hidden="true">
          {title}
        </h1>
        <h1 className="womens-title-live" aria-hidden="true">
          <span>
            {typedTitle}
            {cursorPos === 'title' && <span className="womens-caret" />}
          </span>
        </h1>
      </div>

      {/* Subtitle with Ghost Lock */}
      <div className="womens-sub-container" style={{ position: 'relative', maxWidth: '480px', marginBottom: '22px', width: '100%' }}>
        <p className="womens-subtitle-ghost" aria-hidden="true">
          {subtitle}
        </p>
        <p className="womens-subtitle-live" aria-hidden="true">
          <span>
            {typedSubtitle}
            {cursorPos === 'sub' && <span className="womens-caret womens-caret-sub" />}
          </span>
        </p>
      </div>
    </>
  );
}
