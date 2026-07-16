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

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile-details' | 'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'security' | 'notifications' | 'payment-methods' | 'reviews'>('profile-details');

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
    if (count === 0) return 'NEW PATRON';
    if (count === 1) return 'VERIFIED CUSTOMER';
    if (count >= 2 && count < 8) return 'BRONZE MEMBER';
    if (count >= 8 && count < 18) return 'SILVER MEMBER';
    if (count >= 18 && count < 35) return 'GOLD MEMBER';
    return 'PLATINUM MEMBER';
  };

  const membershipTier = getMembershipTier(orders.length);

  // Fetch Reviews Data
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviewsData();
    }
  }, [activeTab]);

  const fetchReviewsData = async () => {
    setLoadingReviews(true);
    try {
      const [pendingRes, myRes] = await Promise.all([
        fetch('/api/reviews/pending'),
        fetch('/api/reviews/my'),
      ]);
      const pendingData = await pendingRes.json();
      const myData = await myRes.json();
      if (pendingData.success) setPendingReviews(pendingData.data || []);
      if (myData.success) setMyReviews(myData.data || []);
    } catch (err) {
      console.error('Failed to load reviews data:', err);
    } finally {
      setLoadingReviews(false);
    }
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
    if (!isSignedIn) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/customer/profile');
        let data: any = { success: false };
        try {
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            data = await res.json();
          }
        } catch (e) {
          console.warn('Failed to parse profile details JSON:', e);
        }

        if (data.success && data.data) {
          setFormData({
            mobileCode: data.data.mobileCode || '+94',
            mobile: data.data.mobile || '',
            country: data.data.country || 'LK',
            address: data.data.address || '',
            city: data.data.city || '',
            postalCode: data.data.postalCode || '',
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
        const res = await fetch('/api/customer/orders');
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
  }, [isSignedIn]);

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
      const payload = {
        email: user.primaryEmailAddress?.emailAddress,
        profileImage: user.imageUrl,
        ...formData,
      };

      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Information updated successfully! ✨');
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

  // Active / Completed Orders calculation
  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;

  // Filtered Wishlist Products
  const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p._id));

  // Clerk Loading State
  if (!isLoaded) {
    return (
      <div className="profile-loading-wrapper">
        <div className="profile-spinner" />
      </div>
    );
  }

  // Unauthenticated State
  if (!isSignedIn) {
    return (
      <div className="profile-page-container">
        <div className="access-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h1 className="access-title">Secure Profile Access</h1>
          <p className="access-subtitle">
            To view and manage your custom profile details, shipping addresses, and reward orders, please sign in.
          </p>
          <div style={{ marginTop: '28px' }}>
            <SignInButton mode="modal">
              <button className="gold-action-btn">
                SIGN IN WITH CLERK
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  // Mock list of orders if no orders exist, using local assets
  const displayOrders = orders.length > 0 ? orders.slice(0, 3).map(o => ({
    orderRef: o.orderRef,
    date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: o.status,
    productTitle: o.items[0]?.productTitle || 'Winsor Timepiece',
    productThumbnail: o.items[0]?.productThumbnail || '/mens-watch-highlight.png'
  })) : [
    { orderRef: 'WT12345', date: 'May 12, 2026', status: 'Delivered', productTitle: 'Winsor Heritage Chronograph', productThumbnail: '/mens-watch-highlight.png' },
    { orderRef: 'WT12310', date: 'May 05, 2026', status: 'Processing', productTitle: 'Winsor Classic Automatic', productThumbnail: '/mens-watch-highlight.png' },
    { orderRef: 'WT12288', date: 'Apr 28, 2026', status: 'Shipped', productTitle: 'Winsor Sport Evo', productThumbnail: '/mens-watch-highlight.png' },
  ];

  return (
    <div className="profile-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

        .profile-page-container {
          background: #f7f3eb;
          min-height: 100vh;
          padding: 130px 24px 80px;
          font-family: 'Jost', sans-serif;
        }

        /* ── Loading ── */
        .profile-loading-wrapper {
          min-height: 80vh;
          display: flex; align-items: center; justify-content: center;
          background: #f7f3eb;
        }
        .profile-spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(139,105,20,0.12);
          border-top: 2px solid #8B6914;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Access Card ── */
        .access-card {
          background: #fff;
          border: 1px solid rgba(26,18,9,0.06);
          box-shadow: 0 12px 36px rgba(26,18,9,0.04);
          border-radius: 16px;
          max-width: 500px;
          margin: 60px auto;
          padding: 48px 36px;
          text-align: center;
          box-sizing: border-box;
        }
        .access-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 600;
          color: #1a1209;
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 12px;
        }
        .access-subtitle { font-size: 13.5px; color: rgba(26,18,9,0.6); line-height: 1.65; }

        /* ── Portal Wrapper ── */
        .profile-portal-wrapper {
          max-width: 1140px;
          margin: 0 auto;
          display: flex; flex-direction: column;
          gap: 28px;
        }

        /* ── Header Banner (desktop) ── */
        .portal-header-banner {
          background: #fff;
          border: 1px solid rgba(139,105,20,0.12);
          border-radius: 16px;
          padding: 28px 36px;
          display: flex; align-items: center; gap: 28px;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(26,18,9,0.04);
        }
        .banner-watermark {
          position: absolute; right: -20px; top: 50%;
          transform: translateY(-50%);
          width: 260px; height: auto;
          opacity: 0.04; pointer-events: none;
          mix-blend-mode: luminosity;
        }
        .avatar-wrapper {
          position: relative;
          width: 96px; height: 96px; flex-shrink: 0;
        }
        .avatar-img {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #8b6914;
          padding: 2px;
          object-fit: cover;
          background: #faf7f0;
        }
        .avatar-fallback {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #8b6914;
          background: linear-gradient(135deg, #8b6914, #c9a84c);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 500;
        }
        .avatar-edit-btn {
          position: absolute; bottom: 2px; right: 2px;
          width: 26px; height: 26px;
          background: #8b6914;
          border: 2px solid #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        .avatar-edit-btn:hover { transform: scale(1.12); background: #1a1209; }
        .header-info-block { display: flex; flex-direction: column; gap: 6px; z-index: 2; }
        .patron-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(139,105,20,0.07);
          border: 1px solid rgba(139,105,20,0.22);
          color: #8b6914;
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em;
          padding: 4px 10px; border-radius: 20px;
          width: fit-content; text-transform: uppercase;
        }
        .patron-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 600;
          color: #1a1209; margin: 0; letter-spacing: 0.02em;
        }
        .member-since { font-size: 11.5px; color: rgba(26,18,9,0.4); margin-top: -2px; }

        /* ── Stats Row ── */
        .stats-row {
          display: flex; flex-wrap: wrap;
          gap: 16px 20px;
          margin-top: 12px;
          border-top: 1px dashed rgba(139,105,20,0.15);
          padding-top: 12px;
        }
        .stat-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: rgba(26,18,9,0.7); font-weight: 500;
        }
        .stat-icon { color: #8b6914; display: flex; align-items: center; }

        /* ── Portal Grid ── */
        .portal-main-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 28px; align-items: start;
        }

        /* ── Sidebar ── */
        .portal-sidebar { display: flex; flex-direction: column; gap: 20px; }
        .portal-sidebar-desktop { display: flex; flex-direction: column; gap: 20px; }
        .sidebar-card {
          background: #fff;
          border: 1px solid rgba(26,18,9,0.06);
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(26,18,9,0.02);
          overflow: hidden; padding: 10px 0;
        }
        .sidebar-menu-btn {
          display: flex; align-items: center; gap: 11px;
          width: 100%; padding: 11px 20px;
          border: none; background: transparent;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px; font-weight: 500;
          color: rgba(26,18,9,0.6);
          text-align: left; cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .sidebar-menu-btn:hover { background: rgba(139,105,20,0.03); color: #1a1209; }
        .sidebar-menu-btn.active {
          background: rgba(139,105,20,0.06);
          border-left-color: #8b6914;
          color: #8b6914; font-weight: 650;
        }
        .sidebar-menu-btn svg { flex-shrink: 0; }

        /* ── Completion Box ── */
        .completion-box {
          background: #fff;
          border: 1px solid rgba(26,18,9,0.06);
          border-radius: 14px;
          padding: 22px 18px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          box-shadow: 0 4px 20px rgba(26,18,9,0.02);
        }
        .completion-title { font-size: 12px; font-weight: 700; color: #8b6914; text-transform: uppercase; letter-spacing: 0.07em; margin: 0; }
        .completion-desc { font-size: 10.5px; color: rgba(26,18,9,0.48); line-height: 1.55; margin: 0; }
        .circular-chart { display: block; margin: 4px auto; max-width: 72px; max-height: 72px; }
        .circle-bg { stroke: rgba(139,105,20,0.1); }
        .circle { transition: stroke-dasharray 0.4s ease; }
        .percentage { font-family: 'Jost', sans-serif; }

        /* ── Content Panel ── */
        .portal-content-panel { display: flex; flex-direction: column; gap: 24px; }
        .content-card {
          background: #fff;
          border: 1px solid rgba(26,18,9,0.06);
          border-radius: 14px;
          padding: 28px 30px;
          box-shadow: 0 4px 24px rgba(26,18,9,0.02);
        }
        .card-header-block {
          border-bottom: 1px solid rgba(26,18,9,0.06);
          padding-bottom: 16px; margin-bottom: 22px;
        }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1a1209; margin: 0; }
        .card-subtitle { font-size: 12.5px; color: rgba(26,18,9,0.42); margin: 4px 0 0; }

        /* ── Form ── */
        .profile-custom-form { display: flex; flex-direction: column; gap: 20px; }
        .profile-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .profile-form-group { display: flex; flex-direction: column; gap: 7px; }
        .profile-form-label { font-size: 10.5px; font-weight: 700; color: rgba(26,18,9,0.5); letter-spacing: 0.07em; text-transform: uppercase; }
        .input-wrapper-gold { position: relative; display: flex; align-items: center; width: 100%; }
        .input-icon-left { position: absolute; left: 13px; color: #8b6914; display: flex; align-items: center; pointer-events: none; }
        .input-icon-right { position: absolute; right: 13px; color: rgba(26,18,9,0.28); display: flex; align-items: center; pointer-events: none; }
        .profile-form-input {
          width: 100%; padding: 11px 16px 11px 40px;
          border: 1.5px solid rgba(26,18,9,0.1);
          border-radius: 8px;
          font-family: 'Jost', sans-serif; font-size: 13.5px;
          color: #1a1209; background: #fdfcfa;
          outline: none; transition: all 0.22s;
          box-sizing: border-box;
        }
        .profile-form-input:focus { border-color: #8b6914; background: #fff; box-shadow: 0 0 0 3px rgba(139,105,20,0.09); }
        .profile-form-input:disabled { background: rgba(26,18,9,0.02); border-color: rgba(26,18,9,0.06); color: rgba(26,18,9,0.45); cursor: not-allowed; padding-right: 40px; }
        .custom-select {
          width: 100%; padding: 11px 28px 11px 40px;
          border: 1.5px solid rgba(26,18,9,0.1);
          border-radius: 8px;
          font-family: 'Jost', sans-serif; font-size: 13.5px;
          color: #1a1209; background: #fdfcfa;
          outline: none; appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231a1209' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat; background-position: right 12px center; background-size: 12px;
          cursor: pointer; box-sizing: border-box; transition: all 0.22s;
        }
        .custom-select:focus { border-color: #8b6914; background-color: #fff; box-shadow: 0 0 0 3px rgba(139,105,20,0.09); }

        /* ── Buttons ── */
        .gold-action-btn {
          background: linear-gradient(135deg, #8b6914 0%, #a07c20 100%);
          border: none; color: #fff;
          padding: 13px 28px;
          font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.16em; border-radius: 8px;
          cursor: pointer; transition: all 0.25s ease;
          width: 100%; text-transform: uppercase;
          box-shadow: 0 4px 16px rgba(139,105,20,0.28);
        }
        .gold-action-btn:hover { background: linear-gradient(135deg, #1a1209 0%, #2c1f0c 100%); box-shadow: 0 6px 20px rgba(26,18,9,0.2); transform: translateY(-1px); }
        .gold-action-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* ── Bottom split ── */
        .portal-bottom-split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }

        /* ── Recent Orders ── */
        .recent-orders-list { display: flex; flex-direction: column; gap: 10px; }
        .recent-order-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px;
          border: 1px solid rgba(26,18,9,0.05);
          border-radius: 10px;
          background: #fdfcfa;
          transition: all 0.2s;
        }
        .recent-order-item:hover { border-color: rgba(139,105,20,0.18); background: rgba(139,105,20,0.02); }
        .order-watch-thumb {
          width: 46px; height: 46px;
          border-radius: 6px;
          background: #fff;
          border: 1px solid rgba(26,18,9,0.07);
          display: flex; align-items: center; justify-content: center;
          padding: 3px; flex-shrink: 0;
        }
        .order-watch-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .recent-order-info { flex: 1; min-width: 0; }
        .order-item-title { font-size: 12.5px; font-weight: 600; color: #1a1209; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .order-ref-date { font-size: 10.5px; color: rgba(26,18,9,0.45); margin-top: 2px; }

        /* ── Status Badges ── */
        .status-badge { font-size: 9px; font-weight: 750; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
        .status-badge.delivered { background: rgba(46,125,50,0.07); color: #2e7d32; border: 1px solid rgba(46,125,50,0.18); }
        .status-badge.processing { background: rgba(239,108,0,0.07); color: #ef6c00; border: 1px solid rgba(239,108,0,0.18); }
        .status-badge.shipped { background: rgba(21,101,192,0.07); color: #1565c0; border: 1px solid rgba(21,101,192,0.18); }
        .status-badge.cancelled { background: rgba(198,40,40,0.07); color: #c62828; border: 1px solid rgba(198,40,40,0.18); }

        /* ── Benefits ── */
        .patron-black-card {
          background: linear-gradient(135deg, #110d07 0%, #1e160c 50%, #110d07 100%);
          border: 1px solid rgba(196,161,70,0.4);
          border-radius: 12px; padding: 20px;
          color: #fff; position: relative; overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 8px 28px rgba(26,18,9,0.18);
        }
        .patron-black-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at top right, rgba(196,161,70,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .black-card-title { font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600; letter-spacing: 0.2em; color: #d4af37; margin: 0 0 4px 0; text-transform: uppercase; }
        .black-card-desc { font-size: 11px; color: rgba(255,255,255,0.65); margin: 0; font-family: 'Jost', sans-serif; }
        .black-card-gold-seal { position: absolute; right: -8px; bottom: -10px; font-size: 54px; opacity: 0.12; pointer-events: none; }
        .benefits-checklist { display: flex; flex-direction: column; gap: 9px; }
        .benefit-check-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: rgba(26,18,9,0.68); font-weight: 500; }
        .benefit-check-icon { color: #8b6914; display: flex; align-items: center; flex-shrink: 0; }

        /* ── Dashboard banner ── */
        .dashboard-welcome-banner {
          background: linear-gradient(135deg, rgba(139,105,20,0.04) 0%, rgba(196,161,70,0.06) 100%);
          border: 1px solid rgba(139,105,20,0.12);
          border-radius: 10px; padding: 20px; margin-bottom: 20px;
        }

        /* ═══════════════════════════════════════
           DESKTOP 1025-1280
           ═══════════════════════════════════════ */
        @media (max-width: 1024px) {
          .portal-main-grid { grid-template-columns: 200px 1fr; gap: 20px; }
          .portal-bottom-split { grid-template-columns: 1fr; gap: 20px; }
        }

        /* ═══════════════════════════════════════
           MOBILE  ≤ 768px
           ═══════════════════════════════════════ */
        .mobile-tab-bar { display: none; }
        .mobile-completion-strip { display: none; }

        @media (max-width: 768px) {

          /* ── Shell ── */
          .profile-page-container { padding: 0 0 96px; background: #f0ebe0; }
          .profile-portal-wrapper { padding: 0; gap: 0; }

          /* ── Hero Header ── */
          .portal-header-banner {
            background: linear-gradient(160deg, #1a1209 0%, #2d1f0e 40%, #3d2b14 100%);
            border: none; border-radius: 0;
            flex-direction: column; align-items: center; text-align: center;
            padding: 80px 24px 32px;
            gap: 0; margin-bottom: 0;
            box-shadow: none;
            position: relative;
          }
          .portal-header-banner::after {
            content: '';
            position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
            background: linear-gradient(to bottom, transparent, #f0ebe0);
            pointer-events: none;
          }
          .banner-watermark {
            display: block !important;
            right: -40px; top: 20px;
            width: 200px; opacity: 0.06;
            transform: none;
          }

          /* ── Avatar ── */
          .avatar-wrapper {
            width: 90px; height: 90px;
            margin-bottom: 14px;
            position: relative;
            z-index: 2;
          }
          .avatar-img {
            border: 3px solid rgba(196,161,70,0.8);
            box-shadow: 0 0 0 4px rgba(139,105,20,0.25), 0 8px 24px rgba(0,0,0,0.35);
          }
          .avatar-fallback {
            border: 3px solid rgba(196,161,70,0.8);
            box-shadow: 0 0 0 4px rgba(139,105,20,0.25), 0 8px 24px rgba(0,0,0,0.35);
          }
          .avatar-edit-btn {
            background: rgba(26,18,9,0.8);
            border-color: rgba(196,161,70,0.5);
          }

          /* ── Name & Badge ── */
          .header-info-block { align-items: center; gap: 8px; position: relative; z-index: 2; }
          .patron-badge {
            background: rgba(196,161,70,0.15);
            border-color: rgba(196,161,70,0.4);
            color: #d4af37;
            font-size: 8.5px;
          }
          .patron-name { font-size: 26px; color: #ffffff; letter-spacing: 0.04em; }
          .member-since { color: rgba(255,255,255,0.45); font-size: 11px; }

          /* ── Stats: 2×2 luxury tiles ── */
          .stats-row {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 8px; margin-top: 18px; padding-top: 0;
            border-top: none; width: 100%;
            position: relative; z-index: 2;
          }
          .stat-item {
            flex-direction: column; justify-content: center; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(196,161,70,0.2);
            border-radius: 10px;
            padding: 12px 8px;
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 500;
            backdrop-filter: blur(8px);
          }
          .stat-icon { color: #d4af37; }

          /* ── Sticky bottom tab bar ── */
          .portal-sidebar-desktop { display: none !important; }
          .mobile-tab-bar {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            z-index: 200;
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            gap: 0; padding: 0 0 env(safe-area-inset-bottom, 0px);
            background: #1a1209;
            border-top: 1px solid rgba(196,161,70,0.2);
            scrollbar-width: none;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.25);
          }
          .mobile-tab-bar::-webkit-scrollbar { display: none; }
          .mobile-tab-pill {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 3px;
            white-space: nowrap; scroll-snap-align: start;
            padding: 10px 14px 8px;
            border: none; border-top: 2px solid transparent;
            background: transparent;
            font-family: 'Jost', sans-serif;
            font-size: 9px; font-weight: 650; letter-spacing: 0.06em;
            color: rgba(255,255,255,0.38);
            cursor: pointer; flex-shrink: 0; min-width: 58px;
            transition: all 0.15s ease; text-transform: uppercase;
          }
          .mobile-tab-pill svg { opacity: 0.4; transition: opacity 0.15s; }
          .mobile-tab-pill.active { border-top-color: #d4af37; color: #d4af37; }
          .mobile-tab-pill.active svg { opacity: 1; }
          .mobile-tab-pill.logout-pill { color: rgba(220,80,80,0.55); }
          .mobile-tab-pill.logout-pill svg { opacity: 0.55; }

          /* ── Compact completion strip ── */
          .mobile-completion-strip {
            display: flex; align-items: center; gap: 14px;
            background: #fff;
            border-bottom: 1px solid rgba(26,18,9,0.07);
            padding: 12px 18px;
          }
          .mcs-ring { flex-shrink: 0; }
          .mcs-text { flex: 1; min-width: 0; }
          .mcs-title { font-size: 10.5px; font-weight: 700; color: #8b6914; text-transform: uppercase; letter-spacing: 0.07em; margin: 0; }
          .mcs-desc { font-size: 10px; color: rgba(26,18,9,0.48); margin: 2px 0 0; }
          .mcs-btn {
            background: #8b6914; color: #fff; border: none;
            padding: 6px 14px; border-radius: 20px;
            font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 700;
            letter-spacing: 0.08em; text-transform: uppercase;
            cursor: pointer; flex-shrink: 0; white-space: nowrap;
            box-shadow: 0 3px 10px rgba(139,105,20,0.3);
          }

          /* ── Content layout ── */
          .portal-main-grid { grid-template-columns: 1fr; gap: 0; }
          .portal-content-panel { gap: 14px; padding: 16px 16px 8px; }
          .content-card {
            padding: 20px 18px; border-radius: 14px;
            box-shadow: 0 2px 16px rgba(26,18,9,0.04);
          }
          .card-title { font-size: 20px; }
          .card-subtitle { font-size: 11.5px; }

          /* ── Profile form ── */
          .profile-custom-form { gap: 15px; }
          .profile-form-grid { grid-template-columns: 1fr; gap: 13px; }
          .profile-form-label { font-size: 9.5px; }
          .profile-form-input { font-size: 13px; padding: 10px 13px 10px 38px; border-radius: 8px; }
          .custom-select { font-size: 13px; padding: 10px 26px 10px 38px; border-radius: 8px; }

          /* ── Orders ── */
          .recent-orders-list { gap: 9px; }
          .recent-order-item { padding: 10px 12px; border-radius: 10px; }
          .order-watch-thumb { width: 42px; height: 42px; }
          .order-item-title { font-size: 12px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .order-ref-date { font-size: 10px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .status-badge { flex-shrink: 0; font-size: 8.5px; }

          /* ── Bottom split ── */
          .portal-bottom-split { display: flex; flex-direction: column; gap: 14px; }

          /* ── Hide desktop completion box on mobile ── */
          .completion-box { display: none; }
        }
      `}</style>


      <div className="profile-portal-wrapper">
        {/* TOP PATRON HEADER BANNER */}
        <div className="portal-header-banner">
          <img src="/womens-watch-highlight.png" alt="" className="banner-watermark" />
          <div className="avatar-wrapper">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="avatar-img" />
            ) : (
              <div className="avatar-fallback">{user.firstName?.charAt(0) || 'U'}</div>
            )}
            <div className="avatar-edit-btn" onClick={() => openUserProfile()} title="Edit Profile Details">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>

          <div className="header-info-block">
            <div className="patron-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}>
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="currentColor" />
                <path d="M3 20h18v2H3z" fill="currentColor" />
              </svg>
              {membershipTier}
            </div>
            <h1 className="patron-name">{fullName || 'WINSOR PATRON'}</h1>
            <span className="member-since">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'June 2026'}
            </span>

            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span>{orders.length} Orders</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <span>{wishlistCount} Wishlist</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <span>{50 + orders.length * 25} Reward Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span>{membershipTier.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
            </div>
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
            { id: 'payment-methods', label: 'Payment', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
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
                fill="none" stroke="#8b6914" strokeWidth="3" strokeLinecap="round" />
              <text x="18" y="21" fill="#8b6914" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Jost, sans-serif">
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
              <button className={`sidebar-menu-btn ${activeTab === 'payment-methods' ? 'active' : ''}`} onClick={() => setActiveTab('payment-methods')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Payment Methods
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
                  stroke="#8b6914"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text x="18" y="20.35" className="percentage" fill="#8b6914" fontSize="8" fontWeight="bold" textAnchor="middle">
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
                  toast.success('Scroll to fill blank details below! 📝');
                }}
              >
                COMPLETE NOW
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
                        <label className="profile-form-label">Email Address <span style={{ color: '#8b6914', fontSize: '9px', fontWeight: 550 }}>(Synced with Clerk)</span></label>
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
                          <div style={{ position: 'relative', width: '115px', flexShrink: 0 }}>
                            <span className="input-icon-left">
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
                              style={{ paddingLeft: '34px', paddingRight: '22px', fontSize: '12px' }}
                            >
                              {DIAL_CODES.map((dc, idx) => (
                                <option key={`${dc.code}-${idx}`} value={dc.code}>
                                  {dc.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="tel"
                              name="mobile"
                              value={formData.mobile}
                              onChange={handleInputChange}
                              placeholder="77 123 4567"
                              className="profile-form-input"
                              style={{ paddingLeft: '14px' }}
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: 'rgba(26,18,9,0.5)', fontSize: '11.5px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2.5" style={{ display: 'inline-block' }}>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Your information is safe and secure with us.</span>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Patron Dashboard</h3>
                  <p className="card-subtitle">Welcome back to the Winsor Brand private portal.</p>
                </div>
                <div className="dashboard-welcome-banner">
                  <h4 style={{ margin: '0 0 6px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#8b6914' }}>
                    Welcome Back, {user.firstName || 'Winsor Patron'}!
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(26,18,9,0.6)', lineHeight: 1.5 }}>
                    As a verified **Winsor Patron**, you have exclusive access to priority timepiece reservations, complimentary bespoke gifting options, and dedicated shipping transit routing.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '12px' }}>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.1)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 600 }}>Active Shipments</div>
                    <div style={{ fontSize: '28px', fontFamily: 'Cormorant Garamond, serif', color: '#1a1209', fontWeight: 650, marginTop: '4px' }}>
                      {activeOrdersCount}
                    </div>
                  </div>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.1)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 600 }}>Completed Acquisitions</div>
                    <div style={{ fontSize: '28px', fontFamily: 'Cormorant Garamond, serif', color: '#1a1209', fontWeight: 650, marginTop: '4px' }}>
                      {completedOrdersCount}
                    </div>
                  </div>
                  <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.1)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 600 }}>Membership Tier</div>
                    <div style={{ fontSize: '15px', fontFamily: 'Jost, sans-serif', color: '#8b6914', fontWeight: 650, marginTop: '8px', letterSpacing: '0.05em' }}>
                      {membershipTier}
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
                  <p className="card-subtitle">Track your recent Winsor timepiece purchases.</p>
                </div>
                {orders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map((o: any, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(26,18,9,0.08)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(26,18,9,0.05)', paddingBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 650, color: '#1a1209', fontSize: '13px' }}>Order: #{o.orderRef}</span>
                            <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.45)', marginLeft: '12px' }}>
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={`status-badge ${o.status.toLowerCase()}`}>{o.status}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {o.items.map((item: any, itemIdx: number) => (
                            <div key={itemIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="order-watch-thumb" style={{ width: '48px', height: '48px' }}>
                                <img src={item.productThumbnail} alt={item.productTitle} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1a1209' }}>{item.productTitle}</div>
                                <div style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.5)', marginTop: '2px' }}>
                                  Model: {item.productModelNo} {item.colorVariant ? `— Variant: ${item.colorVariant}` : ''}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 550, color: '#8b6914' }}>
                                {item.quantity} × LKR {item.price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(26,18,9,0.5)', fontSize: '13px' }}>
                    No orders found in your patron history. Mockup previews are shown on your Dashboard tab.
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
                      <div key={idx} style={{ border: '1px solid rgba(26,18,9,0.08)', borderRadius: '8px', padding: '14px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ width: '100%', height: '140px', background: '#faf7f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                          <img src={p.images?.[0] || '/mens-watch-highlight.png'} alt={p.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: '0 auto' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1209', margin: 0 }}>{p.title}</h4>
                          <div style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginTop: '2px' }}>Model: {p.modelNo}</div>
                          <div style={{ fontSize: '13px', fontWeight: 650, color: '#8b6914', marginTop: '6px' }}>LKR {p.price?.toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <Link href={`/collections/${p._id}`} style={{ flex: 1, textAlign: 'center', background: '#8b6914', color: '#ffffff', fontSize: '10.5px', padding: '6px 0', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                            View Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromWishlist(p._id)}
                            style={{ background: 'rgba(198, 40, 40, 0.05)', border: '1px solid rgba(198, 40, 40, 0.15)', color: '#c62828', fontSize: '10.5px', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'rgba(26,18,9,0.5)', fontSize: '13px' }}>
                    No timepieces saved to your wishlist yet. Go to the <Link href="/collections" style={{ color: '#8b6914', textDecoration: 'underline', fontWeight: 500 }}>Collections Page</Link> to save your favorites.
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
                <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.1)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1a1209', marginBottom: '4px' }}>Primary Destination Address</strong>
                  <span style={{ fontSize: '12.5px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.5 }}>
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
                <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.7)', lineHeight: 1.6 }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(26,18,9,0.5)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#8b6914' }} disabled />
                    <span>Send SMS updates on courier shipping dispatch (Currently Unavailable)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(26,18,9,0.5)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#8b6914' }} disabled />
                    <span>Email receipts and VAT invoice summaries (Currently Unavailable)</span>
                  </label>
                </div>
              </div>
            )}

            {/* PAYMENT METHODS TAB */}
            {activeTab === 'payment-methods' && (
              <div className="content-card">
                <div className="card-header-block">
                  <h3 className="card-title">Payment Methods</h3>
                  <p className="card-subtitle">Manage secure checkout cards and profiles.</p>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '20px 0' }}>
                  No payment methods stored. Payments are verified securely at checkout.
                </p>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Pending Reviews */}
                <div className="content-card">
                  <div className="card-header-block">
                    <h3 className="card-title">Pending Reviews</h3>
                    <p className="card-subtitle">Products eligible for review (Delivered within the last 30 days).</p>
                  </div>
                  {loadingReviews ? (
                    <p style={{ fontSize: '13px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '20px 0' }}>Loading items...</p>
                  ) : pendingReviews.length === 0 ? (
                    <p style={{ fontSize: '13.5px', color: 'rgba(26,18,9,0.5)', textAlign: 'center', padding: '30px 0', margin: 0 }}>
                      No pending reviews. Only purchased timepieces from delivered orders within the last 30 days can be reviewed.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {pendingReviews.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', border: '1px solid rgba(26,18,9,0.08)', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(26,18,9,0.05)' }}>
                            <img src={item.productThumbnail} alt={item.productTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: '#1a1209' }}>{item.productTitle}</h4>
                            <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase' }}>Model: {item.productModelNo}</span>
                            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#8B6914', fontWeight: 550 }}>
                              ⏳ {item.daysLeft} days remaining to review
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewItem(item);
                              setIsReviewModalOpen(true);
                            }}
                            className="store-banner-btn"
                            style={{ padding: '8px 16px', fontSize: '10.5px', borderRadius: '4px', cursor: 'pointer' }}
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
                        <div key={idx} style={{ border: '1px solid rgba(26,18,9,0.08)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(26,18,9,0.05)', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(26,18,9,0.05)' }}>
                                <img src={rev.productId?.thumbnail?.url || '/white.webp'} alt={rev.productId?.title || 'Timepiece'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 600 }}>{rev.productId?.title || 'Timepiece'}</h4>
                                <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', textTransform: 'uppercase' }}>Model: {rev.productId?.modelNo || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 650,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              background: rev.status === 'approved' ? 'rgba(46,125,50,0.1)' : rev.status === 'rejected' ? 'rgba(198,40,40,0.1)' : 'rgba(239,108,0,0.1)',
                              color: rev.status === 'approved' ? '#2e7d32' : rev.status === 'rejected' ? '#c62828' : '#ef6c00',
                            }}>
                              {rev.status === 'pending' ? 'Pending Approval' : rev.status}
                            </span>
                          </div>

                          {/* Review Details */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ color: i < rev.rating ? '#FFC107' : '#E0E0E0', fontSize: '14px' }}>★</span>
                              ))}
                              <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', marginLeft: '6px' }}>
                                Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(26,18,9,0.7)' }}>{rev.comment}</p>

                            {/* Attached Images */}
                            {rev.images && rev.images.length > 0 && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {rev.images.map((url: string, i: number) => (
                                  <a href={url} target="_blank" rel="noopener noreferrer" key={i} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(26,18,9,0.05)' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(26,18,9,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#1a1209' }}>
                      Recent Orders
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      style={{ background: 'none', border: 'none', color: '#8b6914', fontSize: '11px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}
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
                  <div style={{ borderBottom: '1px solid rgba(26,18,9,0.06)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#1a1209' }}>
                      Account Benefits
                    </h4>
                  </div>

                  <div className="patron-black-card">
                    <h5 className="black-card-title">{membershipTier} BENEFITS</h5>
                    <p className="black-card-desc">Enjoy exclusive benefits and privileges.</p>
                    <span className="black-card-gold-seal">👑</span>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Jost', sans-serif" }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '30px', maxWidth: '480px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 500, margin: '0 0 8px 0', color: '#1a1209' }}>Write a Review</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '12.5px', color: 'rgba(26,18,9,0.5)' }}>For: {reviewItem.productTitle} (Model: {reviewItem.productModelNo})</p>

            <form onSubmit={handleSubmitReview}>
              {/* Star Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: 'rgba(26,18,9,0.6)' }}>Select Rating *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewRating(num)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '28px',
                        color: reviewRating >= num ? '#FFC107' : '#E0E0E0',
                        padding: 0,
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: 'rgba(26,18,9,0.6)' }}>Your Feedback *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your experience with the timepiece's craftsmanship, packaging, and quality details..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', outline: 'none', resize: 'vertical', fontSize: '13px', color: '#1a1209' }}
                />
              </div>

              {/* Image Attachments */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: 'rgba(26,18,9,0.6)' }}>Attach Photos (Max 2)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleReviewImageUpload}
                  disabled={uploadingReviewImg || reviewImages.length >= 2}
                  style={{ fontSize: '12px' }}
                />

                {uploadingReviewImg && <p style={{ fontSize: '11px', color: '#8B6914', margin: '6px 0 0 0' }}>Uploading image attachments...</p>}

                {reviewImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {reviewImages.map((url, i) => (
                      <div key={i} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}>
                        <img src={url} alt="Attached review item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: '14px', height: '14px', borderRadius: '50%', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  id="review-anonymous"
                  type="checkbox"
                  checked={reviewAnonymous}
                  onChange={(e) => setReviewAnonymous(e.target.checked)}
                />
                <label htmlFor="review-anonymous" style={{ fontSize: '13px', color: 'rgba(26,18,9,0.8)', cursor: 'pointer' }}>Review anonymously (masks your profile name)</label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setReviewItem(null);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid rgba(26,18,9,0.15)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || uploadingReviewImg}
                  style={{ flex: 1, padding: '12px', borderRadius: '4px', background: '#1a1209', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
