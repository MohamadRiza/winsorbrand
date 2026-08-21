// app/return/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#FAF7F0';
const MUTED = 'rgba(26,18,9,0.65)';
const BORDER = 'rgba(184, 142, 60, 0.22)';
const CARD_BG = '#FAF7F0';

export default function ReturnPolicyPage() {
  const [activeSection, setActiveSection] = useState('guarantee');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'guarantee',
        'eligibility',
        'non-returnable',
        'process',
        'inspection',
        'refunds',
        'exchanges',
        'transit',
        'concierge',
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

        /* ── Step Grid ── */
        .step-timeline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
          margin: 24px 0 10px;
        }

        .step-item-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(184, 142, 60, 0.2);
          border-radius: 12px;
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .step-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.08);
        }

        .step-badge-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: ${GOLD};
          line-height: 1;
        }

        .step-card-heading {
          font-size: 13.5px;
          font-weight: 600;
          color: ${INK};
          margin: 0;
          letter-spacing: 0.01em;
        }

        .step-card-desc {
          font-size: 12px;
          color: ${MUTED};
          line-height: 1.6;
          margin: 0;
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
          <span>Return Policy</span>
        </nav>

        {/* Hero Header */}
        <header className="legal-hero">
          <div className="legal-tag-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Winsor Brand Quality Guarantee
          </div>
          <h1 className="legal-hero-title">Return & Refund Policy</h1>
          <p className="legal-hero-subtitle">
            Our 14-day boutique return and exchange guarantee ensures every handcrafted timepiece acquisition delivers uncompromising satisfaction.
          </p>
          <div className="legal-meta-pills">
            <span>Official Policy Reference: WB-RET-2026</span>
            <span>•</span>
            <span>Effective: August 2026</span>
            <span>•</span>
            <span>Worldwide Coverage</span>
          </div>
        </header>

        {/* Content Layout */}
        <div className="legal-layout-grid">
          {/* Sticky Sidebar Navigation */}
          <aside className="legal-sidebar">
            <div className="sidebar-title">Policy Index</div>
            <button
              onClick={() => scrollToSection('guarantee')}
              className={`sidebar-nav-btn ${activeSection === 'guarantee' ? 'active' : ''}`}
            >
              1. 14-Day Guarantee
            </button>
            <button
              onClick={() => scrollToSection('eligibility')}
              className={`sidebar-nav-btn ${activeSection === 'eligibility' ? 'active' : ''}`}
            >
              2. Eligibility Criteria
            </button>
            <button
              onClick={() => scrollToSection('non-returnable')}
              className={`sidebar-nav-btn ${activeSection === 'non-returnable' ? 'active' : ''}`}
            >
              3. Non-Returnable Items
            </button>
            <button
              onClick={() => scrollToSection('process')}
              className={`sidebar-nav-btn ${activeSection === 'process' ? 'active' : ''}`}
            >
              4. Return Step-by-Step
            </button>
            <button
              onClick={() => scrollToSection('inspection')}
              className={`sidebar-nav-btn ${activeSection === 'inspection' ? 'active' : ''}`}
            >
              5. Horology Inspection
            </button>
            <button
              onClick={() => scrollToSection('refunds')}
              className={`sidebar-nav-btn ${activeSection === 'refunds' ? 'active' : ''}`}
            >
              6. Refunds & Reimbursement
            </button>
            <button
              onClick={() => scrollToSection('exchanges')}
              className={`sidebar-nav-btn ${activeSection === 'exchanges' ? 'active' : ''}`}
            >
              7. Model Exchanges
            </button>
            <button
              onClick={() => scrollToSection('transit')}
              className={`sidebar-nav-btn ${activeSection === 'transit' ? 'active' : ''}`}
            >
              8. Transit Discrepancies
            </button>
            <button
              onClick={() => scrollToSection('concierge')}
              className={`sidebar-nav-btn ${activeSection === 'concierge' ? 'active' : ''}`}
            >
              9. Concierge Assistance
            </button>

            <div className="sidebar-concierge-card">
              <div className="sidebar-concierge-title">Need Immediate Help?</div>
              <p className="sidebar-concierge-text">
                Our client relations specialists can initiate your return or arrange a courier pickup.
              </p>
              <Link href="/customer-care" className="sidebar-concierge-btn">
                Contact Concierge
              </Link>
            </div>
          </aside>

          {/* Main Legal Sections */}
          <main className="legal-main-content">
            {/* Section 1: Guarantee */}
            <section id="guarantee" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h2 className="legal-section-title">1. 14-Day Boutique Return Guarantee</h2>
              </div>
              <p className="legal-paragraph">
                At <strong>Winsor Brand</strong>, we are committed to delivering horological perfection in every timepiece we assemble and finish. We understand that acquiring a luxury watch is an intimate decision. If your timepiece does not meet your personal preferences or expectations, you may return or exchange it within <strong>14 calendar days</strong> from the official delivery date.
              </p>
              <div className="legal-callout">
                <strong>Quality Assurance Commitment:</strong> Every returned timepiece is handled with white-glove care and undergoes a comprehensive inspection at our regional atelier by certified horologists before a refund or exchange is authorized.
              </div>
            </section>

            {/* Section 2: Eligibility */}
            <section id="eligibility" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="legal-section-title">2. Return Eligibility Criteria</h2>
              </div>
              <p className="legal-paragraph">
                To qualify for an authorized return, exchange, or refund, your timepiece must strictly fulfill the following conditions:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Pristine, Unworn Condition:</strong> The timepiece must be completely unworn, free from any surface micro-scratches, scuffs, strap crease lines, or link pin alterations.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Protective Seals & Stickers Intact:</strong> All factory protective plastics on the front sapphire crystal, exhibition caseback, bracelet links, and crown guard must remain untampered with.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Complete Presentation Suite:</strong> The watch must be accompanied by its original handcrafted outer box, inner presentation case, leather travel pouch, user instruction booklet, warranty card, and certificate of authenticity.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>All Sizing Components:</strong> If the stainless steel or titanium bracelet was adjusted prior to dispatch, all removed links and pins must be returned in their original packaging pouch.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: Non-Returnable */}
            <section id="non-returnable" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h2 className="legal-section-title">3. Non-Returnable & Final Sale Items</h2>
              </div>
              <p className="legal-paragraph">
                The following product categories and bespoke services cannot be returned or refunded:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Bespoke Custom Engravings:</strong> Timepieces that have undergone personalized laser caseback engraving, custom dial initials, or monogramming.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Special Commission Tourbillons:</strong> Numbered collectors’ editions or specially commissioned unique pieces designated as final sale upon order confirmation.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Worn or Modified Watches:</strong> Any timepiece that exhibits signs of wear, perfume/lotion absorption into leather straps, or internal movement work performed by non-authorized technicians.
                  </span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>
                    <strong>Digital & Physical Gift Cards:</strong> Winsor gift vouchers and promotional credits are non-refundable and non-redeemable for physical cash.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 4: Process */}
            <section id="process" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <h2 className="legal-section-title">4. Step-by-Step Return Process</h2>
              </div>
              <p className="legal-paragraph">
                To initiate an insured return, please follow these four simple steps:
              </p>

              <div className="step-timeline-grid">
                <div className="step-item-card">
                  <div className="step-badge-num">01</div>
                  <h3 className="step-card-heading">Submit Request</h3>
                  <p className="step-card-desc">
                    Log in to your <Link href="/profile" style={{ color: GOLD, textDecoration: 'underline' }}>Patron Dashboard</Link> or email our Concierge at <strong>support@winsorbrand.com</strong> with your Order Reference ID.
                  </p>
                </div>

                <div className="step-item-card">
                  <div className="step-badge-num">02</div>
                  <h3 className="step-card-heading">Receive RMA Label</h3>
                  <p className="step-card-desc">
                    Our team will issue a Return Merchandise Authorization (RMA) along with a pre-paid, fully insured luxury courier shipping label.
                  </p>
                </div>

                <div className="step-item-card">
                  <div className="step-badge-num">03</div>
                  <h3 className="step-card-heading">Secure Packaging</h3>
                  <p className="step-card-desc">
                    Place the timepiece inside its presentation case and package within a sturdy outer box with protective cushioning.
                  </p>
                </div>

                <div className="step-item-card">
                  <div className="step-badge-num">04</div>
                  <h3 className="step-card-heading">Insured Dispatch</h3>
                  <p className="step-card-desc">
                    Hand over the sealed parcel to the scheduled courier partner. Retain the tracking handover slip for real-time transit insurance tracking.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Inspection */}
            <section id="inspection" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h2 className="legal-section-title">5. Horology Quality Inspection</h2>
              </div>
              <p className="legal-paragraph">
                Upon delivery at our distribution facility, your returned timepiece is inspected within <strong>48 to 72 business hours</strong>:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Optical & Surface Inspection:</strong> Evaluation under high magnification to confirm zero signs of scratches, dents, or strap wear.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Timegrapher Mechanical Audit:</strong> Precision calibration testing of the mechanical automatic movement to ensure baseline factory amplitude and rate accuracy.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Serial Matching & Authentication:</strong> Verification of case serial number matching against the warranty card and original order registry.</span>
                </li>
              </ul>
            </section>

            {/* Section 6: Refunds */}
            <section id="refunds" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h2 className="legal-section-title">6. Refunds & Reimbursement Timelines</h2>
              </div>
              <p className="legal-paragraph">
                Once the returned timepiece successfully passes horological inspection:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Payment Settlement:</strong> Refunds are credited directly back to the original method of payment (Visa, Mastercard, American Express, Apple Pay, Google Pay, or direct Bank Wire).</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Settlement Window:</strong> Financial reimbursement is processed within <strong>5 to 7 business days</strong> following inspection approval.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span><strong>Zero Restocking Fees:</strong> Winsor Brand does not charge restocking fees on approved returns meeting all condition standards.</span>
                </li>
              </ul>
            </section>

            {/* Section 7: Exchanges */}
            <section id="exchanges" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
                <h2 className="legal-section-title">7. Model & Dial Color Exchanges</h2>
              </div>
              <p className="legal-paragraph">
                If you prefer an alternative watch dial color, strap material, or different model family, our concierge team can organize an exchange:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Exchanges for products of equal value are dispatched with complimentary priority shipping immediately after the returned item passes inspection.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>For models of different value, any price difference will be invoiced or refunded prior to shipment of the replacement timepiece.</span>
                </li>
              </ul>
            </section>

            {/* Section 8: Transit Discrepancies */}
            <section id="transit" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="legal-section-title">8. Transit Discrepancies & Courier Damages</h2>
              </div>
              <p className="legal-paragraph">
                In the unlikely event that your timepiece package arrives with visible transit box damage or missing accessories:
              </p>
              <ul className="legal-list">
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Please notify our Client Care team within <strong>48 hours</strong> of courier handover, attaching clear photographs of the packaging condition.</span>
                </li>
                <li className="legal-list-item">
                  <span className="legal-bullet" />
                  <span>Winsor Brand will arrange immediate priority courier recovery and dispatch a replacement timepiece without delay.</span>
                </li>
              </ul>
            </section>

            {/* Section 9: Concierge Assistance */}
            <section id="concierge" className="legal-section-card">
              <div className="legal-section-header">
                <div className="legal-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h2 className="legal-section-title">9. Concierge & Boutique Assistance</h2>
              </div>
              <p className="legal-paragraph">
                Our client relations specialists are at your disposal to facilitate an effortless return or model exchange:
              </p>

              <div className="concierge-details-grid">
                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Client Support Emails</span>
                  <div className="concierge-detail-val">
                    support@winsorbrand.com<br />
                    winsorwatches@gmail.com
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Direct Phone Lines</span>
                  <div className="concierge-detail-val">
                    +94 77 071 6212<br />
                    +94 77 877 8555
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Boutique Showroom</span>
                  <div className="concierge-detail-val">
                    Kandy City Centre (Level 3)<br />
                    +94 77 977 9666
                  </div>
                </div>

                <div className="concierge-detail-item">
                  <span className="concierge-detail-label">Service Hours</span>
                  <div className="concierge-detail-val">
                    Monday – Saturday<br />
                    9:00 AM – 7:00 PM (IST)
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
