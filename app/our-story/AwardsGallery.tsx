"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AwardItem {
  id: string;
  year: string;
  category: string;
  institution: string;
  title: string;
  recipient: string;
  venue?: string;
  date?: string;
  signatories?: string;
  citation: string;
  image: string;
  altText: string;
}

const ALL_AWARDS: AwardItem[] = [
  {
    id: "all-aw",
    year: "2025 – 2026",
    category: "Master Collection Showcase",
    institution: "National & International Honors",
    title: "The Complete Winsor Accolades Ensemble",
    recipient: "WINSOR (PVT) LTD / WINSOR WATCHES",
    venue: "Waters Edge Hotel, Colombo & International Convocations",
    date: "2025 & 2026 Official Convocations",
    citation: "The complete collection of official industry awards, framed certificates, and sculpted trophies conferred upon WINSOR: including the 2026 Global Laurel Excellence Awards (Most Trusted Emerging Watch Brand), the 2025 People's Excellency Awards (The Crown of Precision Award), and the Diamond Excellence presentation casket.",
    image: "/awards/all-aw.webp",
    altText: "Official Winsor Industry Awards & Recognition Collection - Certificates and Trophies Ensemble",
  },
  {
    id: "aw4",
    year: "2026",
    category: "Certificate of Appreciation",
    institution: "Global Laurel Excellence Awards 2026",
    title: "Most Trusted Emerging Watch Brand of the Year Award 2026",
    recipient: "WINSOR (PVT) LTD",
    signatories: "Prof. Dr. Senaso Wijesinghe & Ryan Wijesinghe (Founder & CEO)",
    citation: "This Certificate is Proudly Awarded in Recognition of Outstanding Achievement to WINSOR (PVT) LTD — Most Trusted Emerging Watch Brand of the Year Award 2026.",
    image: "/awards/aw4.webp",
    altText: "Global Laurel Excellence Awards 2026 Certificate awarded to WINSOR (PVT) LTD",
  },
  {
    id: "aw2",
    year: "2026",
    category: "Sculpted Crystal Trophy",
    institution: "Global Laurel Excellence Awards 2026",
    title: "Most Trusted Emerging Watch Brand of the Year Award 2026",
    recipient: "Proudly Presented to WINSOR WATCHES",
    citation: "Custom sculpted azure crystal trophy engraved: 'Global Laurel Excellence Awards 2026 — Most Trusted Emerging Watch Brand of the Year Award 2026. Congratulations on this well-deserved recognition!'",
    image: "/awards/aw2.webp",
    altText: "Global Laurel Excellence Awards 2026 Crystal Trophy presented to WINSOR WATCHES",
  },
  {
    id: "aw1",
    year: "2025",
    category: "Certificate of Appreciation",
    institution: "People's Excellency Awards 2025",
    title: "The Crown of Precision Award in Sri Lanka",
    recipient: "WINSOR WATCHES",
    venue: "Waters Edge Hotel, Colombo, Sri Lanka",
    date: "29/12/2025",
    signatories: "Dewmini Athapattu (Chairman of the Awards Jury)",
    citation: "This Certificate is Proudly Presented for Honorable Achievement to WINSOR WATCHES — The Crown of Precision Award in Sri Lanka at Waters Edge Hotel, Colombo.",
    image: "/awards/aw1.webp",
    altText: "People's Excellency Awards 2025 Certificate - The Crown of Precision Award in Sri Lanka to WINSOR WATCHES",
  },
  {
    id: "aw3",
    year: "2025",
    category: "Monolith Architecture Trophy",
    institution: "People's Excellency Awards Sri Lanka 2025",
    title: "The Crown of Precision Award of the Year",
    recipient: "WINSOR WATCHES",
    venue: "Waters Edge Hotel, Colombo, Sri Lanka",
    date: "29th December 2025",
    citation: "Monolith architectural trophy with gold diamond emblem, inscribed: 'People's Excellency Awards Sri Lanka 2025 — The Crown of Precision Award of the Year — WINSOR WATCHES. 29th December 2025 @ Waters Edge Colombo Sri Lanka.'",
    image: "/awards/aw3.webp",
    altText: "People's Excellency Awards Sri Lanka 2025 Trophy - The Crown of Precision Award of the Year",
  },
];

