import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Vacancy from '@/lib/models/Vacancy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

  // Static routes
  const staticRoutes = [
    '',
    '/collections',
    '/mens',
    '/women',
    '/womens',
    '/gifts',
    '/limited-edition',
    '/new-arrivals',
    '/new',
    '/sports',
    '/our-story',
    '/retailers',
    '/careers',
    '/warranty',
    '/faq',
    '/customer-care',
    '/contact',
    '/return',
    '/terms',
    '/privacy',
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/collections' ? ('daily' as const) : ('weekly' as const),
    priority: route === '' ? 1.0 : route === '/collections' ? 0.9 : 0.8,
  }));

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).select('_id updatedAt').lean();
    productRoutes = products.map((p: any) => ({
      url: `${baseUrl}/collections/${p._id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap product fetch error:', error);
  }

  // Dynamic vacancy routes
  let vacancyRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const vacancies = await Vacancy.find({ isActive: true }).select('_id updatedAt').lean();
    vacancyRoutes = vacancies.map((v: any) => ({
      url: `${baseUrl}/careers/${v._id}`,
      lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Sitemap vacancy fetch error:', error);
  }

  return [...staticRoutes, ...productRoutes, ...vacancyRoutes];
}
