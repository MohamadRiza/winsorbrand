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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/careers/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      toast.success(`Application status updated to ${newStatus.replace('_', ' ')}`);
      
      // Update local state
      setApplications(prev =>
        prev.map(app => (app._id === id ? { ...app, status: newStatus as any } : app))
      );
      if (selectedApp?._id === id) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
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
      setSelectedApp(null);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission="careers_applications">
      <div className="space-y-6 font-['Jost'] text-[#1a1209]">
        {/* Header */}
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Job Applications
          </h1>
          <p className="text-[#1a1209]/60 mt-1">
            Track, review, and progress candidate submissions for showroom vacancies.
          </p>
        </div>

        {/* Aggregates Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Total Submissions</p>
            <p className="text-2xl font-bold font-['Cormorant_Garamond'] mt-1">{applications.length}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Pending Review</p>
            <p className="text-2xl font-bold text-[#8B6914] font-['Cormorant_Garamond'] mt-1">
              {applications.filter(a => a.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Interview Scheduled</p>
            <p className="text-2xl font-bold text-blue-700 font-['Cormorant_Garamond'] mt-1">
              {applications.filter(a => a.status === 'interview_scheduled').length}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Offers Made</p>
            <p className="text-2xl font-bold text-green-700 font-['Cormorant_Garamond'] mt-1">
              {applications.filter(a => a.status === 'offered').length}
            </p>
          </div>
        </div>

        {/* Toolbar filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-[#1a1209]/10 p-4 rounded-xl shadow-sm">
          <div className="relative w-full md:w-1/2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by candidate name, email, city, or job role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs placeholder-[#1a1209]/40 focus:outline-none"
            />
          </div>

          <div className="relative w-full md:w-1/4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs appearance-none cursor-pointer text-[#1a1209]"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[8px]">▼</span>
          </div>
        </div>

        {/* Applicants list table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Candidate</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Applied Position</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Demographics</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Experience</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredApplications.map((app) => (
                  <tr 
                    key={app._id} 
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-[#faf7f0]/20 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-[#1a1209]">{app.firstName} {app.lastName}</div>
                      <div className="text-xs text-[#1a1209]/50 mt-0.5">{app.email}</div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-[#8B6914] uppercase tracking-wide">
                      {app.vacancyId?.title || 'Inactive Vacancy'}
                    </td>

                    <td className="px-6 py-4 text-xs text-[#1a1209]/70">
                      <div>Age: {app.age} · {app.gender}</div>
                      <div>{app.city}, {app.country}</div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {app.hasExperience ? (
                        <span className="font-medium text-green-700">{app.experienceYears} Years</span>
                      ) : (
                        <span className="text-gray-400">Entry level</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        app.status === 'offered'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : app.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : app.status === 'interview_scheduled'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : app.status === 'under_review'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1.5 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/75 hover:bg-[#faf7f0]/80 transition"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleDeleteApplication(app._id, `${app.firstName} ${app.lastName}`)}
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

          {filteredApplications.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-[#1a1209]/60 text-base">No job applications submitted</p>
              <p className="text-xs text-[#1a1209]/40 mt-1">Pending candidate resumes will list here once submitted.</p>
            </div>
          )}
        </div>

        {/* ── DETAIL SLIDE-OUT DRAWER ── */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#1a1209]/30 backdrop-blur-sm" 
              onClick={() => setSelectedApp(null)} 
            />

            {/* Slide drawer container */}
            <div className="relative w-full max-w-xl h-full bg-[#faf7f0] border-l border-[#1a1209]/15 shadow-2xl p-6 lg:p-8 flex flex-col justify-between z-10 animate-slideLeft">
              
              <div className="flex justify-between items-start border-b border-[#1a1209]/10 pb-4">
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold">Candidate Review</h3>
                  <p className="text-xs text-[#8B6914] font-medium uppercase tracking-wider mt-0.5">
                    {selectedApp.vacancyId?.title || 'Selected Position'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="text-2xl text-[#1a1209]/40 hover:text-[#1a1209] p-1.5"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable details wrapper */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                
                {/* 1. Contact / Header Block */}
                <div className="bg-white border border-[#1a1209]/10 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedApp.firstName} {selectedApp.lastName}</h4>
                      <p className="text-xs text-[#1a1209]/60">{selectedApp.city}, {selectedApp.country}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      selectedApp.status === 'offered'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : selectedApp.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-[#8B6914]/10 text-[#8B6914] border-[#8B6914]/20'
                    }`}>
                      {selectedApp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="border-t border-[#1a1209]/5 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-[#1a1209]/50 block">Email Address</span>
                      <a href={`mailto:${selectedApp.email}`} className="font-medium text-[#8B6914] hover:underline">
                        {selectedApp.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#1a1209]/50 block">Mobile Number</span>
                      <span className="font-medium text-[#1a1209]">{selectedApp.mobile}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Demographics Spec */}
                <div className="space-y-3">
                  <h4 className="font-['Cormorant_Garamond'] text-lg font-bold">Demographics & Address</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-5 shadow-sm space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[#1a1209]/50 block">Date of Birth</span>
                        <span className="font-semibold text-[#1a1209]">
                          {new Date(selectedApp.dob).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#1a1209]/50 block">Age</span>
                        <span className="font-semibold text-[#1a1209]">{selectedApp.age} years</span>
                      </div>
                      <div>
                        <span className="text-[#1a1209]/50 block">Gender</span>
                        <span className="font-semibold text-[#1a1209] capitalize">{selectedApp.gender.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="border-t border-[#1a1209]/5 pt-3">
                      <span className="text-[#1a1209]/50 block mb-1">Residential Destination</span>
                      <p className="font-medium text-[#1a1209] leading-relaxed">{selectedApp.address}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Credentials & Experience */}
                <div className="space-y-3">
                  <h4 className="font-['Cormorant_Garamond'] text-lg font-bold">Experience & Referrals</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-5 shadow-sm space-y-4 text-xs">
                    <div>
                      <span className="text-[#1a1209]/50 block mb-1">Professional Experience</span>
                      {selectedApp.hasExperience ? (
                        <span className="font-semibold text-green-700">✓ {selectedApp.experienceYears} Years Experience</span>
                      ) : (
                        <span className="text-gray-400 italic">No experience (Entry Level profile)</span>
                      )}
                    </div>

                    {selectedApp.referred && (
                      <div className="border-t border-[#1a1209]/5 pt-3 space-y-2">
                        <span className="text-amber-700 font-semibold block uppercase tracking-wide text-[9px]">Referred Candidate</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[#1a1209]/50 block">Referee Name</span>
                            <span className="font-medium text-[#1a1209]">{selectedApp.refereeName}</span>
                          </div>
                          <div>
                            <span className="text-[#1a1209]/50 block">Referee Email</span>
                            <span className="font-medium text-[#1a1209]">{selectedApp.refereeEmail || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-[#1a1209]/50 block">Referee Mobile</span>
                            <span className="font-medium text-[#1a1209]">{selectedApp.refereeMobile || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. CV Attachment */}
                <div className="space-y-3">
                  <h4 className="font-['Cormorant_Garamond'] text-lg font-bold">Resume Attachment</h4>
                  <a 
                    href={selectedApp.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-white border border-[#8B6914]/30 hover:border-[#8B6914] rounded-xl shadow-sm text-xs font-semibold text-[#8B6914] transition-all hover:bg-[#8B6914]/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <span className="block text-[#1a1209]">Candidate_Resume.pdf</span>
                        <span className="block text-[#1a1209]/40 font-normal text-[10px] mt-0.5">Click to view/download file</span>
                      </div>
                    </div>
                    <span>➜</span>
                  </a>
                </div>

              </div>

              {/* Action Toolbar bottom */}
              <div className="border-t border-[#1a1209]/10 pt-5 space-y-4 bg-[#faf7f0]">
                <p className="text-[10px] font-semibold tracking-wider text-[#1a1209]/65 uppercase">Update Candidate Status</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    disabled={updatingStatus || selectedApp.status === 'under_review'}
                    onClick={() => handleUpdateStatus(selectedApp._id, 'under_review')}
                    className="py-2.5 border border-[#8B6914]/30 hover:border-[#8B6914] text-[10px] font-bold uppercase tracking-wider text-[#8B6914] rounded-lg disabled:opacity-50 transition bg-white"
                  >
                    Review
                  </button>
                  <button
                    disabled={updatingStatus || selectedApp.status === 'interview_scheduled'}
                    onClick={() => handleUpdateStatus(selectedApp._id, 'interview_scheduled')}
                    className="py-2.5 border border-blue-200 hover:border-blue-500 text-[10px] font-bold uppercase tracking-wider text-blue-700 rounded-lg disabled:opacity-50 transition bg-white"
                  >
                    Interview
                  </button>
                  <button
                    disabled={updatingStatus || selectedApp.status === 'offered'}
                    onClick={() => handleUpdateStatus(selectedApp._id, 'offered')}
                    className="py-2.5 border border-green-200 hover:border-green-500 text-[10px] font-bold uppercase tracking-wider text-green-700 rounded-lg disabled:opacity-50 transition bg-white"
                  >
                    Offer
                  </button>
                  <button
                    disabled={updatingStatus || selectedApp.status === 'rejected'}
                    onClick={() => handleUpdateStatus(selectedApp._id, 'rejected')}
                    className="py-2.5 border border-red-200 hover:border-red-500 text-[10px] font-bold uppercase tracking-wider text-red-600 rounded-lg disabled:opacity-50 transition bg-white"
                  >
                    Reject
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Slide Transition keyframe */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </PermissionGate>
  );
}
