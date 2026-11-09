'use client';

interface MensHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function MensHeroTypewriter({
  title = "Men's Timepiece Collection",
  subtitle = "Engineered for everyday precision. Explore stainless steel cases, sapphire crystal glass, and reliable Japanese movements.",
}: MensHeroTypewriterProps) {
  return (
    <>
      <style>{`
        .mens-hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 400;
          line-height: 1.15;
          margin: 0 0 14px;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .mens-hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 22px;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .mens-hero-heading {
            text-align: center;
          }
          .mens-hero-sub {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
        }
      `}</style>
      <h1 className="mens-hero-heading">{title}</h1>
      <p className="mens-hero-sub">{subtitle}</p>
    </>
  );
}
