// app/our-story/page.tsx
// ── Server Component (no "use client") ──────────────────────────────────────
import Link from "next/link";
import Image from "next/image";
import VideoPlayer from "./VideoPlayer"; // ← Client component in same folder

export const metadata = {
  title: "Our Story — Winsor | Ride Your Moment",
  description:
    "Discover the story of WINSOR — a Dubai-registered watch brand committed to making genuine, stylish, and high-quality watches accessible to everyone. Ride Your Moment.",
  openGraph: {
    title: "Our Story — Winsor | Ride Your Moment",
    description:
      "Registered in Dubai in 2023, WINSOR is Sri Lanka's fastest-growing watch brand, bringing original timepieces, nationwide fixed MRP, and 1-year international warranty.",
    type: "website",
  },
};

const GOLD = "#8B6914";
const INK = "#1a1209";
const CREAM = "#faf7f0";
const MUTED = "rgba(26,18,9,0.62)";
const HAIRLINE = "rgba(26,18,9,0.12)";

const fontSerif = "'Cormorant Garamond', Georgia, serif";
const fontCinzel = "'Cinzel', Georgia, serif";
const fontSans = "'Jost', system-ui, sans-serif";

const TIMELINE: { year: string; title: string; text: string }[] = [
  {
    year: "2023",
    title: "Registered in Dubai & Brand Creation",
    text: "WINSOR was registered in Dubai in 2023 with one simple vision: to make genuine, stylish, and high-quality watches accessible to everyone — bridging the gap between inexpensive imitation watches and overpriced luxury brands.",
  },
  {
    year: "2024",
    title: "Nationwide Retail Expansion",
    text: "WINSOR rapidly expanded across Sri Lanka, establishing an extensive network of leading authorized retailers and introducing a strict nationwide fixed MRP (Maximum Retail Price) for complete price transparency.",
  },
  {
    year: "2025",
    title: "Industry Recognition & Excellence",
    text: "Honored with the Crown of Precision Award – Sri Lanka and Excellence in New Business of the Year Award – Sri Lanka, recognizing WINSOR's commitment to quality craftsmanship, dependable performance, and rapid market growth.",
  },
  {
    year: "2026",
    title: "Most Trusted Emerging Watch Brand",
    text: "Awarded Most Trusted Emerging Watch Brand of the Year while expanding beyond watches into premium lifestyle accessories including perfumes, wallets, belts, and bags.",
  },
  {
    year: "Today",
    title: "Ride Your Moment",
    text: "With a strong network of leading retailers across Sri Lanka, a 1-Year International Warranty, and official presentation gift packaging, WINSOR continues to celebrate every milestone, achievement, and unforgettable moment.",
  },
];

const STATS = [
  { value: "2023", label: "Registered in Dubai" },
  { value: "1 YEAR", label: "International Warranty" },
  { value: "FIXED MRP", label: "Nationwide Sri Lanka" },
  { value: "100%", label: "Genuine Quality" },
];

const AWARDS = [
  {
    id: '1',
    year: '2026',
    title: 'Most Trusted Emerging Watch Brand of the Year',
    category: 'Consumer Trust & Brand Distinction',
    desc: 'Awarded for price transparency, nationwide fixed MRP, 1-year international warranty, and client trust across Sri Lanka.',
    image: '/awards/award_1.jpg'
  },
  {
    id: '2',
    year: '2025',
    title: 'Crown of Precision Award – Sri Lanka',
    category: 'Watchmaking & Performance Excellence',
    desc: 'Recognizing WINSOR for chronometric precision, dependable performance, and genuine quality standards.',
    image: '/awards/award_2.jpg'
  },
  {
    id: '3',
    year: '2025',
    title: 'Excellence in New Business of the Year Award – Sri Lanka',
    category: 'Business Growth & Retail Network',
    desc: 'Celebrating WINSOR as Sri Lanka’s fastest-growing watch brand with an extensive authorized retailer network.',
    image: '/awards/award_3.jpg'
  },
  {
    id: '4',
    year: '2023',
    title: 'Dubai Trademark Registration & Brand Debut',
    category: 'Maison Heritage & Original Curation',
    desc: 'Marking WINSOR’s official trademark registration in Dubai, establishing the foundation for accessible premium horology.',
    image: '/awards/award_4.jpg'
  }
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 18 }}>
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.6 }} />
      <span style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.32em", color: GOLD, textTransform: "uppercase" }}>
        {children}
      </span>
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.6 }} />
    </div>
  );
}

