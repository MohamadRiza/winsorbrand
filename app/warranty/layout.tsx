import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: '1-Year International Warranty & Care | Japan Movement Assurance — Winsor',
  description:
    'Official 1-Year International Warranty honored across Sri Lanka and UAE. Comprehensive movement coverage, genuine parts, and care guidelines for Winsor Japan movement timepieces.',
  keywords: [
    'Winsor warranty',
    '1 year watch warranty Sri Lanka',
    'Japan movement warranty',
    'watch service center Sri Lanka',
    'Winsor UAE warranty',
    'genuine watch guarantee',
  ],
  openGraph: {
    title: '1-Year International Warranty & Horology Care | Winsor Maison',
    description:
      'Comprehensive 1-year international warranty honored across Sri Lanka & UAE for Winsor Japan movement watches.',
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
    'name': 'Winsor 1-Year International Movement Warranty & Support',
    'provider': {
      '@type': 'Organization',
      'name': 'Winsor Maison',
      'logo': `${baseUrl}/icon.png`,
    },
    'serviceType': 'Timepiece Movement Warranty & Servicing',
    'areaServed': ['LK', 'AE', 'Worldwide'],
    'description':
      '1-Year international mechanical and quartz movement guarantee with genuine service support across Sri Lanka and UAE.',
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
