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
          '/api/customer/',
          '/api/payment/',
          '/profile',
          '/orders',
          '/cart',
          '/staff/',
        ],
      },
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/customer/',
          '/api/payment/',
          '/profile',
          '/orders',
          '/cart',
          '/staff/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
