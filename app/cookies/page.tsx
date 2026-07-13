// app/cookies/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy — Winsor | Ride Your Moment',
  description: 'Learn how Winsor utilizes cookies and tracker technology to optimize user sessions, cart functions, and luxury storefront experiences.',
  openGraph: {
    title: 'Cookie Policy — Winsor',
    description: 'Detailed disclosure of essential, analytical, and preference cookies used within the Winsor brand portal.',
    type: 'website',
  },
};

const GOLD = '#8B6914';
const INK = '#1a1209';
const CREAM = '#fcfbf8';
const MUTED = 'rgba(26,18,9,0.65)';
const LINE = 'rgba(26,18,9,0.08)';

export default function CookiePolicyPage() {
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

        .cookie-table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 13px;
        }

        .cookie-table th {
          background: rgba(139,105,20,0.06);
          border-bottom: 1.5px solid ${GOLD};
          text-align: left;
          padding: 12px;
          font-weight: 650;
          color: ${INK};
        }

        .cookie-table td {
          border-bottom: 1px solid ${LINE};
          padding: 12px;
          vertical-align: top;
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
          .cookie-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="legal-container">
        <div className="legal-header">
          <span className="legal-subtitle">Maison Privacy Department</span>
          <h1 className="legal-title">Cookie Policy</h1>
          <div className="legal-divider" />
          <p style={{ fontSize: '13.5px', color: MUTED, letterSpacing: '0.02em' }}>
            Effective Date: June 1, 2026 | Last Updated: July 13, 2026
          </p>
        </div>

        <div className="legal-grid">
          {/* Desktop Table of Contents */}
          <aside className="legal-sidebar">
            <a href="#what-are-cookies" className="sidebar-link">1. What Are Cookies</a>
            <a href="#how-we-use-them" className="sidebar-link">2. How We Use Cookies</a>
            <a href="#types-of-cookies" className="sidebar-link">3. Types of Cookies We Use</a>
            <a href="#managing-cookies" className="sidebar-link">4. Managing Your Preferences</a>
            <a href="#policy-updates" className="sidebar-link">5. Updates to This Policy</a>
          </aside>

          {/* Legal Document Content */}
          <main className="legal-content">
            <section id="what-are-cookies" className="legal-section">
              <h2 className="section-title">1. What Are Cookies</h2>
              <p>
                Cookies are small text files stored on your browser or device when you navigate websites. They allow the server to recognize your device, remember preferences, and preserve session parameters (such as the items currently in your shopping cart or your preferred currency selector configuration).
              </p>
              <p>
                Cookies can be "persistent" (remaining on your device until they expire or are manually deleted) or "session" cookies (deleted automatically when you close your web browser).
              </p>
            </section>

            <section id="how-we-use-them" className="legal-section">
              <h2 className="section-title">2. How We Use Cookies</h2>
              <p>
                At Winsor, cookies are deployed to deliver a seamless, high-end e-commerce interface. We use trackers for key functions such as:
              </p>
              <ul>
                <li>Preserving timepieces placed in your shopping cart across browser reloads.</li>
                <li>Maintaining authentication tokens via Clerk for secure patron access.</li>
                <li>Remembering your currency display preference (e.g. LKR, AED, USD).</li>
                <li>Analyzing visitor traffic patterns to refine our digital boutique catalog layout.</li>
              </ul>
            </section>

            <section id="types-of-cookies" className="legal-section">
              <h2 className="section-title">3. Types of Cookies We Use</h2>
              <p>
                We classify the trackers used on our platform into three main categories:
              </p>

              <table className="cookie-table">
                <thead>
                  <tr>
                    <th>Cookie Category</th>
                    <th>Purpose</th>
                    <th>Example Tracker Keys</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Strictly Necessary</strong></td>
                    <td>Essential for portal security, login authentication (Clerk), and cart maintenance. Without these, core checkout systems cannot function.</td>
                    <td><code>__session</code>, <code>clerk-db-jwt</code>, <code>winsor_cart</code></td>
                  </tr>
                  <tr>
                    <td><strong>Preference & Functionality</strong></td>
                    <td>Stores user choices to localize pricing, layout options, and navigation states.</td>
                    <td><code>winsor_currency</code>, <code>winsor_wishlist</code></td>
                  </tr>
                  <tr>
                    <td><strong>Performance & Analytics</strong></td>
                    <td>Anonymously tracks visitor navigation patterns to help our timepiece craftsmen optimize catalog loading speeds and usability.</td>
                    <td><code>_ga</code>, <code>_gid</code> (Google Analytics)</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section id="managing-cookies" className="legal-section">
              <h2 className="section-title">4. Managing Your Preferences</h2>
              <p>
                You possess the authority to allow, block, or delete cookies at any time through your browser's configuration panel. Most modern web browsers provide detailed options:
              </p>
              <ul>
                <li>For Apple Safari: Navigate to <em>Settings &gt; Privacy &gt; Cookies and Website Data</em>.</li>
                <li>For Google Chrome: Go to <em>Settings &gt; Privacy and Security &gt; Third-party cookies</em>.</li>
                <li>For Microsoft Edge: Access <em>Settings &gt; Cookies and site permissions</em>.</li>
              </ul>
              <p>
                Please note that blocking essential cookies may restrict you from logging into Clerk, adding custom gifting preferences, or completing timepiece purchases.
              </p>
            </section>

            <section id="policy-updates" className="legal-section">
              <h2 className="section-title">5. Updates to This Policy</h2>
              <p>
                We may periodically update this Cookie Policy to match adjustments in tracking technology or regulatory compliance. Any revisions will be marked with a new "Last Updated" date at the top of this page.
              </p>
              <p>
                For more details on how personal data is safeguarded, please refer to our <Link href="/privacy" style={{ color: GOLD, textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
