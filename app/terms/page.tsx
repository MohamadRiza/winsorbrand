// app/terms/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Winsor | Ride Your Moment',
  description: 'Review the official terms of service governing timepiece purchases, boutique reservations, transit liabilities, and customer support with Winsor Brand.',
  openGraph: {
    title: 'Terms of Service — Winsor',
    description: 'General conditions, timepiece warranties, shipping conditions, and customer relations agreements at Winsor Timepiece Maison.',
    type: 'website',
  },
};

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#fcfbf8';
const MUTED = 'rgba(26,18,9,0.65)';
const LINE = 'rgba(26,18,9,0.08)';

export default function TermsOfServicePage() {
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
          <span className="legal-subtitle">Maison General Counsel</span>
          <h1 className="legal-title">Terms of Service</h1>
          <div className="legal-divider" />
          <p style={{ fontSize: '13.5px', color: MUTED, letterSpacing: '0.02em' }}>
            Effective Date: June 1, 2026 | Last Updated: July 13, 2026
          </p>
        </div>

        <div className="legal-grid">
          {/* Desktop Table of Contents */}
          <aside className="legal-sidebar">
            <a href="#acceptance" className="sidebar-link">1. Acceptance of Terms</a>
            <a href="#acquisitions" className="sidebar-link">2. Timepiece Purchases & Reservations</a>
            <a href="#shipping-transit" className="sidebar-link">3. Luxury Shipping & Liability</a>
            <a href="#warranties" className="sidebar-link">4. Lifetime Warranty & Authenticity</a>
            <a href="#intellectual-prop" className="sidebar-link">5. Intellectual Property</a>
            <a href="#limitation-liability" className="sidebar-link">6. Limitations of Liability</a>
            <a href="#governing-law" className="sidebar-link">7. Governing Law</a>
          </aside>

          {/* Legal Document Content */}
          <main className="legal-content">
            <section id="acceptance" className="legal-section">
              <h2 className="section-title">1. Acceptance of Terms</h2>
              <p>
                By visiting, viewing, or placing timepiece reservations on the Winsor Brand website, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not accept these terms in their entirety, you should discontinue use of our site and online boutique services.
              </p>
            </section>

            <section id="acquisitions" className="legal-section">
              <h2 className="section-title">2. Timepiece Purchases & Reservations</h2>
              <p>
                All timepiece acquisitions and order placements are subject to inventory confirmation. Since Winsor timepieces are hand-finished in limited quantities, placing a timepiece in your shopping cart does not constitute a guaranteed reservation until checkout has been successfully processed and verified.
              </p>
              <p>
                We reserve the right to refuse or cancel orders at our sole discretion, including cases where pricing errors, inaccurate details, or potential fraudulent patterns are identified.
              </p>
            </section>

            <section id="shipping-transit" className="legal-section">
              <h2 className="section-title">3. Luxury Shipping & Liability</h2>
              <p>
                Winsor delivers worldwide through secure, priority courier transit services. Shipping times provided during checkout are estimates and are subject to customs clearance regulations.
              </p>
              <p>
                Ownership and risk of loss transfer to the patron upon delivery by our transit courier to the designated dispatch address. All duties and local tariffs associated with international deliveries remain the responsibility of the purchaser.
              </p>
            </section>

            <section id="warranties" className="legal-section">
              <h2 className="section-title">4. Lifetime Warranty & Authenticity</h2>
              <p>
                Every authentic Winsor timepiece purchased through our official website or authorized boutique retailers is backed by a limited manufacturer warranty. The warranty covers internal mechanical defects but excludes damage resulting from water exposure beyond specifications, general wear and tear, or modifications performed by unauthorized technicians.
              </p>
              <p>
                Registering your timepiece inside the <Link href="/profile" style={{ color: GOLD, textDecoration: 'underline' }}>Patron Portal</Link> verifies authenticity and logs the purchase under your verified patron profile.
              </p>
            </section>

            <section id="intellectual-prop" className="legal-section">
              <h2 className="section-title">5. Intellectual Property</h2>
              <p>
                The designs, timepiece configurations, trademarks, logos, typography, animations, photography, and text displayed on this portal are the intellectual property of Winsor Timepiece Maison. Copying, distributing, or reproducing our proprietary assets without written permission from our executive office is strictly prohibited.
              </p>
            </section>

            <section id="limitation-liability" className="legal-section">
              <h2 className="section-title">6. Limitations of Liability</h2>
              <p>
                Winsor provides its website and services on an "as-is" basis without warranties of any kind, either express or implied. Under no circumstances shall the maison or its officers be held liable for indirect, incidental, or consequential damages arising from the use or inability to access our services.
              </p>
            </section>

            <section id="governing-law" className="legal-section">
              <h2 className="section-title">7. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to conflict of law principles. Any dispute arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the courts of Dubai.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
