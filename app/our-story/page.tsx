// app/our-story/page.tsx
import Link from "next/link";
import Image from "next/image";
import VideoPlayer from "./VideoPlayer";

export const metadata = {
  title: "Our Story — Winsor Maison | Ride Your Moment",
  description:
    "Discover the story of WINSOR — a Dubai-registered luxury watchmaker committed to genuine craftsmanship, dependable precision, nationwide fixed MRP, and 1-year international warranty. Ride Your Moment.",
  openGraph: {
    title: "Our Story — Winsor Maison | Ride Your Moment",
    description:
      "Registered in Dubai in 2023, WINSOR is Sri Lanka's fastest-growing watch brand, bringing original timepieces, nationwide fixed MRP, and 1-year international warranty.",
    type: "website",
  },
};

const TIMELINE = [
  {
    year: "2023",
    badge: "FOUNDATION",
    title: "Registered in Dubai & Maison Creation",
    text: "WINSOR was officially registered in Dubai with a singular vision: to make genuine, stylish, and high-precision watches accessible to everyone — bridging the gap between inexpensive imitation watches and overpriced luxury brands.",
  },
  {
    year: "2024",
    badge: "EXPANSION",
    title: "Nationwide Retail Network & Fixed MRP",
    text: "WINSOR established an extensive network of leading authorized retailers across Sri Lanka, introducing a strict nationwide fixed MRP (Maximum Retail Price) policy to ensure complete pricing integrity and consumer trust.",
  },
  {
    year: "2025",
    badge: "HONORS",
    title: "Crown of Precision & Excellence Awards",
    text: "Honored with the Crown of Precision Award – Sri Lanka and Excellence in New Business of the Year Award, recognizing WINSOR's commitment to mechanical precision, surgical stainless steel construction, and dependable performance.",
  },
  {
    year: "2026",
    badge: "DISTINCTION",
    title: "Most Trusted Emerging Watch Brand",
    text: "Celebrated as the Most Trusted Emerging Watch Brand of the Year in Sri Lanka, while pioneering expansion into curated executive lifestyle accessories including signature perfumes, leather goods, and travel luggage.",
  },
  {
    year: "Today",
    badge: "VISION",
    title: "Ride Your Moment Across the Nation",
    text: "Backed by an extensive network of authorized boutiques across Sri Lanka, a 1-Year International Warranty, and official presentation gift packaging, WINSOR empowers discerning collectors to celebrate every milestone with pride.",
  },
];

const STATS = [
  { value: "2023", label: "Registered in Dubai", sub: "International Horology Maison" },
  { value: "1 YEAR", label: "Official Warranty", sub: "Comprehensive Care & Service" },
  { value: "FIXED MRP", label: "Nationwide Sri Lanka", sub: "Complete Price Transparency" },
  { value: "100%", label: "Genuine Quality", sub: "Surgical 316L Steel & Sapphire" },
];

