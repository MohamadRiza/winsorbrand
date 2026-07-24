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

  // Active / Completed Orders calculation (Synced with MongoDB lowercase status schema)
  const activeOrdersCount = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'pending' || s === 'processing' || s === 'shipped';
  }).length;

  const completedOrdersCount = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'delivered';
  }).length;

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

  // Real patron orders mapping (synced with MongoDB database)
  const displayOrders = orders.slice(0, 5).map(o => ({
    orderRef: o.orderRef,
    date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: (o.status || 'pending').toLowerCase(),
    statusLabel: (o.status || 'pending').replace('_', ' ').toUpperCase(),
    productTitle: o.items[0]?.productTitle || 'Winsor Timepiece',
    productThumbnail: o.items[0]?.productThumbnail || '/mens-watch-highlight.png'
  }));

  return (
    <div className="profile-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

        .profile-page-container {
          background-image: linear-gradient(to bottom, rgba(250, 247, 240, 0.94), rgba(250, 247, 240, 0.96)), url('/hero_bg_marble.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          min-height: 100vh;
          padding: 130px 24px 80px;
          font-family: 'Jost', sans-serif;
        }

        /* ── Loading ── */
        .profile-loading-wrapper {
          min-height: 80vh;
          display: flex; align-items: center; justify-content: center;
          background-image: linear-gradient(to bottom, rgba(250, 247, 240, 0.94), rgba(250, 247, 240, 0.96)), url('/hero_bg_marble.jpg');
          background-size: cover;
        }
        .profile-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(139,105,20,0.15);
          border-top: 3px solid #8B6914;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Access Card ── */
        .access-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(139,105,20,0.2);
          box-shadow: 0 20px 50px rgba(26,18,9,0.08);
          border-radius: 20px;
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
          max-width: 1160px;
          margin: 0 auto;
          display: flex; flex-direction: column;
          gap: 28px;
        }

        /* ── Futuristic Hero Header Banner ── */
        .portal-header-banner {
          background: linear-gradient(135deg, rgba(26, 18, 9, 0.95) 0%, rgba(40, 28, 15, 0.92) 50%, rgba(20, 14, 7, 0.96) 100%), url('/hero_bg_marble.jpg');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 24px;
          padding: 36px 42px;
          display: flex;
          align-items: center;
          gap: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 30px rgba(139, 105, 20, 0.15);
          backdrop-filter: blur(16px);
        }
        .banner-watermark {
          position: absolute; right: -20px; top: 50%;
          transform: translateY(-50%);
          width: 320px; height: auto;
          opacity: 0.08; pointer-events: none;
          mix-blend-mode: luminosity;
        }
        .banner-glow-effect {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .avatar-wrapper {
          position: relative;
          width: 105px; height: 105px; flex-shrink: 0;
        }
        .avatar-img {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #d4af37;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(0,0,0,0.5);
          padding: 3px;
          object-fit: cover;
          background: #1a1209;
        }
        .avatar-fallback {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 3px solid #d4af37;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
          background: linear-gradient(135deg, #1a1209 0%, #8b6914 100%);
          color: #f3e3b8;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 600;
          font-family: 'Cormorant Garamond', serif;
        }
        .avatar-edit-btn {
          position: absolute; bottom: 2px; right: 2px;
          width: 28px; height: 28px;
          background: #d4af37;
          border: 2px solid #1a1209;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #1a1209; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          transition: all 0.25s ease;
        }
        .avatar-edit-btn:hover { transform: scale(1.15); background: #ffffff; color: #8b6914; }

        .header-info-block { display: flex; flex-direction: column; gap: 8px; z-index: 2; width: 100%; }
        .patron-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #f3e3b8;
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
          padding: 5px 14px; border-radius: 30px;
          width: fit-content; text-transform: uppercase;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
        }
        .patron-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #d4af37;
          box-shadow: 0 0 8px #d4af37;
          animation: pulseGold 2s infinite;
        }
        @keyframes pulseGold {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .patron-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 600;
          color: #ffffff; margin: 0; letter-spacing: 0.02em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .member-since { font-size: 12px; color: rgba(255, 255, 255, 0.55); margin-top: -4px; letter-spacing: 0.04em; }

        /* ── Futuristic Metrics Grid in Hero ── */
        .hero-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 14px;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          padding-top: 16px;
          width: 100%;
        }
        .hero-stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .hero-stat-card:hover {
          background: rgba(212, 175, 55, 0.12);
          border-color: #d4af37;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.15);
        }
        .hero-stat-icon-wrapper {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          display: flex; align-items: center; justify-content: center;
          color: #d4af37; flex-shrink: 0;
        }
        .hero-stat-val {
          font-family: 'Jost', monospace;
          font-variant-numeric: tabular-nums;
          font-size: 20px; font-weight: 700;
          color: #ffffff; line-height: 1;
        }
        .hero-stat-lbl {
          font-size: 10px; font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-top: 3px;
        }

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
          .profile-page-container { padding: 0 0 96px; background-attachment: scroll; }
          .profile-portal-wrapper { padding: 0; gap: 0; }

          /* ── Hero Header ── */
          .portal-header-banner {
            background: linear-gradient(160deg, rgba(26, 18, 9, 0.98) 0%, rgba(40, 28, 15, 0.96) 50%, rgba(20, 14, 7, 0.98) 100%), url('/hero_bg_marble.jpg');
            background-size: cover;
            border-radius: 0 0 24px 24px;
            border-left: none; border-right: none; border-top: none;
            flex-direction: column; align-items: center; text-align: center;
            padding: 100px 16px 28px;
            gap: 0; margin-bottom: 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
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
            border: 3px solid rgba(212,175,55,0.9);
            box-shadow: 0 0 0 4px rgba(139,105,20,0.25), 0 8px 24px rgba(0,0,0,0.4);
          }
          .avatar-fallback {
            border: 3px solid rgba(212,175,55,0.9);
            box-shadow: 0 0 0 4px rgba(139,105,20,0.25), 0 8px 24px rgba(0,0,0,0.4);
          }
          .avatar-edit-btn {
            background: #d4af37;
            border-color: #1a1209;
            color: #1a1209;
          }

          /* ── Name & Badge ── */
          .header-info-block { align-items: center; text-align: center; gap: 8px; position: relative; z-index: 2; }
          .patron-badge {
            background: rgba(212,175,55,0.15);
            border-color: rgba(212,175,55,0.4);
            color: #f3e3b8;
            font-size: 8.5px;
          }
          .patron-name { font-size: 24px; color: #ffffff; letter-spacing: 0.03em; }
          .member-since { color: rgba(255,255,255,0.55); font-size: 11px; text-align: center; }

          /* ── Stats: 2×2 luxury tiles ── */
          .hero-stats-grid {
            display: grid; grid-template-columns: repeat(2, 1fr);
            gap: 10px; margin-top: 18px; padding-top: 16px;
            border-top: 1px solid rgba(212,175,55,0.2); width: 100%;
            position: relative; z-index: 2;
          }
          .hero-stat-card {
            padding: 10px 12px;
            gap: 10px;
            background: rgba(255,255,255,0.06);
            border-radius: 12px;
          }
          .hero-stat-icon-wrapper {
            width: 32px; height: 32px;
          }
          .hero-stat-val {
            font-size: 16px;
          }
          .hero-stat-lbl {
            font-size: 8.5px;
          }

          /* ── Dashboard command stat tiles 2x2 compact grid for mobile ── */
          .dashboard-metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-top: 14px !important;
          }
          .metric-tile-card {
            padding: 12px 10px !important;
            border-radius: 12px !important;
          }
          .metric-tile-label {
            font-size: 8.5px !important;
            letter-spacing: 0.04em !important;
          }
          .metric-tile-value {
            font-size: 22px !important;
            margin-top: 4px !important;
          }
          .metric-tile-sub {
            font-size: 9px !important;
            margin-top: 4px !important;
            line-height: 1.25 !important;
          }
          .dashboard-welcome-banner {
            padding: 16px 14px !important;
            border-radius: 12px !important;
          }
          .dashboard-welcome-banner h4 {
            font-size: 18px !important;
            margin-bottom: 6px !important;
          }
          .dashboard-welcome-banner p {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          /* ── Sticky bottom tab bar ── */
          .portal-sidebar-desktop { display: none !important; }
          .mobile-tab-bar {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            z-index: 200;
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            gap: 0; padding: 0 0 env(safe-area-inset-bottom, 0px);
            background: rgba(26, 18, 9, 0.96);
            backdrop-filter: blur(16px);
            border-top: 1px solid rgba(212,175,55,0.3);
            scrollbar-width: none;
            box-shadow: 0 -6px 28px rgba(0,0,0,0.35);
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
            color: rgba(255,255,255,0.4);
            cursor: pointer; flex-shrink: 0; min-width: 60px;
            transition: all 0.15s ease; text-transform: uppercase;
          }
          .mobile-tab-pill svg { opacity: 0.5; transition: opacity 0.15s; }
          .mobile-tab-pill.active { border-top-color: #d4af37; color: #d4af37; background: rgba(212,175,55,0.06); }
          .mobile-tab-pill.active svg { opacity: 1; }
          .mobile-tab-pill.logout-pill { color: rgba(220,80,80,0.7); }
          .mobile-tab-pill.logout-pill svg { opacity: 0.7; }

          /* ── Compact completion strip ── */
          .mobile-completion-strip {
            display: flex; align-items: center; gap: 14px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(139,105,20,0.12);
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
          .portal-content-panel { gap: 14px; padding: 16px 14px 8px; }
          .content-card {
            padding: 20px 16px; border-radius: 16px;
            box-shadow: 0 4px 20px rgba(26,18,9,0.05);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
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
        {/* TOP PATRON HEADER BANNER (FUTURISTIC MARBLE HERO) */}
        <div className="portal-header-banner">
          <div className="banner-glow-effect" />
          <img src="/womens-watch-highlight.png" alt="" className="banner-watermark" />

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
              <div className="patron-badge">
                <span className="patron-badge-dot" />
                <span>✦ {membershipTier} ✦</span>
              </div>
              <span className="font-mono text-[10px] text-[#f3e3b8]/80 tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-[#d4af37]/35 shadow-inner">
                PATRON ID: #WS-{(user.id || '987654').slice(-6).toUpperCase()}
              </span>
            </div>

            <h1 className="patron-name">{fullName || 'WINSOR PATRON'}</h1>
            <span className="member-since">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'June 2026'} • Verified Winsor Maison Client
            </span>

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
                  <div className="hero-stat-val">{(50 + orders.length * 25).toLocaleString()}</div>
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
                  <div className="hero-stat-val text-xs text-[#d4af37] font-semibold font-sans tracking-wide uppercase">
                    {membershipTier.replace(' MEMBER', '').replace(' PATRON', '')}
                  </div>
                  <div className="hero-stat-lbl">VIP PRIVILEGE</div>
                </div>
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
                <div className="card-header-block flex items-center justify-between">
                  <div>
                    <h3 className="card-title">Patron Command Dashboard</h3>
                    <p className="card-subtitle">Overview of your timepiece acquisitions, wishlist, and rewards.</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#8b6914] font-bold px-3 py-1 bg-[#8b6914]/10 rounded-full border border-[#8b6914]/30 uppercase tracking-widest">
                    SYSTEM STATUS: ACTIVE
                  </span>
                </div>

                {/* Futuristic Welcome Banner */}
                <div className="dashboard-welcome-banner relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(26,18,9,0.04) 0%, rgba(139,105,20,0.08) 100%)', border: '1px solid rgba(139,105,20,0.25)', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05, pointerEvents: 'none' }}>
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#1a1209', fontWeight: 600 }}>
                    Welcome to Your Private Curation, {user.firstName || 'Winsor Patron'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(26,18,9,0.65)', lineHeight: 1.6, maxWidth: '680px' }}>
                    As a verified <strong style={{ color: '#8b6914' }}>{membershipTier}</strong>, you receive priority allocations for limited-edition watch releases, complimentary bespoke packaging, and dedicated boutique concierge access.
                  </p>
                </div>

                {/* 4 Quick Stat Tiles with Tabular Numbers */}
                <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  <div className="metric-tile-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf7f0 100%)', border: '1px solid rgba(139,105,20,0.18)', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(26,18,9,0.03)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>Active Shipments</div>
                    <div className="metric-tile-value" style={{ fontSize: '32px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#1a1209', fontWeight: 700, marginTop: '6px', lineHeight: 1 }}>
                      {activeOrdersCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)', marginTop: '8px' }}>
                      {activeOrdersCount > 0 ? '🚚 In transit via express courier' : '✓ No active pending dispatches'}
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf7f0 100%)', border: '1px solid rgba(139,105,20,0.18)', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(26,18,9,0.03)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>Delivered Acquisitions</div>
                    <div className="metric-tile-value" style={{ fontSize: '32px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#8b6914', fontWeight: 700, marginTop: '6px', lineHeight: 1 }}>
                      {completedOrdersCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)', marginTop: '8px' }}>
                      {orders.length} Total orders recorded
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf7f0 100%)', border: '1px solid rgba(139,105,20,0.18)', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(26,18,9,0.03)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>Reward Point Balance</div>
                    <div className="metric-tile-value" style={{ fontSize: '32px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#1a1209', fontWeight: 700, marginTop: '6px', lineHeight: 1 }}>
                      {(50 + orders.length * 25).toLocaleString()}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '10.5px', color: '#8b6914', fontWeight: 600, marginTop: '8px' }}>
                      +25 Points per timepiece order
                    </div>
                  </div>

                  <div className="metric-tile-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf7f0 100%)', border: '1px solid rgba(139,105,20,0.18)', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(26,18,9,0.03)' }}>
                    <div className="metric-tile-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'rgba(26,18,9,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>Saved Wishlist</div>
                    <div className="metric-tile-value" style={{ fontSize: '32px', fontFamily: 'Jost, monospace', fontVariantNumeric: 'tabular-nums', color: '#8b6914', fontWeight: 700, marginTop: '6px', lineHeight: 1 }}>
                      {wishlistCount.toString().padStart(2, '0')}
                    </div>
                    <div className="metric-tile-sub" style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.45)', marginTop: '8px' }}>
                      Favorite watch designs saved
                    </div>
                  </div>
                </div>

                {/* Bottom Split: Recent Acquisitions & Black Card Privileges */}
                <div className="portal-bottom-split" style={{ marginTop: '24px' }}>
                  {/* Left: Recent Activity */}
                  <div>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#1a1209', margin: '0 0 14px 0' }}>
                      Recent Timepiece Activity
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
                        <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                          <svg className="w-8 h-8 text-[#8B6914] mx-auto mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: '#1a1209' }}>No Timepiece Acquisitions Yet</p>
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(26,18,9,0.5)', lineHeight: 1.5 }}>
                            Your order history is empty. Explore our luxury watch catalog to make your first acquisition.
                          </p>
                          <Link href="/collections" style={{ display: 'inline-block', marginTop: '12px', background: '#1a1209', color: '#faf7f0', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', padding: '8px 16px', borderRadius: '8px', textTransform: 'uppercase' }}>
                            Explore Collections →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Black Card Privileges */}
                  <div>
                    <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: '#1a1209', margin: '0 0 14px 0' }}>
                      Patron Membership Benefits
                    </h4>
                    <div className="patron-black-card">
                      <div className="black-card-gold-seal">⚜</div>
                      <h5 className="black-card-title">✦ {membershipTier} PRIVILEGES ✦</h5>
                      <p className="black-card-desc">Your exclusive membership status grants tier 1 perks across all global Winsor boutiques.</p>
                      
                      <div className="benefits-checklist" style={{ marginTop: '16px' }}>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '12px' }}>First right to limited releases & allocations</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '12px' }}>Complimentary lifetime horology maintenance</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '12px' }}>Bespoke gift engraving & luxury box wrapping</span>
                        </div>
                        <div className="benefit-check-item">
                          <span className="benefit-check-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '12px' }}>Direct VIP concierge support 24/7</span>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 550, color: '#8b6914' }}>
                                  {item.quantity} × LKR {item.price.toLocaleString()}
                                </div>
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
                                        fontSize: '10.5px',
                                        padding: '5px 11px',
                                        borderRadius: '20px',
                                        fontFamily: "'Jost', sans-serif",
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                      Reviewed
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
                                        background: 'rgba(139,105,20,0.07)',
                                        border: '1px solid rgba(139,105,20,0.25)',
                                        color: '#8b6914',
                                        fontSize: '10.5px',
                                        padding: '5px 11px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontFamily: "'Jost', sans-serif",
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      ★ Write Review
                                    </button>
                                  )
                                )}
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
                        <div key={idx} style={{ border: '1px solid rgba(139,105,20,0.15)', borderRadius: '12px', padding: '20px', background: '#faf7f0', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139,105,20,0.12)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(26,18,9,0.08)', background: '#ffffff', padding: '2px', flexShrink: 0 }}>
                                <img src={rev.productId?.thumbnail?.url || '/mens-watch-highlight.png'} alt={rev.productId?.title || 'Timepiece'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 650, color: '#1a1209' }}>{rev.productId?.title || 'Timepiece'}</h4>
                                <span style={{ fontSize: '11px', color: '#8b6914', fontFamily: 'Jost, monospace', fontWeight: 600 }}>Model: #{rev.productId?.modelNo || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '4px 12px',
                              borderRadius: '20px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              background: rev.status === 'approved' ? 'rgba(46,125,50,0.08)' : rev.status === 'rejected' ? 'rgba(198,40,40,0.08)' : 'rgba(212,175,55,0.12)',
                              color: rev.status === 'approved' ? '#2e7d32' : rev.status === 'rejected' ? '#c62828' : '#8b6914',
                              border: rev.status === 'approved' ? '1px solid rgba(46,125,50,0.25)' : rev.status === 'rejected' ? '1px solid rgba(198,40,40,0.25)' : '1px solid rgba(212,175,55,0.3)',
                            }}>
                              {rev.status === 'pending' ? '⏳ Pending Approval' : rev.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                            </span>
                          </div>

                          {/* Review Details with word wrapping fix */}
                          <div style={{ width: '100%', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} style={{ color: i < rev.rating ? '#d4af37' : '#d1c7b7', fontSize: '16px', lineHeight: 1 }}>★</span>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', marginLeft: '6px', fontWeight: 500 }}>
                                Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {rev.isAnonymous && (
                                <span style={{ fontSize: '10px', background: 'rgba(26,18,9,0.06)', color: 'rgba(26,18,9,0.6)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto', fontWeight: 600 }}>
                                  🔒 Anonymous Review
                                </span>
                              )}
                            </div>

                            {/* Long text container with word-break & max-height scroll */}
                            <div style={{
                              background: '#ffffff',
                              border: '1px solid rgba(26,18,9,0.06)',
                              borderRadius: '10px',
                              padding: '14px 16px',
                              fontSize: '13.5px',
                              lineHeight: 1.6,
                              color: '#1a1209',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              whiteSpace: 'pre-wrap',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
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

      {/* WRITE REVIEW MODAL (LUXURY OVERLAY) */}
      {isReviewModalOpen && reviewItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10, 7, 4, 0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Jost', sans-serif" }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '520px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)' }}>
            
            {/* Dark Luxury Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a1209 0%, #2c1f0c 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f3e3b8', borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '0.04em', color: '#ffffff' }}>
                  ✦ WRITE TIMEPIECE REVIEW ✦
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'rgba(243,227,184,0.7)', letterSpacing: '0.05em' }}>
                  Share your experience with the Winsor horology community
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewItem(null);
                }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Product Item Brief Card */}
              <div style={{ background: '#faf7f0', border: '1px solid rgba(139,105,20,0.18)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgba(26,18,9,0.08)', padding: '3px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={reviewItem.productThumbnail || '/mens-watch-highlight.png'} alt={reviewItem.productTitle} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 650, color: '#1a1209' }}>{reviewItem.productTitle}</h4>
                  <div style={{ fontSize: '11px', color: '#8b6914', fontFamily: 'Jost, monospace', fontWeight: 600, marginTop: '2px' }}>
                    Model: #{reviewItem.productModelNo} {reviewItem.colorVariant ? `• Variant: ${reviewItem.colorVariant}` : ''}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitReview}>
                {/* Rating selection */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1a1209' }}>
                      Overall Rating *
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b6914' }}>
                      {reviewRating === 5 && '5.0 / 5.0 — Exceptional Quality'}
                      {reviewRating === 4 && '4.0 / 5.0 — Very Good'}
                      {reviewRating === 3 && '3.0 / 5.0 — Satisfactory'}
                      {reviewRating === 2 && '2.0 / 5.0 — Below Expectations'}
                      {reviewRating === 1 && '1.0 / 5.0 — Poor Experience'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: '#faf7f0', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.15)', width: 'fit-content' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '26px',
                          color: reviewRating >= num ? '#d4af37' : '#d1c7b7',
                          padding: 0,
                          transition: 'transform 0.15s ease',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Comment */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', color: '#1a1209' }}>
                    Your Detailed Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your experience with the timepiece's craftsmanship, movement precision, packaging presentation, and overall horology details..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(139,105,20,0.25)',
                      background: '#ffffff',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: '13px',
                      color: '#1a1209',
                      lineHeight: 1.5,
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  />
                </div>

                {/* Styled Photo Attachment Dropzone */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', color: '#1a1209' }}>
                    Attach Timepiece Photos (Max 2)
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
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px dashed rgba(139,105,20,0.3)',
                        background: uploadingReviewImg || reviewImages.length >= 2 ? '#f5f2eb' : '#faf7f0',
                        cursor: uploadingReviewImg || reviewImages.length >= 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1a1209' }}>
                        {uploadingReviewImg
                          ? 'Uploading Photo...'
                          : reviewImages.length >= 2
                          ? 'Maximum 2 Photos Uploaded'
                          : 'Click to Choose & Attach Photos'}
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(26,18,9,0.5)', marginTop: '6px' }}>
                    Supported formats: PNG, JPG, WEBP. Maximum 2 image attachments.
                  </div>

                  {/* Thumbnail previews */}
                  {reviewImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      {reviewImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,105,20,0.3)', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                          <img src={url} alt="Attached review item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(26,18,9,0.85)', border: '1px solid #d4af37', color: '#ffffff', width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '26px', background: '#faf7f0', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.15)' }}>
                  <input
                    id="review-anonymous"
                    type="checkbox"
                    checked={reviewAnonymous}
                    onChange={(e) => setReviewAnonymous(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#8b6914', cursor: 'pointer' }}
                  />
                  <label htmlFor="review-anonymous" style={{ fontSize: '12.5px', color: '#1a1209', fontWeight: 550, cursor: 'pointer', userSelect: 'none' }}>
                    Publish review anonymously (masks your profile name for privacy)
                  </label>
                </div>

                {/* High Contrast Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setReviewItem(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(26,18,9,0.25)',
                      background: '#f4efe6',
                      color: '#1a1209',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
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
                      padding: '14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1a1209 0%, #362510 100%)',
                      color: '#d4af37',
                      border: '1px solid #d4af37',
                      cursor: submittingReview || uploadingReviewImg ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 15px rgba(26,18,9,0.25)',
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
