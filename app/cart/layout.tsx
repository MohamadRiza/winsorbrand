import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Bag | Winsor Timepieces',
  description: 'Review your selected luxury timepieces and proceed to secure checkout. Free island-wide shipping in Sri Lanka.',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

