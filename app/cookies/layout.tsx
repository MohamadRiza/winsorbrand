import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Cookie Policy | Winsor Maison',
  description:
    'Learn about how Winsor Maison utilizes essential, analytical, and preference cookies to deliver an optimized luxury horology shopping and concierge experience.',
  openGraph: {
    title: 'Cookie Policy | Winsor Maison',
    description:
      'Winsor Maison Cookie Policy — How we utilize cookies to optimize your luxury horology experience.',
    url: `${baseUrl}/cookies`,
    type: 'website',
  },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

