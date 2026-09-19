'use client';

import { useState, useEffect } from 'react';

interface TrackHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function TrackHeroTypewriter({
  title = 'Track Your Timepiece',
  subtitle = 'Enter your unique order reference code and registered phone number to view real-time artisan assembly, dispatch, and delivery status.',
}: TrackHeroTypewriterProps) {
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

        // 2. Type Title ("Track Your Timepiece")
        for (let i = 1; i <= title.length; i++) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          const char = title[i - 1];
          await wait(char === ' ' ? 70 : 52);
        }
        if (isCancelled) return;
        await wait(320);

        // 3. Move cursor to Subtitle and type with punctuation pauses
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
              : char === '-'
              ? 90
              : char === ' '
              ? 35
              : 24
          );
        }
        if (isCancelled) return;

        // 4. Reading Hold Duration (4.5 seconds)
        await wait(4500);
        if (isCancelled) return;

        // 5. Deliberate Smooth Removal - Subtitle backspaces smoothly
        setCursorPos('sub');
        for (let i = subtitle.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          await wait(18);
        }
        if (isCancelled) return;
        await wait(240);

        // 6. Deliberate Smooth Removal - Title backspaces smoothly
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
        .track-title-ghost {
          font-family: 'Cormorant Garamond', 'Cinzel', Georgia, serif;
          font-size: clamp(26px, 4.2vw, 48px);
          font-weight: 300;
          line-height: 1.15;
          margin: 0 auto;
          letter-spacing: 0.02em;
          opacity: 0;
          pointer-events: none;
          user-select: none;
          text-align: center;
        }
        .track-title-live {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', 'Cinzel', Georgia, serif;
          font-size: clamp(26px, 4.2vw, 48px);
          font-weight: 300;
          line-height: 1.15;
          margin: 0;
          letter-spacing: 0.02em;
          color: #ffffff;
          text-align: center;
        }
        .track-subtitle-ghost {
          font-family: 'Jost', sans-serif;
          font-size: clamp(12px, 1.1vw, 14px);
          line-height: 1.6;
          max-width: 512px;
          margin: 0 auto;
          font-weight: 300;
          opacity: 0;
          pointer-events: none;
          user-select: none;
          text-align: center;
        }
        .track-subtitle-live {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          font-family: 'Jost', sans-serif;
          font-size: clamp(12px, 1.1vw, 14px);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.82);
          max-width: 512px;
          margin: 0 auto;
          font-weight: 300;
          text-align: center;
        }
        .track-caret {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          margin-left: 6px;
          vertical-align: -0.06em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 50%, #8B6914 100%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.35);
          border-radius: 1px;
          animation: track-caret-pulse 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .track-caret-sub {
          width: 1.8px;
          height: 0.88em;
          margin-left: 5px;
          vertical-align: -0.05em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 70%, #8B6914 100%);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }
        @keyframes track-caret-pulse {
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
          .track-caret {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen-reader text for SEO & Accessibility */}
      <span className="sr-only">
        {title}. {subtitle}
      </span>

      {/* Title with Ghost Lock */}
      <div className="track-title-container" style={{ position: 'relative', marginBottom: '12px', width: '100%' }}>
        <h1 className="track-title-ghost" aria-hidden="true">
          {title}
        </h1>
        <h1 className="track-title-live" aria-hidden="true">
          <span>
            {typedTitle}
            {cursorPos === 'title' && <span className="track-caret" />}
          </span>
        </h1>
      </div>

      {/* Subtitle with Ghost Lock */}
      <div className="track-sub-container" style={{ position: 'relative', maxWidth: '512px', margin: '0 auto', width: '100%' }}>
        <p className="track-subtitle-ghost" aria-hidden="true">
          {subtitle}
        </p>
        <p className="track-subtitle-live" aria-hidden="true">
          <span>
            {typedSubtitle}
            {cursorPos === 'sub' && <span className="track-caret track-caret-sub" />}
          </span>
        </p>
      </div>
    </>
  );
}
