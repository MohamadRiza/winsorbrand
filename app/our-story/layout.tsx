import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Our Story & Horological Heritage — Winsor Maison',
  description: 'Learn about the heritage, design philosophy, and Swiss-engineered precision behind Winsor Maison luxury timepieces.',
  keywords: ['Winsor history', 'Winsor brand story', 'luxury watch heritage', 'horology maison'],
  openGraph: {
    title: 'Our Story & Horological Heritage | Winsor Maison',
    description: 'Discover the craftsmanship and design philosophy of Winsor Maison.',
    url: `${baseUrl}/our-story`,
    type: 'website',
  },
};

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    'name': 'Our Story & Horological Heritage',
    'description': 'The story of Winsor Maison craftsmanship and precision watchmaking.',
    'url': `${baseUrl}/our-story`,
    'mainEntity': {
      '@type': 'Organization',
      'name': 'Winsor Maison',
      'logo': `${baseUrl}/icon.png`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {children}
    </>
  );
}
