'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
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
  originalQty: number;
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
  const [savingAll, setSavingAll] = useState(false);

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

        // Flatten products into variant items list with originalQty tracking
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
              originalQty: variant.qty,
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

  const handleSaveSettings = async (e: FormEvent) => {
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
        fetchInventoryData();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Local Qty Change Handler (0ms instant UI response, dirty flag set)
  const handleLocalQtyChange = (variantId: string, newQty: number) => {
    const validQty = Math.max(0, newQty);
    setItemsList(prev => prev.map(item => {
      if (item.variantId === variantId) {
        return { ...item, qty: validQty, isSaved: false };
      }
      return item;
    }));
  };

  // Save Single Item Variant Stock (Triggered by clicking "Done / Save Qty" button)
  const handleSaveSingleVariantStock = async (variantId: string) => {
    const itemObj = itemsList.find(item => item.variantId === variantId);
    if (!itemObj) return;

    // Indicate saving state
    setItemsList(prev => prev.map(item => item.variantId === variantId ? { ...item, isSaving: true } : item));

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: itemObj.productId,
          variantId: variantId,
          qty: itemObj.qty,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to adjust stock');

      if (json.success) {
        toast.success(`Saved stock for ${itemObj.productTitle} (${itemObj.colorName})`);
        
        setItemsList(prev => prev.map(item => {
          if (item.variantId === variantId) {
            return {
              ...item,
              qty: json.data.qty,
              originalQty: json.data.qty,
              inStock: json.data.inStock,
              isSaving: false,
              isSaved: true
            };
          }
          return item;
        }));

        setTimeout(() => {
          setItemsList(prev => prev.map(item => item.variantId === variantId ? { ...item, isSaved: false } : item));
        }, 2500);
      }
    } catch (err: any) {
      toast.error(err.message);
      setItemsList(prev => prev.map(item => item.variantId === variantId ? { ...item, isSaving: false } : item));
    }
  };

  // Save All Pending Changes (Triggered by Global Sticky Bar)
  const handleSaveAllPendingChanges = async () => {
    const modifiedItems = itemsList.filter(item => item.qty !== item.originalQty);
    if (modifiedItems.length === 0) return;

    setSavingAll(true);
    const toastId = toast.loading(`Saving ${modifiedItems.length} modified stock quantities...`);

    try {
      await Promise.all(
        modifiedItems.map(item =>
          fetch('/api/admin/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              qty: item.qty,
            }),
          })
        )
      );

      toast.dismiss(toastId);
      toast.success(`Successfully saved all ${modifiedItems.length} stock quantity adjustments!`);
      
      setItemsList(prev => prev.map(item => ({
        ...item,
        originalQty: item.qty,
        isSaving: false,
        isSaved: true,
      })));

      setTimeout(() => {
        setItemsList(prev => prev.map(item => ({ ...item, isSaved: false })));
      }, 2500);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to save all changes. Reverting to database values.');
      fetchInventoryData();
    } finally {
      setSavingAll(false);
    }
  };

  // Reset All Pending Local Changes
  const handleResetAllChanges = () => {
    setItemsList(prev => prev.map(item => ({
      ...item,
      qty: item.originalQty,
      isSaved: false,
    })));
    toast.success('Reset all modified quantities to current database stock.');
  };

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return itemsList.filter(item => {
      const matchesSearch =
        item.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productModelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.colorName.toLowerCase().includes(searchQuery.toLowerCase());

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
  }, [itemsList, searchQuery, activeTab, settings]);

  // Modified items count
  const modifiedItemsCount = useMemo(() => {
    return itemsList.filter(i => i.qty !== i.originalQty).length;
  }, [itemsList]);

  // Calculate aggregates based on settings
  const totalVariants = itemsList.length;
  const inStockCount = itemsList.filter(item => item.qty > settings.lowStockThreshold).length;
  const lowStockCount = itemsList.filter(item => item.qty > settings.outOfStockThreshold && item.qty <= settings.lowStockThreshold).length;
  const outOfStockCount = itemsList.filter(item => item.qty <= settings.outOfStockThreshold).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Loading Stock Inventory & Variants…
        </p>
      </div>
    );
  }

  return (
    <PermissionGate permissions={['inventory_manage']}>
      <div className="space-y-6 font-['Jost'] text-[#1a1209] select-none pb-20">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/15 pb-5">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              INVENTORY MANAGEMENT
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-0.5">
              Review stock metrics, adjust timepiece quantities, and save changes to update inventory.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="px-4 py-2.5 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-[#1a1209] hover:text-[#8B6914] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{showSettingsPanel ? 'Hide Thresholds' : 'Threshold Settings'}</span>
            </button>
          </div>
        </div>

        {/* Configurations Threshold Form Card */}
        {showSettingsPanel && (
          <form 
            onSubmit={handleSaveSettings}
            className="bg-white border border-[#8B6914]/25 rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn"
          >
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-2">
                LOW STOCK THRESHOLD
              </label>
              <input
                type="number"
                min="0"
                value={lowStockInput}
                onChange={(e) => setLowStockInput(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm font-mono font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
              />
              <span className="text-[10px] text-[#1a1209]/45 mt-1 block">
                Flag warnings when variant quantities drop to or below this value.
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-2">
                OUT OF STOCK THRESHOLD
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={outOfStockInput}
                onChange={(e) => setOutOfStockInput(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-sm font-mono font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
              />
              <span className="text-[10px] text-[#1a1209]/45 mt-1 block">
                Quantity at or below which item is marked sold out (Max 5).
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[#8B6914] mb-2">
                LOGIN ALERT NOTIFICATIONS
              </label>
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#1a1209] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertNotifyInput}
                    onChange={(e) => setAlertNotifyInput(e.target.checked)}
                    className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4 cursor-pointer"
                  />
                  <span>Alert popup on admin login</span>
                </label>
                
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {savingSettings ? 'Saving…' : 'Save Config'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Professional Tabular Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL VARIANTS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalVariants.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">IN STOCK ITEMS</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{inStockCount.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">LOW STOCK WARNING</p>
            <p className="font-['Jost'] text-3xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{lowStockCount.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">OUT OF STOCK</p>
            <p className="font-['Jost'] text-3xl font-bold text-rose-600 mt-1 tabular-nums font-mono">{outOfStockCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter Toolbar & Segmented Tabs */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-md w-full">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search timepiece name, model number, or color variant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
            />
          </div>

          <div className="flex bg-[#fbf9f4] border border-[#1a1209]/10 rounded-lg p-1 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1a1209] text-white shadow-sm'
                  : 'text-[#1a1209]/60 hover:text-[#1a1209]'
              }`}
            >
              All Items ({totalVariants})
            </button>
            <button
              onClick={() => setActiveTab('in_stock')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'in_stock'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-emerald-800/70 hover:text-emerald-800'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setActiveTab('low_stock')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'low_stock'
                  ? 'bg-[#8B6914] text-white shadow-sm'
                  : 'text-[#8B6914]/80 hover:text-[#8B6914]'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setActiveTab('out_stock')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'out_stock'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600/80 hover:text-rose-600'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Listings Catalog Table */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1209] text-[#f3e3b8]">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">TIMEPIECE / MODEL</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">COLOR VARIANT</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">STOCK STATUS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-center min-w-[280px]">QUANTITY ADJUSTMENT</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-center w-36">SAVE / DONE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredItems.map((item) => {
                  const isOutOfStock = item.qty <= settings.outOfStockThreshold;
                  const isLowStock = item.qty > settings.outOfStockThreshold && item.qty <= settings.lowStockThreshold;
                  const isModified = item.qty !== item.originalQty;
                  
                  return (
                    <tr 
                      key={item.variantId} 
                      className={`transition-colors ${isModified ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-[#faf7f0]/50'}`}
                    >
                      {/* Image & Title */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 bg-[#faf7f0] border border-[#1a1209]/10 rounded-xl overflow-hidden flex-shrink-0 group">
                            <Image
                              src={item.productThumbnail}
                              alt={item.productTitle}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#1a1209]">
                              {item.productTitle}
                            </h4>
                            <p className="text-[11px] text-[#1a1209]/50 font-mono uppercase tracking-wide mt-0.5">
                              Model: {item.productModelNo}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Variant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="inline-block w-4 h-4 rounded-full border border-[#1a1209]/20 shadow-sm"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-xs font-semibold text-[#1a1209]/80 uppercase tracking-wide">
                            {item.colorName}
                          </span>
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLowStock
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Warning' : 'In Stock'}
                        </span>
                      </td>

                      {/* Quantity Adjustment Input Controls */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Decrement Button */}
                          <button
                            type="button"
                            disabled={item.qty === 0 || item.isSaving}
                            onClick={() => handleLocalQtyChange(item.variantId, item.qty - 1)}
                            className="w-8 h-8 rounded-lg bg-[#faf7f0] hover:bg-[#8B6914] hover:text-white disabled:opacity-30 border border-[#1a1209]/15 flex items-center justify-center text-sm font-bold text-[#1a1209] transition-all cursor-pointer"
                            title="Decrease quantity by 1"
                          >
                            -
                          </button>
                          
                          {/* Monospace Direct Input */}
                          <input
                            type="number"
                            min="0"
                            value={item.qty}
                            disabled={item.isSaving}
                            onChange={(e) => {
                              const v = e.target.value === '' ? 0 : Number(e.target.value);
                              handleLocalQtyChange(item.variantId, v);
                            }}
                            className={`w-16 py-1.5 border rounded-lg text-center text-xs font-mono font-bold transition-all ${
                              isModified 
                                ? 'border-[#8B6914] bg-amber-50 text-[#8B6914] ring-2 ring-[#8B6914]/20' 
                                : 'border-[#1a1209]/15 bg-white text-[#1a1209] focus:outline-none focus:border-[#8B6914]'
                            }`}
                          />

                          {/* Increment Button */}
                          <button
                            type="button"
                            disabled={item.isSaving}
                            onClick={() => handleLocalQtyChange(item.variantId, item.qty + 1)}
                            className="w-8 h-8 rounded-lg bg-[#faf7f0] hover:bg-[#8B6914] hover:text-white disabled:opacity-30 border border-[#1a1209]/15 flex items-center justify-center text-sm font-bold text-[#1a1209] transition-all cursor-pointer"
                            title="Increase quantity by 1"
                          >
                            +
                          </button>

                          {/* Quick Presets (+5, +10) */}
                          <div className="flex gap-1 ml-1">
                            <button
                              type="button"
                              disabled={item.isSaving}
                              onClick={() => handleLocalQtyChange(item.variantId, item.qty + 5)}
                              className="px-2 py-1 bg-white hover:bg-[#faf7f0] border border-[#1a1209]/15 rounded-md text-[10px] font-mono font-bold text-[#8B6914] transition-all cursor-pointer"
                              title="Quick add +5 stock"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              disabled={item.isSaving}
                              onClick={() => handleLocalQtyChange(item.variantId, item.qty + 10)}
                              className="px-2 py-1 bg-white hover:bg-[#faf7f0] border border-[#1a1209]/15 rounded-md text-[10px] font-mono font-bold text-[#8B6914] transition-all cursor-pointer"
                              title="Quick add +10 stock"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* ✅ DEDICATED DONE / SAVE BUTTON PER ROW */}
                      <td className="px-6 py-4 text-center">
                        {item.isSaving ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B6914] font-semibold font-mono">
                            <span className="w-3.5 h-3.5 border-2 border-[#8B6914] border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </div>
                        ) : isModified ? (
                          <button
                            type="button"
                            onClick={() => handleSaveSingleVariantStock(item.variantId)}
                            className="px-3.5 py-1.5 bg-[#8B6914] hover:bg-[#1a1209] text-white text-xs font-bold font-mono rounded-lg transition-all shadow-md flex items-center justify-center gap-1 mx-auto cursor-pointer animate-pulse"
                            title="Save stock adjustment to database"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Qty
                          </button>
                        ) : item.isSaved ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full animate-pulse font-mono">
                            ✓ Saved
                          </span>
                        ) : (
                          <span className="text-xs text-[#1a1209]/40 font-mono">✓ In Sync</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16 bg-white">
              <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="font-semibold text-sm text-[#1a1209]">No Matching Timepiece Variants Found</h3>
              <p className="text-xs text-[#1a1209]/45 mt-1">
                Refine your query terms or check the category tab filters.
              </p>
            </div>
          )}
        </div>

        {/* ✅ STICKY FLOATING ACTION BAR FOR PENDING BATCH SAVES */}
        {modifiedItemsCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a1209] text-[#f3e3b8] border border-[#8B6914]/40 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-6 animate-slideUp">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-semibold tracking-wider font-mono">
                {modifiedItemsCount} {modifiedItemsCount === 1 ? 'Variant Qty Modified' : 'Variant Quantities Modified'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetAllChanges}
                disabled={savingAll}
                className="px-4 py-1.5 border border-[#f3e3b8]/20 hover:border-[#f3e3b8] text-xs font-semibold text-[#f3e3b8] rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Discard
              </button>
              
              <button
                type="button"
                onClick={handleSaveAllPendingChanges}
                disabled={savingAll}
                className="px-5 py-2 bg-[#8B6914] hover:bg-white hover:text-[#1a1209] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-mono"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {savingAll ? 'Saving All...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}

      </div>
    </PermissionGate>
  );
}
