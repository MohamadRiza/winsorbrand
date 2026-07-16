'use client';

import { useEffect, useState } from 'react';
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
  const [filterType, setFilterType] = useState<'all' | 'real' | 'fake'>('all');
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
      const res = await fetch(`/api/admin/reviews?type=${filterType}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
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
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Review ${status} successfully`);
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, status } : r));
      } else {
        toast.error(data.error || 'Failed to update review status');
      }
    } catch (err) {
      toast.error('Network error updating review status');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review deleted successfully');
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      } else {
        toast.error(data.error || 'Failed to delete review');
      }
    } catch (err) {
      toast.error('Network error deleting review');
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < count ? '#FFC107' : '#E0E0E0', fontSize: '15px' }}>★</span>
    ));
  };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", color: '#1a1209' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 500, margin: '0 0 4px 0' }}>Product Reviews</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(26,18,9,0.5)' }}>Approve customer feedback and inject mock/fake reviews for products.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#8B6914',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#1a1209')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#8B6914')}
        >
          + ADD MOCK REVIEW
        </button>
      </div>

      {/* FILTERS BAR */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,18,9,0.08)', paddingBottom: '16px' }}>
        {(['all', 'real', 'fake'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              background: filterType === type ? '#1a1209' : 'transparent',
              color: filterType === type ? '#faf7f0' : 'rgba(26,18,9,0.6)',
              border: filterType === type ? '1px solid #1a1209' : '1px solid rgba(26,18,9,0.12)',
              borderRadius: '4px',
              padding: '6px 16px',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {type === 'all' && 'All Reviews'}
            {type === 'real' && 'Customer Real Reviews'}
            {type === 'fake' && 'Admin Fake Reviews'}
          </button>
        ))}
      </div>

      {/* REVIEWS GRID / LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px' }}>Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#FAF7F0', border: '1px dashed rgba(26,18,9,0.15)', borderRadius: '8px', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'rgba(26,18,9,0.5)', fontSize: '14px' }}>No reviews found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((review) => (
            <div
              key={review._id}
              style={{
                background: '#fff',
                border: '1px solid rgba(26,18,9,0.06)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                gap: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
              }}
            >
              {/* Product Thumbnail */}
              <div style={{ width: '80px', height: '80px', position: 'relative', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(26,18,9,0.06)' }}>
                {review.productId?.thumbnail?.url ? (
                  <Image src={review.productId.thumbnail.url} alt={review.productId.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eaeaea' }} />
                )}
              </div>

              {/* Review details */}
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '14.5px', fontWeight: 600 }}>
                      {review.productId ? review.productId.title : 'Deleted Product'}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase' }}>
                      Model: {review.productId ? review.productId.modelNo : 'N/A'}
                    </span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      background: review.isFake ? 'rgba(139,105,20,0.1)' : 'rgba(46,125,50,0.1)',
                      color: review.isFake ? '#8B6914' : '#2e7d32',
                    }}>
                      {review.isFake ? 'Fake Review' : 'Real Customer'}
                    </span>

                    <span style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      background: review.status === 'approved' ? 'rgba(46,125,50,0.1)' : review.status === 'rejected' ? 'rgba(198,40,40,0.1)' : 'rgba(239,108,0,0.1)',
                      color: review.status === 'approved' ? '#2e7d32' : review.status === 'rejected' ? '#c62828' : '#ef6c00',
                    }}>
                      {review.status}
                    </span>
                  </div>
                </div>

                {/* Rating stars & User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {renderStars(review.rating)}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(26,18,9,0.8)' }}>
                    by {review.username} {review.isAnonymous ? '(Anonymous)' : ''}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)' }}>
                    • {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Comment Text */}
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(26,18,9,0.7)' }}>{review.comment}</p>

                {/* Attached review images */}
                {review.images && review.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    {review.images.map((imgUrl, idx) => (
                      <a href={imgUrl} target="_blank" rel="noopener noreferrer" key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(26,18,9,0.06)' }}>
                        <Image src={imgUrl} alt="Review attachment" fill style={{ objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {!review.isFake && review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(review._id, 'approved')}
                        style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(review._id, 'rejected')}
                        style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {review.status !== 'pending' && !review.isFake && (
                    <button
                      onClick={() => handleUpdateStatus(review._id, review.status === 'approved' ? 'rejected' : 'approved')}
                      style={{ background: 'transparent', border: '1px solid rgba(26,18,9,0.2)', color: 'rgba(26,18,9,0.6)', borderRadius: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Change to {review.status === 'approved' ? 'Reject' : 'Approve'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    style={{ background: 'transparent', border: '1px solid rgba(198,40,40,0.3)', color: '#c62828', borderRadius: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOCK INJECTION MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '30px', maxWidth: '500px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 500, margin: '0 0 20px 0' }}>Add Admin Mock Review</h2>
            
            <form onSubmit={handleCreateMockReview}>
              {/* Product Select */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Select Timepiece *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', background: '#fff', fontSize: '13px' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.title} ({p.modelNo})</option>
                  ))}
                </select>
              </div>

              {/* Reviewer Username */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Reviewer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John D."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', fontSize: '13px' }}
                />
              </div>

              {/* Reviewer Avatar */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Avatar Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://avatar.iran.liara.run/public/1"
                  value={userAvatar}
                  onChange={(e) => setUserAvatar(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', fontSize: '13px' }}
                />
              </div>

              {/* Star Rating */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Rating *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        color: rating >= num ? '#FFC107' : '#E0E0E0',
                        padding: 0,
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Date override */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Review Date (Optional override)</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', fontSize: '13px' }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Review comment *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe product quality, texture, and performance details."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', resize: 'vertical', fontSize: '13px' }}
                />
              </div>

              {/* File upload for photos */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', color: 'rgba(26,18,9,0.6)' }}>Attach Photos (Max 2)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading || attachedImages.length >= 2}
                  style={{ fontSize: '12px' }}
                />
                
                {uploading && <p style={{ fontSize: '11px', color: '#8B6914', margin: '4px 0 0 0' }}>Uploading image attachments...</p>}

                {attachedImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {attachedImages.map((url, i) => (
                      <div key={i} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}>
                        <Image src={url} alt="Attached review item" fill style={{ objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: '14px', height: '14px', borderRadius: '50%', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  id="mock-anonymous"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <label htmlFor="mock-anonymous" style={{ fontSize: '12px', color: 'rgba(26,18,9,0.8)', cursor: 'pointer' }}>Post as Anonymous</label>
              </div>

              {/* Submit / Cancel */}
              <div style={{ display: 'flex', justifyItems: 'stretch', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  style={{ flex: 1, padding: '12px', borderRadius: '4px', background: '#1a1209', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                >
                  {submitting ? 'Creating...' : 'Inject Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
