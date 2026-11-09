import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Cookie Policy | Winsor Watches',
  description:
    'Learn about how Winsor Watches utilizes essential, analytical, and preference cookies to deliver an optimized luxury watch shopping and concierge experience.',
  openGraph: {
    title: 'Cookie Policy | Winsor Watches',
    description:
      'Winsor Watches Cookie Policy — How we utilize cookies to optimize your luxury shopping experience.',
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