export default function AwardsGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const masterAward = ALL_AWARDS[0];
  const individualAwards = ALL_AWARDS.slice(1);

  const handleOpen = (index: number) => {
    setActiveIndex(index);
  };

  const handleClose = () => {
    setActiveIndex(null);
  };

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? ALL_AWARDS.length - 1 : prev - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return null;
      return prev === ALL_AWARDS.length - 1 ? 0 : prev + 1;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, handlePrev, handleNext]);

  const currentAward = activeIndex !== null ? ALL_AWARDS[activeIndex] : null;

  return (
    <div className="w-full">
      {/* ── 1. MASTER BANNER SHOWCASE (all-aw.webp) ── */}
      <div
        onClick={() => handleOpen(0)}
        className="group relative mb-8 sm:mb-12 rounded-2xl overflow-hidden border border-[#8B6914]/30 shadow-2xl bg-[#0e0a06] cursor-pointer transition-all duration-500 hover:border-[#dfb15b]/70 hover:shadow-[0_24px_60px_rgba(139,105,20,0.22)]"
      >
        <div className="relative aspect-[16/9] md:aspect-[21/10] w-full overflow-hidden">
          <Image
            src={masterAward.image}
            alt={masterAward.altText}
            fill
            priority
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Subtle Vignette Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/30 to-transparent pointer-events-none" />

          {/* Top Floating Badge */}
          <div className="absolute top-3.5 left-3.5 sm:top-6 sm:left-6 flex items-center gap-2 bg-[#0e0a06]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#dfb15b]/40 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dfb15b] animate-pulse" />
            <span className="font-['Jost'] text-[9.5px] sm:text-[11px] tracking-[0.22em] uppercase font-semibold text-[#dfb15b]">
              Verified Official Accolades
            </span>
          </div>

          {/* Top Right Zoom Hint */}
          <div className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 flex items-center gap-2 bg-black/65 hover:bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white/90 transition-all duration-200">
            <svg
              className="w-3.5 h-3.5 text-[#dfb15b]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span className="font-['Jost'] text-[9.5px] sm:text-[10px] tracking-widest uppercase font-medium hidden sm:inline">
              View High Resolution
            </span>
          </div>

          {/* Bottom Captions */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="max-w-2xl">
              <span className="font-['Jost'] text-[9px] sm:text-[10.5px] tracking-[0.26em] text-[#dfb15b] uppercase font-semibold block mb-1">
                WINSOR (PVT) LTD &bull; DUBAI REGISTERED (2023)
              </span>
              <h3 className="font-serif text-lg sm:text-2xl md:text-3xl font-normal leading-tight text-white mb-1.5">
                The Complete Official Accolades Collection
              </h3>
              <p className="font-serif italic text-xs sm:text-sm text-white/80 font-light line-clamp-2 sm:line-clamp-none">
                Conferred upon WINSOR by the Global Laurel Excellence Awards (2026) and People&apos;s Excellency Awards Sri Lanka (2025).
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3.5 py-1.5 rounded-full bg-[#8B6914]/90 backdrop-blur-md text-white font-['Jost'] text-[10px] tracking-[0.18em] uppercase font-semibold shadow-md">
                2025 – 2026 Honors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FOUR INDIVIDUAL AWARD CARDS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {individualAwards.map((award, index) => {
          const globalIndex = index + 1; // index 0 is master banner
          return (
            <div
              key={award.id}
              onClick={() => handleOpen(globalIndex)}
              className="ws-award-card group bg-[#faf7f0] rounded-xl overflow-hidden border border-[#8B6914]/20 shadow-sm flex flex-col cursor-pointer transition-all duration-300 hover:border-[#8B6914]/50 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Award Image Container */}
              <div className="relative aspect-[3/4] w-full bg-[#16120c] overflow-hidden border-b border-[#8B6914]/15">
                <Image
                  src={award.image}
                  alt={award.altText}
                  fill
                  className="object-cover object-center ws-award-img transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Gradient Scrim for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Year Badge */}
                <div className="absolute top-2.5 right-2.5 bg-[#8B6914] text-white text-[9px] font-bold font-['Jost'] px-2.5 py-0.5 rounded-full shadow tracking-wider">
                  {award.year}
                </div>

                {/* Category Badge */}
                <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-[#dfb15b] border border-[#dfb15b]/30 text-[8.5px] font-semibold font-['Jost'] px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  {award.category}
                </div>

                {/* Bottom Quick Label inside image */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
                  <span className="font-['Jost'] text-[8.5px] tracking-[0.2em] text-[#dfb15b] uppercase font-semibold block">
                    {award.institution}
                  </span>
                  <span className="font-serif text-xs font-normal text-white/95 line-clamp-1">
                    {award.title}
                  </span>
                </div>
              </div>

              {/* Award Details */}
              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white/60">
                <div>
                  <span className="font-['Jost'] text-[9px] tracking-[0.2em] font-semibold text-[#8B6914] uppercase block mb-1">
                    {award.institution}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-medium text-[#1a1209] leading-snug mb-1.5 group-hover:text-[#8B6914] transition-colors">
                    {award.title}
                  </h3>
                  <span className="font-['Jost'] text-[10.5px] tracking-wider text-[#8B6914] font-semibold block mb-2">
                    {award.recipient}
                  </span>
                  <p className="font-serif text-xs text-[#1a1209]/80 font-light leading-relaxed mb-3">
                    &ldquo;{award.citation}&rdquo;
                  </p>

                  {/* Venue & Date Metadata (Clean SVG, No Emojis) */}
                  {award.venue && (
                    <div className="flex items-start gap-1.5 text-[10px] text-[#1a1209]/75 font-['Jost'] mb-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-[#8B6914] shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
                        <circle cx="12" cy="11" r="2.5" />
                      </svg>
                      <span>
                        {award.venue} {award.date ? `(${award.date})` : ""}
                      </span>
                    </div>
                  )}

                  {/* Signatories Metadata (Clean SVG, No Emojis) */}
                  {award.signatories && (
                    <div className="flex items-start gap-1.5 text-[9.5px] text-[#1a1209]/60 font-['Jost'] italic mb-3">
                      <svg
                        className="w-3.5 h-3.5 text-[#8B6914] shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{award.signatories}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#8B6914]/10 flex items-center justify-between text-[#8B6914] text-[10px] tracking-[0.16em] uppercase font-semibold">
                  <span>View Full Photo</span>
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. FULL RESOLUTION LIGHTBOX MODAL (WITH CAROUSEL NAVIGATION) ── */}
      {currentAward && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-black/92 backdrop-blur-xl animate-fadeIn"
          onClick={handleClose}
        >
          <div
            className="relative max-w-4xl w-full max-h-[94vh] bg-[#140f0a] border border-[#8B6914]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#8B6914]/25 bg-[#0e0a06]/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#8B6914] text-white text-[9.5px] font-bold tracking-wider font-['Jost']">
                  {currentAward.year}
                </span>
                <span className="font-['Jost'] text-xs tracking-[0.18em] text-[#dfb15b] uppercase font-semibold">
                  {currentAward.institution}
                </span>
              </div>

              {/* Item Counter & Close Button */}
              <div className="flex items-center gap-3">
                <span className="font-['Jost'] text-[10px] text-white/50 tracking-wider">
                  {activeIndex + 1} / {ALL_AWARDS.length}
                </span>
                <button
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Image Display with Carousel Prev/Next Controls */}
            <div className="relative flex-1 min-h-[380px] sm:min-h-[500px] max-h-[62vh] w-full bg-[#080604] overflow-hidden flex items-center justify-center p-2">
              <Image
                src={currentAward.image}
                alt={currentAward.altText}
                fill
                className="object-contain transition-opacity duration-300"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />

              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous award image"
                className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/65 hover:bg-black/90 border border-[#dfb15b]/40 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg z-10"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next award image"
                className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/65 hover:bg-black/90 border border-[#dfb15b]/40 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg z-10"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Modal Caption & Details */}
            <div className="p-4 sm:p-5 bg-[#0e0a06] border-t border-[#8B6914]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="max-w-2xl">
                <span className="font-['Jost'] text-[9px] sm:text-[10px] tracking-[0.24em] text-[#dfb15b] uppercase font-semibold block mb-0.5">
                  {currentAward.category} &bull; {currentAward.recipient}
                </span>
                <h4 className="font-serif text-base sm:text-xl text-white font-normal mb-1 leading-snug">
                  {currentAward.title}
                </h4>
                <p className="font-serif italic text-xs text-white/80 font-light leading-relaxed mb-1.5">
                  &ldquo;{currentAward.citation}&rdquo;
                </p>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/70 font-['Jost'] text-[10px]">
                  {currentAward.venue && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3 text-[#dfb15b] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
                        <circle cx="12" cy="11" r="2.5" />
                      </svg>
                      <span>
                        {currentAward.venue} {currentAward.date ? `(${currentAward.date})` : ""}
                      </span>
                    </div>
                  )}

                  {currentAward.signatories && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3 text-[#dfb15b] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span className="italic">Signatories: {currentAward.signatories}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Thumbnails / Close Button */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-full bg-[#8B6914] hover:bg-[#a67c1e] text-white text-[10px] tracking-[0.18em] uppercase font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
