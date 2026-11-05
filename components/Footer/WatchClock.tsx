'use client';

import React, { useEffect, useState } from 'react';

function formatLocationLabel(tz: string): string {
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
    const city = parts[parts.length - 1].replace(/_/g, ' ').toUpperCase();
    const region = parts[0].replace(/_/g, ' ').toUpperCase();
    if (region === 'AMERICA') return `${city}, USA`;
    return `${city}, ${region}`;
  }

  return tz.toUpperCase();
}

export default function WatchClock({ size = 180 }: { size?: number }) {
  const [mounted, setMounted] = useState(false);
  const [locationName, setLocationName] = useState('LOCAL');
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

  useEffect(() => {
    setMounted(true);

    // Automatically detect visitor's timezone & city (e.g. "Asia/Colombo", "America/New_York")
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    setLocationName(formatLocationLabel(detectedTz));

    let animId: number;
    const updateTime = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + ms / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      const secDeg = s * 6;
      const minDeg = m * 6;
      const hourDeg = h * 30;

      // Exact local digital time with seconds e.g. 12:35:40 PM
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      setTime({
        hourDeg,
        minDeg,
        secDeg,
        day: now.getDate(),
        timeStr
      });

      animId = requestAnimationFrame(updateTime);
    };

    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="winsor-watch-clock-widget"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
      aria-label="Winsor Real-Time Clock"
    >
      {/* ── Watch Case Stage ── */}
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          filter: 'drop-shadow(0 10px 24px rgba(26,18,9,0.14)) drop-shadow(0 2px 6px rgba(139,105,20,0.18))',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        {/* Dial Face & Bezel */}
        <img
          src="/clock/watch_dial.png"
          alt="Winsor Precision Dial"
          width={size}
          height={size}
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

        {/* Date Window Overlay (Authentic 3 o'clock position, reflects visitor's exact local date) */}
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
              fontSize: `${Math.max(7, Math.round(size * 0.038))}px`,
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
          width={size}
          height={size}
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
          width={size}
          height={size}
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
          width={size}
          height={size}
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
            width: `${Math.max(6, Math.round(size * 0.042))}px`,
            height: `${Math.max(6, Math.round(size * 0.042))}px`,
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
