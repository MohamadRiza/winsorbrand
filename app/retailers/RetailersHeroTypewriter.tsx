'use client';

interface RetailersHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function RetailersHeroTypewriter({
  title = 'Find An Authorized Retailer',
  subtitle = 'Discover verified Winsor showrooms and authorized retail partners across Sri Lanka for authentic timepieces, fittings, and official warranty support.',
}: RetailersHeroTypewriterProps) {
  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(28px, 3.2vw, 42px)',
        fontWeight: 400,
        letterSpacing: '0.02em',
        margin: '0 0 10px',
        color: '#ffffff',
        lineHeight: 1.2,
      }}>
        {title}
      </h1>
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 'clamp(12.5px, 1.05vw, 14px)',
        fontWeight: 300,
        letterSpacing: '0.01em',
        color: 'rgba(255, 255, 255, 0.78)',
        maxWidth: '520px',
        margin: '0 auto',
        lineHeight: 1.6,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
