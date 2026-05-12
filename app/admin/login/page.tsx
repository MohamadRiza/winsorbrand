'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

  useEffect(() => {
    // keep your existing session check logic here if any
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      toast.error('Please complete the security check');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || 'Invalid credentials');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }
      toast.success('Welcome back');
      router.push(redirectTo);
    } catch {
      toast.error('Something went wrong. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f7f4ee]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1209',
            color: '#f3e3b8',
            border: '1px solid rgba(201,161,74,0.3)',
            fontSize: '13px',
            letterSpacing: '0.02em',
          },
        }}
      />

      {/* LEFT — Brand image panel */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden">
        {/* Background image */}
        <Image
          src="/discover-partners.jpg"
          alt="Winsor luxury timepiece"
          fill
          priority
          className="object-cover"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,161,74,0.18),transparent_55%)]" />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16 text-white">
          {/* Top — logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/yellow.webp"
              alt="Winsor"
              width={140}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          {/* Middle — tagline (smaller, refined) */}
          <div className="max-w-md">
            <div className="h-px w-12 bg-[#c9a14a] mb-6" />
            <h2 className="font-serif text-2xl xl:text-3xl leading-snug text-white/95">
              Crafted for those who value{' '}
              <span className="italic text-[#d9b878]">timeless</span> excellence.
            </h2>
            <p className="mt-5 text-sm text-white/65 leading-relaxed max-w-sm">
              Manage luxury timepiece collections, monitor business insights, and deliver
              exceptional experiences to your discerning clientele.
            </p>
          </div>

          {/* Bottom */}
          <p className="text-[11px] tracking-[0.35em] text-white/50 uppercase">
            © 2026 Winsor — Private Admin Access
          </p>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo + Admin Portal */}
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/winsor-logo.png"
              alt="Winsor"
              width={180}
              height={56}
              priority
              className="h-14 w-auto object-contain"
            />
            <div className="flex items-center gap-3 mt-5">
              <span className="h-px w-8 bg-[#c9a14a]" />
              <span className="text-[11px] tracking-[0.4em] uppercase text-[#8B6914] font-medium">
                Admin Portal
              </span>
              <span className="h-px w-8 bg-[#c9a14a]" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white border border-[#1a1209]/10 rounded-2xl shadow-[0_20px_60px_-20px_rgba(26,18,9,0.25)] p-8 sm:p-10">
            <div className="mb-7">
              <h1 className="font-serif text-2xl text-[#1a1209]">Sign in to your account</h1>
              <p className="text-sm text-[#1a1209]/55 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.3em] uppercase text-[#1a1209]/70 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                  placeholder="admin"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.3em] uppercase text-[#1a1209]/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-16 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.2em] uppercase text-[#8B6914] hover:text-[#1a1209] transition"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Turnstile */}
              <div className="flex justify-center pt-1">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: 'light', size: 'flexible' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={Boolean(loading || !turnstileToken)}
                suppressHydrationWarning
                className="w-full py-3.5 bg-gradient-to-r from-[#1a1209] to-[#2a1d10] hover:from-[#2a1d10] hover:to-[#3a2815] text-white text-sm font-semibold tracking-[0.3em] uppercase rounded-lg shadow-lg shadow-[#1a1209]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Security notice */}
              <div className="pt-4 border-t border-[#1a1209]/10 flex items-center justify-center gap-2 text-[11px] text-[#1a1209]/50">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 118 0v4" />
                </svg>
                Secure connection · 15 min session · Cloudflare protected
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-[#1a1209]/45 mt-6">
            Having trouble? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
