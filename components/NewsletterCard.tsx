'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export interface NewsletterCardProps {
  imageSrc?: string;
  badgeText?: string;
  tagText?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  footnoteText?: string;
  hideMarquee?: boolean;
}

const MARQUEE_ITEMS = [
  {
    label: 'JAPAN MOVEMENT',
    highlight: false,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#c99a3b' }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'SAPPHIRE CRYSTAL',
    highlight: false,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#c99a3b' }}>
        <path d="M6 3h12l4 6-10 12L2 9z" />
      </svg>
    ),
  },
  {
    label: 'WATER RESISTANT',
    highlight: false,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#c99a3b' }}>
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
  },
  {
    label: 'PREMIUM MATERIALS',
    highlight: false,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#c99a3b' }}>
        <circle cx="12" cy="8" r="7" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
    ),
  },
  {
    label: 'TRUSTED BY WATCH ENTHUSIASTS WORLDWIDE',
    highlight: true,
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#dfb15b' }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

export default function NewsletterCard({
  imageSrc = '/collections_pg.webp',
  badgeText = 'WINSOR VIP INSIDER',
  tagText = 'STAY CONNECTED',
  title = 'Subscribe To Winsor Updates',
  description = 'Be the first to know about new arrivals, exclusive deals, private releases, and special collector offers.',
  buttonText = 'SUBSCRIBE NOW',
  footnoteText = 'Instant updates. Zero spam. Unsubscribe anytime in 1-click.',
  hideMarquee = false,
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
    <div className="w-full relative pt-6 pb-10" style={{ backgroundColor: 'transparent' }}>
      <style>{`
        @keyframes newsletter-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }

        .newsletter-marquee-wrapper {
          background: #11100E;
          color: #ffffff;
          padding: 15px 0;
          overflow: hidden;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          margin-bottom: 48px;
          border-top: 1px solid rgba(212, 175, 55, 0.16);
          border-bottom: 1px solid rgba(212, 175, 55, 0.16);
        }

        .newsletter-marquee-track {
          display: flex;
          align-items: center;
          gap: 28px;
          animation: newsletter-marquee 26s linear infinite;
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

        /* ── DARK COUTURE NEWSLETTER CARD ── */
        .newsletter-card-container {
          display: grid;
          grid-template-columns: 0.94fr 1.06fr;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(212, 175, 55, 0.28);
          background:
            radial-gradient(ellipse 68% 92% at 74% 48%, rgba(202, 150, 50, 0.23) 0%, rgba(139, 105, 20, 0.1) 44%, rgba(9, 8, 7, 0) 76%),
            radial-gradient(circle at 22% 52%, rgba(255, 255, 255, 0.04) 0%, transparent 56%),
            linear-gradient(112deg, #080706 0%, #0D0B09 48%, #15100A 82%, #0C0A07 100%);
          max-width: 1320px;
          width: 100%;
          min-height: 356px;
          margin: 0 auto;
          box-shadow:
            0 28px 64px -16px rgba(10, 8, 5, 0.34),
            0 10px 28px -8px rgba(139, 105, 20, 0.15),
            inset 0 1px 0 rgba(255, 236, 182, 0.16);
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .newsletter-card-container::after {
          content: '';
          position: absolute;
          inset: 9px;
          border-radius: 11px;
          border: 1px solid rgba(212, 175, 55, 0.09);
          pointer-events: none;
          z-index: 6;
        }

        .newsletter-card-container:hover {
          border-color: rgba(212, 175, 55, 0.44);
          box-shadow:
            0 32px 72px -16px rgba(10, 8, 5, 0.42),
            0 12px 32px -6px rgba(168, 128, 42, 0.22),
            inset 0 1px 0 rgba(255, 236, 182, 0.22);
        }

        .newsletter-img-block {
          height: 100%;
          position: relative;
          min-height: 356px;
          overflow: hidden;
          background: transparent;
          -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 56%, rgba(0, 0, 0, 0.72) 76%, rgba(0, 0, 0, 0) 100%);
          mask-image: linear-gradient(90deg, #000 0%, #000 56%, rgba(0, 0, 0, 0.72) 76%, rgba(0, 0, 0, 0) 100%);
        }

        .newsletter-img-block img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          transition: transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .newsletter-card-container:hover .newsletter-img-block img {
          transform: scale(1.035);
        }

        .newsletter-img-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(8, 7, 6, 0.34) 0%, rgba(8, 7, 6, 0) 24%, rgba(8, 7, 6, 0) 74%, rgba(8, 7, 6, 0.56) 100%);
        }

        .newsletter-img-badge {
          position: absolute;
          bottom: 22px;
          left: 22px;
          z-index: 4;
          background: rgba(12, 10, 8, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          padding: 7px 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #E7C374;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.42);
        }

        .newsletter-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e7c374;
          box-shadow: 0 0 8px rgba(231, 195, 116, 0.75);
        }

        .newsletter-form-block {
          padding: 48px 7% 48px 54px;
          margin-left: -40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 5;
          background: transparent;
        }

        .newsletter-envelope-watermark {
          position: absolute;
          top: 26px;
          right: 34px;
          width: 64px;
          height: 48px;
          color: #DFB55F;
          opacity: 0.14;
          transform: rotate(-12deg);
          pointer-events: none;
        }

        .newsletter-tag-container {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .newsletter-tag-text {
          font-family: 'Jost', sans-serif;
          font-size: 10.5px;
          color: #DFB55F;
          letter-spacing: 0.25em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .newsletter-gold-line {
          height: 1px;
          width: 46px;
          background: linear-gradient(90deg, #D9AF56 0%, rgba(217, 175, 86, 0.35) 60%, transparent 100%);
        }

        .newsletter-main-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(29px, 3vw, 42px);
          font-weight: 500;
          color: #FFFFFF;
          margin: 0 0 12px;
          letter-spacing: -0.005em;
          line-height: 1.12;
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.38);
        }

        .newsletter-main-desc {
          font-family: 'Jost', sans-serif;
          font-size: 14.5px;
          color: rgba(242, 236, 224, 0.78);
          line-height: 1.62;
          margin: 0 0 28px;
          max-width: 470px;
        }

        /* ── UNIFIED WHITE + METALLIC GOLD ACTION CAPSULE ── */
        .newsletter-form-capsule {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          width: 100%;
          max-width: 540px;
          border-radius: 10px;
          background: #FFFFFF;
          overflow: hidden;
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(212, 175, 55, 0.28);
          transition: box-shadow 0.25s ease;
        }

        .newsletter-form-capsule:focus-within {
          box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.52),
            0 0 0 2.5px rgba(223, 177, 91, 0.58);
        }

        .newsletter-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .newsletter-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          height: 17px;
          color: #C29537;
          pointer-events: none;
        }

        .newsletter-input-field {
          width: 100%;
          height: 100%;
          min-height: 52px;
          background: #FFFFFF;
          border: none;
          padding: 14px 16px 14px 45px;
          font-size: 13.5px;
          font-family: 'Jost', sans-serif;
          color: #141414;
        }

        .newsletter-input-field::placeholder {
          color: #787065;
        }

        .newsletter-input-field:focus {
          outline: none;
        }

        .newsletter-submit-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #D5A84A 0%, #B38628 52%, #976C18 100%);
          color: #ffffff;
          border: none;
          padding: 0 28px;
          min-height: 52px;
          font-size: 11.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          font-family: 'Jost', sans-serif;
          cursor: pointer;
          transition: filter 0.25s ease, box-shadow 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255, 240, 195, 0.44);
        }

        .newsletter-submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 70%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
          transition: left 0.55s ease;
          pointer-events: none;
        }

        .newsletter-submit-btn:hover:not(:disabled)::before {
          left: 140%;
        }

        .newsletter-submit-btn:hover:not(:disabled) {
          filter: brightness(1.06);
        }

        .newsletter-submit-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .newsletter-submit-btn svg {
          transition: transform 0.25s ease;
        }

        .newsletter-submit-btn:hover:not(:disabled) svg {
          transform: translateX(3px);
        }

        .newsletter-footer-note {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          color: rgba(235, 227, 212, 0.58);
          line-height: 1.45;
        }

        .newsletter-footer-note svg {
          flex-shrink: 0;
          color: #D4AE57;
        }

        @media (max-width: 1024px) {
          .newsletter-card-container {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .newsletter-img-block {
            min-height: 270px;
            -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 62%, rgba(0, 0, 0, 0.6) 86%, rgba(0, 0, 0, 0) 100%);
            mask-image: linear-gradient(180deg, #000 0%, #000 62%, rgba(0, 0, 0, 0.6) 86%, rgba(0, 0, 0, 0) 100%);
          }
          .newsletter-img-overlay {
            background:
              linear-gradient(180deg, rgba(8, 7, 6, 0.16) 0%, rgba(8, 7, 6, 0) 34%, rgba(9, 8, 7, 0.42) 100%);
          }
          .newsletter-form-block {
            margin-left: 0;
            margin-top: -22px;
            padding: 20px 6% 42px;
          }
        }

        @media (max-width: 640px) {
          .newsletter-card-container {
            border-radius: 14px;
          }
          .newsletter-card-container::after {
            inset: 7px;
            border-radius: 9px;
          }
          .newsletter-img-block {
            min-height: 225px;
          }
          .newsletter-img-badge {
            bottom: 16px;
            left: 16px;
            padding: 6px 12px;
          }
          .newsletter-form-block {
            padding: 16px 20px 32px;
          }
          .newsletter-envelope-watermark {
            top: 8px;
            right: 18px;
            width: 48px;
            height: 36px;
          }
          .newsletter-main-desc {
            font-size: 13.5px;
            margin-bottom: 22px;
          }
          .newsletter-form-capsule {
            flex-direction: column;
            background: transparent;
            overflow: visible;
            box-shadow: none;
            gap: 10px;
            max-width: 100%;
          }
          .newsletter-form-capsule:focus-within {
            box-shadow: none;
          }
          .newsletter-input-field {
            border-radius: 10px;
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(212, 175, 55, 0.25);
          }
          .newsletter-input-field:focus {
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.4), 0 0 0 2.5px rgba(223, 177, 91, 0.58);
          }
          .newsletter-submit-btn {
            width: 100%;
            border-radius: 10px;
            padding: 14px 20px;
            box-shadow: 0 10px 26px rgba(151, 108, 24, 0.36), inset 0 1px 0 rgba(255, 240, 195, 0.4);
          }
        }
      `}</style>

      {/* ── BLACK MOVING MARQUEE SLIDER ── */}
      {!hideMarquee && (
        <div className="newsletter-marquee-wrapper">
          <div className="flex overflow-hidden whitespace-nowrap">
            {[1, 2, 3].map((key) => (
              <div key={key} className="newsletter-marquee-track">
                {MARQUEE_ITEMS.map((item) => (
                  <React.Fragment key={item.label}>
                    <span style={item.highlight ? { color: '#dfb15b', fontWeight: 600 } : undefined}>
                      {item.icon}
                      {item.label}
                    </span>
                    <span className="newsletter-ribbon-sep">|</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LUXURY DARK COUTURE NEWSLETTER CARD ── */}
      <div className="newsletter-card-container">
        {/* Left Seamless Watch Photography */}
        <div className="newsletter-img-block">
          <Image
            src={imageSrc}
            alt="Winsor Timepieces"
            fill
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
            priority
          />
          <div className="newsletter-img-overlay" />
          <div className="newsletter-img-badge">
            <span className="newsletter-badge-dot" />
            <span className="font-mono uppercase tracking-widest text-[9.5px] font-semibold">{badgeText}</span>
          </div>
        </div>

        {/* Right Obsidian Gold Editorial Form */}
        <div className="newsletter-form-block">
          {/* Decorative Corner Gold Envelope Watermark */}
          <svg
            aria-hidden="true"
            className="newsletter-envelope-watermark"
            viewBox="0 0 64 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <rect x="3" y="4" width="58" height="40" rx="5" />
            <path d="M5 7l27 20L59 7" />
          </svg>

          <div className="newsletter-tag-container">
            <span className="newsletter-tag-text">{tagText}</span>
            <span className="newsletter-gold-line" />
          </div>

          <h3 className="newsletter-main-title">{title}</h3>
          <p className="newsletter-main-desc">{description}</p>

          <form onSubmit={handleSubscribe} className="newsletter-form-capsule">
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
                aria-label="Email address for Winsor updates"
                required
              />
            </div>
            <button type="submit" disabled={subscribing} className="newsletter-submit-btn">
              <span>{subscribing ? 'SUBSCRIBING…' : buttonText}</span>
              {!subscribing && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </form>

          <div className="newsletter-footer-note">
            <svg width="13.5" height="13.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{footnoteText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
