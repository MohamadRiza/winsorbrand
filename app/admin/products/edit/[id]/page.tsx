'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { IProduct, CollectionSection, WarrantyOption, CloudinaryAsset, ColorVariant } from '@/types';

const EMPTY_ASSET: CloudinaryAsset = { url: '', publicId: '' };

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [giftCategories, setGiftCategories] = useState<Array<{ _id: string; slug: string; label: string; emoji: string }>>([]);
  
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
    video: EMPTY_ASSET,
    collectionSections: [] as CollectionSection[],
    giftCategories: [] as string[],
    isActive: false,
    showOnHome: false,
    stickerEnabled: false,
    stickerText: '',
  });

  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const [checkingSpelling, setCheckingSpelling] = useState<Record<string, boolean>>({});
  const [spellCheckResult, setSpellCheckResult] = useState<{
    field: string;
    originalText: string;
    correctedText: string;
    errorDetails: string;
  } | null>(null);

  const checkSpelling = async (fieldName: string, text: string) => {
    if (!text || !text.trim()) {
      toast.error('Field is empty');
      return;
    }
    setCheckingSpelling(prev => ({ ...prev, [fieldName]: true }));
    try {
      const res = await fetch('/api/admin/check-spelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
      
      if (data.warning) {
        toast(data.warning, { icon: '⚠️', duration: 6000 });
        return;
      }
      
      if (data.errorsFound && data.correctedText.trim().toLowerCase() !== text.trim().toLowerCase()) {
        setSpellCheckResult({
          field: fieldName,
          originalText: text,
          correctedText: data.correctedText,
          errorDetails: data.errorDetails || 'Detected spelling/grammar mistypes.'
        });
      } else {
        toast.success('No spelling errors detected!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to run AI spell check');
    } finally {
      setCheckingSpelling(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleApplySpelling = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    toast.success('Spelling correction applied!');
  };

  useEffect(() => {
    fetchGiftCategories();
    fetchProduct();
  }, [productId]);

  const fetchGiftCategories = async () => {
    try {
      const res = await fetch('/api/gift-categories');
      const data = await res.json();
      if (data.success) {
        setGiftCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch product');
      
      const product = data.data;
      setFormData({
        title: product.title,
        brand: product.brand,
        modelNo: product.modelNo,
        watchShape: product.watchShape,
        price: product.price,
        description: product.description,
        warranty: product.warranty,
        specifications: product.specifications || {},
        colorVariants: product.colorVariants || [],
        thumbnail: product.thumbnail || EMPTY_ASSET,
        images: product.images || [],
        video: product.video || EMPTY_ASSET,
        collectionSections: product.collectionSections || [],
        giftCategories: product.giftCategories || [],
        isActive: product.isActive,
        showOnHome: product.showOnHome,
        stickerEnabled: product.stickerEnabled,
        stickerText: product.stickerText || '',
      });
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.message || 'Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Server-side AI description generation with image analysis
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
          thumbnailUrl: formData.thumbnail?.url || '',
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      if (data.warning) {
        toast(data.warning, { icon: '⚠️' });
      } else if (data.cached) {
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

  const handleImageUpload = async (file: File, type: 'thumbnail' | 'gallery' | 'color' | 'video') => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
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
            setFormData(prev => ({ ...prev, images: [...prev.images, data.data] }));
          } else if (type === 'video') {
            setFormData(prev => ({ ...prev, video: data.data }));
          }

          toast.success('File uploaded successfully');
        } catch (error: any) {
          toast.error(error.message || 'Upload failed');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to read file');
      setUploadingImage(false);
    }
  };

  const addColorVariant = () => {
    const newVariant: ColorVariant = {
      colorName: '',
      colorHex: '#000000',
      qty: 0,
      inStock: false,
      image: { ...EMPTY_ASSET },
    };
    setFormData(prev => ({ ...prev, colorVariants: [...prev.colorVariants, newVariant] }));
  };

  const updateColorVariant = (index: number, field: keyof ColorVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant, i) => 
        i === index 
          ? { 
              ...variant, 
              [field]: value, 
              inStock: field === 'qty' ? (value as number) > 0 : variant.inStock 
            } 
          : variant
      ),
    }));
  };

  const removeColorVariant = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      colorVariants: prev.colorVariants.filter((_, i) => i !== index) 
    }));
  };

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData(prev => ({ 
        ...prev, 
        specifications: { ...prev.specifications, [specKey]: specValue } 
      }));
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
      const updated = sections.includes(section)
        ? sections.filter(s => s !== section)
        : [...sections, section];
      return { ...prev, collectionSections: updated };
    });
  };

  const toggleGiftCategory = (slug: string) => {
    setFormData(prev => {
      const categories = prev.giftCategories;
      const updated = categories.includes(slug)
        ? categories.filter(c => c !== slug)
        : [...categories, slug];
      return { ...prev, giftCategories: updated };
    });
  };

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

    setSaving(true);
    try {
      const payload = {
        ...formData,
        colorVariants: formData.colorVariants.map(v => ({
          ...v,
          image: (v.image?.url) ? v.image : undefined
        })),
        video: (formData.video?.url) ? formData.video : undefined
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Edit Product
          </h1>
          <p className="font-['Jost'] text-[#1a1209]/60 mt-1">
            Update product information
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-[#1a1209] hover:bg-[#1a1209]/5 rounded-lg font-['Jost'] transition-colors"
        >
          ← Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">
                  Product Title *
                </label>
                {formData.title.trim() && (
                  <button
                    type="button"
                    onClick={() => checkSpelling('title', formData.title)}
                    disabled={checkingSpelling['title']}
                    className="text-[10px] text-[#8B6914] hover:text-[#1a1209] transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {checkingSpelling['title'] ? 'Checking...' : '✨ AI Check'}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Classic Chronograph Gold"
                required
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Model Number *
              </label>
              <input
                type="text"
                value={formData.modelNo}
                onChange={(e) => setFormData(prev => ({ ...prev, modelNo: e.target.value }))}
                placeholder="e.g., WS:2019"
                required
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Watch Shape *
              </label>
              <select
                value={formData.watchShape}
                onChange={(e) => setFormData(prev => ({ ...prev, watchShape: e.target.value }))}
                required
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
              >
                <option value="Round">Round</option>
                <option value="Square">Square</option>
                <option value="Oval">Oval</option>
                <option value="Rectangular">Rectangular</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Price (LKR) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
                required
                min="0"
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Warranty
              </label>
              <select
                value={formData.warranty}
                onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value as WarrantyOption }))}
                className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost'] text-sm"
              >
                <option value="no_warranty">No Warranty</option>
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
                <option value="2_years">2 Years</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">Description *</label>
                  {formData.description.trim() && (
                    <button
                      type="button"
                      onClick={() => checkSpelling('description', formData.description)}
                      disabled={checkingSpelling['description']}
                      className="text-[10px] text-[#8B6914] hover:text-[#1a1209] transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {checkingSpelling['description'] ? 'Checking...' : '✨ AI Check'}
                    </button>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={generateDescription} 
                  disabled={generatingDescription || !formData.title?.trim() || !formData.modelNo?.trim()}
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

        {/* Images & Video */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Product Media</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Thumbnail Image *
              </label>
              <div className="flex items-center gap-4">
                {formData.thumbnail?.url ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <img src={formData.thumbnail.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail: EMPTY_ASSET }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                    <svg className="w-8 h-8 text-[#1a1209]/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-[#1a1209]/60">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'thumbnail')}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
                {uploadingImage && <div className="text-sm text-[#8B6914]">Uploading...</div>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Gallery Images (Max 6)
              </label>
              <div className="flex gap-4 flex-wrap">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        images: prev.images.filter((_, i) => i !== idx) 
                      }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.images.length < 6 && (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                    <svg className="w-6 h-6 text-[#1a1209]/40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-[#1a1209]/60">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'gallery')}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Video (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                Product Video (Optional)
              </label>
              <div className="flex items-center gap-4">
                {formData.video?.url ? (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <video src={formData.video.url} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, video: EMPTY_ASSET }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-[#1a1209]/20 rounded-lg cursor-pointer hover:border-[#8B6914] transition-colors">
                    <svg className="w-8 h-8 text-[#1a1209]/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-[#1a1209]/60">Upload Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'video')}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color Variants */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Jost'] font-semibold text-[#1a1209]">Color Variants</h3>
            <button
              type="button"
              onClick={addColorVariant}
              className="px-3 py-1.5 bg-[#8B6914] text-white text-sm rounded-lg hover:bg-[#6f5410] transition-colors"
            >
              + Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {formData.colorVariants.map((variant, idx) => (
              <div key={idx} className="p-4 bg-[#faf7f0] rounded-lg border border-[#1a1209]/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                      Color Name
                    </label>
                    <input
                      type="text"
                      value={variant.colorName}
                      onChange={(e) => updateColorVariant(idx, 'colorName', e.target.value)}
                      placeholder="e.g., Gold"
                      className="w-full px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                      Hex Code
                    </label>
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
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={variant.qty}
                      onChange={(e) => updateColorVariant(idx, 'qty', Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm"
                    />
                  </div>
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
              </div>
            ))}
            {formData.colorVariants.length === 0 && (
              <p className="text-sm text-[#1a1209]/40 text-center py-4">No color variants added</p>
            )}
          </div>
        </div>

        {/* Categories & Sections */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Categories & Sections</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-3">
                Collection Sections
              </label>
              <div className="space-y-2">
                {(['sports', 'new', 'luxury', 'limited', 'bestsellers'] as CollectionSection[]).map((section) => (
                  <label key={section} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.collectionSections.includes(section)}
                      onChange={() => toggleCollectionSection(section)}
                      className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
                    />
                    <span className="text-sm font-['Jost'] capitalize">{section}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-3">
                Gift Categories
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {giftCategories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.giftCategories.includes(cat.slug)}
                      onChange={() => toggleGiftCategory(cat.slug)}
                      className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
                    />
                    <span className="text-sm font-['Jost']">{cat.emoji} {cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Specifications</h3>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Key (e.g., Case Size)"
              className="flex-1 px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded text-sm"
            />
            <input
              type="text"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="Value (e.g., 42mm)"
              className="flex-1 px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded text-sm"
            />
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-[#8B6914] text-white rounded text-sm hover:bg-[#6f5410]"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#faf7f0] rounded border border-[#1a1209]/10">
                <div>
                  <span className="font-semibold text-sm text-[#1a1209]">{key}:</span>
                  <span className="text-sm text-[#1a1209]/70 ml-2">{value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSpecification(key)}
                  className="text-red-600 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6">
          <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">Display Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
              />
              <span className="text-sm font-['Jost']">Active (Visible on website)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOnHome}
                onChange={(e) => setFormData(prev => ({ ...prev, showOnHome: e.target.checked }))}
                className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
              />
              <span className="text-sm font-['Jost']">Show on Homepage Collections</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={formData.stickerEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, stickerEnabled: e.target.checked }))}
                className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
              />
              <span className="text-sm font-['Jost']">Enable Sticker Badge</span>
            </div>

            {formData.stickerEnabled && (
              <div className="ml-7">
                <input
                  type="text"
                  value={formData.stickerText}
                  onChange={(e) => setFormData(prev => ({ ...prev, stickerText: e.target.value }))}
                  placeholder="e.g., New Arrival, Limited Edition"
                  maxLength={40}
                  className="w-full max-w-md px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded text-sm"
                />
                <p className="text-xs text-[#1a1209]/40 mt-1">Max 40 characters</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-[#1a1209]/20 text-[#1a1209] rounded-lg hover:bg-[#1a1209]/5 transition-colors font-['Jost']"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="px-8 py-3 bg-[#1a1209] text-white rounded-lg hover:bg-[#8B6914] transition-colors font-['Jost'] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Update Product'
            )}
          </button>
        </div>
      </form>
      {spellCheckResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white border border-[#8B6914]/30 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-[#8B6914] mb-3">
              <span className="text-xl">✨</span>
              <h3 className="font-semibold text-lg">AI Spelling Suggestion</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Reason: {spellCheckResult.errorDetails}
            </p>

            <div className="space-y-3 mb-6 font-['Jost']">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Original Text</span>
                <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                  {spellCheckResult.originalText}
                </p>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Suggested Correction</span>
                <p className="text-sm text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-100 font-medium">
                  {spellCheckResult.correctedText}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSpellCheckResult(null)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-['Jost']"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplySpelling(spellCheckResult.field, spellCheckResult.correctedText);
                  setSpellCheckResult(null);
                }}
                className="flex-1 py-2 px-4 bg-[#1a1209] hover:bg-[#8B6914] text-white font-semibold rounded-lg text-sm transition-colors font-['Jost']"
              >
                Apply Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}