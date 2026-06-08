import type { Metadata } from 'next';
import './globals.css';
import { CurrencyProvider } from '@/app/context/CurrencyContext';
import { CartProvider } from '@/app/context/CartContext';
import { validateEnv } from '@/lib/validateEnv';
import LayoutShell from '@/components/LayoutShell';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';

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
            <CartProvider>
              <LayoutShell>
                {children}
              </LayoutShell>
              <Toaster 
                position="top-right" 
                containerClassName="winsor-toaster"
                toastOptions={{
                  style: {
                    background: '#faf7f0',
                    color: '#1a1209',
                    border: '1px solid #8B6914',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '13px',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(26,18,9,0.08)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#8B6914',
                      secondary: '#faf7f0',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#c62828',
                      secondary: '#faf7f0',
                    },
                  },
                }}
              />
            </CartProvider>
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
 