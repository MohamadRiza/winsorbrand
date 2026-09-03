import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'New Arrivals 2026 | Latest Japan Movement Watches — Winsor Maison',
  description:
    'Be the first to explore the newest 2026 watch additions by Winsor. Modern luxury timepieces with Japanese movement precision.',
  alternates: {
    canonical: `${baseUrl}/new-arrivals`,
  },
};

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
