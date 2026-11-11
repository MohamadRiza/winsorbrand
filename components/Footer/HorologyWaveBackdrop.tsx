import React, { useId } from 'react';

interface RibbonPathSpec {
  d: string;
  strokeD: string;
  fillId: string;
  strokeId: string;
  shadowId: string;
  strokeWidth: number;
  strokeOpacity?: number;
  withGoldGlow?: boolean;
}

interface RibbonLayerProps {
  className: string;
  idPrefix: string;
  viewBox: string;
  preserveAspectRatio: string;
  softGlows: { cx: number; cy: number; rx: number; ry: number; fill: string; opacity: number }[];
  ribbons: RibbonPathSpec[];
}

function WaveRibbonSvg({
  className,
  idPrefix,
  viewBox,
  preserveAspectRatio,
  softGlows,
  ribbons,
}: RibbonLayerProps) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        {/* Crisp, whisper-soft architectural plaster/silk relief shadows */}
        <filter id={`${idPrefix}-shadow-left`} x="-10%" y="-20%" width="130%" height="150%">
          <feDropShadow dx="4" dy="7" stdDeviation="11" floodColor="#B8AC96" floodOpacity="0.14" />
        </filter>
        <filter id={`${idPrefix}-shadow-right`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="-5" dy="-7" stdDeviation="12" floodColor="#B8AC96" floodOpacity="0.14" />
        </filter>
        <filter id={`${idPrefix}-soft-wash`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        <filter id={`${idPrefix}-gold-glow`} x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="0.9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Predominantly pure luminous white & subtle alabaster surface gradients */}
        <linearGradient id={`${idPrefix}-left-upper`} x1="0%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#F5F2EA" />
          <stop offset="45%" stopColor="#FCFBF8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-left-lower`} x1="0%" y1="10%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#F3EFE5" />
          <stop offset="50%" stopColor="#FAF8F3" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-right-back`} x1="12%" y1="92%" x2="100%" y2="4%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="52%" stopColor="#FAF8F2" />
          <stop offset="100%" stopColor="#F3EFE6" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-right-front`} x1="10%" y1="100%" x2="96%" y2="18%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#F9F6EF" />
          <stop offset="100%" stopColor="#F2EDE2" />
        </linearGradient>

        {/* Fine jewelry-grade brushed gold hairline specular highlights */}
        <linearGradient id={`${idPrefix}-gold-left-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFC072" stopOpacity="0.22" />
          <stop offset="28%" stopColor="#C99A3B" stopOpacity="0.82" />
          <stop offset="62%" stopColor="#F0DC9B" stopOpacity="0.9" />
          <stop offset="88%" stopColor="#B88B2E" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-gold-left-b`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C89A36" stopOpacity="0.58" />
          <stop offset="48%" stopColor="#EBD48D" stopOpacity="0.82" />
          <stop offset="85%" stopColor="#B88B2E" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-gold-right-a`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="18%" stopColor="#C29436" stopOpacity="0.55" />
          <stop offset="56%" stopColor="#EFE0A5" stopOpacity="0.9" />
          <stop offset="85%" stopColor="#C69838" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#E4C676" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient id={`${idPrefix}-gold-right-b`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="22%" stopColor="#B88B2E" stopOpacity="0.5" />
          <stop offset="64%" stopColor="#E8CF84" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#C89B3B" stopOpacity="0.38" />
        </linearGradient>
      </defs>

      {softGlows.map((g, idx) => (
        <ellipse
          key={idx}
          cx={g.cx}
          cy={g.cy}
          rx={g.rx}
          ry={g.ry}
          fill={g.fill}
          opacity={g.opacity}
          filter={`url(#${idPrefix}-soft-wash)`}
        />
      ))}

      {ribbons.map((r, idx) => (
        <React.Fragment key={idx}>
          <path
            d={r.d}
            fill={`url(#${idPrefix}-${r.fillId})`}
            filter={`url(#${idPrefix}-${r.shadowId})`}
          />
          <path
            d={r.strokeD}
            fill="none"
            stroke={`url(#${idPrefix}-${r.strokeId})`}
            strokeWidth={r.strokeWidth}
            strokeOpacity={r.strokeOpacity ?? 1}
            filter={r.withGoldGlow ? `url(#${idPrefix}-gold-glow)` : undefined}
          />
        </React.Fragment>
      ))}
    </svg>
  );
}

