'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

interface StaffAccount {
  _id: string;
  username: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  isTemporary: boolean;
  expiresAt?: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'products_read', label: 'View Products list', category: 'Products' },
  { key: 'products_create', label: 'Create new Products', category: 'Products' },
  { key: 'products_update', label: 'Edit/Update Products', category: 'Products' },
  { key: 'products_delete', label: 'Delete Products', category: 'Products' },
  { key: 'categories_manage', label: 'Manage Categories (CRUD)', category: 'Categories' },
  { key: 'orders_manage', label: 'Manage Orders & Resolutions', category: 'Orders' },
  { key: 'customers_read', label: 'View Customer details', category: 'Customers' },
  { key: 'messages_manage', label: 'View & Manage Support Messages', category: 'Messages' },
  { key: 'careers_applications', label: 'View Job Applications', category: 'Careers' },
  { key: 'careers_vacancies', label: 'Manage Job Vacancies (CRUD)', category: 'Careers' },
  { key: 'inventory_manage', label: 'Manage Stocks & Inventory levels', category: 'Inventory' },
  { key: 'retailers_manage', label: 'Manage Store Locator (CRUD)', category: 'Retailers' },
  { key: 'settings_manage', label: 'Access Settings page (Self Expiry/Update)', category: 'Settings' },
];

