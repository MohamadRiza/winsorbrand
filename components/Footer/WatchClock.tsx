'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';

function formatLocationLabel(tz: string, city?: string, countryCode?: string): string {
  if (city && countryCode) {
    const c = countryCode.toUpperCase();
    const ct = city.toUpperCase();
    if (c === 'LK') return 'SRI LANKA';
    if (c === 'GB' || c === 'UK') return `${ct}, UK`;
    if (c === 'US') return `${ct}, USA`;
    if (c === 'AE') return `${ct}, UAE`;
    if (c === 'CA') return `${ct}, CANADA`;
    if (c === 'AU') return `${ct}, AUSTRALIA`;
    if (c === 'CH') return `${ct}, SWITZERLAND`;
    if (c === 'FR') return `${ct}, FRANCE`;
    if (c === 'DE') return `${ct}, GERMANY`;
    if (c === 'IN') return `${ct}, INDIA`;
    if (c === 'JP') return `${ct}, JAPAN`;
    if (c === 'SG') return 'SINGAPORE';
    return `${ct}, ${c}`;
  }

  if (!tz) return 'LOCAL TIME';

  const map: Record<string, string> = {
    'Asia/Colombo': 'SRI LANKA',
    'Asia/Kolkata': 'INDIA',
    'Asia/Dubai': 'DUBAI, UAE',
    'Europe/London': 'LONDON, UK',
    'Europe/Paris': 'PARIS, FRANCE',
    'Europe/Berlin': 'BERLIN, GERMANY',
    'Europe/Zurich': 'ZURICH, SWITZERLAND',
    'Europe/Geneva': 'GENEVA, SWITZERLAND',
    'America/New_York': 'NEW YORK, USA',
    'America/Los_Angeles': 'LOS ANGELES, USA',
    'America/Chicago': 'CHICAGO, USA',
    'America/Denver': 'DENVER, USA',
    'America/Phoenix': 'PHOENIX, USA',
    'America/Detroit': 'DETROIT, USA',
    'America/Indiana/Indianapolis': 'INDIANAPOLIS, USA',
    'America/Toronto': 'TORONTO, CANADA',
    'America/Vancouver': 'VANCOUVER, CANADA',
    'Asia/Singapore': 'SINGAPORE',
    'Asia/Tokyo': 'TOKYO, JAPAN',
    'Australia/Sydney': 'SYDNEY, AUSTRALIA',
    'Australia/Melbourne': 'MELBOURNE, AUSTRALIA',
  };

  if (map[tz]) return map[tz];

  const parts = tz.split('/');
  if (parts.length >= 2) {
    const partCity = parts[parts.length - 1].replace(/_/g, ' ').toUpperCase();
    const region = parts[0].replace(/_/g, ' ').toUpperCase();
    if (region === 'AMERICA') return `${partCity}, USA`;
    return `${partCity}, ${region}`;
  }

  return tz.toUpperCase();
}

// Compute offset in ms between UTC and target timezone
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

