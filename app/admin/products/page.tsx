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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Products
          </h1>
          <p className="font-['Jost'] text-[#1a1209]/60 mt-1">
            Manage your product inventory ({filteredProducts.length} products)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-6 py-3 bg-gradient-to-r from-[#1a1209] to-[#2a1d10] text-[#faf7f0] font-['Jost'] font-medium rounded-lg hover:from-[#2a1d10] hover:to-[#3a2815] transition-all flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209]">Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-[#8B6914] hover:text-[#1a1209] font-['Jost']"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search products..."
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Model Number
            </label>
            <input
              type="text"
              value={filters.modelNo}
              onChange={(e) => setFilters({ ...filters, modelNo: e.target.value })}
              placeholder="e.g., WS:2019"
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Min Price (LKR)
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Max Price (LKR)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="1000000"
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Gift Category
            </label>
            <select
              value={filters.giftCategory}
              onChange={(e) => setFilters({ ...filters, giftCategory: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
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
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Collection
            </label>
            <select
              value={filters.collectionSection}
              onChange={(e) => setFilters({ ...filters, collectionSection: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
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
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
              Stock Status
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="sold-out">Sold Out</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#1a1209]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
              <tr>
                <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1209]/5">
              {filteredProducts.map((product) => {
                const totalStock = getTotalStock(product);
                const isSoldOut = product.isSoldOut || totalStock === 0;

                return (
                  <tr key={product._id} className="hover:bg-[#faf7f0]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#faf7f0] overflow-hidden flex-shrink-0 border border-[#1a1209]/10">
                          <img
                            src={product.thumbnail.url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-['Jost'] font-medium text-[#1a1209] truncate max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="font-['Jost'] text-xs text-[#1a1209]/60">
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-['Jost'] text-sm text-[#1a1209] font-medium">
                        {product.modelNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-['Jost'] text-sm font-semibold text-[#8B6914]">
                        LKR {product.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isSoldOut ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-['Jost'] font-semibold bg-red-100 text-red-700 border border-red-200">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="font-['Jost'] text-sm text-green-600 font-medium">
                          {totalStock} units
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleStatus(product)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-['Jost'] font-medium transition-colors ${
                            product.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => toggleSoldOut(product)}
                          disabled={totalStock === 0}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-['Jost'] font-medium transition-colors disabled:opacity-50 ${
                            isSoldOut
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isSoldOut ? 'Sold Out' : 'Mark Sold Out'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {product._id && (
                          <>
                            <Link
                              href={`/products/${product._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-[#8B6914] hover:bg-[#8B6914]/10 rounded transition-colors"
                              title="View Product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            
                            <Link
                              href={`/admin/products/edit/${product._id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            
                            <button
                              onClick={() => product._id && handleDelete(product._id, product.title)}
                              disabled={deletingId === product._id || !product._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Product"
                            >
                              {deletingId === product._id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          <div className="text-center py-16">
            <div className="text-[#1a1209]/30 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-[#1a1209]/60 font-['Jost'] text-lg">No products found</p>
            <p className="text-[#1a1209]/40 font-['Jost'] text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}