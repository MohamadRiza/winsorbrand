'use client';

import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// LUXURY HOROLOGICAL SVG ICONS
// ─────────────────────────────────────────────────────────────
const ShieldCheckIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ReceiptIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8H8" />
    <path d="M16 12H8" />
    <path d="M13 16H8" />
  </svg>
);

const WrenchIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SECTIONS = [
  { id: 'sec-overview', label: 'WARRANTY AT A GLANCE' },
  { id: 'sec-1', label: '1. WHAT DOES THE WINSOR WARRANTY COVER?' },
  { id: 'sec-2', label: '2. WARRANTY PERIOD' },
  { id: 'sec-3', label: '3. WHAT IS NOT COVERED?' },
  { id: 'sec-4', label: '4. NORMAL WEAR & TEAR' },
  { id: 'sec-5', label: '5. WARRANTY CLAIM REQUIREMENTS' },
  { id: 'sec-6', label: '6. HOW TO MAKE A WARRANTY CLAIM' },
  { id: 'sec-7', label: '7. INTERNATIONAL WARRANTY' },
  { id: 'sec-8', label: '8. SERVICE AFTER THE WARRANTY PERIOD' },
  { id: 'sec-9', label: '9. REPLACEMENT OF WATCHES OR COMPONENTS' },
  { id: 'sec-10', label: '10. WARRANTY VOID CONDITIONS' },
  { id: 'sec-11', label: '11. CARE OF YOUR WINSOR WATCH' },
  { id: 'sec-12', label: '12. LIMITATION OF LIABILITY' },
  { id: 'sec-13', label: '13. WINSOR CUSTOMER CARE' },
];

