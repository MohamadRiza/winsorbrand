// app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { IProduct } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/product/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((product) => {
    if (filter === 'active') return product.isActive;
    if (filter === 'inactive') return !product.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Products
          </h1>
          <p className="font-['Jost'] text-[#1a1209]/60 mt-1">
            Manage your product inventory
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-6 py-3 bg-[#1a1209] text-[#faf7f0] font-['Jost'] font-medium rounded-lg hover:bg-[#8B6914] transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {['all', 'active', 'inactive'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-['Jost'] text-sm capitalize transition-colors ${
              filter === f
                ? 'bg-[#8B6914] text-[#faf7f0]'
                : 'bg-white text-[#1a1209]/60 hover:bg-[#faf7f0]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#1a1209]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
              <tr>
                <th className="px-6 py-4 text-left font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Product
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Model
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Price
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Stock
                </th>
                <th className="px-6 py-4 text-left font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Status
                </th>
                <th className="px-6 py-4 text-right font-['Jost'] text-sm font-medium text-[#1a1209]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1209]/5">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-[#faf7f0]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#faf7f0] overflow-hidden">
                        <img
                          src={product.thumbnail.url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-['Jost'] font-medium text-[#1a1209]">
                          {product.title}
                        </p>
                        <p className="font-['Jost'] text-sm text-[#1a1209]/60">
                          {product.brand}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-['Jost'] text-[#1a1209]">
                    {product.modelNo}
                  </td>
                  <td className="px-6 py-4 font-['Jost'] text-[#1a1209]">
                    LKR {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-['Jost'] text-[#1a1209]">
                    {product.colorVariants.reduce((sum, v) => sum + v.qty, 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-['Jost'] ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product._id}`}
                        className="px-3 py-1 text-sm font-['Jost'] text-[#8B6914] hover:bg-[#8B6914]/10 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id!)}
                        className="px-3 py-1 text-sm font-['Jost'] text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-[#1a1209]/40 font-['Jost']">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}