const DESKTOP_RIBBONS: RibbonLayerProps = {
  className: 'ft-wave-svg-desktop',
  idPrefix: 'dsk',
  viewBox: '0 0 1600 320',
  preserveAspectRatio: 'xMidYMid slice',
  softGlows: [
    { cx: 240, cy: 40, rx: 340, ry: 125, fill: '#F3EFE6', opacity: 0.48 },
    { cx: 1360, cy: 50, rx: 350, ry: 130, fill: '#F3EFE6', opacity: 0.45 },
  ],
  ribbons: [
    {
      d: 'M 0 12 C 175 160, 390 268, 675 320 L 0 320 Z',
      strokeD: 'M 0 12 C 175 160, 390 268, 675 320',
      fillId: 'left-upper',
      strokeId: 'gold-left-a',
      shadowId: 'shadow-left',
      strokeWidth: 1.55,
      withGoldGlow: true,
    },
    {
      d: 'M 0 116 C 140 210, 295 280, 515 320 L 0 320 Z',
      strokeD: 'M 0 116 C 140 210, 295 280, 515 320',
      fillId: 'left-lower',
      strokeId: 'gold-left-b',
      shadowId: 'shadow-left',
      strokeWidth: 1.25,
    },
    {
      d: 'M 925 320 C 1215 262, 1430 150, 1592 0 L 1600 0 L 1600 320 Z',
      strokeD: 'M 925 320 C 1215 262, 1430 150, 1592 0',
      fillId: 'right-back',
      strokeId: 'gold-right-a',
      shadowId: 'shadow-right',
      strokeWidth: 1.65,
      withGoldGlow: true,
    },
    {
      d: 'M 1060 320 C 1278 280, 1455 212, 1600 108 L 1600 320 Z',
      strokeD: 'M 1060 320 C 1278 280, 1455 212, 1600 108',
      fillId: 'right-front',
      strokeId: 'gold-right-b',
      shadowId: 'shadow-right',
      strokeWidth: 1.25,
    },
  ],
};

const MOBILE_RIBBONS: RibbonLayerProps = {
  className: 'ft-wave-svg-mobile',
  idPrefix: 'mob',
  viewBox: '0 0 600 300',
  preserveAspectRatio: 'none',
  softGlows: [
    { cx: 70, cy: 35, rx: 135, ry: 95, fill: '#F3EFE6', opacity: 0.45 },
    { cx: 530, cy: 35, rx: 135, ry: 95, fill: '#F3EFE6', opacity: 0.45 },
  ],
  ribbons: [
    {
      d: 'M 0 68 C 46 188, 108 262, 200 300 L 0 300 Z',
      strokeD: 'M 0 68 C 46 188, 108 262, 200 300',
      fillId: 'left-upper',
      strokeId: 'gold-left-a',
      shadowId: 'shadow-left',
      strokeWidth: 1.45,
      withGoldGlow: true,
    },
    {
      d: 'M 0 172 C 38 232, 86 276, 145 300 L 0 300 Z',
      strokeD: 'M 0 172 C 38 232, 86 276, 145 300',
      fillId: 'left-lower',
      strokeId: 'gold-left-b',
      shadowId: 'shadow-left',
      strokeWidth: 1.15,
    },
    {
      d: 'M 400 300 C 492 262, 554 188, 600 68 L 600 300 Z',
      strokeD: 'M 400 300 C 492 262, 554 188, 600 68',
      fillId: 'right-back',
      strokeId: 'gold-right-a',
      shadowId: 'shadow-right',
      strokeWidth: 1.45,
      withGoldGlow: true,
    },
    {
      d: 'M 455 300 C 514 276, 562 232, 600 172 L 600 300 Z',
      strokeD: 'M 455 300 C 514 276, 562 232, 600 172',
      fillId: 'right-front',
      strokeId: 'gold-right-b',
      shadowId: 'shadow-right',
      strokeWidth: 1.15,
    },
  ],
};

/**
 * Desktop wave ribbons tuned for taller showcase sections (e.g. /gifts Shop by Occasion).
 * Uses soft horizontal S-folds with frosted champagne sheen so text and medallions sit on clean pearl white.
 */
const OCCASION_DESKTOP_RIBBONS: Omit<RibbonLayerProps, 'idPrefix'> = {
  className: 'ft-wave-svg-desktop',
  viewBox: '0 0 1600 380',
  preserveAspectRatio: 'none',
  softGlows: [
    { cx: 140, cy: 130, rx: 320, ry: 150, fill: '#F4F1EA', opacity: 0.36 },
    { cx: 1460, cy: 120, rx: 330, ry: 150, fill: '#F4F1EA', opacity: 0.36 },
  ],
  ribbons: [
    {
      d: 'M 0 64 C 240 88, 430 232, 740 318 C 1030 398, 1340 345, 1600 284 L 1600 380 L 0 380 Z',
      strokeD: 'M 0 64 C 240 88, 430 232, 740 318 C 1030 398, 1340 345, 1600 284',
      fillId: 'left-upper',
      strokeId: 'gold-left-a',
      shadowId: 'shadow-left',
      strokeWidth: 1.05,
      strokeOpacity: 0.42,
    },
    {
      d: 'M 0 176 C 210 228, 420 302, 710 380 L 0 380 Z',
      strokeD: 'M 0 176 C 210 228, 420 302, 710 380',
      fillId: 'left-lower',
      strokeId: 'gold-left-b',
      shadowId: 'shadow-left',
      strokeWidth: 0.9,
      strokeOpacity: 0.34,
    },
    {
      d: 'M 720 380 C 1040 330, 1320 218, 1600 76 L 1600 380 Z',
      strokeD: 'M 720 380 C 1040 330, 1320 218, 1600 76',
      fillId: 'right-back',
      strokeId: 'gold-right-a',
      shadowId: 'shadow-right',
      strokeWidth: 1.05,
      strokeOpacity: 0.42,
    },
    {
      d: 'M 1050 380 C 1270 335, 1455 258, 1600 162 L 1600 380 Z',
      strokeD: 'M 1050 380 C 1270 335, 1455 258, 1600 162',
      fillId: 'right-front',
      strokeId: 'gold-right-b',
      shadowId: 'shadow-right',
      strokeWidth: 0.9,
      strokeOpacity: 0.32,
    },
  ],
};

