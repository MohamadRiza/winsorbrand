'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: 'admin' | 'staff';
    isTemporary: boolean;
    expiresAt?: string;
    adminId: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Staff Self Update States
  const [selfUsername, setSelfUsername] = useState('');
  const [selfPassword, setSelfPassword] = useState('');
  const [selfConfirmPassword, setSelfConfirmPassword] = useState('');
  const [selfUpdating, setSelfUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const profileRes = await fetch('/api/admin/me', { credentials: 'include' });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setCurrentUser(profileData);
      
      if (profileData.username) {
        setSelfUsername(profileData.username);
      }
    } catch (err) {
      console.error('Settings load error:', err);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPass = 'WS-' + pass;
    setSelfPassword(finalPass);
    setSelfConfirmPassword(finalPass);
    toast.success('Secure password generated!');
  };

  const handleSelfUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (selfPassword && selfPassword !== selfConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSelfUpdating(true);

    try {
      const targetId = currentUser?.adminId || null;
      if (!targetId) throw new Error('Missing user credentials');

      const updateRes = await fetch(`/api/admin/staff/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selfUsername,
          password: selfPassword || undefined,
        }),
      });

      const data = await updateRes.json();
      if (!updateRes.ok) throw new Error(data.error || 'Failed to update credentials');

      toast.success('Profile credentials updated successfully!');
      setSelfPassword('');
      setSelfConfirmPassword('');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSelfUpdating(false);
    }
  };

  // Staff Expiry Countdown calculations
  const expiryTimerDetails = useMemo(() => {
    if (currentUser?.role !== 'staff' || !currentUser.isTemporary || !currentUser.expiresAt) {
      return null;
    }

    const expiryTime = new Date(currentUser.expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiryTime - now;

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = '';
    if (days > 0) timeString += `${days} days, `;
    if (hours > 0 || days > 0) timeString += `${hours} hours, `;
    timeString += `${minutes} minutes`;

    return timeString;
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <PermissionGate permission="settings_manage">
      <div className="space-y-6 font-['Jost'] text-[#1a1209]">
        {/* Header */}
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            System Settings
          </h1>
          <p className="text-[#1a1209]/60 mt-1">
            {currentUser?.role === 'admin' 
              ? 'Update your administrator credentials and system access parameters.' 
              : 'View your staff profile, check account expiration limits, and edit credentials.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Card: Account Metadata */}
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-lg border-b border-[#1a1209]/5 pb-3">Profile Details</h3>
            
            <div className="grid grid-cols-3 text-sm">
              <span className="text-[#1a1209]/50">Username</span>
              <span className="col-span-2 font-semibold text-[#1a1209]">{currentUser?.username}</span>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <span className="text-[#1a1209]/50">Access Role</span>
              <span className="col-span-2 uppercase font-semibold tracking-wider text-xs text-[#8B6914] bg-[#8B6914]/10 px-2 py-0.5 rounded border border-[#8B6914]/20 w-fit">
                {currentUser?.role}
              </span>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <span className="text-[#1a1209]/50">Account Lifespan</span>
              <span className="col-span-2 font-semibold text-[#1a1209]">
                {currentUser?.isTemporary ? 'Temporary Access' : 'Permanent Access'}
              </span>
            </div>

            {currentUser?.isTemporary && currentUser?.expiresAt && (
              <div className="p-4 bg-amber-50/50 border border-amber-300/60 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-lg">⏳</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Access Expiration Tracker</span>
                </div>
                <p className="text-sm text-amber-900/90 leading-relaxed">
                  This staff account credentials will expire in:
                </p>
                <p className="text-xl font-bold text-amber-700 tracking-wide">
                  {expiryTimerDetails}
                </p>
                <p className="text-[11px] text-amber-800/80 leading-normal border-t border-amber-300/30 pt-2">
                  Note: To protect database systems, temporary staff members cannot change their usernames and passwords directly. If you require credentials renewals or access extension, please notify your system administrator.
                </p>
              </div>
            )}
          </div>

          {/* Right Card: Credential Modification Form (Permanent Users) */}
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-[#1a1209]/5 pb-3">Update Access Credentials</h3>
            
            {currentUser?.isTemporary ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#1a1209]/40">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm font-medium">Credentials Locked</p>
                <p className="text-xs max-w-xs mt-1">Temporary accounts cannot edit login information for security compliance.</p>
              </div>
            ) : (
              <form onSubmit={handleSelfUpdate} className="space-y-4 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/60 mb-2">Username</label>
                  <input
                    type="text"
                    value={selfUsername}
                    onChange={(e) => setSelfUsername(e.target.value)}
                    required
                    className="w-full px-4.5 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/60 mb-2">New Password (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={selfPassword}
                      onChange={(e) => setSelfPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="flex-1 px-4.5 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209]"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-3 py-2 bg-[#8B6914]/10 hover:bg-[#8B6914]/20 border border-[#8B6914]/30 rounded-lg text-xs font-semibold text-[#8B6914] transition self-end h-[42px]"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {selfPassword && (
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/60 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={selfConfirmPassword}
                      onChange={(e) => setSelfConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4.5 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={selfUpdating}
                  className="w-full mt-4 py-3 bg-[#1a1209] hover:bg-[#2a1d10] text-white text-xs font-semibold tracking-wider uppercase rounded-lg disabled:opacity-50 transition-all shadow-md"
                >
                  {selfUpdating ? 'Saving Credentials…' : 'Save Credentials'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