const AWARDS = [
  {
    id: "1",
    year: "2026",
    title: "Most Trusted Emerging Watch Brand",
    category: "Consumer Trust & Brand Distinction",
    desc: "Awarded for price transparency, nationwide fixed MRP, 1-year international warranty, and client trust across Sri Lanka.",
    image: "/awards/award_1.jpg",
  },
  {
    id: "2",
    year: "2025",
    title: "Crown of Precision Award",
    category: "Watchmaking & Performance",
    desc: "Recognizing WINSOR for chronometric precision, dependable Japanese movement, and genuine quality standards.",
    image: "/awards/award_2.jpg",
  },
  {
    id: "3",
    year: "2025",
    title: "Excellence in New Business",
    category: "Business Growth & Retail Network",
    desc: "Celebrating WINSOR as Sri Lanka’s fastest-growing watch brand with an extensive authorized retailer boutique network.",
    image: "/awards/award_3.jpg",
  },
  {
    id: "4",
    year: "2023",
    title: "Dubai Trademark Registration",
    category: "Maison Heritage & Original Curation",
    desc: "Marking WINSOR’s official trademark registration in Dubai, establishing the foundation for accessible premium horology.",
    image: "/awards/award_4.jpg",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      <span className="w-5 sm:w-8 h-[1px] bg-[#8B6914]/50" />
      <span className="font-['Jost'] text-[9.5px] sm:text-[10.5px] tracking-[0.28em] uppercase font-semibold text-[#8B6914]">
        {children}
      </span>
      <span className="w-5 sm:w-8 h-[1px] bg-[#8B6914]/50" />
    </div>
  );
}

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1a1209] font-['Jost'] selection:bg-[#8B6914]/20 selection:text-[#1a1209]">
      <style>{`
        .ws-award-card {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .ws-award-card:hover {
          transform: translateY(-5px);
          border-color: rgba(139, 105, 20, 0.45) !important;
          box-shadow: 0 16px 36px -10px rgba(26, 18, 9, 0.1) !important;
        }
        .ws-award-card:hover .ws-award-img {
          transform: scale(1.04);
        }
      `}</style>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative min-h-[72vh] sm:min-h-[78vh] flex items-center justify-center overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#080604]">
        {/* Background Image with Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_bg_marble.jpg"
            alt="Winsor Maison Heritage"
            fill
            priority
            className="object-cover object-center opacity-35 mix-blend-luminosity scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(218,165,32,0.16)_0%,rgba(10,7,4,0.85)_55%,rgba(8,6,4,0.98)_100%)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white px-2">
          {/* Prestige Maison Crest */}
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5">
            <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b] to-[#dfb15b]" />
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-[#dfb15b] font-medium">
              <span>✦</span>
              <span>DUBAI REGISTERED • EST. 2023</span>
              <span>✦</span>
            </div>
            <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-l from-transparent via-[#dfb15b] to-[#dfb15b]" />
          </div>

          {/* Main Title (Balanced, never oversized) */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal leading-[1.12] tracking-tight text-white mb-4">
            Ride Your Moment
          </h1>

          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b] to-transparent mx-auto mb-4 sm:mb-5" />

          {/* Subtitle */}
          <p className="font-serif text-sm sm:text-base md:text-lg font-light leading-relaxed text-white/85 max-w-xl mx-auto mb-7 sm:mb-8">
            Forging authentic horology, surgical-grade 316L steel, and Japanese precision movements — engineered for everyday prestige across Sri Lanka.
          </p>

          {/* Luxury CTA Buttons (Compact & Refined) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10 sm:mb-12">
            <Link
              href="/collections"
              className="group w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#8B6914] via-[#c9a14a] to-[#8B6914] hover:from-[#a67c1e] hover:to-[#a67c1e] text-white text-[11px] tracking-[0.2em] uppercase font-semibold rounded-full shadow-[0_4px_20px_rgba(139,105,20,0.3)] transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Explore Timepieces</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/retailers"
              className="w-full sm:w-auto px-7 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 hover:border-[#dfb15b] text-[11px] tracking-[0.2em] uppercase font-semibold rounded-full transition-all duration-300 hover:scale-[1.02]"
            >
              Authorized Retailers
            </Link>
          </div>

          {/* Luxury Attributes Bar (Clean, Compact) */}
          <div className="border-t border-white/15 pt-6 sm:pt-7 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl mx-auto">
            <div>
              <span className="block font-['Jost'] text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#dfb15b] uppercase font-semibold mb-0.5">
                ORIGIN
              </span>
              <span className="font-serif text-xs sm:text-sm text-white/80 font-light">
                Dubai, UAE (2023)
              </span>
            </div>
            <div>
              <span className="block font-['Jost'] text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#dfb15b] uppercase font-semibold mb-0.5">
                WARRANTY
              </span>
              <span className="font-serif text-xs sm:text-sm text-white/80 font-light">
                1-Year International
              </span>
            </div>
            <div>
              <span className="block font-['Jost'] text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#dfb15b] uppercase font-semibold mb-0.5">
                INTEGRITY
              </span>
              <span className="font-serif text-xs sm:text-sm text-white/80 font-light">
                Nationwide Fixed MRP
              </span>
            </div>
            <div>
              <span className="block font-['Jost'] text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#dfb15b] uppercase font-semibold mb-0.5">
                MATERIAL
              </span>
              <span className="font-serif text-xs sm:text-sm text-white/80 font-light">
                Surgical 316L Steel
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THE GENESIS & BRAND ESSENCE ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <SectionLabel>The Beginning</SectionLabel>

        <h2 className="font-serif text-2xl sm:text-3xl md:text-[34px] font-normal leading-snug text-[#1a1209] mb-5">
          Born from a vision. Registered in Dubai. Trusted across Sri Lanka.
        </h2>

        <div className="w-10 h-[1px] bg-[#8B6914]/40 mx-auto mb-6" />

        <div className="space-y-4 text-xs sm:text-sm md:text-base font-serif text-[#1a1209]/75 font-light leading-relaxed max-w-2xl mx-auto">
          <p>
            The inspiration behind WINSOR emerged from a clear observation: the timepiece market was largely divided between inexpensive imitation watches that lacked durability, and exorbitant luxury brands priced far beyond the reach of everyday enthusiasts.
          </p>
          <p>
            We set out to create a better alternative — a genuine timepiece brand engineered with surgical-grade 316L stainless steel, Japanese precision movements, scratch-resistant sapphire crystal glass, and timeless aesthetics.
          </p>
          <p className="font-medium text-[#1a1209]/90">
            Registered in Dubai in 2023, WINSOR has swiftly grown into one of Sri Lanka’s fastest-growing watch brands, available through leading authorized retail boutiques nationwide.
          </p>
        </div>
      </section>

      {/* ── 3. FOUR CORE PILLARS (STATS) ── */}
      <section className="py-10 sm:py-14 bg-[#f4efe4] border-y border-[#8B6914]/15 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <SectionLabel>Uncompromising Standards</SectionLabel>
            <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-[#1a1209]">
              The Four Cornerstones of WINSOR
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {STATS.map((s, idx) => (
              <div
                key={idx}
                className="bg-[#faf7f0] rounded-xl p-5 sm:p-6 border border-[#8B6914]/20 shadow-[0_2px_12px_rgba(26,18,9,0.02)] text-center transition-all duration-300 hover:border-[#8B6914]/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="font-['Cinzel'] text-xl sm:text-2xl md:text-3xl font-semibold text-[#8B6914] tracking-wider mb-1.5">
                  {s.value}
                </div>
                <div className="font-['Jost'] text-[10.5px] sm:text-[11px] font-semibold tracking-[0.16em] text-[#1a1209] uppercase mb-1">
                  {s.label}
                </div>
                <div className="font-serif italic text-[11px] sm:text-xs text-[#1a1209]/60">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CHAPTER I: CRAFTSMANSHIP & FAIR PRICING ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Visual Container */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl border border-[#8B6914]/20">
            <Image
              src="/KCC.webp"
              alt="Winsor Authorized Boutique"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[9.5px] tracking-[0.22em] text-[#dfb15b] uppercase font-medium block mb-0.5">
                AUTHORIZED BOUTIQUES
              </span>
              <span className="font-serif text-sm sm:text-base font-normal">
                Curated Retail Showcase Across Sri Lanka
              </span>
            </div>
          </div>

          {/* Editorial Content */}
          <div>
            <SectionLabel>Our Philosophy</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-snug text-[#1a1209] mb-4">
              True luxury lies in honest craftsmanship, not inflated markups.
            </h2>

            <p className="font-serif text-xs sm:text-sm md:text-[15px] text-[#1a1209]/75 font-light leading-relaxed mb-4">
              Every WINSOR timepiece is conceived to balance everyday wearability with mechanical dependability. We select surgical-grade 316L stainless steel for hypoallergenic durability, sapphire crystal glass to protect against daily scratches, and proven Japanese movements calibrated for steadfast precision.
            </p>

            <div className="bg-[#FAF4E8] rounded-lg p-4 sm:p-5 border-l-2 border-[#8B6914] mb-6">
              <h4 className="font-['Jost'] text-[10.5px] uppercase tracking-[0.18em] font-semibold text-[#8B6914] mb-1">
                Nationwide Fixed MRP Guarantee
              </h4>
              <p className="font-serif text-xs sm:text-sm text-[#1a1209]/80 leading-relaxed m-0">
                To protect our clients, every WINSOR watch carries the exact same Maximum Retail Price across all authorized boutiques in Sri Lanka. No hidden markups, no inconsistent discounts — complete, honest price transparency.
              </p>
            </div>

            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8B6914] hover:text-[#1a1209] transition-colors duration-200"
            >
              <span>Explore The Collection</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. INTERACTIVE ATELIER CINEMA ── */}
      <section className="py-14 sm:py-20 bg-[#120d08] text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="w-6 sm:w-10 h-[1px] bg-[#dfb15b]/50" />
              <span className="font-['Jost'] text-[9.5px] sm:text-[10.5px] tracking-[0.28em] uppercase font-semibold text-[#dfb15b]">
                INSIDE WINSOR ATELIER
              </span>
              <span className="w-6 sm:w-10 h-[1px] bg-[#dfb15b]/50" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-white mb-2">
              The Architecture of Precision
            </h2>

            <p className="font-serif italic text-xs sm:text-sm md:text-base text-white/70 max-w-md mx-auto">
              Witness the deconstructed art of automatic timepiece movements, skeletonized dials, and high-frequency regulation.
            </p>
          </div>

          {/* Client-Side Video Player */}
          <div className="max-w-4xl mx-auto">
            <VideoPlayer src="/winsor_video.webm" />
          </div>

          <div className="text-center mt-6">
            <p className="font-['Jost'] text-[10.5px] text-white/50 tracking-wider uppercase">
              Official Winsor Calibre Automatic Movement • Hand-Assembled Quality Control
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. MILESTONES & JOURNEY (TIMELINE) ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <SectionLabel>The Heritage Trace</SectionLabel>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#1a1209]">
            Milestones That Define Our Ascent
          </h2>
        </div>

        <div className="relative border-l-2 border-[#8B6914]/25 ml-3 sm:ml-28 md:ml-32 space-y-8 sm:space-y-10 pl-5 sm:pl-8">
          {TIMELINE.map((m, idx) => (
            <div key={idx} className="relative group">
              {/* Year Marker */}
              <div className="sm:absolute sm:-left-36 top-0 mb-1.5 sm:mb-0 flex items-center gap-2">
                <span className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-[#8B6914] tracking-wider">
                  {m.year}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8.5px] font-semibold tracking-widest uppercase bg-[#8B6914]/10 text-[#8B6914]">
                  {m.badge}
                </span>
              </div>

              {/* Glowing Timeline Dot */}
              <div className="absolute -left-[27px] sm:-left-[39px] top-1 w-3 h-3 rounded-full bg-[#8B6914] border-2 border-[#faf7f0] shadow-[0_0_0_2px_rgba(139,105,20,0.3)] transition-transform group-hover:scale-110" />

              {/* Card Body */}
              <div className="bg-white/80 rounded-xl p-4 sm:p-6 border border-[#1a1209]/10 shadow-[0_2px_12px_rgba(26,18,9,0.02)] transition-all duration-300 group-hover:border-[#8B6914]/40 group-hover:shadow-md">
                <h3 className="font-serif text-base sm:text-lg md:text-xl font-medium text-[#1a1209] mb-1.5">
                  {m.title}
                </h3>
                <p className="font-serif text-xs sm:text-sm text-[#1a1209]/75 font-light leading-relaxed m-0">
                  {m.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. OFFICIAL INDUSTRY AWARDS & RECOGNITION ── */}
      <section className="py-14 sm:py-20 bg-[#f4efe4] border-y border-[#8B6914]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <SectionLabel>Honors & Accolades</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#1a1209] mb-2.5">
              Recognized Industry Distinction
            </h2>
            <p className="font-serif italic text-xs sm:text-sm text-[#1a1209]/70 max-w-lg mx-auto">
              Our pledge to chronometric accuracy, client trust, transparent pricing, and nationwide retail leadership has garnered respected industry honors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {AWARDS.map((award) => (
              <div
                key={award.id}
                className="ws-award-card bg-[#faf7f0] rounded-xl overflow-hidden border border-[#8B6914]/20 shadow-sm flex flex-col"
              >
                {/* Award Photo */}
                <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
                  <Image
                    src={award.image}
                    alt={award.title}
                    fill
                    className="ws-award-img object-cover transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-[#8B6914] text-white text-[9px] font-bold font-['Jost'] px-2.5 py-0.5 rounded-full shadow tracking-wider">
                    {award.year}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Award Details */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="font-['Jost'] text-[9px] tracking-[0.18em] font-semibold text-[#8B6914] uppercase block mb-1">
                      {award.category}
                    </span>
                    <h3 className="font-serif text-sm sm:text-base font-medium text-[#1a1209] leading-snug mb-2">
                      {award.title}
                    </h3>
                    <p className="font-['Jost'] text-[11px] sm:text-xs text-[#1a1209]/70 leading-relaxed font-light">
                      {award.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. BEYOND TIMEPIECES (LIFESTYLE EXPANSION) ── */}
      <section className="relative min-h-[380px] sm:min-h-[420px] flex items-center overflow-hidden py-14 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hmebnr1.webp"
            alt="Winsor Lifestyle Expansion"
            fill
            className="object-cover object-center brightness-[0.4] contrast-[1.1]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="max-w-xl text-white">
            <div className="inline-flex items-center gap-2 mb-3 text-[#dfb15b]">
              <span className="font-['Jost'] text-[10px] tracking-[0.25em] uppercase font-semibold">
                THE EXPANDING MAISON
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-white mb-4">
              Beyond Timepieces: The Lifestyle Collection
            </h2>

            <p className="font-serif text-xs sm:text-sm md:text-base text-white/85 font-light leading-relaxed mb-6">
              As WINSOR cements its reputation in horology, our artisans are translating the same philosophy into curated lifestyle essentials — including executive leather wallets, handcrafted belts, bespoke fragrances, and refined travel accessories engineered to accompany your life's greatest journeys.
            </p>

            <Link
              href="/gifts"
              className="inline-block px-6 py-3 bg-[#dfb15b] hover:bg-[#8B6914] text-[#1a1209] hover:text-white text-[11px] tracking-[0.2em] uppercase font-semibold rounded-md transition-all duration-300 shadow-lg"
            >
              Explore Gifting & Lifestyle
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. AUTHORIZED DEALERSHIP & PARTNERSHIP CTA ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#FAF4E8] to-[#f4efe4] rounded-2xl p-6 sm:p-10 border border-[#8B6914]/20 shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <SectionLabel>B2B Partnerships</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#1a1209] mb-4">
              Join the Fastest-Growing Horology Network
            </h2>
            <p className="font-serif text-xs sm:text-sm text-[#1a1209]/75 font-light leading-relaxed mb-4">
              We are the exclusive supplier of WINSOR timepieces in Sri Lanka. Established retail businesses and luxury boutiques are invited to become Authorized WINSOR Dealers.
            </p>
            <p className="font-serif text-xs sm:text-sm text-[#1a1209]/75 font-light leading-relaxed mb-6">
              Approved partners receive preferential wholesale pricing, dedicated display merchandising, full warranty coverage support, and marketing collaboration.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/retailers"
                className="px-6 py-2.5 bg-[#8B6914] hover:bg-[#a67c1e] text-white text-[11px] tracking-[0.18em] uppercase font-semibold rounded-md transition-colors"
              >
                Find Retailers
              </Link>
              <Link
                href="/customer-care"
                className="px-6 py-2.5 bg-white hover:bg-[#FAF4E8] text-[#1a1209] border border-[#8B6914]/40 text-[11px] tracking-[0.18em] uppercase font-semibold rounded-md transition-colors"
              >
                Dealer Inquiries
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-[#8B6914]/20">
            <Image
              src="/discover-partners.jpg"
              alt="Winsor Authorized Retail Partnership"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── 10. CLOSING CREED ── */}
      <section className="py-16 sm:py-20 text-center px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="w-9 h-9 mx-auto mb-4 flex items-center justify-center rounded-full bg-[#8B6914]/10 border border-[#8B6914]/30">
          <span className="font-serif text-base text-[#8B6914]">W</span>
        </div>

        <blockquote className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#1a1209] font-normal leading-relaxed mb-5">
          "At WINSOR, we do not merely build watches — we craft instruments of distinction that honor every milestone, triumph, and unforgettable moment of your life."
        </blockquote>

        <div className="font-['Jost'] text-[10.5px] sm:text-xs tracking-[0.3em] text-[#8B6914] font-semibold uppercase">
          RIDE YOUR MOMENT • WINSOR MAISON
        </div>
      </section>
    </div>
  );
}