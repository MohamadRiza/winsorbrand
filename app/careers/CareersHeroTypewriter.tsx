'use client';

interface CareersHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function CareersHeroTypewriter({
  title = 'Careers at Winsor',
  subtitle = 'Join our growing team in Sri Lanka and the UAE across retail, operations, marketing, and customer relations.',
}: CareersHeroTypewriterProps) {
  return (
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(32px, 4.5vw, 56px)',
        fontWeight: 400,
        letterSpacing: '0.02em',
        margin: '0 0 14px',
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
        maxWidth: '580px',
        margin: '0 auto',
        lineHeight: 1.65,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
