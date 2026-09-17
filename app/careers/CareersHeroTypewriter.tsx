'use client';

import { useState, useEffect } from 'react';

interface CareersHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function CareersHeroTypewriter({
  title = 'Careers at Winsor Atelier',
  subtitle = 'Crafting the future of haute horlogerie. Explore opportunities within our design, operations, and client relations sectors.',
}: CareersHeroTypewriterProps) {
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

        // 2. Type Title ("Careers at Winsor Atelier")
        for (let i = 1; i <= title.length; i++) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          const char = title[i - 1];
          await wait(char === ' ' ? 70 : 52);
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
        .careers-typewriter-container {
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
        }
        .careers-title-ghost {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4.5vw, 56px);
          font-weight: 300;
          letter-spacing: 0.02em;
          margin: 0;
          line-height: 1.15;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .careers-title-live {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4.5vw, 56px);
          font-weight: 300;
          letter-spacing: 0.02em;
          margin: 0;
          color: #ffffff;
          line-height: 1.15;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
        }
        .careers-subtitle-ghost {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(14px, 1.2vw, 17px);
          font-weight: 300;
          font-style: italic;
          letter-spacing: 0.02em;
          color: rgba(255, 255, 255, 0.85);
          max-width: 580px;
          line-height: 1.6;
          margin: 0 auto;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }
        .careers-subtitle-live {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(14px, 1.2vw, 17px);
          font-weight: 300;
          font-style: italic;
          letter-spacing: 0.02em;
          color: rgba(255, 255, 255, 0.85);
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.6;
          text-align: center;
        }
        .careers-caret {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          margin-left: 6px;
          vertical-align: -0.06em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 50%, #8B6914 100%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.35);
          border-radius: 1px;
          animation: careers-caret-pulse 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .careers-caret-sub {
          width: 1.8px;
          height: 0.88em;
          margin-left: 5px;
          vertical-align: -0.05em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 70%, #8B6914 100%);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }
        @keyframes careers-caret-pulse {
          0%, 100% {
            opacity: 1;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.15;
            transform: scaleY(0.85);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .careers-caret {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen-reader text for SEO & Accessibility */}
      <span className="sr-only">
        {title}. {subtitle}
      </span>

      <div className="careers-typewriter-container">
        {/* Title with Ghost Lock */}
        <div style={{ position: 'relative', marginBottom: '14px', width: '100%' }}>
          <h1 className="careers-title-ghost" aria-hidden="true">
            {title}
          </h1>
          <h1 className="careers-title-live" aria-hidden="true">
            <span>
              {typedTitle}
              {cursorPos === 'title' && <span className="careers-caret" />}
            </span>
          </h1>
        </div>

        {/* Subtitle with Ghost Lock */}
        <div style={{ position: 'relative', maxWidth: '580px', margin: '0 auto', width: '100%' }}>
          <p className="careers-subtitle-ghost" aria-hidden="true">
            {subtitle}
          </p>
          <p className="careers-subtitle-live" aria-hidden="true">
            <span>
              {typedSubtitle}
              {cursorPos === 'sub' && <span className="careers-caret careers-caret-sub" />}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
