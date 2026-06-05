// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '@/app/context/CurrencyContext';
import { validateEnv } from '@/lib/validateEnv';
import LayoutShell from '@/components/LayoutShell';
import { ClerkProvider } from '@clerk/nextjs';

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateEnv();
}

export const metadata: Metadata = {
  title: 'Winsor — Luxury Timepieces',
  description: 'Fine watches since 1987',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body>
          <CurrencyProvider>
            <LayoutShell>
            {children}
            </LayoutShell>
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
} 