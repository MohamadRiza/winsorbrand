'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

/**
 * Live Winsor sport watch.
 *
 * The base photo (1024x1024) keeps the rubber case, pushers and world-time ring.
 * The dial artwork (920x920, circular, digital windows blanked) is laid over the
 * photo's dial aperture and an SVG layer on top draws:
 *   - the three analog hands (hour / minute / smooth second)
 *   - the digital windows: HH:MM + date (left), weekday (right), seconds (bottom)
 * Everything follows the visitor's detected timezone.
 */

// Placement of the dial artwork on the 1024px base photo
const DIAL_CX = 512 / 1024; // centre x
const DIAL_CY = 500 / 1024; // centre y
const DIAL_SIZE = 352 / 1024; // diameter of the 920px artwork, as a fraction of the photo

const PX = 460; // pivot (dial centre) inside the 920 viewBox

function getTimezoneOffsetMs(timeZone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone }));
    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}

/* ---------- seven segment digits ---------- */

const LIT = '#c2c2c2';
const GHOST = '#101010';

const SEG_MAP: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  ' ': '',
};

function hexH(x1: number, x2: number, yc: number, t: number) {
  return `${x1},${yc} ${x1 + t / 2},${yc - t / 2} ${x2 - t / 2},${yc - t / 2} ${x2},${yc} ${x2 - t / 2},${yc + t / 2} ${x1 + t / 2},${yc + t / 2}`;
}
function hexV(y1: number, y2: number, xc: number, t: number) {
  return `${xc},${y1} ${xc + t / 2},${y1 + t / 2} ${xc + t / 2},${y2 - t / 2} ${xc},${y2} ${xc - t / 2},${y2 - t / 2} ${xc - t / 2},${y1 + t / 2}`;
}

function Digit({ x, y, w, h, t, ch }: { x: number; y: number; w: number; h: number; t: number; ch: string }) {
  const g = t * 0.45;
  const x0 = x + t / 2;
  const x1 = x + w - t / 2;
  const y0 = y + t / 2;
  const y1 = y + h - t / 2;
  const ym = y + h / 2;
  const segs: Record<string, string> = {
    a: hexH(x0 + g, x1 - g, y0, t),
    g: hexH(x0 + g, x1 - g, ym, t),
    d: hexH(x0 + g, x1 - g, y1, t),
    f: hexV(y0 + g, ym - g, x0, t),
    b: hexV(y0 + g, ym - g, x1, t),
    e: hexV(ym + g, y1 - g, x0, t),
    c: hexV(ym + g, y1 - g, x1, t),
  };
  const on = SEG_MAP[ch] ?? '';
  return (
    <g>
      {Object.keys(segs).map((k) => (
        <polygon key={k} points={segs[k]} fill={on.includes(k) ? LIT : GHOST} />
      ))}
    </g>
  );
}

function Colon({ x, y, h, t }: { x: number; y: number; h: number; t: number }) {
  return (
    <g fill={LIT}>
      <rect x={x} y={y + h * 0.28} width={t} height={t} />
      <rect x={x} y={y + h * 0.72 - t} width={t} height={t} />
    </g>
  );
}

/* ---------- letters for the weekday window ---------- */

