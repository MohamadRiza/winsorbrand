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
  themeColor: '#FAF7F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Winsor — Luxury Timepieces | Japan Movement & Dubai Atelier',
    template: '%s | Winsor Maison',
  },
  description:
    'Discover luxury Winsor timepieces powered by precision Japan movements. Registered in Dubai, meticulously crafted across Dubai, India, and Sri Lanka. Fixed MRP & 1-year international warranty.',
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
  authors: [{ name: 'Winsor Maison' }],
  creator: 'Winsor Maison',
  publisher: 'Winsor Maison',
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
    siteName: 'Winsor Maison — Fine Horology',
    title: 'Winsor — Luxury Timepieces | Japan Movement & Dubai Atelier',
    description:
      'Explore hand-assembled Japan movement watches, prestige chronographs, and limited edition horology collections by Winsor Maison. Nationwide fixed MRP & 1-year international warranty.',
    images: [
      {
        url: '/hero_bg_marble.jpg',
        width: 1200,
        height: 630,
        alt: 'Winsor Luxury Timepieces Header',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winsor — Luxury Timepieces | Japan Movement & Dubai Atelier',
    description:
      'Explore hand-assembled Japan movement watches, prestige chronographs, and limited edition horology by Winsor Maison.',
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
        'name': 'Winsor Maison',
        'alternateName': ['Winsor Brand', 'WINSOR'],
        'url': baseUrl,
        'logo': `${baseUrl}/icon.png`,
        'description':
          'Dubai-registered luxury watch brand crafting accessible luxury timepieces powered by high-precision Japan movements, meticulously crafted and assembled across Dubai, India, and Sri Lanka.',
        'foundingDate': '2023',
        'foundingLocation': {
          '@type': 'Place',
          'name': 'Dubai, United Arab Emirates',
        },
        'areaServed': ['LK', 'AE', 'Worldwide'],
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+94-77-123-4567',
          'contactType': 'customer service',
          'availableLanguage': ['English', 'Sinhala', 'Tamil', 'Arabic'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        'url': baseUrl,
        'name': 'Winsor — Luxury Timepieces',
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
          'Luxury timepiece maison specializing in precision Japan movement sports chronographs, automatic dress watches, and limited edition horology crafted across Dubai, India, and Sri Lanka.',
      },
    ],
  };

  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" style={{ backgroundColor: '#FAF7F0' }}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body style={{ backgroundColor: '#FAF7F0', color: '#1a1209' }}>
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
