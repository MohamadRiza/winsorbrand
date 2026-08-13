import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Bespoke Luxury Watch Gifts & Curated Timepiece Box Sets',
  description: 'Discover curated luxury watch gifts, anniversary timepieces, corporate gifts, and bespoke box sets by Winsor Maison with complimentary gift wrapping.',
  keywords: [
    'Winsor luxury gifts',
    'watch gift set',
    'anniversary watch gift',
    'corporate gifts Sri Lanka',
    'luxury watch box set',
  ],
  openGraph: {
    title: 'Luxury Watch Gifts & Curated Box Sets | Winsor Maison',
    description: 'Explore bespoke watch gift sets and luxury timepiece gifts for special occasions.',
    url: `${baseUrl}/gifts`,
    type: 'website',
  },
};

export default function GiftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
