'use client';

import { useEffect, useRef } from 'react';

export interface HeroEditorialPhrase {
  line1: string;
  line2: string;
  accent: string;
}

interface HeroEditorialTypewriterProps {
  phrase: HeroEditorialPhrase;
  asHeading?: 'h1' | 'h2';
  isActive: boolean;
  isHeroVisible: boolean;
  isDarkSlide: boolean;
  isMobile: boolean;
  startCompleted?: boolean;
  initialHoldMs?: number;
  holdDurationMs?: number;
  onSequenceComplete?: () => void;
}

function getPhraseLength(phrase: HeroEditorialPhrase): number {
  return phrase.line1.length + phrase.line2.length + phrase.accent.length;
}

function slicePhrase(phrase: HeroEditorialPhrase, charCount: number) {
  const l1Len = phrase.line1.length;
  const l2Len = phrase.line2.length;
  const accLen = phrase.accent.length;

  const clamped = Math.max(0, Math.min(charCount, l1Len + l2Len + accLen));

  const line1 = phrase.line1.slice(0, Math.min(clamped, l1Len));
  const afterL1 = Math.max(0, clamped - l1Len);
  const line2 = phrase.line2.slice(0, Math.min(afterL1, l2Len));
  const afterL2 = Math.max(0, afterL1 - l2Len);
  const accent = phrase.accent.slice(0, afterL2);

  let activeLine: 1 | 2 | 3 = 1;
  if (clamped > l1Len + l2Len) {
    activeLine = 3;
  } else if (clamped > l1Len) {
    activeLine = 2;
  }

  return { line1, line2, accent, showSep: afterL2 > 0, activeLine };
}

