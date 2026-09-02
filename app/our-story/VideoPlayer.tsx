// app/our-story/VideoPlayer.tsx
"use client";

import { useRef, useState, useEffect } from "react";

const GOLD = "#8B6914";

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const MuteIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const UnmuteIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

export default function VideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.defaultMuted = true;
    video.muted = true;

    // IntersectionObserver: only play when in view, pause when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { rootMargin: '100px', threshold: 0.2 }
    );

    observer.observe(container);

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => {
      observer.disconnect();
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="group relative w-full aspect-video md:aspect-[21/9] max-h-[420px] rounded-xl overflow-hidden shadow-xl border border-[#8B6914]/25 bg-black cursor-pointer select-none"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        src="/winsor_Automatic_vid.webm"
        loop
        playsInline
        muted
        preload="metadata"
        className="w-full h-full object-cover"
        aria-label="Winsor Horology Craftsmanship Film"
      />

      {/* Luxury Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Center Play Button Overlay (visible when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1a1209]/80 backdrop-blur-md border border-[#dfb15b]/60 flex items-center justify-center text-[#dfb15b] shadow-2xl transition-transform transform group-hover:scale-110">
            <PlayIcon />
          </div>
        </div>
      )}

      {/* Top Left Label */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#dfb15b] animate-ping" />
        <span className="font-['Jost'] text-[10px] md:text-xs tracking-[0.25em] uppercase text-white/90 font-medium">
          WINSOR ATELIER CINEMA
        </span>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-[#8B6914] to-[#dfb15b] transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5 flex items-center gap-2.5 z-20">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-md border border-[#8B6914]/40 hover:border-[#dfb15b] hover:bg-[#8B6914] text-white flex items-center justify-center transition-all duration-200"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-md border border-[#8B6914]/40 hover:border-[#dfb15b] hover:bg-[#8B6914] text-white flex items-center justify-center transition-all duration-200"
        >
          {isMuted ? <MuteIcon /> : <UnmuteIcon />}
        </button>

        <button
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          className="hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-md border border-[#8B6914]/40 hover:border-[#dfb15b] hover:bg-[#8B6914] text-white items-center justify-center transition-all duration-200"
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}