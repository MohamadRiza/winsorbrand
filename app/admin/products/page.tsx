'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { IProduct, CollectionSection } from '@/types';

interface FilterState {
  search: string;
  modelNo: string;
  minPrice: string;
  maxPrice: string;
  giftCategory: string;
  collectionSection: string;
  status: string;
  stockStatus: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    modelNo: '',
    minPrice: '',
    maxPrice: '',
    giftCategory: '',
    collectionSection: '',
    status: 'all',
    stockStatus: 'all',
  });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [giftCategories, setGiftCategories] = useState<Array<{ _id: string; slug: string; label: string; emoji: string }>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/gift-categories'),
      ]);

      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const productsData = await productsRes.json();
      setProducts(productsData.data || []);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setGiftCategories(categoriesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid response');
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to delete product');
      }

      toast.success(`"${title}" deleted successfully`);
      setProducts(products.filter(p => p._id !== id));
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (product: IProduct) => {
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setProducts(products.map(p => 
        p._id === product._id ? { ...p, isActive: !p.isActive } : p
      ));

      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update status');
    }
  };

  const toggleSoldOut = async (product: IProduct) => {
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSoldOut: !product.isSoldOut }),
      });

      if (!res.ok) throw new Error('Failed to update sold out status');

      setProducts(products.map(p => 
        p._id === product._id ? { ...p, isSoldOut: !p.isSoldOut } : p
      ));

      toast.success(`Product marked as ${!product.isSoldOut ? 'SOLD OUT' : 'In Stock'}`);
    } catch (error: any) {
      console.error('Toggle sold out error:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const totalStock = product.colorVariants.reduce((sum, v) => sum + v.qty, 0);

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.modelNo && !product.modelNo.toLowerCase().includes(filters.modelNo.toLowerCase())) {
        return false;
      }

      if (filters.minPrice && product.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && product.price > Number(filters.maxPrice)) return false;

      if (filters.giftCategory && !product.giftCategories.includes(filters.giftCategory)) {
        return false;
      }

      if (filters.collectionSection && !product.collectionSections.includes(filters.collectionSection as CollectionSection)) {
        return false;
      }

      if (filters.status === 'active' && !product.isActive) return false;
      if (filters.status === 'inactive' && product.isActive) return false;

      if (filters.stockStatus === 'in-stock' && (totalStock === 0 || product.isSoldOut)) return false;
      if (filters.stockStatus === 'sold-out' && totalStock > 0 && !product.isSoldOut) return false;

      return true;
    });
  }, [products, filters]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Slice list for pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  const resetFilters = () => {
    setFilters({
      search: '',
      modelNo: '',
      minPrice: '',
      maxPrice: '',
      giftCategory: '',
      collectionSection: '',
      status: 'all',
      stockStatus: 'all',
    });
  };

  const getTotalStock = (product: IProduct) => {
    return product.colorVariants.reduce((sum, variant) => sum + variant.qty, 0);
  };

  const collectionSections: CollectionSection[] = ['sports', 'new', 'luxury', 'limited', 'bestsellers'];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(139,105,20,0.2)',
          borderTopColor: '#8B6914',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px', color: '#1a1209' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '32px',
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.1,
          }}>
            Products
          </h1>
          <p style={{
            fontSize: '13.5px',
            color: 'rgba(26,18,9,0.5)',
            margin: '4px 0 0',
          }}>
            Manage your product inventory ({filteredProducts.length} products)
          </p>
        </div>
        
        <Link
          href="/admin/products/new"
          style={{
            background: '#1a1209',
            color: '#faf7f0',
            border: '1px solid #8B6914',
            padding: '10px 20px',
            borderRadius: '8px',
            fontFamily: "'Jost', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(26,18,9,0.15)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2c1d0e'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1a1209'}
        >
          <span style={{ color: '#c9a14a', fontWeight: 'bold', fontSize: '15px' }}>+</span> Add Product
        </Link>
      </div>

      {/* Filters Container */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(26,18,9,0.08)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, letterSpacing: '0.04em' }}>Filters</h3>
          <button
            onClick={resetFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8B6914',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1a1209'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8B6914'}
          >
            Reset Filters ↻
          </button>
        </div>

        {/* Filters Form Row 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search products..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  backgroundColor: '#fbf9f4',
                  border: '1px solid rgba(26,18,9,0.12)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: "'Jost', sans-serif",
                }}
              />
              <svg 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,18,9,0.3)' }} 
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Model Number
            </label>
            <input
              type="text"
              value={filters.modelNo}
              onChange={(e) => setFilters({ ...filters, modelNo: e.target.value })}
              placeholder="e.g., WS:2019"
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Min Price (LKR)
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Max Price (LKR)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="1000000"
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Filters Form Row 2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Gift Category
            </label>
            <select
              value={filters.giftCategory}
              onChange={(e) => setFilters({ ...filters, giftCategory: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              <option value="">All Categories</option>
              {giftCategories.map(cat => (
                <option key={cat._id} value={cat.slug}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Collection
            </label>
            <select
              value={filters.collectionSection}
              onChange={(e) => setFilters({ ...filters, collectionSection: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              <option value="">All Collections</option>
              {collectionSections.map(section => (
                <option key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(26,18,9,0.5)', marginBottom: '6px' }}>
              Stock Status
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#fbf9f4',
                border: '1px solid rgba(26,18,9,0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="sold-out">Sold Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card Container */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(26,18,9,0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf7f0', borderBottom: '1px solid rgba(26,18,9,0.08)' }}>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)' }}>
                  Product
                </th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)' }}>
                  Model
                </th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)' }}>
                  Price
                </th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)' }}>
                  Stock
                </th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)' }}>
                  Status
                </th>
                <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(26,18,9,0.7)', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {paginatedProducts.map((product) => {
                const totalStock = getTotalStock(product);
                const isSoldOut = product.isSoldOut || totalStock === 0;

                return (
                  <tr key={product._id} className="table-row" style={{ borderBottom: '1px solid rgba(26,18,9,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#faf7f0',
                          border: '1px solid rgba(26,18,9,0.06)',
                          flexShrink: 0,
                        }}>
                          <img
                            src={product.thumbnail.url}
                            alt={product.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1a1209', fontSize: '13.5px' }}>
                            {product.title}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(26,18,9,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 500, color: '#1a1209' }}>
                      {product.modelNo}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#8B6914', fontFamily: "'Jost', sans-serif" }}>
                      LKR {product.price.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {isSoldOut ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          backgroundColor: 'rgba(231,76,60,0.08)',
                          color: '#e74c3c',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(231,76,60,0.15)',
                        }}>
                          ✕ SOLD OUT
                        </span>
                      ) : (
                        <span style={{ color: '#2ecc71', fontWeight: 500 }}>
                          {totalStock} units
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                        <button
                          onClick={() => toggleStatus(product)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: product.isActive ? 'rgba(46,204,113,0.08)' : 'rgba(127,140,141,0.08)',
                            color: product.isActive ? '#27ae60' : '#7f8c8d',
                            border: product.isActive ? '1px solid rgba(46,204,113,0.15)' : '1px solid rgba(127,140,141,0.15)',
                            cursor: 'pointer',
                          }}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => toggleSoldOut(product)}
                          disabled={totalStock === 0}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: isSoldOut ? 'rgba(231,76,60,0.08)' : 'rgba(52,152,219,0.08)',
                            color: isSoldOut ? '#e74c3c' : '#3498db',
                            border: isSoldOut ? '1px solid rgba(231,76,60,0.15)' : '1px solid rgba(52,152,219,0.15)',
                            cursor: totalStock === 0 ? 'not-allowed' : 'pointer',
                            opacity: totalStock === 0 ? 0.5 : 1,
                          }}
                        >
                          {isSoldOut ? 'Sold Out' : 'Mark Sold Out'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {product._id && (
                          <>
                            <Link
                              href={`/products/${product._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                color: '#8B6914',
                                border: '1px solid rgba(139,105,20,0.15)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(139,105,20,0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="View Product"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            
                            <Link
                              href={`/admin/products/edit/${product._id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                color: '#3498db',
                                border: '1px solid rgba(52,152,219,0.15)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(52,152,219,0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Edit Product"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            
                            <button
                              onClick={() => product._id && handleDelete(product._id, product.title)}
                              disabled={deletingId === product._id || !product._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                color: '#e74c3c',
                                border: '1px solid rgba(231,76,60,0.15)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: deletingId === product._id ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Delete Product"
                            >
                              {deletingId === product._id ? (
                                <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ color: 'rgba(26,18,9,0.2)', marginBottom: '16px' }}>
              <svg style={{ margin: '0 auto' }} width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p style={{ color: 'rgba(26,18,9,0.6)', fontSize: '18px', margin: 0 }}>No products found</p>
            <p style={{ color: 'rgba(26,18,9,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(26,18,9,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#faf7f0',
          }}>
            <span style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)' }}>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredProducts.length)} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 24px 6px 12px',
                    backgroundColor: '#fff',
                    border: '1px solid rgba(26,18,9,0.12)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: "'Jost', sans-serif",
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              {/* Navigation Arrows & Numbers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: '1px solid rgba(26,18,9,0.1)',
                    backgroundColor: '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: '13px',
                  }}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: '1px solid ' + (isActive ? '#8B6914' : 'rgba(26,18,9,0.1)'),
                        backgroundColor: isActive ? '#8B6914' : '#fff',
                        color: isActive ? '#fff' : '#1a1209',
                        fontWeight: isActive ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: '1px solid rgba(26,18,9,0.1)',
                    backgroundColor: '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: '13px',
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .table-row:hover {
          background-color: rgba(26,18,9,0.015) !important;
        }
      `}</style>
    </div>
  );
}