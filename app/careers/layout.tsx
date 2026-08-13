import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Careers & Vacancies at Winsor Maison — Join Our Atelier',
  description: 'Explore career opportunities in horology, watch design, boutique management, and digital marketing at Winsor Maison.',
  keywords: [
    'Winsor careers',
    'watchmaker jobs',
    'luxury boutique jobs',
    'horology vacancies',
    'Winsor hiring',
  ],
  openGraph: {
    title: 'Careers at Winsor Maison',
    description: 'Join the team behind luxury horology and prestige watchmaking.',
    url: `${baseUrl}/careers`,
    type: 'website',
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
