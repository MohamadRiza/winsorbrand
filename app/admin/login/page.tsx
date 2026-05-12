'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include', // Important for cookies
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Welcome back!');
      
      // Redirect based on role
      if (data.data?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/staff');
      }
      
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1209',
            color: '#fff',
            border: '1px solid #8B6914',
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f0] px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209] tracking-wide">
              WINSOR
            </h1>
            <p className="font-['Jost'] text-sm text-[#8B6914] tracking-[0.2em] mt-2">
              ADMIN PORTAL
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-lg border border-[#1a1209]/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block font-['Jost'] text-sm font-medium text-[#1a1209] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-[#1a1209]/20 rounded-md 
                           font-['Jost'] text-[#1a1209] placeholder-[#1a1209]/40
                           focus:outline-none focus:ring-2 focus:ring-[#8B6914] focus:border-transparent
                           transition-all duration-200"
                  placeholder="Enter username"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-['Jost'] text-sm font-medium text-[#1a1209] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[#1a1209]/20 rounded-md 
                             font-['Jost'] text-[#1a1209] placeholder-[#1a1209]/40
                             focus:outline-none focus:ring-2 focus:ring-[#8B6914] focus:border-transparent
                             transition-all duration-200 pr-12"
                    placeholder="Enter password"
                    required
                    minLength={8}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1209]/60 
                             hover:text-[#8B6914] transition-colors text-sm font-['Jost']"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1209] text-[#faf7f0] font-['Jost'] font-medium 
                         py-3 px-4 rounded-md hover:bg-[#8B6914] 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 tracking-wide"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-[#1a1209]/10">
              <p className="font-['Jost'] text-xs text-[#1a1209]/50 text-center">
                🔒 Secure connection • Session expires in 15 minutes
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-8 font-['Jost'] text-xs text-[#1a1209]/40">
            © {new Date().getFullYear()} Winsor. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}