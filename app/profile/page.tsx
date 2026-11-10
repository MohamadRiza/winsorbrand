'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'MV', name: 'Maldives' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'JP', name: 'Japan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KR', name: 'South Korea' },
];

const DIAL_CODES = [
  { code: '+94', label: 'LK (+94)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+7', label: 'RU (+7)' },
  { code: '+86', label: 'CN (+86)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+960', label: 'MV (+960)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+64', label: 'NZ (+64)' },
  { code: '+41', label: 'CH (+41)' },
  { code: '+852', label: 'HK (+852)' },
  { code: '+65', label: 'SG (+65)' },
  { code: '+60', label: 'MY (+60)' },
  { code: '+62', label: 'ID (+62)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+974', label: 'QA (+974)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+82', label: 'KR (+82)' },
];

const getWatchImageUrl = (p: any): string => {
  if (!p) return '/winsor_hero_backgroundremoved.webp';
  if (p.thumbnail?.url) return p.thumbnail.url;
  if (typeof p.thumbnail === 'string' && p.thumbnail) return p.thumbnail;
  if (Array.isArray(p.images) && p.images.length > 0) {
    const img0 = p.images[0];
    if (typeof img0 === 'string' && img0) return img0;
    if (img0?.url) return img0.url;
  }
  if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
    const v0 = p.colorVariants[0];
    if (Array.isArray(v0.images) && v0.images.length > 0) {
      const vImg0 = v0.images[0];
      if (typeof vImg0 === 'string' && vImg0) return vImg0;
      if (vImg0?.url) return vImg0.url;
    }
  }
  return '/winsor_hero_backgroundremoved.webp';
};

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile-details' | 'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'security' | 'notifications' | 'reviews'>('dashboard');

  // Reviews States
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Form states for Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingReviewImg, setUploadingReviewImg] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Orders Filter & Search States
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Form States
  const [fullName, setFullName] = useState('');
  const [formData, setFormData] = useState({
    mobileCode: '+94',
    mobile: '',
    country: 'LK',
    address: '',
    city: '',
    postalCode: '',
  });

  // Membership calculation helper
  const getMembershipTier = (count: number) => {
    if (count < 2) return 'VERIFIED CLIENT';
    if (count >= 2 && count < 8) return 'BRONZE MEMBER';
    if (count >= 8 && count < 18) return 'SILVER MEMBER';
    if (count >= 18 && count < 35) return 'GOLD MEMBER';
    return 'PLATINUM MEMBER';
  };

  const membershipTier = getMembershipTier(orders.length);

  // Fetch Reviews Data on mount & tab change
  useEffect(() => {
    if (isSignedIn) {
      fetchReviewsData();
    }
  }, [isSignedIn, activeTab]);

  const fetchReviewsData = async () => {
    setLoadingReviews(true);
    try {
      const [pendingRes, myRes] = await Promise.all([
        fetch('/api/reviews/pending'),
        fetch('/api/reviews/my'),
      ]);
      const pendingData = pendingRes.ok && pendingRes.headers.get('content-type')?.includes('application/json') ? await pendingRes.json() : { success: false, data: [] };
      const myData = myRes.ok && myRes.headers.get('content-type')?.includes('application/json') ? await myRes.json() : { success: false, data: [] };
      if (pendingData.success) setPendingReviews(pendingData.data || []);
      if (myData.success) setMyReviews(myData.data || []);
    } catch (err) {
      console.error('Failed to load reviews data:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Helper: Check if a product item in an order has already been reviewed
  const isItemReviewed = (productId: string, orderRef?: string) => {
    return myReviews.some((r: any) => {
      const pId = typeof r.productId === 'object' ? r.productId?._id : r.productId;
      const matchesProduct = pId?.toString() === productId?.toString();
      const matchesOrder = orderRef && r.orderId ? r.orderId === orderRef : true;
      return matchesProduct && matchesOrder;
    });
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reviewImages.length + files.length > 2) {
      toast.error('You can upload a maximum of 2 images.');
      return;
    }

    setUploadingReviewImg(true);
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
          reader.onerror = () => reject(new Error('File reading failed'));
        });

        setReviewImages(prev => [...prev, url]);
      }
      toast.success('Images uploaded successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload images');
    } finally {
      setUploadingReviewImg(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem || !reviewComment) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewItem.productId,
          orderId: reviewItem.orderId,
          rating: reviewRating,
          comment: reviewComment,
          images: reviewImages,
          isAnonymous: reviewAnonymous,
          username: user?.fullName || 'Verified Customer',
          userAvatar: user?.imageUrl || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Your review has been submitted for moderation.');
        setIsReviewModalOpen(false);
        setReviewItem(null);
        setReviewRating(5);
        setReviewComment('');
        setReviewAnonymous(false);
        setReviewImages([]);
        fetchReviewsData();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('Network error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Fetch Mongo Profile & Orders
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/profile?clerkId=${user.id}&email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || '')}`);
        let data: any = { success: false };
        try {
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            data = await res.json();
          }
        } catch (e) {
          console.warn('Failed to parse profile details JSON:', e);
        }

        if (data.success && data.data) {
          const rawMobile = data.data.mobile || '';
          const cleanMobile = rawMobile.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
          setFormData({
            mobileCode: data.data.mobileCode || '+94',
            mobile: cleanMobile,
            country: data.data.country || 'LK',
            address: data.data.address || '',
            city: data.data.city || '',
            postalCode: (data.data.postalCode || '').replace(/\D/g, '').slice(0, 10),
          });
        }
      } catch (err) {
        console.warn('Failed to fetch profile details', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/customer/orders?clerkId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setOrders(data.data || []);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch orders:', e);
      }
    };

    fetchProfile();
    fetchOrders();
  }, [isSignedIn, user]);

  // Fetch All Products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAllProducts(data.data || []);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch products:', e);
      }
    };
    fetchProducts();
  }, []);

  // Sync Clerk FullName
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
    }
  }, [user]);

  // Read wishlist details
  useEffect(() => {
    const checkWishlist = () => {
      const savedWishlist = localStorage.getItem('winsor_wishlist');
      if (savedWishlist) {
        try {
          const arr = JSON.parse(savedWishlist);
          if (Array.isArray(arr)) {
            setWishlistIds(arr);
            setWishlistCount(arr.length);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    };
    checkWishlist();
    window.addEventListener('storage', checkWishlist);
    return () => window.removeEventListener('storage', checkWishlist);
  }, []);

  // Form Inputs Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      // Mobile Number: numbers only, skip leading '0' (start from 2nd digit), maximum 9 digits
      const digitsOnly = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
      setFormData(prev => ({ ...prev, mobile: digitsOnly }));
      return;
    }
    if (name === 'postalCode') {
      // Postal Code: numbers only, maximum 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, postalCode: digitsOnly }));
      return;
    }
    if (name === 'address') {
      // Home Address: maximum 200 characters
      setFormData(prev => ({ ...prev, address: value.slice(0, 200) }));
      return;
    }
    if (name === 'city') {
      // City / Town: maximum 100 characters
      setFormData(prev => ({ ...prev, city: value.slice(0, 100) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // 1. If Full Name changed, update Clerk details first
      if (fullName.trim() !== (user.fullName || '')) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await user.update({ firstName, lastName });
      }

      // 2. Update Mongo Details
      const cleanMobile = formData.mobile.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
      const payload = {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        profileImage: user.imageUrl,
        ...formData,
        mobile: cleanMobile,
      };

      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Information updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to save details');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not update details.');
    } finally {
      setSaving(false);
    }
  };

  // Wishlist removal handler
  const handleRemoveFromWishlist = (productId: string) => {
    const updated = wishlistIds.filter(id => id !== productId);
    setWishlistIds(updated);
    localStorage.setItem('winsor_wishlist', JSON.stringify(updated));
    setWishlistCount(updated.length);
    toast.success('Timepiece removed from wishlist.');
  };

  // Dynamic Profile Completion Rate
  const getCompletionPercentage = () => {
    const fields = [
      fullName,
      formData.mobile,
      formData.country,
      formData.address,
      formData.city,
      formData.postalCode
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  // Active / Completed Orders calculation (Synced with MongoDB lowercase status schema)
  const activeOrdersCount = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'pending' || s === 'processing' || s === 'shipped';
  }).length;

  const completedOrdersCount = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'delivered';
  }).length;

  // Orders Filter Counts & Filtered Orders
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
    processing: orders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
    shipped: orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
    cancelled: orders.filter(o => ['cancelled', 'cancel_requested'].includes((o.status || '').toLowerCase())).length,
  };

  const filteredOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    if (orderFilter === 'pending' && s !== 'pending') return false;
    if (orderFilter === 'processing' && s !== 'processing') return false;
    if (orderFilter === 'shipped' && s !== 'shipped') return false;
    if (orderFilter === 'delivered' && s !== 'delivered') return false;
    if (orderFilter === 'cancelled' && !['cancelled', 'cancel_requested'].includes(s)) return false;

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchRef = (o.orderRef || '').toLowerCase().includes(q);
      const matchItem = Array.isArray(o.items) && o.items.some((item: any) =>
        (item.productTitle || '').toLowerCase().includes(q) ||
        (item.productModelNo || '').toLowerCase().includes(q) ||
        (item.colorVariant || '').toLowerCase().includes(q)
      );
      if (!matchRef && !matchItem) return false;
    }
    return true;
  });

  // Filtered Wishlist Products
  const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p._id));

  const profileStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

        .profile-page-container {
          background-color: #FBFBFC;
          min-height: 100vh;
          padding: 130px 24px 80px;
          font-family: 'Jost', sans-serif;
          color: #141414;
        }

        /* ── Loading ── */
        .profile-loading-wrapper {
          min-height: 80vh;
          display: flex; align-items: center; justify-content: center;
          background-color: #FBFBFC;
        }
        .profile-spinner {
          width: 36px; height: 36px;
          border: 2px solid rgba(20,20,20,0.1);
          border-top: 2px solid #141414;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Access Card (Unauthenticated) ── */
        .access-card {
          background: #FFFFFF;
          border: 1px solid rgba(20,20,20,0.08);
          box-shadow: 0 20px 50px rgba(0,0,0,0.06);
          border-radius: 16px;
          max-width: 480px;
          margin: 60px auto;
          padding: 48px 36px;
          text-align: center;
          box-sizing: border-box;
        }
        .access-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 500;
          color: #141414;
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }
        .access-subtitle {
          font-size: 13.5px;
          color: #666666;
          line-height: 1.65;
          margin-bottom: 28px;
        }

        /* ── Portal Wrapper ── */
        .profile-portal-wrapper {
          max-width: 1180px;
          margin: 0 auto;
          display: flex; flex-direction: column;
          gap: 28px;
        }

        /* ── Header Banner (Swiss Luxury Warm Pearl & Gold Card) ── */
        .portal-header-banner {
          background: linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 45%, #F4EFEB 100%);
          border: 1px solid rgba(197, 168, 128, 0.35);
          border-radius: 18px;
          padding: 32px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(20, 20, 20, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .banner-watermark {
          position: absolute; right: 230px; top: 50%;
          transform: translateY(-50%);
          width: 260px; height: auto;
          opacity: 0.035; pointer-events: none;
        }
        .banner-glow-effect {
          display: none;
        }

        .header-banner-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 2;
        }
        .header-banner-profile-row {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .avatar-wrapper {
          position: relative;
          width: 90px; height: 90px; flex-shrink: 0;
        }
        .avatar-img {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1.5px rgba(197, 168, 128, 0.45);
          padding: 2px;
          object-fit: cover;
          background: #FAF8F5;
        }
        .avatar-fallback {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1.5px rgba(197, 168, 128, 0.45);
          background: linear-gradient(135deg, #222222 0%, #141414 100%);
          color: #FAF8F5;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 500;
          font-family: 'Cormorant Garamond', serif;
        }
        .avatar-edit-btn {
          position: absolute; bottom: 0; right: 0;
          width: 28px; height: 28px;
          background: #8C6D3B;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #FFFFFF; cursor: pointer;
          box-shadow: 0 2px 8px rgba(140, 109, 59, 0.28);
          transition: all 0.2s ease;
        }
        .avatar-edit-btn:hover { transform: scale(1.1); background: #7A5E30; }

        .header-info-block { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .patron-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 600;
          color: #141414; margin: 0; letter-spacing: 0.02em;
        }
        .member-since { font-size: 12.5px; color: #666666; margin-top: 1px; letter-spacing: 0.01em; }
        .client-id-pill {
          font-family: 'Jost', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: #FAF6EE;
          color: #8C6D3B;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid #E5D7BE;
          box-shadow: 0 1px 3px rgba(140, 109, 59, 0.06);
        }

        /* ── Header Banner Timepiece Showcase ── */
        .header-banner-showcase {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 220px;
          flex-shrink: 0;
          position: relative;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(197, 168, 128, 0.3);
          box-shadow: 0 4px 16px rgba(20, 20, 20, 0.03);
          backdrop-filter: blur(8px);
          z-index: 2;
        }
        .banner-watch-glow {
          position: absolute;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197, 168, 128, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .banner-watch-img {
          width: 125px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 14px 18px rgba(20, 20, 20, 0.16));
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
        }
        .header-banner-showcase:hover .banner-watch-img {
          transform: translateY(-4px) scale(1.05);
        }
        .banner-watch-tag {
          font-family: 'Jost', sans-serif;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #141414;
          margin-top: 8px;
          z-index: 2;
        }
        .banner-watch-sub {
          font-size: 9px;
          color: #8C6D3B;
          letter-spacing: 0.04em;
          margin-top: 1px;
          z-index: 2;
        }

        /* ── Hero Metrics Grid ── */
        .hero-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 4px;
          border-top: 1px solid rgba(197, 168, 128, 0.25);
          padding-top: 16px;
          width: 100%;
        }
        .hero-stat-card {
          background: #FFFFFF;
          border: 1px solid rgba(197, 168, 128, 0.28);
          border-radius: 12px;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(20, 20, 20, 0.02);
          transition: all 0.25s ease;
        }
        .hero-stat-card:hover {
          background: #FFFFFF;
          border-color: #8C6D3B;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(140, 109, 59, 0.12);
        }
        .hero-stat-icon-wrapper {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: #FAF8F5;
          border: 1px solid rgba(197, 168, 128, 0.3);
          display: flex; align-items: center; justify-content: center;
          color: #8C6D3B; flex-shrink: 0;
        }
        .hero-stat-val {
          font-family: 'Jost', monospace;
          font-variant-numeric: tabular-nums;
          font-size: 19px; font-weight: 700;
          color: #141414; line-height: 1;
        }
        .hero-stat-lbl {
          font-size: 9px; font-weight: 600;
          color: #777777;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 3px;
        }

        /* ── Portal Grid ── */
        .portal-main-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px; align-items: start;
        }

        /* ── Sidebar ── */
        .portal-sidebar { display: flex; flex-direction: column; gap: 20px; }
        .portal-sidebar-desktop { display: flex; flex-direction: column; gap: 20px; }
        .sidebar-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          overflow: hidden; padding: 8px 0;
        }
        .sidebar-menu-btn {
          display: flex; align-items: center; gap: 11px;
          width: 100%; padding: 11px 20px;
          border: none; background: transparent;
          font-family: 'Jost', sans-serif;
          font-size: 13px; font-weight: 500;
          color: #555555;
          text-align: left; cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .sidebar-menu-btn:hover { background: #F8F7F4; color: #141414; }
        .sidebar-menu-btn.active {
          background: #F8F7F4;
          border-left-color: #141414;
          color: #141414; font-weight: 600;
        }
        .sidebar-menu-btn svg { flex-shrink: 0; }

        /* ── Completion Box ── */
        .completion-box {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 14px;
          padding: 22px 18px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .completion-title { font-size: 11.5px; font-weight: 600; color: #141414; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
        .completion-desc { font-size: 11px; color: #666666; line-height: 1.5; margin: 0; }
        .circular-chart { display: block; margin: 4px auto; max-width: 68px; max-height: 68px; }
        .circle-bg { stroke: #EEEEEE; }
        .circle { transition: stroke-dasharray 0.4s ease; stroke: #141414; }
        .percentage { font-family: 'Jost', sans-serif; fill: #141414; }

        /* ── Content Panel ── */
        .portal-content-panel { display: flex; flex-direction: column; gap: 24px; }
        .content-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 16px;
          padding: 30px 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
        }
        .card-header-block {
          border-bottom: 1px solid rgba(20, 20, 20, 0.07);
          padding-bottom: 16px; margin-bottom: 22px;
        }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #141414; margin: 0; letter-spacing: 0.01em; }
        .card-subtitle { font-size: 13px; color: #666666; margin: 4px 0 0; }

        /* ── Form ── */
        .profile-custom-form { display: flex; flex-direction: column; gap: 18px; }
        .profile-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .profile-form-group { display: flex; flex-direction: column; gap: 6px; }
        .profile-form-label { font-size: 11px; font-weight: 600; color: #333333; letter-spacing: 0.04em; text-transform: uppercase; }
        .input-wrapper-gold { position: relative; display: flex; align-items: center; width: 100%; }
        .input-icon-left { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #888888; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 2; line-height: 1; }
        .input-icon-right { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: #999999; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 2; line-height: 1; }
        .profile-form-input {
          width: 100%; padding: 11px 16px 11px 40px;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 8px;
          font-family: 'Jost', sans-serif; font-size: 13.5px;
          color: #141414; background: #FBFBFC;
          outline: none; transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .profile-form-input:focus { border-color: #141414; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.06); }
        .profile-form-input:disabled { background: #F4F4F6; border-color: rgba(20, 20, 20, 0.08); color: #777777; cursor: not-allowed; padding-right: 40px; }
        .custom-select {
          width: 100%; padding: 11px 28px 11px 40px;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 8px;
          font-family: 'Jost', sans-serif; font-size: 13.5px;
          color: #141414; background: #FBFBFC;
          outline: none; appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat; background-position: right 12px center; background-size: 12px;
          cursor: pointer; box-sizing: border-box; transition: all 0.2s ease;
        }
        .custom-select:focus { border-color: #141414; background-color: #FFFFFF; box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.06); }

        /* ── Action Buttons (Signature Warm Antique Gold) ── */
        .gold-action-btn {
          background: #8C6D3B;
          background: linear-gradient(135deg, #9C7A3C 0%, #8C6D3B 100%);
          border: 1px solid #8C6D3B;
          color: #FFFFFF;
          padding: 13px 26px;
          font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; border-radius: 8px;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%; text-transform: uppercase;
          box-shadow: 0 4px 14px rgba(140, 109, 59, 0.25);
        }
        .gold-action-btn:hover {
          background: linear-gradient(135deg, #A88646 0%, #967640 100%);
          border-color: #967640;
          box-shadow: 0 6px 20px rgba(140, 109, 59, 0.32);
          transform: translateY(-1px);
        }
        .gold-action-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(140, 109, 59, 0.2);
        }
        .gold-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Bottom split ── */
        .portal-bottom-split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }

        /* ── Recent Orders ── */
        .recent-orders-list { display: flex; flex-direction: column; gap: 10px; }
        .recent-order-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 14px;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 10px;
          background: #FBFBFC;
          transition: all 0.2s ease;
        }
        .recent-order-item:hover { border-color: rgba(20, 20, 20, 0.18); background: #FFFFFF; }
        .order-watch-thumb {
          width: 48px; height: 48px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          display: flex; align-items: center; justify-content: center;
          padding: 4px; flex-shrink: 0;
        }
        .order-watch-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .recent-order-info { flex: 1; min-width: 0; }
        .order-item-title { font-size: 13px; font-weight: 600; color: #141414; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .order-ref-date { font-size: 11px; color: #666666; margin-top: 2px; }

        /* ── Status Badges ── */
        .status-badge { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .status-badge.pending { background: #F5F5F5; color: #616161; border: 1px solid rgba(0,0,0,0.1); }
        .status-badge.processing { background: #FFF3E0; color: #E65100; border: 1px solid rgba(230,81,0,0.2); }
        .status-badge.shipped { background: #E3F2FD; color: #1565C0; border: 1px solid rgba(21,101,192,0.2); }
        .status-badge.delivered { background: #E8F5E9; color: #2E7D32; border: 1px solid rgba(46,125,50,0.2); }
        .status-badge.cancelled { background: #FFEBEE; color: #C62828; border: 1px solid rgba(198,40,40,0.2); }
        .status-badge.cancel_requested { background: #FFF8E1; color: #B78103; border: 1px solid rgba(183,129,3,0.25); }

        /* ── Order Filter Bar ── */
        .order-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.07);
        }
        .order-filter-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .order-filter-pills::-webkit-scrollbar { display: none; }
        .order-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          background: #FFFFFF;
          color: #555555;
          border: 1px solid rgba(20, 20, 20, 0.12);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .order-filter-pill:hover {
          border-color: #141414;
          color: #141414;
        }
        .order-filter-pill.active {
          background: #141414;
          color: #FFFFFF;
          border-color: #141414;
        }
        .filter-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(20, 20, 20, 0.08);
          color: #555555;
          transition: all 0.2s ease;
        }
        .order-filter-pill.active .filter-pill-badge {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }
        .order-search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 380px;
        }
        .order-search-box .search-icon {
          position: absolute;
          left: 12px;
          color: #888888;
          pointer-events: none;
        }
        .order-search-input {
          width: 100%;
          padding: 9px 34px 9px 36px;
          border-radius: 8px;
          border: 1px solid rgba(20, 20, 20, 0.12);
          background: #FBFBFC;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          color: #141414;
          outline: none;
          transition: all 0.2s ease;
        }
        .order-search-input:focus {
          border-color: #141414;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.06);
        }
        .order-search-clear {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          font-size: 16px;
          color: #888888;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .order-search-clear:hover { color: #141414; }

        /* ── Profile Order Card ── */
        .profile-order-card {
          border: 1px solid rgba(20, 20, 20, 0.08);
          padding: 18px 20px;
          border-radius: 14px;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .profile-order-card:hover {
          border-color: rgba(20, 20, 20, 0.16);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
        }

        .poc-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.06);
          padding-bottom: 12px;
          width: 100%;
        }
        .poc-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .poc-ref {
          font-weight: 600;
          color: #141414;
          font-size: 13.5px;
          font-family: 'Jost', monospace;
          word-break: break-all;
        }
        .poc-header-sub {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: #666666;
          flex-wrap: wrap;
        }
        .poc-items-count {
          color: #141414;
          font-weight: 500;
        }

        .poc-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .poc-item-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.06);
        }
        .poc-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .poc-item-thumb {
          width: 52px;
          height: 52px;
          background: #F9F9FB;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          flex-shrink: 0;
        }
        .poc-item-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .poc-item-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .poc-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #141414;
          line-height: 1.3;
          word-break: break-word;
        }
        .poc-item-meta {
          font-size: 11px;
          color: #666666;
          line-height: 1.3;
        }
        .poc-item-price-block {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }
        .poc-item-price {
          font-size: 12.5px;
          font-weight: 600;
          color: #141414;
        }

        .poc-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(20, 20, 20, 0.06);
          flex-wrap: wrap;
          gap: 12px;
          width: 100%;
        }
        .poc-total {
          font-size: 12.5px;
          color: #666666;
        }
        .poc-total strong {
          color: #141414;
          font-size: 14px;
          font-weight: 600;
        }
        .poc-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .poc-btn-track {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 6px;
          background: #8C6D3B;
          background: linear-gradient(135deg, #9C7A3C 0%, #8C6D3B 100%);
          border: 1px solid #8C6D3B;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(140, 109, 59, 0.22);
        }
        .poc-btn-track:hover {
          background: linear-gradient(135deg, #A88646 0%, #967640 100%);
          border-color: #967640;
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(140, 109, 59, 0.32);
        }
        .poc-btn-details {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.15);
          color: #141414;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .poc-btn-details:hover {
          background: #F4F4F6;
          border-color: #141414;
        }

        /* ── Membership Privileges Card ── */
        .patron-black-card {
          background: linear-gradient(135deg, #FAF8F5 0%, #FFFFFF 50%, #F5F1E8 100%);
          border: 1px solid rgba(197, 168, 128, 0.35);
          border-radius: 14px; padding: 22px;
          color: #141414; position: relative; overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px rgba(20,20,20,0.03);
        }
        .black-card-title { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 600; letter-spacing: 0.12em; color: #8C6D3B; margin: 0 0 4px 0; text-transform: uppercase; }
        .black-card-desc { font-size: 11.5px; color: #666666; margin: 0; font-family: 'Jost', sans-serif; line-height: 1.55; }
        .black-card-gold-seal { position: absolute; right: -8px; bottom: -10px; font-size: 54px; opacity: 0.08; pointer-events: none; }
        .benefits-checklist { display: flex; flex-direction: column; gap: 9px; }
        .benefit-check-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #333333; font-weight: 500; }
        .benefit-check-icon {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #FAF6EE;
          border: 1px solid #E5D7BE;
          color: #8C6D3B;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Dashboard banner ── */
        .dashboard-welcome-banner {
          background: #F8F7F4;
          border: 1px solid rgba(20,20,20,0.06);
          border-radius: 12px; padding: 22px; margin-bottom: 20px;
        }

        /* ═══════════════════════════════════════
           DESKTOP 1025-1280
           ═══════════════════════════════════════ */
        @media (max-width: 1024px) {
          .portal-main-grid { grid-template-columns: 200px 1fr; gap: 20px; }
          .portal-bottom-split { grid-template-columns: 1fr; gap: 20px; }
        }

        /* ═══════════════════════════════════════
           MOBILE ≤ 768px
           ═══════════════════════════════════════ */
        .mobile-tab-bar { display: none; }
        .mobile-completion-strip { display: none; }

        @media (max-width: 768px) {
          /* ── Shell ── */
          .profile-page-container { padding: 0 0 96px; }
          .access-card { margin: 100px 16px 40px !important; padding: 36px 20px !important; }
          .profile-portal-wrapper { padding: 0; gap: 0; }

          /* ── Header Banner ── */
          .portal-header-banner {
            border-radius: 0 0 20px 20px;
            border-left: none; border-right: none; border-top: none;
            flex-direction: column; align-items: center; text-align: center;
            padding: 96px 16px 26px;
            gap: 16px; margin-bottom: 0;
            box-shadow: 0 6px 20px rgba(20,20,20,0.05);
            background: linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 55%, #F4EFEB 100%);
          }
          .banner-watermark {
            display: none !important;
          }

          .header-banner-showcase {
            display: none !important;
          }
          .header-banner-profile-row {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          /* ── Avatar ── */
          .avatar-wrapper {
            width: 84px; height: 84px;
            margin-bottom: 4px;
          }
          .avatar-img, .avatar-fallback {
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1.5px rgba(197, 168, 128, 0.45);
          }
          .avatar-edit-btn {
            background: #8C6D3B;
            color: #FFFFFF;
          }

          /* ── Name & Badge ── */
          .header-info-block { align-items: center; text-align: center; gap: 6px; }
          .patron-name { font-size: 24px; color: #141414; }
          .member-since { color: #666666; font-size: 11.5px; text-align: center; }

          /* ── Stats: 2x2 grid for mobile ── */
          .hero-stats-grid {
            display: grid; grid-template-columns: repeat(2, 1fr);
            gap: 8px; margin-top: 14px; padding-top: 14px;
            border-top: 1px solid rgba(197, 168, 128, 0.25); width: 100%;
          }
          .hero-stat-card {
            padding: 9px 11px;
            gap: 8px;
            border-radius: 10px;
            background: #FFFFFF;
            border: 1px solid rgba(197, 168, 128, 0.28);
          }
          .hero-stat-icon-wrapper { width: 28px; height: 28px; background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.3); color: #8C6D3B; }
          .hero-stat-val { font-size: 15px; color: #141414; }
          .hero-stat-lbl { font-size: 8px; color: #777777; }

          /* ── Dashboard stat tiles 2x2 grid ── */
          .dashboard-metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-top: 14px !important;
          }
          .metric-tile-card {
            padding: 12px 10px !important;
            border-radius: 10px !important;
          }
          .metric-tile-label { font-size: 8.5px !important; }
          .metric-tile-value { font-size: 22px !important; }
          .metric-tile-sub { font-size: 9px !important; }

          .dashboard-welcome-banner {
            padding: 16px 14px !important;
            border-radius: 10px !important;
          }

          /* ── Sticky bottom tab bar ── */
          .portal-sidebar-desktop { display: none !important; }
          .mobile-tab-bar {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            z-index: 200;
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            gap: 0; padding: 0 0 env(safe-area-inset-bottom, 0px);
            background: #FFFFFF;
            border-top: 1px solid rgba(20,20,20,0.08);
            scrollbar-width: none;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          }
          .mobile-tab-bar::-webkit-scrollbar { display: none; }
          .mobile-tab-pill {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 3px;
            white-space: nowrap; scroll-snap-align: start;
            padding: 9px 12px 7px;
            border: none; border-top: 2px solid transparent;
            background: transparent;
            font-family: 'Jost', sans-serif;
            font-size: 9px; font-weight: 500; letter-spacing: 0.04em;
            color: #666666;
            cursor: pointer; flex-shrink: 0; min-width: 58px;
            transition: all 0.15s ease; text-transform: uppercase;
          }
          .mobile-tab-pill svg { opacity: 0.7; }
          .mobile-tab-pill.active { border-top-color: #141414; color: #141414; background: #F8F7F4; font-weight: 600; }
          .mobile-tab-pill.active svg { opacity: 1; }
          .mobile-tab-pill.logout-pill { color: #C62828; }

          /* ── Compact completion strip ── */
          .mobile-completion-strip {
            display: flex; align-items: center; gap: 14px;
            background: #FFFFFF;
            border-bottom: 1px solid rgba(20,20,20,0.08);
            padding: 12px 16px;
          }
          .mcs-ring { flex-shrink: 0; }
          .mcs-text { flex: 1; min-width: 0; }
          .mcs-title { font-size: 10.5px; font-weight: 600; color: #141414; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
          .mcs-desc { font-size: 10px; color: #666666; margin: 2px 0 0; }
          .mcs-btn {
            background: #8C6D3B;
            background: linear-gradient(135deg, #9C7A3C 0%, #8C6D3B 100%);
            color: #FFFFFF; border: none;
            padding: 6px 14px; border-radius: 6px;
            font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 600;
            letter-spacing: 0.06em; text-transform: uppercase;
            cursor: pointer; flex-shrink: 0; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(140, 109, 59, 0.25);
          }

          /* ── Content layout ── */
          .portal-main-grid { grid-template-columns: 1fr; gap: 0; }
          .portal-content-panel {
            gap: 14px;
            padding: 14px 12px 90px !important;
            overflow-x: hidden;
            width: 100%;
            box-sizing: border-box;
          }
          .content-card {
            padding: 16px 14px !important;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
            background: #FFFFFF;
            border: 1px solid rgba(20, 20, 20, 0.08);
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
          }
          .card-title { font-size: 20px; }
          .card-subtitle { font-size: 11.5px; }

          /* ── Profile form ── */
          .profile-custom-form { gap: 14px; }
          .profile-form-grid { grid-template-columns: 1fr; gap: 12px; }
          .profile-form-label { font-size: 10px; }
          .profile-form-input { font-size: 13px; padding: 10px 12px 10px 36px; border-radius: 6px; }
          .custom-select { font-size: 13px; padding: 10px 24px 10px 36px; border-radius: 6px; }

          /* ── Orders ── */
          .recent-orders-list { gap: 8px; }
          .recent-order-item { padding: 10px 12px; border-radius: 8px; }
          .order-watch-thumb { width: 42px; height: 42px; }
          .order-item-title { font-size: 12px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .order-ref-date { font-size: 10px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .status-badge { flex-shrink: 0; font-size: 8.5px; }

          /* ── Mobile Profile Order Card Rules ── */
          .profile-order-card {
            padding: 14px 12px !important;
            border-radius: 10px !important;
            gap: 12px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .poc-header-top { gap: 8px !important; }
          .poc-ref {
            font-size: 12px !important;
            max-width: calc(100% - 85px) !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .poc-item-thumb { width: 44px !important; height: 44px !important; }
          .poc-item-title { font-size: 12px !important; }
          .poc-item-meta { font-size: 10.5px !important; }
          .poc-item-price-block {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin-top: 4px !important;
          }
          .poc-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .poc-total {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            font-size: 12px !important;
          }
          .poc-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .poc-btn-track, .poc-btn-details {
            width: 100% !important;
            padding: 8px 6px !important;
            font-size: 10px !important;
          }
          .order-filter-bar {
            margin-bottom: 14px !important;
            padding-bottom: 10px !important;
            gap: 8px !important;
          }
          .order-filter-pill {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
          .order-search-box {
            max-width: 100% !important;
          }

          /* ── Bottom split ── */
          .portal-bottom-split { display: flex; flex-direction: column; gap: 14px; }

          /* ── Hide desktop completion box on mobile ── */
          .completion-box { display: none; }
        }
`;

  // Clerk Loading State
  if (!isLoaded) {
    return (
      <div className="profile-loading-wrapper">
        <style>{`${profileStyles}`}</style>
        <div className="profile-spinner" />
      </div>
    );
  }

  // Unauthenticated State
  if (!isSignedIn) {
    return (
      <div className="profile-page-container">
        <style>{`${profileStyles}`}</style>
        <div className="access-card">
          <div style={{ width: '84px', height: '84px', margin: '0 auto 16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '76px', height: '76px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(197, 168, 128, 0.2) 0%, transparent 70%)' }} />
            <img src="/winsor_hero_backgroundremoved.webp" alt="Winsor Timepiece" style={{ width: '72px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.15))', zIndex: 2 }} />
          </div>
          <h1 className="access-title">Client Portal</h1>
          <p className="access-subtitle">
            Sign in to access your order history, manage personal delivery details, and view your verified timepieces.
          </p>
          <div>
            <Link href="/login">
              <button className="gold-action-btn">
                SIGN IN / REGISTER
              </button>
            </Link>
          </div>
          <div style={{ marginTop: '20px' }}>
            <Link href="/collections" style={{ fontSize: '11px', color: '#666666', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>
              ← Return to Boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Real patron orders mapping (synced with MongoDB database)
  const displayOrders = orders.slice(0, 5).map(o => ({
    orderRef: o.orderRef,
    date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: (o.status || 'pending').toLowerCase(),
    statusLabel: (o.status || 'pending').replace('_', ' ').toUpperCase(),
    productTitle: o.items[0]?.productTitle || 'Winsor Timepiece',
    productThumbnail: o.items[0]?.productThumbnail || '/winsor_hero_backgroundremoved.webp'
  }));

  return (
    <div className="profile-page-container">
      <style>{`${profileStyles}`}</style>


      <div className="profile-portal-wrapper">
        {/* TOP CLIENT HEADER BANNER (SWISS LUXURY LIGHT THEME WITH TIMEPIECE SHOWCASE) */}
        <div className="portal-header-banner">
          <img src="/winsor_hero_backgroundremoved.webp" alt="Winsor Watermark" className="banner-watermark" />

          {/* Left Column: Profile Row & Stats */}
          <div className="header-banner-left">
            <div className="header-banner-profile-row">
              <div className="avatar-wrapper">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">{user.firstName?.charAt(0) || 'U'}</div>
                )}
                <div className="avatar-edit-btn" onClick={() => openUserProfile()} title="Edit Profile Details">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
              </div>

              <div className="header-info-block">
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                  <h1 className="patron-name">{fullName || 'WINSOR CLIENT'}</h1>
                  <span className="client-id-pill">
                    CLIENT ID: #WS-{(user.id || '987654').slice(-6).toUpperCase()}
                  </span>
                </div>

                <span className="member-since">
                  Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} • Verified Winsor Timepieces Client
                </span>
              </div>
            </div>

            {/* Professional Numbers Hero Stats Grid */}
            <div className="hero-stats-grid">
              <div className="hero-stat-card">
                <div className="hero-stat-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className="hero-stat-val">{orders.length.toString().padStart(2, '0')}</div>
                  <div className="hero-stat-lbl">ACQUISITIONS</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="hero-stat-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <div className="hero-stat-val">{wishlistCount.toString().padStart(2, '0')}</div>
                  <div className="hero-stat-lbl">WISHLIST</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="hero-stat-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className="hero-stat-val">{(orders.length * 25).toLocaleString()}</div>
                  <div className="hero-stat-lbl">POINTS</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="hero-stat-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="hero-stat-val text-xs text-[#141414] font-semibold font-sans tracking-wide uppercase">
                    {orders.length >= 2 ? membershipTier.replace(' MEMBER', '') : 'VERIFIED'}
                  </div>
                  <div className="hero-stat-lbl">ACCOUNT STATUS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Timepiece Showcase Widget (Desktop/Tablet) */}
          <div className="header-banner-showcase">
            <div className="banner-watch-glow" />
            <img src="/winsor_hero_backgroundremoved.webp" alt="Winsor Flagship Watch" className="banner-watch-img" />
            <div className="banner-watch-tag">FLAGSHIP CALIBRE</div>
            <div className="banner-watch-sub">Japanese Precision Movement</div>
          </div>
        </div>

        {/* MOBILE SWIPEABLE TAB BAR — shown only on mobile */}
        <div className="mobile-tab-bar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
            { id: 'profile-details', label: 'Profile', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
            { id: 'orders', label: 'Orders', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg> },
            { id: 'wishlist', label: 'Wishlist', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
            { id: 'reviews', label: 'Reviews', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
            { id: 'addresses', label: 'Addresses', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
            { id: 'security', label: 'Security', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
            { id: 'notifications', label: 'Alerts', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
          ].map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button className="mobile-tab-pill logout-pill" onClick={() => signOut()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>

        {/* MOBILE PROFILE COMPLETION STRIP — shown only on mobile */}
        <div className="mobile-completion-strip">
          <div className="mcs-ring">
            <svg width="44" height="44" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#eaeaea" strokeWidth="3" />
              <path strokeDasharray={`${completionPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#141414" strokeWidth="3" strokeLinecap="round" />
              <text x="18" y="21" fill="#141414" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Jost, sans-serif">
                {completionPercentage}%
              </text>
            </svg>
          </div>
          <div className="mcs-text">
            <p className="mcs-title">Profile Completion</p>
            <p className="mcs-desc">Fill details for priority dispatch access</p>
          </div>
          <button className="mcs-btn" onClick={() => { setActiveTab('profile-details'); }}>
            Complete
          </button>
        </div>

        {/* TWO-COLUMN PORTAL GRID */}
        <div className="portal-main-grid">
          {/* Left Sidebar — hidden on mobile via CSS */}
          <div className="portal-sidebar portal-sidebar-desktop">
            <div className="sidebar-card">
              <button className={`sidebar-menu-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'profile-details' ? 'active' : ''}`} onClick={() => setActiveTab('profile-details')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile Details
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                Orders
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Wishlist
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                My Reviews
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Addresses
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Security
              </button>
              <button className={`sidebar-menu-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Notifications
              </button>
              <button className="sidebar-menu-btn" onClick={() => signOut()} style={{ color: '#c62828' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>

            {/* Profile Completion Box */}
            <div className="completion-box">
              <h4 className="completion-title">Profile Completion</h4>

              <svg width="72" height="72" viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eaeaea"
                  strokeWidth="2.5"
                />
                <path className="circle"
                  strokeDasharray={`${completionPercentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#141414"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text x="18" y="20.35" className="percentage" fill="#141414" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {completionPercentage}%
                </text>
              </svg>

              <p className="completion-desc">
                Complete your profile details to unlock private boutique events and priority dispatch services.
              </p>
              <button
                type="button"
                className="gold-action-btn"
                style={{ padding: '8px 16px', fontSize: '9.5px', marginTop: '6px' }}
                onClick={() => {
                  setActiveTab('profile-details');
                  toast.success('Scroll to fill blank details below.');
                }}
              >
                COMPLETE DETAILS
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="portal-content-panel">
            {/* PROFILE DETAILS TAB */}
            {activeTab === 'profile-details' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Profile Details</h3>
                  <p className="card-subtitle">Manage your personal details and billing destinations.</p>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <div className="profile-spinner" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="profile-custom-form">

                    {/* Name & Email Row */}
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">Full Name</label>
                        <div className="input-wrapper-gold">
                          <span className="input-icon-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="profile-form-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Email Address <span style={{ color: '#666666', fontSize: '9px', fontWeight: 500 }}>(Synced with Clerk)</span></label>
                        <div className="input-wrapper-gold">
                          <span className="input-icon-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </span>
                          <input
                            type="email"
                            value={user.primaryEmailAddress?.emailAddress || ''}
                            disabled
                            className="profile-form-input"
                          />
                          <span className="input-icon-right">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile & Country Row */}
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">Mobile Number</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="input-wrapper-gold" style={{ width: '120px', flexShrink: 0 }}>
                            <span className="input-icon-left" style={{ left: '10px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            </span>
                            <select
                              name="mobileCode"
                              value={formData.mobileCode}
                              onChange={handleInputChange}
                              className="custom-select"
                              style={{ paddingLeft: '32px', paddingRight: '22px', fontSize: '12px', height: '46px' }}
                            >
                              {DIAL_CODES.map((dc, idx) => (
                                <option key={`${dc.code}-${idx}`} value={dc.code}>
                                  {dc.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="input-wrapper-gold" style={{ flex: 1 }}>
                            <input
                              type="tel"
                              name="mobile"
                              value={formData.mobile}
                              onChange={handleInputChange}
                              onKeyDown={(e) => {
                                if (e.key === '0' && (formData.mobile.length === 0 || (e.currentTarget.selectionStart === 0 && (e.currentTarget.selectionEnd === 0 || e.currentTarget.selectionEnd === formData.mobile.length)))) {
                                  e.preventDefault();
                                }
                              }}
                              maxLength={9}
                              inputMode="numeric"
                              pattern="[0-9]{1,9}"
                              placeholder="771234567"
                              className="profile-form-input"
                              style={{ paddingLeft: '14px', height: '46px' }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Country</label>
                        <div className="input-wrapper-gold">
                          <span className="input-icon-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </span>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="custom-select"
                            style={{ height: '46px' }}
                          >
                            {COUNTRIES.map(c => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Home Address */}
                    <div className="profile-form-group">
                      <label className="profile-form-label">Home Address</label>
                      <div className="input-wrapper-gold">
                        <span className="input-icon-left">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          maxLength={200}
                          placeholder="Street address, Suite, Apartment number"
                          className="profile-form-input"
                          required
                        />
                      </div>
                    </div>

                    {/* City & Postal Code Row */}
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">City / Town</label>
                        <div className="input-wrapper-gold">
                          <span className="input-icon-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            maxLength={100}
                            placeholder="e.g. Colombo"
                            className="profile-form-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Postal Code</label>
                        <div className="input-wrapper-gold">
                          <span className="input-icon-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          </span>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]{1,10}"
                            placeholder="e.g. 00100"
                            className="profile-form-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ marginTop: '8px' }}>
                      <button type="submit" className="gold-action-btn" disabled={saving}>
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#666666', fontSize: '11.5px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.2" style={{ display: 'inline-block' }}>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Your information is encrypted and securely stored.</span>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="content-card">
                <div className="card-header-block flex items-center justify-between">
                  <div>
                    <h3 className="card-title">Client Dashboard</h3>
                    <p className="card-subtitle">Overview of your timepiece acquisitions, wishlist, and rewards.</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#141414] font-semibold px-2.5 py-1 bg-black/[0.04] rounded border border-black/10 uppercase tracking-widest">
                    VERIFIED CLIENT
                  </span>
                </div>

                {/* Welcome Banner */}
                <div className="dashboard-welcome-banner relative overflow-hidden">
                  <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#141414', fontWeight: 600 }}>
                    Welcome to Your Winsor Account, {user.firstName || 'Winsor Client'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555555', lineHeight: 1.6, maxWidth: '680px' }}>
                    Manage your timepiece orders, track active shipments, and enjoy priority allocations for limited releases, complimentary luxury presentation box packaging, and dedicated customer support.
                  </p>
                </div>

                {/* 4 Quick Stat Tiles with Tabular Numbers */}
                <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  <div className="metric-tile-card" style={{ background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, letterSpacing: '0.08em' }}>Active Shipments</div>
                    <div className="metric-tile-value" style={{ fontSize: '30px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#141414', fontWeight: 600, marginTop: '6px', lineHeight: 1 }}>
                      {activeOrdersCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '11px', color: '#888888', marginTop: '8px' }}>
                      {activeOrdersCount > 0 ? 'In transit via courier' : 'No active dispatches'}
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, letterSpacing: '0.08em' }}>Delivered Timepieces</div>
                    <div className="metric-tile-value" style={{ fontSize: '30px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#141414', fontWeight: 600, marginTop: '6px', lineHeight: 1 }}>
                      {completedOrdersCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '11px', color: '#888888', marginTop: '8px' }}>
                      {orders.length} Total orders recorded
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, letterSpacing: '0.08em' }}>Reward Points</div>
                    <div className="metric-tile-value" style={{ fontSize: '30px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#141414', fontWeight: 600, marginTop: '6px', lineHeight: 1 }}>
                      {(orders.length * 25).toLocaleString()}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '11px', color: '#666666', fontWeight: 500, marginTop: '8px' }}>
                      {orders.length > 0 ? `+25 Points per timepiece order` : '0 Points • 25 Points per order'}
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, letterSpacing: '0.08em' }}>Saved Wishlist</div>
                    <div className="metric-tile-value" style={{ fontSize: '30px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#141414', fontWeight: 600, marginTop: '6px', lineHeight: 1 }}>
                      {wishlistCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '11px', color: '#888888', marginTop: '8px' }}>
                      Favorite watches saved
                    </div>
                  </div>
                </div>

                {/* Bottom Split: Recent Acquisitions & Client Privileges */}
                <div className="portal-bottom-split" style={{ marginTop: '24px' }}>
                  {/* Left: Recent Activity */}
                  <div>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#141414', margin: '0 0 14px 0' }}>
                      Recent Activity
                    </h4>
                    <div className="recent-orders-list">
                      {displayOrders.length > 0 ? (
                        displayOrders.map((o: any, idx: number) => (
                          <div key={idx} className="recent-order-item">
                            <div className="order-watch-thumb">
                              <img src={o.productThumbnail} alt={o.productTitle} />
                            </div>
                            <div className="recent-order-info">
                              <p className="order-item-title">{o.productTitle}</p>
                              <p className="order-ref-date font-mono text-[11px]">Ref: #{o.orderRef} • {o.date}</p>
                            </div>
                            <div className={`status-badge ${o.status}`}>
                              {o.statusLabel}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ background: '#F8F7F4', border: '1px solid rgba(197, 168, 128, 0.25)', borderRadius: '14px', padding: '28px 18px', textAlign: 'center' }}>
                          <div style={{ width: '90px', height: '90px', margin: '0 auto 12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(197, 168, 128, 0.2) 0%, transparent 70%)' }} />
                            <img src="/winsor_hero_backgroundremoved.webp" alt="Winsor Timepiece" style={{ width: '74px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))', zIndex: 2 }} />
                          </div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#141414', fontFamily: 'Cormorant Garamond, serif' }}>Your Watch Collection Begins Here</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#666666', lineHeight: 1.5, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Your order history is empty. Explore our handcrafted gents, ladies, and sports collections to make your first acquisition.
                          </p>
                          <Link href="/collections" style={{ display: 'inline-block', marginTop: '14px', background: '#8C6D3B', color: '#FFFFFF', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 18px', borderRadius: '6px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 3px 10px rgba(140, 109, 59, 0.25)' }}>
                            Explore Collections →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Black Card Privileges */}
                  <div>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#141414', margin: '0 0 14px 0' }}>
                      Client Privileges
                    </h4>
                    <div className="patron-black-card">
                      <div className="black-card-gold-seal">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.2" style={{ opacity: 0.12 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <h5 className="black-card-title">CLIENT PRIVILEGES</h5>
                      <p className="black-card-desc">Your verified membership provides access to priority allocations and boutique client care.</p>
                      
                      <div className="benefits-checklist" style={{ marginTop: '16px' }}>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#333333', fontSize: '12px' }}>First access to new limited timepiece allocations</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#333333', fontSize: '12px' }}>Official international warranty & service support</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#333333', fontSize: '12px' }}>Complimentary luxury presentation box packaging</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#333333', fontSize: '12px' }}>Dedicated client care and support</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Order History</h3>
                  <p className="card-subtitle">Track your recent Winsor timepiece purchases and dispatch status.</p>
                </div>

                {/* Filter & Search Bar */}
                {orders.length > 0 && (
                  <div className="order-filter-bar">
                    <div className="order-filter-pills">
                      {[
                        { key: 'all', label: 'All Orders', count: orderCounts.all },
                        { key: 'pending', label: 'Pending', count: orderCounts.pending },
                        { key: 'processing', label: 'Processing', count: orderCounts.processing },
                        { key: 'shipped', label: 'In Transit', count: orderCounts.shipped },
                        { key: 'delivered', label: 'Delivered', count: orderCounts.delivered },
                        { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderFilter(tab.key as any)}
                          className={`order-filter-pill ${orderFilter === tab.key ? 'active' : ''}`}
                        >
                          <span>{tab.label}</span>
                          <span className="filter-pill-badge">{tab.count}</span>
                        </button>
                      ))}
                    </div>

                    <div className="order-search-box">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by Order # or Watch Name..."
                        value={orderSearchQuery}
                        onChange={e => setOrderSearchQuery(e.target.value)}
                        className="order-search-input"
                      />
                      {orderSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setOrderSearchQuery('')}
                          className="order-search-clear"
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', color: '#666666', fontSize: '13px' }}>
                    <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="1.2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#141414', fontWeight: 600 }}>No Orders Placed Yet</p>
                    <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#666666' }}>Explore our catalog to place your first order.</p>
                    <Link href="/collections" style={{ display: 'inline-block', background: '#8C6D3B', color: '#FFFFFF', padding: '10px 22px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 3px 10px rgba(140, 109, 59, 0.25)' }}>
                      Discover Timepieces
                    </Link>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F7F4', border: '1px dashed rgba(20,20,20,0.12)', borderRadius: '12px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="1.3" style={{ margin: '0 auto 10px', opacity: 0.4 }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#141414', margin: '0 0 6px' }}>
                      No {orderFilter !== 'all' ? `${orderFilter.toUpperCase()} ` : ''}Orders Found
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#666666', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                      {orderSearchQuery
                        ? `No orders matched "${orderSearchQuery}". Clear your search or try another filter.`
                        : `You have no orders currently in "${orderFilter}" status.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setOrderFilter('all'); setOrderSearchQuery(''); }}
                      className="gold-action-btn"
                      style={{ padding: '8px 22px', fontSize: '11px', width: 'auto' }}
                    >
                      VIEW ALL ORDERS ({orders.length})
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    {filteredOrders.map((o: any, idx) => {
                      const orderTotal = o.subtotal || (o.items || []).reduce((acc: number, it: any) => acc + (it.price * (it.quantity || 1)), 0);
                      const itemCount = (o.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
                      const orderMobile = o.shippingAddress?.mobile || formData.mobile || '';

                      return (
                        <div key={idx} className="profile-order-card">
                          {/* ORDER HEADER */}
                          <div className="poc-header">
                            <div className="poc-header-top">
                              <Link
                                href={`/orders/track?ref=${encodeURIComponent(o.orderRef)}${orderMobile ? `&mobile=${encodeURIComponent(orderMobile)}` : ''}`}
                                className="poc-ref"
                                style={{ textDecoration: 'none', cursor: 'pointer' }}
                                title="Click to track timepiece live"
                              >
                                Order: #{o.orderRef}
                              </Link>
                              <span className={`status-badge ${(o.status || 'pending').toLowerCase()}`}>{o.status || 'Pending'}</span>
                            </div>
                            <div className="poc-header-sub">
                              <span>Placed: {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span>•</span>
                              <span className="poc-items-count">{itemCount} {itemCount === 1 ? 'timepiece' : 'timepieces'}</span>
                            </div>
                          </div>

                          {/* ORDER ITEMS */}
                          <div className="poc-items-list">
                            {o.items.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="poc-item-row">
                                <div className="poc-item-thumb">
                                  <img src={item.productThumbnail} alt={item.productTitle} />
                                </div>
                                <div className="poc-item-details">
                                  <div className="poc-item-title">{item.productTitle}</div>
                                  <div className="poc-item-meta">
                                    Model: {item.productModelNo} {item.colorVariant ? `— ${item.colorVariant}` : ''}
                                  </div>
                                  <div className="poc-item-price-block">
                                    <span className="poc-item-price">
                                      {item.quantity} × LKR {item.price.toLocaleString()}
                                    </span>
                                    {o.status.toLowerCase() === 'delivered' && (
                                      isItemReviewed(item.productId, o.orderRef) ? (
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: 'rgba(46, 125, 50, 0.08)',
                                            border: '1px solid rgba(46, 125, 50, 0.28)',
                                            color: '#2e7d32',
                                            fontSize: '10px',
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            fontFamily: "'Jost', sans-serif",
                                            fontWeight: 700,
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap',
                                            textTransform: 'uppercase',
                                          }}
                                        >
                                          ✓ Reviewed
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewItem({
                                              orderId: o.orderRef,
                                              productId: item.productId,
                                              productTitle: item.productTitle,
                                              productModelNo: item.productModelNo,
                                              productThumbnail: item.productThumbnail,
                                              colorVariant: item.colorVariant,
                                              price: item.price,
                                              daysLeft: 90,
                                            });
                                            setIsReviewModalOpen(true);
                                          }}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: '#8C6D3B',
                                            border: '1px solid #8C6D3B',
                                            color: '#FFFFFF',
                                            fontSize: '10px',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontFamily: "'Jost', sans-serif",
                                            fontWeight: 600,
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap',
                                            textTransform: 'uppercase',
                                            boxShadow: '0 2px 8px rgba(140, 109, 59, 0.2)',
                                            transition: 'all 0.2s ease',
                                          }}
                                        >
                                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                          Write Review
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* ORDER FOOTER ACTIONS & TOTAL */}
                          <div className="poc-footer">
                            <div className="poc-total">
                              <span>Total Investment:</span>{' '}
                              <strong>LKR {orderTotal.toLocaleString()}</strong>
                            </div>
                            <div className="poc-actions">
                              <Link
                                href={`/orders/track?ref=${encodeURIComponent(o.orderRef)}${orderMobile ? `&mobile=${encodeURIComponent(orderMobile)}` : ''}`}
                                className="poc-btn-track"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                Live Tracking
                              </Link>
                              <Link
                                href="/orders"
                                className="poc-btn-details"
                              >
                                Full Details →
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Your Wishlist</h3>
                  <p className="card-subtitle">Manage timepieces you are interested in.</p>
                </div>
                {wishlistedProducts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {wishlistedProducts.map((p, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(20,20,20,0.08)', borderRadius: '12px', padding: '16px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '100%', height: '145px', background: '#F9F9FB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                          <img src={getWatchImageUrl(p)} alt={p.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: '0 auto' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 600, color: '#141414', margin: 0 }}>{p.title}</h4>
                          <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>Model: {p.modelNo}</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#141414', marginTop: '6px' }}>LKR {p.price?.toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <Link href={`/collections/${p._id}`} style={{ flex: 1, textAlign: 'center', background: '#8C6D3B', color: '#ffffff', fontSize: '11px', padding: '8px 0', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(140, 109, 59, 0.2)' }}>
                            View Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromWishlist(p._id)}
                            style={{ background: '#FFFFFF', border: '1px solid rgba(198, 40, 40, 0.2)', color: '#c62828', fontSize: '11px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 600, textTransform: 'uppercase' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'rgba(26,18,9,0.5)', fontSize: '13px' }}>
                    No timepieces saved to your wishlist yet. Explore the <Link href="/collections" style={{ color: '#141414', textDecoration: 'underline', fontWeight: 600 }}>Collections Page</Link> to save your favorites.
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Dispatch Addresses</h3>
                  <p className="card-subtitle">Manage default addresses for courier shipping.</p>
                </div>
                <div style={{ background: '#F8F7F4', border: '1px solid rgba(20,20,20,0.08)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#141414', marginBottom: '4px' }}>Primary Destination Address</strong>
                  <span style={{ fontSize: '12.5px', color: '#555555', lineHeight: 1.5 }}>
                    {formData.address ? `${formData.address}, ${formData.city}, ${formData.postalCode}, ${COUNTRIES.find(c => c.code === formData.country)?.name || formData.country}` : 'No address set yet. Use the Profile Details tab to add your destination.'}
                  </span>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Security & Account</h3>
                  <p className="card-subtitle">Manage account security and Clerk connection keys.</p>
                </div>
                <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.6 }}>
                  Winsor Brand utilizes Clerk's state-of-the-art secure single-sign-on (SSO) systems. To modify your security credentials, email authentication codes, or password keys, please open your Clerk portal settings below:
                </p>
                <button type="button" className="gold-action-btn" style={{ width: 'fit-content', marginTop: '12px' }} onClick={() => openUserProfile()}>
                  OPEN CLERK SECURITY SETTINGS
                </button>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Notification Settings</h3>
                  <p className="card-subtitle">Manage dispatch transit notifications and launch updates.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#777777', cursor: 'not-allowed' }}>
                    <input type="checkbox" style={{ accentColor: '#141414' }} disabled />
                    <span>Send SMS updates on shipping dispatch (Currently Unavailable)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#777777', cursor: 'not-allowed' }}>
                    <input type="checkbox" style={{ accentColor: '#141414' }} disabled />
                    <span>Email receipts and order summaries (Currently Unavailable)</span>
                  </label>
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Pending Reviews */}
                <div className="content-card">
                  <div className="card-header-block">
                    <h3 className="card-title">Pending Reviews</h3>
                    <p className="card-subtitle">Products eligible for review (up to 90 days after delivery).</p>
                  </div>
                  {loadingReviews ? (
                    <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '20px 0' }}>Loading items...</p>
                  ) : pendingReviews.length === 0 ? (
                    <p style={{ fontSize: '13.5px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '30px 0', margin: 0 }}>
                      No pending reviews. Products from delivered orders are eligible for review up to 90 days after delivery.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {pendingReviews.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', border: '1px solid rgba(20,20,20,0.08)', borderRadius: '12px', padding: '16px', alignItems: 'center', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(20,20,20,0.08)', background: '#F9F9FB' }}>
                            <img src={item.productThumbnail} alt={item.productTitle} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 2px 0', fontSize: '14.5px', fontWeight: 600, color: '#141414', fontFamily: 'Cormorant Garamond, serif' }}>{item.productTitle}</h4>
                            <span style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase' }}>Model: {item.productModelNo}</span>
                            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#555555', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                              <span>{item.daysLeft} days remaining to review</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewItem(item);
                              setIsReviewModalOpen(true);
                            }}
                            style={{ background: '#8C6D3B', color: '#ffffff', border: '1px solid #8C6D3B', padding: '8px 18px', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(140, 109, 59, 0.2)' }}
                          >
                            WRITE REVIEW
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* My Past Reviews */}
                <div className="content-card">
                  <div className="card-header-block">
                    <h3 className="card-title">My Submitted Reviews</h3>
                    <p className="card-subtitle">Track status and details of your previous product reviews.</p>
                  </div>
                  {loadingReviews ? (
                    <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '20px 0' }}>Loading reviews...</p>
                  ) : myReviews.length === 0 ? (
                    <p style={{ fontSize: '13.5px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '30px 0', margin: 0 }}>
                      You have not submitted any reviews yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {myReviews.map((rev, idx) => (
                        <div key={idx} style={{ border: '1px solid rgba(20,20,20,0.08)', borderRadius: '12px', padding: '18px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(20,20,20,0.06)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(20,20,20,0.08)', background: '#F9F9FB', padding: '2px', flexShrink: 0 }}>
                                <img src={rev.productId?.thumbnail?.url || '/winsor_hero_backgroundremoved.webp'} alt={rev.productId?.title || 'Timepiece'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: '#141414', fontFamily: 'Cormorant Garamond, serif' }}>{rev.productId?.title || 'Timepiece'}</h4>
                                <span style={{ fontSize: '11px', color: '#666666', fontFamily: 'Jost, monospace', fontWeight: 500 }}>Model: #{rev.productId?.modelNo || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '5px 14px',
                              borderRadius: '100px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: rev.status === 'approved' ? '#E8F5E9' : rev.status === 'rejected' ? '#FFEBEE' : '#F5F5F5',
                              color: rev.status === 'approved' ? '#2E7D32' : rev.status === 'rejected' ? '#C62828' : '#616161',
                              border: rev.status === 'approved' ? '1px solid rgba(46,125,50,0.2)' : rev.status === 'rejected' ? '1px solid rgba(198,40,40,0.2)' : '1px solid rgba(0,0,0,0.1)',
                            }}>
                              {rev.status === 'pending' ? (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                  Pending Approval
                                </>
                              ) : rev.status === 'approved' ? (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                  Approved
                                </>
                              ) : (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Rejected
                                </>
                              )}
                            </span>
                          </div>

                          {/* Review Details with word wrapping fix */}
                          <div style={{ width: '100%', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rev.rating ? '#D4AF37' : '#E0E0E0'} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: '#666666', marginLeft: '6px', fontWeight: 500 }}>
                                Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {rev.isAnonymous && (
                                <span style={{ fontSize: '10px', background: '#F0F0F2', color: '#555555', padding: '3px 10px', borderRadius: '100px', marginLeft: 'auto', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                  Anonymous Review
                                </span>
                              )}
                            </div>

                            {/* Long text container with word-break & max-height scroll */}
                            <div style={{
                              background: '#F8F7F4',
                              border: '1px solid rgba(20,20,20,0.06)',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              fontSize: '13px',
                              lineHeight: 1.6,
                              color: '#141414',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '280px',
                              overflowY: 'auto',
                            }}>
                              {rev.comment}
                            </div>

                            {/* Attached Images */}
                            {rev.images && rev.images.length > 0 && (
                              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                {rev.images.map((url: string, i: number) => (
                                  <a href={url} target="_blank" rel="noopener noreferrer" key={i} style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,105,20,0.25)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                    <img src={url} alt="Review attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* BOTTOM CARD TILES ROW */}
            {activeTab === 'profile-details' && (
              <div className="portal-bottom-split">
                {/* RECENT ORDERS */}
                <div className="content-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(20,20,20,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                      Recent Orders
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      style={{ background: 'none', border: 'none', color: '#141414', fontSize: '11px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}
                    >
                      View All
                    </button>
                  </div>

                  <div className="recent-orders-list">
                    {displayOrders.map((o, idx) => (
                      <div className="recent-order-item" key={idx}>
                        <div className="order-watch-thumb">
                          <img src={o.productThumbnail} alt="Watch Thumbnail" />
                        </div>
                        <div className="recent-order-info">
                          <h5 className="order-item-title">{o.productTitle}</h5>
                          <div className="order-ref-date">Ref: #{o.orderRef} — {o.date}</div>
                        </div>
                        <div className={`status-badge ${o.status.toLowerCase()}`}>
                          {o.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACCOUNT BENEFITS */}
                <div className="content-card">
                  <div style={{ borderBottom: '1px solid rgba(20,20,20,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                      Account Benefits
                    </h4>
                  </div>

                  <div className="patron-black-card">
                    <h5 className="black-card-title">CLIENT BENEFITS</h5>
                    <p className="black-card-desc">Enjoy exclusive benefits and privileges.</p>
                    <span className="black-card-gold-seal">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.2" style={{ opacity: 0.12 }}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z"/></svg>
                    </span>
                  </div>

                  <div className="benefits-checklist">
                    {[
                      'Exclusive member discounts',
                      'Early access to new collections',
                      'Complimentary gift wrapping',
                      'Priority customer support',
                      'Invitations to private events'
                    ].map((benefit, idx) => (
                      <div className="benefit-check-item" key={idx}>
                        <span className="benefit-check-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WRITE REVIEW MODAL */}
      {isReviewModalOpen && reviewItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Jost', sans-serif" }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(20,20,20,0.1)' }}>
            
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #FFFFFF 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#141414', borderBottom: '1px solid rgba(197, 168, 128, 0.3)' }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '0.02em', color: '#141414' }}>
                  Write Timepiece Review
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#666666', letterSpacing: '0.02em' }}>
                  Share your experience with the Winsor community
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewItem(null);
                }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FAF8F5', border: '1px solid rgba(20,20,20,0.12)', color: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Product Item Brief Card */}
              <div style={{ background: '#F8F7F4', border: '1px solid rgba(20,20,20,0.08)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.08)', padding: '3px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={reviewItem.productThumbnail || '/winsor_hero_backgroundremoved.webp'} alt={reviewItem.productTitle} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#141414' }}>{reviewItem.productTitle}</h4>
                  <div style={{ fontSize: '11px', color: '#666666', fontFamily: 'Jost, monospace', fontWeight: 500, marginTop: '2px' }}>
                    Model: #{reviewItem.productModelNo} {reviewItem.colorVariant ? `• Variant: ${reviewItem.colorVariant}` : ''}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitReview}>
                {/* Rating selection */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#141414' }}>
                      Overall Rating *
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#141414' }}>
                      {reviewRating === 5 && '5.0 / 5.0 — Exceptional'}
                      {reviewRating === 4 && '4.0 / 5.0 — Very Good'}
                      {reviewRating === 3 && '3.0 / 5.0 — Satisfactory'}
                      {reviewRating === 2 && '2.0 / 5.0 — Below Expectations'}
                      {reviewRating === 1 && '1.0 / 5.0 — Poor Experience'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: '#F8F7F4', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(20,20,20,0.08)', width: 'fit-content' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '24px',
                          color: reviewRating >= num ? '#D4AF37' : '#D8D8D8',
                          padding: 0,
                          transition: 'transform 0.15s ease',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Comment */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: '#141414' }}>
                    Your Detailed Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your experience with the craftsmanship, precision, packaging, and overall finish..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(20,20,20,0.14)',
                      background: '#FBFBFC',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: '13px',
                      color: '#141414',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Styled Photo Attachment Dropzone */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: '#141414' }}>
                    Attach Photos (Max 2)
                  </label>
                  
                  <div style={{ position: 'relative' }}>
                    <input
                      id="review-photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleReviewImageUpload}
                      disabled={uploadingReviewImg || reviewImages.length >= 2}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="review-photo-upload"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1.5px dashed rgba(20,20,20,0.15)',
                        background: uploadingReviewImg || reviewImages.length >= 2 ? '#F4F4F6' : '#F8F7F4',
                        cursor: uploadingReviewImg || reviewImages.length >= 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#141414' }}>
                        {uploadingReviewImg
                          ? 'Uploading Photo...'
                          : reviewImages.length >= 2
                          ? 'Maximum 2 Photos Uploaded'
                          : 'Click to Choose & Attach Photos'}
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: '11px', color: '#777777', marginTop: '6px' }}>
                    Supported formats: PNG, JPG, WEBP. Maximum 2 image attachments.
                  </div>

                  {/* Thumbnail previews */}
                  {reviewImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      {reviewImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(20,20,20,0.15)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                          <img src={url} alt="Attached review item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(20,20,20,0.8)', border: 'none', color: '#FFFFFF', width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', background: '#F8F7F4', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(20,20,20,0.08)' }}>
                  <input
                    id="review-anonymous"
                    type="checkbox"
                    checked={reviewAnonymous}
                    onChange={(e) => setReviewAnonymous(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#141414', cursor: 'pointer' }}
                  />
                  <label htmlFor="review-anonymous" style={{ fontSize: '12.5px', color: '#141414', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                    Publish review anonymously (masks your profile name)
                  </label>
                </div>

                {/* High Contrast Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setReviewItem(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(20,20,20,0.15)',
                      background: '#FFFFFF',
                      color: '#141414',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || uploadingReviewImg}
                    style={{
                      flex: 1.5,
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #9C7A3C 0%, #8C6D3B 100%)',
                      color: '#FFFFFF',
                      border: '1px solid #8C6D3B',
                      cursor: submittingReview || uploadingReviewImg ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 14px rgba(140, 109, 59, 0.25)',
                      opacity: submittingReview || uploadingReviewImg ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
