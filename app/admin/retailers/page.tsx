'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Retailer {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  image?: {
    url: string;
    publicId: string;
  };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    googleMapsLink: '',
    image: { url: '', publicId: '' },
    latitude: '' as string | number,
    longitude: '' as string | number,
    isActive: true,
  });

  const [checkingSpelling, setCheckingSpelling] = useState<Record<string, boolean>>({});
  const [spellCheckResult, setSpellCheckResult] = useState<{
    field: string;
    originalText: string;
    correctedText: string;
    errorDetails: string;
  } | null>(null);

  const [resolvingLink, setResolvingLink] = useState(false);
  const [extractedMapDetails, setExtractedMapDetails] = useState<{
    name: string;
    address: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
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

  const handleResolveMapsLink = async () => {
    const url = formData.googleMapsLink;
    if (!url || !url.trim()) {
      toast.error('Please paste a Google Maps Link first');
      return;
    }
    
    setResolvingLink(true);
    try {
      const res = await fetch('/api/admin/resolve-maps-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to extract details');
      
      if (data.warning) {
        toast(data.warning, { icon: '⚠️', duration: 6000 });
      }
      
      setExtractedMapDetails(data.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not extract shop details from Maps link');
    } finally {
      setResolvingLink(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const fetchRetailers = async () => {
    try {
      const res = await fetch('/api/admin/retailers');
      const data = await res.json();
      if (data.success) {
        setRetailers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      toast.error('Failed to load retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
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
                type: 'thumbnail', // reuse thumbnail format
                name: file.name,
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setFormData(prev => ({ ...prev, image: data.data }));
            toast.success('Boutique photo uploaded!');
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: { url: '', publicId: '' } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/admin/retailers/${editingId}`
        : '/api/admin/retailers';

      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save retailer');

      toast.success(editingId ? 'Retailer updated' : 'Retailer created');
      resetForm();
      fetchRetailers();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save retailer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r: Retailer) => {
    setEditingId(r._id);
    setFormData({
      name: r.name,
      address: r.address,
      city: r.city,
      country: r.country,
      googleMapsLink: r.googleMapsLink,
      image: r.image || { url: '', publicId: '' },
      latitude: r.latitude !== undefined ? r.latitude : '',
      longitude: r.longitude !== undefined ? r.longitude : '',
      isActive: r.isActive,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/retailers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete retailer');

      toast.success('Retailer deleted successfully');
      fetchRetailers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete retailer');
    }
  };

  const handleToggleActive = async (r: Retailer) => {
    try {
      const res = await fetch(`/api/admin/retailers/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...r,
          isActive: !r.isActive,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle status');
      toast.success(r.isActive ? 'Boutique set offline' : 'Boutique set active');
      fetchRetailers();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      googleMapsLink: '',
      image: { url: '', publicId: '' },
      latitude: '',
      longitude: '',
      isActive: true,
    });
  };

  const filteredRetailers = retailers.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = retailers.filter(r => r.isActive).length;
  const offlineCount = retailers.length - activeCount;

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
      <div>
        <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
          Retailers & Boutiques
        </h1>
        <p className="font-['Jost'] text-[#1a1209]/60 mt-1">
          Manage boutique locations, shipping pick-up centers, and authorized sellers
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#8B6914]/10 flex items-center justify-center text-[#8B6914] text-xl font-bold">
            🗺️
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-[#1a1209]/40 uppercase">Total Boutiques</p>
            <p className="text-2xl font-bold text-[#1a1209] mt-0.5">{retailers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-700 text-xl font-bold">
            🟢
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-[#1a1209]/40 uppercase">Active Stores</p>
            <p className="text-2xl font-bold text-green-700 mt-0.5">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#1a1209]/10 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-700 text-xl font-bold">
            🔴
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-[#1a1209]/40 uppercase">Offline Stores</p>
            <p className="text-2xl font-bold text-red-700 mt-0.5">{offlineCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CRUD Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-[#1a1209]/10 p-6 sticky top-24">
            <h3 className="font-['Jost'] font-semibold text-[#1a1209] mb-4">
              {editingId ? 'Edit Boutique Details' : 'Add Boutique Partner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">
                    Shop Name *
                  </label>
                  {formData.name.trim() && (
                    <button
                      type="button"
                      onClick={() => checkSpelling('name', formData.name)}
                      disabled={checkingSpelling['name']}
                      className="text-[10px] text-[#8B6914] hover:text-[#1a1209] transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {checkingSpelling['name'] ? 'Checking...' : '✨ AI Check'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Winsor Flagship Boutique"
                  required
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">
                    Street Address *
                  </label>
                  {formData.address.trim() && (
                    <button
                      type="button"
                      onClick={() => checkSpelling('address', formData.address)}
                      disabled={checkingSpelling['address']}
                      className="text-[10px] text-[#8B6914] hover:text-[#1a1209] transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {checkingSpelling['address'] ? 'Checking...' : '✨ AI Check'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Celestial Residencies, Colombo 03"
                  required
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Colombo"
                    required
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. Sri Lanka"
                    required
                    className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70">
                    Google Maps Link *
                  </label>
                  {formData.googleMapsLink.trim() && (
                    <button
                      type="button"
                      onClick={handleResolveMapsLink}
                      disabled={resolvingLink}
                      className="text-[10px] text-[#8B6914] hover:text-[#1a1209] transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {resolvingLink ? 'Resolving...' : '✨ AI Auto-Fill'}
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  required
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition font-['Jost']"
                />
              </div>

              {/* GPS Coordinates Section */}
              <div className="p-3.5 bg-[#faf7f0] rounded-lg border border-[#1a1209]/5">
                <p className="text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-2">
                  GPS Coordinates (Optional for locator)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold tracking-wider text-[#1a1209]/60 uppercase mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g. 6.9142"
                      className="w-full px-3 py-1.5 bg-white border border-[#1a1209]/15 rounded-md text-xs text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold tracking-wider text-[#1a1209]/60 uppercase mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g. 79.8516"
                      className="w-full px-3 py-1.5 bg-white border border-[#1a1209]/15 rounded-md text-xs text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-[#1a1209]/45 mt-1.5 leading-relaxed">
                  Coordinates enable sorting locations by proximity when customers activate GPS search.
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#1a1209]/70 mb-2">
                  Boutique Image (Optional)
                </label>
                
                {formData.image.url ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#1a1209]/10">
                    <img
                      src={formData.image.url}
                      alt="Uploaded Boutique"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-colors"
                      title="Remove Photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-[#1a1209]/20 rounded-lg hover:border-[#8B6914] hover:bg-[#8B6914]/5 transition-all text-center p-6 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6914]" />
                        <span className="text-xs font-['Jost'] text-[#1a1209]/60">Uploading photo...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-xl">📸</span>
                        <span className="text-xs font-semibold text-[#8B6914]">Upload Boutique Image</span>
                        <span className="text-[10px] text-[#1a1209]/40">JPEG or WEBP, max 5MB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Visibility Checkbox */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#8B6914] border-[#1a1209]/20 rounded focus:ring-[#8B6914]"
                />
                <label htmlFor="isActive" className="text-sm font-['Jost'] text-[#1a1209] cursor-pointer select-none">
                  Visible on website location finder
                </label>
              </div>

              {/* Form Buttons */}
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
                  disabled={saving || uploadingImage}
                  className="flex-1 px-4 py-2.5 bg-[#1a1209] text-white rounded-lg hover:bg-[#8B6914] transition-colors font-['Jost'] text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Retailers Table List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white rounded-xl border border-[#1a1209]/10 p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boutiques by name, city, address, or country..."
                className="w-full pl-10 pr-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914]"
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/30 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-xl border border-[#1a1209]/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
                  <tr>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      Boutique Store
                    </th>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      Address Details
                    </th>
                    <th className="px-6 py-4 text-left font-['Jost'] text-xs font-semibold text-[#1a1209] uppercase tracking-wider">
                      GPS Coordinates
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
                  {filteredRetailers.map((r) => (
                    <tr key={r._id} className="hover:bg-[#faf7f0]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-[#faf7f0] border border-[#1a1209]/5 rounded-md overflow-hidden flex items-center justify-center text-lg shadow-inner shrink-0">
                            {r.image?.url ? (
                              <img src={r.image.url} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              '🏬'
                            )}
                          </div>
                          <div>
                            <span className="font-['Jost'] font-semibold text-sm text-[#1a1209] block">
                              {r.name}
                            </span>
                            <span className="text-[10px] text-[#8B6914] bg-[#8B6914]/10 px-1.5 py-0.5 rounded font-['Jost'] font-medium uppercase tracking-wide inline-block mt-0.5">
                              {r.city}, {r.country}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-['Jost'] text-xs text-[#1a1209]/75 block max-w-xs truncate">
                          {r.address}
                        </span>
                        <a
                          href={r.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-['Jost'] mt-1 inline-block"
                        >
                          View Map Destination ↗
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {r.latitude !== undefined && r.longitude !== undefined ? (
                          <code className="text-xs bg-[#faf7f0] text-[#1a1209]/60 px-1.5 py-0.5 rounded font-mono">
                            {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                          </code>
                        ) : (
                          <span className="text-xs text-[#1a1209]/30 font-['Jost']">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(r)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-['Jost'] font-medium border transition-colors cursor-pointer ${
                            r.isActive
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title={r.isActive ? 'Set Offline' : 'Set Active'}
                        >
                          {r.isActive ? 'Active' : 'Offline'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(r._id, r.name)}
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

            {filteredRetailers.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🏬</div>
                <p className="text-[#1a1209]/60 font-['Jost'] text-lg">No boutiques found</p>
                <p className="text-[#1a1209]/45 font-['Jost'] text-sm mt-1">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Create your first boutique partner above'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {spellCheckResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white border border-[#8B6914]/30 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-[#8B6914] mb-3">
              <span className="text-xl">✨</span>
              <h3 className="font-semibold text-lg font-['Jost']">AI Spelling Suggestion</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 font-['Jost']">
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
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-['Jost'] cursor-pointer"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplySpelling(spellCheckResult.field, spellCheckResult.correctedText);
                  setSpellCheckResult(null);
                }}
                className="flex-1 py-2 px-4 bg-[#1a1209] hover:bg-[#8B6914] text-white font-semibold rounded-lg text-sm transition-colors font-['Jost'] cursor-pointer"
              >
                Apply Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {extractedMapDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white border border-[#8B6914]/30 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-[#8B6914] mb-3">
              <span className="text-xl">🗺️</span>
              <h3 className="font-semibold text-lg font-['Jost']">AI Extracted Boutique Details</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 font-['Jost']">
              Gemini analyzed the Google Maps link and extracted the details below. Please review before importing them into your form.
            </p>

            <div className="space-y-3 mb-6 font-['Jost'] text-sm">
              <div className="grid grid-cols-3 border-b border-[#1a1209]/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">Shop Name</span>
                <span className="col-span-2 font-medium text-[#1a1209] bg-[#faf7f0] px-2.5 py-1.5 rounded-lg border border-[#1a1209]/5">
                  {extractedMapDetails.name || '(Not detected)'}
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-[#1a1209]/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">Street Address</span>
                <span className="col-span-2 font-medium text-[#1a1209] bg-[#faf7f0] px-2.5 py-1.5 rounded-lg border border-[#1a1209]/5">
                  {extractedMapDetails.address || '(Not detected)'}
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-[#1a1209]/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">City</span>
                <span className="col-span-2 font-medium text-[#1a1209] bg-[#faf7f0] px-2.5 py-1.5 rounded-lg border border-[#1a1209]/5">
                  {extractedMapDetails.city || '(Not detected)'}
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-[#1a1209]/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">Country</span>
                <span className="col-span-2 font-medium text-[#1a1209] bg-[#faf7f0] px-2.5 py-1.5 rounded-lg border border-[#1a1209]/5">
                  {extractedMapDetails.country || '(Not detected)'}
                </span>
              </div>
              <div className="grid grid-cols-3 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center">Coordinates</span>
                <span className="col-span-2 font-medium text-[#1a1209] bg-[#faf7f0] px-2.5 py-1.5 rounded-lg border border-[#1a1209]/5">
                  {extractedMapDetails.latitude !== undefined && extractedMapDetails.longitude !== undefined ? (
                    <code className="font-mono text-xs">{extractedMapDetails.latitude}, {extractedMapDetails.longitude}</code>
                  ) : (
                    <span className="text-gray-400 italic">None</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setExtractedMapDetails(null)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-['Jost'] cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    name: extractedMapDetails.name || prev.name,
                    address: extractedMapDetails.address || prev.address,
                    city: extractedMapDetails.city || prev.city,
                    country: extractedMapDetails.country || prev.country,
                    latitude: extractedMapDetails.latitude !== undefined ? extractedMapDetails.latitude : prev.latitude,
                    longitude: extractedMapDetails.longitude !== undefined ? extractedMapDetails.longitude : prev.longitude,
                  }));
                  toast.success('Boutique details auto-filled!');
                  setExtractedMapDetails(null);
                }}
                className="flex-1 py-2 px-4 bg-[#1a1209] hover:bg-[#8B6914] text-white font-semibold rounded-lg text-sm transition-colors font-['Jost'] cursor-pointer"
              >
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
