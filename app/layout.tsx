// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '@/app/context/CurrencyContext';
import { validateEnv } from '@/lib/validateEnv';
import LayoutShell from '@/components/LayoutShell';

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
    <html lang="en">
      <body>
        <CurrencyProvider>
          <LayoutShell>
          {children}
          </LayoutShell>
        </CurrencyProvider>
      </body>
    </html>
  );
} 