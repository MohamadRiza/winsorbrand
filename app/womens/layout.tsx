import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

export const metadata: Metadata = {
  title: "Ladies Luxury Watches | Women's Elegant Japan Movement Timepieces — Winsor",
  description:
    "Discover elegant women's luxury watches featuring precision Japan movements, mother-of-pearl dials, and refined gold finishes by Winsor Maison. 1-year international warranty and nationwide fixed MRP.",
  keywords: [
    "women's luxury watch",
    'ladies watch Sri Lanka',
    'Japan movement ladies watch',
    'Winsor women timepiece',
    'ladies watch price Sri Lanka',
    'ladies watch Dubai',
    'elegant ladies wristwatch',
  ],
  alternates: {
    canonical: `${baseUrl}/women`,
  },
  openGraph: {
    title: "Ladies Luxury Timepieces | Japan Movement — Winsor Maison",
    description:
      "Discover elegant ladies luxury watches powered by reliable Japanese calibres and exquisite design by Winsor.",
    url: `${baseUrl}/womens`,
  },
};

export default function WomensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
