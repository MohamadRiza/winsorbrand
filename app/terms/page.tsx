// app/terms/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#FAF7F0';
const MUTED = 'rgba(26,18,9,0.65)';
const BORDER = 'rgba(184, 142, 60, 0.22)';
const CARD_BG = '#FAF7F0';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'acceptance',
        'orders',
        'pricing',
        'shipping',
        'returns',
        'warranty',
        'ip',
        'conduct',
        'liability',
        'law',
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

        /* ── Breadcrumb ── */
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

        /* ── Hero Header ── */
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

        /* ── Grid Layout ── */
        .legal-layout-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 48px;
          align-items: start;
        }

        /* ── Sticky Sidebar ── */
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

        /* ── Main Content Area ── */
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

        .legal-callout {
          background: rgba(139, 105, 20, 0.04);
          border-left: 3px solid ${GOLD};
          border-top: 1px solid rgba(184, 142, 60, 0.15);
          border-right: 1px solid rgba(184, 142, 60, 0.15);
          border-bottom: 1px solid rgba(184, 142, 60, 0.15);
          border-radius: 0 12px 12px 0;
          padding: 18px 22px;
          margin: 20px 0;
          font-size: 13.5px;
          line-height: 1.7;
          color: ${INK};
        }

        /* ── Contact Info Box ── */
        .concierge-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        .concierge-detail-item {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(184, 142, 60, 0.2);
          border-radius: 10px;
          padding: 16px 18px;
        }

        .concierge-detail-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${GOLD};
          font-weight: 700;
          margin-bottom: 6px;
          display: block;
        }

        .concierge-detail-val {
          font-size: 13px;
          color: ${INK};
          font-weight: 500;
          line-height: 1.5;
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
          <span>Terms & Conditions</span>
        </nav>

        {/* Hero Header */}
        <header className="legal-hero">
          <div className="legal-tag-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Commercial Governance & Sales Agreement
          </div>
          <h1 className="legal-hero-title">Terms & Conditions</h1>
          <p className="legal-hero-subtitle">
            These terms govern the reservation, acquisition, transit, and ownership of Winsor Brand luxury timepieces and bespoke horology services.
          </p>
          <div className="legal-meta-pills">
            <span>Charter Reference: WB-TOS-2026</span>
            <span>•</span>
            <span>Effective: August 2026</span>
            <span>•</span>
            <span>Commercial Sales Protocol</span>
          </div>
        </header>

        {/* Content Layout */}
        <div className="legal-layout-grid">
          {/* Sticky Sidebar */}
          <aside className="legal-sidebar">
            <div className="sidebar-title">Terms Index</div>
            <button
              onClick={() => scrollToSection('acceptance')}
              className={`sidebar-nav-btn ${activeSection === 'acceptance' ? 'active' : ''}`}
            >
              1. Acceptance of Terms
            </button>
            <button
              onClick={() => scrollToSection('orders')}
              className={`sidebar-nav-btn ${activeSection === 'orders' ? 'active' : ''}`}
            >
              2. Orders & Allocations
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className={`sidebar-nav-btn ${activeSection === 'pricing' ? 'active' : ''}`}
            >
              3. Pricing & Currencies
            </button>
            <button
              onClick={() => scrollToSection('shipping')}
              className={`sidebar-nav-btn ${activeSection === 'shipping' ? 'active' : ''}`}
            >
              4. Shipping & Transfer
            </button>
            <button
              onClick={() => scrollToSection('returns')}
              className={`sidebar-nav-btn ${activeSection === 'returns' ? 'active' : ''}`}
            >
              5. 14-Day Return Terms
            </button>
            <button
              onClick={() => scrollToSection('warranty')}
              className={`sidebar-nav-btn ${activeSection === 'warranty' ? 'active' : ''}`}
            >
              6. 1-Year Warranty
            </button>
            <button
              onClick={() => scrollToSection('ip')}
              className={`sidebar-nav-btn ${activeSection === 'ip' ? 'active' : ''}`}
            >
              7. Intellectual Property
            </button>
            <button
              onClick={() => scrollToSection('conduct')}
              className={`sidebar-nav-btn ${activeSection === 'conduct' ? 'active' : ''}`}
            >
              8. Patron Conduct
            </button>
            <button
              onClick={() => scrollToSection('liability')}
              className={`sidebar-nav-btn ${activeSection === 'liability' ? 'active' : ''}`}
            >
              9. Limitations of Liability
            </button>
            <button
              onClick={() => scrollToSection('law')}
              className={`sidebar-nav-btn ${activeSection === 'law' ? 'active' : ''}`}
            >
              10. Governing Law
            </button>

            <div className="sidebar-concierge-card">
              <div className="sidebar-concierge-title">Corporate Counsel</div>
              <p className="sidebar-concierge-text">
                For commercial distribution or legal compliance inquiries, reach our counsel.
              </p>
              <Link href="/customer-care" className="sidebar-concierge-btn">
                Inquire Counsel
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="legal-main-content">
            {/* 1. Acceptance */}
            <section id="acceptance" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h2 className="legal-section-title">1. Acceptance of Terms & Commercial Agreement</h2>
              </div>
              <p className="legal-paragraph">
                These Terms and Conditions constitute a legally binding agreement between you ("Patron", "Client", or "Purchaser") and <strong>Winsor Brand</strong> ("Winsor", "Maison", "we", "us", or "our"). By browsing our catalog, reserving timepieces, or making acquisitions through our online boutique, authorized retail partners, or telephone concierge, you acknowledge having read, understood, and agreed to be governed by these terms.
              </p>
              <div className="legal-callout">
                If you do not accept these terms in their entirety, you should immediately discontinue the use of our digital platform and services.
              </div>
            </section>

            {/* 2. Orders */}
            <section id="orders" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <h2 className="legal-section-title">2. Timepiece Orders, Availability & Allocations</h2>
              </div>
              <p className="legal-paragraph">
                Every timepiece offered by Winsor Brand is produced in calibrated batch quantities with handcrafted assembly:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Limited Edition Allocations:</strong> Placing a timepiece in your shopping cart does not guarantee inventory reservation. Allocation is finalized only upon payment confirmation.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Order Acceptance:</strong> An automated confirmation email acknowledges receipt of your purchase. The sales contract takes effect once the timepiece is officially dispatched with tracking reference.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Right of Refusal:</strong> We reserve the right to cancel orders suspected of unauthorized bulk reselling, automated bot exploitation, or inaccurate catalog pricing.</span>
                </li>
              </ul>
            </section>

            {/* 3. Pricing */}
            <section id="pricing" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h2 className="legal-section-title">3. Pricing, Multi-Currency Display & Duties</h2>
              </div>
              <p className="legal-paragraph">
                Pricing across our global catalog is transparent and up to date:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Currency Conversion:</strong> Prices may be viewed in multiple global currencies (LKR, USD, AED, EUR, GBP) using calibrated market exchange rates. The settlement amount is determined by the final checkout currency.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Taxes & Import Tariffs:</strong> Domestic deliveries include applicable local VAT. For cross-border shipments, any import tariffs or regional border clearances remain the responsibility of the purchaser.</span>
                </li>
              </ul>
            </section>

            {/* 4. Shipping */}
            <section id="shipping" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <h2 className="legal-section-title">4. Luxury Transit, Delivery & Transfer of Title</h2>
              </div>
              <p className="legal-paragraph">
                All timepiece parcels are dispatched in tamper-evident security boxes via insured courier partners:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Signature Verification:</strong> A physical signature is mandatory upon delivery to confirm secure custody handover.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Transfer of Risk:</strong> Title and risk of loss transfer to the patron upon physical handover and signature at the designated delivery address.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Tracking Status:</strong> Live transit milestones can be monitored 24/7 via the <Link href="/orders/track" style={{ color: GOLD, textDecoration: 'underline' }}>Order Tracking Portal</Link>.</span>
                </li>
              </ul>
            </section>

            {/* 5. Returns */}
            <section id="returns" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </div>
                <h2 className="legal-section-title">5. 14-Day Return & Exchange Conditions</h2>
              </div>
              <p className="legal-paragraph">
                Purchasers enjoy our 14-day boutique guarantee. To be eligible for a return or exchange:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>The timepiece must be completely unworn, with all protective films, seals, boxes, and warranty cards intact.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Custom engravings and bespoke numbered editions are final sale. Review our full criteria on our dedicated <Link href="/return" style={{ color: GOLD, textDecoration: 'underline' }}>Return & Refund Policy Page</Link>.</span>
                </li>
              </ul>
            </section>

            {/* 6. Warranty */}
            <section id="warranty" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2 className="legal-section-title">6. 1-Year International Mechanical Warranty</h2>
              </div>
              <p className="legal-paragraph">
                Every authentic Winsor timepiece is backed by our 1-Year International Guarantee:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Warranty Scope:</strong> Covers internal mechanical movement defects, balance wheel calibration, and factory assembly defects.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Exclusions:</strong> Excludes cosmetic wear, crystal scratches, battery exhaustion, water ingress caused by an unscrewed crown, or repairs conducted by non-authorized watchmakers. Full terms are outlined in our <Link href="/warranty" style={{ color: GOLD, textDecoration: 'underline' }}>Warranty & Care Guide</Link>.</span>
                </li>
              </ul>
            </section>

            {/* 7. IP */}
            <section id="ip" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
                  </svg>
                </div>
                <h2 className="legal-section-title">7. Intellectual Property & Brand Assets</h2>
              </div>
              <p className="legal-paragraph">
                The trademarks, watch case silhouettes, bezel designs, dial artwork, photography, typography, and website code are the exclusive intellectual property of <strong>Winsor Brand</strong>.
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>No part of this portal may be copied, scraped, reproduced, or exploited commercially without prior written consent from Winsor Brand executive leadership.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Counterfeiting or selling non-authentic replicas under the Winsor Brand trademark is strictly prohibited and subject to international prosecution.</span>
                </li>
              </ul>
            </section>

            {/* 8. Conduct */}
            <section id="conduct" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h2 className="legal-section-title">8. Patron Conduct & Platform Integrity</h2>
              </div>
              <p className="legal-paragraph">
                Patrons agree to maintain account security and use the platform lawfully:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Patrons are solely responsible for maintaining the confidentiality of their login credentials and Patron Portal sessions.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Attempting to inject malicious code, overload server infrastructure, or manipulate promotional coupon discounts will result in permanent account termination and legal reporting.</span>
                </li>
              </ul>
            </section>

            {/* 9. Liability */}
            <section id="liability" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  </svg>
                </div>
                <h2 className="legal-section-title">9. Limitation of Liability</h2>
              </div>
              <p className="legal-paragraph">
                To the fullest extent permitted by law, Winsor Brand, its directors, horologists, and logistics partners shall not be held liable for indirect, punitive, or consequential damages resulting from website downtime or third-party courier transit delays.
              </p>
              <p className="legal-paragraph">
                In all events, our total aggregate liability arising out of any timepiece acquisition shall not exceed the total purchase price actually paid by the patron for the specific product in question.
              </p>
            </section>

            {/* 10. Law */}
            <section id="law" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 8 8 12 12 16 16 12 12 8" />
                  </svg>
                </div>
                <h2 className="legal-section-title">10. Governing Law & Dispute Resolution</h2>
              </div>
              <p className="legal-paragraph">
                These Terms and Conditions shall be governed by and interpreted under the commercial laws of Sri Lanka and the United Arab Emirates.
              </p>

              <div className="concierge-details-grid">
                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Legal Inquiries</span>
                  <div className="concierge-detail-val">
                    support@winsorbrand.com<br />
                    winsorwatches@gmail.com
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Corporate Contact</span>
                  <div className="concierge-detail-val">
                    +94 77 071 6212<br />
                    +94 77 877 8555
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Showroom Location</span>
                  <div className="concierge-detail-val">
                    Kandy City Centre (Level 3)<br />
                    Sri Lanka
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Resolution Procedure</span>
                  <div className="concierge-detail-val">
                    Good-faith Concierge Review<br />
                    Pre-arbitration Mediation
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
