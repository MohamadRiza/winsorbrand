import type { Metadata, Viewport } from 'next';
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Winsor — Precision Timepieces | Official Online Store',
    template: '%s | Winsor Watches',
  },
  description:
    'Discover Winsor watches powered by precision Japanese movements. Registered in Dubai and crafted for lasting accuracy, sapphire crystal clarity, and everyday elegance. 1-year international warranty.',
  keywords: [
    'Winsor watches',
    'Japan movement watch',
    'Japanese movement watch Sri Lanka',
    'Dubai watch brand',
    'luxury watches Sri Lanka',
    'buy watches online Sri Lanka',
    'mens luxury watch',
    'womens luxury watch',
    'sports chronograph',
    'automatic watch Japan movement',
    'fixed MRP watch',
    'Winsor brand',
    '1 year warranty watch Sri Lanka',
    'Dubai luxury timepieces',
    'gents watch Sri Lanka',
    'ladies watch Sri Lanka',
  ],
  authors: [{ name: 'Winsor' }],
  creator: 'Winsor',
  publisher: 'Winsor',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Winsor Watches',
    title: 'Winsor — Precision Timepieces | Official Online Store',
    description:
      'Explore Japanese movement watches, sports chronographs, and limited edition collections by Winsor. Nationwide fixed MRP & 1-year international warranty.',
    images: [
      {
        url: '/hero_bg_marble.jpg',
        width: 1200,
        height: 630,
        alt: 'Winsor Timepieces Header',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winsor — Precision Timepieces | Official Online Store',
    description:
      'Explore Japanese movement watches, sports chronographs, and limited edition collections by Winsor.',
    images: ['/hero_bg_marble.jpg'],
    creator: '@winsorbrand',
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        'name': 'Winsor',
        'alternateName': ['Winsor Brand', 'WINSOR'],
        'url': baseUrl,
        'logo': `${baseUrl}/icon.png`,
        'description':
          'Dubai-registered watch brand crafting precision timepieces powered by reliable Japanese movements, with official retail and after-sales service across Dubai, India, and Sri Lanka.',
        'foundingDate': '2023',
        'foundingLocation': {
          '@type': 'Place',
          'name': 'Dubai, United Arab Emirates',
        },
        'areaServed': ['LK', 'AE', 'Worldwide'],
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+94-77-071-6212',
          'contactType': 'customer service',
          'availableLanguage': ['English', 'Sinhala', 'Tamil', 'Arabic'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        'url': baseUrl,
        'name': 'Winsor Watches',
        'publisher': {
          '@id': `${baseUrl}/#organization`,
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/collections?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Brand',
        '@id': `${baseUrl}/#brand`,
        'name': 'Winsor',
        'logo': `${baseUrl}/icon.png`,
        'description':
          'International watch brand specializing in precision Japanese movement sports chronographs, classic dress watches, and numbered limited editions.',
      },
    ],
  };

  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" style={{ backgroundColor: '#FFFFFF' }}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body style={{ backgroundColor: '#FFFFFF', color: '#141414' }}>
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
                    background: '#ffffff',
                    color: '#141414',
                    border: '1px solid rgba(20, 20, 20, 0.12)',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '13px',
                    borderRadius: '4px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#8B6914',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#c62828',
                      secondary: '#ffffff',
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
