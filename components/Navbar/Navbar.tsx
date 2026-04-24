'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────
interface NavLink {
  label: string;
  href:  string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const TOP_LEFT_LINKS: NavLink[] = [
  { label: 'Collections',    href: '/collections'    },
  { label: 'Our Story',      href: '/our-story'      },
  { label: 'Customer Care',  href: '/customer-care'  },
];

const TOP_RIGHT_LINKS: NavLink[] = [
  { label: 'Find a Retailer', href: '/retailers' },
  { label: 'Accessories',     href: '/accessories' },
];

const COLLECTION_LINKS: NavLink[] = [
  { label: 'CLASSIC',    href: '/collections/classic'    },
  { label: 'SPORT',      href: '/collections/sport'      },
  { label: 'HERITAGE',   href: '/collections/heritage'   },
  { label: 'TOURBILLON', href: '/collections/tourbillon' },
  { label: 'LIMITED',    href: '/collections/limited'    },
];

// ── Icons (inline SVG — no external dependency) ───────────────────────────
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}

// ── Winsor Logo Wordmark ───────────────────────────────────────────────────
function WinsorLogo({ transparent }: { transparent: boolean }) {
  const color = transparent ? '#ffffff' : '#1a1209';
  return (
    <div className="flex flex-col items-center select-none">
      <span
        style={{
          fontFamily:    "'Cormorant Garamond', 'Garamond', serif",
          fontSize:      '22px',
          fontWeight:    700,
          letterSpacing: '0.25em',
          color,
          lineHeight:    1,
          transition:    'color 0.4s ease',
        }}
      >
        WINSOR
      </span>
      {/* Decorative rule under logo */}
      <div
        style={{
          width:      '32px',
          height:     '1px',
          background: transparent ? 'rgba(255,255,255,0.6)' : 'rgba(26,18,9,0.35)',
          marginTop:  '4px',
          transition: 'background 0.4s ease',
        }}
      />
      <span
        style={{
          fontFamily:    "'Cormorant Garamond', 'Garamond', serif",
          fontSize:      '8px',
          fontWeight:    400,
          letterSpacing: '0.3em',
          color:         transparent ? 'rgba(255,255,255,0.75)' : 'rgba(26,18,9,0.55)',
          marginTop:     '3px',
          transition:    'color 0.4s ease',
        }}
      >
        SINCE 1987
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Navbar() {
  const [isTransparent, setIsTransparent]   = useState(true);
  const [isVisible,     setIsVisible]       = useState(true);
  const [mobileOpen,    setMobileOpen]      = useState(false);
  const [searchOpen,    setSearchOpen]      = useState(false);
  const [searchQuery,   setSearchQuery]     = useState('');

  const lastScrollY  = useRef(0);
  const heroHeight   = useRef(0);

  // Measure hero height on mount
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (hero) heroHeight.current = hero.offsetHeight;
    else       heroHeight.current = window.innerHeight;
  }, []);

  // Scroll behaviour
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      // Transparent only when within hero section
      setIsTransparent(current < heroHeight.current - 80);

      // Hide on scroll down, show on scroll up
      if (current > lastScrollY.current && current > 120) {
        setIsVisible(false);
        setSearchOpen(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const textColor    = isTransparent ? 'text-white'              : 'text-[#1a1209]';
  const hoverColor   = isTransparent ? 'hover:text-white/70'     : 'hover:text-[#8B6914]';
  const borderColor  = isTransparent ? 'border-white/20'         : 'border-[#1a1209]/10';
  const iconColor    = isTransparent ? 'text-white/90'           : 'text-[#1a1209]';

  return (
    <>
      {/* ── Google Font load ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500&display=swap');

        .winsor-nav-link {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          transition: color 0.25s ease, opacity 0.25s ease;
          position: relative;
        }
        .winsor-nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: currentColor;
          transition: width 0.3s ease;
        }
        .winsor-nav-link:hover::after { width: 100%; }

        .winsor-col-link {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2em;
          transition: color 0.25s ease;
          position: relative;
          padding-bottom: 4px;
        }
        .winsor-col-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 1px;
          background: currentColor;
          transition: width 0.35s ease;
        }
        .winsor-col-link:hover::after { width: 100%; }

        .navbar-slide {
          transform: translateY(${isVisible ? '0' : '-100%'});
          transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .search-expand {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>

      {/* ════════════════════════════════════════════════
          NAVBAR WRAPPER
      ════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 navbar-slide"
        style={{
          background: isTransparent
            ? 'transparent'
            : 'rgba(250, 247, 240, 0.97)',
          backdropFilter: isTransparent ? 'none' : 'blur(12px)',
          WebkitBackdropFilter: isTransparent ? 'none' : 'blur(12px)',
          borderBottom: isTransparent
            ? '1px solid rgba(255,255,255,0.12)'
            : '1px solid rgba(26,18,9,0.08)',
          transition: 'background 0.4s ease, border-color 0.4s ease, transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        {/* ── TOP ROW ─────────────────────────────── */}
        <div className={`border-b ${borderColor} transition-colors duration-400`}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-10 flex items-center justify-between">

            {/* Left utility links */}
            <nav className="hidden lg:flex items-center gap-7">
              {TOP_LEFT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`winsor-nav-link ${textColor} ${hoverColor}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Center — Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2">
              <Link href="/" aria-label="Winsor — Home">
                <WinsorLogo transparent={isTransparent} />
              </Link>
            </div>

            {/* Right utility links + icons */}
            <div className="hidden lg:flex items-center gap-7 ml-auto">
              {TOP_RIGHT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`winsor-nav-link ${textColor} ${hoverColor}`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div
                className={`h-3.5 w-px ${isTransparent ? 'bg-white/25' : 'bg-[#1a1209]/20'} transition-colors duration-400`}
              />

              {/* Search */}
              <div className="flex items-center gap-1">
                {searchOpen && (
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search watches..."
                    className={`search-expand w-44 bg-transparent border-b outline-none text-sm pb-0.5
                      ${isTransparent
                        ? 'border-white/40 text-white placeholder:text-white/50'
                        : 'border-[#1a1209]/30 text-[#1a1209] placeholder:text-[#1a1209]/40'
                      }`}
                    style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px' }}
                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  />
                )}
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className={`${iconColor} hover:opacity-60 transition-opacity p-1`}
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              </div>

              {/* Account */}
              <Link href="/account" className={`${iconColor} hover:opacity-60 transition-opacity p-1`} aria-label="Account">
                <UserIcon />
              </Link>

              {/* Cart */}
              <Link href="/cart" className={`${iconColor} hover:opacity-60 transition-opacity p-1 relative`} aria-label="Cart">
                <BagIcon />
                {/* Cart badge — show when items > 0 */}
                <span
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                  style={{
                    fontSize:   '8px',
                    background: '#8B6914',
                    fontFamily: "'Jost', sans-serif",
                  }}
                >
                  0
                </span>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden ml-auto ${iconColor} p-1`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* ── BOTTOM ROW — Collection links ────────── */}
        <div className="hidden lg:block">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-11 flex items-center justify-center gap-12">
            {COLLECTION_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`winsor-col-link ${textColor} ${hoverColor}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════ */}
      <div
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     40,
          background: 'rgba(26,18,9,0.5)',
          opacity:    mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
        onClick={() => setMobileOpen(false)}
      />

      <div
        style={{
          position:   'fixed',
          top:        0,
          right:      0,
          bottom:     0,
          width:      '300px',
          zIndex:     50,
          background: '#faf7f0',
          transform:  mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
          display:    'flex',
          flexDirection: 'column',
          paddingTop: '24px',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 pb-5 border-b border-[#1a1209]/10">
          <WinsorLogo transparent={false} />
          <button onClick={() => setMobileOpen(false)} className="text-[#1a1209] p-1">
            <CloseIcon />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto px-6 pt-6 flex flex-col gap-1">
          <p
            className="text-[#8B6914] mb-3"
            style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', letterSpacing: '0.25em' }}
          >
            COLLECTIONS
          </p>
          {COLLECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[#1a1209] py-3 border-b border-[#1a1209]/06 flex items-center justify-between group"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', letterSpacing: '0.15em' }}
            >
              {link.label}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8B6914]">→</span>
            </Link>
          ))}

          <p
            className="text-[#8B6914] mt-6 mb-3"
            style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', letterSpacing: '0.25em' }}
          >
            EXPLORE
          </p>
          {[...TOP_LEFT_LINKS, ...TOP_RIGHT_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[#1a1209]/70 py-2.5 border-b border-[#1a1209]/06"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', letterSpacing: '0.08em' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer icons */}
        <div className="px-6 py-5 border-t border-[#1a1209]/10 flex items-center gap-5">
          <Link href="/account" className="text-[#1a1209] hover:text-[#8B6914] transition-colors">
            <UserIcon />
          </Link>
          <Link href="/cart" className="text-[#1a1209] hover:text-[#8B6914] transition-colors relative">
            <BagIcon />
          </Link>
          <div className="ml-auto">
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-b border-[#1a1209]/30 outline-none text-[#1a1209] placeholder:text-[#1a1209]/40 pb-0.5 w-32"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}