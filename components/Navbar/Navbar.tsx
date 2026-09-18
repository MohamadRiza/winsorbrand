'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrency, CURRENCIES, CurrencyOption } from '@/app/context/CurrencyContext';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useCart } from '@/app/context/CartContext';
import CountryFlag from '@/components/CountryFlag';

const TOP_LEFT_LINKS = [
  { label: 'Collections', href: '/collections' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Customer Care', href: '/customer-care' },
];
const TOP_RIGHT_LINKS = [
  { label: 'Find a Retailer', href: '/retailers' },
  { label: 'Gifts', href: '/gifts' },
];
const COLLECTIONS = [
  {
    key: 'new', label: 'NEW', href: '/new-arrivals', items: [
      { label: 'New Arrivals 2026', href: '/new-arrivals' },
      { label: 'Latest Timepiece Additions', href: '/new-arrivals' },
      { label: 'Bestseller Collection', href: '/collections?section=bestsellers' },
    ]
  },
  {
    key: 'gents', label: 'GENTS', href: '/mens', items: [
      { label: "Gents Collection", href: '/mens' },
      { label: "Men's Chronograph", href: '/sports' },
      { label: "Executive Timepieces", href: '/mens?section=luxury' },
    ]
  },
  {
    key: 'ladies', label: 'LADIES', href: '/womens', items: [
      { label: "Ladies Collection", href: '/womens' },
      { label: "Women's Elegance", href: '/womens?section=luxury' },
      { label: "Petite Diamonds & Gold", href: '/limited-edition' },
    ]
  },
  {
    key: 'sport', label: 'SPORTS', href: '/sports', items: [
      { label: 'Sport Pro Series', href: '/sports' },
      { label: 'Sport Diver', href: '/sports' },
      { label: 'Sport Automatic', href: '/sports' },
    ]
  },
  {
    key: 'limited', label: 'LIMITED', href: '/limited-edition', items: [
      { label: 'Anniversary Edition', href: '/limited-edition' },
      { label: "Founder's Reserve", href: '/limited-edition' },
      { label: "Collector's Piece", href: '/limited-edition' },
    ]
  },
];

// Icon Components
const SearchIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
const UserIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const BagIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
const GlobeIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const ChevronDn = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>;
const MenuIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

function CurrencyPanel({ onClose }: { onClose: () => void }) {
  const { selected, detectedCode, setCurrency, lastUpdated, loading } = useCurrency();
  return (
    <div style={{ padding: '22px 40px', borderBottom: '1px solid rgba(26,18,9,0.07)', background: 'rgba(250,247,240,0.98)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <GlobeIcon />
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '10px', letterSpacing: '0.22em', color: '#8B6914', fontWeight: 500 }}>DISPLAY CURRENCY</span>
          </div>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '10px', color: 'rgba(26,18,9,0.3)' }}>
            {loading ? 'updating rates…' : lastUpdated ? `rates as of ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
        </div>
        {detectedCode !== 'LKR' && (
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', color: 'rgba(26,18,9,0.45)', marginBottom: '14px' }}>
            Your location uses <strong style={{ color: '#1a1209' }}>{detectedCode}</strong>. Select a currency to view converted prices — checkout is always in LKR.
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: '5px' }}>
          {CURRENCIES.map((c: CurrencyOption) => {
            const isSel = selected.code === c.code;
            const isDet = c.code === detectedCode;
            return (
              <button key={c.code} onClick={() => { setCurrency(c.code); onClose(); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 4px', border: isSel ? '1px solid #8B6914' : '1px solid rgba(26,18,9,0.07)', borderRadius: '5px', background: isSel ? 'rgba(139,105,20,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.18s ease', position: 'relative' }}>
                {isDet && !isSel && <span style={{ position: 'absolute', top: '-5px', right: '-4px', background: '#8B6914', color: '#fff', fontSize: '7px', padding: '1px 4px', borderRadius: '3px', fontFamily: "'Jost',sans-serif" }}>AUTO</span>}
                <CountryFlag iso={c.iso} width={20} height={14} />
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '10px', fontWeight: 500, color: isSel ? '#8B6914' : '#1a1209', letterSpacing: '0.05em' }}>{c.code}</span>
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '9px', color: 'rgba(26,18,9,0.38)' }}>{c.symbol}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: '10px', color: 'rgba(26,18,9,0.32)', marginTop: '12px' }}>
          Converted prices are indicative only. Final checkout price is in Sri Lankan Rupees (LKR).
        </p>
      </div>
    </div>
  );
}

function MegaMenu({ visible, showCurrency, onClose }: { visible: boolean; showCurrency: boolean; onClose: () => void }) {
  const show = visible && showCurrency;
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(250,247,240,0.98)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(26,18,9,0.07)', borderBottom: '1px solid rgba(26,18,9,0.07)', boxShadow: '0 16px 48px rgba(26,18,9,0.07)', opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(-8px)', pointerEvents: show ? 'auto' : 'none', transition: 'opacity 0.25s ease, transform 0.25s ease', zIndex: 10 }}>
      {showCurrency && <CurrencyPanel onClose={onClose} />}
    </div>
  );
}

export default function Navbar() {
  const { selected, setCurrency, convertPrice } = useCurrency();
  const { isSignedIn } = useUser();
  const { totalItemsCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const isTransparentPage = pathname === '/' || pathname === '/collections' || pathname === '/customer-care' || pathname === '/gifts' || pathname === '/retailers' || pathname === '/mens' || pathname === '/womens' || pathname === '/sports' || pathname === '/limited-edition' || pathname === '/limited' || pathname === '/new-arrivals';

  const [isTransparent, setIsTransparent] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Client-side search filtering
  const filteredProducts = searchQuery.trim()
    ? products.filter(p => {
      const query = searchQuery.toLowerCase();
      const titleMatch = p.title?.toLowerCase().includes(query);
      const modelMatch = p.modelNo?.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      const variantMatch = p.colorVariants?.some((v: any) => v.colorName?.toLowerCase().includes(query));
      return titleMatch || modelMatch || descMatch || variantMatch;
    }).slice(0, 5)
    : [];

  const [showCurrency, setShowCurrency] = useState(false);
  const [megaVisible, setMegaVisible] = useState(false);
  const [mobileCurrencyOpen, setMobileCurrencyOpen] = useState(false);
  const [expandedMobileCol, setExpandedMobileCol] = useState<string | null>(null);
  const [heroActiveSlide, setHeroActiveSlide] = useState(0);
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);

  // Mobile drawer touch swipe-to-close tracking
  const [drawerDragX, setDrawerDragX] = useState(0);
  const [isDrawerDragging, setIsDrawerDragging] = useState(false);
  const drawerTouchStart = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalGesture = useRef<boolean | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    drawerTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isHorizontalGesture.current = null;
    setIsDrawerDragging(false);
    setDrawerDragX(0);
  };

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (!drawerTouchStart.current) return;
    const diffX = e.touches[0].clientX - drawerTouchStart.current.x;
    const diffY = e.touches[0].clientY - drawerTouchStart.current.y;

    // Detect gesture direction on early touch movement (> 8px)
    if (isHorizontalGesture.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalGesture.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only drag rightward to dismiss (diffX > 0). NEVER allow dragging left into negative space (diffX < 0)!
    if (isHorizontalGesture.current && diffX > 0) {
      setIsDrawerDragging(true);
      setDrawerDragX(diffX);
    }
  };

  const handleDrawerTouchEnd = () => {
    if (isDrawerDragging && drawerDragX > 70) {
      setMobileOpen(false);
    }
    setDrawerDragX(0);
    setIsDrawerDragging(false);
    drawerTouchStart.current = null;
    isHorizontalGesture.current = null;
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const lastScrollY = useRef(0);
  const heroHeight = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with homepage hero slide transitions to handle text contrast
  useEffect(() => {
    const handleSlideChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.activeSlide === 'number') {
        setHeroActiveSlide(customEvent.detail.activeSlide);
      }
    };
    window.addEventListener('winsor-hero-slide-change', handleSlideChange);
    return () => window.removeEventListener('winsor-hero-slide-change', handleSlideChange);
  }, []);

  // Dynamically measure hero section height across all pages
  useEffect(() => {
    const isNonHeroPage = 
      pathname === '/profile' ||
      pathname === '/cart' ||
      pathname.startsWith('/collections/') || // Product details page (e.g. /collections/6a746d1914856a7e53bacea1)
      pathname.startsWith('/careers/') || // Career details view page (e.g. /careers/6a61bd9e0bdd7fdbb54220a5)
      pathname === '/warranty' ||
      pathname === '/faq' ||
      pathname === '/orders' ||
      (pathname.startsWith('/orders/') && pathname !== '/orders/track') ||
      pathname === '/contact' ||
      pathname === '/return' ||
      pathname === '/terms' ||
      pathname === '/privacy' ||
      pathname === '/cookies';

    if (isNonHeroPage) {
      setIsTransparent(false);
      return;
    }

    const updateHeroHeight = () => {
      const hero = document.getElementById('hero') 
        || document.querySelector('.collections-hero-banner') 
        || document.querySelector('.care-hero') 
        || document.querySelector('.gifts-hero-banner') 
        || document.querySelector('.locator-hero-banner') 
        || document.querySelector('.careers-hero-banner')
        || document.querySelector('.order-tracking-hero')
        || document.querySelector('.ws-parallax-bg');
      
      if (hero) {
        const h = (hero as HTMLElement).offsetHeight;
        heroHeight.current = h > 150 ? h : 500;
      } else {
        heroHeight.current = 450;
      }

      const cur = window.scrollY;
      const threshold = (heroHeight.current > 150 ? heroHeight.current : 450) - 80;
      setIsTransparent(cur < threshold);
    };

    updateHeroHeight();
    const timer = setTimeout(updateHeroHeight, 250);
    window.addEventListener('resize', updateHeroHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeroHeight);
    };
  }, [pathname]);

  // Scroll listener to update transparency and visibility dynamically
  useEffect(() => {
    const isNonHeroPage = 
      pathname === '/profile' ||
      pathname === '/cart' ||
      pathname.startsWith('/collections/') ||
      pathname.startsWith('/careers/') ||
      pathname === '/warranty' ||
      pathname === '/faq' ||
      pathname === '/orders' ||
      (pathname.startsWith('/orders/') && pathname !== '/orders/track') ||
      pathname === '/contact' ||
      pathname === '/return' ||
      pathname === '/terms' ||
      pathname === '/privacy' ||
      pathname === '/cookies';

    if (isNonHeroPage) {
      setIsTransparent(false);
    }

    let ticking = false;
    let rafId: number | null = null;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      rafId = window.requestAnimationFrame(() => {
        ticking = false;
        const cur = window.scrollY;

        if (isNonHeroPage) {
          setIsTransparent(prev => (prev !== false ? false : prev));
          if (cur > lastScrollY.current && cur > 120) { 
            setIsVisible(prev => (prev !== false ? false : prev)); 
            setMegaVisible(prev => (prev !== false ? false : prev)); 
          } else { 
            setIsVisible(prev => (prev !== true ? true : prev)); 
          }
          lastScrollY.current = cur;
          return;
        }

        const h = heroHeight.current > 150 ? heroHeight.current : 450;
        const threshold = h - 80;
        const nextTransparent = cur < threshold;
        
        setIsTransparent(prev => (prev !== nextTransparent ? nextTransparent : prev));

        if (cur > lastScrollY.current && cur > 120) { 
          setIsVisible(prev => (prev !== false ? false : prev)); 
          setMegaVisible(prev => (prev !== false ? false : prev)); 
        } else { 
          setIsVisible(prev => (prev !== true ? true : prev)); 
        }
        lastScrollY.current = cur;
      });
    };

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('wn-mobile-menu-open');
      document.documentElement.classList.add('wn-mobile-menu-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('wn-mobile-menu-open');
      document.documentElement.classList.remove('wn-mobile-menu-open');
      setDrawerDragX(0);
      setIsDrawerDragging(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('wn-mobile-menu-open');
      document.documentElement.classList.remove('wn-mobile-menu-open');
    };
  }, [mobileOpen]);

  // Fetch all active products once search is opened to support fast client-side filtering
  useEffect(() => {
    if (searchOpen && products.length === 0) {
      setSearching(true);
      fetch('/api/products')
        .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : { success: false, data: [] }))
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setProducts(data.data);
          }
        })
        .catch(err => console.error('Error fetching products for search:', err))
        .finally(() => setSearching(false));
    }
  }, [searchOpen, products.length]);

  // Click outside search container to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  const openCurrency = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowCurrency(true); setMegaVisible(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setMegaVisible(false);
      setTimeout(() => { setShowCurrency(false); }, 280);
    }, 110);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const isHomepageLightSlide = pathname === '/' && heroActiveSlide !== 2;
  // A transparent navbar stays legible on the hero, then becomes a solid surface
  // whenever it is being used (hovered or displaying an interactive panel).
  const useSolidSurface = !isTransparent || isNavbarHovered || megaVisible || searchOpen;
  const isWhite = !useSolidSurface && !isHomepageLightSlide;
  const tc = isWhite ? '#f3eee6' : '#1a1209';
  const tca = isWhite ? 'rgba(243,238,230,0.85)' : 'rgba(26,18,9,0.65)';
  const div = isWhite ? 'rgba(243,238,230,0.15)' : 'rgba(26,18,9,0.1)';
  const ibS: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease', color: tc };

  // ✅ Logo paths (place in /public folder)
  const LOGO_TRANSPARENT = '/white.webp';
  const LOGO_SOLID = '/yellow.webp';

  // ✅ Logo styles
  const desktopLogoStyle: React.CSSProperties = {
    objectFit: 'contain',
    transition: 'opacity 0.35s ease',
    height: 'auto',
    maxWidth: '180px',
    width: '100%',
  };

  const mobileTopLogoStyle: React.CSSProperties = {
    objectFit: 'contain',
    height: 'auto',
    maxWidth: '130px',
    width: '100%',
  };

  return (
    <>
      <style>{`
        .wn-a{text-decoration:none;transition:color 0.2s ease;}
        .wn-a:hover{color:#8B6914!important;}
        .wn-col-btn{text-decoration:none;position:relative;transition:color 0.22s ease;}
        .wn-col-btn:hover{color:#8B6914!important;}
        .wn-col-btn .wn-underline{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:1px;background:#8B6914;transition:width 0.25s ease;display:block;}
        .wn-col-btn:hover .wn-underline, .wn-col-btn.active .wn-underline{width:100%!important;}
        .wn-ib:hover{opacity:0.55;}
        
        /* Desktop only */
        @media(min-width:1025px){
          .wn-mob-only{display:none!important;}
          .wn-desk-only{display:flex!important;}
        }
        
        /* Mobile only */
        @media(max-width:1024px){
          .wn-desk-only{display:none!important;}
          .wn-mob-only{display:flex!important;}
          .wn-top-row{padding:0 16px!important;}
          .wn-actions-gap{gap:6px!important;}
          .wn-ib{min-width:40px;min-height:40px;align-items:center;justify-content:center;}
        }
        
        .wn-logo-link{display:flex;align-items:center;justify-content:center;}
        .wn-search-item{transition:background 0.2s ease;}
        .wn-search-item:hover{background:rgba(139,105,20,0.05)!important;}
        @keyframes wn-spin {
          to { transform: rotate(360deg); }
        }
        .wn-search-spinner {
          animation: wn-spin 0.8s linear infinite;
        }
        /* ── PRO GLASSMORPHISM MOBILE BUTTON STYLES & OPENING ANIMATION ── */
        @keyframes wn-pill-reveal {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
            filter: blur(4px);
          }
          65% {
            opacity: 0.95;
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .wn-anim-item {
          opacity: 0;
          animation: wn-pill-reveal 0.44s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity, filter;
        }
        .wn-mob-close-btn{transition:all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);}
        .wn-mob-close-btn:hover{background:#FFFFFF!important;border-color:rgba(139,105,20,0.5)!important;transform:rotate(90deg) scale(1.08);box-shadow:0 4px 14px rgba(139,105,20,0.15)!important;}
        .wn-mob-currency-btn{
          transition:all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #FFFFFF !important;
          border: 1px solid rgba(139, 105, 20, 0.20) !important;
          box-shadow: 0 2px 6px -1px rgba(26, 18, 9, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
        }
        .wn-mob-currency-btn:hover{border-color:rgba(139,105,20,0.48)!important;box-shadow:0 5px 16px -2px rgba(139,105,20,0.12)!important;transform:translateY(-1.5px);}
        .wn-mob-col-btn{
          position:relative;
          overflow:hidden;
          transition:all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #FFFFFF !important;
          border: 1px solid rgba(139, 105, 20, 0.20) !important;
          box-shadow: 0 2px 8px -1px rgba(26, 18, 9, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
        }
        .wn-mob-col-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.12) 50%,transparent 100%);transform:translateX(-100%);transition:transform 0.6s ease;pointer-events:none;}
        .wn-mob-col-btn:hover::before,.wn-mob-col-btn:active::before{transform:translateX(100%);}
        .wn-mob-col-btn:hover{background:#FFFFFF!important;border-color:rgba(139,105,20,0.55)!important;box-shadow:0 6px 18px -2px rgba(139,105,20,0.14),inset 0 1px 0 rgba(255,255,255,1)!important;transform:translateY(-1.5px);}
        .wn-mob-col-btn:hover span{color:#8B6914!important;}
        .wn-mob-nav-link{
          position:relative;
          overflow:hidden;
          transition:all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #FFFFFF !important;
          border: 1px solid rgba(139, 105, 20, 0.16) !important;
          box-shadow: 0 2px 6px -1px rgba(26, 18, 9, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
        }
        .wn-mob-nav-link::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.1) 50%,transparent 100%);transform:translateX(-100%);transition:transform 0.6s ease;pointer-events:none;}
        .wn-mob-nav-link:hover::before,.wn-mob-nav-link:active::before{transform:translateX(100%);}
        .wn-mob-nav-link:hover{background:#FFFFFF!important;border-color:rgba(139,105,20,0.48)!important;color:#8B6914!important;box-shadow:0 5px 16px -2px rgba(139,105,20,0.12),inset 0 1px 0 rgba(255,255,255,1)!important;transform:translateY(-1.5px);}
        .wn-mob-profile-btn{
          position:relative;
          overflow:hidden;
          transition:all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #FFFFFF !important;
          border: 1px solid rgba(139, 105, 20, 0.28) !important;
          box-shadow: 0 2px 6px -1px rgba(26, 18, 9, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
        }
        .wn-mob-profile-btn:hover{background:#FFFFFF!important;border-color:rgba(139,105,20,0.6)!important;transform:translateY(-1.5px);box-shadow:0 5px 14px rgba(139,105,20,0.14),inset 0 1px 0 rgba(255,255,255,1)!important;}
        .wn-mob-cart-btn{
          transition:all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: linear-gradient(135deg, #967018 0%, #C8980F 50%, #E2B960 100%) !important;
        }
        .wn-mob-cart-btn:hover{transform:translateY(-1.5px);box-shadow:0 8px 24px rgba(139,105,20,0.45),inset 0 1.5px 1px rgba(255,255,255,0.45)!important;}
        .wn-mob-signin-btn{
          transition:all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #FFFFFF !important;
          border: 1px solid rgba(139, 105, 20, 0.28) !important;
        }
        .wn-mob-signin-btn:hover{border-color:rgba(139,105,20,0.55)!important;transform:translateY(-1.5px);box-shadow:0 4px 14px rgba(139,105,20,0.12)!important;}
        body.wn-mobile-menu-open, html.wn-mobile-menu-open {
          overflow: hidden !important;
          touch-action: none !important;
        }
      `}</style>

      <header
        onMouseEnter={() => setIsNavbarHovered(true)}
        onMouseLeave={() => {
          setIsNavbarHovered(false);
          scheduleClose();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9990,
          willChange: 'transform',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), background 0.35s ease, border-color 0.35s ease',
          background: useSolidSurface
            ? 'rgba(250, 247, 240, 0.98)'
            : (isHomepageLightSlide ? 'rgba(26, 18, 9, 0.05)' : 'rgba(15, 12, 9, 0.28)'),
          backdropFilter: useSolidSurface ? 'blur(14px)' : 'blur(12px)',
          WebkitBackdropFilter: useSolidSurface ? 'blur(14px)' : 'blur(12px)',
          borderBottom: `1px solid ${useSolidSurface ? 'rgba(26,18,9,0.09)' : (isHomepageLightSlide ? 'rgba(26,18,9,0.06)' : 'rgba(243,238,230,0.1)')}`
        }}
      >
        {/* TOP ROW */}
        <div style={{ borderBottom: `1px solid ${div}`, transition: 'border-color 0.35s ease' }}>
          <div className="wn-top-row" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', height: '44px', display: 'flex', alignItems: 'center' }}>

            {/* ✅ LEFT: Mobile Logo (always visible on mobile) */}
            <div className="wn-mob-only" style={{ display: 'flex', alignItems: 'center', minWidth: '130px' }}>
              <Link href="/" className="wn-logo-link">
                <Image
                  src={isWhite ? LOGO_TRANSPARENT : LOGO_SOLID}
                  alt="Winsor"
                  width={130}
                  height={44}
                  style={mobileTopLogoStyle}
                  priority
                />
              </Link>
            </div>

            {/* LEFT: Desktop Navigation */}
            <nav className="wn-desk-only" style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1 }}>
              {TOP_LEFT_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="wn-a" style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', letterSpacing: '0.1em', color: tca }}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* ✅ CENTER: Desktop Logo */}
            <div className="wn-desk-only" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
              <Link href="/" className="wn-logo-link">
                <Image
                  src={isWhite ? LOGO_TRANSPARENT : LOGO_SOLID}
                  alt="Winsor Logo"
                  width={180}
                  height={60}
                  style={desktopLogoStyle}
                  priority
                />
              </Link>
            </div>

            {/* RIGHT: Actions */}
            <div className="wn-actions-gap" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '18px', flex: 1, justifyContent: 'flex-end' }}>
              {/* Currency - Desktop */}
              <button className="wn-desk-only wn-a" onMouseEnter={() => { cancelClose(); openCurrency(); }}
                aria-label={`Select currency, currently ${selected.code}`}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: tca, fontFamily: "'Jost',sans-serif", fontSize: '11px', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}>
                <GlobeIcon /><CountryFlag iso={selected.iso} width={16} height={11} /><span>{selected.code}</span><ChevronDn />
              </button>
              <div className="wn-desk-only" style={{ width: '1px', height: '14px', background: div, transition: 'background 0.35s ease' }} />

              {/* Right Links - Desktop */}
              {TOP_RIGHT_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="wn-a wn-desk-only" style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', letterSpacing: '0.1em', color: tca }}>
                  {l.label}
                </Link>
              ))}
              <div className="wn-desk-only" style={{ width: '1px', height: '14px', background: div }} />

              {/* Search Toggle */}
              <div ref={searchContainerRef} style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                {searchOpen && (
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search watches…"
                    onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${isWhite ? 'rgba(243,238,230,0.35)' : 'rgba(26,18,9,0.3)'}`,
                      outline: 'none',
                      width: '140px',
                      fontFamily: "'Jost',sans-serif",
                      fontSize: '12px',
                      color: tc,
                      paddingBottom: '2px'
                    }}
                  />
                )}
                <button className="wn-ib" style={ibS} onClick={() => setSearchOpen(v => !v)} aria-label={searchOpen ? "Close search" : "Search timepieces"}>
                  <SearchIcon />
                </button>
                {/* Search Dropdown */}
                {searchOpen && searchQuery.trim() && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '300px',
                      background: 'rgba(250, 247, 240, 0.98)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(139, 105, 20, 0.15)',
                      borderRadius: '8px',
                      boxShadow: '0 12px 32px rgba(26, 18, 9, 0.15)',
                      zIndex: 100,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {searching ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#8B6914', fontFamily: "'Jost', sans-serif", fontSize: '12px' }}>
                        <span className="wn-search-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(139, 105, 20, 0.2)', borderTopColor: '#8B6914', borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle' }} />
                        Searching timepieces...
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(26, 18, 9, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(26, 18, 9, 0.4)', fontWeight: 600 }}>SEARCH RESULTS</span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', color: '#8B6914' }}>{filteredProducts.length} found</span>
                        </div>
                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                          {filteredProducts.map(p => (
                            <Link
                              key={p._id}
                              href={`/collections/${p._id}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                borderBottom: '1px solid rgba(26, 18, 9, 0.04)',
                                textDecoration: 'none',
                                transition: 'background 0.2s ease',
                              }}
                              className="wn-search-item"
                            >
                              {p.thumbnail?.url && (
                                <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#fff', border: '1px solid rgba(26, 18, 9, 0.06)', flexShrink: 0 }}>
                                  <Image
                                    src={p.thumbnail.url}
                                    alt={p.title || 'watch'}
                                    fill
                                    sizes="40px"
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: 600, color: '#1a1209', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                  {p.title}
                                </h4>
                                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: 'rgba(26, 18, 9, 0.45)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Model: {p.modelNo}
                                </p>
                              </div>
                              <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 500, color: '#8B6914', flexShrink: 0 }}>
                                {convertPrice(p.price)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(26, 18, 9, 0.5)', fontFamily: "'Jost', sans-serif", fontSize: '12px' }}>
                        No timepieces found matching <span style={{ color: '#1a1209', fontWeight: 500 }}>"{searchQuery}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account & Cart */}
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button style={{ ...ibS, padding: '4px' }} className="wn-ib" aria-label="Sign In">
                    <UserIcon />
                  </button>
                </SignInButton>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: {
                          width: '20px',
                          height: '20px',
                          border: '1px solid rgba(139,105,20,0.3)',
                        }
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My Profile"
                        labelIcon={<UserIcon />}
                        href="/profile"
                      />
                      <UserButton.Link
                        label="My Orders"
                        labelIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        href="/orders"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}
              <Link
                href="/cart"
                style={{ position: 'relative', color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="wn-ib"
                aria-label={`Shopping bag, ${totalItemsCount} item${totalItemsCount !== 1 ? 's' : ''}`}
              >
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '17px', height: '17px' }}>
                  <BagIcon />
                  {totalItemsCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-6px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#8B6914',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 600,
                        fontFamily: "'Jost',sans-serif",
                        lineHeight: 1,
                        border: '1.2px solid rgba(250, 247, 240, 0.95)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                    >
                      {totalItemsCount > 9 ? '9+' : totalItemsCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button className="wn-mob-only wn-ib" style={{ ...ibS, padding: '6px' }} onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen}>
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW - Desktop Collections */}
        <div className="wn-desk-only">
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px' }}>
            {COLLECTIONS.map(col => {
              const isActive = pathname === col.href;
              return (
                <Link
                  key={col.key}
                  href={col.href}
                  className={`wn-col-btn ${isActive ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 0 4px',
                    fontFamily: "'Jost',sans-serif",
                    fontSize: '11.5px',
                    fontWeight: 500,
                    letterSpacing: '0.2em',
                    color: isActive ? '#8B6914' : tc,
                    position: 'relative',
                    textDecoration: 'none'
                  }}
                >
                  {col.label}
                  <span className="wn-underline" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* CURRENCY PANEL (IF ACTIVE) */}
        {showCurrency && (
          <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <MegaMenu visible={megaVisible} showCurrency={showCurrency} onClose={() => setMegaVisible(false)} />
          </div>
        )}
      </header>

      {/* ── MOBILE OVERLAY ── */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(10, 8, 5, 0.42)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease'
        }}
      />

      {/* ── MOBILE DRAWER (FROSTED CRYSTAL GLASS WITH NATIVE SWIPE-TO-DISMISS) ── */}
      <div
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        onTouchStart={handleDrawerTouchStart}
        onTouchMove={handleDrawerTouchMove}
        onTouchEnd={handleDrawerTouchEnd}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(340px, 86vw)',
          zIndex: 9999,
          background: '#FAF8F5',
          borderLeft: '1px solid rgba(139, 105, 20, 0.16)',
          boxShadow: '-14px 0 50px rgba(26, 18, 9, 0.16)',
          transform: !mobileOpen
            ? 'translateX(100%)'
            : (isDrawerDragging && drawerDragX > 0 ? `translateX(${drawerDragX}px)` : 'translateX(0)'),
          transition: isDrawerDragging ? 'none' : 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          color: '#1a1209'
        }}
      >
        {/* Subtle ambient gold glow - safely positioned without horizontal overflow */}
        <div style={{ position: 'absolute', top: '-50px', right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,105,20,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 18px',
          borderBottom: '1px solid rgba(139, 105, 20, 0.12)',
          background: '#FAF8F5',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <Link href="/" className="wn-logo-link" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setMobileOpen(false)}>
            <Image src={LOGO_SOLID} alt="Winsor Logo" width={140} height={46}
              style={{ objectFit: 'contain', height: 'auto', maxWidth: '125px' }} priority />
          </Link>
          <button
            className="wn-mob-close-btn"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(139, 105, 20, 0.22)',
              color: '#8B6914', padding: '7.5px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(26,18,9,0.06)',
            }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── CURRENCY SELECTOR ── */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(139, 105, 20, 0.08)', position: 'relative', zIndex: 1, background: '#FAF8F5' }}>
          <button
            className="wn-anim-item wn-mob-currency-btn"
            onClick={() => setMobileCurrencyOpen(v => !v)}
            style={{
              animationDelay: '0.04s',
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              background: '#FFFFFF',
              border: '1px solid rgba(139, 105, 20, 0.20)',
              boxShadow: '0 2px 6px -1px rgba(26,18,9,0.04), inset 0 1px 0 rgba(255,255,255,1)',
              borderRadius: '9999px', padding: '7.5px 16px', cursor: 'pointer',
              justifyContent: 'space-between', color: '#8B6914',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GlobeIcon />
              <CountryFlag iso={selected.iso} width={18} height={13} />
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '11.5px', color: '#1a1209', fontWeight: 500 }}>
                {selected.code} — {selected.label}
              </span>
            </div>
            <ChevronDn />
          </button>

          {mobileCurrencyOpen && (
            <div style={{
              marginTop: '8px', maxHeight: '240px', overflowY: 'auto', padding: '6px',
              background: 'rgba(252, 249, 243, 0.97)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(139, 105, 20, 0.16)',
              borderRadius: '16px', boxShadow: '0 14px 36px rgba(26,18,9,0.14)'
            }}>
              {CURRENCIES.map((c: CurrencyOption) => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setMobileCurrencyOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '9px 14px',
                    background: selected.code === c.code ? 'rgba(139,105,20,0.1)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(26,18,9,0.05)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: selected.code === c.code ? '#8B6914' : 'rgba(26,18,9,0.75)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <CountryFlag iso={c.iso} width={20} height={14} />
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '13px', fontWeight: selected.code === c.code ? 600 : 400 }}>{c.code}</span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', color: 'rgba(26,18,9,0.42)', marginLeft: 'auto' }}>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── NAV LINKS (STAGGERED CASPER REVEAL) ── */}
        <nav
          key={mobileOpen ? 'nav-open' : 'nav-closed'}
          style={{ flex: 1, padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 1 }}
        >

          {/* Section label */}
          <div className="wn-anim-item" style={{ animationDelay: '0.06s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1px', padding: '0 6px' }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '8px', letterSpacing: '0.28em', color: '#8B6914', fontWeight: 700, textTransform: 'uppercase' }}>
              HAUTE HORLOGERIE
            </span>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '8px', letterSpacing: '0.14em', color: 'rgba(26,18,9,0.35)', textTransform: 'uppercase' }}>COLLECTIONS</span>
          </div>

          {/* ── Collection Links (Pure Luminous White Pills, Staggered Reveal, No Arrows) ── */}
          {COLLECTIONS.map((col, idx) => (
            <Link
              key={col.key}
              href={col.href}
              onClick={() => setMobileOpen(false)}
              className="wn-anim-item wn-mob-col-btn"
              style={{
                animationDelay: `${0.08 + idx * 0.04}s`,
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1px solid rgba(139, 105, 20, 0.20)',
                boxShadow: '0 2px 8px -1px rgba(26, 18, 9, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)',
                textDecoration: 'none',
              }}
            >
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '14.5px',
                letterSpacing: '0.12em',
                fontWeight: 600,
                color: '#1a1209',
                transition: 'color 0.2s ease',
              }}>
                {col.label}
              </span>
            </Link>
          ))}

          {/* EXPLORE MAISON label */}
          <div className="wn-anim-item" style={{ animationDelay: '0.28s', marginTop: '8px', marginBottom: '1px', padding: '0 6px' }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '8px', letterSpacing: '0.28em', color: '#8B6914', fontWeight: 700, textTransform: 'uppercase' }}>
              EXPLORE MAISON
            </span>
          </div>

          {/* Account quick links */}
          {isSignedIn && (
            <div className="wn-anim-item" style={{ animationDelay: '0.30s', display: 'flex', gap: '6px', marginBottom: '1px' }}>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="wn-mob-profile-btn"
                style={{
                  flex: 1, padding: '7px 14px', textAlign: 'center',
                  background: '#FFFFFF',
                  border: '1px solid rgba(139, 105, 20, 0.32)',
                  borderRadius: '9999px',
                  color: '#8B6914',
                  fontFamily: "'Jost',sans-serif", fontSize: '10.5px', letterSpacing: '0.1em',
                  textDecoration: 'none', fontWeight: 600,
                  boxShadow: '0 2px 6px -1px rgba(26, 18, 9, 0.04)',
                }}
              >
                My Profile
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileOpen(false)}
                className="wn-mob-profile-btn"
                style={{
                  flex: 1, padding: '7px 14px', textAlign: 'center',
                  background: '#FFFFFF',
                  border: '1px solid rgba(139, 105, 20, 0.32)',
                  borderRadius: '9999px',
                  color: '#8B6914',
                  fontFamily: "'Jost',sans-serif", fontSize: '10.5px', letterSpacing: '0.1em',
                  textDecoration: 'none', fontWeight: 600,
                  boxShadow: '0 2px 6px -1px rgba(26, 18, 9, 0.04)',
                }}
              >
                My Orders
              </Link>
            </div>
          )}

          {/* Top-level nav links (Pure Luminous White Pills, Staggered Reveal, No Arrows) */}
          {[...TOP_LEFT_LINKS, ...TOP_RIGHT_LINKS].map((l, idx) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="wn-anim-item wn-mob-nav-link"
              style={{
                animationDelay: `${0.32 + idx * 0.04}s`,
                fontFamily: "'Jost',sans-serif",
                fontSize: '11.5px', letterSpacing: '0.08em',
                color: '#1a1209',
                fontWeight: 500,
                padding: '7.5px 20px',
                borderRadius: '9999px',
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid rgba(139, 105, 20, 0.16)',
                boxShadow: '0 2px 6px -1px rgba(26, 18, 9, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)',
                display: 'block'
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── FOOTER BAR ── */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(139,105,20,0.12)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#FAF8F5',
          position: 'sticky', bottom: 0, zIndex: 10,
          boxShadow: '0 -4px 20px rgba(26,18,9,0.04)',
        }}>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button
                className="wn-anim-item wn-mob-signin-btn"
                style={{
                  animationDelay: '0.52s',
                  background: '#FFFFFF',
                  border: '1px solid rgba(139, 105, 20, 0.28)',
                  padding: '8px 15px', borderRadius: '9999px', cursor: 'pointer',
                  color: '#1a1209', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 6px -1px rgba(26, 18, 9, 0.04)',
                }}>
                <UserIcon />
                <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', color: '#8B6914', fontWeight: 600 }}>Sign In / Account</span>
              </button>
            </SignInButton>
          ) : (
            <div className="wn-anim-item" style={{ animationDelay: '0.52s', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserButton
                appearance={{ elements: { avatarBox: { width: '24px', height: '24px', border: '1.5px solid rgba(139,105,20,0.48)' } } }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link label="My Profile" labelIcon={<UserIcon />} href="/profile" />
                  <UserButton.Link label="My Orders" labelIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} href="/orders" />
                </UserButton.MenuItems>
              </UserButton>
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '11px', color: '#1a1209', fontWeight: 500 }}>Account</span>
            </div>
          )}

          <Link
            href="/cart"
            onClick={() => setMobileOpen(false)}
            className="wn-anim-item wn-mob-cart-btn"
            style={{
              animationDelay: '0.52s',
              position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #967018 0%, #C8980F 50%, #E2B960 100%)',
              border: '1.2px solid rgba(255, 255, 255, 0.55)',
              padding: '8px 18px', borderRadius: '9999px', textDecoration: 'none',
              boxShadow: '0 5px 18px rgba(139, 105, 20, 0.35), inset 0 1.5px 0 0 rgba(255, 255, 255, 0.45)'
            }}
          >
            <BagIcon />
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: '11.5px', color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.06em' }}>Cart</span>
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#fff', color: '#8B6914',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8.5px', fontFamily: "'Jost',sans-serif", fontWeight: 700,
              border: '1.5px solid #8B6914',
              boxShadow: '0 2px 8px rgba(26,18,9,0.18)'
            }}>
              {totalItemsCount > 9 ? '9+' : totalItemsCount}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
