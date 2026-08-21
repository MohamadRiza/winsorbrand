import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Privacy Policy — Global Data Protection & Patron Confidentiality',
  description: 'Learn how Winsor Brand collects, protects, and handles your personal information, patron profiles, and transaction records with enterprise-grade encryption.',
  keywords: [
    'Winsor privacy policy',
    'watch brand data protection',
    'patron confidentiality',
    'secure watch checkout',
    'GDPR compliance Winsor',
  ],
  openGraph: {
    title: 'Privacy Policy | Winsor Brand',
    description: 'Our commitment to privacy, data protection, and secure processing of timepiece transactions and patron profiles.',
    url: `${baseUrl}/privacy`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Brand Privacy Policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Winsor Brand',
    description: 'Our commitment to privacy, data protection, and secure processing of timepiece transactions.',
    images: [`${baseUrl}/hero_bg_marble.jpg`],
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const privacyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Privacy Policy — Winsor Brand',
    'description': 'Official data protection and privacy policy for Winsor Brand patrons and horology clients.',
    'url': `${baseUrl}/privacy`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyJsonLd) }}
      />
      {children}
    </>
  );
}
