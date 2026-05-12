// app/admin/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

// ... (icons remain the same) ...

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isClient, setIsClient] = useState(false); // ✅ Prevent hydration mismatch
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setUsername(data.username);
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914] mx-auto"></div>
          <p className="mt-4 font-['Jost'] text-[#1a1209]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1209',
            color: '#fff',
            border: '1px solid #8B6914',
            fontFamily: "'Jost', sans-serif",
          },
        }}
      />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#1a1209] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#8B6914]/20">
          <h1 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#faf7f0] tracking-wide">
            WINSOR
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#faf7f0]/70 hover:text-[#faf7f0]"
          >
            {/* CloseIcon component */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          {/* navItems.map... (same as before) */}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#8B6914]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#8B6914] flex items-center justify-center">
              <span className="font-['Jost'] font-semibold text-[#faf7f0]">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-['Jost'] text-sm font-medium text-[#faf7f0] truncate">
                {username}
              </p>
              <p className="font-['Jost'] text-xs text-[#faf7f0]/50">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-['Jost'] text-sm text-[#faf7f0]/70 hover:bg-[#8B6914]/20 hover:text-[#faf7f0] transition-all duration-200"
          >
            {/* LogoutIcon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen bg-[#faf7f0]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#faf7f0]/95 backdrop-blur border-b border-[#1a1209]/10 px-4 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#1a1209]/70 hover:text-[#1a1209]"
          >
            {/* MenuIcon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/"
              className="font-['Jost'] text-sm text-[#1a1209]/70 hover:text-[#8B6914] transition-colors"
            >
              View Store →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </>
  );
}