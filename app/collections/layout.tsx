import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Luxury Timepiece Collections & Fine Watch Catalog',
  description: 'Explore hand-assembled automatic watches, prestige sports chronographs, and limited edition horology masterpieces by Winsor Maison.',
  keywords: [
    'Winsor collection',
    'luxury watches',
    'sports chronographs',
    'automatic dress watches',
    'limited edition timepieces',
    'Swiss horology',
    'gents luxury watch',
    'ladies luxury watch',
  ],
  openGraph: {
    title: 'Luxury Timepiece Collections | Winsor Maison',
    description: 'Browse prestige sports chronographs, automatic dress watches, and limited edition horology by Winsor Maison.',
    url: `${baseUrl}/collections`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Timepiece Collections' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Timepiece Collections | Winsor Maison',
    description: 'Browse prestige sports chronographs and automatic dress watches by Winsor Maison.',
    images: [`${baseUrl}/hero_bg_marble.jpg`],
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Luxury Timepiece Collections & Fine Watch Catalog',
    'description': 'Explore hand-assembled automatic watches, prestige sports chronographs, and limited edition horology masterpieces by Winsor Maison.',
    'url': `${baseUrl}/collections`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {children}
    </>
  );
}