const GLYPHS: Record<string, number[][][]> = {
  T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
  U: [[[0, 0], [0, 1], [1, 1], [1, 0]]],
  M: [[[0, 1], [0, 0], [0.5, 0.45], [1, 0], [1, 1]]],
  O: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
  W: [[[0, 0], [0, 1], [0.5, 0.55], [1, 1], [1, 0]]],
  E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.8, 0.5]]],
  H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
  F: [[[1, 0], [0, 0], [0, 1]], [[0, 0.5], [0.8, 0.5]]],
  R: [[[0, 1], [0, 0], [1, 0], [1, 0.5], [0, 0.5]], [[0.4, 0.5], [1, 1]]],
  S: [[[1, 0], [0, 0], [0, 0.5], [1, 0.5], [1, 1], [0, 1]]],
  A: [[[0, 1], [0, 0], [1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
};

function Letter({ x, y, w, h, t, ch }: { x: number; y: number; w: number; h: number; t: number; ch: string }) {
  const strokes = GLYPHS[ch] ?? [];
  const px = (u: number) => x + t / 2 + u * (w - t);
  const py = (v: number) => y + t / 2 + v * (h - t);
  return (
    <g fill="none" stroke={LIT} strokeWidth={t} strokeLinecap="butt" strokeLinejoin="miter">
      {strokes.map((s, i) => (
        <polyline key={i} points={s.map(([u, v]) => `${px(u)},${py(v)}`).join(' ')} />
      ))}
    </g>
  );
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

interface Digits {
  hh: string;
  mm: string;
  dd: string;
  wd: string;
  ss: string;
}

export default function HeroSportWatch({ isMobile }: { isMobile: boolean }) {
  const { geoInfo } = useCurrency();

  const offsetMsRef = useRef<number>(0);
  const activeTzRef = useRef<string>('Asia/Colombo');

  const hourRef = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const secRef = useRef<SVGGElement>(null);

  const [d, setD] = useState<Digits>({ hh: '10', mm: '08', dd: '27', wd: 'TU', ss: '15' });

  useEffect(() => {
    const targetTz = geoInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Colombo';
    activeTzRef.current = targetTz;
    offsetMsRef.current = getTimezoneOffsetMs(targetTz);

    const tzInterval = setInterval(() => {
      offsetMsRef.current = getTimezoneOffsetMs(activeTzRef.current);
    }, 60000);
    return () => clearInterval(tzInterval);
  }, [geoInfo]);

  useEffect(() => {
    let animId: number;
    let lastKey = '';

    const tick = () => {
      const date = new Date(Date.now() + offsetMsRef.current);
      const ms = date.getUTCMilliseconds();
      const s = date.getUTCSeconds() + ms / 1000;
      const m = date.getUTCMinutes() + s / 60;
      const h = (date.getUTCHours() % 12) + m / 60;

      secRef.current?.setAttribute('transform', `rotate(${s * 6} ${PX} ${PX})`);
      minRef.current?.setAttribute('transform', `rotate(${m * 6} ${PX} ${PX})`);
      hourRef.current?.setAttribute('transform', `rotate(${h * 30} ${PX} ${PX})`);

      // digital windows only change once per second
      const pad = (n: number) => String(n).padStart(2, '0');
      const next: Digits = {
        hh: pad(date.getUTCHours()),
        mm: pad(date.getUTCMinutes()),
        dd: String(date.getUTCDate()).padStart(2, ' '),
        wd: WEEKDAYS[date.getUTCDay()],
        ss: pad(date.getUTCSeconds()),
      };
      const key = `${next.hh}${next.mm}${next.dd}${next.wd}${next.ss}`;
      if (key !== lastKey) {
        lastKey = key;
        setD(next);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const size = isMobile ? 160 : 520;

  return (
    <div
      className="relative select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: '100%',
        position: 'relative',
        filter: 'drop-shadow(0 20px 30px rgba(26,18,9,0.16))',
      }}
    >
      {/* 1. Rubber case, pushers and world-time ring */}
      <Image
        src="/winsor_hero_backgroundremoved_sport.webp"
        alt="Winsor Sport Watch"
        width={520}
        height={520}
        priority={false}
        sizes="(max-width: 768px) 160px, 520px"
        className="object-contain relative z-10 pointer-events-none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* 2. Live dial */}
      <svg
        viewBox="0 0 920 920"
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          position: 'absolute',
          left: `${DIAL_CX * 100}%`,
          top: `${DIAL_CY * 100}%`,
          width: `${DIAL_SIZE * 100}%`,
          height: `${DIAL_SIZE * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 15,
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="sportHandShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        <image href="/clock/sport/watch_dial.webp" x="0" y="0" width="920" height="920" />

        {/* left window: HH:MM and day of month */}
        <Digit x={180} y={394} w={34} h={70} t={7} ch={d.hh[0]} />
        <Digit x={222} y={394} w={34} h={70} t={7} ch={d.hh[1]} />
        <Colon x={266} y={394} h={70} t={7} />
        <Digit x={284} y={394} w={34} h={70} t={7} ch={d.mm[0]} />
        <Digit x={326} y={394} w={34} h={70} t={7} ch={d.mm[1]} />
        <Digit x={232} y={492} w={34} h={60} t={6.5} ch={d.dd[0]} />
        <Digit x={274} y={492} w={34} h={60} t={6.5} ch={d.dd[1]} />

        {/* right window: weekday */}
        <Letter x={598} y={427} w={68} h={83} t={13} ch={d.wd[0]} />
        <Letter x={682} y={427} w={68} h={83} t={13} ch={d.wd[1]} />

        {/* bottom window: seconds */}
        <Digit x={418} y={654} w={42} h={84} t={8.5} ch={d.ss[0]} />
        <Digit x={470} y={654} w={42} h={84} t={8.5} ch={d.ss[1]} />

        {/* hands */}
        <g filter="url(#sportHandShadow)">
          {/* hour */}
          <g ref={hourRef} transform={`rotate(0 ${PX} ${PX})`}>
            <g transform={`translate(${PX} ${PX})`}>
              <polygon
                points="-25,-26 -29,-120 -5,-206 8,-206 29,-120 25,-26"
                fill="#f3f3f3"
                stroke="#050505"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <polygon points="-13,-40 -15,-115 -1,-176 12,-115 13,-40" fill="#d4d4d4" opacity="0.55" />
              <rect x="-15" y="18" width="30" height="42" fill="#0a0a0a" />
            </g>
          </g>
          {/* minute */}
          <g ref={minRef} transform={`rotate(0 ${PX} ${PX})`}>
            <g transform={`translate(${PX} ${PX})`}>
              <polygon
                points="-18,-26 -21,-170 -2,-338 6,-338 21,-170 18,-26"
                fill="#f3f3f3"
                stroke="#050505"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <polygon points="-8,-40 -10,-165 0,-300 9,-165 8,-40" fill="#d4d4d4" opacity="0.55" />
              <rect x="-12" y="18" width="24" height="48" fill="#0a0a0a" />
            </g>
          </g>
        </g>

        {/* hub under the second hand */}
        <circle cx={PX} cy={PX} r="30" fill="#0d0d0d" stroke="#3a3a3a" strokeWidth="3" />

        {/* second hand (smooth sweep) */}
        <g filter="url(#sportHandShadow)">
          <g ref={secRef} transform={`rotate(0 ${PX} ${PX})`}>
            <g transform={`translate(${PX} ${PX})`}>
              <rect x="-2.6" y="-340" width="5.2" height="410" fill="#f5f5f5" />
              <polygon points="0,-300 9,-272 0,-244 -9,-272" fill="#f5f5f5" />
              <circle r="9" cy="62" fill="#f5f5f5" />
            </g>
          </g>
        </g>

        <circle cx={PX} cy={PX} r="11" fill="#bfbfbf" stroke="#2a2a2a" strokeWidth="3" />
        <circle cx={PX} cy={PX} r="4" fill="#111" />
      </svg>
    </div>
  );
}
