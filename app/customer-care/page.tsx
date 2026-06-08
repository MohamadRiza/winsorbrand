'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import toast from 'react-hot-toast';

const DIAL_CODES = [
  { code: '+94', label: 'LK (+94)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+1', label: 'CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+7', label: 'RU (+7)' },
  { code: '+86', label: 'CN (+86)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+960', label: 'MV (+960)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+64', label: 'NZ (+64)' },
  { code: '+41', label: 'CH (+41)' },
  { code: '+852', label: 'HK (+852)' },
  { code: '+65', label: 'SG (+65)' },
  { code: '+60', label: 'MY (+60)' },
  { code: '+62', label: 'ID (+62)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+974', label: 'QA (+974)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+82', label: 'KR (+82)' },
];

export default function CustomerCarePage() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileCode: '+94',
    mobile: '',
    subject: '',
    message: '',
  });

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Auto-fill logic when user logs in
  useEffect(() => {
    if (!userLoaded) return;

    if (isSignedIn && user) {
      setFormData(prev => ({
        ...prev,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.username || '',
      }));

      // Fetch user's registered phone details from their profile
      const fetchProfileMobile = async () => {
        setProfileLoading(true);
        try {
          const res = await fetch('/api/customer/profile');
          const data = await res.json();
          if (data.success && data.data) {
            const { mobileCode, mobile } = data.data;
            setFormData(prev => ({
              ...prev,
              mobileCode: mobileCode || '+94',
              mobile: mobile || '',
            }));
          }
        } catch (err) {
          console.error('Failed to fetch profile contact details:', err);
        } finally {
          setProfileLoading(false);
        }
      };

      fetchProfileMobile();
    } else {
      // Reset to blank for guest
      setFormData({
        name: '',
        email: '',
        mobileCode: '+94',
        mobile: '',
        subject: '',
        message: '',
      });
    }
  }, [isSignedIn, user, userLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > 1000) return; // Enforce max 1000 chars

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, mobile, subject, message } = formData;

    if (!name.trim() || !email.trim() || !mobile.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!turnstileToken) {
      toast.error('Please complete security human verification.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/customer/customer-care', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: `${formData.mobileCode} ${mobile.trim()}`,
          subject: subject.trim(),
          message: message.trim(),
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setFormData(prev => ({
          ...prev,
          subject: '',
          message: '',
        }));
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        toast.success(data.message || 'Support inquiry submitted successfully.');
      } else {
        toast.error(data.error || 'Failed to submit inquiry. Please try again.');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred. Please try again.');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setLoading(false);
    }
  };

  if (!userLoaded || profileLoading) {
    return (
      <div style={{ minHeight: '80vh', background: '#faf7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-circle" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(139,105,20,0.1)', borderTopColor: '#8B6914', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.05em' }}>Connecting to Customer Care...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');

        /* HERO HEADER SECTION */
        .care-hero {
          position: relative;
          height: 480px;
          background-image: linear-gradient(rgba(26, 18, 9, 0.5), rgba(26, 18, 9, 0.5)), url('/discover-service.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed; /* Creates 3D parallax scrolling effect */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #faf7f0;
          padding: 86px 20px 0; /* Accounts for fixed navbar */
        }

        .care-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px;
          font-weight: 300;
          letter-spacing: 0.14em;
          margin: 0;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
        }

        .care-hero-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(250, 247, 240, 0.95);
          max-width: 650px;
          line-height: 1.6;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* PAGE BODY CONTAINER */
        .care-content-container {
          background-color: #faf7f0;
          padding: 80px 40px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .care-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        .care-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 60px;
          align-items: flex-start;
        }

        /* LEFT COLUMN - BRAND DETAILS */
        .care-details-card {
          background-color: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.06);
          border-radius: 8px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.015);
        }

        .details-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #1a1209;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
          padding-bottom: 12px;
        }

        .details-paragraph {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(26, 18, 9, 0.6);
          margin-bottom: 24px;
        }

        .contact-info-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .info-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(139, 105, 20, 0.06);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #8B6914;
          margin-bottom: 2px;
        }

        .info-value {
          font-size: 13.5px;
          color: #1a1209;
          font-weight: 500;
        }

        /* RIGHT COLUMN - SUPPORT FORM */
        .care-form-card {
          background-color: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.06);
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.015);
        }

        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
          position: relative;
        }

        .input-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(26, 18, 9, 0.5);
          margin-bottom: 8px;
        }

        .input-field {
          height: 44px;
          border: 1px solid rgba(26, 18, 9, 0.14);
          border-radius: 4px;
          padding: 0 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          background-color: #ffffff;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          border-color: #8B6914;
        }

        .input-field:disabled {
          background-color: rgba(26, 18, 9, 0.02);
          color: rgba(26, 18, 9, 0.45);
          border-color: rgba(26, 18, 9, 0.08);
          cursor: not-allowed;
        }

        .textarea-field {
          border: 1px solid rgba(26, 18, 9, 0.14);
          border-radius: 4px;
          padding: 12px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          background-color: #ffffff;
          transition: border-color 0.2s;
          resize: none;
          min-height: 140px;
        }

        .textarea-field:focus {
          border-color: #8B6914;
        }

        .char-counter {
          font-size: 11px;
          color: rgba(26, 18, 9, 0.35);
          text-align: right;
          margin-top: 6px;
          font-weight: 500;
        }

        .lock-icon-container {
          position: absolute;
          right: 14px;
          top: 36px;
          color: rgba(26, 18, 9, 0.3);
          display: flex;
          align-items: center;
        }

        .turnstile-box {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-start;
        }

        .submit-btn {
          background-color: #1a1209;
          color: #faf7f0;
          border: none;
          border-radius: 4px;
          padding: 15px 36px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #8B6914;
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.2);
        }

        .submit-btn:disabled {
          background-color: rgba(26, 18, 9, 0.15);
          color: rgba(26, 18, 9, 0.4);
          cursor: not-allowed;
        }

        /* GOOGLE MAPS SECTION */
        .map-section {
          margin-top: 72px;
          border-top: 1px solid rgba(26, 18, 9, 0.08);
          padding-top: 56px;
        }

        .map-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 8px;
        }

        .map-subtitle {
          font-size: 14px;
          color: rgba(26, 18, 9, 0.5);
          text-align: center;
          margin: 0 0 28px;
        }

        .map-container {
          position: relative;
          width: 100%;
          height: 480px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(26, 18, 9, 0.08);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.02);
          margin-bottom: 24px;
        }

        .map-iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .map-action-row {
          display: flex;
          justify-content: center;
        }

        .map-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #8B6914;
          border: 1px solid rgba(139, 105, 20, 0.3);
          border-radius: 4px;
          padding: 10px 24px;
          font-size: 12.5px;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s;
        }

        .map-link-btn:hover {
          background-color: #8B6914;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(139,105,20,0.15);
        }

        /* SUCCESS SCREEN */
        .success-card {
          background-color: #ffffff;
          border: 1px solid rgba(26, 18, 9, 0.08);
          border-radius: 8px;
          padding: 56px 40px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.01);
          max-width: 680px;
          margin: 0 auto;
        }

        .success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(46, 125, 50, 0.08);
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .success-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          color: #1a1209;
          margin: 0 0 10px;
          font-weight: 500;
        }

        .success-text {
          font-size: 14.5px;
          color: rgba(26, 18, 9, 0.55);
          line-height: 1.6;
          margin: 0 0 32px;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .care-content-container {
            padding: 60px 24px;
          }
          .care-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .map-container {
            height: 380px;
          }
        }

        @media (max-width: 640px) {
          .care-hero {
            height: 320px;
            background-attachment: scroll; /* Disabled on mobile for performance and rendering compatibilities */
          }
          .care-hero-title {
            font-size: 32px;
            letter-spacing: 0.08em;
          }
          .care-hero-subtitle {
            font-size: 11px;
            letter-spacing: 0.12em;
          }
          .form-row-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .care-form-card {
            padding: 24px;
          }
          .map-container {
            height: 300px;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="care-hero">
        <h1 className="care-hero-title">Customer Care</h1>
        <div style={{ width: '40px', height: '1.5px', background: '#8B6914', margin: '14px 0 20px' }} />
        <p className="care-hero-subtitle">
          Handcrafted timepieces deserve bespoke attention. Let our horology experts assist you.
        </p>
      </section>

      {/* BODY CONTENT */}
      <div className="care-content-container">
        <div className="care-wrapper">
          {success ? (
            /* SUCCESS PANEL */
            <div className="success-card">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="success-title">Message Submitted Successfully</h2>
              <p className="success-text">
                Your support inquiry has been securely sent. A Winsor Customer Care boutique agent will review your request and get in touch with you shortly (normally within 12 business hours).
              </p>
              <button onClick={() => setSuccess(false)} className="submit-btn">
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              {/* TWO COLUMN GRID */}
              <div className="care-grid">
                
                {/* Left Column: Brand details */}
                <div className="care-details-card">
                  <h3 className="details-title">Official Care Boutique</h3>
                  <p className="details-paragraph">
                    For over three decades, Winsor has provided handcrafted excellence. Our global concierge network stands ready to support your investment in fine horology.
                  </p>

                  <div className="contact-info-row">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Direct Concierge</div>
                      <div className="info-value">+94 (11) 234-5678</div>
                    </div>
                  </div>

                  <div className="contact-info-row">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Boutique Hours</div>
                      <div className="info-value">Monday – Saturday<br />09:00 AM – 06:00 PM (GMT+5:30)</div>
                    </div>
                  </div>

                  <div className="contact-info-row">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div>
                      <div className="info-label">Concierge Email</div>
                      <div className="info-value">concierge@winsorwatch.com</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(26,18,9,0.08)', paddingTop: '20px', marginTop: '28px' }}>
                    <div className="info-label" style={{ marginBottom: '8px' }}>Global Headquarters & Showroom</div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(26,18,9,0.5)', lineHeight: 1.45 }}>
                      Winsor Brand Horology<br />
                      Happy Time (Pvt) Ltd,<br />
                      Colombo 11, Sri Lanka
                    </p>
                  </div>
                </div>

                {/* Right Column: Support Form Card */}
                <div className="care-form-card">
                  <h3 className="details-title">Secure Inquiry Submission</h3>

                  <form onSubmit={handleSubmit}>
                    
                    <div className="form-row-grid">
                      {/* Name */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="name">Username / Name</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                          placeholder="Your full name"
                          disabled={loading}
                        />
                      </div>

                      {/* Mobile */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="mobile">Mobile Number</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            name="mobileCode"
                            value={formData.mobileCode}
                            onChange={handleInputChange}
                            className="input-field"
                            style={{ width: '110px', padding: '0 6px', fontSize: '12.5px', cursor: 'pointer' }}
                            disabled={loading}
                          >
                            {DIAL_CODES.map(c => (
                              <option key={`${c.label}-${c.code}`} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <input
                            id="mobile"
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            className="input-field"
                            style={{ flex: 1 }}
                            required
                            placeholder="77 123 4567"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                        placeholder="Your email address"
                        disabled={isSignedIn || loading}
                        style={isSignedIn ? { paddingRight: '40px' } : undefined}
                      />
                      {isSignedIn && (
                        <div className="lock-icon-container" title="Locked to Clerk Account Email">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="subject">Subject</label>
                      <input
                        id="subject"
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                        placeholder="e.g. Timepiece servicing inquiry"
                        disabled={loading}
                      />
                    </div>

                    {/* Message */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        className="textarea-field"
                        required
                        placeholder="Detail your request here (maximum 1000 characters)..."
                        disabled={loading}
                      />
                      <div className="char-counter">
                        {formData.message.length} / 1000 Characters
                      </div>
                    </div>

                    {/* CLOUDFLARE TURNSTILE HUMAN CHECK */}
                    <div className="turnstile-box">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !turnstileToken}
                      className="submit-btn"
                    >
                      {loading ? (
                        <>
                          <div className="shimmer-circle" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
                          Submitting...
                        </>
                      ) : (
                        'Send Inquiry'
                      )}
                    </button>

                  </form>
                </div>

              </div>

              {/* GOOGLE MAPS PANEL */}
              <div className="map-section">
                <h2 className="map-title">Flagship Boutique Location</h2>
                <p className="map-subtitle">Experience Winsor timepieces in person at our Colombo Pettah showroom.</p>
                
                <div className="map-container">
                  <iframe 
                    className="map-iframe"
                    src="https://maps.google.com/maps?q=Happy%20Time%20(Pvt)%20Ltd%20-%20Colombo%2011&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    allowFullScreen={true}
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="map-action-row">
                  <a 
                    href="https://www.google.com/maps/place/Happy+Time+(Pvt)+Ltd+-+Colombo+11/@6.9368997,79.8485117,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae259261ada6aad:0x64dff49a1c0ccff2!8m2!3d6.9368997!4d79.8510866!16s%2Fg%2F11qp2yyysl?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="map-link-btn"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Open in Google Maps
                  </a>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </>
  );
}
