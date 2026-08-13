import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions & Horology Assistance',
  description: 'Find answers regarding Winsor luxury timepiece craftsmanship, movement servicing, international shipping, warranty registration, and bespoke gifting.',
  keywords: [
    'Winsor FAQ',
    'watch warranty registration',
    'automatic watch care',
    'luxury watch shipping',
    'Winsor movement specs',
  ],
  openGraph: {
    title: 'Winsor FAQ & Customer Assistance',
    description: 'Frequently asked questions about Winsor luxury watches, automatic movements, warranty, and shipping.',
    url: `${baseUrl}/faq`,
    type: 'website',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqItems = [
    {
      q: 'Where are Winsor timepieces designed and assembled?',
      a: 'Winsor timepieces are conceived by our lead designers in Dubai, UAE, and assembled with Japanese precision components. Each timepiece undergoes rigorous hand-finishing and testing.',
    },
    {
      q: 'What movements are used in Winsor watches?',
      a: 'We use high-grade Japanese automatic and precision mechanical movements selected for their reliability, accuracy, and detailed decoration.',
    },
    {
      q: 'Are Winsor watches water-resistant?',
      a: 'Yes, all Winsor watches feature varying degrees of water resistance, typically ranging from 3 ATM (30 meters) for dress watches up to 10 ATM (100 meters) for our sports collection.',
    },
    {
      q: 'How long does shipping and delivery transit take?',
      a: 'We offer secure, priority worldwide courier delivery. Regional deliveries within the UAE take 1-2 business days. International deliveries to Sri Lanka, Saudi Arabia, the US, and Europe take 3-5 business days.',
    },
    {
      q: 'What is covered under the Winsor warranty?',
      a: 'Every authentic Winsor watch comes with a comprehensive mechanical warranty covering manufacturing and internal movement defects.',
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((item) => ({
      '@type': 'Question',
      'name': item.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
