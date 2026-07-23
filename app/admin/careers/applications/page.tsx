'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

interface Application {
  _id: string;
  vacancyId?: {
    _id: string;
    title: string;
  };
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  dob: string;
  age: number;
  gender: 'male' | 'female' | 'prefer_not_say';
  address: string;
  hasExperience: boolean;
  experienceYears?: number;
  referred: boolean;
  refereeName?: string;
  refereeEmail?: string;
  refereeMobile?: string;
  email: string;
  mobile: string;
  resumeUrl: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'offered' | 'rejected';
  createdAt: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/careers/applications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load applications');
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
      }
    } catch (err) {
      console.error('Applications loading error:', err);
      toast.error('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 0ms INSTANT OPTIMISTIC STATUS UPDATE
  const handleUpdateStatus = async (id: string, newStatus: Application['status']) => {
    const targetApp = applications.find(a => a._id === id);
    if (!targetApp || targetApp.status === newStatus) return;

    const previousStatus = targetApp.status;

    // 1. Optimistic local state update (0ms UI response)
    setApplications(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    if (selectedApp?._id === id) {
      setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/careers/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      toast.success(`Candidate status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update status. Reverting changes.');
      
      // Rollback on failure
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status: previousStatus } : a));
      if (selectedApp?._id === id) {
        setSelectedApp(prev => prev ? { ...prev, status: previousStatus } : null);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteApplication = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete application from "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/careers/applications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete application');

      toast.success(`Application from "${name}" deleted.`);
      setApplications(prev => prev.filter(a => a._id !== id));
      if (selectedApp?._id === id) {
        setSelectedApp(null);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ PROPER PDF RESUME DOWNLOAD HELPER
  const downloadResumePDF = async (url: string, candidateName: string) => {
    if (!url) {
      toast.error('Resume URL not available');
      return;
    }
    const toastId = toast.loading('Downloading Resume PDF...');
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${cleanName}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.dismiss(toastId);
      toast.success('Resume PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      // Fallback open in new tab
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // Client-side filtering logic
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const candidateName = `${app.firstName} ${app.lastName}`.toLowerCase();
      const matchesSearch = 
        candidateName.includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.vacancyId?.title || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'offered':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Offered', dot: 'bg-emerald-500' };
      case 'rejected':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected', dot: 'bg-rose-500' };
      case 'interview_scheduled':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Interview Scheduled', dot: 'bg-blue-500' };
      case 'under_review':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300', label: 'Under Review', dot: 'bg-amber-500' };
      case 'pending':
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Pending', dot: 'bg-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Retrieving Candidate Submissions…
        </p>
      </div>
    );
  }

  return (
    <PermissionGate permission="careers_applications">
      <div className="space-y-6 font-['Jost'] text-[#1a1209] select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/15 pb-5">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              CAREER APPLICATIONS
            </h1>
            <p className="text-[#1a1209]/60 text-sm mt-0.5">
              Track, review, and progress candidate submissions for Winsor Maison showroom vacancies.
            </p>
          </div>
          <button
            onClick={fetchApplications}
            className="self-start sm:self-center px-4 py-2 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-xs font-semibold text-[#1a1209] rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Submissions
          </button>
        </div>

        {/* Professional Tabular Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL SUBMISSIONS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{applications.length.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">PENDING REVIEW</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#8B6914] mt-1 tabular-nums font-mono">
              {applications.filter(a => a.status === 'pending' || a.status === 'under_review').length.toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">INTERVIEW SCHEDULED</p>
            <p className="font-['Jost'] text-3xl font-bold text-blue-700 mt-1 tabular-nums font-mono">
              {applications.filter(a => a.status === 'interview_scheduled').length.toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">OFFERS EXTENDED</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">
              {applications.filter(a => a.status === 'offered').length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Professional Toolbar Filter (Vector Search Icon) */}
        <div className="bg-white border border-[#1a1209]/10 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by candidate name, email, city, or job role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
            />
          </div>

          <div className="relative w-full md:w-1/4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm cursor-pointer text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applicants list table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1209] text-[#f3e3b8]">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">CANDIDATE</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">POSITION</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">DEMOGRAPHICS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">EXPERIENCE</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">STATUS</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-semibold tracking-[0.15em] uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredApplications.map((app) => {
                  const badge = getStatusBadge(app.status);

                  return (
                    <tr 
                      key={app._id} 
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-[#faf7f0]/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-[#1a1209]">{app.firstName} {app.lastName}</div>
                        <div className="text-xs text-[#8B6914] font-medium mt-0.5">{app.email}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-[#8B6914] uppercase tracking-wide">
                        {app.vacancyId?.title || 'Inactive Vacancy'}
                      </td>

                      <td className="px-6 py-4 text-xs text-[#1a1209]/80 font-mono">
                        <div>Age: {app.age} · {app.gender}</div>
                        <div className="text-[#1a1209]/50 font-sans">{app.city}, {app.country}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono">
                        {app.hasExperience ? (
                          <span className="font-semibold text-emerald-700">✓ {app.experienceYears} Years</span>
                        ) : (
                          <span className="text-gray-400 font-sans">Entry level</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(app._id, `${app.firstName} ${app.lastName}`)}
                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-[#1a1209]/60 text-base font-semibold">No job applications submitted</p>
              <p className="text-xs text-[#1a1209]/40 mt-1">Pending candidate resumes will list here once submitted.</p>
            </div>
          )}
        </div>

        {/* ── LUXURY CANDIDATE REVIEW SIDE-OUT DRAWER ── */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setSelectedApp(null)} 
            />

            {/* Slide drawer panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
              <div className="w-screen max-w-xl bg-[#faf7f0] shadow-2xl border-l border-[#1a1209]/10 flex flex-col h-full transform transition-transform duration-300">
                
                {/* Drawer Header */}
                <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex items-center justify-between">
                  <div>
                    <h2 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                      CANDIDATE REVIEW PROFILE
                    </h2>
                    <p className="text-xs text-[#8B6914] font-semibold uppercase tracking-wider mt-0.5">
                      {selectedApp.vacancyId?.title || 'Selected Position'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Drawer Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Candidate Profile Card */}
                  <div className="bg-white border border-[#8B6914]/20 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm space-y-2">
                    <div className="w-20 h-20 rounded-full border-2 border-[#8B6914] p-1 bg-[#faf7f0] flex items-center justify-center overflow-hidden mb-1">
                      <span className="text-2xl font-bold text-[#8B6914]">
                        {selectedApp.firstName.charAt(0)}{selectedApp.lastName.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1209]">
                      {selectedApp.firstName} {selectedApp.lastName}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(selectedApp.status).bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedApp.status).dot}`} />
                      {getStatusBadge(selectedApp.status).label}
                    </span>
                    <p className="text-xs text-[#1a1209]/50 font-mono pt-1">
                      Submitted: {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* ✅ FORCED PDF RESUME DOWNLOAD ACTION BUTTON */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">CV / RESUME DOCUMENT</h4>
                    <div className="bg-white border border-[#8B6914]/25 rounded-2xl p-4 shadow-sm">
                      <button 
                        onClick={() => downloadResumePDF(selectedApp.resumeUrl, `${selectedApp.firstName}_${selectedApp.lastName}`)}
                        className="w-full py-3.5 px-4 bg-[#1a1209] hover:bg-[#8B6914] text-[#f3e3b8] rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-[#8B6914] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF Resume
                      </button>
                    </div>
                  </div>

                  {/* Contact Credentials */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">CONTACT CREDENTIALS</h4>
                    <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">EMAIL ADDRESS</span>
                          <a href={`mailto:${selectedApp.email}`} className="font-semibold text-[#8B6914] hover:underline">{selectedApp.email}</a>
                        </div>
                        <button
                          onClick={() => copyToClipboard(selectedApp.email, 'Candidate Email')}
                          className="px-2 py-1 bg-[#faf7f0] border border-[#8B6914]/20 text-[#8B6914] rounded text-[10px] font-bold hover:bg-[#8B6914] hover:text-white transition-all cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#1a1209]/5">
                        <div>
                          <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">MOBILE CONTACT</span>
                          <span className="font-mono text-[#1a1209] font-medium">{selectedApp.mobile}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(selectedApp.mobile, 'Candidate Mobile')}
                          className="px-2 py-1 bg-[#faf7f0] border border-[#8B6914]/20 text-[#8B6914] rounded text-[10px] font-bold hover:bg-[#8B6914] hover:text-white transition-all cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Demographics & Address */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">DEMOGRAPHICS & ADDRESS</h4>
                    <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-2 font-mono">
                        <div>
                          <span className="text-[#1a1209]/40 block text-[10px] font-sans">Date of Birth</span>
                          <span className="font-semibold text-[#1a1209]">
                            {new Date(selectedApp.dob).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#1a1209]/40 block text-[10px] font-sans">Age</span>
                          <span className="font-semibold text-[#1a1209]">{selectedApp.age} years</span>
                        </div>
                        <div>
                          <span className="text-[#1a1209]/40 block text-[10px] font-sans">Gender</span>
                          <span className="font-semibold text-[#1a1209] capitalize">{selectedApp.gender.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div className="border-t border-[#1a1209]/5 pt-2.5">
                        <span className="text-[#1a1209]/40 block text-[10px] mb-0.5">RESIDENTIAL DESTINATION</span>
                        <p className="font-semibold text-[#1a1209] leading-relaxed">{selectedApp.address}, {selectedApp.city}, {selectedApp.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Experience & Referrals */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">EXPERIENCE & REFERRALS</h4>
                    <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <span className="text-[#1a1209]/40 block text-[10px] mb-1">PROFESSIONAL EXPERIENCE</span>
                        {selectedApp.hasExperience ? (
                          <span className="font-bold text-emerald-700 font-mono">✓ {selectedApp.experienceYears} Years Experience</span>
                        ) : (
                          <span className="text-gray-400 italic">No experience (Entry Level Candidate)</span>
                        )}
                      </div>

                      {selectedApp.referred && (
                        <div className="border-t border-[#1a1209]/5 pt-3 space-y-2">
                          <span className="text-amber-800 font-bold block uppercase tracking-wide text-[10px]">Referred Candidate</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[#1a1209]/40 block text-[10px]">Referee Name</span>
                              <span className="font-semibold text-[#1a1209]">{selectedApp.refereeName}</span>
                            </div>
                            <div>
                              <span className="text-[#1a1209]/40 block text-[10px]">Referee Email</span>
                              <span className="font-semibold text-[#1a1209]">{selectedApp.refereeEmail || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[#1a1209]/40 block text-[10px]">Referee Mobile</span>
                              <span className="font-semibold text-[#1a1209]">{selectedApp.refereeMobile || '—'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Action Toolbar (0ms Optimistic Update) */}
                  <div className="border-t border-[#1a1209]/10 pt-5 space-y-3">
                    <p className="text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                      Update Candidate Lifecycle Status
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'pending', label: 'Pending', color: 'border-gray-300 text-gray-700 hover:bg-gray-100' },
                        { id: 'under_review', label: 'Review', color: 'border-amber-300 text-amber-800 hover:bg-amber-50' },
                        { id: 'interview_scheduled', label: 'Interview', color: 'border-blue-300 text-blue-800 hover:bg-blue-50' },
                        { id: 'offered', label: 'Offer', color: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50' },
                        { id: 'rejected', label: 'Reject', color: 'border-rose-300 text-rose-700 hover:bg-rose-50' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          disabled={updatingStatus}
                          onClick={() => handleUpdateStatus(selectedApp._id, item.id as any)}
                          className={`py-2 px-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedApp.status === item.id
                              ? 'bg-[#1a1209] text-white border-[#1a1209] shadow-sm'
                              : `bg-white ${item.color}`
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
