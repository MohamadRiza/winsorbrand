'use client';

import Link from 'next/link';
import Image from 'next/image';
import { IProduct } from '@/types';

interface ProductCardProps {
  product: IProduct;
  convertPrice: (price: number) => string;
  addToCart: (productId: string, quantity: number, colorName?: string, product?: IProduct) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  ratingData?: { averageRating: number; reviewCount: number };
}

export default function ProductCard({
  product,
  convertPrice,
  addToCart,
  toggleWishlist,
  isWishlisted,
  ratingData,
}: ProductCardProps) {
  const isSoldOut = (product as any).isSoldOut || (typeof (product as any).stock === 'number' && (product as any).stock <= 0);
  const avgRating = ratingData?.averageRating || 0;
  const reviewCount = ratingData?.reviewCount || 0;

  // Determine watch thumbnail image
  let imageSrc = '/mens-watch-highlight.png';
  if (product.thumbnail?.url) {
    imageSrc = product.thumbnail.url;
  } else if (typeof product.thumbnail === 'string' && product.thumbnail) {
    imageSrc = product.thumbnail;
  } else if (Array.isArray((product as any).images) && (product as any).images.length > 0) {
    const img0 = (product as any).images[0];
    if (typeof img0 === 'string' && img0) imageSrc = img0;
    else if (img0?.url) imageSrc = img0.url;
  } else if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    const v0 = product.colorVariants[0] as any;
    const variantImgs = v0.images || v0.image;
    if (Array.isArray(variantImgs) && variantImgs.length > 0) {
      const vImg0 = variantImgs[0];
      if (typeof vImg0 === 'string' && vImg0) imageSrc = vImg0;
      else if (vImg0?.url) imageSrc = vImg0.url;
    }
  }

  // Determine badge text
  let badgeText: string | null = null;
  if (isSoldOut) {
    badgeText = 'Sold Out';
  } else if (product.stickerEnabled && product.stickerText) {
    badgeText = product.stickerText;
  } else if (product.collectionSections?.includes('new')) {
    badgeText = 'NEW';
  } else if (product.collectionSections?.includes('bestsellers')) {
    badgeText = 'BEST SELLER';
  } else if (product.collectionSections?.includes('limited')) {
    badgeText = 'LIMITED';
  }

  const material = product.specifications?.Material || 'Stainless Steel';
  const caseSize = product.specifications?.['Case Size'] || product.specifications?.['Case Diameter'] || '40mm';

  return (
    <div className="watch-card-container">
      {/* Image block inside a click Link */}
      <Link href={`/collections/${product._id}`} className="watch-img-container">
        {badgeText && <span className="watch-card-badge">{badgeText}</span>}

        <Image
          src={imageSrc}
          alt={product.title}
          fill
          className="watch-card-image"
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority
        />
      </Link>

      {/* Info & CTA details */}
      <div className="watch-card-info">
        <Link href={`/collections/${product._id}`} className="watch-card-title-link">
          <h3 className="watch-card-title">{product.title}</h3>
          <p className="watch-card-specs">
            {material} - {caseSize}
          </p>
        </Link>

        {/* ⭐ Review Stars */}
        {reviewCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 2px' }}>
            {[1, 2, 3, 4, 5].map(s => {
              const filled = avgRating >= s;
              const half = !filled && avgRating >= s - 0.5;
              return (
                <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={filled ? '#8B6914' : half ? 'url(#half-star)' : 'none'} stroke="#8B6914" strokeWidth="1.5">
                  {half && (
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stopColor="#8B6914" />
                        <stop offset="50%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  )}
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              );
            })}
            <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.45)', fontFamily: "'Jost',sans-serif", fontWeight: 500, marginLeft: '2px' }}>
              {avgRating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '6px 0 2px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.18)" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span style={{ fontSize: '9.5px', color: 'rgba(26,18,9,0.3)', fontFamily: "'Jost',sans-serif", marginLeft: '2px' }}>No reviews</span>
          </div>
        )}

        <div className="watch-card-footer">
          <span className="watch-card-price">{convertPrice(product.price)}</span>
          <div className="watch-card-actions">
            <button
              onClick={() => product._id && toggleWishlist(product._id)}
              className={`card-action-btn ${isWishlisted ? 'active' : ''}`}
              aria-label="Toggle Wishlist"
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {!isSoldOut && (
              <button
                onClick={() => {
                  if (product._id) addToCart(product._id, 1, product.colorVariants?.[0]?.colorName, product);
                }}
                className="card-action-btn highlight"
                aria-label="Add to cart"
                title="Add to Cart"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
