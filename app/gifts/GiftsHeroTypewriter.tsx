'use client';

interface GiftsHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function GiftsHeroTypewriter({
  title = 'Curated Gifts for Memorable Milestones',
  subtitle = 'Mark special occasions with a lasting Winsor timepiece, complete with signature gift packaging and international warranty coverage.',
}: GiftsHeroTypewriterProps) {
  return (
    <>
      <style>{`
        .gifts-hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: 0.02em;
          margin: 0 0 14px;
          color: #ffffff;
        }
        .gifts-hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 22px;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .gifts-hero-heading {
            text-align: center;
          }
          .gifts-hero-sub {
            margin: 0 auto 22px;
            text-align: center;
          }
        }
      `}</style>
      <div className="gifts-typewriter-container">
        <h1 className="gifts-hero-heading">{title}</h1>
        <p className="gifts-hero-sub">{subtitle}</p>
      </div>
    </>
  );
}
