'use client';

interface CareHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function CareHeroTypewriter({
  title,
  subtitle = 'Dedicated after-sales support for your timepiece. Our specialist team in Sri Lanka is ready to assist with warranty service, strap adjustments, and personalized boutique inquiries.',
}: CareHeroTypewriterProps) {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 'clamp(34px, 4.2vw, 54px)',
        fontWeight: 400,
        letterSpacing: '0.04em',
        margin: '0 0 16px',
        color: '#ffffff',
        lineHeight: 1.18,
        textShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      }}>
        {title || 'Customer Care & Support'}
      </h1>
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 'clamp(13.5px, 1.2vw, 15px)',
        fontWeight: 300,
        letterSpacing: '0.02em',
        color: 'rgba(255, 255, 255, 0.88)',
        maxWidth: '660px',
        margin: '0 auto 24px',
        lineHeight: 1.7,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
