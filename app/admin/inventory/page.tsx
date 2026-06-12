'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

interface ColorVariant {
  _id: string;
  colorName: string;
  colorHex: string;
  qty: number;
  inStock: boolean;
  image?: {
    url: string;
    publicId: string;
  };
}

interface Product {
  _id: string;
  title: string;
  modelNo: string;
  thumbnail: {
    url: string;
    publicId: string;
  };
  colorVariants: ColorVariant[];
  isSoldOut: boolean;
  createdAt: string;
}

interface InventorySettings {
  lowStockThreshold: number;
  outOfStockThreshold: number;
  alertNotificationsEnabled: boolean;
}

interface FlattenedItem {
  productId: string;
  productTitle: string;
  productModelNo: string;
  productThumbnail: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  qty: number;
  inStock: boolean;
  isSaving: boolean;
  isSaved: boolean;
}

export default function InventoryManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<InventorySettings>({
    lowStockThreshold: 10,
    outOfStockThreshold: 0,
    alertNotificationsEnabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'in_stock' | 'low_stock' | 'out_stock'>('all');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings form states
  const [lowStockInput, setLowStockInput] = useState(10);
  const [outOfStockInput, setOutOfStockInput] = useState(0);
  const [alertNotifyInput, setAlertNotifyInput] = useState(true);

  // Local state for quantity adjust (flattened list of timepiece variants)
  const [itemsList, setItemsList] = useState<FlattenedItem[]>([]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const res = await fetch('/api/admin/inventory', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load inventory data');
      const json = await res.json();
      
      if (json.success) {
        setProducts(json.data || []);
        if (json.settings) {
          setSettings(json.settings);
          setLowStockInput(json.settings.lowStockThreshold);
          setOutOfStockInput(json.settings.outOfStockThreshold);
          setAlertNotifyInput(json.settings.alertNotificationsEnabled);
        }

        // Flatten products into variant items list
        const flattened: FlattenedItem[] = [];
        (json.data || []).forEach((prod: Product) => {
          prod.colorVariants.forEach((variant) => {
            flattened.push({
              productId: prod._id,
              productTitle: prod.title,
              productModelNo: prod.modelNo,
              productThumbnail: variant.image?.url || prod.thumbnail.url,
              variantId: variant._id,
              colorName: variant.colorName,
              colorHex: variant.colorHex,
              qty: variant.qty,
              inStock: variant.inStock,
              isSaving: false,
              isSaved: false,
            });
          });
        });
        setItemsList(flattened);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error loading stock information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch('/api/admin/inventory/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockThreshold: lowStockInput,
          outOfStockThreshold: outOfStockInput,
          alertNotificationsEnabled: alertNotifyInput,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save settings');

      if (json.success) {
        setSettings(json.data);
        toast.success('Inventory thresholds updated successfully!');
        setShowSettingsPanel(false);
        fetchInventoryData(); // Refresh list to reflect new thresholds categorizations
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Adjust stock API caller
  const handleUpdateStockQty = async (itemId: string, newQty: number) => {
    // Optimistic UI updates
    setItemsList(prev => prev.map(item => {
      if (item.variantId === itemId) {
        return { ...item, qty: newQty, isSaving: true, isSaved: false };
      }
      return item;
    }));

    const itemObj = itemsList.find(item => item.variantId === itemId);
    if (!itemObj) return;

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: itemObj.productId,
          variantId: itemId,
          qty: newQty,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to adjust stock');

      if (json.success) {
        setItemsList(prev => prev.map(item => {
          if (item.variantId === itemId) {
            return {
              ...item,
              qty: json.data.qty,
              inStock: json.data.inStock,
              isSaving: false,
              isSaved: true
            };
          }
          return item;
        }));

        // Fade out "saved" indicator after 2 seconds
        setTimeout(() => {
          setItemsList(prev => prev.map(item => {
            if (item.variantId === itemId) {
              return { ...item, isSaved: false };
            }
            return item;
          }));
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.message);
      // Revert quantity on fail
      fetchInventoryData();
    }
  };

  // Filtering Logic
  const filteredItems = itemsList.filter(item => {
    // 1. Text Search Filter
    const matchesSearch =
      item.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productModelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colorName.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Tab Filter
    let matchesTab = true;
    if (activeTab === 'in_stock') {
      matchesTab = item.qty > settings.lowStockThreshold;
    } else if (activeTab === 'low_stock') {
      matchesTab = item.qty > settings.outOfStockThreshold && item.qty <= settings.lowStockThreshold;
    } else if (activeTab === 'out_stock') {
      matchesTab = item.qty <= settings.outOfStockThreshold;
    }

    return matchesSearch && matchesTab;
  });

  // Calculate aggregates based on settings
  const totalVariants = itemsList.length;
  const inStockCount = itemsList.filter(item => item.qty > settings.lowStockThreshold).length;
  const lowStockCount = itemsList.filter(item => item.qty > settings.outOfStockThreshold && item.qty <= settings.lowStockThreshold).length;
  const outOfStockCount = itemsList.filter(item => item.qty <= settings.outOfStockThreshold).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
        <p className="text-xs text-[#1a1209]/60 uppercase tracking-widest">Loading Stock Listings…</p>
      </div>
    );
  }

  return (
    <PermissionGate permissions={['inventory_manage']}>
      <div className="space-y-6 font-['Jost'] text-[#1a1209]">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
              Inventory Management
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-1">
              Review stock metrics, configure alert triggers, and replenish timepiece quantities.
            </p>
          </div>
          
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="px-4 py-2.5 border border-[#8B6914]/30 hover:border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914]/5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>{showSettingsPanel ? 'Hide Settings' : 'Threshold Settings'}</span>
          </button>
        </div>

        {/* Configurations Threshold Form Card */}
        {showSettingsPanel && (
          <form 
            onSubmit={handleSaveSettings}
            className="bg-[#fbf9f4] border border-[#8B6914]/20 rounded-xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn"
          >
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={lowStockInput}
                onChange={(e) => setLowStockInput(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
              />
              <span className="text-[10px] text-[#1a1209]/45 mt-1 block">
                Flag warnings when quantities drop to this value.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-2">
                Out of Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={outOfStockInput}
                onChange={(e) => setOutOfStockInput(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
              />
              <span className="text-[10px] text-[#1a1209]/45 mt-1 block">
                Quantity at or below which item is marked empty (Max 5).
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#1a1209]/70 mb-3">
                Dashboard Alert Popup
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase text-[#1a1209]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertNotifyInput}
                    onChange={(e) => setAlertNotifyInput(e.target.checked)}
                    className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4"
                  />
                  <span>Show alert popup on login</span>
                </label>
                
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-[#8B6914] hover:bg-[#c9a14a] disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  {savingSettings ? 'Saving…' : 'Save Config'}
                </button>
              </div>
              <span className="text-[10px] text-[#1a1209]/45 mt-2.5 block">
                Toggles whether admins receive warnings on login.
              </span>
            </div>
          </form>
        )}

        {/* Proximity Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Total Variants</p>
              <p className="text-2xl font-bold font-['Cormorant_Garamond'] mt-1">{totalVariants}</p>
            </div>
            <span className="text-2xl text-[#1a1209]/30">⌚</span>
          </div>

          <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-green-700/60 uppercase">In Stock Items</p>
              <p className="text-2xl font-bold text-green-700 font-['Cormorant_Garamond'] mt-1">{inStockCount}</p>
            </div>
            <span className="text-2xl text-green-700/30">✓</span>
          </div>

          <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-amber-700/60 uppercase">Low Stock Warning</p>
              <p className="text-2xl font-bold text-[#8B6914] font-['Cormorant_Garamond'] mt-1">{lowStockCount}</p>
            </div>
            <span className="text-2xl text-[#8B6914]/30">⚠️</span>
          </div>

          <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-red-700/60 uppercase">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 font-['Cormorant_Garamond'] mt-1">{outOfStockCount}</p>
            </div>
            <span className="text-2xl text-red-600/30">✕</span>
          </div>
        </div>

        {/* Filter Toolbar & Tabs */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search timepiece name or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs placeholder-[#1a1209]/45 focus:outline-none focus:border-[#8B6914]"
              />
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex bg-[#fbf9f4] border border-[#1a1209]/10 rounded-lg p-1 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#1a1209] text-white shadow-sm'
                    : 'text-[#1a1209]/60 hover:text-[#1a1209]'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setActiveTab('in_stock')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'in_stock'
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'text-green-700/70 hover:text-green-700'
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setActiveTab('low_stock')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'low_stock'
                    ? 'bg-[#8B6914] text-white shadow-sm'
                    : 'text-[#8B6914]/80 hover:text-[#8B6914]'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setActiveTab('out_stock')}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'out_stock'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-red-600/80 hover:text-red-600'
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>

        {/* Listings Catalog */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Timepiece / Model</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Variant Details</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Stock Status</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase text-center w-52">Quantity Adjustment</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase w-20">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredItems.map((item) => {
                  const isOutOfStock = item.qty <= settings.outOfStockThreshold;
                  const isLowStock = item.qty > settings.outOfStockThreshold && item.qty <= settings.lowStockThreshold;
                  
                  return (
                    <tr key={item.variantId} className="hover:bg-[#faf7f0]/10 transition-colors">
                      {/* Image & Title */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 bg-[#faf7f0] border border-[#1a1209]/10 rounded overflow-hidden flex-shrink-0 group">
                            <Image
                              src={item.productThumbnail}
                              alt={item.productTitle}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h4 className="font-['Cormorant_Garamond'] text-sm font-bold text-[#1a1209]">
                              {item.productTitle}
                            </h4>
                            <p className="text-[10px] text-[#1a1209]/55 font-mono uppercase tracking-wide mt-0.5">
                              Model: {item.productModelNo}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Variant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="inline-block w-4 h-4 rounded-full border border-[#1a1209]/20"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-xs font-semibold text-[#1a1209]/80 uppercase tracking-wide">
                            {item.colorName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isOutOfStock
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : isLowStock
                              ? 'bg-amber-50 text-[#8B6914] border-amber-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      {/* Adjuster */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={item.qty === 0 || item.isSaving}
                            onClick={() => handleUpdateStockQty(item.variantId, item.qty - 1)}
                            className="w-8 h-8 rounded-lg bg-[#fbf9f4] hover:bg-[#8B6914]/10 disabled:opacity-40 border border-[#1a1209]/15 flex items-center justify-center text-sm font-bold text-[#1a1209] transition-all"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={item.qty}
                            disabled={item.isSaving}
                            onChange={(e) => {
                              const v = e.target.value === '' ? 0 : Number(e.target.value);
                              if (!isNaN(v) && v >= 0) {
                                // Update local value immediately for typing feel
                                setItemsList(prev => prev.map(i => {
                                  if (i.variantId === item.variantId) {
                                    return { ...i, qty: v };
                                  }
                                  return i;
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (!isNaN(v) && v >= 0) {
                                handleUpdateStockQty(item.variantId, v);
                              }
                            }}
                            className="w-16 py-1 border border-[#1a1209]/15 rounded-lg text-center text-xs font-semibold bg-[#fbf9f4] focus:outline-none focus:border-[#8B6914] focus:bg-white"
                          />

                          <button
                            type="button"
                            disabled={item.isSaving}
                            onClick={() => handleUpdateStockQty(item.variantId, item.qty + 1)}
                            className="w-8 h-8 rounded-lg bg-[#fbf9f4] hover:bg-[#8B6914]/10 disabled:opacity-40 border border-[#1a1209]/15 flex items-center justify-center text-sm font-bold text-[#1a1209] transition-all"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Saved indicator */}
                      <td className="px-6 py-4 text-center">
                        {item.isSaving ? (
                          <span className="inline-block w-4 h-4 border-2 border-[#8B6914] border-t-transparent rounded-full animate-spin" />
                        ) : item.isSaved ? (
                          <span className="text-green-600 text-sm font-semibold animate-pulse">✓</span>
                        ) : (
                          <span className="text-[#1a1209]/30 text-xs font-light">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20 bg-white">
              <span className="text-3xl block mb-2">📦</span>
              <h3 className="font-semibold text-sm">No Matching Timepieces Found</h3>
              <p className="text-xs text-[#1a1209]/45 mt-1">
                Refine your query terms or check the tab filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
