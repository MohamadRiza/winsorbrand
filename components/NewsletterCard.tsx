'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface NewsletterCardProps {
  imageSrc?: string;
  badgeText?: string;
}

export default function NewsletterCard({
  imageSrc = '/collections_pg.webp',
  badgeText = 'WINSOR VIP INSIDER',
}: NewsletterCardProps) {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubscribing(true);
    try {
      // Send newsletter subscription
      await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          name: 'Newsletter VIP Subscriber',
          email,
          subject: 'VIP Newsletter Subscription',
          message: `Subscribed to Winsor VIP Newsletter updates from ${email}`,
        }),
      });

      toast.success('Thank you for subscribing! Welcome to Winsor VIP.');
      setEmail('');
    } catch {
      toast.success('Thank you for subscribing to Winsor updates!');
      setEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="w-full relative pt-6 pb-12" style={{ backgroundColor: '#ffffff' }}>
      <style>{`
        @keyframes newsletter-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }

        .newsletter-marquee-wrapper {
          background: #141414;
          color: #ffffff;
          padding: 16px 0;
          overflow: hidden;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          margin-bottom: 48px;
        }

        .newsletter-marquee-track {
          display: flex;
          align-items: center;
          gap: 28px;
          animation: newsletter-marquee 25s linear infinite;
          flex-shrink: 0;
          padding-right: 28px;
          font-size: 11px;
          letter-spacing: 0.18em;
          font-weight: 400;
          white-space: nowrap;
        }

        .newsletter-marquee-track span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .newsletter-ribbon-sep {
          opacity: 0.25;
          margin: 0 4px;
        }

        /* CARD MAIN CONTAINER */
        .newsletter-card-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(139, 105, 20, 0.2);
          background: linear-gradient(145deg, #FFFFFF 0%, #FAF8F5 45%, #F4EFEB 100%);
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
          box-shadow: 0 16px 48px -12px rgba(20, 20, 20, 0.08), 0 4px 16px rgba(139, 105, 20, 0.06);
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .newsletter-card-container:hover {
          border-color: rgba(139, 105, 20, 0.35);
          box-shadow: 0 24px 56px -12px rgba(20, 20, 20, 0.12), 0 6px 20px rgba(139, 105, 20, 0.1);
        }

        .newsletter-img-block {
          height: 100%;
          position: relative;
          min-height: 420px;
          overflow: hidden;
        }

        .newsletter-img-block img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .newsletter-card-container:hover .newsletter-img-block img {
          transform: scale(1.03);
        }

        .newsletter-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(20, 20, 20, 0.15) 0%, rgba(20, 20, 20, 0.4) 60%, rgba(20, 20, 20, 0.6) 100%);
        }

        .newsletter-img-badge {
          position: absolute;
          bottom: 24px;
          left: 24px;
          background: rgba(18, 18, 18, 0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 167, 83, 0.35);
          padding: 8px 16px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #DFB15B;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        }

        .newsletter-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dfb15b;
          box-shadow: 0 0 8px rgba(223, 177, 91, 0.6);
        }

        .newsletter-form-block {
          padding: 44px 7%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          background: transparent;
        }

        .newsletter-tag-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .newsletter-gold-line {
          height: 1px;
          width: 24px;
          background: linear-gradient(90deg, transparent, #8B6914);
        }
        .newsletter-gold-line:last-of-type {
          background: linear-gradient(90deg, #8B6914, transparent);
        }

        .newsletter-tag-text {
          font-size: 10.5px;
          color: #8b6914;
          letter-spacing: 0.25em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .newsletter-main-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 35px;
          font-weight: 500;
          color: #141414;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }

        .newsletter-main-desc {
          font-size: 13.5px;
          color: #555555;
          line-height: 1.65;
          margin: 0 0 24px;
        }

        .newsletter-perks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }

        .newsletter-perk-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(139, 105, 20, 0.16);
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(139, 105, 20, 0.04);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .newsletter-perk-item:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 105, 20, 0.45);
          box-shadow: 0 8px 20px rgba(139, 105, 20, 0.12);
          background: #ffffff;
        }

        .newsletter-perk-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236, 196, 120, 0.22) 0%, rgba(139, 105, 20, 0.12) 100%);
          border: 1px solid rgba(139, 105, 20, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .newsletter-perk-item:hover .newsletter-perk-icon {
          transform: scale(1.08);
        }

        .newsletter-perk-title {
          font-size: 11px;
          font-weight: 600;
          color: #141414;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 0 0 2px;
        }

        .newsletter-perk-desc {
          font-size: 10.5px;
          color: #666666;
          margin: 0;
          line-height: 1.25;
        }

        .newsletter-form-row {
          display: flex;
          flex-direction: row;
          gap: 10px;
          margin-bottom: 14px;
        }

        .newsletter-input-wrapper {
          position: relative;
          flex: 1;
        }

        .newsletter-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          height: 17px;
          color: #8B6914;
          pointer-events: none;
        }

        .newsletter-input-field {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(139, 105, 20, 0.25);
          padding: 14px 16px 14px 44px;
          font-size: 13px;
          font-family: inherit;
          border-radius: 6px;
          color: #141414;
          transition: all 0.25s ease;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02), 0 2px 6px rgba(139, 105, 20, 0.04);
        }

        .newsletter-input-field:focus {
          outline: none;
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.14);
          background: #ffffff;
        }

        .newsletter-submit-btn {
          background: linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%);
          color: #ffffff;
          border: 1px solid #8B6914;
          padding: 14px 26px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          font-family: 'Jost', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.28);
        }

        .newsletter-submit-btn:hover {
          background: linear-gradient(135deg, #B58F49 0%, #9C7A3C 100%);
          border-color: #B58F49;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(160, 124, 39, 0.42);
        }

        .newsletter-submit-btn:hover svg {
          transform: translateX(3px);
        }

        .newsletter-submit-btn svg {
          transition: transform 0.25s ease;
        }

        .newsletter-footer-note {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: #666666;
        }
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #666666;
        }

        @media (max-width: 1024px) {
          .newsletter-card-container {
            grid-template-columns: 1fr;
          }
          .newsletter-img-block {
            min-height: 260px;
          }
        }

        @media (max-width: 640px) {
          .newsletter-perks-grid {
            grid-template-columns: 1fr;
          }
          .newsletter-form-row {
            flex-direction: column;
          }
          .newsletter-submit-btn {
            justify-content: center;
            width: 100%;
          }
          .newsletter-form-block {
            padding: 32px 20px;
          }
        }
      `}</style>

      {/* ── BLACK MOVING MARQUEE SLIDER ── */}
      <div className="newsletter-marquee-wrapper">
        <div className="flex overflow-hidden whitespace-nowrap">
          {/* Duplicate track for seamless infinite scroll */}
          {[1, 2, 3].map((key) => (
            <div key={key} className="newsletter-marquee-track">
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8b6914' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                JAPAN MOVEMENT
              </span>
              <span className="newsletter-ribbon-sep">|</span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8b6914' }}><path d="M6 3h12l4 6-10 12L2 9z" /></svg>
                SAPPHIRE CRYSTAL
              </span>
              <span className="newsletter-ribbon-sep">|</span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8b6914' }}><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" /></svg>
                WATER RESISTANT
              </span>
              <span className="newsletter-ribbon-sep">|</span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8b6914' }}><circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" /></svg>
                PREMIUM MATERIALS
              </span>
              <span className="newsletter-ribbon-sep">|</span>
              <span style={{ color: '#dfb15b', fontWeight: 600 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#dfb15b' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                TRUSTED BY WATCH ENTHUSIASTS WORLDWIDE
              </span>
              <span className="newsletter-ribbon-sep">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LUXURY SUBSCRIBE VIP CARD ── */}
      <div className="newsletter-card-container shadow-2xl">
        {/* Left Side Image */}
        <div className="newsletter-img-block">
          <Image
            src={imageSrc}
            alt="Winsor Timepieces"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="newsletter-img-overlay" />
          <div className="newsletter-img-badge">
            <span className="newsletter-badge-dot" />
            <span className="font-mono uppercase tracking-widest text-[10px] font-semibold">{badgeText}</span>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="newsletter-form-block">
          <div className="newsletter-tag-container">
            <span className="newsletter-gold-line" />
            <span className="newsletter-tag-text">STAY IN THE LOOP</span>
          </div>

          <h3 className="newsletter-main-title">Subscribe To Winsor Updates</h3>
          <p className="newsletter-main-desc">
            Be the first to know about new timepiece launches, brand news, exclusive offers, and special promotions delivered straight to your inbox.
          </p>

          {/* Perks Grid */}
          <div className="newsletter-perks-grid">
            <div className="newsletter-perk-item">
              <div className="newsletter-perk-icon">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <h4 className="newsletter-perk-title">New Product Releases</h4>
                <p className="newsletter-perk-desc">First look at new watch collections</p>
              </div>
            </div>

            <div className="newsletter-perk-item">
              <div className="newsletter-perk-icon">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h4 className="newsletter-perk-title">News & Special Offers</h4>
                <p className="newsletter-perk-desc">Exclusive deals & brand updates</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubscribe} className="newsletter-form-row">
            <div className="newsletter-input-wrapper">
              <svg className="newsletter-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="newsletter-input-field"
                required
              />
            </div>
            <button type="submit" disabled={subscribing} className="newsletter-submit-btn">
              {subscribing ? 'SUBSCRIBING…' : 'SUBSCRIBE NOW →'}
            </button>
          </form>

          <div className="newsletter-footer-note">
            <svg className="w-3.5 h-3.5 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Instant updates. Zero spam. Unsubscribe anytime in 1-click.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