export default function StaffManagementPage() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: 'admin' | 'staff';
    isTemporary: boolean;
    expiresAt?: string;
  } | null>(null);

  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'temporary' | 'inactive'>('all');

  // Form States (Create)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTemporary, setIsTemporary] = useState(true);
  const [expiryDays, setExpiryDays] = useState(3);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['settings_manage']);

  // Form States (Edit)
  const [editId, setEditId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsTemporary, setEditIsTemporary] = useState(false);
  const [editExpiryDays, setEditExpiryDays] = useState(3);
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch('/api/admin/me', { credentials: 'include' });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setCurrentUser(profileData);

      if (profileData.role === 'admin') {
        const staffRes = await fetch('/api/admin/staff', { credentials: 'include' });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          if (staffData.success) {
            setStaffList(staffData.data || []);
          }
        }
      }
    } catch (err) {
      console.error('Staff page load error:', err);
      toast.error('Failed to load staff management data');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPass = 'WS-' + pass;
    setPassword(finalPass);
    if (editModalOpen) {
      setEditPassword(finalPass);
    }
    navigator.clipboard.writeText(finalPass);
    toast.success('⚡ Secure password generated & copied to clipboard!');
  };

  const handleCreateStaff = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const expiresAtDate = new Date();
      expiresAtDate.setDate(expiresAtDate.getDate() + expiryDays);

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          isTemporary,
          expiresAt: isTemporary ? expiresAtDate.toISOString() : undefined,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff');

      toast.success(`Staff member "${username}" created!`);
      
      setUsername('');
      setPassword('');
      setIsTemporary(true);
      setExpiryDays(3);
      setSelectedPermissions(['settings_manage']);
      setModalOpen(false);

      fetchProfileAndData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (account: StaffAccount) => {
    setEditId(account._id);
    setEditUsername(account.username);
    setEditPassword('');
    setEditIsActive(account.isActive);
    setEditIsTemporary(account.isTemporary);
    setEditSelectedPermissions(account.permissions || []);
    
    if (account.isTemporary && account.expiresAt) {
      const diffTime = new Date(account.expiresAt).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setEditExpiryDays(diffDays > 0 ? diffDays : 3);
    } else {
      setEditExpiryDays(3);
    }
    setEditModalOpen(true);
  };

  const handleEditStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);

    try {
      const expiresAtDate = new Date();
      expiresAtDate.setDate(expiresAtDate.getDate() + editExpiryDays);

      const res = await fetch(`/api/admin/staff/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          password: editPassword || undefined,
          isActive: editIsActive,
          isTemporary: editIsTemporary,
          expiresAt: editIsTemporary ? expiresAtDate.toISOString() : undefined,
          permissions: editSelectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update staff');

      toast.success('Staff account updated!');
      setEditModalOpen(false);
      setEditId(null);
      setEditPassword('');
      fetchProfileAndData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete staff account "${name}"? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete staff account');

      toast.success(`Account "${name}" deleted.`);
      fetchProfileAndData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const togglePermission = (key: string, isEdit = false) => {
    if (isEdit) {
      setEditSelectedPermissions(prev =>
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    } else {
      setSelectedPermissions(prev =>
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    }
  };

  const toggleCategoryPermissions = (category: string, isEdit = false) => {
    const keysInCategory = AVAILABLE_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
    if (isEdit) {
      const allSelected = keysInCategory.every(k => editSelectedPermissions.includes(k));
      if (allSelected) {
        setEditSelectedPermissions(prev => prev.filter(k => !keysInCategory.includes(k)));
      } else {
        setEditSelectedPermissions(prev => Array.from(new Set([...prev, ...keysInCategory])));
      }
    } else {
      const allSelected = keysInCategory.every(k => selectedPermissions.includes(k));
      if (allSelected) {
        setSelectedPermissions(prev => prev.filter(k => !keysInCategory.includes(k)));
      } else {
        setSelectedPermissions(prev => Array.from(new Set([...prev, ...keysInCategory])));
      }
    }
  };

  // Group permissions by category
  const categoriesMap = useMemo(() => {
    const map: Record<string, typeof AVAILABLE_PERMISSIONS> = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, []);

  // Aggregates
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.isActive).length;
  const temporaryStaff = staffList.filter(s => s.isTemporary).length;
  const inactiveStaff = staffList.filter(s => !s.isActive).length;

  // Filtered List
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter(s => {
      const matchesSearch = !q ||
        s.username.toLowerCase().includes(q) ||
        (s.permissions || []).some(p => p.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = s.isActive;
      } else if (activeTab === 'temporary') {
        matchesTab = s.isTemporary;
      } else if (activeTab === 'inactive') {
        matchesTab = !s.isActive;
      }

      return matchesSearch && matchesTab;
    });
  }, [staffList, searchQuery, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Loading Staff Operational Profiles…
        </p>
      </div>
    );
  }

  // 🔐 Strict Admin Gating
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[80vh] font-['Jost'] text-[#1a1209]">
        <div className="w-full max-w-[460px] bg-white/95 backdrop-blur-sm border border-red-200 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#1a1209] mb-2 uppercase tracking-wide">
            ACCESS RESTRICTED
          </h2>
          <p className="text-sm text-[#1a1209]/60 leading-relaxed">
            Staff management is exclusively reserved for System Administrators. Operational accounts cannot view or alter staff credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate>
      <div 
        className="min-h-screen font-['Jost'] text-[#1a1209] p-4 sm:p-8 select-none"
        style={{
          backgroundImage: `linear-gradient(rgba(250, 247, 240, 0.93), rgba(250, 247, 240, 0.93)), url('/hero_bg_marble.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/20 pb-5">
            <div>
              <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
                STAFF OPERATIONAL MANAGEMENT
              </h1>
              <p className="text-sm text-[#1a1209]/60 mt-0.5">
                Register staff accounts, manage operational credentials, and configure access permissions.
              </p>
            </div>
            
            <button
              onClick={() => setModalOpen(true)}
              className="self-start sm:self-center px-4 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#8B6914] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Register Staff Account
            </button>
          </div>

          {/* ── Professional Tabular Metrics Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
              <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL STAFF ACCOUNTS</p>
              <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalStaff.toLocaleString()}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
              <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">ACTIVE ACCOUNTS</p>
              <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{activeStaff.toLocaleString()}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
              <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TEMPORARY USERS</p>
              <p className="font-['Jost'] text-3xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{temporaryStaff.toLocaleString()}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
              <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">DEACTIVATED / EXPIRED</p>
              <p className="font-['Jost'] text-3xl font-bold text-rose-600 mt-1 tabular-nums font-mono">{inactiveStaff.toLocaleString()}</p>
            </div>
          </div>

          {/* ── Search & Filter Toolbar ── */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative max-w-md w-full">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search staff username or permission keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
              />
            </div>

            <div className="flex bg-[#fbf9f4] border border-[#1a1209]/10 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all' ? 'bg-[#1a1209] text-white shadow-sm' : 'text-[#1a1209]/60 hover:text-[#1a1209]'
                }`}
              >
                All Accounts ({totalStaff})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'active' ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-800/70 hover:text-emerald-800'
                }`}
              >
                Active ({activeStaff})
              </button>
              <button
                onClick={() => setActiveTab('temporary')}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'temporary' ? 'bg-[#8B6914] text-white shadow-sm' : 'text-[#8B6914]/80 hover:text-[#8B6914]'
                }`}
              >
                Temporary ({temporaryStaff})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600/80 hover:text-rose-600'
                }`}
              >
                Deactivated ({inactiveStaff})
              </button>
            </div>
          </div>

          {/* ── Staff Catalog Table Card ── */}
          <div className="bg-white/95 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1209] text-[#f3e3b8]">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">STAFF MEMBER / USERNAME</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">LIFESPAN / EXPIRY</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">PERMISSIONS GRANTED</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">ACCOUNT STATUS</th>
                    <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">LAST LOGIN</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-semibold tracking-[0.15em] uppercase">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1209]/5">
                  {filteredStaff.map((account) => {
                    const isExpired = account.isTemporary && account.expiresAt && new Date(account.expiresAt) < new Date();
                    
                    return (
                      <tr key={account._id} className="hover:bg-[#faf7f0]/60 transition-colors">
                        {/* Username */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#faf7f0] border border-[#8B6914]/30 flex items-center justify-center font-bold text-[#8B6914] text-xs shadow-sm font-mono">
                              {account.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#1a1209]">
                                {account.username}
                              </h4>
                              <p className="text-[10px] text-[#1a1209]/50 font-mono uppercase tracking-wide">
                                Role: {account.role}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Lifespan */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs font-mono">
                            {account.isTemporary ? (
                              <>
                                <span className="font-bold text-[#8B6914] uppercase tracking-wider">
                                  ⏳ Temporary
                                </span>
                                <span className={`text-[11px] mt-0.5 ${isExpired ? 'text-rose-600 font-bold' : 'text-[#1a1209]/60'}`}>
                                  {isExpired ? 'Expired' : `Expires: ${new Date(account.expiresAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-emerald-800 uppercase tracking-wider">
                                🛡️ Permanent
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Permissions Pill */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#faf7f0] border border-[#8B6914]/30 rounded-lg text-xs font-mono font-bold text-[#8B6914]">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {account.permissions?.length || 0} Privileges
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            !account.isActive 
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isExpired 
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              !account.isActive ? 'bg-rose-500' : isExpired ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {!account.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="px-6 py-4 text-xs font-mono text-[#1a1209]/70">
                          {account.lastLogin ? new Date(account.lastLogin).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Never logged in'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(account)}
                              className="px-3 py-1 border border-[#1a1209]/20 hover:border-[#8B6914] text-[#1a1209] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(account._id, account.username)}
                              className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
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

            {filteredStaff.length === 0 && (
              <div className="p-16 text-center">
                <svg className="w-12 h-12 text-[#8B6914]/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm font-semibold text-[#1a1209]">No staff accounts registered matching criteria</p>
                <p className="text-xs text-[#1a1209]/50 mt-1">Register new operational accounts using the button above.</p>
              </div>
            )}
          </div>

          {/* ── OVERHAULED REGISTER STAFF DIALOG MODAL ── */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300" onClick={() => setModalOpen(false)} />
              
              <div className="bg-[#faf7f0] rounded-2xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex justify-between items-center">
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                      REGISTER STAFF OPERATIONAL ACCOUNT
                    </h3>
                    <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Create login credentials & assign role permissions</p>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1">✕</button>
                </div>

                <form onSubmit={handleCreateStaff} className="flex-1 overflow-y-auto p-6 space-y-5">
                  
                  {/* Username & Password Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                        STAFF USERNAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="e.g. staff_watson"
                        className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                        PASSWORD <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Type or generate"
                          className="flex-1 px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-3.5 py-2.5 bg-[#8B6914] hover:bg-[#1a1209] text-white text-xs font-bold font-mono rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          ⚡ Auto
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lifespan Configuration Card */}
                  <div className="bg-white border border-[#1a1209]/10 rounded-2xl p-4 space-y-3">
                    <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                      ACCOUNT LIFESPAN & EXPIRY DURATION
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isTemporary ? 'bg-amber-50/60 border-[#8B6914] text-[#8B6914]' : 'bg-[#faf7f0] border-[#1a1209]/10 text-[#1a1209]/70'
                      }`}>
                        <input
                          type="radio"
                          name="isTemporary"
                          checked={isTemporary}
                          onChange={() => setIsTemporary(true)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold block">Temporary User</span>
                          <span className="text-[10px] opacity-75">Auto-expires in set days</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        !isTemporary ? 'bg-emerald-50/60 border-emerald-600 text-emerald-800' : 'bg-[#faf7f0] border-[#1a1209]/10 text-[#1a1209]/70'
                      }`}>
                        <input
                          type="radio"
                          name="isTemporary"
                          checked={!isTemporary}
                          onChange={() => setIsTemporary(false)}
                          className="text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold block">Permanent Staff</span>
                          <span className="text-[10px] opacity-75">No expiration date</span>
                        </div>
                      </label>
                    </div>

                    {isTemporary && (
                      <div className="pt-2 border-t border-[#1a1209]/5 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-bold text-[#8B6914] uppercase">Expiry Duration:</span>
                          <span className="font-mono font-bold text-sm text-[#8B6914]">{expiryDays} Days</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={expiryDays}
                          onChange={(e) => setExpiryDays(Number(e.target.value))}
                          className="w-full accent-[#8B6914] cursor-pointer"
                        />
                        <span className="text-[10px] text-[#1a1209]/40 block">Account will automatically deactivate after {expiryDays} days.</span>
                      </div>
                    )}
                  </div>

                  {/* Granular Access Control Checklist grouped by Category */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                      GRANULAR ACCESS PRIVILEGES CHECKLIST
                    </label>
                    
                    <div className="space-y-3">
                      {Object.entries(categoriesMap).map(([category, permItems]) => {
                        const allSelected = permItems.every(p => selectedPermissions.includes(p.key));
                        
                        return (
                          <div key={category} className="bg-white border border-[#1a1209]/10 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center border-b border-[#1a1209]/5 pb-2">
                              <span className="text-xs font-bold text-[#8B6914] uppercase tracking-wider">{category} Module</span>
                              <button
                                type="button"
                                onClick={() => toggleCategoryPermissions(category, false)}
                                className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                              >
                                {allSelected ? 'Deselect Category' : 'Select Category'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permItems.map(perm => (
                                <label key={perm.key} className="flex items-center gap-2 text-xs font-medium text-[#1a1209] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key, false)}
                                    className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Footer */}
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
                      {submitting ? 'Creating Profile…' : 'Register Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── OVERHAULED EDIT STAFF DIALOG MODAL ── */}
          {editModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300" onClick={() => setEditModalOpen(false)} />
              
              <div className="bg-[#faf7f0] rounded-2xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex justify-between items-center">
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                      EDIT STAFF PROFILE CREDENTIALS
                    </h3>
                    <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Modify access privileges and account status</p>
                  </div>
                  <button onClick={() => setEditModalOpen(false)} className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1">✕</button>
                </div>

                <form onSubmit={handleEditStaff} className="flex-1 overflow-y-auto p-6 space-y-5">
                  
                  {/* Username & Reset Password Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                        STAFF USERNAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                        RESET PASSWORD (OPTIONAL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Leave blank to retain password"
                          className="flex-1 px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-3.5 py-2.5 bg-[#8B6914] hover:bg-[#1a1209] text-white text-xs font-bold font-mono rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          ⚡ Auto
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lifespan & Status Grid */}
                  <div className="bg-white border border-[#1a1209]/10 rounded-2xl p-4 space-y-3">
                    <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                      ACCOUNT STATUS & EXPIRY SETTINGS
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        editIsTemporary ? 'bg-amber-50/60 border-[#8B6914] text-[#8B6914]' : 'bg-[#faf7f0] border-[#1a1209]/10 text-[#1a1209]/70'
                      }`}>
                        <input
                          type="radio"
                          name="editIsTemporary"
                          checked={editIsTemporary}
                          onChange={() => setEditIsTemporary(true)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold block">Temporary</span>
                          <span className="text-[10px] opacity-75">Extend expiration</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        !editIsTemporary ? 'bg-emerald-50/60 border-emerald-600 text-emerald-800' : 'bg-[#faf7f0] border-[#1a1209]/10 text-[#1a1209]/70'
                      }`}>
                        <input
                          type="radio"
                          name="editIsTemporary"
                          checked={!editIsTemporary}
                          onChange={() => setEditIsTemporary(false)}
                          className="text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold block">Permanent</span>
                          <span className="text-[10px] opacity-75">No expiration</span>
                        </div>
                      </label>

                      <label className="p-3 bg-[#faf7f0] border border-[#1a1209]/10 rounded-xl flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold block text-[#1a1209]">Account Active</span>
                          <span className="text-[10px] text-[#1a1209]/50">Uncheck to suspend</span>
                        </div>
                      </label>
                    </div>

                    {editIsTemporary && (
                      <div className="pt-2 border-t border-[#1a1209]/5 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-bold text-[#8B6914] uppercase">Expiry Duration:</span>
                          <span className="font-mono font-bold text-sm text-[#8B6914]">{editExpiryDays} Days</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={editExpiryDays}
                          onChange={(e) => setEditExpiryDays(Number(e.target.value))}
                          className="w-full accent-[#8B6914] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Granular Access Control Checklist */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                      GRANULAR ACCESS PRIVILEGES CHECKLIST
                    </label>
                    
                    <div className="space-y-3">
                      {Object.entries(categoriesMap).map(([category, permItems]) => {
                        const allSelected = permItems.every(p => editSelectedPermissions.includes(p.key));
                        
                        return (
                          <div key={category} className="bg-white border border-[#1a1209]/10 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center border-b border-[#1a1209]/5 pb-2">
                              <span className="text-xs font-bold text-[#8B6914] uppercase tracking-wider">{category} Module</span>
                              <button
                                type="button"
                                onClick={() => toggleCategoryPermissions(category, true)}
                                className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                              >
                                {allSelected ? 'Deselect Category' : 'Select Category'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {permItems.map(perm => (
                                <label key={perm.key} className="flex items-center gap-2 text-xs font-medium text-[#1a1209] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editSelectedPermissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key, true)}
                                    className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Footer */}
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
                      {submitting ? 'Updating Profile…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </PermissionGate>
  );
}