export default function WatchClock({ size }: { size?: number }) {
  const { geoInfo } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [locationName, setLocationName] = useState('LOCAL');

  // Offset in milliseconds between UTC and the visitor's local timezone
  const offsetMsRef = useRef<number>(0);
  const activeTzRef = useRef<string>('Asia/Colombo');

  const [time, setTime] = useState<{
    hourDeg: number;
    minDeg: number;
    secDeg: number;
    day: number;
    timeStr: string;
  }>({
    hourDeg: 305,
    minDeg: 60,
    secDeg: 210,
    day: 5,
    timeStr: '10:10:35 AM'
  });

  // Keep target timezone and label in sync with geo detection
  useEffect(() => {
    setMounted(true);

    const targetTz = geoInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Colombo';
    activeTzRef.current = targetTz;
    offsetMsRef.current = getTimezoneOffsetMs(targetTz);

    setLocationName(formatLocationLabel(targetTz, geoInfo?.city, geoInfo?.countryCode));

    // Refresh offset periodically (every minute) to guard against DST edge transitions
    const tzInterval = setInterval(() => {
      offsetMsRef.current = getTimezoneOffsetMs(activeTzRef.current);
    }, 60000);

    return () => clearInterval(tzInterval);
  }, [geoInfo]);

  // High-performance 60fps animation loop for watch hands and precision date
  useEffect(() => {
    let animId: number;

    const updateTime = () => {
      const nowUtc = Date.now();
      const targetDate = new Date(nowUtc + offsetMsRef.current);

      const ms = targetDate.getUTCMilliseconds();
      const s = targetDate.getUTCSeconds() + ms / 1000;
      const m = targetDate.getUTCMinutes() + s / 60;
      const h = (targetDate.getUTCHours() % 12) + m / 60;

      const secDeg = s * 6;
      const minDeg = m * 6;
      const hourDeg = h * 30;

      // Exact 12-hour local digital readout
      const rawHours = targetDate.getUTCHours();
      const hour12 = rawHours % 12 || 12;
      const ampm = rawHours >= 12 ? 'PM' : 'AM';
      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
      const timeStr = `${pad(hour12)}:${pad(targetDate.getUTCMinutes())}:${pad(targetDate.getUTCSeconds())} ${ampm}`;

      setTime({
        hourDeg,
        minDeg,
        secDeg,
        day: targetDate.getUTCDate(),
        timeStr,
      });

      animId = requestAnimationFrame(updateTime);
    };

    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  const customStyle = size ? ({ '--clock-size': `${size}px` } as React.CSSProperties) : undefined;

  return (
    <div
      className="winsor-watch-clock-widget"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        ...customStyle
      }}
      aria-label="Winsor Real-Time Clock"
    >
      {/* ── Watch Case Stage ── */}
      <div
        className="winsor-clock-case"
        style={{
          position: 'relative',
          width: 'var(--clock-size, 180px)',
          height: 'var(--clock-size, 180px)',
          filter: 'drop-shadow(0 10px 24px rgba(26,18,9,0.14)) drop-shadow(0 2px 6px rgba(139,105,20,0.18))',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        {/* Dial Face & Bezel */}
        <img
          src="/clock/watch_dial.png"
          alt="Winsor Precision Dial"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
          loading="eager"
        />

        {/* Date Window Overlay (Authentic 3 o'clock position, reflects visitor's exact local date worldwide) */}
        {mounted && (
          <div
            style={{
              position: 'absolute',
              left: '72.5%',
              top: '50.33%',
              transform: 'translate(-50%, -50%)',
              width: '5.2%',
              height: '3.6%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Jost', sans-serif",
              fontSize: 'calc(var(--clock-size, 180px) * 0.038)',
              fontWeight: 700,
              color: '#1a1209',
              background: '#ffffff',
              borderRadius: '0px',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              zIndex: 1
            }}
          >
            {time.day}
          </div>
        )}

        {/* Hour Hand (Arrow with lume) */}
        <img
          src="/clock/watch_hour.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transform: `rotate(${time.hourDeg}deg)`,
            transformOrigin: '50% 50%',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.28))',
            willChange: 'transform'
          }}
        />

        {/* Minute Hand (Sword with lume) */}
        <img
          src="/clock/watch_minute.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transform: `rotate(${time.minDeg}deg)`,
            transformOrigin: '50% 50%',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.32))',
            willChange: 'transform'
          }}
        />

        {/* Second Hand (Needle with cyan tip & yellow cap) */}
        <img
          src="/clock/watch_second.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transform: `rotate(${time.secDeg}deg)`,
            transformOrigin: '50% 50%',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.38))',
            willChange: 'transform'
          }}
        />

        {/* Center Pin Jewel Cap (Metallic Gold) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4.2%',
            height: '4.2%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fff1b8 0%, #dfb15b 45%, #8b6914 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.45), inset 0 0.5px 1px rgba(255,255,255,0.8)'
          }}
        />
      </div>

      {/* ── Horology Caption & Live Digital Time with Auto-Detected City ── */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '10.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#8B6914',
            lineHeight: 1.3
          }}
        >
          Winsor Precision Time
        </div>
        <div
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '9.5px',
            fontWeight: 400,
            letterSpacing: '0.08em',
            color: 'rgba(26,18,9,0.5)',
            marginTop: '2px',
            fontVariantNumeric: 'lining-nums'
          }}
        >
          {mounted ? `${time.timeStr} • ${locationName}` : 'LIVE PRECISION'}
        </div>
      </div>
    </div>
  );
}
