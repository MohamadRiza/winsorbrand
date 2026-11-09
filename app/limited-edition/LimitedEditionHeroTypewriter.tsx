'use client';

interface LimitedEditionHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function LimitedEditionHeroTypewriter({
  title = 'Limited Edition Series',
  subtitle = 'Strictly numbered production runs crafted with surgical-grade stainless steel, sapphire crystal glass, and presentation packaging.',
}: LimitedEditionHeroTypewriterProps) {
  return (
    <>
      <style>{`
        .limited-hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 400;
          line-height: 1.15;
          margin: 0 0 14px;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .limited-hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 22px;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .limited-hero-heading {
            text-align: center;
          }
          .limited-hero-sub {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
        }
      `}</style>
      <h1 className="limited-hero-heading">{title}</h1>
      <p className="limited-hero-sub">{subtitle}</p>
    </>
  );
}
