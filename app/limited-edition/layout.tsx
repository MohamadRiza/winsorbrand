import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Limited Edition & Bespoke Collector Watch Series',
  description: 'Explore rare, limited edition Winsor timepieces featuring numbered casebacks, bespoke Tourbillon movements, and collector packaging.',
  keywords: ['limited edition watch', 'collector timepiece', 'numbered watch series', 'Winsor Tourbillon'],
  openGraph: {
    title: 'Limited Edition Timepieces | Winsor Maison',
    description: 'Explore rare collector watches and numbered limited editions.',
    url: `${baseUrl}/limited-edition`,
  },
};

export default function LimitedEditionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
