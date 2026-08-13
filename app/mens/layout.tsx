import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: "Gents Luxury Watch Collection & Men's Automatic Chronographs",
  description: "Explore Winsor's prestige collection of men's automatic watches, bold sports chronographs, and refined dress timepieces.",
  keywords: ["men's luxury watch", 'gents automatic watch', 'Winsor mens chronograph', 'men luxury timepiece'],
  openGraph: {
    title: "Gents Luxury Timepieces | Winsor Maison",
    description: "Discover prestige men's automatic chronographs and luxury dress watches.",
    url: `${baseUrl}/mens`,
  },
};

export default function MensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
