'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar/Navbar';

interface Vacancy {
  _id: string;
  title: string;
  description: string;
  salary?: string;
  locations: string[];
  transportProvided: boolean;
  accommodationProvided: boolean;
  accommodationDetails?: string;
  status: 'active' | 'closed';
  applicantCount: number;
}

export default function CareersPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/careers');
        if (!res.ok) throw new Error('Failed to fetch positions');
        const data = await res.json();
        if (data.success) {
          setVacancies(data.data || []);
          setLocations(data.locations || []);
        }
      } catch (err) {
        console.error('Careers load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Client-side filtering logic
  const filteredVacancies = useMemo(() => {
    return vacancies.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = 
        !selectedLocation || 
        job.locations.some(l => l.trim().toLowerCase() === selectedLocation.trim().toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [vacancies, searchQuery, selectedLocation]);

  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1a1209] flex flex-col" style={{ fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
      `}</style>
      <Navbar />

      {/* Hero Header */}
      <section className="careers-hero-banner relative w-full pt-32 lg:pt-40 pb-24 lg:pb-32 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] via-[#1a140d] to-[#0a0a0a] text-white">
        <Image
          src="/discover-service.jpg"
          alt="Careers at Winsor Atelier"
          fill
          priority
          className="object-cover opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#faf7f0] z-0" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl space-y-4">
          <span className="text-[10px] lg:text-[11px] font-semibold tracking-[0.35em] text-[#8B6914] uppercase block animate-fadeIn" style={{ fontFamily: "'Jost', sans-serif" }}>
            JOIN THE MAISON
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white font-light tracking-wide leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Careers at Winsor Atelier
          </h1>
          <p className="text-white/80 text-sm lg:text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Crafting the future of haute horlogerie. Explore opportunities within our design, operations, and client relations sectors.
          </p>
        </div>
      </section>

      {/* Filter Toolbar & Key Stats */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 -mt-12 relative z-20 space-y-8">
        
        {/* Search & Location Toolbar */}
        <div className="bg-white/95 backdrop-blur-md border border-[#1a1209]/10 rounded-2xl p-5 lg:p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Live Search */}
          <div className="relative w-full md:w-1/2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6914]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search positions (e.g. Sales Associate, Watchmaker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontFamily: "'Jost', sans-serif" }}
              className="w-full pl-11 pr-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/12 rounded-xl text-sm placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-1 focus:ring-[#8B6914] transition-all text-[#1a1209]"
            />
          </div>

          {/* Location Filter */}
          <div className="relative w-full md:w-1/3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{ fontFamily: "'Jost', sans-serif" }}
              className="w-full px-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/12 rounded-xl text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] transition-all appearance-none cursor-pointer pr-10"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>

          {/* Reset button */}
          {(searchQuery || selectedLocation) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('');
              }}
              style={{ fontFamily: "'Jost', sans-serif" }}
              className="text-xs text-[#8B6914] font-semibold hover:text-[#1a1209] transition-colors whitespace-nowrap px-2"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* 🌟 STATS COUNTER BANNER (100+ Team Members, 50+ Locations, etc.) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-6 text-center shadow-sm hover:border-[#8B6914]/40 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#8B6914] leading-none mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>100+</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#1a1209]/70 uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>Team Members</div>
            <div className="text-[10px] text-[#1a1209]/45 mt-1" style={{ fontFamily: "'Jost', sans-serif" }}>Global Artisans & Professionals</div>
          </div>

          <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-6 text-center shadow-sm hover:border-[#8B6914]/40 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#8B6914] leading-none mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>50+</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#1a1209]/70 uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>Locations</div>
            <div className="text-[10px] text-[#1a1209]/45 mt-1" style={{ fontFamily: "'Jost', sans-serif" }}>Boutiques & Regional Hubs</div>
          </div>

          <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-6 text-center shadow-sm hover:border-[#8B6914]/40 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#8B6914] leading-none mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>100%</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#1a1209]/70 uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>Precision Movement</div>
            <div className="text-[10px] text-[#1a1209]/45 mt-1" style={{ fontFamily: "'Jost', sans-serif" }}>Japanese Precision Engineering</div>
          </div>

          <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-6 text-center shadow-sm hover:border-[#8B6914]/40 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#8B6914] leading-none mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>15+</div>
            <div className="text-[11px] font-semibold tracking-wider text-[#1a1209]/70 uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>Years Excellence</div>
            <div className="text-[10px] text-[#1a1209]/45 mt-1" style={{ fontFamily: "'Jost', sans-serif" }}>In Luxury Watchmaking</div>
          </div>
        </div>

      </section>

      {/* Main Openings List */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 flex-1">
        <div className="flex items-center justify-between border-b border-[#1a1209]/10 pb-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Current Open Positions
            </h2>
            <p className="text-xs text-[#1a1209]/50 mt-1" style={{ fontFamily: "'Jost', sans-serif" }}>Explore career opportunities and apply online.</p>
          </div>
          <span className="text-xs text-[#8B6914] font-semibold uppercase tracking-wider bg-[#8B6914]/10 px-3 py-1.5 rounded-full" style={{ fontFamily: "'Jost', sans-serif" }}>
            {filteredVacancies.length} Position{filteredVacancies.length !== 1 ? 's' : ''} Open
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B6914]"></div>
            <p className="text-xs text-[#1a1209]/60 tracking-widest uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>Loading Openings…</p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#1a1209]/10 rounded-2xl shadow-sm p-8">
            <svg className="w-12 h-12 text-[#8B6914]/40 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <h3 className="text-2xl font-semibold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No Current Openings</h3>
            <p className="text-sm text-[#1a1209]/50 max-w-sm mx-auto mt-2 leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
              We don't have any active openings matching your search criteria. Please check back later or contact our HR team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVacancies.map((job) => {
              const hasMultipleLocations = job.locations?.length > 1;
              return (
                <div 
                  key={job._id}
                  className="bg-white border border-[#1a1209]/10 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#8B6914]/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Locations & Rotate badge */}
                    <div className="flex flex-wrap gap-2 items-start justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {job.locations.map((loc) => (
                          <span 
                            key={loc} 
                            style={{ fontFamily: "'Jost', sans-serif" }}
                            className="inline-flex items-center px-2.5 py-1 bg-[#fbf9f4] border border-[#1a1209]/10 rounded-md text-[10px] font-semibold text-[#1a1209]/75 uppercase tracking-wider"
                          >
                            <svg className="w-3 h-3 text-[#8B6914] mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {loc}
                          </span>
                        ))}
                      </div>
                      
                      {hasMultipleLocations && job.transportProvided && (
                        <span style={{ fontFamily: "'Jost', sans-serif" }} className="inline-flex items-center px-2 py-0.5 bg-[#8B6914]/10 border border-[#8B6914]/20 rounded text-[9px] font-semibold text-[#8B6914] uppercase tracking-wider">
                          <svg className="w-2.5 h-2.5 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                          Transport Paid
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-[#1a1209] leading-snug" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {job.title}
                      </h3>
                      {job.salary && (
                        <p className="text-xs text-[#8B6914] font-semibold tracking-wide mt-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>
                          Starting Salary: {job.salary}
                        </p>
                      )}
                    </div>

                    {/* Accommodation indicators */}
                    <div className="flex gap-4 text-xs text-[#1a1209]/60 border-t border-[#1a1209]/6 pt-3" style={{ fontFamily: "'Jost', sans-serif" }}>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#8B6914] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
                        <span>
                          {job.accommodationProvided ? 'Accommodation provided' : 'No accommodation'}
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#1a1209]/75 line-clamp-3 leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                      {job.description.replace(/<[^>]*>/g, '')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-[#1a1209]/6 flex items-center justify-between">
                    {hasMultipleLocations && (
                      <span className="text-[10px] text-[#1a1209]/45 italic max-w-[150px] leading-tight" style={{ fontFamily: "'Jost', sans-serif" }}>
                        *Subject to rotated deployment across branches.
                      </span>
                    )}
                    
                    <Link
                      href={`/careers/${job._id}`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                      className="ml-auto px-4 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-white text-[11px] font-semibold uppercase tracking-widest rounded-lg transition-colors shadow-sm"
                    >
                      View & Apply
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 🏛️ WHY WINSOR? SECTION */}
      <section className="bg-white border-t border-b border-[#1a1209]/8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-semibold tracking-[0.3em] text-[#8B6914] uppercase block" style={{ fontFamily: "'Jost', sans-serif" }}>
              OUR CULTURE & VALUES
            </span>
            <h2 className="text-3xl lg:text-4xl font-light text-[#1a1209] tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Why Choose Winsor Atelier?
            </h2>
            <div className="w-12 h-0.5 bg-[#8B6914] mx-auto mt-2" />
            <p className="text-xs sm:text-sm text-[#1a1209]/60 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
              At Winsor, we empower our team of 100+ members with an environment dedicated to horological mastery, professional growth, and international prestige.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Value 1 */}
            <div className="p-6 bg-[#faf7f0]/60 border border-[#1a1209]/8 rounded-2xl space-y-3 hover:border-[#8B6914]/40 transition-all">
              <div className="w-10 h-10 bg-[#8B6914]/10 rounded-xl flex items-center justify-center text-[#8B6914]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Horological Precision
              </h3>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Work alongside master horologists with Japanese precision movements and refined artisan watchmaking heritage.
              </p>
            </div>

            {/* Value 2 */}
            <div className="p-6 bg-[#faf7f0]/60 border border-[#1a1209]/8 rounded-2xl space-y-3 hover:border-[#8B6914]/40 transition-all">
              <div className="w-10 h-10 bg-[#8B6914]/10 rounded-xl flex items-center justify-center text-[#8B6914]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Global Presence
              </h3>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Experience deployment across 50+ luxury boutique locations, with full rotational travel support and housing perks.
              </p>
            </div>

            {/* Value 3 */}
            <div className="p-6 bg-[#faf7f0]/60 border border-[#1a1209]/8 rounded-2xl space-y-3 hover:border-[#8B6914]/40 transition-all">
              <div className="w-10 h-10 bg-[#8B6914]/10 rounded-xl flex items-center justify-center text-[#8B6914]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Continuous Advancement
              </h3>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Structured certification programs, technical development, and clear leadership pathways for driven professionals.
              </p>
            </div>

            {/* Value 4 */}
            <div className="p-6 bg-[#faf7f0]/60 border border-[#1a1209]/8 rounded-2xl space-y-3 hover:border-[#8B6914]/40 transition-all">
              <div className="w-10 h-10 bg-[#8B6914]/10 rounded-xl flex items-center justify-center text-[#8B6914]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a1209]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Artisan Family Culture
              </h3>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Join a collaborative, supportive workplace where craft dedication and team wellbeing are deeply valued.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 🏆 AWARDS & RECOGNITION SECTION */}
      <section className="py-16 lg:py-24 bg-[#faf7f0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-semibold tracking-[0.3em] text-[#8B6914] uppercase block" style={{ fontFamily: "'Jost', sans-serif" }}>
              HONORS & DISTINCTIONS
            </span>
            <h2 className="text-3xl lg:text-4xl font-light text-[#1a1209] tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Awards & Recognition
            </h2>
            <div className="w-12 h-0.5 bg-[#8B6914] mx-auto mt-2" />
            <p className="text-xs sm:text-sm text-[#1a1209]/60 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
              Recognized globally for luxury craftsmanship, client satisfaction, and workplace excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Award 1 */}
            <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8B6914]/10 rounded-2xl flex items-center justify-center text-[#8B6914] border border-[#8B6914]/20 flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#8B6914] uppercase block" style={{ fontFamily: "'Jost', sans-serif" }}>2025 Laureate</span>
                  <h3 className="text-lg font-bold text-[#1a1209] leading-snug" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Excellence in Horology
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Awarded for outstanding precision movement assembly and high-grade Japanese watchmaking craftsmanship.
              </p>
            </div>

            {/* Award 2 */}
            <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8B6914]/10 rounded-2xl flex items-center justify-center text-[#8B6914] border border-[#8B6914]/20 flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#8B6914] uppercase block" style={{ fontFamily: "'Jost', sans-serif" }}>Global Recognition</span>
                  <h3 className="text-lg font-bold text-[#1a1209] leading-snug" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Luxury Boutique Retailer
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Honored for exceptional client concierge standards across our expanding network of 50+ locations.
              </p>
            </div>

            {/* Award 3 */}
            <div className="bg-white border border-[#1a1209]/8 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8B6914]/10 rounded-2xl flex items-center justify-center text-[#8B6914] border border-[#8B6914]/20 flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#8B6914] uppercase block" style={{ fontFamily: "'Jost', sans-serif" }}>Employer Distinction</span>
                  <h3 className="text-lg font-bold text-[#1a1209] leading-snug" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Premier Employer Workplace
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#1a1209]/65 font-light leading-relaxed" style={{ fontFamily: "'Jost', sans-serif" }}>
                Recognized for employee wellbeing, rotational branch support, housing facilities, and team growth.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
