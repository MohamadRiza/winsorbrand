import React, { useId } from 'react';

export interface WinsorLoaderProps {
  /** Concise status label displayed beneath the animated butterfly crest */
  label?: string;
  /** Visual scale of the orbital crest stage */
  size?: 'sm' | 'md' | 'lg';
  /** Centers the loader inside a tall viewport stage for page-level transitions */
  fullScreen?: boolean;
  /** Surface contrast theme */
  theme?: 'light' | 'dark';
  /** Show the spaced hairline WINSOR wordmark beneath the emblem */
  showBrandWordmark?: boolean;
  /** Optional className for container overrides */
  className?: string;
}

const SIZE_CONFIG: Record<'sm' | 'md' | 'lg', { stage: number; crestW: number; wordmarkSize: number; labelSize: number; padY: number }> = {
  sm: { stage: 72, crestW: 34, wordmarkSize: 9, labelSize: 10, padY: 28 },
  md: { stage: 118, crestW: 56, wordmarkSize: 10.5, labelSize: 11, padY: 68 },
  lg: { stage: 142, crestW: 68, wordmarkSize: 11.5, labelSize: 11.5, padY: 88 },
};

const TICK_ANGLES = Array.from({ length: 36 }, (_, i) => i * 10);

export default function WinsorLoader({
  label = 'Loading Timepieces…',
  size = 'md',
  fullScreen = false,
  theme = 'light',
  showBrandWordmark = true,
  className = '',
}: WinsorLoaderProps) {
  const uid = useId().replace(/:/g, '');
  const cfg = SIZE_CONFIG[size];
  const isDark = theme === 'dark';

  const wingGradId = `wl-wing-${uid}`;
  const crownGradId = `wl-crown-${uid}`;
  const arcPrimaryGradId = `wl-arc1-${uid}`;
  const arcSecondaryGradId = `wl-arc2-${uid}`;
  const haloGradId = `wl-halo-${uid}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      className={`wl-root ${fullScreen ? 'wl-fullscreen' : ''} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: fullScreen ? '78vh' : undefined,
        padding: fullScreen ? '48px 20px' : `${cfg.padY}px 20px`,
        background: fullScreen ? (isDark ? '#0D0B08' : '#FFFFFF') : 'transparent',
        fontFamily: "'Jost', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .wl-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wl-ring-cw {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          animation: wl-orbit-cw 3.4s cubic-bezier(0.45, 0.08, 0.55, 0.92) infinite;
          will-change: transform;
          pointer-events: none;
        }
        .wl-ring-ccw {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          animation: wl-orbit-ccw 5.8s linear infinite;
          will-change: transform;
          pointer-events: none;
        }
        .wl-halo-layer {
          position: absolute;
          inset: -14%;
          animation: wl-halo-pulse 2.6s ease-in-out infinite;
          pointer-events: none;
        }
        .wl-crest-float {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: wl-float 2.2s ease-in-out infinite;
          will-change: transform;
          filter: drop-shadow(0 6px 14px rgba(139, 105, 20, 0.16));
        }
        .wl-wing-left {
          transform-box: view-box;
          transform-origin: 51px 58px;
          animation: wl-flutter-left 1.65s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          will-change: transform;
        }
        .wl-wing-right {
          transform-box: view-box;
          transform-origin: 89px 58px;
          animation: wl-flutter-right 1.65s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          will-change: transform;
        }
        .wl-crown-core {
          transform-box: view-box;
          transform-origin: 70px 58px;
          animation: wl-crown-breathe 1.65s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          will-change: transform;
        }
        .wl-mote-a {
          animation: wl-twinkle 2.4s ease-in-out infinite;
        }
        .wl-mote-b {
          animation: wl-twinkle 2.4s ease-in-out 1.2s infinite;
        }
        .wl-wordmark {
          margin-top: 16px;
          font-weight: 500;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          text-indent: 0.36em;
          background: linear-gradient(90deg, #8B6914 0%, #D4AF37 50%, #8B6914 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: wl-shimmer-text 3.2s linear infinite;
          line-height: 1;
        }
        .wl-label {
          margin: 8px 0 0;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-indent: 0.18em;
          font-weight: 400;
          text-align: center;
          line-height: 1.4;
        }
        @keyframes wl-orbit-cw {
          0%   { transform: rotate(0deg); }
          50%  { transform: rotate(195deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes wl-orbit-ccw {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes wl-flutter-left {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          42%      { transform: scaleX(0.64) skewY(-5deg) rotate(3deg); }
          55%      { transform: scaleX(0.66) skewY(-4deg) rotate(2.5deg); }
        }
        @keyframes wl-flutter-right {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          42%      { transform: scaleX(0.64) skewY(5deg) rotate(-3deg); }
          55%      { transform: scaleX(0.66) skewY(4deg) rotate(-2.5deg); }
        }
        @keyframes wl-crown-breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          45%      { transform: translateY(-2.5px) scale(1.03); }
        }
        @keyframes wl-float {
          0%, 100% { transform: translateY(1.5px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes wl-halo-pulse {
          0%, 100% { transform: scale(0.94); opacity: 0.55; }
          50%      { transform: scale(1.06); opacity: 0.95; }
        }
        @keyframes wl-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.75); }
          50%      { opacity: 0.95; transform: scale(1.18); }
        }
        @keyframes wl-shimmer-text {
          from { background-position: 200% center; }
          to   { background-position: 0% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-ring-cw,
          .wl-ring-ccw,
          .wl-wing-left,
          .wl-wing-right,
          .wl-crown-core,
          .wl-crest-float,
          .wl-halo-layer,
          .wl-mote-a,
          .wl-mote-b {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="wl-stage"
        style={{
          width: `${cfg.stage}px`,
          height: `${cfg.stage}px`,
        }}
      >
        {/* Ambient radial champagne glow */}
        <svg className="wl-halo-layer" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={haloGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={isDark ? '0.24' : '0.16'} />
              <stop offset="55%" stopColor="#D4AF37" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill={`url(#${haloGradId})`} />
        </svg>

        {/* Static hairline bezel track + micro watch dial ticks */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke={isDark ? 'rgba(212,175,55,0.28)' : 'rgba(139,105,20,0.18)'}
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke={isDark ? 'rgba(212,175,55,0.18)' : 'rgba(139,105,20,0.12)'}
            strokeWidth="0.75"
            strokeDasharray="2 5"
          />
          {TICK_ANGLES.map((deg) => {
            const major = deg % 90 === 0;
            return (
              <line
                key={deg}
                x1="100"
                y1={major ? '9.5' : '12'}
                x2="100"
                y2={major ? '17' : '15'}
                stroke={isDark ? 'rgba(229,193,92,0.58)' : 'rgba(139,105,20,0.42)'}
                strokeWidth={major ? '1.5' : '0.85'}
                strokeLinecap="round"
                transform={`rotate(${deg} 100 100)`}
              />
            );
          })}
        </svg>

        {/* Primary clockwise chamfered champagne-gold orbital sweep */}
        <svg className="wl-ring-cw" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id={arcPrimaryGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A6510" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#B88E1E" stopOpacity="0.82" />
              <stop offset="88%" stopColor="#E9CC70" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#FFF6D1" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Main sweeping arc (~130 deg along r=86 -> C=540.35) */}
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke={`url(#${arcPrimaryGradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="200 341"
          />
          {/* Leading jewel glint on orbital head */}
          <circle cx="186" cy="100" r="3.4" fill="#B88E1E" opacity="0.32" />
          <circle cx="186" cy="100" r="2.2" fill="#F2D77D" />
          <circle cx="186" cy="100" r="1.1" fill="#FFFFFF" />
          {/* Secondary opposite subtle counterbalance tail */}
          <path
            d="M 14 100 A 86 86 0 0 1 30 50"
            fill="none"
            stroke="#9E7B1C"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.58"
          />
        </svg>

        {/* Counter-clockwise fine inner butterfly orbital ring */}
        <svg className="wl-ring-ccw" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id={arcSecondaryGradId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D7B24B" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#9E7B1C" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#9E7B1C" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke={`url(#${arcSecondaryGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="122 331"
          />
          <polygon
            points="172,99.5 168.5,102.5 172,105.5 175.5,102.5"
            fill="#C99E2C"
            opacity="0.95"
          />
        </svg>

        {/* Subtle golden shimmer dust near wingtips */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle className="wl-mote-a" cx="50" cy="60" r="1.5" fill="#DFC06C" style={{ transformOrigin: '50px 60px' }} />
          <circle className="wl-mote-b" cx="150" cy="62" r="1.5" fill="#DFC06C" style={{ transformOrigin: '150px 62px' }} />
        </svg>

        {/* Sculpted Winsor winged butterfly crest */}
        <div
          className="wl-crest-float"
          style={{
            width: `${cfg.crestW}px`,
            height: `${Math.round((cfg.crestW * 114) / 140)}px`,
          }}
        >
          <svg viewBox="0 0 140 114" width="100%" height="100%" aria-hidden="true">
            <defs>
              <linearGradient id={wingGradId} x1="12%" y1="0%" x2="88%" y2="100%">
                <stop offset="0%" stopColor="#EED68B" />
                <stop offset="28%" stopColor="#D3B052" />
                <stop offset="62%" stopColor="#A57E20" />
                <stop offset="100%" stopColor="#7C5B0E" />
              </linearGradient>
              <linearGradient id={crownGradId} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#F5E199" />
                <stop offset="45%" stopColor="#C9A23A" />
                <stop offset="100%" stopColor="#836110" />
              </linearGradient>
            </defs>

            {/* Left butterfly wing */}
            <g className="wl-wing-left">
              <path
                d="M 3 3 C 18 13, 31 23, 42 33 L 47 45 L 48.5 57 L 50 69 L 51.5 84 L 43 96 L 30 108 L 26.5 96 L 25 84 L 34 68 C 28 58, 16 47, 8 36 C 4.5 27, 3.5 16, 3 3 Z"
                fill={`url(#${wingGradId})`}
              />
              <path
                d="M 6 7 C 19 16, 30 25, 39 34 L 43 45 L 39 46 C 28 37, 17 28, 10 21 C 7 15, 6.2 11, 6 7 Z"
                fill="rgba(255, 248, 214, 0.28)"
              />
            </g>

            {/* Central crown chevron bridge */}
            <g className="wl-crown-core">
              <path
                d="M 70 42 L 87 60 L 84.5 76 L 78 70 L 70 61.5 L 62 70 L 55.5 76 L 53 60 Z"
                fill={`url(#${crownGradId})`}
              />
              <path
                d="M 70 44 L 82 57.5 L 70 55 L 58 57.5 Z"
                fill="rgba(255, 249, 220, 0.34)"
              />
            </g>

            {/* Right butterfly wing (exact symmetrical mirror) */}
            <g className="wl-wing-right">
              <path
                d="M 137 3 C 122 13, 109 23, 98 33 L 93 45 L 91.5 57 L 90 69 L 88.5 84 L 97 96 L 110 108 L 113.5 96 L 115 84 L 106 68 C 112 58, 124 47, 132 36 C 135.5 27, 136.5 16, 137 3 Z"
                fill={`url(#${wingGradId})`}
              />
              <path
                d="M 134 7 C 121 16, 110 25, 101 34 L 97 45 L 101 46 C 112 37, 123 28, 130 21 C 133 15, 133.8 11, 134 7 Z"
                fill="rgba(255, 248, 214, 0.28)"
              />
            </g>
          </svg>
        </div>
      </div>

      {showBrandWordmark && (
        <>
          <span
            className="wl-wordmark"
            style={{
              fontSize: `${cfg.wordmarkSize}px`,
            }}
          >
            WINSOR
          </span>
          <span
            aria-hidden="true"
            style={{
              width: '26px',
              height: '1px',
              marginTop: '7px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(166,124,25,0.55) 50%, transparent 100%)',
              display: 'block',
            }}
          />
        </>
      )}

      {label ? (
        <p
          className="wl-label"
          style={{
            fontSize: `${cfg.labelSize}px`,
            color: isDark ? 'rgba(246, 240, 224, 0.7)' : 'rgba(26, 18, 9, 0.56)',
            marginTop: showBrandWordmark ? '6px' : '14px',
          }}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
