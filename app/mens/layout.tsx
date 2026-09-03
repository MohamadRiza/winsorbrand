import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: "Gents Luxury Watches | Men's Japan Movement Chronographs & Automatics — Winsor",
  description:
    "Explore Winsor's prestige collection of men's Japan movement watches, bold sports chronographs, and refined automatic dress timepieces. Nationwide fixed MRP & 1-year warranty.",
  keywords: [
    "men's luxury watch",
    'gents automatic watch',
    'Japan movement watch Sri Lanka',
    'Winsor mens chronograph',
    'mens watch price Sri Lanka',
    'luxury watch Colombo',
    'gents watch Dubai',
  ],
  openGraph: {
    title: "Gents Luxury Timepieces | Japan Movement — Winsor Maison",
    description:
      "Discover prestige men's Japan movement chronographs, automatic watches, and luxury dress pieces by Winsor.",
    url: `${baseUrl}/mens`,
  },
};

export default function MensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