export default function OurStoryPage() {
  return (
    <div style={{ background: CREAM, color: INK, fontFamily: fontSans, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

        .ws-fade-up { animation: wsFadeUp .9s ease both; }
        @keyframes wsFadeUp { from { opacity:0; transform:translateY(18px);} to { opacity:1; transform:none;} }

        .ws-btn { transition: all .25s ease; }
        .ws-btn:hover { background: ${GOLD}; color:#fff !important; border-color:${GOLD} !important; }

        /* Parallax Background Frames */
        .ws-parallax-bg {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }

        /* Timeline Connector Rules */
        .ws-timeline-line {
          position: absolute;
          left: 120px;
          top: 24px;
          bottom: 24px;
          width: 1.5px;
          background: linear-gradient(to bottom, transparent, rgba(139,105,20,0.3) 10%, rgba(139,105,20,0.3) 90%, transparent);
          display: block;
        }
        .ws-timeline-marker {
          position: absolute;
          left: 116px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #8B6914;
          border: 2.5px solid #faf7f0;
          z-index: 2;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.15);
          display: block;
        }

        /* Award Card Hover Effects */
        .ws-award-card:hover {
          transform: translateY(-6px);
          border-color: rgba(139,105,20,0.4) !important;
          box-shadow: 0 20px 40px rgba(26,18,9,0.1) !important;
        }
        .ws-award-card:hover .ws-award-img {
          transform: scale(1.06);
        }

        /* ── Minimal luxury video player styles (Longines-inspired) ── */
        .ws-player {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #000;
          box-shadow: 0 30px 80px -40px rgba(26,18,9,0.45);
          cursor: pointer;
          border-radius: 2px;
        }
        .ws-player video { 
          width:100%; 
          height:100%; 
          object-fit:cover; 
          display:block; 
        }

        /* Minimal controls: bottom-right, small, elegant */
        .ws-player-controls {
          position: absolute;
          bottom: 14px;
          right: 14px;
          display: flex;
          gap: 8px;
          z-index: 10;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          pointer-events: none;
        }
        .ws-player:hover .ws-player-controls,
        .ws-player.ws-paused .ws-player-controls {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .ws-ctrl-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(26, 18, 9, 0.72);
          border: 1px solid rgba(139, 105, 20, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
          padding: 0;
        }
        .ws-ctrl-btn:hover {
          background: ${GOLD};
          border-color: ${GOLD};
          transform: scale(1.08);
        }
        .ws-ctrl-btn svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
          display: block;
        }

        /* Center play icon (only shows when paused & not hovering) */
        .ws-play-centre {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .ws-player.ws-paused:not(:hover) .ws-play-centre {
          opacity: 1;
        }
        .ws-play-centre-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(26, 18, 9, 0.65);
          border: 1px solid rgba(139, 105, 20, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          backdrop-filter: blur(6px);
        }
        .ws-play-centre-icon svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
          margin-left: 2px;
        }

        @media (max-width: 900px) {
          .ws-parallax-bg {
            background-attachment: scroll !important;
          }
          .ws-timeline-line, .ws-timeline-marker {
            display: none !important;
          }
          .ws-timeline-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 30px 0 !important;
          }
          .ws-timeline-row .ws-tl-year { 
            font-size:36px !important; 
          }
          .ws-grid-2 { grid-template-columns: 1fr !important; gap: 40px !important; }
          .ws-hero-title { font-size: clamp(38px,8vw,64px) !important; }
          .ws-section-title { font-size: clamp(32px,8vw,48px) !important; }
          .ws-pad { padding-left:22px !important; padding-right:22px !important; }
          .ws-stats { grid-template-columns: repeat(2,1fr) !important; }
          .ws-player-controls { bottom: 10px; right: 10px; }
          .ws-ctrl-btn { width: 28px; height: 28px; }
          .ws-ctrl-btn svg { width: 12px; height: 12px; }
        }
      `}</style>

      {/* ── HERO BANNER ── */}
      <section
        className="ws-parallax-bg"
        style={{
          position: "relative",
          minHeight: "min(80vh,680px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundImage: `linear-gradient(180deg, rgba(10,8,5,0.72) 0%, rgba(10,8,5,0.60) 40%, rgba(10,8,5,0.92) 100%), url('/r_partners.webp')`,
        }}
      >
        <div className="ws-fade-up ws-pad" style={{ position: "relative", textAlign: "center", color: "#fff", padding: "100px 40px", maxWidth: 840 }}>
          <div style={{ fontFamily: fontSans, fontSize: 10.5, letterSpacing: "0.35em", color: "#dfb15b", marginBottom: 18, textTransform: "uppercase", fontWeight: 600 }}>
            DUBAI-REGISTERED WATCH BRAND
          </div>
          <h1 className="ws-hero-title" style={{ fontFamily: fontSerif, fontWeight: 500, fontSize: "clamp(44px,5.5vw,72px)", lineHeight: 1.06, letterSpacing: "0.02em", margin: 0 }}>
            Ride Your Moment
          </h1>
          <p style={{ fontFamily: fontSerif, fontStyle: "italic", fontSize: "clamp(15px,1.5vw,19px)", lineHeight: 1.68, maxWidth: 620, margin: "22px auto 0", color: "rgba(255,255,255,0.90)", fontWeight: 300 }}>
            A Dubai-registered watch brand established in 2023 with one simple vision — to make genuine, stylish, and high-quality watches accessible to everyone.
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontFamily: fontSans, fontSize: 10, letterSpacing: "0.3em" }}>
          SCROLL ↓
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="ws-pad" style={{ padding: "120px 40px 80px", maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel>The Beginning</SectionLabel>
        <h2 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(38px,5vw,56px)", fontWeight: 500, lineHeight: 1.1, margin: "0 0 28px", letterSpacing: "0.005em" }}>
          Born from a vision. Registered in Dubai. Trusted across Sri Lanka.
        </h2>
        <p style={{ fontFamily: fontSerif, fontSize: 19, lineHeight: 1.85, color: MUTED, fontWeight: 300, margin: 0 }}>
          The inspiration behind WINSOR came from a simple observation. The Sri Lankan market was largely divided between inexpensive imitation watches and premium international brands that were beyond the reach of many consumers. We believed there should be a better alternative — a brand offering genuine craftsmanship, elegant design, dependable performance, and exceptional value. Registered in Dubai in 2023, WINSOR has rapidly grown into one of Sri Lanka’s fastest-growing watch brands, available through leading retail stores nationwide.
        </p>
        <div style={{ height: 60, width: 1, background: GOLD, opacity: 0.35, margin: "48px auto 0" }} />
      </section>

      {/* ── HISTORY & PHILOSOPHY SPLIT ── */}
      <section style={{ background: CREAM, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="ws-pad ws-grid-2" style={{ maxWidth: 1400, margin: "0 auto", padding: "100px 40px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 80, alignItems: "center" }}>
          <div
            className="ws-parallax-bg"
            style={{
              backgroundImage: `url('/KCC.webp')`,
              height: "560px",
              borderRadius: "4px",
              boxShadow: "0 12px 30px rgba(26,18,9,0.06)",
              border: "1px solid rgba(139,105,20,0.12)"
            }}
          />
          <div>
            <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.32em", color: GOLD, textTransform: "uppercase", marginBottom: 18 }}>Our Philosophy</div>
            <h3 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(34px,4vw,52px)", fontWeight: 500, lineHeight: 1.1, margin: "0 0 26px" }}>
              Premium quality without an unaffordable price tag.
            </h3>
            <p style={{ fontFamily: fontSerif, fontSize: 18, lineHeight: 1.85, color: MUTED, margin: "0 0 20px", fontWeight: 300 }}>
              Every WINSOR watch combines modern design, dependable performance, and exceptional value, allowing customers to own an original timepiece with complete confidence.
            </p>
            <p style={{ fontFamily: fontSerif, fontSize: 18, lineHeight: 1.85, color: MUTED, margin: "0 0 36px", fontWeight: 300 }}>
              One of our strongest commitments is price transparency. Every WINSOR watch carries the exact same Maximum Retail Price (MRP) throughout Sri Lanka, ensuring every customer enjoys fair and consistent pricing regardless of where they purchase their watch.
            </p>
            <Link href="/collections" className="ws-btn" style={{ display: "inline-block", padding: "14px 32px", border: `1px solid ${INK}`, color: INK, fontFamily: fontSans, fontSize: 11, letterSpacing: "0.28em", textDecoration: "none", textTransform: "uppercase" }}>
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="ws-parallax-bg"
        style={{
          position: "relative",
          padding: "120px 0",
          backgroundImage: `linear-gradient(rgba(252,251,248,0.88), rgba(252,251,248,0.88)), url('/hmebnr2.webp')`,
        }}
      >
        <div className="ws-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 2 }}>
          <SectionLabel>Trust & Excellence</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(36px,5vw,56px)", fontWeight: 500, lineHeight: 1.12, margin: "0 0 60px", textAlign: "center" }}>
            Every WINSOR timepiece comes complete.
          </h2>
          <div className="ws-stats" style={{ display: "flex", justifyContent: "space-around", gap: 30, flexWrap: "wrap" }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ padding: "30px 24px", borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}`, textAlign: "center", flex: 1, maxWidth: "240px" }}>
                <div style={{ fontFamily: fontCinzel, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 600, color: GOLD, lineHeight: 1.1, letterSpacing: "0.06em" }}>{s.value}</div>
                <div style={{ marginTop: 14, fontFamily: fontSans, fontSize: 10.5, letterSpacing: "0.28em", color: MUTED, textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="ws-pad" style={{ padding: "120px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <SectionLabel>The Journey</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(36px,5vw,56px)", fontWeight: 500, margin: 0 }}>
            Milestones that shaped WINSOR.
          </h2>
        </div>
        <div style={{ position: "relative" }}>
          {/* Connected timeline trace */}
          <div className="ws-timeline-line" />

          {TIMELINE.map((m, i) => (
            <div
              key={m.year}
              className="ws-timeline-row"
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: 50,
                padding: "40px 0",
                borderBottom: i === TIMELINE.length - 1 ? "none" : `1px solid ${HAIRLINE}`,
                alignItems: "baseline",
                position: "relative"
              }}
            >
              {/* Year & Circle Dot Marker */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="ws-tl-year" style={{ fontFamily: fontCinzel, fontSize: 44, fontWeight: 600, color: GOLD, lineHeight: 1, letterSpacing: "0.04em" }}>{m.year}</span>
                <div className="ws-timeline-marker" style={{ top: "34px" }} />
              </div>

              <div style={{ paddingLeft: "10px" }}>
                <h3 style={{ fontFamily: fontSerif, fontSize: "clamp(22px,2.4vw,30px)", fontWeight: 500, margin: "0 0 12px", color: INK }}>{m.title}</h3>
                <p style={{ fontFamily: fontSerif, fontSize: 18, lineHeight: 1.8, color: MUTED, margin: 0, fontWeight: 300, maxWidth: 720 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🏆 INDUSTRY RECOGNITION & AWARDS SECTION */}
      <section style={{ background: CREAM, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}`, padding: "120px 0" }}>
        <div className="ws-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>Honors & Recognition</SectionLabel>
            <h2 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(36px,5vw,56px)", fontStyle: "italic", fontWeight: 400, margin: "0 0 16px" }}>
              Recognized Industry Distinction
            </h2>
            <p style={{ fontFamily: fontSerif, fontSize: 18, color: MUTED, fontWeight: 300, maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
              Our commitment to quality, innovation, price transparency, and customer satisfaction has been recognized by respected industry organizations.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 32 }}>
            {AWARDS.map((award) => (
              <div
                key={award.id}
                style={{
                  background: CREAM,
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(26,18,9,0.04)",
                  transition: "all 0.35s ease",
                  display: "flex",
                  flexDirection: "column"
                }}
                className="ws-award-card"
              >
                {/* Photo container */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#0a0a0a" }}>
                  <Image
                    src={award.image}
                    alt={award.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                    className="ws-award-img"
                  />
                  <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(139,105,20,0.95)", color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: fontSans, padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.1em" }}>
                    {award.year}
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: "24px 22px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
                      {award.category}
                    </div>
                    <h3 style={{ fontFamily: fontSerif, fontSize: 20, fontWeight: 600, color: INK, margin: "0 0 10px", lineHeight: 1.25 }}>
                      {award.title}
                    </h3>
                    <p style={{ fontFamily: fontSans, fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6, fontWeight: 400 }}>
                      {award.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPANSION INTO LIFESTYLE ── */}
      <section
        className="ws-parallax-bg"
        style={{
          position: "relative",
          height: "540px",
          backgroundImage: `linear-gradient(90deg,rgba(10,8,5,0.78) 0%,rgba(10,8,5,0.4) 50%,rgba(10,8,5,0.15) 100%), url('/hmebnr1.webp')`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
          <div className="ws-pad" style={{ maxWidth: 680, padding: "0 60px", color: "#fff" }}>
            <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.32em", color: "#dfb15b", marginBottom: 18, textTransform: "uppercase", fontWeight: 600 }}>
              Expanding Lifestyle Vision
            </div>
            <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(34px,5vw,54px)", fontWeight: 500, lineHeight: 1.1, margin: "0 0 22px" }}>
              Beyond Timepieces.
            </h2>
            <p style={{ fontFamily: fontSerif, fontSize: 19, lineHeight: 1.8, color: "rgba(255,255,255,0.92)", fontWeight: 300, margin: 0 }}>
              As WINSOR continues to grow, our vision extends beyond watches. We are expanding into premium lifestyle accessories — including perfumes, wallets, belts, bags, and other carefully designed products that reflect our commitment to quality, affordability, and timeless style.
            </p>
          </div>
        </div>
      </section>

      {/* ── VIDEO — Client Component ── */}
      <section className="ws-pad" style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <SectionLabel>Inside WINSOR</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(36px,5vw,56px)", fontWeight: 500, margin: 0 }}>
            Craftsmanship & Value.
          </h2>
        </div>

        {/* Minimal Longines-style video player */}
        {/* <VideoPlayer /> */}

        <p style={{ textAlign: "center", marginTop: 26, fontFamily: fontSerif, fontStyle: "italic", color: MUTED, fontSize: 16 }}>
          Explore the world of WINSOR — where modern style meets genuine performance.
        </p>
      </section>

      {/* ── AUTHORIZED DEALER & PROMISE SPLIT ── */}
      <section style={{ background: CREAM, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="ws-pad ws-grid-2" style={{ maxWidth: 1400, margin: "0 auto", padding: "100px 40px", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.32em", color: GOLD, textTransform: "uppercase", marginBottom: 18 }}>Become an Authorized Dealer</div>
            <h3 className="ws-section-title" style={{ fontFamily: fontSerif, fontSize: "clamp(34px,4vw,52px)", fontWeight: 500, lineHeight: 1.1, margin: "0 0 26px" }}>
              Interested in selling WINSOR watches?
            </h3>
            <p style={{ fontFamily: fontSerif, fontSize: 18, lineHeight: 1.85, color: MUTED, margin: "0 0 20px", fontWeight: 300 }}>
              We are the exclusive supplier of WINSOR watches in Sri Lanka. Retail businesses can become Authorized WINSOR Dealers by registering with us.
            </p>
            <p style={{ fontFamily: fontSerif, fontSize: 18, lineHeight: 1.85, color: MUTED, margin: "0 0 32px", fontWeight: 300 }}>
              Approved dealers receive wholesale pricing, access to our latest collections, and continuous business support while maintaining our nationwide fixed MRP policy. Apply today and become part of the growing WINSOR retail network.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/retailers" className="ws-btn" style={{ padding: "14px 32px", border: `1px solid ${INK}`, color: INK, fontFamily: fontSans, fontSize: 11, letterSpacing: "0.28em", textDecoration: "none", textTransform: "uppercase" }}>
                Find a Retailer
              </Link>
              <Link href="/customer-care" className="ws-btn" style={{ padding: "14px 32px", border: `1px solid ${HAIRLINE}`, color: MUTED, fontFamily: fontSans, fontSize: 11, letterSpacing: "0.28em", textDecoration: "none", textTransform: "uppercase" }}>
                Dealer Inquiries
              </Link>
            </div>
          </div>
          <div
            className="ws-parallax-bg"
            style={{
              backgroundImage: `url('/discover-partners.jpg')`,
              height: "560px",
              borderRadius: "4px",
              boxShadow: "0 12px 30px rgba(26,18,9,0.06)",
              border: "1px solid rgba(139,105,20,0.12)"
            }}
          />
        </div>
      </section>

      {/* ── CLOSING QUOTE ── */}
      <section className="ws-pad" style={{ padding: "130px 40px", textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ fontFamily: fontSerif, fontStyle: "italic", fontSize: "clamp(26px,3.6vw,40px)", lineHeight: 1.4, color: INK, fontWeight: 400 }}>
          "At WINSOR, we don't simply sell watches — we create products that celebrate every milestone, achievement, and unforgettable moment."
        </div>
        <div style={{ marginTop: 28, fontFamily: fontSans, fontSize: 12, letterSpacing: "0.36em", color: GOLD, textTransform: "uppercase", fontWeight: 600 }}>
          RIDE YOUR MOMENT
        </div>
      </section>
    </div>
  );
}