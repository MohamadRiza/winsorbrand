// app/our-story/VideoPlayer.tsx
// ── Client Component ("use client") ──────────────────────────────────────
"use client";

import { useRef, useState, useEffect } from "react";

const GOLD = "#8B6914";
const INK = "#1a1209";

// Minimal SVG Icons (Longines-inspired: small, elegant, monochrome)
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const MuteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const UnmuteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  // Auto-play on mount (muted for browser policy compliance)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = true;
    video.play().then(() => {
      setIsPlaying(true);
      setIsMuted(true);
    }).catch(() => {
      // Autoplay blocked; user will need to interact
      setIsPlaying(false);
    });

    const handleEnded = () => setIsPlaying(false);
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setIsPausedByUser(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setIsPausedByUser(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Only toggle play if clicking the video itself, not controls
    if ((e.target as HTMLElement).closest(".ws-ctrl-btn")) return;
    togglePlay();
  };

  return (
    <div 
      className={`ws-player ${!isPlaying || isPausedByUser ? "ws-paused" : ""}`}
      onClick={handleVideoClick}
      role="region"
      aria-label="Winsor atelier film player"
    >
      <video
        ref={videoRef}
        src="/longines.webm"
        loop
        playsInline
        preload="auto"
        style={{ display: "block" }}
        aria-label="Behind the scenes at Winsor atelier"
      />
      
      {/* Center play icon (subtle, only when paused & not hovering) */}
      <div className="ws-play-centre" aria-hidden="true">
        <div className="ws-play-centre-icon">
          <PlayIcon />
        </div>
      </div>

      {/* Minimal controls: bottom-right, small, elegant */}
      <div className="ws-player-controls" role="toolbar" aria-label="Video controls">
        <button
          className="ws-ctrl-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="ws-ctrl-btn"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MuteIcon /> : <UnmuteIcon />}
        </button>
      </div>
    </div>
  );
}