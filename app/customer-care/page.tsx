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

    // Username / Name validation (max 100 characters)
    if (name.trim().length > 100) {
      toast.error('Username cannot exceed 100 characters.');
      return;
    }

    // Mobile validation (strictly numbers only)
    if (!/^\d+$/.test(mobile.trim())) {
      toast.error('Mobile number can only contain numbers.');
      return;
    }

    if (mobile.trim().length < 6 || mobile.trim().length > 15) {
      toast.error('Please enter a valid mobile number (6 to 15 digits).');
      return;
    }

    // Email validation (must contain '@' and follow valid email pattern)
    if (!email.includes('@')) {
      toast.error('Email address must contain an "@" symbol.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    // Subject validation (max 200 characters)
    if (subject.trim().length > 200) {
      toast.error('Subject cannot exceed 200 characters.');
      return;
    }

    // Message validation (max 1000 characters)
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
    <main>
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
            linear-gradient(180deg, rgba(24, 18, 12, 0.78) 0%, rgba(20, 15, 10, 0.68) 50%, rgba(22, 17, 11, 0.94) 100%),
            radial-gradient(ellipse at 50% 35%, rgba(223, 177, 91, 0.18) 0%, transparent 65%),
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
          gap: 10px;
          padding: 8px 22px;
          background: rgba(139, 105, 20, 0.28);
          border: 1.5px solid rgba(223, 177, 91, 0.5);
          border-radius: 30px;
          font-size: 10.5px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          font-weight: 600;
          color: #dfb15b;
          margin-bottom: 22px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
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
          color: rgba(250, 247, 240, 0.9);
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
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(223, 177, 91, 0.35);
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.03em;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          background: rgba(255, 255, 255, 0.88);
          border-radius: 16px;
          border: 1.5px solid rgba(139, 105, 20, 0.24);
          box-shadow: 0 16px 40px rgba(139, 105, 20, 0.08), 0 4px 14px rgba(0, 0, 0, 0.03);
          padding: 22px 34px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          overflow: hidden;
        }
        .hero-attached-benefit-item {
          display: flex;
          align-items: center;
          gap: 14px;
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
          font-size: 10.5px;
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
          padding: 24px 4% 80px;
          font-family: 'Jost', sans-serif;
          color: #141414;
        }

        .care-wrapper {
          max-width: 1300px;
          margin: 0 auto;
        }

        /* ── 3 QUICK CONTACT HIGHLIGHT CARDS ── */
        .quick-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          margin-bottom: 44px;
        }

        .quick-contact-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          border-radius: 16px;
          padding: 24px 26px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 10px 30px rgba(139, 105, 20, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }

        .quick-contact-card:hover {
          transform: translateY(-4px);
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(139, 105, 20, 0.16), 0 4px 14px rgba(0, 0, 0, 0.04);
          border-color: #8B6914;
        }

        .quick-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139,105,20,0.14) 0%, rgba(223,177,91,0.24) 100%);
          border: 1.5px solid rgba(139,105,20,0.32);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .quick-contact-card:hover .quick-icon-circle {
          transform: scale(1.08);
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          border-color: #70530E;
        }

        .quick-card-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8B6914;
          margin-bottom: 4px;
        }

        .quick-card-title {
          font-size: 14.5px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 3px;
          word-break: break-word;
        }

        .quick-card-sub {
          font-size: 12px;
          color: rgba(20, 20, 20, 0.55);
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
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          padding: 38px;
          box-shadow: 0 16px 44px rgba(139, 105, 20, 0.06), 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .care-details-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #9C7A3C 0%, #DFB15B 50%, #8B6914 100%);
        }

        .details-header-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #8B6914;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .details-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 500;
          margin: 0 0 14px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .details-paragraph {
          font-size: 13.5px;
          line-height: 1.7;
          color: rgba(20, 20, 20, 0.65);
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(139, 105, 20, 0.12);
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
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(139, 105, 20, 0.08) 0%, rgba(223, 177, 91, 0.16) 100%);
          border: 1px solid rgba(139, 105, 20, 0.25);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .contact-info-row:hover .info-icon {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.25);
        }

        .info-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #8B6914;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 13.5px;
          color: #141414;
          font-weight: 500;
          line-height: 1.55;
        }

        .contact-link {
          color: #8B6914;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .contact-link:hover {
          color: #5d460d;
          text-decoration: underline;
        }

        .headquarters-box {
          border-top: 1.5px dashed rgba(139, 105, 20, 0.3);
          padding-top: 22px;
          margin-top: 14px;
          background: rgba(250, 247, 240, 0.7);
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-radius: 12px;
          padding: 18px 20px;
        }

        /* ── RIGHT COLUMN - SUPPORT FORM ── */
        .care-form-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          padding: 40px;
          box-shadow: 0 16px 44px rgba(139, 105, 20, 0.06), 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .care-form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #8B6914 0%, #DFB15B 50%, #9C7A3C 100%);
        }

        .form-header-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #8B6914;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 500;
          margin: 0 0 8px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .form-desc {
          font-size: 13.5px;
          color: rgba(20, 20, 20, 0.6);
          margin-bottom: 28px;
          line-height: 1.55;
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
          letter-spacing: 0.1em;
          color: #8B6914;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .input-field {
          width: 100%;
          box-sizing: border-box;
          height: 48px;
          border: 1.5px solid rgba(139, 105, 20, 0.22);
          border-radius: 8px;
          padding: 0 16px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #141414;
          outline: none;
          background-color: #FAF8F5;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 3px rgba(26, 18, 9, 0.02);
          transition: all 0.25s ease;
        }

        .input-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3.5px rgba(223, 177, 91, 0.2), 0 4px 12px rgba(139, 105, 20, 0.08);
          background-color: #ffffff;
        }

        .input-field:disabled {
          background-color: rgba(26, 18, 9, 0.04);
          color: rgba(20, 20, 20, 0.5);
          border-color: rgba(139, 105, 20, 0.15);
          cursor: not-allowed;
        }

        .textarea-field {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid rgba(139, 105, 20, 0.22);
          border-radius: 8px;
          padding: 14px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #141414;
          outline: none;
          background-color: #FAF8F5;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 3px rgba(26, 18, 9, 0.02);
          transition: all 0.25s ease;
          resize: none;
          min-height: 140px;
        }

        .textarea-field:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3.5px rgba(223, 177, 91, 0.2), 0 4px 12px rgba(139, 105, 20, 0.08);
          background-color: #ffffff;
        }

        .char-counter {
          font-size: 11px;
          color: rgba(20, 20, 20, 0.45);
          text-align: right;
          margin-top: 6px;
          font-weight: 500;
        }

        .lock-icon-container {
          position: absolute;
          right: 14px;
          top: 38px;
          color: #8B6914;
          display: flex;
          align-items: center;
        }

        .turnstile-box {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-start;
          padding: 10px;
          background: rgba(250, 247, 240, 0.7);
          border-radius: 8px;
          border: 1px solid rgba(139, 105, 20, 0.18);
        }

        .submit-btn {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 50%, #70530E 100%);
          color: #ffffff;
          border: 1px solid rgba(223, 177, 91, 0.4);
          border-radius: 8px;
          padding: 16px 36px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.28);
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #AA8644 0%, #9C7A3C 50%, #7E5F12 100%);
          box-shadow: 0 12px 28px rgba(139, 105, 20, 0.38);
          transform: translateY(-2px);
        }

        .submit-btn:disabled {
          background: linear-gradient(135deg, rgba(156, 122, 60, 0.48) 0%, rgba(139, 105, 20, 0.4) 100%);
          color: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(139, 105, 20, 0.25);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        /* ── FLAGSHIP BOUTIQUE & SHOWROOM MAP SECTION ── */
        .map-section {
          margin-top: 64px;
          border-top: 1.5px solid rgba(139, 105, 20, 0.18);
          padding-top: 48px;
        }

        .map-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 18px;
          background: rgba(139, 105, 20, 0.12);
          border: 1px solid rgba(139, 105, 20, 0.3);
          border-radius: 24px;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
          color: #8B6914;
          margin-bottom: 12px;
        }

        .map-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 8px;
          color: #141414;
          letter-spacing: 0.02em;
        }

        .map-subtitle {
          font-size: 14px;
          color: rgba(20, 20, 20, 0.6);
          text-align: center;
          margin: 0 0 28px;
          max-width: 650px;
          margin-left: auto;
          margin-right: auto;
        }

        .map-info-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .map-info-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: 0 4px 14px rgba(139, 105, 20, 0.04);
        }

        .map-info-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(139, 105, 20, 0.1) 0%, rgba(223, 177, 91, 0.2) 100%);
          border: 1px solid rgba(139, 105, 20, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #8B6914;
        }

        .map-info-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #8B6914;
          margin-bottom: 4px;
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
          height: 480px;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid rgba(139, 105, 20, 0.28);
          box-shadow: 0 20px 48px rgba(139, 105, 20, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03);
          margin-bottom: 28px;
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

        .map-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          border: 1px solid #70530E;
          border-radius: 8px;
          padding: 13px 30px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.28);
        }

        .map-btn-primary:hover {
          background: linear-gradient(135deg, #AA8644 0%, #9C7A3C 100%);
          box-shadow: 0 10px 26px rgba(139, 105, 20, 0.38);
          transform: translateY(-2px);
          color: #ffffff;
        }

        .map-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #8B6914;
          border: 1.5px solid rgba(139, 105, 20, 0.38);
          border-radius: 8px;
          padding: 13px 30px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.05);
        }

        .map-btn-secondary:hover {
          background-color: #FAF8F5;
          color: #70530E;
          border-color: #8B6914;
          box-shadow: 0 8px 24px rgba(139, 105, 20, 0.18);
          transform: translateY(-2px);
        }

        /* SUCCESS SCREEN */
        .success-card {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(139, 105, 20, 0.3);
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 18px 48px rgba(139, 105, 20, 0.08);
          max-width: 680px;
          margin: 0 auto;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(139, 105, 20, 0.12);
          color: #8B6914;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border: 1.5px solid rgba(139, 105, 20, 0.35);
        }

        .success-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          color: #141414;
          margin: 0 0 12px;
          font-weight: 500;
        }

        .success-text {
          font-size: 14.5px;
          color: rgba(20, 20, 20, 0.65);
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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span>WINSOR BOUTIQUE CONCIERGE</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </div>

        {/* Animated Hero Title & Subtitle with Luxury Typewriter & Erase Effect */}
        <CareHeroTypewriter />

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
                  <span>Within 14 Days</span>
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
                  <span>Within 14 Days</span>
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
                  <a href="mailto:support@winsorbrand.com" style={{ color: '#8B6914', textDecoration: 'underline', fontWeight: 600 }}>support@winsorbrand.com</a>
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
                    Winsor is dedicated to dependable watchmaking and lasting customer service. Our support team stands ready to assist with servicing, inquiries, warranty registrations, wholesale partnerships, and showroom purchases.
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
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(20,20,20,0.7)', lineHeight: 1.6 }}>
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
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
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
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
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
                      <div className="char-counter" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                        {formData.subject.length} / 200 Characters
                      </div>
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
                          <div className="shimmer-circle" style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', animation: 'spin 1s linear infinite' }} />
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

                  </form>
                </div>

              </div>

              {/* GOOGLE MAPS SECTION */}
              <div className="map-section">
                <div style={{ textAlign: 'center' }}>
                  <div className="map-badge-pill">
                    ★ OFFICIAL BOUTIQUE SHOWROOM ★
                  </div>
                </div>
                <h2 className="map-title">Flagship Boutique & Showroom</h2>
                <p className="map-subtitle">Experience Winsor timepieces, master horology consultation, and after-sales care in person at our flagship showroom.</p>

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
                      <div className="map-info-text">Mon – Sat: 9:30 AM – 7:30 PM (Sunday Closed)</div>
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
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="map-action-row">
                  <a
                    href="tel:0770716212"
                    className="map-btn-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Open in Google Maps
                  </a>

                  <a
                    href="tel:0779779666"
                    className="map-btn-secondary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    Call Kandy KCC Showroom
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
