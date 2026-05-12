// app/admin/layout.tsx
import { ReactNode } from 'react';

export default function AdminAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf7f0] flex flex-col">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="py-6 text-center">
        <p className="font-['Jost'] text-xs text-[#1a1209]/40">
          © {new Date().getFullYear()} Winsor. All rights reserved.
        </p>
      </footer>
    </div>
  );
}