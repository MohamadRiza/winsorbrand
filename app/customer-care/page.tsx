'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import toast from 'react-hot-toast';
import CareHeroTypewriter from './CareHeroTypewriter';

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

const INQUIRY_TOPICS = [
  'General Inquiry',
  'Warranty Service',
  'Bracelet Sizing',
  'Showroom Appointment',
  'Wholesale & Retailer',
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

  const handleSelectTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      subject: topic,
    }));
  };

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
          const userEmail = user.primaryEmailAddress?.emailAddress || '';
          const params = new URLSearchParams();
          if (user.id) params.set('clerkId', user.id);
          if (userEmail) params.set('email', userEmail);
          const res = await fetch(`/api/customer/profile?${params.toString()}`);
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

    // 1. Username / Name: maximum 100 characters
    if (name === 'name' && value.length > 100) return;

    // 2. Mobile: strictly allow digits only, maximum 15 digits
    if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 15) return;
      setFormData(prev => ({
        ...prev,
        mobile: digitsOnly,
      }));
      return;
    }

    // 3. Subject: maximum 200 characters
    if (name === 'subject' && value.length > 200) return;

    // 4. Message: maximum 1000 characters
    if (name === 'message' && value.length > 1000) return;

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

    if (name.trim().length > 100) {
      toast.error('Username cannot exceed 100 characters.');
      return;
    }

    if (!/^\d+$/.test(mobile.trim())) {
      toast.error('Mobile number can only contain numbers.');
      return;
    }

    if (mobile.trim().length < 6 || mobile.trim().length > 15) {
      toast.error('Please enter a valid mobile number (6 to 15 digits).');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Email address must contain an "@" symbol.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (subject.trim().length > 200) {
      toast.error('Subject cannot exceed 200 characters.');
      return;
    }

    if (message.trim().length > 1000) {
      toast.error('Message cannot exceed 1000 characters.');
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

  return (
    <main style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600;700&display=swap');

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── LUXURY HERO HEADER ── */
        .care-hero-section {
          position: relative;
          min-height: 480px;
          background-image: 
            linear-gradient(180deg, rgba(20, 16, 12, 0.75) 0%, rgba(18, 14, 10, 0.65) 50%, rgba(16, 12, 8, 0.92) 100%),
            radial-gradient(ellipse at 50% 30%, rgba(223, 177, 91, 0.18) 0%, transparent 65%),
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
          color: #ffffff;
          padding: 120px 24px 60px;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 20px;
          background: rgba(139, 105, 20, 0.25);
          border: 1px solid rgba(223, 177, 91, 0.45);
          border-radius: 30px;
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-weight: 600;
          color: #dfb15b;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .hero-highlights-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .hero-highlight-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 0.02em;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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
          max-width: 1360px;
          margin: -32px auto 20px;
          padding: 0 4%;
          width: 100%;
        }
        .hero-attached-benefits-bar {
          position: relative;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid rgba(20, 20, 20, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
          padding: 20px 32px;
          overflow: hidden;
        }
        .hero-attached-benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #141414;
        }
        .hero-attached-benefit-item svg {
          color: #8B6914;
          flex-shrink: 0;
        }
        .hero-attached-benefit-item h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 0.01em;
          color: #141414;
          white-space: nowrap;
        }
        .hero-attached-benefit-item span {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.55);
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

        /* ── PAGE BODY CONTAINER: PURE WHITE ── */
        .care-content-container {
          background-color: #FFFFFF;
          padding: 24px 4% 80px;
          font-family: 'Jost', sans-serif;
          color: #141414;
        }

        .care-wrapper {
          max-width: 1260px;
          margin: 0 auto;
        }

        /* ── 3 QUICK CONTACT CARDS ── */
        .quick-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 44px;
        }

        .quick-contact-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .quick-contact-card:hover {
          transform: translateY(-3px);
          border-color: #8B6914;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.08);
        }

        .quick-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(139, 105, 20, 0.07);
          border: 1px solid rgba(139, 105, 20, 0.18);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .quick-contact-card:hover .quick-icon-circle {
          background: #8B6914;
          color: #FFFFFF;
          border-color: #70530E;
        }

        .quick-card-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8B6914;
          margin-bottom: 4px;
        }

        .quick-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 4px;
        }

        .quick-card-sub {
          font-size: 12px;
          color: rgba(20, 20, 20, 0.55);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .quick-action-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8B6914;
          margin-top: 10px;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .quick-action-link:hover {
          color: #5D460D;
        }

        /* ── TWO COLUMN MAIN GRID ── */
        .care-grid {
          display: grid;
          grid-template-columns: 440px 1fr;
          gap: 36px;
          align-items: flex-start;
        }

        /* ── LEFT COLUMN - BOUTIQUE DETAILS ── */
        .care-details-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.09);
          border-top: 3px solid #8B6914;
          border-radius: 12px;
          padding: 34px 30px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
        }

        .details-header-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #8B6914;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .details-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 30px;
          font-weight: 500;
          margin: 0 0 12px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .details-paragraph {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(20, 20, 20, 0.65);
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.08);
        }

        .care-assurances-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.08);
        }

        .care-assurance-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .care-assurance-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(139, 105, 20, 0.1);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .care-assurance-content h5 {
          font-size: 12.5px;
          font-weight: 600;
          margin: 0 0 2px;
          color: #141414;
        }

        .care-assurance-content p {
          font-size: 11.5px;
          line-height: 1.5;
          margin: 0;
          color: rgba(20, 20, 20, 0.55);
        }

        .contact-info-block {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .contact-info-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .info-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(139, 105, 20, 0.07);
          border: 1px solid rgba(139, 105, 20, 0.18);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .contact-info-row:hover .info-icon {
          background: #8B6914;
          color: #FFFFFF;
        }

        .info-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8B6914;
          margin-bottom: 3px;
        }

        .info-value {
          font-size: 13px;
          color: #141414;
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
          color: #5D460D;
          text-decoration: underline;
        }

        .headquarters-box {
          border: 1px solid rgba(20, 20, 20, 0.08);
          background: #FAFAFA;
          border-radius: 8px;
          padding: 16px 18px;
          margin-top: 18px;
        }

        /* ── RIGHT COLUMN - SUPPORT FORM ── */
        .care-form-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.09);
          border-top: 3px solid #8B6914;
          border-radius: 12px;
          padding: 36px 32px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
        }

        .form-header-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #8B6914;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .form-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 30px;
          font-weight: 500;
          margin: 0 0 6px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .form-desc {
          font-size: 13px;
          color: rgba(20, 20, 20, 0.58);
          margin-bottom: 22px;
          line-height: 1.5;
        }

        /* TOPIC PILLS */
        .topic-chips-container {
          margin-bottom: 20px;
        }

        .topic-chips-label {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #8B6914;
          margin-bottom: 8px;
        }

        .topic-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .topic-chip {
          background: #FAFAFA;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 20px;
          padding: 6px 13px;
          font-size: 11.5px;
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          color: #141414;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .topic-chip:hover {
          border-color: #8B6914;
          color: #8B6914;
        }

        .topic-chip.active {
          background: #8B6914;
          color: #FFFFFF;
          border-color: #8B6914;
        }

        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 18px;
          position: relative;
        }

        .input-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #141414;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .input-field {
          width: 100%;
          box-sizing: border-box;
          height: 46px;
          border: 1px solid rgba(20, 20, 20, 0.16);
          border-radius: 6px;
          padding: 0 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #141414;
          outline: none;
          background-color: #FFFFFF;
          transition: all 0.2s ease;
        }

        .input-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
        }

        .input-field:disabled {
          background-color: #F8F8F8;
          color: rgba(20, 20, 20, 0.45);
          border-color: rgba(20, 20, 20, 0.1);
          cursor: not-allowed;
        }

        .textarea-field {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(20, 20, 20, 0.16);
          border-radius: 6px;
          padding: 12px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #141414;
          outline: none;
          background-color: #FFFFFF;
          transition: all 0.2s ease;
          resize: none;
          min-height: 130px;
        }

        .textarea-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.12);
        }

        .char-counter {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.45);
          text-align: right;
          margin-top: 4px;
        }

        .lock-icon-container {
          position: absolute;
          right: 12px;
          top: 34px;
          color: #8B6914;
          display: flex;
          align-items: center;
        }

        .turnstile-box {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-start;
          padding: 8px;
          background: #FAFAFA;
          border-radius: 6px;
          border: 1px solid rgba(20, 20, 20, 0.08);
        }

        .submit-btn {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 15px 32px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.2);
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #AA8644 0%, #9C7A3C 100%);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.3);
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          background: rgba(139, 105, 20, 0.38);
          color: #FFFFFF;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .form-security-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          font-size: 11px;
          color: rgba(20, 20, 20, 0.48);
        }

        /* ── FLAGSHIP BOUTIQUE SHOWROOM & MAP SECTION ── */
        .map-section {
          margin-top: 64px;
          border-top: 1px solid rgba(20, 20, 20, 0.08);
          padding-top: 48px;
        }

        .map-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 16px;
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid rgba(139, 105, 20, 0.22);
          border-radius: 20px;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
          color: #8B6914;
          margin-bottom: 10px;
        }

        .map-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 34px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 6px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .map-subtitle {
          font-size: 13.5px;
          color: rgba(20, 20, 20, 0.58);
          text-align: center;
          margin: 0 auto 28px;
          max-width: 620px;
        }

        .map-info-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .map-info-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .map-info-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid rgba(139, 105, 20, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #8B6914;
        }

        .map-info-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8B6914;
          margin-bottom: 3px;
        }

        .map-info-text {
          font-size: 13px;
          color: #141414;
          font-weight: 500;
          line-height: 1.45;
        }

        .map-container {
          position: relative;
          width: 100%;
          height: 460px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(20, 20, 20, 0.12);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
        }

        .map-iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .map-action-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .map-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #FFFFFF;
          border: 1px solid #70530E;
          border-radius: 6px;
          padding: 13px 28px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.2);
        }

        .map-btn-primary:hover {
          background: linear-gradient(135deg, #AA8644 0%, #9C7A3C 100%);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.28);
          transform: translateY(-1px);
          color: #FFFFFF;
        }

        .map-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          color: #8B6914;
          border: 1.5px solid rgba(139, 105, 20, 0.35);
          border-radius: 6px;
          padding: 13px 28px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.25s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        }

        .map-btn-secondary:hover {
          background-color: #FAFAFA;
          color: #5D460D;
          border-color: #8B6914;
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.12);
          transform: translateY(-1px);
        }

        /* SUCCESS SCREEN */
        .success-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-top: 3px solid #8B6914;
          border-radius: 12px;
          padding: 56px 40px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          max-width: 640px;
          margin: 0 auto;
        }

        .success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(139, 105, 20, 0.1);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid rgba(139, 105, 20, 0.25);
        }

        .success-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          color: #141414;
          margin: 0 0 10px;
          font-weight: 500;
        }

        .success-text {
          font-size: 14px;
          color: rgba(20, 20, 20, 0.65);
          line-height: 1.65;
          margin: 0 0 28px;
        }

        /* ── RESPONSIVE STYLES ── */
        @media (max-width: 1024px) {
          .quick-contact-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .care-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .map-info-strip {
            grid-template-columns: 1fr;
            gap: 12px;
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
            height: 380px;
          }
        }

        @media (max-width: 640px) {
          .care-hero-section {
            min-height: 380px;
            padding: 100px 18px 48px;
            background-attachment: scroll;
          }
          .form-row-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .care-form-card, .care-details-card {
            padding: 24px 20px;
          }
          .map-container {
            height: 300px;
          }
          .map-action-row {
            flex-direction: column;
            width: 100%;
          }
          .map-btn-primary, .map-btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* ── LUXURY HERO HEADER SECTION ── */}
      <section className="care-hero-section">
        <div className="hero-badge-pill">
          <span>WINSOR CLIENT CONCIERGE</span>
        </div>

        {/* Hero Title & Subtitle */}
        <CareHeroTypewriter />

        <div className="hero-highlights-row">
          <div className="hero-highlight-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>Priority Response Within 12 Hours</span>
          </div>
          <div className="hero-highlight-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dfb15b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span>Official International Warranty</span>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 14 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>

            {/* Track 2 (Duplicate for Seamless Infinite Marquee Loop on Mobile) */}
            <div className="hero-attached-benefits-track duplicate" aria-hidden="true">
              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m12 6-2 4h4l-2 4" /></svg>
                <div>
                  <h4>Japan Movement</h4>
                  <span>UAE Registered Brand</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <h4>International Warranty</h4>
                  <span>Sri Lanka & UAE</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><line x1="16" y1="8" x2="20" y2="8" /><line x1="16" y1="12" x2="22" y2="12" /></svg>
                <div>
                  <h4>Free Shipping</h4>
                  <span>Island-wide in Sri Lanka</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                <div>
                  <h4>Easy Returns</h4>
                  <span>Within 14 Days</span>
                </div>
              </div>

              <div className="hero-attached-benefit-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <div>
                  <h4>Secure Payments</h4>
                  <span>100% Secure Checkout with payhere.lk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY CONTENT (PURE WHITE BACKGROUND) ── */}
      <div className="care-content-container">
        <div className="care-wrapper">

          {/* 3 QUICK CONTACT CHANNELS */}
          <div className="quick-contact-grid">
            {/* Head Office Phone Card */}
            <div className="quick-contact-card">
              <div className="quick-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="quick-card-tag">HEAD OFFICE & WHOLESALE</div>
                <div className="quick-card-title">
                  <a href="tel:0770716212" style={{ color: 'inherit', textDecoration: 'none' }}>077 071 6212</a>
                  <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span>
                  <a href="tel:0778778555" style={{ color: 'inherit', textDecoration: 'none' }}>077 877 8555</a>
                </div>
                <div className="quick-card-sub">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2e7d32', display: 'inline-block', flexShrink: 0 }} />
                  Monday – Saturday: 9:00 AM – 7:30 PM
                </div>
                <a href="tel:0770716212" className="quick-action-link">
                  Call Colombo Desk <span>→</span>
                </a>
              </div>
            </div>

            {/* KCC Showroom Card */}
            <div className="quick-contact-card">
              <div className="quick-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="quick-card-tag">KANDY BOUTIQUE SHOWROOM</div>
                <div className="quick-card-title">
                  <a href="tel:0779779666" style={{ color: 'inherit', textDecoration: 'none' }}>077 977 9666</a>
                </div>
                <div className="quick-card-sub">
                  Level 3 - Kandy City Centre (KCC), Sri Lanka
                </div>
                <a href="tel:0779779666" className="quick-action-link">
                  Call Kandy Boutique <span>→</span>
                </a>
              </div>
            </div>

            {/* Official Emails Card */}
            <div className="quick-contact-card">
              <div className="quick-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="quick-card-tag">CONCIERGE EMAIL DESK</div>
                <div className="quick-card-title" style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="mailto:support@winsorbrand.com" style={{ color: '#8B6914', textDecoration: 'none', fontWeight: 600 }}>support@winsorbrand.com</a>
                  <a href="mailto:winsorwatches@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>winsorwatches@gmail.com</a>
                </div>
                <div className="quick-card-sub">
                  Priority Response Within 12 Business Hours
                </div>
                <a href="mailto:support@winsorbrand.com" className="quick-action-link">
                  Email Concierge <span>→</span>
                </a>
              </div>
            </div>
          </div>

          {success ? (
            /* SUCCESS PANEL */
            <div className="success-card">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="success-title">Inquiry Submitted Successfully</h2>
              <p className="success-text">
                Your support inquiry has been received. A Winsor Customer Care representative will review your request and contact you within 12 business hours.
              </p>
              <button onClick={() => setSuccess(false)} className="submit-btn" style={{ maxWidth: '260px', margin: '0 auto' }}>
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
                  <h3 className="details-title">Care Boutique & Services</h3>
                  <p className="details-paragraph">
                    Winsor is dedicated to dependable watchmaking and lasting customer service. Our specialist team stands ready to assist with movement diagnostics, international warranty coverage, bracelet sizing, wholesale partnerships, and private showroom viewings.
                  </p>

                  {/* 4 Core Horology Care Assurances */}
                  <div className="care-assurances-list">
                    <div className="care-assurance-item">
                      <div className="care-assurance-bullet">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="care-assurance-content">
                        <h5>Movement Diagnostics & Battery Service</h5>
                        <p>Certified evaluation of Japanese quartz & automatic movement accuracy.</p>
                      </div>
                    </div>

                    <div className="care-assurance-item">
                      <div className="care-assurance-bullet">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="care-assurance-content">
                        <h5>Official 2-Year International Warranty</h5>
                        <p>Honored across Sri Lanka boutiques and our UAE registered headquarters.</p>
                      </div>
                    </div>

                    <div className="care-assurance-item">
                      <div className="care-assurance-bullet">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="care-assurance-content">
                        <h5>Complimentary Bracelet Link Sizing</h5>
                        <p>Instant precision wrist adjustment at our boutiques or with guided assistance.</p>
                      </div>
                    </div>

                    <div className="care-assurance-item">
                      <div className="care-assurance-bullet">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="care-assurance-content">
                        <h5>Authentic Components & Straps</h5>
                        <p>Factory sapphire crystals, stainless steel links, and genuine leather bands.</p>
                      </div>
                    </div>
                  </div>

                  <div className="contact-info-block">
                    <div className="contact-info-row">
                      <div className="info-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <div className="info-label">Official Emails</div>
                        <div className="info-value">
                          <a href="mailto:support@winsorbrand.com" className="contact-link" style={{ fontWeight: 600, color: '#8B6914' }}>support@winsorbrand.com</a><br />
                          <a href="mailto:winsorwatches@gmail.com" className="contact-link">winsorwatches@gmail.com</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="headquarters-box">
                    <div className="info-label" style={{ marginBottom: '4px' }}>Wholesale & Authorized Dealerships</div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(20,20,20,0.68)', lineHeight: 1.55 }}>
                      To register as an authorized retail jeweler or for bulk timepiece allocations across Sri Lanka, contact our Head Office directly:<br />
                      <span style={{ display: 'block', marginTop: '6px' }}>
                        <strong>Direct Desk:</strong> <a href="tel:0770716212" className="contact-link">077 071 6212</a> / <a href="tel:0778778555" className="contact-link">077 877 8555</a>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Column: Support Form Card */}
                <div className="care-form-card">
                  <div className="form-header-tag">INQUIRY DESK</div>
                  <h3 className="form-title">Submit an Inquiry</h3>
                  <p className="form-desc">
                    Submit your request directly to our customer support concierge desk. All submissions are encrypted and handled with care.
                  </p>

                  <form onSubmit={handleSubmit}>

                    {/* Quick Select Topic Preset Chips */}
                    <div className="topic-chips-container">
                      <div className="topic-chips-label">Inquiry Topic:</div>
                      <div className="topic-chips-row">
                        {INQUIRY_TOPICS.map(topic => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => handleSelectTopic(topic)}
                            className={`topic-chip ${formData.subject === topic ? 'active' : ''}`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-row-grid">
                      {/* Name */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="name">
                          Username / Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          maxLength={100}
                          className="input-field"
                          required
                          placeholder="Your full name"
                          disabled={loading}
                        />
                      </div>

                      {/* Mobile */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="mobile">
                          Mobile Number
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            name="mobileCode"
                            value={formData.mobileCode}
                            onChange={handleInputChange}
                            className="input-field"
                            style={{ width: '105px', padding: '0 6px', fontSize: '12.5px', cursor: 'pointer' }}
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
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End'];
                              if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
                              if (!/^[0-9]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData('text');
                              const numeric = pasted.replace(/\D/g, '').slice(0, 15);
                              setFormData(prev => ({ ...prev, mobile: numeric }));
                            }}
                            maxLength={15}
                            className="input-field"
                            style={{ flex: 1, minWidth: 0 }}
                            required
                            placeholder="771234567"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="email">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        maxLength={150}
                        className="input-field"
                        required
                        placeholder="Your email address (e.g. name@example.com)"
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
                        Subject
                      </label>
                      <input
                        id="subject"
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        maxLength={200}
                        className="input-field"
                        required
                        placeholder="e.g. Timepiece servicing inquiry"
                        disabled={loading}
                      />
                      <div className="char-counter">
                        {formData.subject.length} / 200 Characters
                      </div>
                    </div>

                    {/* Message */}
                    <div className="input-group">
                      <label className="input-label" htmlFor="message">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        maxLength={1000}
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
                          <div className="shimmer-circle" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', animation: 'spin 1s linear infinite' }} />
                          Submitting Inquiry...
                        </>
                      ) : !turnstileToken ? (
                        <>
                          Complete Security Verification Above <span>→</span>
                        </>
                      ) : (
                        <>
                          Send Inquiry <span>→</span>
                        </>
                      )}
                    </button>

                    <div className="form-security-footer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <span>256-Bit SSL Encrypted Channel • Handled by Winsor Customer Care</span>
                    </div>

                  </form>
                </div>

              </div>

              {/* ── FLAGSHIP BOUTIQUE SHOWROOM & MAP SECTION ── */}
              <div className="map-section">
                <div style={{ textAlign: 'center' }}>
                  <div className="map-badge-pill">
                    <span>AUTHORIZED SHOWROOM</span>
                  </div>
                </div>
                <h2 className="map-title">Flagship Boutique & Showroom</h2>
                <p className="map-subtitle">Experience Winsor timepieces, personalized fittings, and dedicated customer care in person at our Colombo showroom.</p>

                {/* Boutique Key Information Cards */}
                <div className="map-info-strip">
                  <div className="map-info-card">
                    <div className="map-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div>
                      <div className="map-info-label">Colombo Flagship Showroom</div>
                      <div className="map-info-text">Happy Time (Pvt) Ltd, 49A Keyzer Street, Colombo 11 (Pettah)</div>
                    </div>
                  </div>

                  <div className="map-info-card">
                    <div className="map-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div>
                      <div className="map-info-label">Operating Hours</div>
                      <div className="map-info-text">Monday – Saturday: 9:30 AM – 7:30 PM (Sunday Closed)</div>
                    </div>
                  </div>

                  <div className="map-info-card">
                    <div className="map-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </div>
                    <div>
                      <div className="map-info-label">Showroom Direct Line</div>
                      <div className="map-info-text">
                        <a href="tel:0770716212" className="contact-link">077 071 6212</a> / <a href="tel:0778778555" className="contact-link">077 877 8555</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="map-container">
                  <iframe
                    className="map-iframe"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.6726214532677!2d79.8485117!3d6.9368997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259261ada6aad%3A0x64dff49a1c0ccff2!2sHappy%20Time%20(Pvt)%20Ltd%20-%20Colombo%2011!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                    allowFullScreen={true}
                    loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="map-action-row">
                  <a
                    href="tel:0770716212"
                    className="map-btn-primary"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call Colombo Showroom
                  </a>

                  <a
                    href="https://www.google.com/maps/place/Happy+Time+(Pvt)+Ltd+-+Colombo+11/@6.9368997,79.8485117,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae259261ada6aad:0x64dff49a1c0ccff2!8m2!3d6.9368997!4d79.8510866!16s%2Fg%2F11qp2yyysl?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn-secondary"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Open in Google Maps
                  </a>

                  <a
                    href="tel:0779779666"
                    className="map-btn-secondary"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    Call Kandy Showroom
                  </a>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </main>
  );
}
