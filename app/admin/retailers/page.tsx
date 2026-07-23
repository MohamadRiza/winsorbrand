'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Retailer {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  phone?: string;
  websiteUrl?: string;
  operatingHours?: {
    weekdays: { isOpen: boolean; openTime: string; closeTime: string };
    saturday: { isOpen: boolean; openTime: string; closeTime: string };
    sunday: { isOpen: boolean; openTime: string; closeTime: string };
  };
  image?: {
    url: string;
    publicId: string;
  };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
}

// Client-side instant Google Maps coordinate extractor helper
function extractCoordsFromMapsUrl(url: string): { latitude?: number; longitude?: number } {
  if (!url || !url.trim()) return {};

  const cleanUrl = url.trim();

  // Pattern A: !1d<lng>!2d<lat> (common in directions & place links)
  const match1d2d = cleanUrl.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
  if (match1d2d) {
    return { longitude: parseFloat(match1d2d[1]), latitude: parseFloat(match1d2d[2]) };
  }

  // Pattern B: !3d<lat>!4d<lng>
  const match3d4d = cleanUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match3d4d) {
    return { latitude: parseFloat(match3d4d[1]), longitude: parseFloat(match3d4d[2]) };
  }

  // Pattern C: !2d<lng>!3d<lat>
  const match2d3d = cleanUrl.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (match2d3d) {
    return { longitude: parseFloat(match2d3d[1]), latitude: parseFloat(match2d3d[2]) };
  }

  // Pattern D: @<lat>,<lng>
  const geoMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (geoMatch) {
    return { latitude: parseFloat(geoMatch[1]), longitude: parseFloat(geoMatch[2]) };
  }

  // Pattern E: q=<lat>,<lng> or ll=<lat>,<lng>
  const queryMatch = cleanUrl.match(/(?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    return { latitude: parseFloat(queryMatch[1]), longitude: parseFloat(queryMatch[2]) };
  }

  return {};
}

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    googleMapsLink: '',
    phone: '',
    websiteUrl: '',
    operatingHours: {
      weekdays: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
      saturday: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
      sunday: { isOpen: false, openTime: '10:00', closeTime: '18:00' },
    },
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

  useEffect(() => {
    fetchRetailers();
  }, []);

  const fetchRetailers = async () => {
    setLoading(true);
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

  // Instant local auto-fill of Lat/Lng whenever Google Maps Link changes
  const handleGoogleMapsLinkChange = (url: string) => {
    setFormData(prev => {
      const coords = extractCoordsFromMapsUrl(url);
      const updated = { ...prev, googleMapsLink: url };
      if (coords.latitude !== undefined && coords.longitude !== undefined) {
        updated.latitude = coords.latitude;
        updated.longitude = coords.longitude;
        toast.success(`Auto-detected GPS Coordinates: ${coords.latitude}, ${coords.longitude}`, { id: 'gps-auto-fill' });
      }
      return updated;
    });
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
        toast(data.warning, { duration: 5000 });
      }

      const extracted = data.data;
      setExtractedMapDetails(extracted);

      // Auto-fill form fields with extracted data
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        address: extracted.address || prev.address,
        city: extracted.city || prev.city,
        country: extracted.country || prev.country,
        latitude: extracted.latitude !== undefined ? extracted.latitude : prev.latitude,
        longitude: extracted.longitude !== undefined ? extracted.longitude : prev.longitude,
      }));

      toast.success('Successfully extracted boutique details & GPS coordinates!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not extract shop details from Maps link');
    } finally {
      setResolvingLink(false);
    }
  };

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
    setSpellCheckResult(null);
    toast.success('Spelling correction applied!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
                type: 'thumbnail',
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

  const handleEdit = (retailer: Retailer) => {
    setEditingId(retailer._id);
    setFormData({
      name: retailer.name,
      address: retailer.address,
      city: retailer.city,
      country: retailer.country,
      googleMapsLink: retailer.googleMapsLink,
      phone: retailer.phone || '',
      websiteUrl: retailer.websiteUrl || '',
      operatingHours: retailer.operatingHours || {
        weekdays: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
        saturday: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
        sunday: { isOpen: false, openTime: '10:00', closeTime: '18:00' },
      },
      image: retailer.image || { url: '', publicId: '' },
      latitude: retailer.latitude !== undefined ? retailer.latitude : '',
      longitude: retailer.longitude !== undefined ? retailer.longitude : '',
      isActive: retailer.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/retailers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Retailer deleted');
      fetchRetailers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    // 0ms Optimistic UI update
    setRetailers(prev => prev.map(r => r._id === id ? { ...r, isActive: !currentStatus } : r));

    try {
      const res = await fetch(`/api/admin/retailers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      toast.success(`Retailer ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message);
      fetchRetailers();
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
      phone: '',
      websiteUrl: '',
      operatingHours: {
        weekdays: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
        saturday: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
        sunday: { isOpen: false, openTime: '10:00', closeTime: '18:00' },
      },
      image: { url: '', publicId: '' },
      latitude: '',
      longitude: '',
      isActive: true,
    });
    setSpellCheckResult(null);
    setExtractedMapDetails(null);
  };

  // Unique cities list for filter
  const cities = useMemo(() => {
    const set = new Set<string>();
    retailers.forEach(r => { if (r.city) set.add(r.city); });
    return Array.from(set).sort();
  }, [retailers]);

  // Aggregates
  const totalRetailers = retailers.length;
  const activeRetailers = retailers.filter(r => r.isActive).length;
  const inactiveRetailers = retailers.filter(r => !r.isActive).length;
  const citiesCount = cities.length;

  // Filtered List
  const filteredRetailers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return retailers.filter(r => {
      const matchesSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q);

      const matchesCity = filterCity === 'all' || r.city === filterCity;

      return matchesSearch && matchesCity;
    });
  }, [retailers, searchQuery, filterCity]);

  return (
    <div 
      className="min-h-screen font-['Jost'] text-[#1a1209] p-4 sm:p-8 select-none"
      style={{
        backgroundImage: `linear-gradient(rgba(250, 247, 240, 0.93), rgba(250, 247, 240, 0.93)), url('/hero_bg_marble.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/20 pb-5">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
              AUTHORIZED RETAILERS & BOUTIQUES
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-0.5">
              Manage flagship store locations, GPS coordinates, Google Maps links, and operating hours.
            </p>
          </div>
          
          <button
            onClick={fetchRetailers}
            className="self-start sm:self-center px-4 py-2.5 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-[#1a1209] hover:text-[#8B6914] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Outlets
          </button>
        </div>

        {/* ── Professional Tabular Metrics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL OUTLETS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalRetailers.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">ACTIVE BOUTIQUES</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{activeRetailers.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">INACTIVE OUTLETS</p>
            <p className="font-['Jost'] text-3xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{inactiveRetailers.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">CITIES REPRESENTED</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#8B6914] mt-1 tabular-nums font-mono">{citiesCount.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Main Form & Catalog Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── BOUTIQUE FORM CARD (Left Side 5 Columns) ── */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm border border-[#8B6914]/25 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="flex justify-between items-center border-b border-[#1a1209]/10 pb-4">
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209] uppercase tracking-wider">
                  {editingId ? 'EDIT RETAILER LOCATION' : 'ADD NEW RETAILER'}
                </h2>
                <p className="text-xs text-[#8B6914] font-semibold mt-0.5">
                  {editingId ? 'Update flagship boutique details & coordinates' : 'Register a new authorized boutique partner'}
                </p>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs font-semibold text-[#1a1209]/60 hover:text-[#1a1209] underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Spell Check Suggestions Callout Box */}
            {spellCheckResult && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>AI Spell Check Suggestion for {spellCheckResult.field.toUpperCase()}</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Original: <span className="line-through text-red-600 font-mono">{spellCheckResult.originalText}</span>
                </p>
                <p className="text-emerald-800 font-bold text-xs">
                  Suggested: <span className="font-mono">{spellCheckResult.correctedText}</span>
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplySpelling(spellCheckResult.field, spellCheckResult.correctedText)}
                    className="px-3 py-1 bg-[#8B6914] text-white text-[11px] font-bold rounded-lg hover:bg-[#1a1209] transition-all cursor-pointer"
                  >
                    Apply Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpellCheckResult(null)}
                    className="px-3 py-1 border border-amber-400 text-amber-900 text-[11px] font-semibold rounded-lg hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* 1. Google Maps Link & Auto-Detect Callout (TOP PRIORITY) */}
              <div className="space-y-1.5 bg-[#faf7f0]/70 border border-[#8B6914]/30 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    GOOGLE MAPS LINK <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResolveMapsLink}
                    disabled={resolvingLink || !formData.googleMapsLink.trim()}
                    className="px-3 py-1 bg-[#8B6914] hover:bg-[#1a1209] text-white text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {resolvingLink ? 'Extracting Details...' : 'AI Auto-Fill Location & Coords'}
                  </button>
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps/..."
                  value={formData.googleMapsLink}
                  onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl text-xs font-mono text-[#1a1209] focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
                />
                <p className="text-[10px] text-[#1a1209]/50 leading-snug">
                  Pasting a Google Maps link instantly auto-detects latitude & longitude. Click AI Auto-Fill to populate boutique name & address.
                </p>
              </div>

              {/* 2. GPS Coordinates (Auto-Filled) */}
              <div className="grid grid-cols-2 gap-3 bg-white border border-[#1a1209]/10 rounded-xl p-3.5">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1">
                    LATITUDE (AUTO-FILLED)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 6.9271601"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1">
                    LONGITUDE (AUTO-FILLED)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 79.8446964"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
              </div>

              {/* 3. Boutique Name */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    BOUTIQUE / RETAILER NAME <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => checkSpelling('name', formData.name)}
                    disabled={checkingSpelling['name']}
                    className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                  >
                    {checkingSpelling['name'] ? 'Checking...' : 'AI Spell Check'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. One Galle Face Flagship Boutique"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              {/* 4. Address */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    STREET ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => checkSpelling('address', formData.address)}
                    disabled={checkingSpelling['address']}
                    className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                  >
                    {checkingSpelling['address'] ? 'Checking...' : 'AI Spell Check'}
                  </button>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 1A Centre Road, Colombo 00200"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-xl text-xs font-medium text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              {/* 5. City & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    CITY <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    COUNTRY <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Lanka"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-bold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
              </div>

              {/* 6. Phone & Website */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    CONTACT PHONE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +94 11 234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                    WEBSITE URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-mono text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>
              </div>

              {/* 7. Boutique Image Photo */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase">
                  BOUTIQUE PHOTO IMAGE
                </label>

                {formData.image.url ? (
                  <div className="relative w-full h-36 bg-[#faf7f0] border border-[#8B6914]/30 rounded-xl overflow-hidden group">
                    <Image src={formData.image.url} alt="Boutique Photo" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-full transition-all cursor-pointer"
                      title="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#1a1209]/15 rounded-xl cursor-pointer bg-[#faf7f0]/50 hover:bg-[#faf7f0] transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-6 h-6 text-[#8B6914] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-semibold text-[#1a1209]">
                          {uploadingImage ? 'Uploading image…' : 'Upload Store Image (PNG/JPG)'}
                        </p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* 8. Active Status Switch */}
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  id="retailer-active"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="retailer-active" className="text-xs font-semibold text-[#1a1209] cursor-pointer">
                  Active (Show on Public Retailers Locator)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="w-full py-3 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving Outlet…' : editingId ? 'Update Boutique Details' : '+ Add Authorized Retailer'}
              </button>
            </form>
          </div>

          {/* ── RETAILERS CATALOG (Right Side 7 Columns) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search Toolbar & Filters */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search boutique name, address, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914]"
                />
              </div>

              {/* City Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8B6914] uppercase">City:</span>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-1.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                >
                  <option value="all">All Cities ({totalRetailers})</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outlets Catalog List */}
            {loading ? (
              <div className="bg-white/95 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B6914] mx-auto" />
                <p className="mt-3 text-xs font-semibold text-[#8B6914] uppercase tracking-wider">Loading Boutique Outlets…</p>
              </div>
            ) : filteredRetailers.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm border border-dashed border-[#8B6914]/30 rounded-2xl p-16 text-center">
                <svg className="w-12 h-12 text-[#8B6914]/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-semibold text-[#1a1209]">No authorized retailers found</p>
                <p className="text-xs text-[#1a1209]/50 mt-1">Add a new boutique partner using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRetailers.map((retailer) => (
                  <div
                    key={retailer._id}
                    className="bg-white/95 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-5 shadow-md hover:border-[#8B6914]/40 transition-all flex flex-col sm:flex-row gap-5 items-start"
                  >
                    {/* Boutique Photo */}
                    <div className="w-full sm:w-28 h-28 bg-[#faf7f0] border border-[#1a1209]/10 rounded-xl overflow-hidden flex-shrink-0 relative group">
                      {retailer.image?.url ? (
                        <Image src={retailer.image.url} alt={retailer.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#1a1209]/30">
                          <svg className="w-6 h-6 mb-1 text-[#8B6914]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase">Store Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a1209]/5 pb-2">
                        <div>
                          <h3 className="font-bold text-base text-[#1a1209]">
                            {retailer.name}
                          </h3>
                          <p className="text-xs text-[#8B6914] font-semibold">
                            {retailer.city}, {retailer.country}
                          </p>
                        </div>

                        {/* Active Switch & Map Link */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(retailer._id, retailer.isActive)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                              retailer.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {retailer.isActive ? 'Active' : 'Inactive'}
                          </button>

                          {retailer.googleMapsLink && (
                            <a
                              href={retailer.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-0.5 bg-[#faf7f0] border border-[#8B6914]/30 hover:border-[#8B6914] text-[#8B6914] text-[10px] font-bold uppercase rounded-full transition-all flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Maps
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Address */}
                      <p className="text-xs text-[#1a1209]/80 font-medium">
                        {retailer.address}
                      </p>

                      {/* GPS Telemetry & Contact Details */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#1a1209]/60 pt-1">
                        {retailer.latitude !== undefined && retailer.longitude !== undefined && (
                          <span className="bg-[#faf7f0] px-2 py-0.5 border border-[#1a1209]/10 rounded-md font-bold text-[#8B6914]">
                            GPS: {retailer.latitude}, {retailer.longitude}
                          </span>
                        )}

                        {retailer.phone && (
                          <span className="font-semibold text-[#1a1209]">
                            Tel: {retailer.phone}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(retailer)}
                          className="px-3 py-1 border border-[#1a1209]/20 hover:border-[#8B6914] text-[#1a1209] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(retailer._id, retailer.name)}
                          className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
