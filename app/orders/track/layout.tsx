import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Track your Winsor timepiece order with its order reference and registered mobile number.',
};

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
