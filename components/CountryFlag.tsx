'use client';

import React, { useState } from 'react';

interface CountryFlagProps {
  iso: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function CountryFlag({
  iso,
  alt = '',
  className = '',
  width = 20,
  height = 14,
}: CountryFlagProps) {
  const [error, setError] = useState(false);
  const code = (iso || 'lk').toLowerCase();

  if (error) {
    // Elegant text fallback if network fails
    return (
      <span className="font-mono text-[10px] font-bold px-1 py-0.5 bg-amber-100/80 text-amber-900 rounded border border-amber-300/60 uppercase">
        {code}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={width}
      height={height}
      alt={alt || code}
      onError={() => setError(true)}
      style={{
        objectFit: 'cover',
        borderRadius: '2px',
        boxShadow: '0 0 2px rgba(0, 0, 0, 0.25)',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      className={className}
      loading="lazy"
    />
  );
}
