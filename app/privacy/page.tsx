// app/privacy/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Winsor | Ride Your Moment',
  description: 'Learn how Winsor collects, uses, and safeguards your personal data, ensuring complete confidentiality and security for our global patrons.',
  openGraph: {
    title: 'Privacy Policy — Winsor',
    description: 'Our commitment to privacy, data protection, and secure processing of timepiece transactions and patron profiles.',
    type: 'website',
  },
};

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#fcfbf8';
const MUTED = 'rgba(26,18,9,0.65)';
const LINE = 'rgba(26,18,9,0.08)';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: CREAM, color: INK, minHeight: '100vh', padding: '140px 24px 80px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;650;700&display=swap');

        .legal-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .legal-header {
          text-align: center;
          margin-bottom: 60px;
          animation: fadeUp 0.8s ease;
        }

        .legal-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 42px;
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .legal-subtitle {
          font-size: 14px;
          color: ${GOLD};
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .legal-divider {
          width: 60px;
          height: 1.5px;
          background: ${GOLD};
          margin: 24px auto;
          opacity: 0.6;
        }

        .legal-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 60px;
          align-items: start;
        }

        .legal-sidebar {
          position: sticky;
          top: 120px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-left: 1.5px solid ${LINE};
          padding-left: 20px;
        }

        .sidebar-link {
          font-size: 13px;
          color: ${MUTED};
          text-decoration: none;
          transition: all 0.25s ease;
          font-weight: 500;
        }

        .sidebar-link:hover {
          color: ${GOLD};
          padding-left: 4px;
        }

        .legal-content {
          line-height: 1.8;
          font-size: 14.5px;
          color: rgba(26,18,9,0.8);
        }

        .legal-section {
          margin-bottom: 48px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          color: ${INK};
          margin-bottom: 16px;
          letter-spacing: 0.02em;
        }

        .legal-content p {
          margin-bottom: 18px;
        }

        .legal-content ul {
          margin: 0 0 20px 20px;
          padding: 0;
          list-style-type: square;
        }

        .legal-content li {
          margin-bottom: 8px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .legal-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .legal-sidebar {
            display: none;
          }
          .legal-title {
            font-size: 32px;
          }
        }
      `}</style>

      <div className="legal-container">
        <div className="legal-header">
          <span className="legal-subtitle">Maison Legal Department</span>
          <h1 className="legal-title">Privacy Policy</h1>
          <div className="legal-divider" />
          <p style={{ fontSize: '13.5px', color: MUTED, letterSpacing: '0.02em' }}>
            Effective Date: June 1, 2026 | Last Updated: July 13, 2026
          </p>
        </div>

        <div className="legal-grid">
          {/* Desktop Table of Contents */}
          <aside className="legal-sidebar">
            <a href="#introduction" className="sidebar-link">1. Introduction</a>
            <a href="#information-collect" className="sidebar-link">2. Information We Collect</a>
            <a href="#how-we-use" className="sidebar-link">3. How We Use Information</a>
            <a href="#data-sharing" className="sidebar-link">4. Sharing Your Data</a>
            <a href="#security-storage" className="sidebar-link">5. Security & Storage</a>
            <a href="#your-rights" className="sidebar-link">6. Your Rights</a>
            <a href="#cookies-settings" className="sidebar-link">7. Cookies & Settings</a>
            <a href="#contact" className="sidebar-link">8. Contact Legal</a>
          </aside>

          {/* Legal Document Content */}
          <main className="legal-content">
            <section id="introduction" className="legal-section">
              <h2 className="section-title">1. Introduction</h2>
              <p>
                Welcome to Winsor. We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines how our luxury timepiece maison collects, processes, and protects your data when you visit our website, register a timepiece, or make acquisitions through our boutique services.
              </p>
              <p>
                By accessing our services or interacting with our brand, you agree to the practices outlined in this Policy. We operate under stringent privacy laws across our operating regions, including general data protection acts and international standards.
              </p>
            </section>

            <section id="information-collect" className="legal-section">
              <h2 className="section-title">2. Information We Collect</h2>
              <p>
                To provide you with a bespoke timepiece acquisition experience, we collect information that belongs to three categories:
              </p>
              <ul>
                <li>
                  <strong>Personal Identification:</strong> Your full name, delivery destination, contact details (email and mobile number), and profile information synchronized securely via our identity provider, Clerk.
                </li>
                <li>
                  <strong>Transaction & Billing Data:</strong> History of purchased timepieces, preferred currency variant, order references, custom gifting configurations, and card processing credentials handled securely through our authorized payment processors (no financial details are stored directly on our servers).
                </li>
                <li>
                  <strong>Technical Profile:</strong> Browser details, IP address, device telemetry, and web behavior collected during your navigation across our collections.
                </li>
              </ul>
            </section>

            <section id="how-we-use" className="legal-section">
              <h2 className="section-title">3. How We Use Information</h2>
              <p>
                Winsor uses your information primarily to fulfill timepiece reservations, optimize logistics delivery transit routes, and personalize your experience. Specifically, we use your data to:
              </p>
              <ul>
                <li>Establish secure patron accounts and manage purchase checkouts.</li>
                <li>Facilitate door-to-door delivery with priority courier routing.</li>
                <li>Calculate patron reward points and assign loyalty tiers (Bronze, Silver, Gold, Platinum).</li>
                <li>Deliver optional updates regarding private collections, brand announcements, or private events (subject to your notifications configuration).</li>
              </ul>
            </section>

            <section id="data-sharing" className="legal-section">
              <h2 className="section-title">4. Sharing Your Data</h2>
              <p>
                We do not sell, trade, or rent our patrons' personal information. Your data is only shared with trusted third parties to ensure operational efficiency:
              </p>
              <ul>
                <li><strong>Identity Providers:</strong> Clerk handles our secure user login and profile registry.</li>
                <li><strong>Shipping & Logistics:</strong> Trusted global luxury couriers to fulfill delivery to your specified dispatch destination.</li>
                <li><strong>Cloud Infrastructure:</strong> Secure cloud servers (MongoDB Atlas) to host database entries securely.</li>
              </ul>
            </section>

            <section id="security-storage" className="legal-section">
              <h2 className="section-title">5. Security & Storage</h2>
              <p>
                Your personal details are stored inside secure, encrypted MongoDB databases. We maintain technical, administrative, and physical safeguards designed to protect personal information against accidental, unlawful, or unauthorized destruction, loss, alteration, access, disclosure, or use.
              </p>
              <p>
                Patron portal settings are guarded behind single-sign-on (SSO) authentication powered by Clerk, ensuring that access to your wishlist, orders, and addresses remains strictly confidential.
              </p>
            </section>

            <section id="your-rights" className="legal-section">
              <h2 className="section-title">6. Your Rights</h2>
              <p>
                As a global maison, we acknowledge your rights to access, rectify, or purge your personal data. You may:
              </p>
              <ul>
                <li>Request access to the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete profile details via your <Link href="/profile" style={{ color: GOLD, textDecoration: 'underline' }}>Patron Profile Page</Link>.</li>
                <li>Request deletion of your account or restrict data processing (please contact support for complete deletion).</li>
              </ul>
            </section>

            <section id="cookies-settings" className="legal-section">
              <h2 className="section-title">7. Cookies & Settings</h2>
              <p>
                We use cookies to maintain your shopping cart contents, active currency preferences, and interface theme selections. You can disable cookies inside your browser settings, though doing so may prevent certain premium portal functions from operating.
              </p>
              <p>
                For complete information on how we utilize cookies, please review our dedicated <Link href="/cookies" style={{ color: GOLD, textDecoration: 'underline' }}>Cookie Policy</Link>.
              </p>
            </section>

            <section id="contact" className="legal-section">
              <h2 className="section-title">8. Contact Legal</h2>
              <p>
                If you have questions regarding this Privacy Policy or wish to assert your data rights, please reach out to our legal department:
              </p>
              <p style={{ background: 'rgba(139,105,20,0.03)', border: '1px solid rgba(139,105,20,0.12)', padding: '16px', borderRadius: '8px', fontStyle: 'italic', fontSize: '13.5px' }}>
                Winsor Timepiece Maison<br />
                Attn: Privacy & Data Protection Compliance Office<br />
                Email: legal@winsorbrand.com<br />
                Address: Dubai Design District, Block 4, United Arab Emirates
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