/**
 * Mobile wave ribbons tuned for tall stacked /gifts occasion sections.
 */
const OCCASION_MOBILE_RIBBONS: Omit<RibbonLayerProps, 'idPrefix'> = {
  className: 'ft-wave-svg-mobile',
  viewBox: '0 0 600 360',
  preserveAspectRatio: 'none',
  softGlows: [
    { cx: 70, cy: 130, rx: 140, ry: 110, fill: '#F4F1EA', opacity: 0.35 },
    { cx: 530, cy: 120, rx: 140, ry: 110, fill: '#F4F1EA', opacity: 0.35 },
  ],
  ribbons: [
    {
      d: 'M 0 118 C 125 148, 225 245, 390 315 C 480 345, 550 328, 600 296 L 600 360 L 0 360 Z',
      strokeD: 'M 0 118 C 125 148, 225 245, 390 315 C 480 345, 550 328, 600 296',
      fillId: 'left-upper',
      strokeId: 'gold-left-a',
      shadowId: 'shadow-left',
      strokeWidth: 0.95,
      strokeOpacity: 0.34,
    },
    {
      d: 'M 0 218 C 95 256, 195 314, 320 360 L 0 360 Z',
      strokeD: 'M 0 218 C 95 256, 195 314, 320 360',
      fillId: 'left-lower',
      strokeId: 'gold-left-b',
      shadowId: 'shadow-left',
      strokeWidth: 0.85,
      strokeOpacity: 0.28,
    },
    {
      d: 'M 290 360 C 425 312, 520 228, 600 128 L 600 360 Z',
      strokeD: 'M 290 360 C 425 312, 520 228, 600 128',
      fillId: 'right-back',
      strokeId: 'gold-right-a',
      shadowId: 'shadow-right',
      strokeWidth: 0.95,
      strokeOpacity: 0.34,
    },
  ],
};

interface HorologyWaveBackdropProps {
  /** 'footer' preserves the compact pre-footer banner; 'occasion' adapts curve spacing and bottom white fade for multi-row /gifts showcases. */
  variant?: 'footer' | 'occasion';
}

/**
 * Crisp luminous pearl-white sculpted satin ribbon backdrop with fine
 * champagne-gold hairline highlights rendered behind Winsor showcase bands.
 */
export default function HorologyWaveBackdrop({ variant = 'footer' }: HorologyWaveBackdropProps) {
  const uid = useId().replace(/:/g, '');
  const desktopSpec = variant === 'occasion' ? OCCASION_DESKTOP_RIBBONS : DESKTOP_RIBBONS;
  const mobileSpec = variant === 'occasion' ? OCCASION_MOBILE_RIBBONS : MOBILE_RIBBONS;
  const isOccasion = variant === 'occasion';

  return (
    <>
      <style>{`
        .ft-wave-svg-desktop {
          display: block;
        }
        .ft-wave-svg-mobile {
          display: none;
        }
        @media (max-width: 767px) {
          .ft-wave-svg-desktop {
            display: none !important;
          }
          .ft-wave-svg-mobile {
            display: block !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: isOccasion
            ? 'radial-gradient(ellipse 56% 90% at 50% 42%, #FFFFFF 0%, #FFFFFF 56%, #F8F5EE 100%)'
            : 'radial-gradient(ellipse 52% 96% at 50% 44%, #FFFFFF 0%, #FFFFFF 54%, #F7F4EC 100%)',
        }}
      >
        {/* Whisper-soft alabaster top/bottom transition glaze */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isOccasion
              ? 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 16%, rgba(255,255,255,0) 76%, rgba(255,255,255,0.85) 91%, #FFFFFF 100%)'
              : 'linear-gradient(180deg, rgba(242,237,226,0.2) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(242,237,226,0.22) 100%)',
          }}
        />

        <WaveRibbonSvg {...desktopSpec} idPrefix={`${uid}-dsk`} />
        <WaveRibbonSvg {...mobileSpec} idPrefix={`${uid}-mob`} />

        {isOccasion && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '44px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '64px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.78) 65%, #FFFFFF 100%)',
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
