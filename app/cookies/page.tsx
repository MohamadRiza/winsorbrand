// app/cookies/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#FAF7F0';
const MUTED = 'rgba(26,18,9,0.65)';
const BORDER = 'rgba(184, 142, 60, 0.22)';
const CARD_BG = '#FAF7F0';

export default function CookiePolicyPage() {
  const [activeSection, setActiveSection] = useState('what-are-cookies');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'what-are-cookies',
        'how-we-use-them',
        'types-of-cookies',
        'managing-cookies',
        'policy-updates',
      ];
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: CREAM, color: INK, minHeight: '100vh', padding: '130px 24px 90px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600;700&display=swap');

        .legal-page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .legal-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: ${MUTED};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .legal-breadcrumb a {
          color: ${MUTED};
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .legal-breadcrumb a:hover {
          color: ${GOLD};
        }
        .legal-breadcrumb span {
          color: ${GOLD};
          font-weight: 500;
        }

        .legal-hero {
          text-align: center;
          padding: 30px 20px 48px;
          margin-bottom: 40px;
          border-bottom: 1px solid rgba(184, 142, 60, 0.15);
          position: relative;
        }

        .legal-tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid rgba(184, 142, 60, 0.3);
          border-radius: 30px;
          padding: 6px 18px;
          font-size: 10.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${GOLD};
          font-weight: 600;
          margin-bottom: 16px;
        }

        .legal-hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(34px, 5.5vw, 52px);
          font-weight: 400;
          letter-spacing: 0.03em;
          color: ${INK};
          margin: 0 0 14px;
          line-height: 1.15;
          text-transform: uppercase;
        }

        .legal-hero-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13.5px, 1.8vw, 16px);
          color: ${MUTED};
          max-width: 680px;
          margin: 0 auto 20px;
          line-height: 1.6;
          font-weight: 300;
        }

        .legal-meta-pills {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 11.5px;
          color: rgba(26,18,9,0.5);
          letter-spacing: 0.05em;
        }

        .legal-layout-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 48px;
          align-items: start;
        }

        .legal-sidebar {
          position: sticky;
          top: 110px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: ${CARD_BG};
          border: 1.5px solid ${BORDER};
          border-radius: 16px;
          padding: 24px 20px;
          box-shadow: 0 8px 32px rgba(26, 18, 9, 0.03);
        }

        .sidebar-title {
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${GOLD};
          font-weight: 700;
          padding-bottom: 12px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(184, 142, 60, 0.15);
        }

        .sidebar-nav-btn {
          background: none;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          text-align: left;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          color: ${MUTED};
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          font-weight: 400;
        }

        .sidebar-nav-btn:hover {
          color: ${GOLD};
          background: rgba(139, 105, 20, 0.05);
          transform: translateX(3px);
        }

        .sidebar-nav-btn.active {
          color: #fff;
          background: #1a1209;
          font-weight: 500;
        }

        .sidebar-concierge-card {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(184, 142, 60, 0.15);
        }

        .sidebar-concierge-title {
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${GOLD};
          font-weight: 700;
          margin-bottom: 6px;
        }

        .sidebar-concierge-text {
          font-size: 12px;
          color: ${MUTED};
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .sidebar-concierge-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px 14px;
          background: #8B6914;
          color: #fff;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .sidebar-concierge-btn:hover {
          background: #6f5410;
          transform: translateY(-1px);
        }

        .legal-main-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .legal-section-card {
          background: ${CARD_BG};
          border: 1.5px solid ${BORDER};
          border-radius: 16px;
          padding: 36px 40px;
          box-shadow: 0 8px 30px rgba(26, 18, 9, 0.03);
          transition: border-color 0.25s ease;
        }
        .legal-section-card:hover {
          border-color: rgba(184, 142, 60, 0.45);
        }

        .legal-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(184, 142, 60, 0.12);
        }

        .legal-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid rgba(184, 142, 60, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${GOLD};
          flex-shrink: 0;
        }

        .legal-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(20px, 3vw, 25px);
          font-weight: 600;
          color: ${INK};
          margin: 0;
          letter-spacing: 0.02em;
        }

        .legal-paragraph {
          font-size: 14.5px;
          line-height: 1.8;
          color: rgba(26, 18, 9, 0.82);
          margin-bottom: 16px;
          font-weight: 300;
        }

        .legal-list {
          list-style: none;
          padding: 0;
          margin: 16px 0 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .legal-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(26, 18, 9, 0.85);
        }

        .legal-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: ${GOLD};
          margin-top: 9px;
          flex-shrink: 0;
        }

        .cookie-table-wrapper {
          overflow-x: auto;
          margin: 20px 0;
          border-radius: 10px;
          border: 1px solid rgba(184, 142, 60, 0.2);
        }

        .cookie-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .cookie-table th {
          background: rgba(139, 105, 20, 0.08);
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          color: ${INK};
          letter-spacing: 0.04em;
          border-bottom: 1.5px solid rgba(184, 142, 60, 0.3);
        }

        .cookie-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(184, 142, 60, 0.12);
          color: rgba(26, 18, 9, 0.8);
          line-height: 1.6;
        }

        .cookie-table code {
          background: rgba(139, 105, 20, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: ${GOLD};
          font-family: monospace;
        }

        @media (max-width: 900px) {
          .legal-layout-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .legal-sidebar {
            display: none;
          }
          .legal-section-card {
            padding: 26px 20px;
          }
        }
      `}</style>

      <div className="legal-page-container">
        {/* Breadcrumb */}
        <nav className="legal-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/collections">Maison</Link>
          <span>/</span>
          <span>Cookie Policy</span>
        </nav>

        {/* Hero Header */}
        <header className="legal-hero">
          <div className="legal-tag-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            Transparent Digital Telemetry
          </div>
          <h1 className="legal-hero-title">Cookie Policy</h1>
          <p className="legal-hero-subtitle">
            This policy outlines how Winsor Brand deploys strictly necessary and preference cookies to preserve your cart, authentication state, and currency settings.
          </p>
          <div className="legal-meta-pills">
            <span>Policy Reference: WB-COOK-2026</span>
            <span>•</span>
            <span>Effective: August 2026</span>
            <span>•</span>
            <span>Complete Cookie Transparency</span>
          </div>
        </header>

        {/* Content Layout */}
        <div className="legal-layout-grid">
          {/* Sticky Sidebar */}
          <aside className="legal-sidebar">
            <div className="sidebar-title">Cookie Index</div>
            <button
              onClick={() => scrollToSection('what-are-cookies')}
              className={`sidebar-nav-btn ${activeSection === 'what-are-cookies' ? 'active' : ''}`}
            >
              1. What Are Cookies
            </button>
            <button
              onClick={() => scrollToSection('how-we-use-them')}
              className={`sidebar-nav-btn ${activeSection === 'how-we-use-them' ? 'active' : ''}`}
            >
              2. How We Deploy Trackers
            </button>
            <button
              onClick={() => scrollToSection('types-of-cookies')}
              className={`sidebar-nav-btn ${activeSection === 'types-of-cookies' ? 'active' : ''}`}
            >
              3. Cookie Classifications
            </button>
            <button
              onClick={() => scrollToSection('managing-cookies')}
              className={`sidebar-nav-btn ${activeSection === 'managing-cookies' ? 'active' : ''}`}
            >
              4. Managing Preferences
            </button>
            <button
              onClick={() => scrollToSection('policy-updates')}
              className={`sidebar-nav-btn ${activeSection === 'policy-updates' ? 'active' : ''}`}
            >
              5. Policy Updates
            </button>

            <div className="sidebar-concierge-card">
              <div className="sidebar-concierge-title">Privacy Protection</div>
              <p className="sidebar-concierge-text">
                Learn how your personal details are safeguarded across all touchpoints.
              </p>
              <Link href="/privacy" className="sidebar-concierge-btn">
                Privacy Policy
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="legal-main-content">
            {/* 1. What Are Cookies */}
            <section id="what-are-cookies" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <h2 className="legal-section-title">1. What Are Cookies & Local Storage</h2>
              </div>
              <p className="legal-paragraph">
                Cookies are small cryptographic text files placed on your browser or device when visiting digital boutiques. They enable the server to recognize your device across visits, remember saved shopping bag timepieces, and preserve your preferred currency exchange rates.
              </p>
            </section>

            {/* 2. How We Deploy */}
            <section id="how-we-use-them" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h2 className="legal-section-title">2. How We Deploy Trackers</h2>
              </div>
              <p className="legal-paragraph">
                At Winsor Brand, cookies are utilized strictly to enhance portal performance and deliver an effortless shopping experience:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Shopping Cart Continuity:</strong> Retaining reserved watch models in your cart across pages and reloads.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Patron Authentication:</strong> Validating Clerk SSO authentication tokens for secure Patron Portal access.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Currency Preferences:</strong> Remembering whether you selected LKR, USD, AED, EUR, or GBP.</span>
                </li>
              </ul>
            </section>

            {/* 3. Classifications */}
            <section id="types-of-cookies" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <h2 className="legal-section-title">3. Cookie Classifications</h2>
              </div>
              
              <div className="cookie-table-wrapper">
                <table className="cookie-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Operational Purpose</th>
                      <th>Typical Keys</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Strictly Necessary</strong></td>
                      <td>Essential for checkout security, SSO session login, and cart state.</td>
                      <td><code>__session</code>, <code>clerk-db-jwt</code>, <code>winsor_cart</code></td>
                    </tr>
                    <tr>
                      <td><strong>Preferences & UI</strong></td>
                      <td>Localizes currency displays, active language, and wishlist persistence.</td>
                      <td><code>winsor_currency</code>, <code>winsor_wishlist</code></td>
                    </tr>
                    <tr>
                      <td><strong>Performance & Speed</strong></td>
                      <td>Anonymous traffic routing metrics to optimize horology image load speeds.</td>
                      <td><code>_ga</code>, <code>_gid</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Managing Preferences */}
            <section id="managing-cookies" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <h2 className="legal-section-title">4. Managing Your Cookie Preferences</h2>
              </div>
              <p className="legal-paragraph">
                You can manage or clear cookies at any time via your browser preferences:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Safari:</strong> Preferences &gt; Privacy &gt; Block all cookies.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Firefox:</strong> Options &gt; Privacy & Security &gt; Enhanced Tracking Protection.</span>
                </li>
              </ul>
            </section>

            {/* 5. Policy Updates */}
            <section id="policy-updates" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </div>
                <h2 className="legal-section-title">5. Updates to This Cookie Policy</h2>
              </div>
              <p className="legal-paragraph">
                We may revise this Cookie Policy periodically to reflect technological adjustments or e-privacy statutory updates. Any updates will be posted on this page with the latest revision date.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
