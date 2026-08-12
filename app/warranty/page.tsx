'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────
// VECTOR SVG ICONS (Professional Lucide-Style Icons - Zero Emojis)
// ─────────────────────────────────────────────────────────────
const ShieldCheckIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ChainIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const BatteryIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <line x1="6" y1="11" x2="6" y2="13" />
    <line x1="10" y1="11" x2="10" y2="13" />
  </svg>
);

const GearIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const WaterIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const WrenchIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const TagIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 2 9 9-9 9-9-9V2h9z" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

const StoreIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

interface WarrantyCategory {
  id: string;
  title: string;
  badge: string;
  iconFn: (color?: string) => ReactNode;
  summary: string;
  details: string[];
  importantNote?: string;
  coverageYears: string;
}

const CATEGORIES: WarrantyCategory[] = [
  {
    id: 'chain',
    title: 'Chain & Bracelet Watches',
    badge: '1 Year Full Protection',
    iconFn: (c = "#8b6914") => <ChainIcon className="w-6 h-6" color={c} />,
    summary: 'Comprehensive 1-year coverage on both casing color and internal movement precision.',
    details: [
      '1 Year Machine / Movement Warranty against manufacturing defect.',
      '1 Year Color Warranty against plating fading, peeling, or discoloration under normal wear.',
      'Includes free link adjustments and clasp checks at any official retailer.',
    ],
    importantNote: 'Avoid exposing plated chains to harsh industrial chemicals, strong acids, or heavy perfumes.',
    coverageYears: '1 Year Machine & Color',
  },
  {
    id: 'battery',
    title: 'Quartz / Battery Watches',
    badge: '1 Year Machine & Color',
    iconFn: (c = "#8b6914") => <BatteryIcon className="w-6 h-6" color={c} />,
    summary: 'Most battery-powered timepieces carry full machine and color warranty plus free battery swaps.',
    details: [
      '1 Year Machine Warranty covering electronic module and quartz oscillator.',
      '1 Year Color Warranty on case and bezel finishing.',
      '100% Free Battery Replacements during the first 12 months of ownership.',
    ],
    importantNote: 'Battery replacement under 1 year is completely free of charge. After 1 year, a small nominal fee applies.',
    coverageYears: '1 Year Full + Free Battery',
  },
  {
    id: 'automatic',
    title: 'Automatic Winding Watches',
    badge: 'Special 6-Month Select Coverage',
    iconFn: (c = "#8b6914") => <GearIcon className="w-6 h-6" color={c} />,
    summary: 'Pure mechanical timepieces powered by movement. Special warranty terms apply.',
    details: [
      'Standard automatic winding models generally do not carry a machine warranty due to mechanical nature.',
      'Selected premium automatic watches include a 6-Month Machine Warranty (indicated on guarantee card).',
      'Free balance wheel inspection and regulator calibration under 1 year.',
    ],
    importantNote: 'Always verify if your specific automatic model qualifies for the 6-Month Select Warranty during purchase.',
    coverageYears: '6 Months (Selected Models)',
  },
  {
    id: 'sport',
    title: 'Sport & Diver Series',
    badge: '1 Year Water-Proof Guarantee',
    iconFn: (c = "#8b6914") => <WaterIcon className="w-6 h-6" color={c} />,
    summary: 'Engineered for active lifestyles with certified water-resistance seals.',
    details: [
      '1 Year Waterproof / Water Resistance Warranty protecting against moisture ingress.',
      '1 Year Shock-Resistant Module Protection on sports digital & hybrid watches.',
      'Free O-ring gasket lubrication and pressure test under 12 months.',
    ],
    importantNote: 'Do not operate chronograph pushers underwater. Ensure crown is fully screwed down before water exposure.',
    coverageYears: '1 Year Waterproof',
  },
  {
    id: 'bangle',
    title: 'Ladies Bangle & Jewelry Sets',
    badge: 'Watch Head Covered',
    iconFn: (c = "#8b6914") => <SparklesIcon className="w-6 h-6" color={c} />,
    summary: 'Elegantly packaged watch & bangle gift sets. Warranty scope is specifically targeted.',
    details: [
      'Warranty applies strictly to the watch timepiece itself (machine and watch head color).',
      'Accompanying decorative bangles, bracelets, and neck chains are non-warranty gift accessories by default.',
      'Select premium bangle items may be eligible for warranty claims as explicitly stamped on their certificate.',
    ],
    importantNote: 'If you purchased a select premium bangle set with stamped coverage, warranty can be claimed at any retailer.',
    coverageYears: 'Watch Head Covered',
  },
  {
    id: 'servicing',
    title: 'Servicing & Battery Maintenance',
    badge: 'Free Under 1 Year',
    iconFn: (c = "#8b6914") => <WrenchIcon className="w-6 h-6" color={c} />,
    summary: 'Lifetime support for every Winsor timepiece with 1st-year free servicing.',
    details: [
      'Under 1 Year: Battery replacements, time calibration, gasket checks, and minor repairs are 100% FREE.',
      'After 1 Year: Servicing remains fully available at a small nominal charge.',
      'Authentic original batteries and genuine spare parts used exclusively.',
    ],
    importantNote: 'Bring your physical warranty card or digital order invoice when visiting our service centers.',
    coverageYears: 'Free Year 1 / Nominal Year 2+',
  },
  {
    id: 'nowarranty',
    title: 'Clearance & No-Warranty Items',
    badge: 'Special As-Is Terms',
    iconFn: (c = "#8b6914") => <TagIcon className="w-6 h-6" color={c} />,
    summary: 'Budget promotional or clearance items sold under non-warranty terms.',
    details: [
      'Some promotional or clearance watches are sold without warranty coverage.',
      'Clearly marked as "No Warranty" on product details and invoice.',
      'Paid repair services remain fully accessible at any Winsor service center.',
    ],
    importantNote: 'Check the warranty badge on your watch product page or invoice to confirm coverage tier.',
    coverageYears: 'No Warranty',
  },
];

