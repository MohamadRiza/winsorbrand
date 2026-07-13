// app/faq/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// FAQ DATA STRUCTURE
// ─────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'brand', label: 'Maison & Timepieces' },
  { id: 'orders', label: 'Orders & Shipping' },
  { id: 'warranty', label: 'Warranty & Care' },
];

const FAQ_ITEMS = [
  {
    category: 'brand',
    q: 'Where are Winsor timepieces designed and assembled?',
    a: 'Winsor timepieces are conceived by our lead designers in Dubai, UAE, and assembled with Swiss precision components. Each timepiece undergoes rigorous hand-finishing and testing to ensure it meets our heritage quality standards.',
  },
  {
    category: 'brand',
    q: 'What movements are used in Winsor watches?',
    a: 'We use high-grade Swiss automatic and precision mechanical movements selected for their reliability, accuracy, and detailed decoration. Selected limited editions feature our bespoke in-house Tourbillon movements.',
  },
  {
    category: 'brand',
    q: 'Are Winsor watches water-resistant?',
    a: 'Yes, all Winsor watches feature varying degrees of water resistance, typically ranging from 3 ATM (30 meters) for dress watches up to 10 ATM (100 meters) for our sports collection. Please refer to your specific model’s technical manual for precise depth ratings.',
  },
  {
    category: 'orders',
    q: 'How long does shipping and delivery transit take?',
    a: 'We offer secure, priority worldwide courier delivery. Regional deliveries within the UAE take 1-2 business days. International deliveries to Sri Lanka, Saudi Arabia, the US, and Europe generally take 3-5 business days, subject to customs processing.',
  },
  {
    category: 'orders',
    q: 'Can I add custom gifting options to my order?',
    a: 'Absolutely. Winsor offers complimentary premium gift wrapping, personalized cards, and custom greeting notes. You can configure these options per-item directly in your shopping cart before proceeding to checkout.',
  },
  {
    category: 'orders',
    q: 'How can I track the status of my shipment?',
    a: 'Once your timepiece has been dispatched from our distribution hub, you will receive a tracking link via email or SMS. You can also view live status updates directly inside your Patron Dashboard.',
  },
  {
    category: 'warranty',
    q: 'What is covered under the Winsor warranty?',
    a: 'Every authentic Winsor watch comes with a comprehensive mechanical warranty covering manufacturing and internal movement defects. It excludes damage from accidents, unauthorized modifications, water submersion exceeding specifications, or normal wear and tear.',
  },
  {
    category: 'warranty',
    q: 'How do I register my timepiece for warranty?',
    a: 'You can easily register your timepiece by creating a Patron account and adding the timepiece under your order history. This logs your reference number and activates your coverage registry automatically.',
  },
  {
    category: 'warranty',
    q: 'How should I clean and service my automatic watch?',
    a: 'We recommend wiping your watch with a lint-free microfibre cloth. For mechanical automatic movements, a professional servicing is advised every 3 to 5 years at an authorized Winsor service center to preserve lubricating oils and seal integrity.',
  },
];

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#fcfbf8';
const MUTED = 'rgba(26,18,9,0.65)';
const LINE = 'rgba(26,18,9,0.08)';

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Toggle Accordion Dropdown
  const handleToggle = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  // Filter logic
  const filteredFAQ = FAQ_ITEMS.filter((item, idx) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ background: CREAM, color: INK, minHeight: '100vh', padding: '140px 24px 80px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;650;700&display=swap');

        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 48px;
          animation: fadeUp 0.8s ease;
        }

        .faq-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 42px;
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .faq-subtitle {
          font-size: 14px;
          color: ${GOLD};
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .faq-divider {
          width: 60px;
          height: 1.5px;
          background: ${GOLD};
          margin: 24px auto;
          opacity: 0.6;
        }

        /* ── Search bar ── */
        .faq-search-wrapper {
          position: relative;
          margin-bottom: 36px;
        }

        .faq-search-input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border: 1.5px solid rgba(26,18,9,0.1);
          border-radius: 30px;
          background: #ffffff;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: ${INK};
          outline: none;
          box-sizing: border-box;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(26,18,9,0.02);
        }

        .faq-search-input:focus {
          border-color: ${GOLD};
          box-shadow: 0 4px 24px rgba(139,105,20,0.08);
        }

        .faq-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: ${GOLD};
          display: flex;
          align-items: center;
        }

        /* ── Categories ── */
        .faq-categories {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 40px;
        }

        .faq-category-btn {
          background: transparent;
          border: 1.5px solid rgba(26,18,9,0.1);
          border-radius: 20px;
          padding: 8px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 550;
          color: ${MUTED};
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .faq-category-btn.active {
          background: ${GOLD};
          border-color: ${GOLD};
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(139,105,20,0.2);
        }

        .faq-category-btn:hover:not(.active) {
          border-color: ${GOLD};
          color: ${GOLD};
        }

        /* ── Accordion List ── */
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.05);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(26,18,9,0.02);
        }

        .faq-item:hover {
          border-color: rgba(139,105,20,0.2);
        }

        .faq-question-btn {
          width: 100%;
          padding: 20px 24px;
          background: transparent;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: ${INK};
          cursor: pointer;
          gap: 16px;
        }

        .faq-question-btn:focus {
          outline: none;
        }

        .faq-arrow {
          color: ${GOLD};
          transition: transform 0.25s ease;
          flex-shrink: 0;
        }

        .faq-item.expanded .faq-arrow {
          transform: rotate(180deg);
        }

        .faq-answer-panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(139,105,20,0.02);
        }

        .faq-item.expanded .faq-answer-panel {
          max-height: 250px; /* ample height for answers */
        }

        .faq-answer-content {
          padding: 0 24px 20px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(26,18,9,0.72);
        }

        .faq-empty {
          text-align: center;
          padding: 40px 20px;
          color: ${MUTED};
          font-size: 14px;
        }

        /* ── Help Desk ── */
        .faq-footer {
          margin-top: 60px;
          text-align: center;
          padding: 30px;
          background: rgba(139,105,20,0.03);
          border: 1px dashed rgba(139,105,20,0.18);
          border-radius: 12px;
        }

        .faq-footer h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: ${INK};
          margin: 0 0 8px 0;
        }

        .faq-footer p {
          font-size: 13.5px;
          color: ${MUTED};
          margin: 0 0 16px 0;
        }

        .faq-contact-btn {
          display: inline-block;
          background: ${GOLD};
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(139,105,20,0.25);
        }

        .faq-contact-btn:hover {
          background: ${INK};
          box-shadow: 0 4px 12px rgba(26,18,9,0.2);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .faq-title {
            font-size: 32px;
          }
          .faq-question-btn {
            font-size: 14px;
            padding: 16px 18px;
          }
          .faq-answer-content {
            padding: 0 18px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="faq-container">
        <div className="faq-header">
          <span className="faq-subtitle">Support Center</span>
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <div className="faq-divider" />
          <p style={{ fontSize: '13.5px', color: MUTED, letterSpacing: '0.02em' }}>
            Find answers to common questions about our luxury timepieces, shipping methods, and warranties.
          </p>
        </div>

        {/* Live Search Input */}
        <div className="faq-search-wrapper">
          <span className="faq-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="faq-search-input"
            placeholder="Search our FAQ registry..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedIndex(null); // Collapse open accordion on type
            }}
          />
        </div>

        {/* Categories Tab Toggles */}
        <div className="faq-categories">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`faq-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setExpandedIndex(null); // Collapse open accordion on tab switch
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        {filteredFAQ.length > 0 ? (
          <div className="faq-list">
            {filteredFAQ.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div key={idx} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                  <button className="faq-question-btn" onClick={() => handleToggle(idx)} aria-expanded={isExpanded}>
                    <span>{item.q}</span>
                    <span className="faq-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  <div className="faq-answer-panel">
                    <div className="faq-answer-content">
                      <p style={{ margin: 0 }}>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="faq-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD, marginBottom: '12px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No questions matched your search criteria. Try a different query or select a category tab.</p>
          </div>
        )}

        {/* Still Have Questions? */}
        <div className="faq-footer">
          <h3>Still Have Questions?</h3>
          <p>Our dedicated customer care concierge is ready to assist you further.</p>
          <Link href="/contact" className="faq-contact-btn">
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
