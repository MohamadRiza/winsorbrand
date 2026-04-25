// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar/Navbar';
import { CurrencyProvider } from '@/app/context/CurrencyContext';

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
          <Navbar />
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
} 