const FAQS = [
  {
    q: 'How do I claim my 1-Year Warranty in Sri Lanka?',
    a: 'Simply visit any authorized Winsor retailer across Sri Lanka or contact our Customer Care team. Present your purchase receipt or digital order invoice to initiate instant warranty service.'
  },
  {
    q: 'Are battery replacements free?',
    a: 'Yes! All battery-powered Winsor watches receive 100% FREE battery replacements during the first 1 year of purchase. After 1 year, battery replacements are available for a very small nominal charge.'
  },
  {
    q: 'Does the warranty cover my ladies bangle bracelet?',
    a: 'For ladies watch & bangle sets, the warranty covers the watch timepiece itself (machine and watch head color). Accompanying bangles are complimentary gift accessories unless specifically stamped on selected premium sets.'
  },
  {
    q: 'What warranty is provided for automatic watches?',
    a: 'Due to the intricate mechanical design of self-winding mechanisms, standard automatic watches do not carry machine warranty. However, selected premium automatic models include a 6-Month Machine Warranty as noted on their certificate.'
  },
  {
    q: 'Are sport watches covered against water damage?',
    a: 'Yes! Winsor Sport Series watches include a 1-Year Waterproof Warranty covering water seal integrity under normal use within depth ratings.'
  },
];

export default function WarrantyPage() {
  const [activeTab, setActiveTab] = useState('chain');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [lookupModel, setLookupModel] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === activeTab) || CATEGORIES[0];

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupModel.trim()) return;
    const query = lookupModel.toLowerCase();
    
    if (query.includes('auto') || query.includes('mechanical')) {
      setLookupResult('Automatic Model: Machine warranty generally excluded, but selected premium models carry 6 Months Machine Warranty. 1st Year Free Servicing applies.');
    } else if (query.includes('sport') || query.includes('diver')) {
      setLookupResult('Sport Series: Includes 1-Year Waterproof Warranty & 100% Free Battery/Gasket Servicing under 12 months.');
    } else if (query.includes('bangle') || query.includes('lady') || query.includes('women')) {
      setLookupResult('Ladies Timepiece: 1-Year Machine & Color Warranty on watch head. Accompanying bangles non-warranty unless stamped.');
    } else {
      setLookupResult('Standard Timepiece: Eligible for 1-Year Color & Machine Warranty with 100% FREE Battery Replacements during Year 1.');
    }
  };

  return (
    <div className="bg-[#faf8f5] text-[#1a1209] min-h-screen font-['Jost',sans-serif]">
      {/* ── BRIGHT LUXURY HERO BANNER WITH BESPOKE GUARANTEE IMAGE ── */}
      <section className="relative text-[#1a1209] pt-32 pb-24 px-4 md:px-12 overflow-hidden bg-gradient-to-b from-[#fcfaf5] via-[#faf4e6] to-[#f4ebd0] border-b border-[#8b6914]/15">
        {/* Soft Golden Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8b6914]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#8b6914]/10 border border-[#8b6914]/30 rounded-full text-[#8b6914] text-[11px] tracking-[0.22em] uppercase font-semibold mb-6">
              <ShieldCheckIcon className="w-4 h-4" color="#8b6914" />
              <span>OFFICIAL BRAND GUARANTEE</span>
            </div>

            <h1 className="font-['Cinzel',serif] text-3xl sm:text-5xl md:text-6xl font-medium leading-tight mb-5 tracking-[0.02em] text-[#1a1209]">
              Winsor Warranty & Service Terms
            </h1>

            <p className="font-['Cormorant_Garamond',serif] text-lg sm:text-xl md:text-2xl italic font-normal text-[#1a1209]/80 max-w-2xl leading-relaxed mb-8">
              Dubai-registered horological precision backed by 1-Year International Warranty, 100% Free First-Year Servicing, and Island-Wide Support across Sri Lanka.
            </p>

            {/* Quick Jump Badges */}
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'chain', label: 'Chain Watches (1 Year)' },
                { id: 'battery', label: 'Quartz & Battery (1 Year)' },
                { id: 'automatic', label: 'Automatic (Select 6 Mo)' },
                { id: 'sport', label: 'Sport & Diver (1 Year Water)' },
                { id: 'bangle', label: 'Ladies Bangle Sets' },
                { id: 'servicing', label: 'Free 1-Year Servicing' },
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveTab(b.id);
                    const el = document.getElementById('warranty-details-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 text-xs tracking-wider rounded-full border transition-all duration-200 cursor-pointer ${
                    activeTab === b.id 
                      ? 'bg-[#1a1209] text-white border-[#1a1209] shadow-md font-semibold' 
                      : 'bg-white/80 text-[#1a1209] border-[#8b6914]/25 hover:border-[#8b6914] hover:bg-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Generated Luxury Watch Warranty Showcase Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#8b6914]/30 shadow-2xl bg-white p-2 group">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src="/warranty_hero_bg.jpg"
                  alt="Winsor Luxury Watch Guarantee"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1209]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#d4af37] font-semibold block">DUBAI REGISTERED 2023</span>
                    <span className="font-['Cinzel',serif] text-base font-semibold">Horological Precision</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#8b6914] text-white flex items-center justify-center shadow-lg">
                    <ShieldCheckIcon className="w-5 h-5" color="#fff" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE POLICY HIGHLIGHT CARDS ── */}
      <section className="max-w-6xl mx-auto -mt-10 mb-16 px-4 md:px-6 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: '1 Year Color & Machine',
              subtitle: 'Full protection on chain & quartz timepieces against casing fading or movement issues.',
              icon: <ShieldCheckIcon className="w-7 h-7" color="#8b6914" />,
            },
            {
              title: '100% Free Year 1 Servicing',
              subtitle: 'Free battery replacements, cleaning, and time calibration under 12 months.',
              icon: <ZapIcon className="w-7 h-7" color="#8b6914" />,
            },
            {
              title: '1 Year Waterproof Guarantee',
              subtitle: 'Certified water-resistance seal protection on all Sport Series watches.',
              icon: <WaterIcon className="w-7 h-7" color="#8b6914" />,
            },
            {
              title: 'Islandwide Claims',
              subtitle: 'Claim warranty easily at any authorized Winsor retail partner across Sri Lanka.',
              icon: <StoreIcon className="w-7 h-7" color="#8b6914" />,
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-[#8b6914]/15 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-['Cinzel',serif] text-lg font-semibold text-[#1a1209] mb-2 leading-snug tracking-wide">
                  {card.title}
                </h3>
                <p className="text-xs text-[#1a1209]/65 leading-relaxed font-['Jost',sans-serif]">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DETAILED CATEGORY TAB SECTION ── */}
      <section id="warranty-details-section" className="max-w-6xl mx-auto mb-20 px-4 md:px-6">
        <div className="text-center mb-10">
          <span className="text-[11px] tracking-[0.25em] text-[#8b6914] uppercase font-semibold font-['Jost',sans-serif]">COVERAGE BREAKDOWN</span>
          <h2 className="font-['Cinzel',serif] text-3xl md:text-4xl font-medium mt-2 mb-3 tracking-wide text-[#1a1209]">
            Warranty Scope by Watch Type
          </h2>
          <p className="text-xs md:text-sm text-[#1a1209]/60 max-w-xl mx-auto leading-relaxed font-['Jost',sans-serif]">
            Click on a watch category below to inspect exact warranty coverage, battery policies, and service terms.
          </p>
        </div>

        {/* Category Navigation Tabs — Grid Layout for Desktop & Clean Touch-Swipe for Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {CATEGORIES.map(cat => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#1a1209] text-white border-[#8b6914] shadow-md ring-1 ring-[#8b6914]/50'
                    : 'bg-white text-[#1a1209] border-[#1a1209]/10 hover:border-[#8b6914]/50 hover:bg-[#fcfaf5]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive ? 'bg-[#8b6914]/20 border border-[#8b6914]/40' : 'bg-[#faf5e8] border border-[#8b6914]/15'
                }`}>
                  {cat.iconFn(isActive ? "#d4af37" : "#8b6914")}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-[#1a1209]'}`}>
                    {cat.title}
                  </div>
                  <div className={`text-[10px] font-medium tracking-tight truncate ${isActive ? 'text-[#d4af37]' : 'text-[#8b6914]'}`}>
                    {cat.coverageYears}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Feature Card */}
        <div className="bg-white rounded-2xl border border-[#8b6914]/25 p-6 md:p-10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#1a1209]/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#faf5e8] border border-[#8b6914]/20 flex items-center justify-center flex-shrink-0">
                {selectedCategory.iconFn("#8b6914")}
              </div>
              <div>
                <h3 className="font-['Cinzel',serif] text-2xl md:text-3xl font-semibold text-[#1a1209] tracking-wide">
                  {selectedCategory.title}
                </h3>
                <p className="text-xs md:text-sm text-[#8b6914] font-medium mt-1 font-['Jost',sans-serif]">
                  {selectedCategory.summary}
                </p>
              </div>
            </div>

            <div className="self-start sm:self-auto bg-[#8b6914] text-white px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase font-['Jost',sans-serif]">
              {selectedCategory.badge}
            </div>
          </div>

          {/* Details Bullet List */}
          <div className="mb-8">
            <h4 className="text-[11px] tracking-[0.18em] text-[#1a1209]/50 uppercase font-semibold mb-4 font-['Jost',sans-serif]">
              Included Coverage Terms:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCategory.details.map((detail, idx) => (
                <div key={idx} className="flex gap-3 bg-[#fcfaf5] p-4 rounded-xl border border-[#1a1209]/06">
                  <CheckCircleIcon className="w-5 h-5 text-[#8b6914] flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-[#1a1209] leading-relaxed font-['Jost',sans-serif]">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note Box */}
          {selectedCategory.importantNote && (
            <div className="bg-[#8b6914]/08 border-l-4 border-[#8b6914] p-4 rounded-r-xl">
              <div className="flex items-center gap-2 text-[#8b6914] text-xs font-bold uppercase tracking-wider mb-1 font-['Jost',sans-serif]">
                <AlertCircleIcon className="w-4 h-4" color="#8b6914" />
                <span>Important Clarification</span>
              </div>
              <p className="text-xs md:text-sm text-[#1a1209] leading-relaxed font-['Jost',sans-serif]">
                {selectedCategory.importantNote}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── QUICK WARRANTY COVERAGE LOOKUP WIDGET ── */}
      <section className="bg-[#18130e] text-white py-16 px-4 md:px-6 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[11px] tracking-[0.25em] text-[#d4af37] uppercase font-semibold font-['Jost',sans-serif]">INSTANT SEARCH</span>
          <h2 className="font-['Cinzel',serif] text-3xl md:text-4xl font-medium mt-2 mb-4 tracking-wide text-white">
            Check Warranty Term for Your Watch
          </h2>
          <p className="text-xs md:text-sm text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Type your model number or keywords (e.g., <em>Automatic</em>, <em>Sport</em>, <em>Ladies Bangle</em>) to inspect applicable terms.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupModel}
                onChange={e => setLookupModel(e.target.value)}
                placeholder="e.g. Automatic, Sport Diver, Ladies Set..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#8b6914] transition-all"
              />
              <SearchIcon className="w-5 h-5 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-7 py-3.5 bg-[#8b6914] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-[#a07d1a] transition-colors cursor-pointer"
            >
              Inspect
            </button>
          </form>

          {lookupResult && (
            <div className="bg-[#d4af37]/15 border border-[#d4af37]/30 rounded-xl p-5 text-left animate-in fade-in duration-200">
              <div className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-[#f3eee6] leading-relaxed">
                  {lookupResult}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STEP-BY-STEP WARRANTY CLAIM PROCESS ── */}
      <section className="max-w-6xl mx-auto mb-20 px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="text-[11px] tracking-[0.25em] text-[#8b6914] uppercase font-semibold font-['Jost',sans-serif]">SIMPLE STEPS</span>
          <h2 className="font-['Cinzel',serif] text-3xl md:text-4xl font-medium mt-2 tracking-wide text-[#1a1209]">
            How to Service or Claim Warranty
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Bring Watch & Card',
              desc: 'Visit any authorized Winsor retail partner across Sri Lanka or contact our online support team.',
            },
            {
              step: '02',
              title: 'Horological Inspection',
              desc: 'Our technician inspects movement mechanism, casing seals, battery levels, or strap pins.',
            },
            {
              step: '03',
              title: 'Free Year 1 Service',
              desc: 'Under 1 year, battery replacements, gasket lubrication, and time regulation are done 100% FREE.',
            },
            {
              step: '04',
              title: 'Prompt Collection',
              desc: 'Collect your fully restored timepiece with verified precision and seal test certificate.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-[#1a1209]/08 relative shadow-sm">
              <span className="font-['Cinzel',serif] text-4xl font-bold text-[#8b6914]/25 absolute top-5 right-5">
                {item.step}
              </span>
              <h3 className="font-['Cinzel',serif] text-lg font-semibold text-[#1a1209] mb-2.5 tracking-wide">
                {item.title}
              </h3>
              <p className="text-xs text-[#1a1209]/65 leading-relaxed font-['Jost',sans-serif]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section className="max-w-4xl mx-auto mb-24 px-4 md:px-6">
        <div className="text-center mb-10">
          <span className="text-[11px] tracking-[0.25em] text-[#8b6914] uppercase font-semibold font-['Jost',sans-serif]">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="font-['Cinzel',serif] text-3xl md:text-4xl font-medium mt-2 tracking-wide text-[#1a1209]">
            Warranty Clarifications
          </h2>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#1a1209]/08 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 md:p-6 flex items-center justify-between text-left cursor-pointer text-sm md:text-base font-semibold text-[#1a1209] font-['Jost',sans-serif]"
              >
                <span>{faq.q}</span>
                <span className="text-[#8b6914] text-xl font-light ml-4">{openFaq === idx ? '−' : '+'}</span>
              </button>

              {openFaq === idx && (
                <div className="px-5 md:px-6 pb-6 text-xs md:text-sm text-[#1a1209]/70 leading-relaxed border-t border-[#1a1209]/05 pt-4 font-['Jost',sans-serif]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CALL TO ACTION ── */}
      <section className="bg-[#faf5e8] border-t border-[#8b6914]/20 py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="font-['Cinzel',serif] text-2xl md:text-3xl text-[#1a1209] mb-3 tracking-wide">
            Need Warranty Support or Wholesale Inquiries?
          </h3>
          <p className="text-xs md:text-sm text-[#1a1209]/70 mb-6 leading-relaxed">
            Our customer care & wholesale concierge team is available to assist with warranty claims, repairs, or shop registration.<br />
            <strong>Head Office:</strong> <a href="tel:0770716212" className="underline text-[#8b6914]">077 071 6212</a> / <a href="tel:0778778555" className="underline text-[#8b6914]">077 877 8555</a><br />
            <strong>Email:</strong> <a href="mailto:winsorwatches@gmail.com" className="underline text-[#8b6914]">winsorwatches@gmail.com</a>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/customer-care"
              className="px-7 py-3.5 bg-[#1a1209] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-[#8b6914] transition-colors"
            >
              Contact Customer Care
            </Link>
            <Link
              href="/retailers"
              className="px-7 py-3.5 bg-white text-[#1a1209] border border-[#1a1209]/20 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-[#faf5e8] transition-colors"
            >
              Find a Retailer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
