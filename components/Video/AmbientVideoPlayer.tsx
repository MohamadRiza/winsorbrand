'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface AmbientVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  roundedClassName?: string;
  borderClassName?: string;
  showAmbientToggle?: boolean;
  title?: string;
  defaultAmbientOn?: boolean;
}

export default function AmbientVideoPlayer({
  src,
  poster,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = true,
  playsInline = true,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-video',
  roundedClassName = 'rounded-[22px] sm:rounded-[28px]',
  borderClassName = 'border border-[#c5a059]/40',
  showAmbientToggle = true,
  title = 'Winsor Horology Timepiece Video',
  defaultAmbientOn = true,
}: AmbientVideoPlayerProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const [isAmbientOn, setIsAmbientOn] = useState<boolean>(defaultAmbientOn);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const main = mainVideoRef.current;
    const ambient = ambientVideoRef.current;
    if (!main || !ambient) return;

    ambient.muted = true;

    // Initial sync check in case of browser autoplay
    if (!main.paused && !main.ended) {
      setIsPlaying(true);
      if (isAmbientOn) {
        ambient.currentTime = main.currentTime;
        ambient.play().catch(() => {});
      }
    }

    const onPlay = () => {
      setIsPlaying(true);
      if (isAmbientOn && ambientVideoRef.current) {
        ambientVideoRef.current.currentTime = main.currentTime;
        ambientVideoRef.current.play().catch(() => {});
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      ambientVideoRef.current?.pause();
    };

    const onTimeUpdate = () => {
      if (mainVideoRef.current && ambientVideoRef.current) {
        const diff = Math.abs(ambientVideoRef.current.currentTime - mainVideoRef.current.currentTime);
        if (diff > 0.3) {
          ambientVideoRef.current.currentTime = mainVideoRef.current.currentTime;
        }
      }
    };

    const onSeeking = () => {
      if (ambientVideoRef.current && mainVideoRef.current) {
        ambientVideoRef.current.currentTime = mainVideoRef.current.currentTime;
      }
    };

    const onSeeked = () => {
      if (ambientVideoRef.current && mainVideoRef.current) {
        ambientVideoRef.current.currentTime = mainVideoRef.current.currentTime;
      }
    };

    const onRateChange = () => {
      if (ambientVideoRef.current && mainVideoRef.current) {
        ambientVideoRef.current.playbackRate = mainVideoRef.current.playbackRate;
      }
    };

    const onLoadedData = () => {
      setIsReady(true);
      if (ambientVideoRef.current && mainVideoRef.current) {
        ambientVideoRef.current.currentTime = mainVideoRef.current.currentTime;
      }
    };

    main.addEventListener('play', onPlay);
    main.addEventListener('playing', onPlay);
    main.addEventListener('pause', onPause);
    main.addEventListener('waiting', onPause);
    main.addEventListener('timeupdate', onTimeUpdate);
    main.addEventListener('seeking', onSeeking);
    main.addEventListener('seeked', onSeeked);
    main.addEventListener('ratechange', onRateChange);
    main.addEventListener('loadeddata', onLoadedData);

    return () => {
      main.removeEventListener('play', onPlay);
      main.removeEventListener('playing', onPlay);
      main.removeEventListener('pause', onPause);
      main.removeEventListener('waiting', onPause);
      main.removeEventListener('timeupdate', onTimeUpdate);
      main.removeEventListener('seeking', onSeeking);
      main.removeEventListener('seeked', onSeeked);
      main.removeEventListener('ratechange', onRateChange);
      main.removeEventListener('loadeddata', onLoadedData);
    };
  }, [src, isAmbientOn]);

  const toggleAmbientMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAmbientOn((prev) => {
      const nextState = !prev;
      if (nextState) {
        if (ambientVideoRef.current && mainVideoRef.current) {
          ambientVideoRef.current.currentTime = mainVideoRef.current.currentTime;
          if (!mainVideoRef.current.paused) {
            ambientVideoRef.current.play().catch(() => {});
          }
        }
      } else {
        ambientVideoRef.current?.pause();
      }
      return nextState;
    });
  };

  return (
    <div className={`relative ${containerClassName}`}>
      {/* ── 1. DYNAMIC AMBIENT VIDEO GLOW (Rectangular, True Video Aspect, Seamless Gaussian Falloff) ── */}
      <div
        aria-hidden="true"
        className={`ambient-mode-glow absolute inset-0 pointer-events-none select-none transition-all duration-700 ease-out ${
          isAmbientOn && isReady
            ? isPlaying
              ? 'opacity-75 sm:opacity-80'
              : 'opacity-30'
            : 'opacity-0'
        }`}
        style={{
          zIndex: 0,
          filter: 'blur(75px) saturate(185%) brightness(1.22)',
          transform: 'scale(1.08) translateZ(0)',
          willChange: 'filter, opacity, transform',
        }}
      >
        <video
          ref={ambientVideoRef}
          src={src}
          muted
          loop={loop}
          playsInline
          tabIndex={-1}
          aria-hidden="true"
          preload="auto"
          className={`w-full h-full object-cover ${roundedClassName}`}
        />
      </div>

      {/* ── 2. CRISP MAIN VIDEO CONTAINER WITH BEZEL & RECTANGULAR BASE GLOW ── */}
      <div
        className={`relative z-10 overflow-hidden ${roundedClassName} ${borderClassName} bg-black ${aspectRatio} ${className}`}
        style={{
          boxShadow: isAmbientOn
            ? '0 0 65px 12px rgba(230, 195, 110, 0.22), 0 0 0 1px rgba(212, 175, 55, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 20px 45px -15px rgba(139, 105, 20, 0.14), 0 8px 20px -8px rgba(0, 0, 0, 0.06)'
            : '0 0 0 1px rgba(212, 175, 55, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 20px 45px -15px rgba(139, 105, 20, 0.14), 0 8px 20px -8px rgba(0, 0, 0, 0.06)',
          transition: 'box-shadow 0.7s ease-out',
        }}
      >
        <video
          ref={mainVideoRef}
          src={src}
          poster={poster}
          controls={controls}
          muted={muted}
          loop={loop}
          autoPlay={autoPlay}
          playsInline={playsInline}
          className="w-full h-full object-cover"
          title={title}
        />

        {/* ── 3. ELEGANT LUXURY AMBIENT TOGGLE BADGE ── */}
        {showAmbientToggle && (
          <button
            type="button"
            onClick={toggleAmbientMode}
            title={isAmbientOn ? 'Turn ambient lighting off' : 'Turn ambient lighting on'}
            aria-label={isAmbientOn ? 'Turn ambient lighting off' : 'Turn ambient lighting on'}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-medium font-['Jost',sans-serif] backdrop-blur-xl transition-all duration-300 shadow-md cursor-pointer border select-none hover:scale-105 active:scale-95"
            style={{
              background: isAmbientOn ? 'rgba(15, 12, 8, 0.55)' : 'rgba(15, 12, 8, 0.35)',
              borderColor: isAmbientOn ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.18)',
              color: isAmbientOn ? '#F5E6B8' : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <span
              className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                isAmbientOn
                  ? 'bg-[#E5C158] shadow-[0_0_8px_#E5C158] animate-pulse'
                  : 'bg-white/35'
              }`}
            />
            <span className="hidden xs:inline sm:inline">AMBIENT</span>
            <span>{isAmbientOn ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
