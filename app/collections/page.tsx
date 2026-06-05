'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/app/context/CurrencyContext';
import { IProduct, IGiftCategory, CollectionSection } from '@/types';

// Constants for Collection Sections
const SECTIONS: { key: CollectionSection; label: string }[] = [
  { key: 'new', label: 'New Arrivals' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'sports', label: 'Sports' },
  { key: 'limited', label: 'Limited Edition' },
  { key: 'bestsellers', label: 'Best Sellers' },
];

export default function CollectionsPage() {
  const { convertPrice } = useCurrency();

  // API States
  const [products, setProducts] = useState<IProduct[]>([]);
  const [giftCategories, setGiftCategories] = useState<IGiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'gents' | 'ladies'>('all');
  const [selectedSection, setSelectedSection] = useState<CollectionSection | 'all'>('all');
  const [selectedGift, setSelectedGift] = useState<string | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');

  // Fetch products and categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/gift-categories'),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.success) {
          setProducts(prodData.data || []);
        } else {
          throw new Error(prodData.error || 'Failed to fetch products');
        }

        if (catData.success) {
          setGiftCategories(catData.data || []);
        } else {
          throw new Error(catData.error || 'Failed to fetch categories');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to determine product gender (Gents / Ladies / Unisex)
  const getProductGender = (product: IProduct): 'Gents' | 'Ladies' | 'Unisex' => {
    const specs = product.specifications || {};
    for (const key of Object.keys(specs)) {
      if (key.toLowerCase() === 'gender') {
        const val = specs[key].toLowerCase();
        if (val.includes('lady') || val.includes('women') || val.includes('female') || val.includes('ladies')) {
          return 'Ladies';
        }
        if (val.includes('gent') || val.includes('men') || val.includes('male') || val.includes('gents')) {
          return 'Gents';
        }
        return 'Unisex';
      }
    }

    // Fallbacks based on title or specs
    const titleLower = product.title.toLowerCase();
    const descLower = product.description.toLowerCase();
    if (
      titleLower.includes('ladies') || 
      titleLower.includes('women') || 
      titleLower.includes('diamond') || 
      descLower.includes('ladies') || 
      descLower.includes('women')
    ) {
      return 'Ladies';
    }

    // Default to Gents for the standard classic/sport watches
    return 'Gents';
  };

  // Filtered & Sorted timepieces
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // 2. Gender Filter
    if (selectedGender !== 'all') {
      result = result.filter(p => {
        const gender = getProductGender(p).toLowerCase();
        if (selectedGender === 'gents') return gender === 'gents' || gender === 'unisex';
        if (selectedGender === 'ladies') return gender === 'ladies' || gender === 'unisex';
        return true;
      });
    }

    // 3. Collection Section Filter
    if (selectedSection !== 'all') {
      result = result.filter(p => p.collectionSections?.includes(selectedSection));
    }

    // 4. Gift Category Filter
    if (selectedGift !== 'all') {
      result = result.filter(p => p.giftCategories?.includes(selectedGift));
    }

    // 5. Price Sorting
    if (priceSort === 'low-to-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-to-low') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedGender, selectedSection, selectedGift, priceSort]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGender('all');
    setSelectedSection('all');
    setSelectedGift('all');
    setPriceSort('none');
  };

  if (error) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#1a1209', marginBottom: '16px' }}>Connection Error</h2>
          <p style={{ color: 'rgba(26,18,9,0.6)', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: '#8B6914', color: '#fff', border: 'none', padding: '12px 28px', fontFamily: "'Jost', sans-serif", fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        
        .col-container {
          background-color: #faf7f0;
          min-height: 100vh;
          padding: 120px 40px 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }
        .col-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .col-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .col-hero p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-style: italic;
          color: rgba(26, 18, 9, 0.6);
          letter-spacing: 0.05em;
        }
        
        /* GENDER FILTER HEADER */
        .gender-header-row {
          display: flex;
          gap: 24px;
          margin: 0 auto 36px;
          max-width: 1400px;
          width: 100%;
        }
        .gender-header-card {
          flex: 1;
          height: 240px;
          position: relative;
          background-position: center;
          background-size: cover;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s;
          border: 2px solid transparent;
        }
        .gender-header-card.active {
          border-color: #8B6914;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.18);
        }
        .gender-header-card:hover {
          transform: scale(1.015);
        }
        .gender-header-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(26, 18, 9, 0.05) 0%, rgba(26, 18, 9, 0.55) 100%);
          transition: background 0.3s;
        }
        .gender-header-card:hover .gender-header-overlay {
          background: linear-gradient(to bottom, rgba(26, 18, 9, 0.02) 0%, rgba(26, 18, 9, 0.65) 100%);
        }
        .gender-header-content {
          position: absolute;
          bottom: 24px;
          left: 28px;
          color: #fff;
          z-index: 2;
        }
        .gender-header-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 400;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }
        .gender-header-content span {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.85;
          border-bottom: 1px solid rgba(255, 255, 255, 0.4);
          padding-bottom: 2px;
        }

        /* COLLECTION CAPSULES FILTER */
        .models-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          margin: 0 auto 36px;
          max-width: 1400px;
          width: 100%;
        }
        .model-filter-btn {
          background: #fff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          color: #1a1209;
          padding: 10px 22px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .model-filter-btn.active {
          background: #8B6914;
          border-color: #8B6914;
          color: #fff;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.2);
        }
        .model-filter-btn:hover:not(.active) {
          border-color: #8B6914;
          color: #8B6914;
          background: rgba(139, 105, 20, 0.03);
        }

        /* TOOLBAR FILTER CONTROLS */
        .col-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          margin: 0 auto 36px;
          max-width: 1400px;
          width: 100%;
          background: rgba(255, 255, 255, 0.45);
          padding: 14px 20px;
          border: 1px solid rgba(26, 18, 9, 0.04);
          border-radius: 6px;
        }
        .search-wrapper {
          position: relative;
          flex-grow: 1;
          max-width: 380px;
        }
        .search-input {
          width: 100%;
          background: #fff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 4px;
          padding: 10px 36px 10px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #1a1209;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: #8B6914;
        }
        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(26, 18, 9, 0.4);
          pointer-events: none;
        }
        .toolbar-select {
          background: #fff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 4px;
          padding: 10px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #1a1209;
          cursor: pointer;
          outline: none;
          min-width: 160px;
          transition: border-color 0.2s;
        }
        .toolbar-select:focus {
          border-color: #8B6914;
        }
        .toolbar-reset-btn {
          background: none;
          border: 1px solid rgba(26, 18, 9, 0.12);
          color: #1a1209;
          padding: 10px 20px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }
        .toolbar-reset-btn:hover {
          background: #1a1209;
          color: #fff;
          border-color: #1a1209;
        }

        /* 4-COLUMN PRODUCT GRID */
        .product-catalog {
          max-width: 1400px;
          margin: 0 auto;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
        }
        .watch-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          position: relative;
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(26, 18, 9, 0.03);
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .watch-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139, 105, 20, 0.15);
          box-shadow: 0 16px 36px rgba(26, 18, 9, 0.04);
        }
        .watch-img-container {
          position: relative;
          aspect-ratio: 1;
          width: 100%;
          background-color: rgba(26, 18, 9, 0.02);
          overflow: hidden;
        }
        .watch-img {
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .watch-card:hover .watch-img {
          transform: scale(1.06);
        }
        .watch-sticker {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #8B6914;
          color: #fff;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 2px;
          z-index: 5;
        }
        .watch-soldout {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #1a1209;
          color: #fff;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 2px;
          z-index: 5;
        }
        .watch-info {
          padding: 18px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .watch-gender {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(26, 18, 9, 0.4);
          margin-bottom: 6px;
        }
        .watch-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 500;
          line-height: 1.25;
          margin-bottom: 8px;
          color: #1a1209;
        }
        .watch-price {
          font-size: 13.5px;
          font-weight: 500;
          color: #8B6914;
          margin-top: auto;
        }
        .skeleton-card {
          aspect-ratio: 0.8;
          background: linear-gradient(90deg, rgba(26, 18, 9, 0.02) 25%, rgba(26, 18, 9, 0.05) 50%, rgba(26, 18, 9, 0.02) 75%);
          background-size: 200% 100%;
          animation: loading-shimmer 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes loading-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }
        
        @media (max-width: 768px) {
          .col-container {
            padding: 110px 16px 60px;
          }
          .col-hero {
            text-align: left;
            margin-bottom: 20px;
          }
          .col-hero h1 {
            font-size: 24px;
            margin-bottom: 4px;
          }
          .col-hero p {
            font-size: 13px;
          }
          .gender-header-row {
            flex-direction: row;
            gap: 12px;
            margin-bottom: 24px;
          }
          .gender-header-card {
            height: 120px;
            min-height: 120px;
            flex: 1;
          }
          .gender-header-content {
            bottom: 12px;
            left: 16px;
          }
          .gender-header-content h2 {
            font-size: 18px;
            margin-bottom: 0px;
          }
          .gender-header-content span {
            font-size: 8px;
            letter-spacing: 0.08em;
          }
          .models-filter-row {
            margin-bottom: 24px;
            gap: 8px;
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            justify-content: flex-start;
            padding: 0 4px 12px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .models-filter-row::-webkit-scrollbar {
            display: none;
          }
          .model-filter-btn {
            padding: 8px 16px;
            font-size: 11px;
            flex: 0 0 auto;
            text-align: center;
          }
          .col-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px;
            margin-bottom: 28px;
          }
          .search-wrapper {
            max-width: 100%;
          }
          .toolbar-select {
            width: 100%;
          }
          .toolbar-reset-btn {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .watch-info {
            padding: 14px;
          }
          .watch-title {
            font-size: 16.5px;
          }
        }
        
        @media (max-width: 480px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr); /* Enforces 2 items in a row on mobile */
            gap: 12px;
          }
          .watch-info {
            padding: 10px;
          }
          .watch-title {
            font-size: 15px;
          }
        }
      `}</style>

      <div className="col-container">
        {/* HERO HEADER */}
        <header className="col-hero">
          <h1>THE COLLECTIONS</h1>
          <p>Timeless luxury timepieces, crafted for the connoisseur</p>
        </header>

        {/* GENDER FILTER HEADER CARDS (2 Images) */}
        <div className="gender-header-row">
          <div 
            className={`gender-header-card ${selectedGender === 'gents' ? 'active' : ''}`}
            onClick={() => setSelectedGender(selectedGender === 'gents' ? 'all' : 'gents')}
            style={{
              backgroundImage: "url('https://cms.longines.com/media/3533/download/2col-men-watches-d.jpg?v=1&w=1000')",
            }}
          >
            <div className="gender-header-overlay" />
            <div className="gender-header-content">
              <h2>GENTS</h2>
              <span>Shop Men's Watches</span>
            </div>
          </div>
          <div 
            className={`gender-header-card ${selectedGender === 'ladies' ? 'active' : ''}`}
            onClick={() => setSelectedGender(selectedGender === 'ladies' ? 'all' : 'ladies')}
            style={{
              backgroundImage: "url('https://cms.longines.com/media/3303/download/3col-women-watches-d.jpg?v=1&w=1000')",
            }}
          >
            <div className="gender-header-overlay" />
            <div className="gender-header-content">
              <h2>LADIES</h2>
              <span>Shop Women's Watches</span>
            </div>
          </div>
        </div>

        {/* COLLECTION MODELS CAPSULE BAR (Sports/New/Luxury/Limited/Best Seller) */}
        <div className="models-filter-row">
          <button
            onClick={() => setSelectedSection('all')}
            className={`model-filter-btn ${selectedSection === 'all' ? 'active' : ''}`}
          >
            All Models
          </button>
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => setSelectedSection(selectedSection === sec.key ? 'all' : sec.key)}
              className={`model-filter-btn ${selectedSection === sec.key ? 'active' : ''}`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="col-toolbar">
          {/* Search bar */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search watches..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>

          {/* Gift Occasion Filter */}
          {giftCategories.length > 0 && (
            <select
              value={selectedGift}
              onChange={e => setSelectedGift(e.target.value)}
              className="toolbar-select"
            >
              <option value="all">All Occasions</option>
              {giftCategories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          )}

          {/* Price Sorting */}
          <select
            value={priceSort}
            onChange={e => setPriceSort(e.target.value as any)}
            className="toolbar-select"
          >
            <option value="none">Sort By: Featured</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>

          {/* Results Count */}
          <span style={{ fontSize: '12.5px', color: 'rgba(26, 18, 9, 0.45)', marginLeft: '12px' }} className="hidden md:inline">
            {!loading && `${filteredProducts.length} Timepiece${filteredProducts.length === 1 ? '' : 's'} found`}
          </span>

          {/* Reset button */}
          <button onClick={resetFilters} className="toolbar-reset-btn">
            Reset Filters
          </button>
        </div>

        {/* PRODUCT GRID SECTION */}
        <div className="product-catalog">
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed rgba(26,18,9,0.1)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', marginBottom: '8px' }}>No Watches Found</h3>
              <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px', marginBottom: '16px' }}>Try resetting filters or search terms.</p>
              <button onClick={resetFilters} style={{ background: '#8B6914', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => {
                const gender = getProductGender(product);
                const isSoldOut = product.isSoldOut;

                return (
                  <Link
                    key={product._id}
                    href={`/collections/${product._id}`}
                    className="watch-card"
                  >
                    {/* Badge */}
                    {isSoldOut ? (
                      <span className="watch-soldout">Sold Out</span>
                    ) : product.stickerEnabled && product.stickerText ? (
                      <span className="watch-sticker">{product.stickerText}</span>
                    ) : null}

                    {/* Image */}
                    <div className="watch-img-container">
                      {product.thumbnail?.url && (
                        <Image
                          src={product.thumbnail.url}
                          alt={product.title}
                          fill
                          className="watch-img"
                          sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          priority
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="watch-info">
                      <span className="watch-gender">{gender}</span>
                      <h2 className="watch-title">{product.title}</h2>
                      <span className="watch-price">{convertPrice(product.price)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
