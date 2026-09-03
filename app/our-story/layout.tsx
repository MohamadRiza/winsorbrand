import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Our Story — Dubai Heritage, Japan Movement & Horological Vision | Winsor',
  description:
    'Discover the story of Winsor — founded in Dubai in 2023, powered by precision Japan movements, crafted across Dubai, India, and Sri Lanka with nationwide fixed MRP and 1-year international warranty.',
  keywords: [
    'Winsor history',
    'Winsor brand story',
    'Dubai watch brand',
    'Japan movement watches',
    'Sri Lanka watch brand',
    'fixed MRP watches',
    'authentic watch craftsmanship',
  ],
  openGraph: {
    title: 'Our Story — Dubai Heritage & Japan Movement Precision | Winsor',
    description:
      'Registered in Dubai in 2023, Winsor bridges the gap with authentic Japan movement watches, crafted across Dubai, India, and Sri Lanka.',
    url: `${baseUrl}/our-story`,
    type: 'website',
  },
};

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    'name': 'Our Story — Dubai Heritage & Japan Movement Precision',
    'description':
      'The story of Winsor Maison — founded in Dubai in 2023, delivering precision Japan movements and transparent luxury watchmaking across Dubai, India, and Sri Lanka.',
    'url': `${baseUrl}/our-story`,
    'mainEntity': {
      '@type': 'Organization',
      'name': 'Winsor Maison',
      'foundingDate': '2023',
      'foundingLocation': {
        '@type': 'Place',
        'name': 'Dubai, United Arab Emirates',
      },
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
