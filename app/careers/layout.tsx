import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Careers & Vacancies at Winsor Watches — Join Our Team',
  description: 'Explore career opportunities in watchmaking, watch design, boutique management, and digital marketing at Winsor Watches.',
  keywords: [
    'Winsor careers',
    'watchmaker jobs',
    'luxury boutique jobs',
    'watchmaking vacancies',
    'Winsor hiring',
  ],
  openGraph: {
    title: 'Careers at Winsor Watches',
    description: 'Join the team behind fine watchmaking and prestige watchmaking.',
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
