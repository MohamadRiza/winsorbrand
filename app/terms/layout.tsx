import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Terms and Conditions — Official Maison Commercial Agreement',
  description: 'Review the official Terms and Conditions governing timepiece purchases, boutique reservations, transit liabilities, and customer agreements with Winsor Brand.',
  keywords: [
    'Winsor terms and conditions',
    'watch purchase agreement',
    'timepiece terms of service',
    'luxury watch warranty terms',
    'Winsor Brand terms',
  ],
  openGraph: {
    title: 'Terms & Conditions | Winsor Brand',
    description: 'Official commercial conditions, timepiece warranties, shipping liabilities, and patron relations agreements at Winsor Brand.',
    url: `${baseUrl}/terms`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Brand Terms and Conditions' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions | Winsor Brand',
    description: 'Official commercial conditions and timepiece purchase agreements at Winsor Brand.',
    images: [`${baseUrl}/hero_bg_marble.jpg`],
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const termsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Terms and Conditions — Winsor Brand',
    'description': 'Official terms of service and commercial sales conditions governing Winsor Brand luxury timepieces.',
    'url': `${baseUrl}/terms`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />
      {children}
    </>
  );
}
