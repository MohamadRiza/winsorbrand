import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Boutique Locations & Authorized Retailers — Store Locator',
  description: 'Locate official Winsor horology boutiques and authorized luxury retail partners worldwide for bespoke watch fittings and maintenance.',
  keywords: [
    'Winsor store locator',
    'Winsor boutiques',
    'authorized watch retailers',
    'luxury watch store Colombo',
    'luxury watch boutique Dubai',
    'watch maintenance center',
  ],
  openGraph: {
    title: 'Winsor Boutiques & Authorized Retailers',
    description: 'Find authorized Winsor luxury watch showrooms and servicing centers near you.',
    url: `${baseUrl}/retailers`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Boutique Store Finder' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Winsor Boutiques & Authorized Retailers',
    description: 'Find authorized Winsor luxury watch showrooms and servicing centers near you.',
    images: [`${baseUrl}/hero_bg_marble.jpg`],
  },
};

export default function RetailersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    'name': 'Winsor Maison Flagship Boutique',
    'description': 'Official flagship showroom and luxury horology fitting center for Winsor Maison.',
    'url': `${baseUrl}/retailers`,
    'telephone': '+94-77-123-4567',
    'logo': `${baseUrl}/icon.png`,
    'image': `${baseUrl}/hero_bg_marble.jpg`,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Galle Face Terrace',
      'addressLocality': 'Colombo',
      'addressRegion': 'Western Province',
      'postalCode': '00300',
      'addressCountry': 'LK',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': '6.9271',
      'longitude': '79.8612',
    },
    'priceRange': '$$$$',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {children}
    </>
  );
}
