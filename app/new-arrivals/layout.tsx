import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'New Arrivals 2026 | Latest Japan Movement Watches — Winsor Maison',
  description:
    'Be the first to explore the newest 2026 watch additions by Winsor. Modern luxury timepieces with Japanese movement precision, assembled across Dubai, India, and Sri Lanka.',
  keywords: [
    'new watch arrivals Sri Lanka',
    'latest watches 2026',
    'new Winsor watches',
    'Japan movement new models',
    'luxury watch trends',
  ],
  openGraph: {
    title: 'New Arrivals 2026 | Winsor Maison',
    description:
      'Explore the latest luxury watch releases powered by high-precision Japan movements.',
    url: `${baseUrl}/new-arrivals`,
    type: 'website',
  },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
