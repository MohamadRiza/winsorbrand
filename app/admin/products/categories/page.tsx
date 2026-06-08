'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface GiftCategory {
  _id: string;
  slug: string;
  label: string;
  emoji: string;
  sortOrder: number;
  isActive: boolean;
}

const POPULAR_EMOJIS = [
  '🎁', '🕌', '🎉', '💖', '🎄', '🎓', '👩', '🐣', '👩‍👧‍👦', '👨‍👧‍👦', '🌾', '🌞', '🐘', '🌹', '🎂', '🏆', '💍', '👔', '👗', '🎖️', '🎈', '🎆', '🥂', '🕯️', '🍪', '🔔'
];

const OCCASION_PRESETS = [
  { label: 'Eid', emoji: '🕌', sortOrder: 1 },
  { label: 'New Year', emoji: '🎉', sortOrder: 2 },
  { label: "Valentine's Day", emoji: '💖', sortOrder: 3 },
  { label: 'Christmas', emoji: '🎄', sortOrder: 4 },
  { label: 'Graduation', emoji: '🎓', sortOrder: 5 },
  { label: "Women's Day", emoji: '👩', sortOrder: 6 },
  { label: 'Easter Sunday', emoji: '🐣', sortOrder: 7 },
  { label: "Mother's Day", emoji: '👩‍👧‍👦', sortOrder: 8 },
  { label: "Father's Day", emoji: '👨‍👧‍👦', sortOrder: 9 },
  { label: 'Thai Pongal', emoji: '🌾', sortOrder: 10 },
  { label: 'Sinhala & Tamil New Year', emoji: '🌞', sortOrder: 11 },
  { label: 'Esala Perahera', emoji: '🐘', sortOrder: 12 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<GiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    label: '',
    emoji: '🎁',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // ✅ Fetch all including inactive categories for admin
      const res = await fetch('/api/gift-categories?all=true');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId 
        ? `/api/gift-categories/${editingId}`
        : '/api/gift-categories';
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      toast.success(editingId ? 'Category updated' : 'Category created');
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: GiftCategory) => {
    setEditingId(category._id);
    setFormData({
      label: category.label,
      emoji: category.emoji,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete category "${label}"? This will hide the category from customer pages without deleting products.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/gift-categories/${id}`, { method: 'DELETE' });
      
      if (!res.ok) throw new Error('Failed to delete category');

      toast.success('Category hidden successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      label: '',
      emoji: '🎁',
      sortOrder: 0,
      isActive: true,
    });
  };

  const applyPreset = (preset: { label: string; emoji: string; sortOrder: number }) => {
    setFormData({
      label: preset.label,
      emoji: preset.emoji,
      sortOrder: preset.sortOrder,
      isActive: true,
    });
    toast.success(`Occasion preset "${preset.label}" applied!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        .preset-badge {
          transition: all 0.2s ease;
          border: 1px solid rgba(26, 18, 9, 0.08);
        }
        .preset-badge:hover {
          border-color: #8B6914;
          background-color: rgba(139, 105, 20, 0.05);
          transform: translateY(-1px);
        }
        .sb-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sb-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 105, 20, 0.2);
          border-radius: 4px;
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
          Gift Categories
        </h1>
        <p className="font-['Jost'] text-[#1a1209]/60 mt-1">
          Manage gift occasion categories ({categories.length} categories total)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form and Presets */}
        <div className="lg:col-span-1 space-y-6">
          {/* Occasion Templates Presets */}
          <div className="bg-white rounded-xl border border-[#1a1209]/10 p-5">
            <h3 className="font-['Jost'] font-semibold text-sm text-[#1a1209] mb-3 uppercase tracking-wider text-[#8B6914]">
              Occasion Templates
            </h3>
            <p className="text-xs text-[#1a1209]/50 mb-4 font-['Jost']">
              Click any default preset to auto-fill the form details below.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OCCASION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="preset-badge p-2 bg-[#fbf9f4] rounded-lg text-left flex items-center gap-2 text-xs font-['Jost'] text-[#1a1209]"
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="truncate font-medium">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6 sticky top-6">
            <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">
              {editingId ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Valentine's Day"
                  required
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                  Emoji Icon
                </label>
                
                {/* Custom Keyboard/Paste Field with Big Scale Preview */}
                <div className="flex gap-3 mb-3">
                  <div className="w-14 h-14 bg-[#faf7f0] border border-[#1a1209]/15 rounded-lg flex items-center justify-center text-3xl shadow-inner select-none shrink-0">
                    {formData.emoji || '🎁'}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="Paste emoji or type..."
                      className="w-full h-14 px-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-lg text-center focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                    />
                  </div>
                </div>

                {/* Popular Presets Picker */}
                <p className="text-[10px] font-semibold tracking-[0.1em] text-[#1a1209]/40 uppercase mb-2">
                  Or select popular emoji
                </p>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-[#faf7f0] rounded-lg border border-[#1a1209]/5 sb-scrollbar">
                  {POPULAR_EMOJIS.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`p-1 text-2xl rounded-lg border transition-all ${
                        formData.emoji === emoji
                          ? 'border-[#8B6914] bg-[#8B6914]/10 scale-105 shadow-sm'
                          : 'border-transparent bg-white hover:border-[#8B6914]/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
                />
                <p className="text-xs text-[#1a1209]/40 mt-1 font-['Jost']">Lower numbers appear first</p>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
                />
                <label htmlFor="isActive" className="text-sm font-['Jost'] text-[#1a1209] cursor-pointer select-none">
                  Active (Visible on website)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-[#1a1209]/20 text-[#1a1209] rounded-lg hover:bg-[#1a1209]/5 transition-colors font-['Jost'] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#1a1209] text-white rounded-lg hover:bg-[#8B6914] transition-colors font-['Jost'] text-sm disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#1a1209]/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                  <tr>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      Sort Order
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
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-[#faf7f0]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl select-none">{category.emoji}</span>
                          <span className="font-['Jost'] font-medium text-[#1a1209]">
                            {category.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-[#8B6914] bg-[#faf7f0] px-2 py-1 rounded border border-[#1a1209]/5 font-mono">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-['Jost'] text-sm text-[#1a1209]">
                          {category.sortOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-['Jost'] font-medium ${
                          category.isActive
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category._id, category.label)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-[#1a1209]/60 font-['Jost'] text-lg">No categories yet</p>
                <p className="text-[#1a1209]/40 font-['Jost'] text-sm mt-1">Create your first gift category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}