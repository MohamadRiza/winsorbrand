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
          if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
            return;
          }
          const data = await res.json();
          if (data.success && data.data) {
            const { mobileCode, mobile } = data.data;
            setFormData(prev => ({
              ...prev,
              mobileCode: mobileCode || '+94',
              mobile: mobile || '',
            }));
          }
        } catch (error) {
          // Silently handle profile fetch failure for unauthenticated guest users
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
          <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.05em' }}>Connecting to Customer Care Concierge...</p>
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600;700&display=swap');

        /* ── LUXURY HERO HEADER ── */
        .care-hero-section {
          position: relative;
          min-height: 480px;
          background-image: 
            linear-gradient(180deg, rgba(10, 8, 5, 0.82) 0%, rgba(10, 8, 5, 0.72) 50%, rgba(10, 8, 5, 0.95) 100%),
            radial-gradient(circle at 50% 30%, rgba(223, 177, 91, 0.18) 0%, transparent 65%),
            url('/contact.png');
          background-size: cover;
          background-position: center 35%;
          background-repeat: no-repeat;
          background-attachment: fixed;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #faf7f0;
          padding: 120px 24px 60px;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(139, 105, 20, 0.22);
          border: 1px solid rgba(223, 177, 91, 0.45);
          border-radius: 30px;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          font-weight: 600;
          color: #dfb15b;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .care-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 4.5vw, 56px);
          font-weight: 400;
          letter-spacing: 0.08em;
          margin: 0 0 16px;
          color: #ffffff;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
          line-height: 1.15;
        }

        .care-hero-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.2vw, 15px);
          font-weight: 300;
          letter-spacing: 0.04em;
          color: rgba(250, 247, 240, 0.85);
          max-width: 680px;
          line-height: 1.65;
          margin: 0 0 28px;
        }

        .hero-highlights-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .hero-highlight-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.03em;
          backdrop-filter: blur(6px);
        }

        /* ── ATTACHED BENEFITS BAR ── */
        @keyframes hero-benefits-marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .hero-attached-benefits-wrapper {
          position: relative;
          z-index: 30;
          max-width: 1400px;
          margin: -34px auto 20px;
          padding: 0 4%;
          width: 100%;
        }
        .hero-attached-benefits-bar {
          position: relative;
          background: rgba(255, 255, 255, 0.75);
          border-radius: 14px;
          border: 1.5px solid rgba(139, 105, 20, 0.22);
          box-shadow: 0 16px 40px rgba(26, 18, 9, 0.06), 0 4px 12px rgba(139, 105, 20, 0.04);
          padding: 20px 32px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          overflow: hidden;
        }
        .hero-attached-benefit-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #1a1209;
        }
        .hero-attached-benefit-item svg {
          color: #8b6914;
          flex-shrink: 0;
        }
        .hero-attached-benefit-item h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.01em;
          color: #1a1209;
          white-space: nowrap;
        }
        .hero-attached-benefit-item span {
          font-size: 10.5px;
          color: rgba(26, 18, 9, 0.5);
          margin: 0;
          display: block;
          white-space: nowrap;
        }

        @media (min-width: 1025px) {
          .hero-attached-benefits-marquee-container {
            display: block;
          }
          .hero-attached-benefits-track {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
            align-items: center;
            width: 100%;
          }
          .hero-attached-benefits-track.duplicate {
            display: none !important;
          }
        }

        @media (max-width: 1024px) {
          .hero-attached-benefits-wrapper {
            margin: -24px auto 16px;
            padding: 0 16px;
          }
          .hero-attached-benefits-bar {
            padding: 16px 0;
            display: flex;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .hero-attached-benefits-bar::before,
          .hero-attached-benefits-bar::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 24px;
            z-index: 5;
            pointer-events: none;
          }
          .hero-attached-benefits-bar::before {
            left: 0;
            background: linear-gradient(to right, #faf7f0 0%, transparent 100%);
          }
          .hero-attached-benefits-bar::after {
            right: 0;
            background: linear-gradient(to left, #faf7f0 0%, transparent 100%);
          }
          .hero-attached-benefits-marquee-container {
            display: flex;
            width: max-content;
            animation: hero-benefits-marquee 25s linear infinite;
            will-change: transform;
          }
          .hero-attached-benefits-marquee-container:hover {
            animation-play-state: paused;
          }
          .hero-attached-benefits-track {
            display: flex;
            align-items: center;
            gap: 32px;
            padding-right: 32px;
            flex-shrink: 0;
          }
          .hero-attached-benefit-item {
            flex-shrink: 0;
          }
        }

        /* ── PAGE BODY CONTAINER ── */
        .care-content-container {
          background-color: #faf7f0;
          padding: 20px 4% 80px;
          font-family: 'Jost', sans-serif;
          color: #1a1209;
        }

        .care-wrapper {
          max-width: 1300px;
          margin: 0 auto;
        }

        /* ── 3 QUICK CONTACT HIGHLIGHT CARDS ── */
        .quick-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 44px;
        }

        .quick-contact-card {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 10px 30px rgba(26, 18, 9, 0.04), 0 2px 8px rgba(139, 105, 20, 0.03);
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
        }

        .quick-contact-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 42px rgba(139, 105, 20, 0.15), 0 4px 14px rgba(26, 18, 9, 0.06);
          border-color: #8b6914;
        }

        .quick-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139,105,20,0.12) 0%, rgba(223,177,91,0.2) 100%);
          border: 1px solid rgba(139,105,20,0.3);
          color: #8b6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .quick-contact-card:hover .quick-icon-circle {
          transform: scale(1.08);
          background: #8b6914;
          color: #ffffff;
        }

        .quick-card-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8b6914;
          margin-bottom: 3px;
        }

        .quick-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1209;
          margin-bottom: 2px;
          word-break: break-word;
        }

        .quick-card-sub {
          font-size: 11.5px;
          color: rgba(26, 18, 9, 0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── TWO COLUMN GRID ── */
        .care-grid {
          display: grid;
          grid-template-columns: 440px 1fr;
          gap: 40px;
          align-items: flex-start;
        }

        /* ── LEFT COLUMN - BOUTIQUE DETAILS ── */
        .care-details-card {
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-top: 3.5px solid #8b6914;
          border-radius: 14px;
          padding: 36px;
          box-shadow: 0 16px 44px rgba(26, 18, 9, 0.05), 0 2px 10px rgba(139, 105, 20, 0.03);
        }

        .details-header-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #8b6914;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .details-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 500;
          margin: 0 0 14px;
          color: #1a1209;
          letter-spacing: 0.02em;
        }

        .details-paragraph {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(26, 18, 9, 0.62);
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(26, 18, 9, 0.08);
        }

        .contact-info-block {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .contact-info-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid rgba(139, 105, 20, 0.2);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .contact-info-row:hover .info-icon {
          background: #8b6914;
          color: #ffffff;
          transform: translateY(-2px);
        }

        .info-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8B6914;
          margin-bottom: 3px;
        }

        .info-value {
          font-size: 13.5px;
          color: #1a1209;
          font-weight: 500;
          line-height: 1.5;
        }

        .contact-link {
          color: #8B6914;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .contact-link:hover {
          color: #1a1209;
          text-decoration: underline;
        }

        .headquarters-box {
          border-top: 1px dashed rgba(139, 105, 20, 0.25);
          padding-top: 24px;
          margin-top: 10px;
          background: rgba(250, 247, 240, 0.5);
          border-radius: 8px;
          padding: 18px;
        }

        /* ── RIGHT COLUMN - SUPPORT FORM ── */
        .care-form-card {
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-top: 3.5px solid #1a1209;
          border-radius: 14px;
          padding: 40px;
          box-shadow: 0 16px 44px rgba(26, 18, 9, 0.05), 0 2px 10px rgba(139, 105, 20, 0.03);
        }

        .form-header-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #8b6914;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 500;
          margin: 0 0 8px;
          color: #1a1209;
          letter-spacing: 0.02em;
        }

        .form-desc {
          font-size: 13px;
          color: rgba(26, 18, 9, 0.55);
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 22px;
          position: relative;
        }

        .input-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(26, 18, 9, 0.6);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .input-field {
          width: 100%;
          box-sizing: border-box;
          height: 46px;
          border: 1.5px solid rgba(26, 18, 9, 0.12);
          border-radius: 8px;
          padding: 0 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          background-color: rgba(250, 247, 240, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 3px rgba(26, 18, 9, 0.02);
          transition: all 0.25s ease;
        }

        .input-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3.5px rgba(139, 105, 20, 0.14), 0 6px 16px rgba(139, 105, 20, 0.08);
          background-color: rgba(255, 255, 255, 0.95);
        }

        .input-field:disabled {
          background-color: rgba(26, 18, 9, 0.03);
          color: rgba(26, 18, 9, 0.5);
          border-color: rgba(26, 18, 9, 0.08);
          cursor: not-allowed;
        }

        .textarea-field {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid rgba(26, 18, 9, 0.12);
          border-radius: 8px;
          padding: 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          background-color: rgba(250, 247, 240, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 3px rgba(26, 18, 9, 0.02);
          transition: all 0.25s ease;
          resize: none;
          min-height: 140px;
        }

        .textarea-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3.5px rgba(139, 105, 20, 0.14), 0 6px 16px rgba(139, 105, 20, 0.08);
          background-color: rgba(255, 255, 255, 0.95);
        }

        .char-counter {
          font-size: 11px;
          color: rgba(26, 18, 9, 0.4);
          text-align: right;
          margin-top: 6px;
          font-weight: 500;
        }

        .lock-icon-container {
          position: absolute;
          right: 14px;
          top: 36px;
          color: #8b6914;
          display: flex;
          align-items: center;
        }

        .turnstile-box {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-start;
          padding: 8px;
          background: rgba(250, 247, 240, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(26, 18, 9, 0.06);
        }

        .submit-btn {
          background: linear-gradient(135deg, #1a1209 0%, #2b2016 100%);
          color: #faf7f0;
          border: none;
          border-radius: 6px;
          padding: 16px 36px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(26, 18, 9, 0.15);
        }

        .submit-btn:hover:not(:disabled) {
          background: #8B6914;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.3);
          transform: translateY(-2px);
        }

        .submit-btn:disabled {
          background: rgba(26, 18, 9, 0.15);
          color: rgba(26, 18, 9, 0.4);
          cursor: not-allowed;
          box-shadow: none;
        }

        /* ── GOOGLE MAPS SECTION ── */
        .map-section {
          margin-top: 64px;
          border-top: 1px solid rgba(26, 18, 9, 0.08);
          padding-top: 48px;
        }

        .map-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 6px;
          color: #1a1209;
        }

        .map-subtitle {
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.55);
          text-align: center;
          margin: 0 0 28px;
        }

        .map-container {
          position: relative;
          width: 100%;
          height: 460px;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          box-shadow: 0 18px 48px rgba(26, 18, 9, 0.08), 0 4px 12px rgba(139, 105, 20, 0.04);
          margin-bottom: 24px;
        }

        .map-iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .map-action-row {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .map-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #8B6914;
          border: 1.5px solid rgba(139, 105, 20, 0.35);
          border-radius: 6px;
          padding: 12px 28px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(26, 18, 9, 0.04), 0 2px 6px rgba(139, 105, 20, 0.03);
        }

        .map-link-btn:hover {
          background-color: #8B6914;
          color: #ffffff;
          border-color: #8b6914;
          box-shadow: 0 6px 20px rgba(139,105,20,0.25);
          transform: translateY(-2px);
        }

        /* SUCCESS SCREEN */
        .success-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(139, 105, 20, 0.3);
          border-radius: 14px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 16px 44px rgba(26, 18, 9, 0.06);
          max-width: 680px;
          margin: 0 auto;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(46, 125, 50, 0.1);
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border: 1px solid rgba(46, 125, 50, 0.25);
        }

        .success-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          color: #1a1209;
          margin: 0 0 12px;
          font-weight: 500;
        }

        .success-text {
          font-size: 14.5px;
          color: rgba(26, 18, 9, 0.65);
          line-height: 1.65;
          margin: 0 0 32px;
        }

        /* ── RESPONSIVE STYLES ── */
        @media (max-width: 1024px) {
          .quick-contact-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .care-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .hero-attached-benefits-bar {
            display: flex;
            overflow-x: auto;
            gap: 24px;
            padding: 16px 20px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .hero-attached-benefits-bar::-webkit-scrollbar {
            display: none;
          }
          .hero-attached-benefit-item {
            flex: 0 0 auto;
          }
          .map-container {
            height: 360px;
          }
        }

        @media (max-width: 640px) {
          .care-hero-section {
            min-height: 380px;
            padding-top: 100px;
            background-attachment: scroll;
          }
          .form-row-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .care-form-card, .care-details-card {
            padding: 24px;
          }
          .map-container {
            height: 300px;
          }
        }
      `}</style>

      {/* ── LUXURY HERO HEADER SECTION ── */}
      <section className="care-hero-section">
        <div className="hero-badge-pill">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span>WINSOR BOUTIQUE CONCIERGE</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </div>

        <h1 className="care-hero-title">Customer Care & Support</h1>
        
        <p className="care-hero-subtitle">
          Handcrafted timepieces deserve bespoke attention. Our horology concierge experts in Sri Lanka and Dubai stand ready to assist with servicing, inquiries, and private appointments.
        </p>

        <div className="hero-highlights-row">
          <div className="hero-highlight-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>Response Within 12 Hours</span>
          </div>
          <div className="hero-highlight-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span>International Warranty Support</span>
          </div>
          <div className="hero-highlight-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span>Colombo Pettah Showroom & Dubai HQ</span>
          </div>
        </div>
      </section>

      {/* ── ATTACHED BENEFITS BAR ── */}
      <div className="hero-attached-benefits-wrapper">
        <div className="hero-attached-benefits-bar">
          <div className="hero-attached-benefits-marquee-container">
            {/* Track 1 */}
            <div className="hero-attached-benefits-track">
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 7 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>

            {/* Track 2 (Duplicate for Seamless Infinite Marquee Loop on Mobile) */}
            <div className="hero-attached-benefits-track duplicate" aria-hidden="true">
              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 7 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY CONTENT ── */}
      <div className="care-content-container">
        <div className="care-wrapper">

          {/* 3 QUICK CONTACT HIGHLIGHT CARDS WITH INDIVIDUAL CALL & EMAIL LINKS */}
          <div className="quick-contact-grid">
            {/* Head Office Phone Card */}
            <div className="quick-contact-card" style={{ cursor: 'default' }}>
              <div className="quick-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <div className="quick-card-tag">Head Office & Wholesale</div>
                <div className="quick-card-title" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href="tel:0770716212" style={{ color: 'inherit', textDecoration: 'underline' }}>077 071 6212</a>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <a href="tel:0778778555" style={{ color: 'inherit', textDecoration: 'underline' }}>077 877 8555</a>
                </div>
                <div className="quick-card-sub">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2e7d32', display: 'inline-block', flexShrink: 0 }} />
                  Touch number to call directly
                </div>
              </div>
            </div>

            {/* KCC Showroom Card */}
            <a href="tel:0779779666" className="quick-contact-card">
              <div className="quick-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="quick-card-tag">Kandy City Centre</div>
                <div className="quick-card-title" style={{ textDecoration: 'underline' }}>077 977 9666</div>
                <div className="quick-card-sub">
                  Level 3 - KCC, Sri Lanka
                </div>
              </div>
            </a>

            {/* Official Emails Card (Both Emails) */}
            <div className="quick-contact-card" style={{ cursor: 'default' }}>
              <div className="quick-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <div className="quick-card-tag">Official Concierge Emails</div>
                <div className="quick-card-title" style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="mailto:support@winsorbrand.com" style={{ color: '#8b6914', textDecoration: 'underline', fontWeight: 600 }}>support@winsorbrand.com</a>
                  <a href="mailto:winsorwatches@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>winsorwatches@gmail.com</a>
                </div>
                <div className="quick-card-sub" style={{ marginTop: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  24/7 Email Concierge Support
                </div>
              </div>
            </div>
          </div>

          {success ? (
            /* SUCCESS PANEL */
            <div className="success-card">
              <div className="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="success-title">Message Submitted Successfully</h2>
              <p className="success-text">
                Your support inquiry has been securely transmitted. A Winsor Customer Care concierge representative will review your request and contact you within 12 business hours.
              </p>
              <button onClick={() => setSuccess(false)} className="submit-btn" style={{ maxWidth: '280px', margin: '0 auto' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              {/* TWO COLUMN GRID */}
              <div className="care-grid">

                {/* Left Column: Brand details */}
                <div className="care-details-card">
                  <div className="details-header-tag">OFFICIAL BRAND CARE</div>
                  <h3 className="details-title">Care Boutique</h3>
                  <p className="details-paragraph">
                    For over three decades, Winsor has provided handcrafted horological excellence. Our concierge team stands ready to assist with servicing, inquiries, warranty registrations, wholesale registrations, and shop purchases.
                  </p>

                  <div className="contact-info-block">
                    <div className="contact-info-row">
                      <div className="info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div>
                        <div className="info-label">Head Office & Wholesale Inquiries</div>
                        <div className="info-value">
                          <a href="tel:0770716212" className="contact-link">077 071 6212</a>,{' '}
                          <a href="tel:0778778555" className="contact-link">077 877 8555</a>
                        </div>
                      </div>
                    </div>

                    <div className="contact-info-row">
                      <div className="info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <div className="info-label">Kandy City Centre Showroom</div>
                        <div className="info-value">
                          Level 3 - Kandy City Centre (KCC), Sri Lanka<br />
                          <a href="tel:0779779666" className="contact-link">077 977 9666</a>
                        </div>
                      </div>
                    </div>

                    <div className="contact-info-row">
                      <div className="info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <div className="info-label">Official Emails</div>
                        <div className="info-value">
                          <a href="mailto:support@winsorbrand.com" className="contact-link" style={{ fontWeight: 600, color: '#8b6914' }}>support@winsorbrand.com</a><br />
                          <a href="mailto:winsorwatches@gmail.com" className="contact-link">winsorwatches@gmail.com</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="headquarters-box">
                    <div className="info-label" style={{ marginBottom: '8px' }}>Wholesale & Retailer Purchases</div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(26,18,9,0.68)', lineHeight: 1.6 }}>
                      To register for wholesale or to purchase timepieces for your shop, contact our Head Office directly:<br />
                      <span style={{ display: 'block', marginTop: '6px' }}>
                        <strong>Phone:</strong> <a href="tel:0770716212" className="contact-link">077 071 6212</a> / <a href="tel:0778778555" className="contact-link">077 877 8555</a>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Column: Support Form Card */}
                <div className="care-form-card">
                  <div className="form-header-tag">INQUIRY FORM</div>
                  <h3 className="form-title">Secure Inquiry Submission</h3>
                  <p className="form-desc">
                    Submit your request directly to our customer support concierge desk. All submissions are encrypted and handled with care.
                  </p>

                  <form onSubmit={handleSubmit}>

                    <div className="form-row-grid">
                      {/* Name */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="name">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          Username / Full Name
                        </label>
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
                        <label className="input-label" htmlFor="mobile">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          Mobile Number
                        </label>
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
                            style={{ flex: 1, minWidth: 0 }}
                            required
                            placeholder="77 123 4567"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="email">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        Email Address
                      </label>
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
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="subject">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                        Subject
                      </label>
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
                      <label className="input-label" htmlFor="message">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        className="textarea-field"
                        required
                        placeholder="Detail your inquiry here (maximum 1000 characters)..."
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
                          Submitting Inquiry...
                        </>
                      ) : (
                        <>
                          Send Inquiry <span>→</span>
                        </>
                      )}
                    </button>

                  </form>
                </div>

              </div>

              {/* GOOGLE MAPS SECTION */}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Open in Google Maps
                  </a>

                  <a
                    href="tel:+94112345678"
                    className="map-link-btn"
                    style={{ background: '#1a1209', color: '#ffffff', borderColor: '#1a1209' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call Showroom Desk
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
