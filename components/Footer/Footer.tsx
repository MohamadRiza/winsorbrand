// @/components/Footer/Footer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCurrency, CURRENCIES, CurrencyOption } from '@/app/context/CurrencyContext';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────
// ICON COMPONENTS
// ─────────────────────────────────────────────────────────────
const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ChevronDn = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Social Media Icons
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// FOOTER NAVIGATION LINKS
// ─────────────────────────────────────────────────────────────
const FOOTER_LINKS = {
  collections: [
    { label: 'Classic Collection', href: '/collections/classic' },
    { label: 'Sport Collection', href: '/collections/sport' },
    { label: 'Heritage Series', href: '/collections/heritage' },
    { label: 'Tourbillon', href: '/collections/tourbillon' },
    { label: 'Limited Editions', href: '/collections/limited' },
  ],
  company: [
    { label: 'Our Story', href: '/our-story' },
    { label: 'Craftsmanship', href: '/craftsmanship' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  support: [
    { label: 'Customer Care', href: '/customer-care' },
    { label: 'Shipping & Returns', href: '/shipping' },
    { label: 'Warranty', href: '/warranty' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

// ─────────────────────────────────────────────────────────────
// SOCIAL MEDIA LINKS
// ─────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/winsor', icon: <InstagramIcon /> },
  { name: 'Facebook', href: 'https://facebook.com/winsor', icon: <FacebookIcon /> },
  { name: 'TikTok', href: 'https://tiktok.com/@winsor', icon: <TikTokIcon /> },
  { name: 'YouTube', href: 'https://youtube.com/@winsor', icon: <YouTubeIcon /> },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/winsor', icon: <LinkedInIcon /> },
];

// ─────────────────────────────────────────────────────────────
// COMPACT CURRENCY SELECTOR
// ─────────────────────────────────────────────────────────────
function CurrencySelectorCompact() {
  const { selected, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: '1px solid rgba(139,105,20,0.3)',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: "'Jost',sans-serif",
          fontSize: '11px',
          color: '#1a1209',
          transition: 'border-color 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B6914'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139,105,20,0.3)'}
        aria-label="Select currency"
        aria-expanded={isOpen}
      >
        <GlobeIcon />
        <span>{selected.flag} {selected.code}</span>
        <ChevronDn />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: '8px',
          background: '#faf7f0',
          border: '1px solid rgba(26,18,9,0.1)',
          borderRadius: '6px',
          padding: '8px',
          minWidth: '140px',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 -4px 20px rgba(26,18,9,0.08)',
          zIndex: 20
        }}>
          {CURRENCIES.map((c: CurrencyOption) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setIsOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '6px 10px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(26,18,9,0.04)',
                cursor: 'pointer',
                color: selected.code === c.code ? '#8B6914' : '#1a1209',
                fontFamily: "'Jost',sans-serif",
                fontSize: '11px',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,105,20,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: '14px' }}>{c.flag}</span>
              <span style={{ fontWeight: selected.code === c.code ? 600 : 400 }}>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN FOOTER COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500&display=swap');

        .ft-a {
          text-decoration: none;
          transition: color 0.2s ease;
          color: rgba(26,18,9,0.65);
        }
        .ft-a:hover { color: #8B6914 !important; }

        .ft-social {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        .ft-social:hover {
          transform: translateY(-3px);
          opacity: 0.85;
        }

        .ft-input:focus {
          border-color: #8B6914 !important;
          outline: none;
        }

        /* ── DESKTOP (≥ 1025px): 5-column grid ── */
        @media (min-width: 1025px) {
          .ft-main-grid {
            display: grid !important;
            grid-template-columns: 1.6fr 1fr 1fr 1fr 1.3fr !important;
            gap: 40px !important;
            align-items: start !important;
          }
          .ft-mobile-only  { display: none !important; }
          .ft-desktop-only { display: flex !important; }
          .ft-bottom-bar {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .ft-bottom-right {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-end !important;
            text-align: right !important;
          }
        }

        /* ── TABLET (641px – 1024px): 3-column grid ── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .ft-main-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 36px !important;
            align-items: start !important;
          }
          .ft-brand-col    { grid-column: span 3 !important; }
          .ft-newsletter-col { grid-column: span 3 !important; }
          .ft-desktop-only { display: none !important; }
          .ft-mobile-only  { display: flex !important; }
          .ft-bottom-bar {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: wrap !important;
          }
          .ft-bottom-right {
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
          }
        }

        /* ── MOBILE (≤ 640px): single column ── */
        @media (max-width: 640px) {
          .ft-main-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 32px !important;
          }
          .ft-desktop-only { display: none !important; }
          .ft-mobile-only  { display: flex !important; }

          .ft-bottom-bar {
            flex-direction: column !important;
            align-items: center !important;
            gap: 14px !important;
            text-align: center !important;
          }
          .ft-legal-links  { justify-content: center !important; }

          /* Bottom-right stack: currency → copyright → nexasoft */
          .ft-bottom-right {
            flex-direction: column !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .ft-copyright-nexasoft {
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .ft-dot-separator { display: none !important; }

          .ft-social-row { gap: 10px !important; flex-wrap: wrap !important; }
        }
      `}</style>

      <footer style={{
        background: '#faf7f0',
        borderTop: '1px solid rgba(26,18,9,0.07)',
        fontFamily: "'Jost',sans-serif",
        color: '#1a1209'
      }}>

        {/* ───────── MAIN FOOTER CONTENT ───────── */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 48px 40px' }}>
          <div className="ft-main-grid">

            {/* ── COL 1: BRAND / CONTACT / SOCIAL ── */}
            <div className="ft-brand-col">
              <Link href="/" style={{ display: 'inline-block', marginBottom: '24px' }}>
                <Image
                  src="/yellow.webp"
                  alt="Winsor Brand"
                  width={140}
                  height={48}
                  style={{ objectFit: 'contain', height: 'auto' }}
                  priority
                />
              </Link>

              <p style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: '14px',
                color: '#1a1209',
                lineHeight: 1.7,
                marginBottom: '28px',
                maxWidth: '280px'
              }}>
                A trusted luxury timepiece curator since 2022.
              </p>

              {/* Contact Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                <a href="tel:+94771234567" className="ft-a" style={{ fontSize: '13px' }}>
                  +94 77 123 4567
                </a>
                <a href="tel:+94712345678" className="ft-a" style={{ fontSize: '13px' }}>
                  +94 71 234 5678
                </a>
                <a href="mailto:info@happytime.lk" className="ft-a" style={{ fontSize: '13px' }}>
                  info@happytime.lk
                </a>
                <address className="ft-a" style={{
                  fontSize: '13px',
                  fontStyle: 'normal',
                  lineHeight: 1.6
                }}>
                  49A Keyzer Street, Pettah,<br />
                  Colombo, Sri Lanka
                </address>
              </div>

              {/* Social Icons */}
              <div className="ft-social-row" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-social"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: '1px solid rgba(139,105,20,0.3)',
                      color: '#8B6914',
                      background: 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={social.name}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#8B6914';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = '#8B6914';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8B6914';
                      e.currentTarget.style.borderColor = 'rgba(139,105,20,0.3)';
                    }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* ── COL 2: COLLECTIONS ── */}
            <div>
              <h3 style={{
                fontFamily: "'Jost',sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: '#8B6914',
                fontWeight: 600,
                margin: '0 0 24px 0',
                textTransform: 'uppercase'
              }}>
                Collections
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {FOOTER_LINKS.collections.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ft-a"
                    style={{ fontSize: '13px', lineHeight: 1.5 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── COL 3: COMPANY ── */}
            <div>
              <h3 style={{
                fontFamily: "'Jost',sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: '#8B6914',
                fontWeight: 600,
                margin: '0 0 24px 0',
                textTransform: 'uppercase'
              }}>
                Company
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {FOOTER_LINKS.company.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ft-a"
                    style={{ fontSize: '13px', lineHeight: 1.5 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── COL 4: SUPPORT ── */}
            <div>
              <h3 style={{
                fontFamily: "'Jost',sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: '#8B6914',
                fontWeight: 600,
                margin: '0 0 24px 0',
                textTransform: 'uppercase'
              }}>
                Support
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {FOOTER_LINKS.support.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ft-a"
                    style={{ fontSize: '13px', lineHeight: 1.5 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── COL 5: NEWSLETTER ── */}
            <div className="ft-newsletter-col">
              <h3 style={{
                fontFamily: "'Jost',sans-serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: '#8B6914',
                fontWeight: 600,
                margin: '0 0 20px 0',
                textTransform: 'uppercase'
              }}>
                Stay Connected
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'rgba(26,18,9,0.65)',
                marginBottom: '20px',
                lineHeight: 1.6,
                margin: '0 0 20px 0'
              }}>
                Subscribe for exclusive releases, private events, and early access to limited editions.
              </p>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="ft-input"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(26,18,9,0.15)',
                    borderRadius: '4px',
                    background: '#fff',
                    fontFamily: "'Jost',sans-serif",
                    fontSize: '13px',
                    color: '#1a1209',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#8B6914',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: "'Jost',sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6f5410'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8B6914'}
                >
                  {subscribed ? '✓ Subscribed' : 'Subscribe'}
                </button>
              </form>

              {/* Currency Selector – Desktop Only (inside newsletter col) */}
              <div
                className="ft-desktop-only"
                style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(26,18,9,0.07)' }}
              >
                <CurrencySelectorCompact />
              </div>
            </div>

          </div>
        </div>

        {/* ───────── BOTTOM BAR ───────── */}
        <div style={{
          borderTop: '1px solid rgba(26,18,9,0.07)',
          background: 'rgba(26,18,9,0.02)',
          padding: '20px 48px'
        }}>
          <div
            className="ft-bottom-bar"
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            {/* Legal Links */}
            <div
              className="ft-legal-links"
              style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}
            >
              {FOOTER_LINKS.legal.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ft-a"
                  style={{ fontSize: '11px', color: 'rgba(26,18,9,0.5)', letterSpacing: '0.02em' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side: currency (mobile) + copyright + nexasoft */}
            <div
              className="ft-bottom-right"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: 'auto',
                flexShrink: 0
              }}
            >
              {/* Currency – Mobile / Tablet Only */}
              <div className="ft-mobile-only" style={{ alignItems: 'center' }}>
                <CurrencySelectorCompact />
              </div>

              {/* Copyright + Nexasoft – always together */}
              <div
                className="ft-copyright-nexasoft"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}
              >
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(26,18,9,0.55)',
                  letterSpacing: '0.02em',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}>
                  © 2026 Winsor Brand. All Rights Reserved.
                </p>
                <span className="ft-dot-separator" style={{ fontSize: '9px', color: 'rgba(26,18,9,0.3)' }}>•</span>
                <a
                  href="https://nexasoft.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-a"
                  style={{
                    fontSize: '11px',
                    color: '#8B6914',
                    letterSpacing: '0.02em',
                    fontWeight: 500,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Developed with precision by Nexasoft
                </a>
              </div>
            </div>
          </div>
        </div>

      </footer>
    </>
  );
}