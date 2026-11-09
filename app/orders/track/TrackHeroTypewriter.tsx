'use client';

interface TrackHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function TrackHeroTypewriter({
  title = 'Track Your Timepiece',
  subtitle = 'Enter your unique order reference code and registered phone number to view real-time order processing, dispatch, and delivery status.',
}: TrackHeroTypewriterProps) {
  return (
    <>
      <div className="track-title-container" style={{ position: 'relative', marginBottom: '12px', width: '100%' }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(28px, 4.2vw, 48px)',
            fontWeight: 400,
            lineHeight: 1.15,
            margin: '0 auto',
            letterSpacing: '0.01em',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
      </div>

      <div className="track-sub-container" style={{ position: 'relative', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 'clamp(13px, 1.1vw, 15px)',
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.85)',
            maxWidth: '520px',
            margin: '0 auto',
            fontWeight: 400,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </p>
      </div>
    </>
  );
}
