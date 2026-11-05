'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';

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

export default function HeroLiveWatch({ isMobile }: { isMobile: boolean }) {
  const { geoInfo } = useCurrency();
  const [mounted, setMounted] = useState(false);

  const offsetMsRef = useRef<number>(0);
  const activeTzRef = useRef<string>('Asia/Colombo');

  const [time, setTime] = useState<{
    hourDeg: number;
    minDeg: number;
    secDeg: number;
    day: number;
  }>({
    hourDeg: 305,
    minDeg: 60,
    secDeg: 210,
    day: 5,
  });

  useEffect(() => {
    setMounted(true);
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

      setTime({
        hourDeg,
        minDeg,
        secDeg,
        day: targetDate.getUTCDate(),
      });

      animId = requestAnimationFrame(updateTime);
    };

    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="floating-watch relative select-none"
      style={{
        width: isMobile ? '160px' : '520px',
        height: isMobile ? '160px' : '520px',
        maxWidth: '100%',
        position: 'relative',
        filter: 'drop-shadow(0 20px 30px rgba(26,18,9,0.14))',
      }}
    >
      {/* 1. Stainless Steel Watch Case & Bracelet Base */}
      <Image
        src="/winsor_hero_backgroundremoved.webp"
        alt="Winsor Luxury Watch"
        width={520}
        height={520}
        priority
        sizes="(max-width: 768px) 160px, 520px"
        className="object-contain relative z-10 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* 2. Live Rotating Dial & Hands Stage (Overlayed on Case) */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          left: '50%',
          top: '45.703%',
          width: '48.05%',
          height: '48.05%',
          transform: 'translate(-50%, -50%)',
          position: 'absolute',
        }}
      >
        {/* Black Bezel & Dial Face */}
        <img
          src="/clock/black/watch_dial.png"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
          loading="eager"
        />

        {/* Live Date Window (3 o'clock position) */}
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
              fontSize: isMobile ? '5.5px' : '10px',
              fontWeight: 700,
              color: '#1a1209',
              background: '#ffffff',
              borderRadius: '0px',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              zIndex: 1,
            }}
          >
            {time.day}
          </div>
        )}

        {/* Silver Arrow Hour Hand */}
        <img
          src="/clock/black/watch_hour.png"
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
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.32))',
            willChange: 'transform',
          }}
        />

        {/* Silver Sword Minute Hand */}
        <img
          src="/clock/black/watch_minute.png"
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
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.36))',
            willChange: 'transform',
          }}
        />

        {/* Silver Second Hand with Smooth 60fps Sweep */}
        <img
          src="/clock/black/watch_second.png"
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
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.42))',
            willChange: 'transform',
          }}
        />

        {/* Center Pin Jewel Cap (Metallic Silver/Chrome Accent) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4.2%',
            height: '4.2%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #d8d8d8 45%, #888888 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5), inset 0 0.5px 1px rgba(255,255,255,0.9)',
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
}
