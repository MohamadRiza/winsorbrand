import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Return & Refund Policy — 14-Day Luxury Timepiece Guarantee',
  description: 'Review the official Winsor Brand Return & Refund Policy. Enjoy our 14-day boutique return guarantee, easy timepiece exchanges, and comprehensive inspection standards.',
  keywords: [
    'Winsor return policy',
    'watch refund policy',
    'luxury watch exchange',
    'timepiece return guarantee',
    'Winsor watch warranty return',
  ],
  openGraph: {
    title: 'Return & Refund Policy | Winsor Brand',
    description: '14-Day boutique return guarantee and luxury timepiece exchange policy by Winsor Brand.',
    url: `${baseUrl}/return`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Brand Return Policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Return & Refund Policy | Winsor Brand',
    description: '14-Day boutique return guarantee and luxury timepiece exchange policy by Winsor Brand.',
    images: [`${baseUrl}/hero_bg_marble.jpg`],
  },
};

export default function ReturnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const returnJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Return & Refund Policy — Winsor Brand',
    'description': 'Official 14-Day return and refund policy for Winsor luxury timepieces and bespoke horology products.',
    'url': `${baseUrl}/return`,
    'publisher': {
      '@type': 'Organization',
      'name': 'Winsor Maison',
      'logo': `${baseUrl}/icon.png`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(returnJsonLd) }}
      />
      {children}
    </>
  );
}