export default function WarrantyPage() {
  const [activeSection, setActiveSection] = useState('sec-overview');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setIsMobileTocOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#FAF7F0] text-[#1a1209] min-h-screen font-['Jost',sans-serif]">
      {/* ─────────────────────────────────────────────────────────────
          HERO / HEADER (ELEGANT HOROLOGY SIZING)
      ───────────────────────────────────────────────────────────── */}
      <header className="relative pt-28 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#8b6914]/20 bg-gradient-to-b from-[#fdfcf9] via-[#faf5e8]/50 to-[#FAF7F0]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-semibold tracking-[0.05em] text-[#1a1209] mb-3 uppercase leading-tight">
            WINSOR WARRANTY &amp; SERVICE TERMS
          </h1>

          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="w-6 sm:w-12 h-[1px] bg-[#8b6914]/40" />
            <p className="font-['Cinzel',serif] text-[11px] sm:text-xs md:text-[13px] font-semibold tracking-[0.22em] text-[#8b6914] uppercase">
              YOUR WINSOR. YOUR MOMENT. OUR COMMITMENT.
            </p>
            <span className="w-6 sm:w-12 h-[1px] bg-[#8b6914]/40" />
          </div>

          <p className="font-['Cormorant_Garamond',serif] text-base sm:text-lg md:text-xl italic text-[#1a1209]/85 max-w-2xl mx-auto leading-relaxed mb-3">
            Every WINSOR timepiece is backed by a 1-Year International Warranty, giving you peace of mind and reliable after-sales support.
          </p>

          <p className="text-xs sm:text-[13.5px] text-[#1a1209]/70 max-w-xl mx-auto leading-relaxed font-normal">
            Our warranty is designed to protect you against manufacturing and mechanical defects that may occur during normal use, subject to the terms and conditions below.
          </p>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          WARRANTY AT A GLANCE (PERFECT HAIRLINE GRID BORDERS)
      ───────────────────────────────────────────────────────────── */}
      <section id="sec-overview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10 mb-12">
        <div className="bg-white rounded-2xl border border-[#8b6914]/30 shadow-xl shadow-[#1a1209]/04 overflow-hidden">
          <div className="bg-[#1a1209] text-white py-4 px-5 sm:px-7 border-b border-[#8b6914]/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <h2 className="font-['Cinzel',serif] text-sm sm:text-base tracking-[0.2em] uppercase font-semibold text-white">
              WARRANTY AT A GLANCE
            </h2>
            <a
              href="https://wa.me/94778778555?text=Hello%20WINSOR%20Customer%20Care"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] hover:text-white transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Customer Care: +94 77 877 8555</span>
            </a>
          </div>

          {/* Clean 6-cell hairline grid (zero overlapping borders) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#8b6914]/20">
            {/* 1 */}
            <div className="p-5 sm:p-6 bg-white flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Warranty Period:
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-[#1a1209] leading-snug block">
                  1 Year from the date of purchase
                </span>
              </div>
            </div>

            {/* 2 */}
            <div className="p-5 sm:p-6 bg-white flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <GlobeIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Warranty Type:
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-[#1a1209] leading-snug block">
                  International Warranty
                </span>
              </div>
            </div>

            {/* 3 */}
            <div className="p-5 sm:p-6 bg-white flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Coverage:
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-[#1a1209] leading-snug block">
                  Manufacturing and mechanical defects
                </span>
              </div>
            </div>

            {/* 4 */}
            <div className="p-5 sm:p-6 bg-white flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <ReceiptIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Proof of Purchase:
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-[#1a1209] leading-snug block">
                  Required
                </span>
              </div>
            </div>

            {/* 5 */}
            <div className="p-5 sm:p-6 bg-white flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <WrenchIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Service:
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-[#1a1209] leading-snug block">
                  WINSOR or an authorized WINSOR service channel
                </span>
              </div>
            </div>

            {/* 6 */}
            <div className="p-5 sm:p-6 bg-[#faf4e6]/50 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#8b6914]/15 border border-[#8b6914]/30 flex items-center justify-center flex-shrink-0 text-[#8b6914]">
                <PhoneIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#8b6914] font-semibold block mb-1">
                  Customer Care:
                </span>
                <a href="tel:+94778778555" className="text-sm sm:text-[15px] font-bold text-[#1a1209] hover:text-[#8b6914] transition-colors block">
                  +94 77 877 8555
                </a>
                <a href="mailto:support@winsorbrand.com" className="text-xs text-[#8b6914] hover:underline font-medium block mt-0.5 truncate">
                  support@winsorbrand.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MASTER EDITORIAL TWO-COLUMN LAYOUT (PERFECT PROPORTIONS)
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ── SIDEBAR (STICKY ON DESKTOP, CLEAN DROPDOWN ON MOBILE) ── */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            {/* Mobile Collapsible TOC Toggle */}
            <div className="lg:hidden bg-white rounded-xl border border-[#8b6914]/20 overflow-hidden shadow-xs">
              <button
                onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                className="w-full flex items-center justify-between p-3.5 text-xs font-bold uppercase tracking-wider text-[#8b6914] bg-white cursor-pointer"
              >
                <span>TABLE OF CONTENTS (13 SECTIONS)</span>
                <span className={`transform transition-transform duration-200 ${isMobileTocOpen ? 'rotate-180' : ''}`}>
                  <ChevronDownIcon className="w-4 h-4" />
                </span>
              </button>

              {isMobileTocOpen && (
                <nav aria-label="Mobile table of contents" className="p-3 border-t border-[#8b6914]/15 space-y-1 bg-[#FAF7F0]/60 max-h-72 overflow-y-auto">
                  {SECTIONS.filter(s => s.id !== 'sec-overview').map((sec, idx) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollTo(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                          isActive
                            ? 'bg-[#1a1209] text-white font-medium'
                            : 'text-[#1a1209]/75 hover:text-[#8b6914] hover:bg-white'
                        }`}
                      >
                        <span className="truncate">{idx + 1}. {sec.label.replace(/^\d+\.\s*/, '')}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Desktop Table of Contents */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#8b6914]/20 p-5 shadow-sm">
              <div className="text-[10.5px] uppercase font-bold tracking-[0.22em] text-[#8b6914] pb-3 mb-3 border-b border-[#8b6914]/15 flex items-center justify-between">
                <span>TABLE OF CONTENTS</span>
                <span className="text-[10px] text-[#1a1209]/40 font-mono font-normal">13 SECTIONS</span>
              </div>

              <nav aria-label="Table of contents" className="space-y-1">
                {SECTIONS.filter(s => s.id !== 'sec-overview').map((sec, idx) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-[#1a1209] text-white font-semibold shadow-xs translate-x-1'
                          : 'text-[#1a1209]/75 hover:text-[#8b6914] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <span className="truncate">{idx + 1}. {sec.label.replace(/^\d+\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Concierge Box */}
            <div className="bg-[#1a1209] text-white rounded-2xl p-5 sm:p-6 border border-[#8b6914]/30 shadow-md text-xs sm:text-[13px]">
              <div className="text-[#d4af37] font-['Cinzel',serif] uppercase tracking-[0.18em] font-semibold mb-2">
                WINSOR Customer Care
              </div>
              <div className="space-y-1.5 text-white/75 mb-4 leading-relaxed">
                <div>WhatsApp / Hotline: <strong className="text-white">+94 77 877 8555</strong></div>
                <div>General Inquiries: <strong className="text-white">+94 77 071 6212</strong></div>
                <div>Email: <a href="mailto:support@winsorbrand.com" className="text-[#d4af37] hover:underline font-medium">support@winsorbrand.com</a></div>
              </div>
              <a
                href="https://wa.me/94778778555"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#8b6914] hover:bg-[#a07d1a] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </aside>

          {/* ── UNIFIED EDITORIAL DOCUMENT (PROPORTIONAL SIZING & PROPER INDENTATION) ── */}
          <article className="lg:col-span-8 bg-white rounded-3xl border border-[#8b6914]/20 p-7 sm:p-10 lg:p-12 shadow-sm space-y-10">

            {/* 1. WHAT DOES THE WINSOR WARRANTY COVER? */}
            <section id="sec-1" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                1. WHAT DOES THE WINSOR WARRANTY COVER?
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-4">
                The WINSOR International Warranty covers manufacturing defects and mechanical or movement-related faults that occur under normal use during the warranty period.
              </p>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#8b6914] mb-2.5">
                Where a defect covered by this warranty is confirmed, WINSOR may, at its discretion:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] leading-relaxed">
                <li>Repair the watch;</li>
                <li>Replace the defective movement or component; or</li>
                <li>Replace the watch with the same model or a model of comparable value if the original is no longer available.</li>
              </ul>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 2. WARRANTY PERIOD */}
            <section id="sec-2" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                2. WARRANTY PERIOD
              </h2>
              <div className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed space-y-2.5">
                <p>
                  The warranty is valid for 1 year (12 months) from the original date of purchase.
                </p>
                <p>
                  The warranty period begins on the date stated on the official invoice, sales receipt, or warranty card issued by WINSOR or an authorized retailer.
                </p>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 3. WHAT IS NOT COVERED? */}
            <section id="sec-3" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                3. WHAT IS NOT COVERED?
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 font-medium mb-5">
                The warranty does not cover:
              </p>

              <div className="space-y-6 text-sm sm:text-[15px] text-[#1a1209]/80">
                {/* a */}
                <div>
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    a) Physical and Accidental Damage
                  </h3>
                  <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                    <li>Damage resulting from accidents, drops, impacts, mishandling, negligence, or improper use.</li>
                    <li>Scratches, dents, cracks, or chips on the case, bezel, crystal (glass), crown, pushers, or case back.</li>
                  </ul>
                </div>

                {/* b */}
                <div>
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    b) Straps, Bracelets &amp; Clasps
                  </h3>
                  <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                    <li>Normal wear and tear, discoloration, aging, or damage to leather, silicone, rubber, mesh, fabric, or stainless steel straps.</li>
                    <li>Strap replacement is considered a consumable/wear item and is not covered under warranty unless a manufacturing defect is identified upon receipt.</li>
                  </ul>
                </div>

                {/* c */}
                <div>
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    c) Batteries
                  </h3>
                  <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                    <li>Battery life is not covered by the warranty.</li>
                    <li>Quartz watches are supplied with a factory-installed testing battery, and battery replacement over time is part of standard maintenance.</li>
                  </ul>
                </div>

                {/* d */}
                <div>
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    d) Water Damage &amp; Moisture Exposure
                  </h3>
                  <p className="mb-2 text-[#1a1209]/75">
                    Water entry or moisture damage caused by:
                  </p>
                  <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 mb-3 leading-relaxed">
                    <li>Operating the crown or pushers while the watch is wet or submerged;</li>
                    <li>Failure to ensure the crown is fully pushed in or screwed down;</li>
                    <li>Subjecting the watch to water pressure beyond its rated water-resistance specification;</li>
                    <li>Exposure to hot water, steam, saunas, or chemical substances (such as perfumes, detergents, or chlorine).</li>
                  </ul>
                  <p className="text-xs sm:text-[13.5px] text-[#1a1209]/70 italic bg-[#faf6ee] p-3 rounded-lg border border-[#8b6914]/15">
                    Condensation or fogging resulting from rapid temperature change is not necessarily a defect, but if moisture remains inside the watch, it should be serviced immediately.
                  </p>
                </div>

                {/* e */}
                <div>
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    e) Unauthorized Repairs &amp; Alterations
                  </h3>
                  <p className="text-[#1a1209]/75 leading-relaxed">
                    Any service, repair, battery change, opening of the case, or modification performed by any party other than WINSOR or an authorized WINSOR service channel will immediately void the warranty.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 4. NORMAL WEAR & TEAR */}
            <section id="sec-4" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                4. NORMAL WEAR &amp; TEAR
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-3">
                Like all fine precision instruments, a watch will show signs of wear over time.
              </p>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#8b6914] mb-2.5">
                The warranty does not cover:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] leading-relaxed">
                <li>Natural fading of dial or hands over time;</li>
                <li>Gradual wear of gold-tone, rose gold, black PVD, or other plated coatings;</li>
                <li>Wear on leather straps from perspiration, moisture, or daily use;</li>
                <li>Minor cosmetic imperfections that do not affect the timekeeping or function of the watch.</li>
              </ul>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 5. WARRANTY CLAIM REQUIREMENTS */}
            <section id="sec-5" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                5. WARRANTY CLAIM REQUIREMENTS
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-3">
                To claim warranty service, the customer must provide:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] mb-4 leading-relaxed">
                <li>The watch requiring inspection or repair;</li>
                <li>Valid Proof of Purchase (original invoice, receipt, or stamped warranty card);</li>
                <li>A clear description of the issue encountered.</li>
              </ul>
              <p className="text-xs sm:text-sm text-[#1a1209]/85 font-medium bg-[#faf6ee] p-3.5 rounded-xl border border-[#8b6914]/20">
                WINSOR reserves the right to decline warranty service if valid proof of purchase cannot be produced.
              </p>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 6. HOW TO MAKE A WARRANTY CLAIM */}
            <section id="sec-6" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-5 leading-snug">
                6. HOW TO MAKE A WARRANTY CLAIM
              </h2>

              <div className="space-y-4 text-sm sm:text-[15px] text-[#1a1209]/80">
                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7F0]/70 border border-[#8b6914]/15">
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    Step 1: Contact WINSOR Customer Care
                  </h3>
                  <p className="text-[#1a1209]/75 leading-relaxed">
                    Reach out via WhatsApp or hotline at +94 77 877 8555 with your order/invoice number, a description of the issue, and photos or video if applicable.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7F0]/70 border border-[#8b6914]/15">
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    Step 2: Watch Inspection
                  </h3>
                  <p className="text-[#1a1209]/75 leading-relaxed">
                    Our team will advise whether the watch should be brought to our service desk or securely delivered for inspection by our watchmakers.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7F0]/70 border border-[#8b6914]/15">
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    Step 3: Warranty Decision
                  </h3>
                  <p className="text-[#1a1209]/75 mb-2 leading-relaxed">
                    Our technical team will inspect the watch and confirm whether the issue is covered under warranty.
                  </p>
                  <ul className="space-y-1.5 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                    <li>If covered, the repair or replacement will be carried out at no charge.</li>
                    <li>If not covered, an estimate for the repair cost will be provided for your approval before any work begins.</li>
                  </ul>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7F0]/70 border border-[#8b6914]/15">
                  <h3 className="font-semibold text-[#1a1209] mb-1.5 text-[15px]">
                    Step 4: Collection / Return Delivery
                  </h3>
                  <p className="text-[#1a1209]/75 leading-relaxed">
                    Once repaired and quality-checked, the watch will be returned to you or made available for collection.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 7. INTERNATIONAL WARRANTY */}
            <section id="sec-7" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                7. INTERNATIONAL WARRANTY
              </h2>
              <div className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed space-y-3">
                <p>
                  The WINSOR 1-Year International Warranty applies to purchases made through official WINSOR channels and authorized partners worldwide.
                </p>
                <p className="font-medium text-[#1a1209]">
                  If you are located outside Sri Lanka and require warranty assistance:
                </p>
                <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                  <li>Contact WINSOR Customer Care to determine the best service option;</li>
                  <li>The customer may be responsible for shipping costs, insurance, and any local customs duties or taxes associated with sending the watch for service, unless otherwise agreed.</li>
                </ul>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 8. SERVICE AFTER THE WARRANTY PERIOD */}
            <section id="sec-8" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                8. SERVICE AFTER THE WARRANTY PERIOD
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-3">
                WINSOR timepieces are built to last. If your watch requires service, repair, or battery replacement after the 1-year warranty has expired, WINSOR provides after-sales service at reasonable charges.
              </p>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#8b6914] mb-2.5">
                Available services include:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] leading-relaxed">
                <li>Battery replacement;</li>
                <li>Movement servicing and regulation;</li>
                <li>Glass (crystal) replacement;</li>
                <li>Strap and buckle replacement;</li>
                <li>Case cleaning and minor restoration.</li>
              </ul>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 9. REPLACEMENT OF WATCHES OR COMPONENTS */}
            <section id="sec-9" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                9. REPLACEMENT OF WATCHES OR COMPONENTS
              </h2>
              <div className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed space-y-2.5">
                <p>
                  In the event that a replacement watch or component is provided:
                </p>
                <ul className="space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] text-[#1a1209]/75 leading-relaxed">
                  <li>The replacement part or watch assumes the remaining warranty period of the original purchase.</li>
                  <li>The replacement does not start a new 1-year warranty period, unless required by applicable law.</li>
                </ul>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 10. WARRANTY VOID CONDITIONS */}
            <section id="sec-10" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                10. WARRANTY VOID CONDITIONS
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-3">
                The warranty will be considered null and void if:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] leading-relaxed">
                <li>The watch case has been opened by an unauthorized technician or third party;</li>
                <li>The watch shows signs of tampering, alteration, or misuse;</li>
                <li>The serial number or markings (where applicable) have been removed, defaced, or altered;</li>
                <li>The watch has been subjected to conditions exceeding its operational specifications.</li>
              </ul>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 11. CARE OF YOUR WINSOR WATCH */}
            <section id="sec-11" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                11. CARE OF YOUR WINSOR WATCH
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-3">
                To keep your WINSOR timepiece performing at its best, we recommend:
              </p>
              <ul className="text-sm sm:text-[15px] text-[#1a1209]/80 space-y-2 list-disc list-outside pl-5 marker:text-[#8b6914] leading-relaxed">
                <li>Keeping the crown fully pushed in or screwed down at all times;</li>
                <li>Avoiding exposure to strong magnetic fields (speakers, refrigerators, mobile devices);</li>
                <li>Cleaning the watch case and crystal with a soft, dry microfiber cloth;</li>
                <li>Rinsing with fresh water and wiping dry after exposure to salt water (for water-resistant models);</li>
                <li>Avoiding contact with perfumes, solvents, and harsh chemicals;</li>
                <li>Storing the watch in its original box or a padded watch case when not worn;</li>
                <li>Having battery replacement carried out through WINSOR to protect water resistance seals.</li>
              </ul>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 12. LIMITATION OF LIABILITY */}
            <section id="sec-12" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                12. LIMITATION OF LIABILITY
              </h2>
              <div className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed space-y-2.5">
                <p>
                  To the fullest extent permitted by law, WINSOR shall not be liable for any indirect, incidental, or consequential damages arising from the use of, or inability to use, the watch.
                </p>
                <p>
                  This warranty gives you specific legal rights, and you may also have other rights that vary by jurisdiction. Nothing in this warranty affects your statutory rights as a consumer under applicable laws.
                </p>
              </div>
            </section>

            <hr className="border-[#8b6914]/15" />

            {/* 13. WINSOR CUSTOMER CARE */}
            <section id="sec-13" className="scroll-mt-32">
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-semibold text-[#1a1209] tracking-wide mb-3 leading-snug">
                13. WINSOR CUSTOMER CARE
              </h2>
              <p className="text-sm sm:text-[15px] text-[#1a1209]/80 leading-relaxed mb-4">
                For warranty inquiries, service requests, or technical support, please contact:
              </p>

              <div className="bg-[#FAF7F0] rounded-2xl p-6 sm:p-8 border border-[#8b6914]/25 space-y-5 text-sm sm:text-[15px]">
                <div>
                  <h3 className="font-['Cinzel',serif] font-bold text-[#1a1209] text-base mb-2">
                    WINSOR Customer Care
                  </h3>
                  <div className="text-[#1a1209]/80 space-y-1.5 leading-relaxed">
                    <div>
                      WhatsApp / Hotline:{' '}
                      <a href="https://wa.me/94778778555" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#8b6914] hover:underline">
                        +94 77 877 8555
                      </a>
                    </div>
                    <div>
                      General Inquiries:{' '}
                      <a href="tel:+94770716212" className="font-semibold text-[#8b6914] hover:underline">
                        +94 77 071 6212
                      </a>
                    </div>
                    <div className="break-all sm:break-normal">
                      Email:{' '}
                      <a href="mailto:support@winsorbrand.com" className="font-semibold text-[#8b6914] hover:underline">
                        support@winsorbrand.com
                      </a>
                    </div>
                    <div>
                      Website:{' '}
                      <a href="https://www.winsorbrand.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#8b6914]">
                        www.winsorbrand.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#8b6914]/15">
                  <h4 className="font-['Cinzel',serif] font-bold text-[#1a1209] text-sm sm:text-[15px] mb-1.5">
                    Head Office / Service Coordination:
                  </h4>
                  <p className="text-[#1a1209]/80 leading-relaxed">
                    WINSOR (PVT) LTD<br />
                    147/13 2nd Cross Street,<br />
                    Colombo 11, Sri Lanka.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#8b6914]/15 text-center sm:text-left">
                  <p className="font-['Cinzel',serif] text-base sm:text-lg font-semibold tracking-[0.18em] text-[#8b6914]">
                    RIDE YOUR MOMENT - WINSOR
                  </p>
                  <p className="font-['Cormorant_Garamond',serif] text-base sm:text-lg italic text-[#1a1209]/80 mt-0.5">
                    Your time deserves the right care.
                  </p>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
