'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

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

export default function AdminVacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form States (Create)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [locationsInput, setLocationsInput] = useState('');
  const [transportProvided, setTransportProvided] = useState(true);
  const [accommodationProvided, setAccommodationProvided] = useState(false);
  const [accommodationDetails, setAccommodationDetails] = useState('');

  // Form States (Edit)
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editLocationsInput, setEditLocationsInput] = useState('');
  const [editTransportProvided, setEditTransportProvided] = useState(true);
  const [editAccommodationProvided, setEditAccommodationProvided] = useState(false);
  const [editAccommodationDetails, setEditAccommodationDetails] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await fetch('/api/admin/careers/vacancies', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load vacancies');
      const data = await res.json();
      if (data.success) {
        setVacancies(data.data || []);
      }
    } catch (err) {
      console.error('Vacancies loading error:', err);
      toast.error('Failed to load job vacancies');
    } finally {
      setLoading(false);
    }
  };

  // Aggregates
  const totalVacancies = vacancies.length;
  const activeVacancies = vacancies.filter(v => v.status === 'active').length;
  const closedVacancies = totalVacancies - activeVacancies;
  const totalApplicantsCount = useMemo(() => {
    return vacancies.reduce((sum, v) => sum + (v.applicantCount || 0), 0);
  }, [vacancies]);

  // Filtered List
  const filteredVacancies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vacancies;
    return vacancies.filter(v => 
      v.title.toLowerCase().includes(q) ||
      (v.salary || '').toLowerCase().includes(q) ||
      v.locations.some(l => l.toLowerCase().includes(q))
    );
  }, [vacancies, searchQuery]);

  const handleCreateVacancy = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const locationsArray = locationsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l !== '');

    if (locationsArray.length === 0) {
      toast.error('Please specify at least one location.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/careers/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          salary: salary || undefined,
          locations: locationsArray,
          transportProvided,
          accommodationProvided,
          accommodationDetails: accommodationProvided ? accommodationDetails : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create vacancy');

      toast.success(`Job vacancy for "${title}" published!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSalary('');
      setLocationsInput('');
      setTransportProvided(true);
      setAccommodationProvided(false);
      setAccommodationDetails('');
      setModalOpen(false);

      fetchVacancies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (job: Vacancy) => {
    setEditId(job._id);
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditSalary(job.salary || '');
    setEditLocationsInput(job.locations ? job.locations.join(', ') : '');
    setEditTransportProvided(job.transportProvided);
    setEditAccommodationProvided(job.accommodationProvided);
    setEditAccommodationDetails(job.accommodationDetails || '');
    setEditStatus(job.status);
    setEditModalOpen(true);
  };

  const handleEditVacancy = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);

    const locationsArray = editLocationsInput
      .split(',')
      .map(l => l.trim())
      .filter(l => l !== '');

    if (locationsArray.length === 0) {
      toast.error('Please specify at least one location.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/careers/vacancies/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          salary: editSalary || undefined,
          locations: locationsArray,
          transportProvided: editTransportProvided,
          accommodationProvided: editAccommodationProvided,
          accommodationDetails: editAccommodationProvided ? editAccommodationDetails : undefined,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vacancy');

      toast.success('Job vacancy updated successfully!');
      setEditModalOpen(false);
      setEditId(null);
      fetchVacancies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVacancy = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete vacancy posting "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/careers/vacancies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete vacancy');

      toast.success(`Vacancy "${name}" deleted.`);
      fetchVacancies();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Loading Showroom Vacancies…
        </p>
      </div>
    );
  }

  return (
    <PermissionGate permission="careers_vacancies">
      <div className="space-y-6 font-['Jost'] text-[#1a1209] select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/15 pb-5">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              CAREER VACANCIES
            </h1>
            <p className="text-[#1a1209]/60 text-sm mt-0.5">
              Create, modify, and monitor open employment positions across Winsor Maison showrooms.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-semibold tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8B6914] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Vacancy
          </button>
        </div>

        {/* Professional Tabular Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL VACANCIES</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalVacancies.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">ACTIVE POSITIONS</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{activeVacancies.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">CLOSED POSITIONS</p>
            <p className="font-['Jost'] text-3xl font-bold text-gray-500 mt-1 tabular-nums font-mono">{closedVacancies.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL APPLICANTS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#8B6914] mt-1 tabular-nums font-mono">{totalApplicantsCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
          <div className="relative max-w-md">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by job title, salary package, or showroom location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
            />
          </div>
        </div>

        {/* Vacancies List Table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1209] text-[#f3e3b8]">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">JOB TITLE & PACKAGE</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">SHOWROOM LOCATIONS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">MOBILITY & PERKS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">APPLICANTS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">STATUS</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-semibold tracking-[0.15em] uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredVacancies.map((job) => (
                  <tr key={job._id} className="hover:bg-[#faf7f0]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-[#1a1209]">{job.title}</div>
                      {job.salary ? (
                        <div className="text-xs text-[#8B6914] font-mono font-semibold mt-0.5">{job.salary}</div>
                      ) : (
                        <div className="text-xs text-[#1a1209]/40 font-mono mt-0.5">Negotiable Package</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {job.locations?.map(l => (
                          <span key={l} className="px-2 py-0.5 bg-[#faf7f0] border border-[#8B6914]/25 rounded text-[10px] font-bold text-[#8B6914] uppercase tracking-wider">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* ✅ REPLACED EMOJIS WITH CLEAN VECTOR ICONS */}
                    <td className="px-6 py-4 text-xs text-[#1a1209]/80 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Acc: <strong>{job.accommodationProvided ? (job.accommodationDetails || 'Provided') : 'None'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#1a1209]/60">
                        <svg className="w-3.5 h-3.5 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Transport: <strong>{job.transportProvided ? 'Reimbursed' : 'Standard'}</strong></span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <span className="inline-flex px-3 py-1 bg-[#faf7f0] border border-[#8B6914]/30 text-[#8B6914] text-xs font-bold rounded-full">
                        {job.applicantCount || 0} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        job.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {job.status === 'active' ? 'Active' : 'Closed'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="px-3 py-1.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVacancy(job._id, job.title)}
                          className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVacancies.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-[#1a1209]/60 text-base font-semibold">No job vacancies listed</p>
              <p className="text-xs text-[#1a1209]/40 mt-1">Create vacancy postings to hire talent for showrooms.</p>
            </div>
          )}
        </div>

        {/* ── OVERHAULED CREATE VACANCY MODAL (LUXURY WINSOR MAISON UI/UX) ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setModalOpen(false)} 
            />
            
            {/* Modal Dialog */}
            <div className="bg-[#faf7f0] rounded-2xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex justify-between items-center">
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                    POST NEW JOB VACANCY
                  </h3>
                  <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Publish a new position on the Winsor Maison careers portal</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateVacancy} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* 1. Job Role & Package */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">1. ROLE CREDENTIALS & SALARY</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">JOB TITLE</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g. Senior Showroom Executive"
                        className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">STARTING SALARY (OPTIONAL)</label>
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="e.g. LKR 85,000 / Month"
                        className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Locations & Transport */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">2. SHOWROOM LOCATIONS & MOBILITY</h4>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">
                      SHOWROOM LOCATIONS (COMMA SEPARATED)
                    </label>
                    <input
                      type="text"
                      value={locationsInput}
                      onChange={(e) => setLocationsInput(e.target.value)}
                      required
                      placeholder="e.g. Colombo Showroom, Kandy Branch, Galle Fort"
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1a1209]/5">
                    <label className="flex items-start gap-3 text-xs text-[#1a1209] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transportProvided}
                        onChange={(e) => setTransportProvided(e.target.checked)}
                        className="mt-0.5 rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold block">Rotational Transport Expenses Reimbursed</span>
                        <span className="text-[#1a1209]/50 block text-[10px] mt-0.5">
                          Applies if candidate rotates across multiple branch locations. Travel expenses covered by company.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Company Accommodation */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">3. ACCOMMODATION FACILITIES</h4>

                  <label className="flex items-start gap-3 text-xs text-[#1a1209] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accommodationProvided}
                      onChange={(e) => setAccommodationProvided(e.target.checked)}
                      className="mt-0.5 rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold block">Company Accommodation Provided</span>
                      <span className="text-[#1a1209]/50 block text-[10px] mt-0.5">
                        Indicate if accommodation facilities are offered by Winsor Maison.
                      </span>
                    </div>
                  </label>

                  {accommodationProvided && (
                    <div className="pt-2 pl-7">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-1.5">ACCOMMODATION DETAILS</label>
                      <input
                        type="text"
                        required
                        value={accommodationDetails}
                        onChange={(e) => setAccommodationDetails(e.target.value)}
                        placeholder="e.g. Premium shared lodging 5 minutes from Colombo showroom"
                        className="w-full px-4 py-2 bg-[#fbf9f4] border border-[#8B6914]/30 rounded-lg text-xs font-semibold text-[#1a1209]"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Full Job Specifications */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-2 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">4. JOB DESCRIPTION & QUALIFICATIONS</h4>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={5}
                    placeholder="Enter comprehensive role overview, responsibilities, required experience, and key qualifications..."
                    className="w-full px-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-xs leading-relaxed text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                  />
                </div>

                {/* Sticky Action Footer */}
                <div className="pt-4 border-t border-[#1a1209]/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 border border-[#1a1209]/20 text-[#1a1209] text-xs font-semibold rounded-xl hover:bg-[#1a1209]/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Publishing Position…' : 'Publish Job Listing'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ── OVERHAULED EDIT VACANCY MODAL (LUXURY WINSOR MAISON UI/UX) ── */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setEditModalOpen(false)} 
            />
            
            {/* Modal Dialog */}
            <div className="bg-[#faf7f0] rounded-2xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex justify-between items-center">
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                    EDIT JOB VACANCY
                  </h3>
                  <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Modify role specifications and status</p>
                </div>
                <button 
                  onClick={() => setEditModalOpen(false)} 
                  className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditVacancy} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Status Toggle & Credentials */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#1a1209]/5 pb-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">POSITION STATUS</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStatus('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editStatus === 'active' 
                            ? 'bg-emerald-700 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        ✓ Active (Open)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditStatus('closed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editStatus === 'closed' 
                            ? 'bg-rose-700 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Closed (Filled)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">JOB TITLE</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">STARTING SALARY</label>
                      <input
                        type="text"
                        value={editSalary}
                        onChange={(e) => setEditSalary(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                      />
                    </div>
                  </div>
                </div>

                {/* Locations & Mobility */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">LOCATIONS & MOBILITY</h4>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">SHOWROOM LOCATIONS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={editLocationsInput}
                      onChange={(e) => setEditLocationsInput(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209]"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1a1209]/5">
                    <label className="flex items-center gap-3 text-xs text-[#1a1209] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTransportProvided}
                        onChange={(e) => setEditTransportProvided(e.target.checked)}
                        className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                      />
                      <span className="font-bold">Rotational Transport Expenses Reimbursed</span>
                    </label>
                  </div>
                </div>

                {/* Accommodation */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">ACCOMMODATION FACILITIES</h4>

                  <label className="flex items-center gap-3 text-xs text-[#1a1209] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAccommodationProvided}
                      onChange={(e) => setEditAccommodationProvided(e.target.checked)}
                      className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                    />
                    <span className="font-bold">Company Accommodation Provided</span>
                  </label>

                  {editAccommodationProvided && (
                    <div className="pt-2 pl-7">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-1.5">ACCOMMODATION DETAILS</label>
                      <input
                        type="text"
                        required
                        value={editAccommodationDetails}
                        onChange={(e) => setEditAccommodationDetails(e.target.value)}
                        className="w-full px-4 py-2 bg-[#fbf9f4] border border-[#8B6914]/30 rounded-lg text-xs font-semibold text-[#1a1209]"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-2 shadow-sm">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">JOB DESCRIPTION</h4>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-xs leading-relaxed text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>

                {/* Sticky Action Footer */}
                <div className="pt-4 border-t border-[#1a1209]/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-2.5 border border-[#1a1209]/20 text-[#1a1209] text-xs font-semibold rounded-xl hover:bg-[#1a1209]/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Updating Position…' : 'Save Position Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </PermissionGate>
  );
}
