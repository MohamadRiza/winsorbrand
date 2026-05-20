'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { IProduct, CollectionSection, WarrantyOption, CloudinaryAsset, ColorVariant } from '@/types';

const PREDEFINED_GIFT_CATEGORIES = [
  { slug: 'mothers-day', label: "Mother's Day", emoji: '👩' },
  { slug: 'valentines-day', label: "Valentine's Day", emoji: '💝' },
  { slug: 'graduation', label: 'Graduation', emoji: '🎓' },
  { slug: 'new-year', label: 'New Year', emoji: '🎉' },
  { slug: 'fathers-day', label: "Father's Day", emoji: '👨' },
  { slug: 'christmas', label: 'Christmas', emoji: '🎄' },
  { slug: 'eid', label: 'Eid', emoji: '🌙' },
];

const EMPTY_ASSET: CloudinaryAsset = { url: '', publicId: '' };

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [giftCategories, setGiftCategories] = useState<Array<{ _id: string; slug: string; label: string; emoji: string }>>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    brand: 'Winsor' as const,
    modelNo: '',
    watchShape: 'Round',
    price: 0,
    description: '',
    warranty: '1_year' as WarrantyOption,
    specifications: {} as Record<string, string>,
    colorVariants: [] as ColorVariant[],
    thumbnail: EMPTY_ASSET,
    images: [] as CloudinaryAsset[],
    collectionSections: [] as CollectionSection[],
    giftCategories: [] as string[],
    isActive: true,
    isSoldOut: false,
    showOnHome: false,
    stickerEnabled: false,
    stickerText: '',
  });

  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchGiftCategories();
  }, []);

  const fetchGiftCategories = async () => {
    try {
      const res = await fetch('/api/gift-categories');
      const data = await res.json();
      if (data.success) setGiftCategories(data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // ✅ Server-side AI description generation
  const generateDescription = async () => {
    if (!formData.title?.trim() || !formData.modelNo?.trim()) {
      toast.error('Please enter product title and model number first');
      return;
    }

    setGeneratingDescription(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          modelNo: formData.modelNo,
          watchShape: formData.watchShape,
          price: formData.price,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(data.error || 'Failed to generate description');
        }
        return;
      }

      if (data.cached) {
        toast.success('Using cached description ✨');
      } else {
        toast.success('Description generated successfully!');
      }
      
      setFormData(prev => ({ ...prev, description: data.description }));
      
    } catch (error: any) {
      console.error('AI Generation error:', error);
      toast.error(error.message || 'Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // ✅ FIXED: Handle multiple file uploads for gallery
  const handleImageUpload = async (files: FileList | File[], type: 'thumbnail' | 'gallery' | 'color', variantIndex?: number) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadingImage(true);
    
    try {
      for (const file of fileArray) {
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64 = reader.result as string;
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  file: base64,
                  type: type === 'color' ? 'colorImage' : type,
                  name: file.name,
                }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Upload failed');

              if (type === 'thumbnail') {
                setFormData(prev => ({ ...prev, thumbnail: data.data }));
              } else if (type === 'gallery') {
                // ✅ Add multiple images to gallery
                setFormData(prev => ({ ...prev, images: [...prev.images, data.data] }));
              } else if (type === 'color' && variantIndex !== undefined) {
                // ✅ Set image for specific color variant
                setFormData(prev => ({
                  ...prev,
                  colorVariants: prev.colorVariants.map((v, i) => 
                    i === variantIndex ? { ...v, image: data.data } : v
                  )
                }));
              }
              toast.success(`Uploaded: ${file.name}`);
              resolve();
            } catch (error: any) {
              toast.error(error.message || 'Upload failed');
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const addColorVariant = () => {
    // ✅ Limit to 10 color variants
    if (formData.colorVariants.length >= 10) {
      toast.error('Maximum 10 color variants allowed');
      return;
    }
    
    const newVariant: ColorVariant = {
      colorName: '',
      colorHex: '#000000',
      qty: 0,
      inStock: false,
      image: undefined,
    };
    setFormData(prev => ({ ...prev, colorVariants: [...prev.colorVariants, newVariant] }));
  };

  const updateColorVariant = (index: number, field: keyof ColorVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant, i) => 
        i === index ? { ...variant, [field]: value, inStock: field === 'qty' ? (value as number) > 0 : variant.inStock } : variant
      ),
    }));
  };

  const removeColorVariant = (index: number) => {
    setFormData(prev => ({ ...prev, colorVariants: prev.colorVariants.filter((_, i) => i !== index) }));
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, [specKey]: specValue } }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const toggleCollectionSection = (section: CollectionSection) => {
    setFormData(prev => {
      const sections = prev.collectionSections;
      const updated = sections.includes(section) ? sections.filter(s => s !== section) : [...sections, section];
      return { ...prev, collectionSections: updated };
    });
  };

  const toggleGiftCategory = (slug: string) => {
    setFormData(prev => {
      const categories = prev.giftCategories;
      const updated = categories.includes(slug) ? categories.filter(c => c !== slug) : [...categories, slug];
      return { ...prev, giftCategories: updated };
    });
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      const slug = customCategory.toLowerCase().trim().replace(/\s+/g, '-');
      if (!formData.giftCategories.includes(slug)) {
        setFormData(prev => ({ ...prev, giftCategories: [...prev.giftCategories, slug] }));
        setCustomCategory('');
        setShowCustomInput(false);
        toast.success(`Added "${customCategory}" category`);
      }
    }
  };

  const getTotalStock = () => formData.colorVariants.reduce((sum, v) => sum + v.qty, 0);

  useEffect(() => {
    const totalStock = getTotalStock();
    if (totalStock === 0 && formData.colorVariants.length > 0) {
      setFormData(prev => ({ ...prev, isSoldOut: true }));
    }
  }, [formData.colorVariants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim() || !formData.modelNo?.trim() || !formData.price || !formData.thumbnail?.url) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.colorVariants.length === 0) {
      toast.error('Please add at least one color variant');
      return;
    }
    if (!formData.description?.trim()) {
      toast.error('Please provide a product description');
      return;
    }

    setLoading(true);
    try {
      // ✅ Clean data before sending to avoid Mongoose validation errors
      const payload = {
        ...formData,
        colorVariants: formData.colorVariants.map(v => ({
          ...v,
          image: (v.image?.url) ? v.image : undefined
        }))
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Create error:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pre-compute disabled state to avoid hydration mismatch
  const isGenerateDisabled = generatingDescription || !formData.title?.trim() || !formData.modelNo?.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">Add New Product</h1>
          <p className="font-['Jost'] text-[#1a1209]/60 mt-1">Create a new luxury timepiece listing</p>
        </div>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-[#1a1209] hover:bg-[#1a1209]/5 rounded-lg font-['Jost'] transition-colors">
          ← Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Product Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Classic Chronograph Gold" required className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Model Number *</label>
              <input type="text" value={formData.modelNo} onChange={(e) => setFormData(prev => ({ ...prev, modelNo: e.target.value }))} placeholder="e.g., WS:2019" required className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Watch Shape *</label>
              <select value={formData.watchShape} onChange={(e) => setFormData(prev => ({ ...prev, watchShape: e.target.value }))} required className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm">
                <option value="Round">Round</option><option value="Square">Square</option><option value="Oval">Oval</option><option value="Rectangular">Rectangular</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Price (LKR) *</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))} placeholder="0" required min="0" className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Warranty</label>
              <select value={formData.warranty} onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value as WarrantyOption }))} className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm">
                <option value="no_warranty">No Warranty</option><option value="3_months">3 Months</option><option value="6_months">6 Months</option><option value="1_year">1 Year</option><option value="2_years">2 Years</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">Description *</label>
                <button 
                  type="button" 
                  onClick={generateDescription} 
                  disabled={isGenerateDisabled}
                  suppressHydrationWarning={true}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#8B6914] to-[#a07d1a] text-white text-xs rounded-lg hover:from-[#6f5410] hover:to-[#8B6914] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-['Jost']"
                >
                  {generatingDescription ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>AI Generate</>
                  )}
                </button>
              </div>
              <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the product features, materials, craftsmanship... or click AI Generate" required rows={5} className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm resize-none" />
              <p className="text-xs text-[#1a1209]/40 mt-1">AI-powered description generation using Gemini (Server-side)</p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Product Images</h3>
          <div className="space-y-4">
            {/* Thumbnail */}
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Thumbnail Image *</label>
              <div className="flex items-center gap-4">
                {formData.thumbnail?.url ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <img src={formData.thumbnail.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, thumbnail: EMPTY_ASSET }))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                    <svg className="w-8 h-8 text-[#1a1209]/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-xs text-[#1a1209]/60">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'thumbnail')} 
                      disabled={uploadingImage} 
                      className="hidden" 
                    />
                  </label>
                )}
                {uploadingImage && <div className="text-sm text-[#8B6914]">Uploading...</div>}
              </div>
            </div>

            {/* Gallery - ✅ FIXED: Multiple file upload */}
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Gallery Images (Max 10)
              </label>
              <div className="flex gap-4 flex-wrap">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.images.length < 10 && (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                    <svg className="w-6 h-6 text-[#1a1209]/40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs text-[#1a1209]/60">Add</span>
                    {/* ✅ FIXED: multiple attribute for batch upload */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'gallery')} 
                      disabled={uploadingImage || formData.images.length >= 10} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-[#1a1209]/40 mt-1">Select multiple files to upload at once (Ctrl/Cmd + Click)</p>
            </div>
          </div>
        </div>

        {/* Color Variants & Stock - ✅ FIXED: Image upload per variant */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Jost'] font-semibold text-[#1a1209]">Color Variants & Stock</h3>
            <button
              type="button"
              onClick={addColorVariant}
              disabled={formData.colorVariants.length >= 10}
              className="px-3 py-1.5 bg-[#8B6914] text-white text-sm rounded-lg hover:bg-[#6f5410] transition-colors disabled:opacity-50"
            >
              + Add Variant (Max 10)
            </button>
          </div>
          <div className="space-y-4">
            {formData.colorVariants.map((variant, idx) => (
              <div key={idx} className="p-4 bg-[#faf7f0] rounded-lg border border-[#1a1209]/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Color Name */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Color Name</label>
                    <input
                      type="text"
                      value={variant.colorName}
                      onChange={(e) => updateColorVariant(idx, 'colorName', e.target.value)}
                      placeholder="e.g., Gold"
                      className="w-full px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm"
                    />
                  </div>
                  
                  {/* Hex Code */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Hex Code</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={variant.colorHex}
                        onChange={(e) => updateColorVariant(idx, 'colorHex', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={variant.colorHex}
                        onChange={(e) => updateColorVariant(idx, 'colorHex', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={variant.qty}
                      onChange={(e) => updateColorVariant(idx, 'qty', Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeColorVariant(idx)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {/* ✅ NEW: Variant Image Upload */}
                <div className="mt-4 pt-4 border-t border-[#1a1209]/10">
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                    Variant Image (Max 6 per variant)
                  </label>
                  <div className="flex items-center gap-4">
                    {variant.image?.url ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1a1209]/10">
                        <img src={variant.image.url} alt={variant.colorName} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateColorVariant(idx, 'image', undefined)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                        <svg className="w-5 h-5 text-[#1a1209]/40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] text-[#1a1209]/60">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'color', idx)}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                    {variant.image?.url && (
                      <span className="text-xs text-[#1a1209]/60">
                        Image for {variant.colorName || 'this variant'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {formData.colorVariants.length === 0 && (
              <p className="text-sm text-[#1a1209]/40 text-center py-4">No color variants added</p>
            )}
          </div>

          {/* Total Stock Display */}
          {formData.colorVariants.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#faf7f0] to-[#f5f2e8] rounded-lg border border-[#8B6914]/20">
              <div className="flex items-center justify-between">
                <span className="font-['Jost'] text-sm font-semibold text-[#1a1209]">Total Stock:</span>
                <span className={`font-['Jost'] text-lg font-bold ${getTotalStock() === 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {getTotalStock()} units
                </span>
              </div>
              {getTotalStock() === 0 && (
                <p className="text-xs text-red-600 mt-1 font-['Jost']">⚠️ Product will be marked as SOLD OUT</p>
              )}
            </div>
          )}
        </div>

        {/* Categories & Sections */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Categories & Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-3">Collection Sections</label>
              <div className="space-y-2">
                {(['sports', 'new', 'luxury', 'limited', 'bestsellers'] as CollectionSection[]).map((section) => (
                  <label key={section} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.collectionSections.includes(section)} onChange={() => toggleCollectionSection(section)} className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]" />
                    <span className="text-sm font-['Jost'] capitalize">{section}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-3">Gift Categories / Occasions</label>
              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-[#faf7f0] rounded-lg border border-[#1a1209]/10">
                {PREDEFINED_GIFT_CATEGORIES.map((cat) => (
                  <label key={cat.slug} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.giftCategories.includes(cat.slug)} onChange={() => toggleGiftCategory(cat.slug)} className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]" />
                    <span className="text-sm font-['Jost']">{cat.emoji} {cat.label}</span>
                  </label>
                ))}
                {showCustomInput ? (
                  <div className="flex gap-2 mt-2 p-2 bg-white rounded border border-[#8B6914]/30">
                    <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter custom occasion..." className="flex-1 px-2 py-1 text-sm border border-[#1a1209]/15 rounded focus:outline-none focus:border-[#8B6914]" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())} autoFocus />
                    <button type="button" onClick={addCustomCategory} className="px-3 py-1 bg-[#8B6914] text-white text-xs rounded hover:bg-[#6f5410]">Add</button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomCategory(''); }} className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowCustomInput(true)} className="w-full mt-2 px-3 py-2 border-2 border-dashed border-[#8B6914]/40 text-[#8B6914] text-sm rounded-lg hover:border-[#8B6914] hover:bg-[#8B6914]/5 transition-all font-['Jost']">+ Add Custom Occasion</button>
                )}
                {formData.giftCategories.filter(slug => !PREDEFINED_GIFT_CATEGORIES.some(c => c.slug === slug)).map(slug => (
                  <div key={slug} className="flex items-center justify-between p-2 bg-white rounded border border-[#8B6914]/20">
                    <span className="text-sm font-['Jost'] capitalize">🎉 {slug.replace(/-/g, ' ')}</span>
                    <button type="button" onClick={() => toggleGiftCategory(slug)} className="text-red-600 hover:text-red-700 text-xs">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Display Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]" />
              <span className="text-sm font-['Jost']">Active (Visible on website)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-50 rounded-lg border border-red-200">
              <input type="checkbox" checked={formData.isSoldOut || getTotalStock() === 0} onChange={(e) => setFormData(prev => ({ ...prev, isSoldOut: e.target.checked }))} disabled={getTotalStock() === 0} className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-600 disabled:opacity-50" />
              <div><span className="text-sm font-['Jost'] font-semibold text-red-700">SOLD OUT</span><p className="text-xs text-red-600">Product visible but cannot be purchased</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.showOnHome} onChange={(e) => setFormData(prev => ({ ...prev, showOnHome: e.target.checked }))} className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]" />
              <span className="text-sm font-['Jost']">Show on Homepage Collections</span>
            </label>
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" checked={formData.stickerEnabled} onChange={(e) => setFormData(prev => ({ ...prev, stickerEnabled: e.target.checked }))} className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]" />
              <span className="text-sm font-['Jost']">Enable Sticker Badge</span>
            </div>
            {formData.stickerEnabled && (
              <div className="ml-7">
                <input type="text" value={formData.stickerText} onChange={(e) => setFormData(prev => ({ ...prev, stickerText: e.target.value }))} placeholder="e.g., New Arrival, Limited Edition" maxLength={40} className="w-full max-w-md px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded text-sm" />
                <p className="text-xs text-[#1a1209]/40 mt-1">Max 40 characters</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-[#1a1209]/20 text-[#1a1209] rounded-lg hover:bg-[#1a1209]/5 transition-colors font-['Jost']">Cancel</button>
          <button type="submit" disabled={loading || uploadingImage} className="px-8 py-3 bg-gradient-to-r from-[#1a1209] to-[#2a1d10] text-white rounded-lg hover:from-[#2a1d10] hover:to-[#3a2815] transition-all font-['Jost'] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg">
            {loading ? (
              <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Create Product</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}