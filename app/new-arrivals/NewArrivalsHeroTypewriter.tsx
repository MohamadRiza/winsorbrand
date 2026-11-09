'use client';

interface NewArrivalsHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function NewArrivalsHeroTypewriter({
  title = 'New Arrivals Collection',
  subtitle = 'Discover our latest timepiece releases featuring refined stainless steel cases, scratch-resistant sapphire crystal glass, and modern dials.',
}: NewArrivalsHeroTypewriterProps) {
  return (
    <>
      <style>{`
        .new-arr-hero-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 400;
          line-height: 1.15;
          margin: 0 0 14px;
          letter-spacing: 0.02em;
          color: #ffffff;
        }
        .new-arr-hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.1vw, 15px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.82);
          max-width: 480px;
          margin: 0 0 22px;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .new-arr-hero-heading {
            text-align: center;
          }
          .new-arr-hero-sub {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
        }
      `}</style>
      <h1 className="new-arr-hero-heading">{title}</h1>
      <p className="new-arr-hero-sub">{subtitle}</p>
    </>
  );
}
