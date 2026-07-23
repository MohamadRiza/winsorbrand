'use client';

import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ProductInfo {
  _id: string;
  title: string;
  modelNo: string;
  thumbnail?: {
    url: string;
  };
}

interface Review {
  _id: string;
  productId: ProductInfo | null;
  orderId?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images: string[];
  isAnonymous: boolean;
  isFake: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'real' | 'fake' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for Mock Review
  const [selectedProductId, setSelectedProductId] = useState('');
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, [filterType]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const typeParam = filterType === 'pending' ? 'all' : filterType;
      const res = await fetch(`/api/admin/reviews?type=${typeParam}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      toast.error('Network error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  };

  // Upload review image helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 2) {
      toast.error('You can upload a maximum of 2 images.');
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const url = await new Promise<string>((resolve, reject) => {
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
            try {
              const base64 = reader.result as string;
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  file: base64,
                  type: 'gallery',
                  name: file.name,
                }),
              });
              const uploadRes = await res.json();
              if (uploadRes.success && uploadRes.data?.url) {
                resolve(uploadRes.data.url);
              } else {
                reject(new Error(uploadRes.error || 'Upload failed'));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error('File read error'));
        });

        setAttachedImages(prev => [...prev, url]);
      }
      toast.success('Image(s) uploaded successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMockReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !username || !comment) {
      toast.error('Please fill in all required mock review fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          comment,
          username,
          userAvatar: userAvatar || null,
          images: attachedImages,
          isAnonymous,
          createdAt: customDate || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Mock review added successfully');
        setIsModalOpen(false);
        // Reset states
        setSelectedProductId('');
        setUsername('');
        setUserAvatar('');
        setRating(5);
        setComment('');
        setCustomDate('');
        setIsAnonymous(false);
        setAttachedImages([]);
        fetchReviews();
      } else {
        toast.error(data.error || 'Failed to inject mock review');
      }
    } catch (err) {
      toast.error('Network error creating mock review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    // 0ms Optimistic UI update
    setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, status } : r));

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Review ${status} successfully`);
      } else {
        toast.error(data.error || 'Failed to update review status');
        fetchReviews();
      }
    } catch (err) {
      toast.error('Network error updating review status');
      fetchReviews();
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? This cannot be undone.')) return;

    // Optimistic remove
    setReviews(prev => prev.filter(r => r._id !== reviewId));

    try {
      const res = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete review');
        fetchReviews();
      }
    } catch (err) {
      toast.error('Network error deleting review');
      fetchReviews();
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-base ${i < count ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  // Aggregates
  const totalReviewsCount = reviews.length;
  const realReviewsCount = reviews.filter(r => !r.isFake).length;
  const fakeReviewsCount = reviews.filter(r => r.isFake).length;
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reviews.filter(r => {
      const matchesSearch = !q ||
        (r.productId?.title || '').toLowerCase().includes(q) ||
        (r.productId?.modelNo || '').toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q);

      let matchesTab = true;
      if (filterType === 'real') {
        matchesTab = !r.isFake;
      } else if (filterType === 'fake') {
        matchesTab = r.isFake;
      } else if (filterType === 'pending') {
        matchesTab = r.status === 'pending';
      }

      return matchesSearch && matchesTab;
    });
  }, [reviews, searchQuery, filterType]);

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
              PRODUCT REVIEWS MODERATION
            </h1>
            <p className="text-sm text-[#1a1209]/60 mt-0.5">
              Approve customer feedback, inspect ratings, and inject promotional mock reviews.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8B6914] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Mock Review
          </button>
        </div>

        {/* ── Professional Tabular Metrics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL REVIEWS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalReviewsCount.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">REAL PATRON REVIEWS</p>
            <p className="font-['Jost'] text-3xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{realReviewsCount.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">ADMIN MOCK REVIEWS</p>
            <p className="font-['Jost'] text-3xl font-bold text-[#8B6914] mt-1 tabular-nums font-mono">{fakeReviewsCount.toLocaleString()}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-[#8B6914]/20 rounded-2xl p-4 shadow-sm hover:border-[#8B6914] transition-all">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">PENDING MODERATION</p>
            <p className="font-['Jost'] text-3xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{pendingReviewsCount.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Search & Filter Toolbar ── */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-md w-full">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by timepiece title, model, reviewer, or review comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
            />
          </div>

          <div className="flex bg-[#fbf9f4] border border-[#1a1209]/10 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
            {(['all', 'real', 'fake', 'pending'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-[#1a1209] text-white shadow-sm' 
                    : 'text-[#1a1209]/60 hover:text-[#1a1209]'
                }`}
              >
                {type === 'all' && `All Reviews (${totalReviewsCount})`}
                {type === 'real' && `Real Patron (${realReviewsCount})`}
                {type === 'fake' && `Admin Mock (${fakeReviewsCount})`}
                {type === 'pending' && `Pending (${pendingReviewsCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Reviews Cards List ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
            <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
              Loading Product Reviews…
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm border border-dashed border-[#8B6914]/30 rounded-2xl p-16 text-center">
            <svg className="w-12 h-12 text-[#8B6914]/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-base font-semibold text-[#1a1209]">No product reviews found matching criteria</p>
            <p className="text-xs text-[#1a1209]/50 mt-1">Try refining your search terms or filter tabs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white/95 backdrop-blur-sm border border-[#1a1209]/10 rounded-2xl p-6 shadow-md hover:border-[#8B6914]/30 transition-all flex flex-col md:flex-row gap-6"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 bg-[#faf7f0] border border-[#1a1209]/10 rounded-xl overflow-hidden flex-shrink-0 relative group">
                  {review.productId?.thumbnail?.url ? (
                    <Image 
                      src={review.productId.thumbnail.url} 
                      alt={review.productId.title} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1209]/5 flex items-center justify-center text-xs text-[#1a1209]/40">
                      No Image
                    </div>
                  )}
                </div>

                {/* Review Details Body */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a1209]/5 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-[#1a1209]">
                        {review.productId ? review.productId.title : 'Deleted Timepiece'}
                      </h3>
                      <p className="text-xs text-[#8B6914] font-mono font-semibold">
                        Model: {review.productId ? review.productId.modelNo : 'N/A'}
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        review.isFake 
                          ? 'bg-amber-50 text-[#8B6914] border-amber-300' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {review.isFake ? '💎 Admin Mock' : '🛡️ Real Patron'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        review.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : review.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars & Reviewer Info */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                    <span className="font-semibold text-[#1a1209]">
                      by {review.username} {review.isAnonymous ? '(Anonymous Patron)' : ''}
                    </span>
                    <span className="text-[#1a1209]/40 font-mono">
                      • {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Comment Body */}
                  <p className="text-sm text-[#1a1209] font-medium leading-relaxed bg-[#faf7f0]/60 border border-[#1a1209]/5 rounded-xl p-3.5">
                    {review.comment}
                  </p>

                  {/* Attached Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-3 pt-1">
                      {review.images.map((imgUrl, idx) => (
                        <a 
                          href={imgUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          key={idx} 
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#8B6914]/30 hover:border-[#8B6914] transition-all shadow-sm group"
                        >
                          <Image src={imgUrl} alt="Review attachment" fill className="object-cover group-hover:scale-110 transition-transform" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions Grid */}
                  <div className="flex items-center gap-2 pt-2">
                    {!review.isFake && review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(review._id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(review._id, 'rejected')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {review.status !== 'pending' && !review.isFake && (
                      <button
                        onClick={() => handleUpdateStatus(review._id, review.status === 'approved' ? 'rejected' : 'approved')}
                        className="px-3 py-1.5 border border-[#1a1209]/20 hover:border-[#8B6914] text-xs font-semibold text-[#1a1209] rounded-lg transition-all cursor-pointer"
                      >
                        Change to {review.status === 'approved' ? 'Reject' : 'Approve'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── OVERHAULED MOCK REVIEW INJECTION MODAL ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            {/* Modal Panel */}
            <div className="bg-[#faf7f0] rounded-2xl shadow-2xl border border-[#1a1209]/10 max-w-lg w-full relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex justify-between items-center">
                <div>
                  <h2 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                    INJECT ADMIN MOCK REVIEW
                  </h2>
                  <p className="text-xs text-[#8B6914] font-semibold mt-0.5">Post verified customer review for timepiece showcase</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleCreateMockReview} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Product Select */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    SELECT TIMEPIECE <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  >
                    <option value="">-- Choose Target Timepiece --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.title} ({p.modelNo})</option>
                    ))}
                  </select>
                </div>

                {/* Reviewer Username */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    REVIEWER NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sir Arthur P."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl text-xs font-semibold text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    STAR RATING <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className={`text-2xl transition-all cursor-pointer ${rating >= num ? 'text-amber-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date override */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    REVIEW DATE OVERRIDE (OPTIONAL)
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#1a1209]/15 rounded-xl font-mono text-xs text-[#1a1209]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    REVIEW COMMENT <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe timepiece craftsmanship, movement precision, and aesthetic finish..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#1a1209]/15 rounded-xl text-xs leading-relaxed text-[#1a1209] focus:outline-none focus:border-[#8B6914]"
                  />
                </div>

                {/* File upload for photos */}
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-[#8B6914] uppercase mb-1.5">
                    ATTACH PHOTOS (MAX 2)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || attachedImages.length >= 2}
                    className="text-xs text-[#1a1209]/70"
                  />
                  
                  {uploading && <p className="text-[10px] font-bold text-[#8B6914] mt-1">Uploading image attachments...</p>}

                  {attachedImages.length > 0 && (
                    <div className="flex gap-3 mt-2">
                      {attachedImages.map((url, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#8B6914]/30 shadow-sm">
                          <Image src={url} alt="Attached review item" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-black/70 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="mock-anonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-[#8B6914] focus:ring-[#8B6914]/20 cursor-pointer"
                  />
                  <label htmlFor="mock-anonymous" className="text-xs font-semibold text-[#1a1209] cursor-pointer">
                    Post as Anonymous Patron
                  </label>
                </div>

                {/* Submit / Cancel Footer */}
                <div className="pt-4 border-t border-[#1a1209]/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-[#1a1209]/20 text-[#1a1209] text-xs font-semibold rounded-xl hover:bg-[#1a1209]/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="px-6 py-2.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Injecting…' : 'Inject Mock Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
