'use client';

import { useEffect, useState, FormEvent } from 'react';
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
    try {
      const profileRes = await fetch('/api/admin/me', { credentials: 'include' });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setCurrentUser(profileData);

      // Only load staff list if user is Admin
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
    toast.success('Secure password generated!');
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
      
      // Reset form
      setUsername('');
      setPassword('');
      setIsTemporary(true);
      setExpiryDays(3);
      setSelectedPermissions(['settings_manage']);
      setModalOpen(false);

      // Refresh list
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  // 🔐 Strict Admin Gating
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[80vh] font-['Jost'] text-[#1a1209]">
        <div className="width-full max-w-[460px] bg-white border border-red-200 rounded-xl p-8 text-center shadow-lg">
          <div className="text-red-600 text-4xl mb-4">🔐</div>
          <h2 className="font-['Cormorant_Garamond'] text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-[#1a1209]/60 leading-relaxed mb-6">
            This page is restricted to system administrators. Staff operational profile management is not accessible to staff accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate>
      <div className="space-y-6 font-['Jost'] text-[#1a1209]">
        {/* Header */}
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Staff Management
          </h1>
          <p className="text-[#1a1209]/60 mt-1">
            Register, manage, and configure access permissions for staff operational accounts.
          </p>
        </div>

        {/* Top Cards Aggregates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Total Staff</p>
            <p className="text-2xl font-bold font-['Cormorant_Garamond'] mt-1">{staffList.length}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Active Accounts</p>
            <p className="text-2xl font-bold text-green-700 font-['Cormorant_Garamond'] mt-1">
              {staffList.filter(s => s.isActive).length}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Temporary Users</p>
            <p className="text-2xl font-bold text-[#8B6914] font-['Cormorant_Garamond'] mt-1">
              {staffList.filter(s => s.isTemporary).length}
            </p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Deactivated</p>
            <p className="text-2xl font-bold text-red-700 font-['Cormorant_Garamond'] mt-1">
              {staffList.filter(s => !s.isActive).length}
            </p>
          </div>
        </div>

        {/* Staff Accounts Listing Table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#1a1209]/10 flex justify-between items-center bg-[#faf7f0]/30">
            <div>
              <h3 className="font-semibold text-[#1a1209] text-base">Staff Operational Profiles</h3>
              <p className="text-xs text-[#1a1209]/50 mt-0.5">Control staff credentials and permissions dynamically.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-[#1a1209] hover:bg-[#2a1d10] text-[#faf7f0] text-xs font-semibold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Staff
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Username</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Type / Expiry</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Permissions</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Last Active</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {staffList.map((account) => {
                  const isExpired = account.isTemporary && account.expiresAt && new Date(account.expiresAt) < new Date();
                  
                  return (
                    <tr key={account._id} className="hover:bg-[#faf7f0]/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#1a1209] text-sm">
                        {account.username}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          {account.isTemporary ? (
                            <>
                              <span className="font-semibold text-[#8B6914] uppercase tracking-wide">Temporary</span>
                              <span className={`mt-0.5 ${isExpired ? 'text-red-600 font-semibold' : 'text-[#1a1209]/60'}`}>
                                {isExpired ? 'Expired' : `Expires: ${new Date(account.expiresAt!).toLocaleDateString()}`}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-gray-500 uppercase tracking-wide">Permanent</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 bg-[#1a1209]/5 text-[#1a1209] text-xs rounded border border-[#1a1209]/10">
                          {account.permissions?.length || 0} permissions
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          !account.isActive 
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isExpired 
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {!account.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#1a1209]/65">
                        {account.lastLogin ? new Date(account.lastLogin).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        }) : 'Never logged in'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(account)}
                            className="px-2.5 py-1.5 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/75 hover:bg-[#faf7f0]/80 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(account._id, account.username)}
                            className="px-2.5 py-1.5 border border-red-200 rounded text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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

          {staffList.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-[#1a1209]/60 text-base">No staff profiles registered</p>
              <p className="text-xs text-[#1a1209]/40 mt-1">Create accounts to delegate system roles with access privileges.</p>
            </div>
          )}
        </div>

        {/* ── CREATE STAFF DIALOG MODAL ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a1209]/45 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            
            <div className="bg-white rounded-xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-[#faf7f0] border-b border-[#1a1209]/10 flex justify-between items-center">
                <h3 className="font-['Cormorant_Garamond'] text-lg font-bold">Register Staff Account</h3>
                <button onClick={() => setModalOpen(false)} className="text-[#1a1209]/40 hover:text-[#1a1209]">✕</button>
              </div>

              <form onSubmit={handleCreateStaff} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Type username"
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Type or generate password"
                        className="flex-1 px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 bg-[#8B6914]/10 hover:bg-[#8B6914]/20 border border-[#8B6914]/30 rounded-lg text-xs font-semibold text-[#8B6914] transition"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1a1209]/5 pt-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Staff Account Lifespan</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="isTemporary"
                          checked={isTemporary}
                          onChange={() => setIsTemporary(true)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Temporary (3-day default)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="isTemporary"
                          checked={!isTemporary}
                          onChange={() => setIsTemporary(false)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Permanent (No expiry)
                      </label>
                    </div>
                  </div>

                  {isTemporary && (
                    <div>
                      <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-1">
                        Expiry Duration: <span className="font-bold text-[#8B6914]">{expiryDays} Days</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                        className="w-full accent-[#8B6914]"
                      />
                      <span className="text-[10px] text-[#1a1209]/40">Adjustable slider range: 1 to 30 days.</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#1a1209]/5 pt-4">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-3">
                    Granular Access Control Checklist
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 bg-[#fbf9f4] border border-[#1a1209]/10 rounded-xl">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-start gap-2.5 text-xs text-[#1a1209]/90 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                          className="mt-0.5 rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        <div>
                          <span className="font-semibold text-[10px] text-[#8B6914] uppercase tracking-wider block">{perm.category}</span>
                          <span className="text-[#1a1209] font-medium">{perm.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
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
                    {submitting ? 'Creating Profile…' : 'Register Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── EDIT STAFF DIALOG MODAL ── */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a1209]/45 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
            
            <div className="bg-white rounded-xl shadow-2xl border border-[#1a1209]/10 max-w-2xl w-full relative z-10 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-[#faf7f0] border-b border-[#1a1209]/10 flex justify-between items-center">
                <h3 className="font-['Cormorant_Garamond'] text-lg font-bold">Edit Staff Profile</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-[#1a1209]/40 hover:text-[#1a1209]">✕</button>
              </div>

              <form onSubmit={handleEditStaff} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Reset Password (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to retain current password"
                        className="flex-1 px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 bg-[#8B6914]/10 hover:bg-[#8B6914]/20 border border-[#8B6914]/30 rounded-lg text-xs font-semibold text-[#8B6914] transition"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#1a1209]/5 pt-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Account Lifespan</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="editIsTemporary"
                          checked={editIsTemporary}
                          onChange={() => setEditIsTemporary(true)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Temporary (Extend)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="editIsTemporary"
                          checked={!editIsTemporary}
                          onChange={() => setEditIsTemporary(false)}
                          className="text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Permanent (No expiry)
                      </label>
                    </div>
                  </div>

                  {editIsTemporary && (
                    <div>
                      <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-1">
                        Expiry duration: <span className="font-bold text-[#8B6914]">{editExpiryDays} Days</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={editExpiryDays}
                        onChange={(e) => setEditExpiryDays(Number(e.target.value))}
                        className="w-full accent-[#8B6914]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">Status</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm text-[#1a1209]">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          className="rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        Account Active
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1a1209]/5 pt-4">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-3">
                    Granular Access Control Checklist
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 bg-[#fbf9f4] border border-[#1a1209]/10 rounded-xl">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-start gap-2.5 text-xs text-[#1a1209]/90 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editSelectedPermissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key, true)}
                          className="mt-0.5 rounded text-[#8B6914] focus:ring-[#8B6914]/20"
                        />
                        <div>
                          <span className="font-semibold text-[10px] text-[#8B6914] uppercase tracking-wider block">{perm.category}</span>
                          <span className="text-[#1a1209] font-medium">{perm.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
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
                    {submitting ? 'Updating Profile…' : 'Save Changes'}
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
