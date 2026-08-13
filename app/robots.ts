import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/profile',
          '/orders',
          '/cart',
          '/staff/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/profile',
          '/orders',
          '/cart',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
