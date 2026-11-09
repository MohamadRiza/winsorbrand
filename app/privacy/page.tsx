// app/privacy/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#FAF7F0';
const MUTED = 'rgba(26,18,9,0.65)';
const BORDER = 'rgba(184, 142, 60, 0.22)';
const CARD_BG = '#FAF7F0';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'introduction',
        'collection',
        'usage',
        'sharing',
        'security',
        'retention',
        'rights',
        'cookies',
        'contact',
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

        /* ── Contact Details Grid ── */
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
          <Link href="/collections">Collections</Link>
          <span>/</span>
          <span>Privacy Policy</span>
        </nav>

        {/* Hero Header */}
        <header className="legal-hero">
          <div className="legal-tag-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Patron Confidentiality & Data Charter
          </div>
          <h1 className="legal-hero-title">Privacy Policy</h1>
          <p className="legal-hero-subtitle">
            Our comprehensive data protection charter ensures that your personal information, timepiece acquisitions, and patron profile remain completely confidential.
          </p>
          <div className="legal-meta-pills">
            <span>Policy Reference: WB-PRIV-2026</span>
            <span>•</span>
            <span>Effective: August 2026</span>
            <span>•</span>
            <span>Global GDPR & Data Protection Compliance</span>
          </div>
        </header>

        {/* Content Layout */}
        <div className="legal-layout-grid">
          {/* Sticky Sidebar */}
          <aside className="legal-sidebar">
            <div className="sidebar-title">Privacy Index</div>
            <button
              onClick={() => scrollToSection('introduction')}
              className={`sidebar-nav-btn ${activeSection === 'introduction' ? 'active' : ''}`}
            >
              1. Introduction & Scope
            </button>
            <button
              onClick={() => scrollToSection('collection')}
              className={`sidebar-nav-btn ${activeSection === 'collection' ? 'active' : ''}`}
            >
              2. Information We Collect
            </button>
            <button
              onClick={() => scrollToSection('usage')}
              className={`sidebar-nav-btn ${activeSection === 'usage' ? 'active' : ''}`}
            >
              3. Purpose of Processing
            </button>
            <button
              onClick={() => scrollToSection('sharing')}
              className={`sidebar-nav-btn ${activeSection === 'sharing' ? 'active' : ''}`}
            >
              4. Sharing & Disclosure
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className={`sidebar-nav-btn ${activeSection === 'security' ? 'active' : ''}`}
            >
              5. Security & Encryption
            </button>
            <button
              onClick={() => scrollToSection('retention')}
              className={`sidebar-nav-btn ${activeSection === 'retention' ? 'active' : ''}`}
            >
              6. Data Retention
            </button>
            <button
              onClick={() => scrollToSection('rights')}
              className={`sidebar-nav-btn ${activeSection === 'rights' ? 'active' : ''}`}
            >
              7. Your Privacy Rights
            </button>
            <button
              onClick={() => scrollToSection('cookies')}
              className={`sidebar-nav-btn ${activeSection === 'cookies' ? 'active' : ''}`}
            >
              8. Cookies & Telemetry
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className={`sidebar-nav-btn ${activeSection === 'contact' ? 'active' : ''}`}
            >
              9. Compliance Office
            </button>

            <div className="sidebar-concierge-card">
              <div className="sidebar-concierge-title">Data Inquiries?</div>
              <p className="sidebar-concierge-text">
                Submit a data access, correction, or account deletion request to our compliance officer.
              </p>
              <Link href="/customer-care" className="sidebar-concierge-btn">
                Contact Office
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="legal-main-content">
            {/* 1. Introduction */}
            <section id="introduction" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <h2 className="legal-section-title">1. Introduction & Scope</h2>
              </div>
              <p className="legal-paragraph">
                Welcome to <strong>Winsor Brand</strong> ("Winsor", "we", "us", or "our"). We hold the privacy and trust of our patrons in the highest regard. This Privacy Policy details how our luxury watch brand collects, uses, safeguards, and manages personal data when you interact with our digital boutique, reserve timepieces, register an international warranty, or visit authorized showroom locations.
              </p>
              <div className="legal-callout">
                <strong>Confidentiality Guarantee:</strong> We apply bank-grade encryption protocols and strict internal governance to ensure that your personal records and collector histories remain secure and private at all times.
              </div>
            </section>

            {/* 2. Collection */}
            <section id="collection" className="legal-section-card">
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
                <h2 className="legal-section-title">2. Information We Collect</h2>
              </div>
              <p className="legal-paragraph">
                In order to provide our patrons with bespoke timepiece services and white-glove delivery, we collect the following categories of data:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Patron Profile & Identity Data:</strong> Full name, email address, direct phone number, and single-sign-on credentials securely synchronized via Clerk.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Order & Delivery Logistics:</strong> Delivery destination address, billing contact details, gift packaging messages, and courier tracking identifiers.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Payment Transaction Logs:</strong> Merchant settlement references, timestamps, and verification proofs. Raw credit/debit card numbers are tokenized by PCI-DSS Level 1 payment processors; Winsor Brand does not store credit card numbers on its servers.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Timepiece Ownership Records:</strong> Serial numbers, reference model numbers, 1-Year International Warranty registrations, and boutique service histories.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Technical & Browsing Telemetry:</strong> Device identifiers, browser type, regional location, currency preference, and interaction analytics.
                  </span>
                </li>
              </ul>
            </section>

            {/* 3. Usage */}
            <section id="usage" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h2 className="legal-section-title">3. Purpose & Legal Basis of Processing</h2>
              </div>
              <p className="legal-paragraph">
                We process your information strictly for legitimate commercial, operational, and fulfillment requirements:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Timepiece Fulfillment:</strong> Verifying acquisitions, assembling custom box sets, and dispatching orders via insured luxury courier.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Patron Portal Management:</strong> Maintaining your Patron account, computing loyalty status, saving wishlist selections, and managing saved delivery addresses.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Warranty Registry:</strong> Validating watch authenticity and maintaining service records under our 1-Year International Guarantee.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Client Concierge Relations:</strong> Assisting with bespoke order inquiries, transit status updates, and authorized boutique fittings.</span>
                </li>
              </ul>
            </section>

            {/* 4. Sharing */}
            <section id="sharing" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </div>
                <h2 className="legal-section-title">4. Data Sharing & Third-Party Disclosure</h2>
              </div>
              <p className="legal-paragraph">
                <strong>Winsor Brand does not sell, rent, or monetize your personal data.</strong> Information is shared exclusively with vetted operational service providers bound by strict confidentiality agreements:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Authentication:</strong> Clerk handles end-to-end user identity verification and multi-factor authentication.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Payment Gateways:</strong> Authorized acquiring banks and payment gateways (e.g., PayHere, Stripe) for secure checkout processing.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Logistics Partners:</strong> Certified luxury freight and express couriers to fulfill delivery and obtain signature on delivery.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Cloud Infrastructure:</strong> MongoDB Atlas encrypted cloud database clusters with automated geo-replicated backups.</span>
                </li>
              </ul>
            </section>

            {/* 5. Security */}
            <section id="security" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="legal-section-title">5. Security & Encryption Protocols</h2>
              </div>
              <p className="legal-paragraph">
                We implement comprehensive physical, electronic, and procedural safeguards:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>256-Bit SSL/TLS Encryption:</strong> All communications between your browser and our infrastructure are encrypted in transit.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Role-Based Access Control:</strong> Strict administrative permission boundaries ensuring only authorized personnel have access to fulfillment records.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Encrypted Database Storage:</strong> All database volumes utilize AES-256 encryption at rest.</span>
                </li>
              </ul>
            </section>

            {/* 6. Retention */}
            <section id="retention" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h2 className="legal-section-title">6. Data Retention & Archival</h2>
              </div>
              <p className="legal-paragraph">
                Personal records are retained only for as long as required to maintain your active timepiece registry and fulfill statutory requirements:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Patron Profiles & Warranties:</strong> Retained for the lifetime of your active profile to guarantee perpetual timepiece support.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Tax & Commercial Records:</strong> Maintained for up to 7 years in compliance with international commercial accounting legislation.</span>
                </li>
              </ul>
            </section>

            {/* 7. Rights */}
            <section id="rights" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7.5" r="4" />
                    <polyline points="17 11 19 13 23 9" />
                  </svg>
                </div>
                <h2 className="legal-section-title">7. Your Privacy Rights</h2>
              </div>
              <p className="legal-paragraph">
                You retain statutory rights over your personal information:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Right to Access & Rectify:</strong> You can view and edit your profile, saved addresses, and preferences at any time in your <Link href="/profile" style={{ color: GOLD, textDecoration: 'underline' }}>Patron Dashboard</Link>.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Right to Erasure:</strong> You may submit an account and data erasure request by contacting our compliance office.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Marketing Opt-Out:</strong> Unsubscribe from marketing dispatches with a single click at the bottom of any email.</span>
                </li>
              </ul>
            </section>

            {/* 8. Cookies */}
            <section id="cookies" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <h2 className="legal-section-title">8. Cookies & Local Storage</h2>
              </div>
              <p className="legal-paragraph">
                We use cookies and browser storage strictly to preserve cart contents, currency selections, and session security. For complete details on managing cookie preferences, consult our <Link href="/cookies" style={{ color: GOLD, textDecoration: 'underline' }}>Cookie Policy</Link>.
              </p>
            </section>

            {/* 9. Contact */}
            <section id="contact" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h2 className="legal-section-title">9. Compliance & Data Protection Office</h2>
              </div>
              <p className="legal-paragraph">
                For questions, concerns, or data rights requests, contact our Compliance Office:
              </p>

              <div className="concierge-details-grid">
                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Legal Inquiries Email</span>
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
                  <span className="concierge-detail-label">Response Timeframe</span>
                  <div className="concierge-detail-val">
                    Within 30 Calendar Days<br />
                    Formal Written Resolution
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
