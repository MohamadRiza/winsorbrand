'use client';

interface SportsHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function SportsHeroTypewriter({
  title = 'Sport Timepiece Collection',
  subtitle = 'Built for durability and active performance. Discover shock-resistant cases, dual analog-digital displays, and water-resistant construction.',
}: SportsHeroTypewriterProps) {
  return (
    <>
      <style>{`
        .sports-hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 400;
          line-height: 1.15;
          margin: 0 0 14px;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .sports-hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 22px;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .sports-hero-heading {
            text-align: center;
          }
          .sports-hero-sub {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
        }
      `}</style>
      <h1 className="sports-hero-heading">{title}</h1>
      <p className="sports-hero-sub">{subtitle}</p>
    </>
  );
}
