import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Sports Chronographs & Active Timepieces | Japan Movement — Winsor',
  description:
    'Explore high-performance Winsor sports chronographs and diving-inspired timepieces powered by precision Japan movements. Water-resistant, sapphire-coated glass, 1-year warranty, and fixed MRP.',
  keywords: [
    'sports watch Sri Lanka',
    'sports chronograph',
    'Japan movement sports watch',
    'water resistant luxury watch',
    'diver watch Sri Lanka',
    'men sports watch Colombo',
    'Winsor sports collection',
  ],
  openGraph: {
    title: 'Sports Chronographs & Active Timepieces | Winsor Maison',
    description:
      'High-performance sports chronographs engineered with precision Japan movements and water-resistant cases.',
    url: `${baseUrl}/sports`,
    type: 'website',
  },
};

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
