'use client';

interface CareHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function CareHeroTypewriter({
  title = 'Customer Care & Support',
  subtitle = 'Dedicated after-sales support for your timepiece. Our specialist team in Sri Lanka is ready to assist with warranty service, strap adjustments, and inquiries.',
}: CareHeroTypewriterProps) {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(34px, 4.5vw, 56px)',
        fontWeight: 400,
        letterSpacing: '0.06em',
        margin: '0 0 16px',
        color: '#ffffff',
        lineHeight: 1.15,
      }}>
        {title}
      </h1>
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 'clamp(13px, 1.2vw, 15px)',
        fontWeight: 300,
        letterSpacing: '0.03em',
        color: 'rgba(255, 255, 255, 0.85)',
        maxWidth: '640px',
        margin: '0 auto 28px',
        lineHeight: 1.65,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
