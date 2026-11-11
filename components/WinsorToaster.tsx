'use client';

import React from 'react';
import Link from 'next/link';
import toast, { Toaster, Toast, resolveValue } from 'react-hot-toast';

export interface CartToastOptions {
  title: string;
  variant?: string;
  image?: string;
}

export interface WishlistToastOptions {
  added: boolean;
  title?: string;
  image?: string;
  productId?: string;
}

interface AtelierShellProps {
  visible: boolean;
  toastId: string;
  durationMs?: number;
  isError?: boolean;
  isLoading?: boolean;
  isMuted?: boolean;
  media: React.ReactNode;
  eyebrowIcon?: React.ReactNode;
  eyebrow: string;
  title?: string;
  subtitle?: string;
  bodyText?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

function AtelierToastShell({
  visible,
  toastId,
  durationMs = 4000,
  isError = false,
  isLoading = false,
  isMuted = false,
  media,
  eyebrowIcon,
  eyebrow,
  title,
  subtitle,
  bodyText,
  action,
  compact = false,
}: AtelierShellProps) {
  const accentColor = isError ? '#B91C1C' : isMuted ? '#7A7060' : '#8B6914';
  const borderColor = isError ? 'rgba(185, 28, 28, 0.22)' : 'rgba(139, 105, 20, 0.24)';
  const progressBg = isError
    ? 'linear-gradient(90deg, #E11D48 0%, #B91C1C 100%)'
    : isMuted
      ? 'linear-gradient(90deg, #BEB4A0 0%, #8F8470 100%)'
      : 'linear-gradient(90deg, #C9A65B 0%, #8B6914 100%)';

  return (
    <div
      className={visible ? 'winsor-toast-enter' : 'winsor-toast-leave'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '12px' : '14px',
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${borderColor}`,
        padding: compact ? '11px 14px' : '12px 14px',
        borderRadius: '16px',
        boxShadow: isError
          ? '0 20px 44px rgba(20, 16, 10, 0.13), 0 4px 12px rgba(185, 28, 28, 0.08)'
          : '0 20px 44px rgba(20, 16, 10, 0.14), 0 4px 12px rgba(139, 105, 20, 0.08)',
        width: compact ? 'min(372px, 100%)' : 'min(396px, 100%)',
        minWidth: compact ? 'min(268px, calc(100vw - 24px))' : undefined,
        maxWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Jost', sans-serif",
        pointerEvents: 'auto',
      }}
    >
      {media}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {eyebrowIcon}
          <p
            style={{
              margin: 0,
              fontSize: '9.5px',
              letterSpacing: '0.14em',
              color: accentColor,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </p>
        </div>

        {title && (
          <h4
            style={{
              margin: '2px 0 0',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '18px',
              lineHeight: 1.15,
              color: '#141414',
              fontWeight: 500,
              textTransform: 'capitalize',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h4>
        )}

        {subtitle && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '11.5px',
              color: '#6E675C',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </p>
        )}

        {bodyText && (
          <div
            style={{
              marginTop: '2px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#141414',
              lineHeight: 1.38,
              wordBreak: 'break-word',
            }}
          >
            {bodyText}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {action}
        {!isLoading && (
          <button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            aria-label="Close notification"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid rgba(139, 105, 20, 0.16)',
              background: '#FAF8F3',
              color: '#7A6F5E',
              fontSize: '13px',
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {!isLoading && durationMs !== Infinity && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2px',
            background: progressBg,
            opacity: 0.78,
            width: '100%',
            transformOrigin: 'left',
            animation: `winsorToastProgress ${durationMs}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

function WatchThumbnailTile({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        width: '50px',
        height: '50px',
        position: 'relative',
        borderRadius: '11px',
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid rgba(139, 105, 20, 0.18)',
        padding: '3px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function HeartBadge({ filled }: { filled: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill={filled ? '#8B6914' : 'none'}
      stroke={filled ? '#8B6914' : '#7A7060'}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function showCartToast({ title, variant, image }: CartToastOptions) {
  const watchName = title || 'Timepiece';
  const watchImg = image || '/winsor_hero_backgroundremoved.webp';
  const instanceKey = Date.now();

  toast.custom(
    (t) => (
      <AtelierToastShell
        key={instanceKey}
        visible={t.visible}
        toastId={t.id}
        durationMs={4000}
        media={<WatchThumbnailTile src={watchImg} alt={watchName} />}
        eyebrowIcon={
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8B6914"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
        eyebrow="Added to Bag"
        title={watchName}
        subtitle={
          variant
            ? `${variant.replace(/\b\w/g, (c) => c.toUpperCase())} Edition`
            : undefined
        }
        action={
          <Link
            href="/cart"
            onClick={() => toast.dismiss(t.id)}
            style={{
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #9C7A3C 0%, #8B6914 100%)',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              textDecoration: 'none',
              borderRadius: '999px',
              boxShadow: '0 6px 14px rgba(139, 105, 20, 0.24)',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            View Bag
          </Link>
        }
      />
    ),
    { id: 'winsor-cart-toast', duration: 4000 }
  );
}

export function showWishlistToast({ added, title, image, productId }: WishlistToastOptions) {
  const watchName = title || 'Curated Timepiece';
  const instanceKey = Date.now();

  toast.custom(
    (t) => (
      <AtelierToastShell
        key={instanceKey}
        visible={t.visible}
        toastId={t.id}
        durationMs={3600}
        isMuted={!added}
        media={
          image ? (
            <WatchThumbnailTile src={image} alt={watchName} />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '11px',
                background: added ? '#FAF6EC' : '#F6F4EE',
                border: `1px solid ${added ? 'rgba(139, 105, 20, 0.26)' : 'rgba(122, 112, 96, 0.22)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill={added ? '#8B6914' : 'none'}
                stroke={added ? '#8B6914' : '#7A7060'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          )
        }
        eyebrowIcon={<HeartBadge filled={added} />}
        eyebrow={added ? 'Saved to Wishlist' : 'Wishlist Updated'}
        title={watchName}
        subtitle={added ? 'Curated in your saved collection' : 'Removed from your wishlist'}
        action={
          added && productId ? (
            <Link
              href={`/collections/${productId}`}
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: '7px 13px',
                background: '#FAF6EC',
                border: '1px solid rgba(139, 105, 20, 0.34)',
                color: '#7A5C10',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              View
            </Link>
          ) : undefined
        }
      />
    ),
    { id: 'winsor-wishlist-toast', duration: 3600 }
  );
}

function WinsorStandardToast({ t }: { t: Toast }) {
  const isError = t.type === 'error';
  const isLoading = t.type === 'loading';
  const eyebrow = isError ? 'Notice' : isLoading ? 'Processing' : t.type === 'success' ? 'Confirmed' : 'Atelier Note';
  const content = resolveValue(t.message, t);

  const icon = isError ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <circle cx="12" cy="16" r="0.6" fill="#B91C1C" />
    </svg>
  ) : isLoading ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2.2" strokeLinecap="round" style={{ animation: 'winsorToastSpin 0.9s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const medallion = (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: isError ? '#FEF5F5' : '#FAF6EC',
        border: `1px solid ${isError ? 'rgba(185, 28, 28, 0.22)' : 'rgba(139, 105, 20, 0.25)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );

  return (
    <AtelierToastShell
      key={t.id}
      visible={t.visible}
      toastId={t.id}
      durationMs={t.duration ?? 4000}
      isError={isError}
      isLoading={isLoading}
      media={medallion}
      eyebrow={eyebrow}
      bodyText={content}
      compact
    />
  );
}

export default function WinsorToaster() {
  return (
    <>
      <style>{`
        @keyframes winsorToastSlideIn {
          from { transform: translateY(-14px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes winsorToastSlideOut {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-12px) scale(0.98); opacity: 0; }
        }
        @keyframes winsorToastProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @keyframes winsorToastSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .winsor-toast-enter {
          animation: winsorToastSlideIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .winsor-toast-leave {
          animation: winsorToastSlideOut 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <Toaster position="top-right" containerClassName="winsor-toaster">
        {(t) => (t.type === 'custom' ? <>{resolveValue(t.message, t)}</> : <WinsorStandardToast t={t} />)}
      </Toaster>
    </>
  );
}
