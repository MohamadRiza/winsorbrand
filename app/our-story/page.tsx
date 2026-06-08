// app/our-story/page.tsx
// ── Server Component (no "use client") ──────────────────────────────────────
import Link from "next/link";
import VideoPlayer from "./VideoPlayer"; // ← Client component in same folder

export const metadata = {
  title: "Our Story — Winsor | Ride Your Moment",
  description:
    "Discover the heritage of Winsor — a luxury timepiece maison crafting fine watches with Swiss precision, founded in Sri Lanka and now present across the UAE and beyond.",
  openGraph: {
    title: "Our Story — Winsor",
    description:
      "From a small atelier in Sri Lanka to a globally celebrated maison headquartered in Dubai — the Winsor journey of time, craft and character.",
    type: "website",
  },
};

const GOLD     = "#8B6914";
const INK      = "#1a1209";
const CREAM    = "#fcfbf8";
const MUTED    = "rgba(26,18,9,0.62)";
const HAIRLINE = "rgba(26,18,9,0.12)";

const fontSerif = "'Cormorant Garamond', Georgia, serif";
const fontSans  = "'Jost', system-ui, sans-serif";

const TIMELINE: { year: string; title: string; text: string }[] = [
  {
    year: "2000",
    title: "A Maison is Born",
    text: "Winsor was founded in Sri Lanka by a circle of master watchmakers driven by a single conviction — that time deserves to be worn beautifully. The island's craftsmanship tradition gave the maison its soul.",
  },
  {
    year: "2008",
    title: "First In-House Movement",
    text: "The first in-house chronograph movement is unveiled, setting a standard for precision that still defines the maison today — each component finished and regulated entirely by hand.",
  },
  {
    year: "2014",
    title: "A New Home in Dubai",
    text: "Winsor relocates its headquarters to Dubai, UAE — a city that shares the maison's appetite for refinement and ambition. The Gulf becomes the beating heart of our global operations.",
  },
  {
    year: "2019",
    title: "Heritage Reimagined",
    text: "The Heritage collection launches to international acclaim, blending the warmth of Sri Lankan craft with the precision expected of the world's finest timepiece houses.",
  },
  {
    year: "Today",
    title: "Ride Your Moment",
    text: "With over 25 authorised retailers across the region and beyond, Winsor continues to honour its founding promise — fine watchmaking, made to be lived in.",
  },
];

const STATS = [
  { value: "26+", label: "Years of Craft" },
  { value: "UAE", label: "Headquartered" },
  { value: "25+", label: "Authorised Retailers" },
  { value: "1",   label: "Maison" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:18 }}>
      <span style={{ width:28, height:1, background:GOLD, opacity:0.6 }} />
      <span style={{ fontFamily:fontSans, fontSize:11, letterSpacing:"0.32em", color:GOLD, textTransform:"uppercase" }}>
        {children}
      </span>
      <span style={{ width:28, height:1, background:GOLD, opacity:0.6 }} />
    </div>
  );
}

