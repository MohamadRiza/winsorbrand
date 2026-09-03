import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Luxury Timepiece Collections | Japan Movement Watches — Winsor',
  description:
    'Explore hand-assembled Japan movement watches, prestige sports chronographs, and limited edition horology by Winsor Maison. Crafted across Dubai, India, and Sri Lanka with 1-year international warranty & nationwide fixed MRP.',
  keywords: [
    'Winsor collection',
    'Japan movement watch',
    'luxury watches Sri Lanka',
    'sports chronographs',
    'automatic dress watches',
    'limited edition timepieces',
    'gents luxury watch',
    'ladies luxury watch',
    'Dubai watch brand',
    'fixed MRP watch Sri Lanka',
  ],
  openGraph: {
    title: 'Luxury Timepiece Collections | Winsor Maison',
    description:
      'Browse prestige sports chronographs, Japan movement automatic watches, and limited edition horology by Winsor Maison. 1-year international warranty.',
    url: `${baseUrl}/collections`,
    type: 'website',
    images: [{ url: `${baseUrl}/hero_bg_marble.jpg`, alt: 'Winsor Timepiece Collections' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Timepiece Collections | Winsor Maison',
    description:
      'Browse prestige sports chronographs and Japan movement automatic watches by Winsor Maison.',
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
    'name': 'Luxury Timepiece Collections | Japan Movement Watches',
    'description':
      'Explore hand-assembled Japan movement watches, prestige sports chronographs, and limited edition horology masterpieces by Winsor Maison.',
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
