import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: "Ladies Luxury Watch Collection & Women's Fine Timepieces",
  description: "Discover elegant women's luxury watches, mother-of-pearl dials, and diamond-set timepieces by Winsor Maison.",
  keywords: ["women's luxury watch", 'ladies automatic watch', 'Winsor women timepiece', 'diamond ladies watch'],
  openGraph: {
    title: "Ladies Luxury Timepieces | Winsor Maison",
    description: "Discover elegant ladies luxury watches and fine horology by Winsor Maison.",
    url: `${baseUrl}/women`,
  },
};

export default function WomenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