export default function HeroEditorialTypewriter({
  phrase,
  asHeading = 'h2',
  isActive,
  isHeroVisible,
  isDarkSlide,
  isMobile,
  startCompleted = false,
  initialHoldMs = 2300,
  holdDurationMs = 2800,
  onSequenceComplete,
}: HeroEditorialTypewriterProps) {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const sepRef = useRef<HTMLSpanElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);

  const slot1Ref = useRef<HTMLSpanElement>(null);
  const slot2Ref = useRef<HTMLSpanElement>(null);
  const slot3Ref = useRef<HTMLSpanElement>(null);

  const onCompleteRef = useRef(onSequenceComplete);
  onCompleteRef.current = onSequenceComplete;

  const maxLen = getPhraseLength(phrase);

  // Track engine state in refs so character ticks cause zero React re-renders
  const stateRef = useRef<{
    charCount: number;
    phase: 'hold' | 'deleting' | 'erased_pause' | 'typing';
    hasCompletedInitialLoad: boolean;
  }>({
    charCount: startCompleted ? maxLen : 0,
    phase: startCompleted ? 'hold' : 'typing',
    hasCompletedInitialLoad: false,
  });

  const paintDom = (charCount: number, mode: 'idle' | 'moving' | 'hidden') => {
    const { line1, line2, accent, showSep, activeLine } = slicePhrase(phrase, charCount);

    if (line1Ref.current) line1Ref.current.textContent = line1;
    if (line2Ref.current) line2Ref.current.textContent = line2;
    if (sepRef.current) sepRef.current.textContent = showSep ? ' ' : '';
    if (accentRef.current) accentRef.current.textContent = accent;

    const slots: Array<[HTMLSpanElement | null, 1 | 2 | 3]> = [
      [slot1Ref.current, 1],
      [slot2Ref.current, 2],
      [slot3Ref.current, 3],
    ];

    for (const [el, slot] of slots) {
      if (!el) continue;
      if (mode === 'hidden' || activeLine !== slot) {
        if (el.dataset.caret !== 'none') el.dataset.caret = 'none';
      } else if (el.dataset.caret !== mode) {
        el.dataset.caret = mode;
      }
    }
  };

  // Whenever this slide becomes active (other than first initial paint of Slide 0), start typing cleanly from empty
  useEffect(() => {
    if (!isActive) return;

    if (startCompleted && !stateRef.current.hasCompletedInitialLoad) {
      return;
    }

    stateRef.current.charCount = 0;
    stateRef.current.phase = 'typing';
    paintDom(0, 'idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery?.matches) {
      paintDom(maxLen, 'hidden');
      return;
    }

    if (!isActive || !isHeroVisible) {
      return;
    }

    let timerId: number | null = null;
    let isDisposed = false;

    const clearScheduled = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const scheduleStep = (delay: number) => {
      clearScheduled();
      if (isDisposed || document.hidden) return;
      timerId = window.setTimeout(runTick, delay);
    };

    const runTick = () => {
      if (isDisposed || document.hidden) return;

      const s = stateRef.current;

      if (s.phase === 'hold') {
        // Initial hold finished -> begin calm character removal before switching slide
        s.hasCompletedInitialLoad = true;
        s.phase = 'deleting';
        paintDom(s.charCount, 'moving');
        scheduleStep(42);
        return;
      }

      if (s.phase === 'typing') {
        s.hasCompletedInitialLoad = true;
        if (s.charCount < maxLen) {
          s.charCount += 1;
          paintDom(s.charCount, 'moving');

          if (s.charCount >= maxLen) {
            s.phase = 'hold';
            paintDom(s.charCount, 'idle');
            scheduleStep(holdDurationMs);
            return;
          }

          const { line1, line2, accent } = slicePhrase(phrase, s.charCount);
          const justTyped = (accent || line2 || line1).slice(-1);
          // Normal, refined luxury reading pace (calm and deliberate, not rushed)
          const typeDelay = justTyped === ',' ? 150 : justTyped === ' ' ? 95 : 68;
          scheduleStep(typeDelay);
        } else {
          s.phase = 'hold';
          paintDom(s.charCount, 'idle');
          scheduleStep(holdDurationMs);
        }
        return;
      }

      if (s.phase === 'deleting') {
        if (s.charCount > 0) {
          s.charCount -= 1;
          paintDom(s.charCount, 'moving');

          if (s.charCount === 0) {
            s.phase = 'erased_pause';
            paintDom(0, 'idle');
            // Text is completely removed -> brief clean pause, then transition to next watch image/video
            scheduleStep(220);
            return;
          }

          const { line1, line2, accent } = slicePhrase(phrase, s.charCount);
          const nextTail = (accent || line2 || line1).slice(-1);
          // Smooth, normal-speed backspace removal
          const deleteDelay = nextTail === ' ' ? 32 : 42;
          scheduleStep(deleteDelay);
        } else {
          s.phase = 'erased_pause';
          paintDom(0, 'idle');
          scheduleStep(220);
        }
        return;
      }

      // s.phase === 'erased_pause': text removal complete -> advance to next slide
      onCompleteRef.current?.();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearScheduled();
      } else if (!isDisposed) {
        scheduleStep(160);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Kick off loop cleanly
    const s = stateRef.current;
    if (s.phase === 'hold') {
      paintDom(s.charCount, 'idle');
      const delay = !s.hasCompletedInitialLoad ? initialHoldMs : holdDurationMs;
      scheduleStep(delay);
    } else if (s.phase === 'erased_pause') {
      onCompleteRef.current?.();
    } else {
      // Wait for watch/silk crossfade before writing in when entering a slide
      scheduleStep(s.charCount === 0 ? 340 : 68);
    }

    return () => {
      isDisposed = true;
      clearScheduled();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isHeroVisible]);

  const accentColor = isDarkSlide ? '#dfb15b' : '#8b6914';
  const headingColor = isDarkSlide ? '#ffffff' : '#141414';
  const caretBg = isDarkSlide
    ? 'linear-gradient(180deg, rgba(240,203,122,0.15) 0%, #f0cb7a 22%, #dfb15b 80%, rgba(223,177,91,0.15) 100%)'
    : 'linear-gradient(180deg, rgba(139,105,20,0.12) 0%, #a57f24 22%, #8b6914 80%, rgba(139,105,20,0.12) 100%)';
  const caretGlow = isDarkSlide
    ? '0 0 10px rgba(223, 177, 91, 0.55)'
    : '0 0 7px rgba(139, 105, 20, 0.28)';

  const headingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: isMobile ? '21px' : '58px',
    lineHeight: 1.12,
    letterSpacing: '-0.01em',
    color: headingColor,
    textShadow: isDarkSlide ? '0 2px 24px rgba(0, 0, 0, 0.45)' : 'none',
    '--wn-caret-bg': caretBg,
    '--wn-caret-glow': caretGlow,
    '--wn-caret-w': isMobile ? '1.25px' : '2px',
  } as React.CSSProperties;

  const semanticLabel = `${phrase.line1} ${phrase.line2} ${phrase.accent}`;
  const HeadingTag = asHeading;

  return (
    <HeadingTag className="mb-3 font-normal relative" style={headingStyle}>
      {/* Semantic full headline for accessibility & SEO while visual text animates */}
      <span className="sr-only">{semanticLabel}</span>

      {/* Zero-CLS Grid Stack: invisible copy reserves exact max width & height */}
      <span className="grid" aria-hidden="true">
        <span className="invisible pointer-events-none select-none col-start-1 row-start-1">
          {phrase.line1}
          <br />
          {phrase.line2}{' '}
          <span style={{ fontStyle: 'italic' }}>{phrase.accent}</span>
          <span className="wn-caret-slot wn-caret-spacer" data-caret="idle" />
        </span>

        {/* Live typed editorial layer rendered directly over spacer */}
        <span className="col-start-1 row-start-1">
          <span
            ref={slot1Ref}
            className="wn-caret-slot"
            data-caret={startCompleted ? 'none' : 'idle'}
          >
            {'\u200B'}
            <span ref={line1Ref}>{startCompleted ? phrase.line1 : ''}</span>
          </span>
          <br />
          <span>
            <span ref={slot2Ref} className="wn-caret-slot" data-caret="none">
              <span ref={line2Ref}>{startCompleted ? phrase.line2 : ''}</span>
            </span>
            <span ref={sepRef}>{startCompleted ? ' ' : ''}</span>
            <span
              ref={slot3Ref}
              className="wn-caret-slot wn-caret-slot--italic"
              data-caret={startCompleted ? 'idle' : 'none'}
            >
              <span
                ref={accentRef}
                style={{ color: accentColor, fontStyle: 'italic' }}
              >
                {startCompleted ? phrase.accent : ''}
              </span>
            </span>
          </span>
        </span>
      </span>
    </HeadingTag>
  );
}
