"use client";

import { useState, useEffect } from "react";

interface StoryHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function StoryHeroTypewriter({
  title = "Ride Your Moment",
  subtitle = "Forging authentic horology, surgical-grade 316L steel, and Japanese precision movements — engineered for everyday prestige across Sri Lanka.",
}: StoryHeroTypewriterProps) {
  const [typedTitle, setTypedTitle] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [cursorPos, setCursorPos] = useState<"title" | "sub" | "none">("title");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedTitle(title);
      setTypedSubtitle(subtitle);
      setCursorPos("none");
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
        setTypedTitle("");
        setTypedSubtitle("");
        setCursorPos("title");
        await wait(450);
        if (isCancelled) return;

        // 2. Type Title ("Ride Your Moment")
        for (let i = 1; i <= title.length; i++) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          const char = title[i - 1];
          await wait(char === " " ? 75 : 55);
        }
        if (isCancelled) return;
        await wait(320);

        // 3. Move cursor to Subtitle and type
        setCursorPos("sub");
        for (let i = 1; i <= subtitle.length; i++) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          const char = subtitle[i - 1];
          await wait(
            char === "—"
              ? 240
              : char === ","
              ? 140
              : char === "."
              ? 220
              : char === " "
              ? 35
              : 25
          );
        }
        if (isCancelled) return;

        // 4. Reading Hold Duration (4.5 seconds)
        await wait(4500);
        if (isCancelled) return;

        // 5. Slow Removal - Subtitle backspaces deliberately
        setCursorPos("sub");
        for (let i = subtitle.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedSubtitle(subtitle.slice(0, i));
          await wait(22);
        }
        if (isCancelled) return;
        await wait(240);

        // 6. Slow Removal - Title backspaces deliberately
        setCursorPos("title");
        for (let i = title.length - 1; i >= 0; i--) {
          if (isCancelled) return;
          setTypedTitle(title.slice(0, i));
          await wait(42);
        }
        if (isCancelled) return;

        // 7. Empty pause on clean canvas with pulsing cursor
        setCursorPos("title");
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
      <style jsx>{`
        .story-caret {
          display: inline-block;
          width: 2.5px;
          height: 0.85em;
          margin-left: 6px;
          vertical-align: -0.06em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 50%, #8B6914 100%);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.35);
          border-radius: 1px;
          animation: story-caret-pulse 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .story-caret-sub {
          width: 1.8px;
          height: 0.88em;
          margin-left: 5px;
          vertical-align: -0.05em;
          background: linear-gradient(180deg, #F3E3B8 0%, #D4AF37 70%, #8B6914 100%);
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
        }
        @keyframes story-caret-pulse {
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
          .story-caret {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen-reader full text for SEO & Accessibility */}
      <span className="sr-only">
        {title}. {subtitle}
      </span>

      {/* Title with Ghost Lock to completely prevent layout shifts */}
      <div className="relative mb-4">
        <h1
          className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal leading-[1.12] tracking-tight text-transparent opacity-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          {title}
        </h1>
        <h1
          className="absolute inset-0 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal leading-[1.12] tracking-tight text-white flex items-center justify-center text-center"
          aria-hidden="true"
        >
          <span>
            {typedTitle}
            {cursorPos === "title" && <span className="story-caret" />}
          </span>
        </h1>
      </div>

      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b] to-transparent mx-auto mb-4 sm:mb-5" />

      {/* Subtitle with Ghost Lock to completely prevent layout shifts */}
      <div className="relative mb-7 sm:mb-8 max-w-xl mx-auto">
        <p
          className="font-serif text-sm sm:text-base md:text-lg font-light leading-relaxed opacity-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          {subtitle}
        </p>
        <p
          className="absolute top-0 left-0 right-0 font-serif text-sm sm:text-base md:text-lg font-light leading-relaxed text-white/85 text-center"
          aria-hidden="true"
        >
          <span>
            {typedSubtitle}
            {cursorPos === "sub" && <span className="story-caret story-caret-sub" />}
          </span>
        </p>
      </div>
    </>
  );
}
