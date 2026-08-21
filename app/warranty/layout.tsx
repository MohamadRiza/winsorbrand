import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Horology Care & Guarantee — 1-Year International Warranty',
  description: 'Learn about Winsor Maison’s 1-year international mechanical movement guarantee, servicing guidelines, and timepiece care instructions.',
  keywords: [
    'Winsor warranty',
    'watch care guide',
    'automatic watch maintenance',
    'horology servicing',
    'luxury watch guarantee',
  ],
  openGraph: {
    title: 'Winsor Warranty & Horology Care',
    description: 'Learn about our 1-year international mechanical warranty and timepiece maintenance.',
    url: `${baseUrl}/warranty`,
    type: 'website',
  },
};

export default function WarrantyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': 'Winsor International Horology Warranty & Maintenance',
    'provider': {
      '@type': 'Organization',
      'name': 'Winsor Maison',
      'logo': `${baseUrl}/icon.png`,
    },
    'serviceType': 'Watch Maintenance & Guarantee',
    'areaServed': 'Worldwide',
    'description': '1-Year mechanical movement guarantee and precision servicing for Winsor automatic timepieces.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      {children}
    </>
  );
}
