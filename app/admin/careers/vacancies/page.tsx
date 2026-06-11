'use client';

import { useEffect, useState, FormEvent } from 'react';
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

      toast.success(`Job vacancy for "${title}" posted!`);
      
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

      toast.success('Job vacancy updated!');
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
    if (!confirm(`Are you sure you want to permanently delete vacancy posting "${name}"? This will delete the role listing immediately.`)) {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission="careers_vacancies">
      <div className="space-y-6 font-['Jost'] text-[#1a1209]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
              Job Vacancies
            </h1>
            <p className="text-[#1a1209]/60 mt-1">
              Create, modify, and monitor open employment positions across Winsor Brand showrooms.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#1a1209] hover:bg-[#2a1d10] text-[#faf7f0] text-xs font-semibold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add New Job
          </button>
        </div>

        {/* Vacancies List Table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#1a1209]/10 bg-[#faf7f0]/30">
            <h3 className="font-semibold text-[#1a1209] text-base">Active Postings</h3>
            <p className="text-xs text-[#1a1209]/50 mt-0.5">Summary of roles currently listing on the public careers portal.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Job Title</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Branch Locations</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Perks / Package</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Applicants</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {vacancies.map((job) => (
                  <tr key={job._id} className="hover:bg-[#faf7f0]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#1a1209] text-sm">{job.title}</div>
                      {job.salary && <div className="text-xs text-[#8B6914] font-medium mt-0.5">{job.salary}</div>}
                    </td>
                    
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {job.locations?.map(l => (
                          <span key={l} className="px-1.5 py-0.5 bg-[#1a1209]/5 border border-[#1a1209]/10 rounded text-[10px] uppercase font-medium">
                            {l}
                          </span>
                        ))}
                      </div>
                      {job.locations?.length > 1 && (
                        <div className="text-[10px] text-amber-700 font-medium mt-1">
                          🔄 {job.transportProvided ? 'Transport expenses paid' : 'Rotational branches'}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-[#1a1209]/70 space-y-0.5">
                      <div>🏨 Accommodation: {job.accommodationProvided ? 'Provided' : 'None'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 bg-[#8B6914]/10 text-[#8B6914] text-xs font-bold rounded-full border border-[#8B6914]/20">
                        {job.applicantCount || 0} applied
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        job.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {job.status === 'active' ? 'Active' : 'Closed'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="px-2.5 py-1.5 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/75 hover:bg-[#faf7f0]/80 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVacancy(job._id, job.title)}
                          className="px-2.5 py-1.5 border border-red-200 rounded text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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

          {vacancies.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-[#1a1209]/60 text-base">No job vacancies listed yet</p>
              <p className="text-xs text-[#1a1209]/40 mt-1">Create vacancy postings to hire talent for showrooms.</p>
            </div>
          )}
        </div>

        {/* ── CREATE VACANCY MODAL ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a1209]/45 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            
            <div className="bg-white rounded-xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-[#faf7f0] border-b border-[#1a1209]/10 flex justify-between items-center">
                <h3 className="font-['Cormorant_Garamond'] text-lg font-bold">Post New Job Vacancy</h3>
                <button onClick={() => setModalOpen(false)} className="text-[#1a1209]/40 hover:text-[#1a1209]">✕</button>
              </div>

              <form onSubmit={handleCreateVacancy} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. Sales Associate"
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Starting Salary (Optional)</label>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. LKR 65,000 / Month"
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">
                    Locations (separate multiple options with commas)
                  </label>
                  <input
                    type="text"
                    value={locationsInput}
                    onChange={(e) => setLocationsInput(e.target.value)}
                    required
                    placeholder="e.g. Colombo, Kandy, Galle"
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                  />
                  <span className="text-[10px] text-[#1a1209]/45 mt-1 block">Specify one or more branch locations. Separation allows filtering.</span>
                </div>

                {/* Multiple locations condition toggles */}
                <div className="bg-[#faf7f0]/40 border border-[#1a1209]/10 rounded-xl p-4">
                  <label className="flex items-center gap-2.5 text-xs text-[#1a1209] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transportProvided}
                      onChange={(e) => setTransportProvided(e.target.checked)}
                      className="rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                    />
                    <div>
                      <span className="font-semibold block">Transport Expenses Covered</span>
                      <span className="text-[#1a1209]/50 block text-[10px] mt-0.5">
                        Applies if rotated across multiple showroom branches. Company reimburses expenses.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Accommodation facility toggles */}
                <div className="bg-[#faf7f0]/40 border border-[#1a1209]/10 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-[#1a1209] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accommodationProvided}
                      onChange={(e) => setAccommodationProvided(e.target.checked)}
                      className="rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                    />
                    <div>
                      <span className="font-semibold block">Company Accommodation Provided</span>
                      <span className="text-[#1a1209]/50 block text-[10px] mt-0.5">
                        Indicate if accommodation facilities are offered by the company.
                      </span>
                    </div>
                  </label>

                  {accommodationProvided && (
                    <div className="animate-fadeIn pl-6">
                      <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">Accommodation Details</label>
                      <input
                        type="text"
                        required
                        value={accommodationDetails}
                        onChange={(e) => setAccommodationDetails(e.target.value)}
                        placeholder="e.g. Shared lodging near Colombo showroom"
                        className="w-full px-4 py-2 bg-white border border-[#1a1209]/15 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Job Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={5}
                    placeholder="Enter full job specifications, roles, and required qualifications..."
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm focus:outline-none focus:border-[#8B6914] focus:ring-1 focus:ring-[#8B6914] transition"
                  />
                </div>

                <div className="border-t border-[#1a1209]/10 pt-4 bg-white flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/70 hover:text-[#1a1209]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#1a1209] text-white text-xs font-semibold rounded hover:bg-[#2a1d10] disabled:opacity-50 shadow"
                  >
                    {submitting ? 'Posting Vacancy…' : 'Publish Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── EDIT VACANCY MODAL ── */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a1209]/45 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
            
            <div className="bg-white rounded-xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-[#faf7f0] border-b border-[#1a1209]/10 flex justify-between items-center">
                <h3 className="font-['Cormorant_Garamond'] text-lg font-bold">Edit Job Vacancy</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-[#1a1209]/40 hover:text-[#1a1209]">✕</button>
              </div>

              <form onSubmit={handleEditVacancy} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Starting Salary</label>
                    <input
                      type="text"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Locations (comma separated)</label>
                  <input
                    type="text"
                    value={editLocationsInput}
                    onChange={(e) => setEditLocationsInput(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#1a1209]/5 pt-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Rotational Transport</label>
                    <label className="flex items-center gap-2 text-xs mt-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTransportProvided}
                        onChange={(e) => setEditTransportProvided(e.target.checked)}
                        className="rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                      />
                      Expenses Paid
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Listing Status</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="editStatus"
                          checked={editStatus === 'active'}
                          onChange={() => setEditStatus('active')}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Active (Open)
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="editStatus"
                          checked={editStatus === 'closed'}
                          onChange={() => setEditStatus('closed')}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Closed (Filled)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-[#faf7f0]/40 border border-[#1a1209]/10 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-[#1a1209] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAccommodationProvided}
                      onChange={(e) => setEditAccommodationProvided(e.target.checked)}
                      className="rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                    />
                    <span className="font-semibold">Company Accommodation Provided</span>
                  </label>

                  {editAccommodationProvided && (
                    <div className="animate-fadeIn pl-6">
                      <label className="block text-[10px] font-semibold tracking-wider uppercase text-[#1a1209]/60 mb-1.5">Accommodation Details</label>
                      <input
                        type="text"
                        required
                        value={editAccommodationDetails}
                        onChange={(e) => setEditAccommodationDetails(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#1a1209]/15 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Job Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm focus:outline-none focus:border-[#8B6914] focus:ring-1 focus:ring-[#8B6914] transition"
                  />
                </div>

                <div className="border-t border-[#1a1209]/10 pt-4 bg-white flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/70 hover:text-[#1a1209]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#1a1209] text-white text-xs font-semibold rounded hover:bg-[#2a1d10] disabled:opacity-50 shadow"
                  >
                    {submitting ? 'Updating Position…' : 'Save Position'}
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