export default function OurStoryPage() {
  return (
    <div style={{ background:CREAM, color:INK, fontFamily:fontSans, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

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
          border: 2.5px solid #fcfbf8;
          z-index: 2;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.15);
          display: block;
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
            font-size:42px !important; 
          }
          .ws-grid-2 { grid-template-columns: 1fr !important; gap: 40px !important; }
          .ws-hero-title { font-size: clamp(46px,12vw,80px) !important; }
          .ws-section-title { font-size: clamp(32px,8vw,48px) !important; }
          .ws-pad { padding-left:22px !important; padding-right:22px !important; }
          .ws-stats { grid-template-columns: repeat(2,1fr) !important; }
          .ws-player-controls { bottom: 10px; right: 10px; }
          .ws-ctrl-btn { width: 28px; height: 28px; }
          .ws-ctrl-btn svg { width: 12px; height: 12px; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section 
        className="ws-parallax-bg"
        style={{ 
          position:"relative", 
          minHeight:"min(86vh,760px)", 
          display:"flex", 
          alignItems:"center", 
          justifyContent:"center", 
          overflow:"hidden", 
          backgroundImage: `linear-gradient(180deg, rgba(10,8,5,0.35) 0%, rgba(10,8,5,0.15) 40%, rgba(10,8,5,0.85) 100%), url('/watch-hero.jpg')`,
        }}
      >
        <div className="ws-fade-up ws-pad" style={{ position:"relative", textAlign:"center", color:"#fff", padding:"120px 40px", maxWidth:900 }}>
          <div style={{ fontFamily:fontSans, fontSize:12, letterSpacing:"0.4em", color:"rgba(255,255,255,0.75)", marginBottom:22, textTransform:"uppercase" }}>
            The Winsor Maison
          </div>
          <h1 className="ws-hero-title" style={{ fontFamily:fontSerif, fontWeight:500, fontSize:"clamp(56px,8vw,110px)", lineHeight:1.02, letterSpacing:"0.01em", margin:0 }}>
            Our Story
          </h1>
          <p style={{ fontFamily:fontSerif, fontStyle:"italic", fontSize:"clamp(16px,2vw,22px)", lineHeight:1.7, maxWidth:640, margin:"28px auto 0", color:"rgba(255,255,255,0.88)", fontWeight:300 }}>
            A maison born in Sri Lanka, refined in Dubai — built on the belief
            that time, when worn well, becomes something more than a measure.
          </p>
        </div>
        <div style={{ position:"absolute", bottom:26, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.7)", fontFamily:fontSans, fontSize:10, letterSpacing:"0.3em" }}>
          SCROLL ↓
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="ws-pad" style={{ padding:"120px 40px 80px", maxWidth:920, margin:"0 auto", textAlign:"center" }}>
        <SectionLabel>The Beginning</SectionLabel>
        <h2 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(38px,5vw,58px)", fontWeight:500, lineHeight:1.1, margin:"0 0 28px", letterSpacing:"0.005em" }}>
          Born in Sri Lanka. Refined in Dubai. Built for the world.
        </h2>
        <p style={{ fontFamily:fontSerif, fontSize:19, lineHeight:1.85, color:MUTED, fontWeight:300, margin:0 }}>
          Winsor was founded in 2000 in Sri Lanka, where a small circle of master watchmakers shared
          one quiet ambition — to build a timepiece worthy of being passed down. From those first
          hand-finished calibres to a global headquarters in Dubai, our compass has never changed:
          craft, patience, and the unhurried elegance of a moment lived fully. Today, over 25
          authorised retailers carry the Winsor name, each one a custodian of that original promise.
        </p>
        <div style={{ height: 60, width: 1, background: GOLD, opacity: 0.35, margin: "48px auto 0" }} />
      </section>

      {/* ── HISTORY SPLIT ── */}
      <section style={{ background:"#fff", borderTop:`1px solid ${HAIRLINE}`, borderBottom:`1px solid ${HAIRLINE}` }}>
        <div className="ws-pad ws-grid-2" style={{ maxWidth:1400, margin:"0 auto", padding:"100px 40px", display:"grid", gridTemplateColumns:"1.05fr 1fr", gap:80, alignItems:"center" }}>
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
          <div>
            <div style={{ fontFamily:fontSans, fontSize:11, letterSpacing:"0.32em", color:GOLD, textTransform:"uppercase", marginBottom:18 }}>Our Heritage</div>
            <h3 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(34px,4vw,52px)", fontWeight:500, lineHeight:1.1, margin:"0 0 26px" }}>
              26 years of unhurried craft.
            </h3>
            <p style={{ fontFamily:fontSerif, fontSize:18, lineHeight:1.85, color:MUTED, margin:"0 0 20px", fontWeight:300 }}>
              Every Winsor timepiece begins as a sketch, becomes a calibre, and ends as an heirloom.
              Our movements are assembled by hand, regulated to chronometric standards, and tested for
              the kind of wear a lifetime invites.
            </p>
            <p style={{ fontFamily:fontSerif, fontSize:18, lineHeight:1.85, color:MUTED, margin:"0 0 36px", fontWeight:300 }}>
              We measure ourselves not in production figures, but in the quiet hours our watchmakers
              give to each piece — and in the generations that wear them.
            </p>
            <Link href="/collections" className="ws-btn" style={{ display:"inline-block", padding:"14px 32px", border:`1px solid ${INK}`, color:INK, fontFamily:fontSans, fontSize:11, letterSpacing:"0.28em", textDecoration:"none", textTransform:"uppercase" }}>
              Discover the Craft
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section 
        className="ws-parallax-bg" 
        style={{ 
          position:"relative", 
          padding:"120px 0", 
          backgroundImage:`linear-gradient(rgba(252,251,248,0.88), rgba(252,251,248,0.88)), url('/watch-card.jpg')`, 
        }}
      >
        <div className="ws-pad" style={{ maxWidth:1200, margin:"0 auto", padding:"0 40px", position:"relative", zIndex:2 }}>
          <SectionLabel>Around the World</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(36px,5vw,56px)", fontWeight:500, lineHeight:1.12, margin:"0 0 60px", textAlign:"center" }}>
            A maison present wherever moments matter.
          </h2>
          <div className="ws-stats" style={{ display:"flex", justifyContent:"space-around", gap:30, flexWrap: "wrap" }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ padding:"30px 24px", borderTop:`1px solid ${HAIRLINE}`, borderBottom:`1px solid ${HAIRLINE}`, textAlign:"center", flex: 1, maxWidth: "240px" }}>
                <div style={{ fontFamily:fontSerif, fontSize:"clamp(36px,4vw,56px)", fontWeight:500, color:GOLD, lineHeight:1 }}>{s.value}</div>
                <div style={{ marginTop:14, fontFamily:fontSans, fontSize:11, letterSpacing:"0.28em", color:MUTED, textTransform:"uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="ws-pad" style={{ padding:"120px 40px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:70 }}>
          <SectionLabel>The Journey</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(36px,5vw,56px)", fontWeight:500, margin:0 }}>
            Moments that shaped the maison.
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
                display:"grid", 
                gridTemplateColumns:"180px 1fr", 
                gap:50, 
                padding:"40px 0", 
                borderBottom: i === TIMELINE.length - 1 ? "none" : `1px solid ${HAIRLINE}`, 
                alignItems:"baseline",
                position: "relative" 
              }}
            >
              {/* Year & Circle Dot Marker */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="ws-tl-year" style={{ fontFamily:fontSerif, fontSize:58, fontWeight:500, color:GOLD, lineHeight:1, letterSpacing:"0.01em" }}>{m.year}</span>
                <div className="ws-timeline-marker" style={{ top: "34px" }} />
              </div>
              
              <div style={{ paddingLeft: "10px" }}>
                <h3 style={{ fontFamily:fontSerif, fontSize:"clamp(22px,2.4vw,30px)", fontWeight:500, margin:"0 0 12px", color:INK }}>{m.title}</h3>
                <p style={{ fontFamily:fontSerif, fontSize:18, lineHeight:1.8, color:MUTED, margin:0, fontWeight:300, maxWidth:720 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CRAFT IMAGE FULL ── */}
      <section 
        className="ws-parallax-bg" 
        style={{ 
          position:"relative",
          height:"540px", 
          backgroundImage:`linear-gradient(90deg,rgba(10,8,5,0.7) 0%,rgba(10,8,5,0.3) 50%,rgba(10,8,5,0.1) 100%), url('/discover-service.jpg')`,
        }}
      >
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center" }}>
          <div className="ws-pad" style={{ maxWidth:640, padding:"0 60px", color:"#fff" }}>
            <div style={{ fontFamily:fontSans, fontSize:11, letterSpacing:"0.32em", color:"rgba(255,255,255,0.8)", marginBottom:18, textTransform:"uppercase" }}>The Craft</div>
            <h2 style={{ fontFamily:fontSerif, fontSize:"clamp(34px,5vw,56px)", fontWeight:500, lineHeight:1.1, margin:"0 0 22px" }}>
              Patience is our finest material.
            </h2>
            <p style={{ fontFamily:fontSerif, fontSize:19, lineHeight:1.8, color:"rgba(255,255,255,0.9)", fontWeight:300, margin:0 }}>
              Each ruby is set by hand. Each balance wheel, regulated by ear.
              Winsor watches are built slowly, because the time they keep is meant to last.
            </p>
          </div>
        </div>
      </section>

      {/* ── VIDEO — Client Component ── */}
      <section className="ws-pad" style={{ padding:"120px 40px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:50 }}>
          <SectionLabel>Inside the Maison</SectionLabel>
          <h2 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(36px,5vw,56px)", fontWeight:500, margin:0 }}>
            A film of quiet hours.
          </h2>
        </div>

        {/* Minimal Longines-style video player */}
        <VideoPlayer />

        <p style={{ textAlign:"center", marginTop:26, fontFamily:fontSerif, fontStyle:"italic", color:MUTED, fontSize:16 }}>
          Step inside the Winsor atelier — where time is built by hand.
        </p>
      </section>

      {/* ── AMBASSADOR ── */}
      <section style={{ background:"#fff", borderTop:`1px solid ${HAIRLINE}`, borderBottom:`1px solid ${HAIRLINE}` }}>
        <div className="ws-pad ws-grid-2" style={{ maxWidth:1400, margin:"0 auto", padding:"100px 40px", display:"grid", gridTemplateColumns:"1fr 1.05fr", gap:80, alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:fontSans, fontSize:11, letterSpacing:"0.32em", color:GOLD, textTransform:"uppercase", marginBottom:18 }}>Our Promise</div>
            <h3 className="ws-section-title" style={{ fontFamily:fontSerif, fontSize:"clamp(34px,4vw,52px)", fontWeight:500, lineHeight:1.1, margin:"0 0 26px" }}>
              Ride your moment — wherever it takes you.
            </h3>
            <p style={{ fontFamily:fontSerif, fontSize:18, lineHeight:1.85, color:MUTED, margin:"0 0 32px", fontWeight:300 }}>
              From the boardroom to the coastline, a Winsor is built to keep pace with a life lived
              deliberately. It is not jewellery, nor a tool. It is a companion — quiet, precise, and
              entirely yours.
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <Link href="/collections" className="ws-btn" style={{ padding:"14px 32px", border:`1px solid ${INK}`, color:INK, fontFamily:fontSans, fontSize:11, letterSpacing:"0.28em", textDecoration:"none", textTransform:"uppercase" }}>
                Explore Collections
              </Link>
              <Link href="/retailers" className="ws-btn" style={{ padding:"14px 32px", border:`1px solid ${HAIRLINE}`, color:MUTED, fontFamily:fontSans, fontSize:11, letterSpacing:"0.28em", textDecoration:"none", textTransform:"uppercase" }}>
                Find a Retailer
              </Link>
            </div>
          </div>
          <div 
            className="ws-parallax-bg" 
            style={{ 
              backgroundImage: `url('/discover-store.jpg')`,
              height: "560px",
              borderRadius: "4px",
              boxShadow: "0 12px 30px rgba(26,18,9,0.06)",
              border: "1px solid rgba(139,105,20,0.12)"
            }} 
          />
        </div>
      </section>

      {/* ── CLOSING QUOTE ── */}
      <section className="ws-pad" style={{ padding:"130px 40px", textAlign:"center", maxWidth:880, margin:"0 auto" }}>
        <div style={{ fontFamily:fontSerif, fontStyle:"italic", fontSize:"clamp(26px,3.6vw,40px)", lineHeight:1.4, color:INK, fontWeight:400 }}>
          "We do not make watches for the wrist. <br />
          We make them for the years ahead of it."
        </div>
        <div style={{ marginTop:28, fontFamily:fontSans, fontSize:11, letterSpacing:"0.32em", color:GOLD, textTransform:"uppercase" }}>
          — The Winsor Maison
        </div>
      </section>
    </div>
  );
}