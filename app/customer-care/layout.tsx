import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Customer Care & Support | Winsor Maison',
  description:
    'Connect with Winsor Maison customer care. Inquire about timepiece orders, 1-year international warranty services, authorized boutique fittings, and luxury horology concierge assistance.',
  openGraph: {
    title: 'Customer Care & Support | Winsor Maison',
    description:
      'Connect with Winsor Maison customer care. Dedicated luxury timepiece assistance, order support, and warranty servicing.',
    url: `${baseUrl}/customer-care`,
    type: 'website',
  },
};

export default function CustomerCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

