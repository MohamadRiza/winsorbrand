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
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const masterAward = ALL_AWARDS[0];
  const individualAwards = ALL_AWARDS.slice(1);

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    setIsFullScreen(false);
    setZoomScale(1);
  };

  const handleClose = () => {
    setActiveIndex(null);
    setIsFullScreen(false);
    setZoomScale(1);
  };

  const handleOpenFullScreen = () => {
    setIsFullScreen(true);
    setZoomScale(1);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setZoomScale(1);
  };

  const toggleZoom = () => {
    setZoomScale((prev) => (prev === 1 ? 1.6 : 1));
  };

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? ALL_AWARDS.length - 1 : prev - 1;
    });
    setZoomScale(1);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return null;
      return prev === ALL_AWARDS.length - 1 ? 0 : prev + 1;
    });
    setZoomScale(1);
  }, []);

  // Keyboard navigation for both Modal and Full-Screen
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullScreen) {
          handleCloseFullScreen();
        } else {
          handleClose();
        }
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
  }, [activeIndex, isFullScreen, handlePrev, handleNext]);

  const currentAward = activeIndex !== null ? ALL_AWARDS[activeIndex] : null;

  return (
    <div className="w-full">
      {/* ── 1. MASTER BANNER SHOWCASE (all-aw.webp) — RESPONSIVE & MOBILE-OPTIMIZED ── */}
      <div
        onClick={() => handleOpen(0)}
        className="group relative mb-6 sm:mb-12 rounded-2xl overflow-hidden border border-[#8B6914]/30 shadow-xl bg-[#FAF8F5] cursor-pointer transition-all duration-500 hover:border-[#8B6914] hover:shadow-[0_20px_50px_rgba(139,105,20,0.2)]"
      >
        <div className="relative min-h-[280px] sm:min-h-0 aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/10] w-full overflow-hidden">
          <Image
            src={masterAward.image}
            alt={masterAward.altText}
            fill
            priority
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Subtle Vignette Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-transparent pointer-events-none" />

          {/* Top Floating Badge */}
          <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 bg-[#0e0a06]/80 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#dfb15b]/40 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dfb15b] animate-pulse" />
            <span className="font-['Jost'] text-[8.5px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase font-semibold text-[#dfb15b]">
              <span className="hidden sm:inline">Verified </span>Official Accolades
            </span>
          </div>

          {/* Top Right Zoom Hint */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex items-center gap-1.5 bg-black/60 hover:bg-black/85 backdrop-blur-md p-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-white/20 text-white/90 transition-all duration-200">
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
            <span className="font-['Jost'] text-[9.5px] tracking-widest uppercase font-medium hidden sm:inline">
              View Honors & Full Resolution
            </span>
          </div>

          {/* Bottom Captions Written Directly on Image */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
            <div className="max-w-2xl">
              <span className="font-['Jost'] text-[8px] sm:text-[10.5px] tracking-[0.2em] sm:tracking-[0.26em] text-[#dfb15b] uppercase font-semibold block mb-0.5 sm:mb-1">
                WINSOR (PVT) LTD &bull; EST. 2023
              </span>
              <h3 className="font-serif text-[15px] sm:text-2xl md:text-3xl font-normal leading-snug sm:leading-tight text-white mb-1">
                The Complete Official Accolades Collection
              </h3>
              <p className="font-serif italic text-[11px] sm:text-sm text-white/80 font-light line-clamp-1 sm:line-clamp-none">
                Conferred upon WINSOR by the Global Laurel Excellence Awards (2026) and People&apos;s Excellency Awards Sri Lanka (2025).
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#9C7A3C] to-[#8B6914] text-white font-['Jost'] text-[8.5px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.18em] uppercase font-semibold shadow-md whitespace-nowrap">
                2025 – 2026 Honors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FOUR INDIVIDUAL AWARD TILES (2-COLUMN GRID ON MOBILE, 4-COLUMN ON DESKTOP) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 md:gap-6">
        {individualAwards.map((award, index) => {
          const globalIndex = index + 1; // index 0 is master banner
          return (
            <div
              key={award.id}
              onClick={() => handleOpen(globalIndex)}
              className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-[#8B6914]/30 shadow-md sm:shadow-lg cursor-pointer transition-all duration-500 hover:border-[#8B6914] hover:shadow-[0_20px_45px_rgba(139,105,20,0.22)] hover:-translate-y-1.5 bg-[#FAF8F5]"
            >
              {/* Full-Bleed High-Res Image */}
              <Image
                src={award.image}
                alt={award.altText}
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Seamless Dark Horology Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none transition-opacity duration-300" />

              {/* Top Clean Accent: Year Pill (Category pill shown on sm+) */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between pointer-events-none gap-1">
                <span className="font-['Jost'] text-[8.5px] sm:text-[9px] tracking-wider uppercase font-bold text-[#8B6914] bg-white/95 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#8B6914]/30 shadow-sm shrink-0">
                  {award.year}
                </span>
                <span className="hidden sm:inline-block font-['Jost'] text-[8.5px] tracking-wider uppercase font-medium text-[#141414] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/10 shadow-sm">
                  {award.category}
                </span>
              </div>

              {/* Text Written Directly ON The Image At The Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5 text-white flex flex-col justify-end">
                <span className="font-['Jost'] text-[8px] sm:text-[9.5px] tracking-[0.16em] sm:tracking-[0.24em] font-semibold text-[#dfb15b] uppercase block mb-0.5 sm:mb-1 truncate">
                  {award.institution}
                </span>
                <h3 className="font-serif text-[12.5px] sm:text-[17px] font-normal text-white leading-snug line-clamp-2 mb-1 sm:mb-2 group-hover:text-[#dfb15b] transition-colors">
                  {award.title}
                </h3>
                <div className="flex items-center gap-1 text-[#dfb15b] font-['Jost'] text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase font-semibold opacity-90 group-hover:opacity-100 transition-all">
                  <span>View Honors</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. PRESTIGE MODAL POPUP (MOBILE-OPTIMIZED WITH COMPACT HEADER & BALANCED PROPORTIONS) ── */}
      {currentAward && activeIndex !== null && !isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-6 bg-[#1a1209]/60 backdrop-blur-md animate-fadeIn"
          onClick={handleClose}
        >
          <div
            className="relative max-w-4xl w-full max-h-[94vh] bg-gradient-to-br from-[#FFFFFF] via-[#FAF8F5] to-[#F5EFEB] border border-[#8B6914]/30 rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(26,18,9,0.2),0_0_50px_rgba(139,105,20,0.12)] flex flex-col text-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar — No Line Wrapping on Mobile */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#8B6914]/20 bg-white/95 backdrop-blur-md gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#9C7A3C] to-[#8B6914] text-white text-[9px] sm:text-[9.5px] font-bold tracking-wider font-['Jost'] shrink-0 shadow-sm">
                  {currentAward.year}
                </span>
                <span className="font-['Jost'] text-[11px] sm:text-[13px] tracking-[0.16em] sm:tracking-[0.2em] text-[#8B6914] uppercase font-semibold truncate">
                  {currentAward.institution}
                </span>
              </div>

              {/* Item Counter & Close Button */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-['Jost'] text-[10px] text-[#777777] tracking-widest font-medium whitespace-nowrap">
                  {activeIndex + 1} / {ALL_AWARDS.length}
                </span>
                <button
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/[0.05] hover:bg-[#8B6914] border border-[#8B6914]/25 flex items-center justify-center text-[#141414] hover:text-white transition-all duration-200 cursor-pointer shadow-sm shrink-0"
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

            {/* Modal Body: Two-Column Showcase (Balanced on Mobile) */}
            <div className="overflow-y-auto p-3.5 sm:p-6 lg:p-7 max-h-[calc(94vh-55px)]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-7 items-center">
                {/* Image Column (Clickable to Full Screen) */}
                <div className="md:col-span-5 relative">
                  <div
                    onClick={handleOpenFullScreen}
                    title="Click to view full screen"
                    className="group relative aspect-[4/3] sm:aspect-[3/4] max-h-[220px] sm:max-h-none w-full bg-gradient-to-b from-[#FBF9F6] to-[#F3EDE5] rounded-xl overflow-hidden border border-[#8B6914]/25 shadow-md flex items-center justify-center cursor-pointer"
                  >
                    <Image
                      src={currentAward.image}
                      alt={currentAward.altText}
                      fill
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority
                    />

                    {/* Interactive Hover Prompt for Full Screen */}
                    <div className="absolute inset-0 bg-[#1a1209]/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#8B6914] text-white flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 3 21 3 21 9" />
                          <polyline points="9 21 3 21 3 15" />
                          <line x1="21" y1="3" x2="14" y2="10" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                      </div>
                      <span className="font-['Jost'] text-[9.5px] sm:text-[10px] tracking-[0.2em] uppercase font-semibold text-white drop-shadow">
                        Click For Full Screen
                      </span>
                    </div>

                    {/* Top Floating Badge */}
                    <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-white/90 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#8B6914]/30 text-[#8B6914] text-[8px] sm:text-[8.5px] font-['Jost'] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                      <span>Full Screen</span>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </div>

                    {/* Prev Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      aria-label="Previous award image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-[#8B6914] border border-[#8B6914]/30 text-[#141414] hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 cursor-pointer shadow-md z-10"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      aria-label="Next award image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-[#8B6914] border border-[#8B6914]/30 text-[#141414] hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 cursor-pointer shadow-md z-10"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                </div>

                {/* Details Column: Title, Full Description & Metadata */}
                <div className="md:col-span-7 flex flex-col justify-center space-y-2.5 sm:space-y-3.5">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="font-['Jost'] text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.24em] text-[#8B6914] uppercase font-semibold">
                        {currentAward.category}
                      </span>
                      <span className="text-[#8B6914]/40">•</span>
                      <span className="font-['Jost'] text-[8.5px] sm:text-[10px] tracking-[0.14em] sm:tracking-[0.16em] text-[#555555] uppercase font-medium truncate">
                        {currentAward.recipient}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg sm:text-2xl lg:text-[26px] font-normal text-[#141414] leading-snug mb-1">
                      {currentAward.title}
                    </h3>
                  </div>

                  {/* Official Citation Quote Box */}
                  <div className="bg-white rounded-xl p-3 sm:p-5 border-l-4 border-[#8B6914] border-y border-r border-black/[0.04] shadow-[0_2px_14px_rgba(139,105,20,0.06)]">
                    <span className="font-['Jost'] text-[8.5px] sm:text-[9px] uppercase tracking-[0.18em] sm:tracking-[0.2em] font-semibold text-[#8B6914] block mb-0.5 sm:mb-1">
                      Official Citation & Accolade
                    </span>
                    <p className="font-serif italic text-xs sm:text-sm text-[#141414]/90 leading-relaxed m-0">
                      &ldquo;{currentAward.citation}&rdquo;
                    </p>
                  </div>

                  {/* Metadata: Venue, Date, Signatories */}
                  <div className="space-y-1.5 text-xs text-[#555555] font-['Jost']">
                    {currentAward.venue && (
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 text-[#8B6914] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" /><circle cx="12" cy="11" r="2.5" /></svg>
                        <span className="text-[11px] sm:text-xs"><strong className="text-[#141414]">Venue:</strong> {currentAward.venue} {currentAward.date ? `(${currentAward.date})` : ''}</span>
                      </div>
                    )}

                    {currentAward.signatories && (
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 text-[#8B6914] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        <span className="text-[11px] sm:text-xs"><strong className="text-[#141414]">Signatories:</strong> {currentAward.signatories}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="pt-2 sm:pt-3 flex items-center justify-between gap-2.5 sm:gap-3 border-t border-black/[0.08]">
                    <button
                      onClick={handleOpenFullScreen}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#9C7A3C] via-[#8B6914] to-[#9C7A3C] hover:from-[#B58F49] hover:to-[#8B6914] text-white text-[9.5px] sm:text-[10.5px] tracking-[0.16em] sm:tracking-[0.18em] uppercase font-bold shadow-md transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                      <span>View Full Screen</span>
                    </button>

                    <button
                      onClick={handleClose}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-[#FAF8F5] text-[#8B6914] border border-[#8B6914]/40 hover:border-[#8B6914] text-[9.5px] sm:text-[10.5px] tracking-[0.14em] sm:tracking-[0.16em] uppercase font-semibold transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FULL-SCREEN LIGHTBOX VIEW (CLEAN SINGLE-LINE CONTROL BAR ON ALL SCREEN SIZES) ── */}
      {currentAward && activeIndex !== null && isFullScreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999999] bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEB] to-[#FAF8F5] flex flex-col justify-between p-2.5 sm:p-6 animate-fadeIn text-[#141414]"
          onClick={handleCloseFullScreen}
        >
          {/* Full Screen Top Control Bar */}
          <div
            className="flex items-center justify-between w-full max-w-7xl mx-auto py-2 sm:py-2.5 px-3 sm:px-6 bg-white/95 backdrop-blur-md rounded-full border border-[#8B6914]/25 shadow-md z-20 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <span className="font-['Jost'] text-[9.5px] sm:text-xs tracking-[0.16em] sm:tracking-[0.24em] uppercase font-semibold text-[#8B6914] truncate">
                {currentAward.institution}
              </span>
              <span className="hidden md:inline text-black/20">•</span>
              <span className="hidden md:inline font-serif text-xs text-[#141414]/80 truncate">
                {currentAward.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Zoom Toggle with SVG icon */}
              <button
                onClick={toggleZoom}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#8B6914] text-[#8B6914] hover:text-white border border-[#8B6914]/30 text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1 whitespace-nowrap"
                title="Toggle Zoom"
              >
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  {zoomScale === 1 ? (
                    <>
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </>
                  ) : (
                    <line x1="8" y1="11" x2="14" y2="11" />
                  )}
                </svg>
                <span>{zoomScale === 1 ? "Zoom" : "Reset"}</span>
              </button>

              {/* Slide Counter */}
              <span className="font-['Jost'] text-[9.5px] sm:text-[10.5px] text-[#777777] tracking-wider px-1 font-medium whitespace-nowrap">
                {activeIndex + 1}/{ALL_AWARDS.length}
              </span>

              {/* Close Full Screen Button */}
              <button
                onClick={handleCloseFullScreen}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#9C7A3C] to-[#8B6914] hover:from-[#B58F49] hover:to-[#9C7A3C] text-white text-[9px] sm:text-[10px] tracking-wider font-['Jost'] uppercase font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Back</span>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          {/* Full Screen Image Container */}
          <div
            className="relative flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-2 sm:my-3 min-h-0 overflow-hidden cursor-zoom-in"
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom();
            }}
          >
            {/* Prev Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous award in full screen"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-white/90 hover:bg-[#8B6914] border border-[#8B6914]/35 text-[#141414] hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 shadow-xl z-30 cursor-pointer"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            {/* High-Resolution Photo */}
            <div
              className="relative w-full h-[65vh] sm:h-[75vh] md:h-[80vh] flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <Image
                src={currentAward.image}
                alt={currentAward.altText}
                fill
                priority
                unoptimized
                className="object-contain drop-shadow-[0_12px_36px_rgba(26,18,9,0.18)]"
                sizes="100vw"
              />
            </div>

            {/* Next Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next award in full screen"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-white/90 hover:bg-[#8B6914] border border-[#8B6914]/35 text-[#141414] hover:text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110 shadow-xl z-30 cursor-pointer"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Full Screen Bottom Caption Bar with Safe Padding from Floating Widgets */}
          <div
            className="w-full max-w-4xl mx-auto text-center py-2 sm:py-2.5 px-4 sm:px-6 pl-14 sm:pl-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#8B6914]/20 shadow-md z-20 mb-8 sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-xs sm:text-base text-[#141414] font-normal mb-0.5 truncate">
              {currentAward.title}
            </h4>
            <p className="font-['Jost'] text-[9px] sm:text-[11px] text-[#8B6914] tracking-wider uppercase font-medium truncate">
              {currentAward.category} • {currentAward.recipient} • Click to Zoom
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
