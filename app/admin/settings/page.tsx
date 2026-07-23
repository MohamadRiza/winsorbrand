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

  // Eye icon show/hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setShowPassword(true);
    setShowConfirmPassword(true);
    
    // Auto-copy generated password to system clipboard
    navigator.clipboard.writeText(finalPass);
    toast.success('⚡ Secure password generated & copied to clipboard!');
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
      setShowPassword(false);
      setShowConfirmPassword(false);
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
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Loading System Settings…
        </p>
      </div>
    );
  }

  return (
    <PermissionGate permission="settings_manage">
      <div 
        className="min-h-screen font-['Jost'] text-[#1a1209] p-4 sm:p-8 select-none"
        style={{
          backgroundImage: `linear-gradient(rgba(250, 247, 240, 0.93), rgba(250, 247, 240, 0.93)), url('/hero_bg_marble.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Page Header ── */}
          <div className="border-b border-[#8B6914]/20 pb-5">
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              SYSTEM SETTINGS & PROFILE CREDENTIALS
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-0.5">
              {currentUser?.role === 'admin' 
                ? 'Update your administrator credentials and system access parameters.' 
                : 'View your staff profile, check account expiration limits, and edit credentials.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left Card: Account Metadata */}
            <div className="bg-white/95 backdrop-blur-sm border border-[#8B6914]/25 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="border-b border-[#1a1209]/10 pb-4">
                <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209] uppercase tracking-wider">
                  PROFILE METADATA
                </h3>
                <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Account role privileges & authentication status</p>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[#1a1209]/5">
                  <span className="text-xs font-bold text-[#8B6914] uppercase">Username</span>
                  <span className="font-mono font-bold text-[#1a1209]">{currentUser?.username}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[#1a1209]/5">
                  <span className="text-xs font-bold text-[#8B6914] uppercase">Access Role</span>
                  <span className="uppercase font-mono font-bold text-xs text-[#8B6914] bg-[#faf7f0] px-3 py-1 rounded-lg border border-[#8B6914]/30">
                    {currentUser?.role}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[#1a1209]/5">
                  <span className="text-xs font-bold text-[#8B6914] uppercase">Account Lifespan</span>
                  <span className="font-mono font-bold text-xs text-[#1a1209]">
                    {currentUser?.isTemporary ? '⏳ Temporary Access' : '🛡️ Permanent Access'}
                  </span>
                </div>
              </div>

              {currentUser?.isTemporary && currentUser?.expiresAt && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Access Expiration Tracker</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This staff account credentials will expire in:
                  </p>
                  <p className="text-2xl font-bold font-mono text-amber-700 tracking-wide">
                    {expiryTimerDetails}
                  </p>
                  <p className="text-[11px] text-amber-800/80 leading-normal border-t border-amber-300/40 pt-2">
                    Note: Temporary staff members cannot edit credentials directly. For renewals, contact your administrator.
                  </p>
                </div>
              )}
            </div>

            {/* Right Card: Credential Modification Form with Eye Toggle Icons */}
            <div className="bg-white/95 backdrop-blur-sm border border-[#8B6914]/25 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="border-b border-[#1a1209]/10 pb-4">
                <h3 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209] uppercase tracking-wider">
                  UPDATE ACCESS CREDENTIALS
                </h3>
                <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Modify login username & password authentication</p>
              </div>
              
              {currentUser?.isTemporary ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#1a1209]/40">
                  <svg className="w-12 h-12 mb-3 text-[#8B6914]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm font-semibold text-[#1a1209]">Credentials Locked</p>
                  <p className="text-xs max-w-xs mt-1 text-[#1a1209]/50">Temporary accounts cannot edit login credentials for security compliance.</p>
                </div>
              ) : (
                <form onSubmit={handleSelfUpdate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-1.5">
                      ACCOUNT USERNAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selfUsername}
                      onChange={(e) => setSelfUsername(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                    />
                  </div>

                  {/* Password Field with Eye Icon */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-1.5">
                      NEW PASSWORD (OPTIONAL)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={selfPassword}
                          onChange={(e) => setSelfPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                          className="w-full pl-4 pr-10 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1209]/40 hover:text-[#8B6914] transition-colors cursor-pointer p-1"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3.5 py-2.5 bg-[#8B6914] hover:bg-[#1a1209] text-white text-xs font-bold font-mono rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        ⚡ Generate
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field with Eye Icon */}
                  {selfPassword && (
                    <div className="animate-fadeIn">
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-1.5">
                        CONFIRM NEW PASSWORD <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={selfConfirmPassword}
                          onChange={(e) => setSelfConfirmPassword(e.target.value)}
                          required
                          placeholder="Re-type new password"
                          className="w-full pl-4 pr-10 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl font-mono text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1209]/40 hover:text-[#8B6914] transition-colors cursor-pointer p-1"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ⚠ Critical Password Warning Callout Banner */}
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                      <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>CRITICAL: SAVE OR COPY YOUR PASSWORD</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Please copy and save your new password in a password manager or secure location before updating. Passwords are encrypted in the database and cannot be retrieved if forgotten.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={selfUpdating}
                    className="w-full mt-2 py-3 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {selfUpdating ? 'Saving Credentials…' : 'Save Updated Credentials'}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>
    </PermissionGate>
  );
}
