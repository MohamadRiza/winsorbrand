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
    <div className="min-h-screen bg-[#faf7f0] text-[#1a1209] font-['Jost'] flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative w-full h-[320px] lg:h-[400px] flex items-center justify-center overflow-hidden bg-black mt-[72px] lg:mt-[86px]">
        <Image
          src="/discover-service.jpg"
          alt="Careers at Winsor Atelier"
          fill
          priority
          className="object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#faf7f0] z-0" />
        
        <div className="relative z-10 text-center px-6 max-w-3xl space-y-4">
          <span className="text-[11px] font-semibold tracking-[0.35em] text-[#c9a14a] uppercase block animate-fadeIn">
            Join the Maison
          </span>
          <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-6xl text-white font-medium tracking-wide leading-tight">
            Careers at Winsor Brand
          </h1>
          <p className="text-white/80 text-sm lg:text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed">
            Crafting the future of haute horlogerie. Explore opportunities within our design, operations, and client relations sectors.
          </p>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 -mt-10 relative z-20">
        <div className="bg-white border border-[#1a1209]/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Live Search */}
          <div className="relative w-full md:w-1/2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search positions (e.g. Sales Associate, Watchmaker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-1 focus:ring-[#8B6914] transition-all"
            />
          </div>

          {/* Location Filter */}
          <div className="relative w-full md:w-1/3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] transition-all appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
          </div>

          {/* Reset button */}
          {(searchQuery || selectedLocation) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('');
              }}
              className="text-xs text-[#8B6914] font-semibold hover:text-[#1a1209] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Catalog List */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
            <p className="text-xs text-[#1a1209]/60 tracking-widest uppercase">Loading Openings…</p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#1a1209]/10 rounded-2xl shadow-sm p-8">
            <span className="text-4xl block mb-4">⌚</span>
            <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold">No Current Openings</h3>
            <p className="text-sm text-[#1a1209]/50 max-w-sm mx-auto mt-2 leading-relaxed">
              We don't have any active openings matching your search criteria. Please check back later or submit an inquiry to our support team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVacancies.map((job) => {
              const hasMultipleLocations = job.locations?.length > 1;
              return (
                <div 
                  key={job._id}
                  className="bg-white border border-[#1a1209]/10 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Locations & Rotate badge */}
                    <div className="flex flex-wrap gap-2 items-start justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {job.locations.map((loc) => (
                          <span 
                            key={loc} 
                            className="inline-flex px-2 py-0.5 bg-[#fbf9f4] border border-[#1a1209]/10 rounded text-[10px] font-semibold text-[#1a1209]/70 uppercase tracking-wide"
                          >
                            📍 {loc}
                          </span>
                        ))}
                      </div>
                      
                      {hasMultipleLocations && job.transportProvided && (
                        <span className="inline-flex px-2 py-0.5 bg-[#8B6914]/10 border border-[#8B6914]/20 rounded text-[9px] font-semibold text-[#8B6914] uppercase tracking-wide">
                          🔄 Transport Paid
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <div>
                      <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209] leading-snug">
                        {job.title}
                      </h3>
                      {job.salary && (
                        <p className="text-xs text-[#8B6914] font-medium tracking-wide mt-1">
                          Starting Salary: {job.salary}
                        </p>
                      )}
                    </div>

                    {/* Accommodation indicators */}
                    <div className="flex gap-4 text-xs text-[#1a1209]/60 border-t border-[#1a1209]/5 pt-3">
                      <div className="flex items-center gap-1">
                        <span>🏨</span>
                        <span>
                          {job.accommodationProvided ? 'Accommodation provided' : 'No accommodation'}
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#1a1209]/75 line-clamp-3 leading-relaxed">
                      {job.description.replace(/<[^>]*>/g, '')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-[#1a1209]/5 flex items-center justify-between">
                    {hasMultipleLocations && (
                      <span className="text-[10px] text-[#1a1209]/45 italic max-w-[150px] leading-tight">
                        *Subject to rotated deployment across branches.
                      </span>
                    )}
                    
                    <Link
                      href={`/careers/${job._id}`}
                      className="ml-auto px-4 py-2 bg-[#1a1209] hover:bg-[#8B6914] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
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

      {/* Footer Branding */}
      <footer className="bg-[#1a1209] text-white/50 text-center py-10 mt-auto border-t border-[#c9a14a]/20">
        <p className="text-xs tracking-widest uppercase text-[#c9a14a] font-medium">Winsor Horology Group</p>
        <p className="text-[10px] mt-2 font-light">© 2026 Winsor Brand. Equal Opportunity Employer.</p>
      </footer>
    </div>
  );
}
