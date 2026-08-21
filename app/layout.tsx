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
    default: 'Winsor — Luxury Timepieces & Horology Maison',
    template: '%s | Winsor Maison',
  },
  description: 'Discover luxury Swiss-engineered timepieces, automatic chronographs, and haute horologie collections by Winsor Maison.',
  keywords: [
    'Winsor watches',
    'luxury timepieces',
    'automatic watches',
    'Swiss horology',
    'limited edition watches',
    'mens luxury watch',
    'womens luxury watch',
    'chronograph watch',
    'luxury watch Sri Lanka',
    'haute horologie',
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
    title: 'Winsor — Luxury Timepieces & Horology Maison',
    description: 'Explore hand-assembled automatic watches, prestige chronographs, and haute horology collections by Winsor Maison.',
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
    title: 'Winsor — Luxury Timepieces & Horology Maison',
    description: 'Explore hand-assembled automatic watches and prestige chronographs by Winsor Maison.',
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
        'alternateName': 'Winsor Brand',
        'url': baseUrl,
        'logo': `${baseUrl}/icon.png`,
        'description': 'Prestige Swiss-engineered horology maison, crafting luxury automatic timepieces since 2020.',
        'foundingDate': '2020',
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+94-77-123-4567',
          'contactType': 'customer service',
          'availableLanguage': ['English', 'French'],
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
        'description': 'Luxury timepiece manufacturer specializing in sports chronographs, automatic dress watches, and limited edition horology.',
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
