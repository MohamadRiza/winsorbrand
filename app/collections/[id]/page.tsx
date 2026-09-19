import ProductDetailsClient from './ProductDetailsClient';
import { Metadata } from 'next';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://winsorbrand.com';

function formatCleanTitle(raw: string): string {
  if (!raw) return 'Winsor Timepiece';
  const trimmed = raw.trim();
  if (trimmed.toLowerCase() === 'winsor') return 'Winsor Classic';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!id || !mongoose.isValidObjectId(id)) {
    return {
      title: 'Timepiece Not Found | Winsor Maison',
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  try {
    await connectDB();
    const product: any = await Product.findById(id).lean();

    if (!product || product.isActive === false) {
      return {
        title: 'Timepiece Not Found | Winsor Maison',
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    }

    const cleanTitle = formatCleanTitle(product.title);
    const title = `${cleanTitle} (Ref. ${product.modelNo}) — Winsor Luxury Timepiece`;
    const description = product.description
      ? product.description.replace(/<[^>]*>/g, '').trim().slice(0, 160)
      : `Discover the ${cleanTitle} (Model #${product.modelNo}) by Winsor. Precision Japan movement timepiece crafted across Dubai, India, and Sri Lanka with 1-year international warranty & nationwide fixed MRP.`;

    const canonicalUrl = `${baseUrl}/collections/${id}`;

    // Collect all high-resolution product images
    const imageSet = new Set<string>();
    if (product.thumbnail?.url) imageSet.add(product.thumbnail.url);
    if (Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (img?.url) imageSet.add(img.url);
      });
    }
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((v: any) => {
        if (v?.image?.url) imageSet.add(v.image.url);
      });
    }

    const imageList = Array.from(imageSet).map((url) =>
      url.startsWith('http') ? url : `${baseUrl}${url}`
    );
    const primaryImage = imageList[0] || `${baseUrl}/winsor_hero_backgroundremoved.webp`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Winsor Maison',
        locale: 'en_US',
        type: 'website',
        images: imageList.slice(0, 6).map((url) => ({
          url,
          alt: `${cleanTitle} — Winsor Luxury Timepiece`,
        })),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [primaryImage],
      },
      keywords: [
        cleanTitle,
        `Winsor ${product.modelNo}`,
        'Winsor watch',
        'Japan movement watch',
        'luxury timepiece Sri Lanka',
        'sports chronographs',
        'Dubai watch brand',
        'fixed MRP watch Sri Lanka',
      ],
    };
  } catch (err) {
    return {
      title: 'Luxury Timepiece Collection | Winsor Maison',
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
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
  let breadcrumbJsonLd: any = null;

  if (id && mongoose.isValidObjectId(id)) {
    try {
      await connectDB();
      const product: any = await Product.findById(id).lean();

      if (product && product.isActive !== false) {
        const cleanTitle = formatCleanTitle(product.title);
        const canonicalUrl = `${baseUrl}/collections/${id}`;

        // Collect all images for Google Product search carousel
        const imageSet = new Set<string>();
        if (product.thumbnail?.url) imageSet.add(product.thumbnail.url);
        if (Array.isArray(product.images)) {
          product.images.forEach((img: any) => {
            if (img?.url) imageSet.add(img.url);
          });
        }
        if (Array.isArray(product.colorVariants)) {
          product.colorVariants.forEach((v: any) => {
            if (v?.image?.url) imageSet.add(v.image.url);
          });
        }

        const fullImages = Array.from(imageSet).map((url) =>
          url.startsWith('http') ? url : `${baseUrl}${url}`
        );
        if (fullImages.length === 0) {
          fullImages.push(`${baseUrl}/winsor_hero_backgroundremoved.webp`);
        }

        // Fetch approved client reviews if present
        let aggregateRating: any = undefined;
        let reviewList: any = undefined;
        try {
          const approvedReviews = await Review.find({
            productId: id,
            status: 'approved',
          })
            .select('rating comment username createdAt')
            .lean();

          if (approvedReviews && approvedReviews.length > 0) {
            const sumRating = approvedReviews.reduce(
              (acc: number, r: any) => acc + (Number(r.rating) || 5),
              0
            );
            const avgRating = (sumRating / approvedReviews.length).toFixed(1);
            aggregateRating = {
              '@type': 'AggregateRating',
              ratingValue: avgRating,
              reviewCount: approvedReviews.length,
              bestRating: '5',
              worstRating: '1',
            };
            reviewList = approvedReviews.slice(0, 5).map((r: any) => ({
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: r.username || 'Verified Client',
              },
              datePublished: r.createdAt
                ? new Date(r.createdAt).toISOString().split('T')[0]
                : undefined,
              reviewBody: r.comment || 'Exceptional craftsmanship and precision.',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: r.rating || 5,
                bestRating: '5',
                worstRating: '1',
              },
            }));
          }
        } catch {
          // Reviews fetch error non-blocking
        }

        const productDescription = product.description
          ? product.description.replace(/<[^>]*>/g, '').trim()
          : `Discover the ${cleanTitle} (Model #${product.modelNo}) by Winsor. Precision Japan movement timepiece crafted across Dubai, India, and Sri Lanka with 1-year international warranty & nationwide fixed MRP.`;

        productJsonLd = {
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: cleanTitle,
          image: fullImages,
          description: productDescription,
          sku: product.modelNo || id,
          mpn: product.modelNo || id,
          category: 'Watches',
          brand: {
            '@type': 'Brand',
            name: product.brand || 'Winsor',
          },
          countryOfAssembly: ['AE', 'IN', 'LK'],
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'LKR',
            price: product.price,
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            itemCondition: 'https://schema.org/NewCondition',
            availability: product.isSoldOut
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'Winsor Maison',
              url: baseUrl,
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'LK',
              returnPolicyCategory:
                'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 14,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0',
                currency: 'LKR',
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'LK',
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 0,
                  maxValue: 1,
                  unitCode: 'DAY',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 3,
                  unitCode: 'DAY',
                },
              },
            },
          },
          ...(aggregateRating && { aggregateRating }),
          ...(reviewList && reviewList.length > 0 && { review: reviewList }),
        };

        breadcrumbJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: baseUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Collections',
              item: `${baseUrl}/collections`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: cleanTitle,
              item: canonicalUrl,
            },
          ],
        };
      }
    } catch (e) {
      // Ignore structured data error on fallback
    }
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetailsClient id={id} />
    </>
  );
}
