import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Contact Customer Care & Client Services — Winsor Watches',
  description: 'Contact the Winsor concierge team for client assistance, custom watch inquiries, order tracking, and authorized boutique appointments.',
  keywords: [
    'Winsor contact',
    'Winsor concierge',
    'luxury watch customer care',
    'Winsor email phone',
  ],
  openGraph: {
    title: 'Contact Customer Care | Winsor Watches',
    description: 'Get in touch with Winsor client services for assistance and inquiries.',
    url: `${baseUrl}/contact`,
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'name': 'Contact Winsor Watches Concierge',
    'description': 'Contact our fine watchmaking client care team.',
    'url': `${baseUrl}/contact`,
    'mainEntity': {
      '@type': 'Organization',
      'name': 'Winsor Watches',
      'telephone': '+94-77-071-6212',
      'email': 'support@winsorbrand.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      {children}
    </>
  );
}
