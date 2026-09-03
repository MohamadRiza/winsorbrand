import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Limited Edition Collector Timepieces | Japan Movement & Bespoke Series — Winsor',
  description:
    'Explore rare, limited edition Winsor timepieces powered by precision Japan movements, featuring skeletonized cosmic dials, numbered casebacks, and bespoke luxury packaging. 1-year international warranty.',
  keywords: [
    'limited edition watch',
    'collector timepiece',
    'numbered watch series',
    'Japan movement skeleton watch',
    'luxury limited edition Sri Lanka',
    'Winsor space watch',
    'exclusive collector watch',
  ],
  openGraph: {
    title: 'Limited Edition Timepieces | Japan Movement — Winsor Maison',
    description:
      'Explore rare collector watches, skeletonized dials, and numbered limited editions powered by Japan movements.',
    url: `${baseUrl}/limited-edition`,
  },
};

export default function LimitedEditionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
