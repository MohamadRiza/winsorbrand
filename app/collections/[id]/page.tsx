import ProductDetailsClient from './ProductDetailsClient';
import { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const product: any = await Product.findById(id).lean();
    if (!product) {
      return {
        title: 'Timepiece Not Found | Winsor Maison',
      };
    }

    const title = `${product.title} (Ref. ${product.modelNo}) — Winsor Luxury Timepiece`;
    const description = product.description
      ? product.description.slice(0, 160)
      : `Discover the ${product.title} (Model #${product.modelNo}) by Winsor. Precision Japan movement timepiece crafted across Dubai, India, and Sri Lanka with 1-year international warranty & nationwide fixed MRP.`;

    const imageUrl = product.thumbnail?.url || '/mens-watch-highlight.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, alt: product.title }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    return {
      title: 'Luxury Timepiece Collection | Winsor Maison',
    };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let productJsonLd: any = null;

  try {
    await connectDB();
    const product: any = await Product.findById(id).lean();
    if (product) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';
      productJsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': product.title,
        'image': [product.thumbnail?.url || `${baseUrl}/mens-watch-highlight.png`],
        'description':
          product.description ||
          `Hand-crafted luxury watch featuring high-precision Japan movement, crafted across Dubai, India, and Sri Lanka with a 1-year international warranty.`,
        'sku': product.modelNo,
        'mpn': product.modelNo,
        'category': 'Watches',
        'brand': {
          '@type': 'Brand',
          'name': 'Winsor',
        },
        'countryOfAssembly': ['AE', 'IN', 'LK'],
        'offers': {
          '@type': 'Offer',
          'url': `${baseUrl}/collections/${id}`,
          'priceCurrency': 'LKR',
          'price': product.price,
          'priceValidUntil': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': product.isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          'seller': {
            '@type': 'Organization',
            'name': 'Winsor Maison',
          },
          'hasMerchantReturnPolicy': {
            '@type': 'MerchantReturnPolicy',
            'applicableCountry': 'LK',
            'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
            'merchantReturnDays': 7,
          },
        },
      };
    }
  } catch (e) {
    // Ignore structured data error on fallback
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailsClient id={id} />
    </>
  );
}
