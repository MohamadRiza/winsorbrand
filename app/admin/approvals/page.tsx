'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/Admin/PermissionGate';

interface PendingApprovalItem {
  _id: string;
  staffId: string;
  staffUsername: string;
  actionType: 'product_create' | 'product_update' | 'fake_review_create';
  targetId?: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  product_create: 'New Product Creation',
  product_update: 'Product Catalog Update',
  fake_review_create: 'Mock Review Creation',
};

// Clean SVG Icons (Zero Emojis)
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const WatchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <polyline points="12 9 12 12 13.5 13.5" />
    <path d="M16.51 17.35l-.85 3.22a2 2 0 0 1-1.94 1.43H10.28a2 2 0 0 1-1.94-1.43l-.85-3.22" />
    <path d="M7.49 6.65l.85-3.22A2 2 0 0 1 10.28 2h3.44a2 2 0 0 1 1.94 1.43l.85 3.22" />
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#8B6914' : 'none'} stroke={filled ? '#8B6914' : '#d1d5db'} strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// Photo Lightbox Modal
function ImageLightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(14, 11, 8, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 240, 0.98) 100%)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          border: '1px solid rgba(139,105,20,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(26,18,9,0.85)',
            border: '1px solid rgba(139,105,20,0.3)',
            color: '#faf7f0',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <CrossIcon />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          style={{
            maxWidth: '85vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <div style={{ padding: '12px 18px', width: '100%', background: 'rgba(250, 247, 240, 0.95)', borderTop: '1px solid rgba(139,105,20,0.15)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1a1209', fontFamily: "'Jost', sans-serif" }}>
            {alt}
          </p>
        </div>
      </div>
    </div>
  );
}

// Full Product Inspection Modal
function FullProductModal({ item, onClose }: { item: PendingApprovalItem; onClose: () => void }) {
  const p = item.payload;
  const [activePhoto, setActivePhoto] = useState<string>(
    p.thumbnail?.url || (typeof p.thumbnail === 'string' ? p.thumbnail : '') || ''
  );

  const allImages: string[] = [];
  if (p.thumbnail?.url) allImages.push(p.thumbnail.url);
  else if (typeof p.thumbnail === 'string' && p.thumbnail) allImages.push(p.thumbnail);

  if (Array.isArray(p.images)) {
    p.images.forEach((img: any) => {
      const u = typeof img === 'string' ? img : img?.url;
      if (u && !allImages.includes(u)) allImages.push(u);
    });
  }

  if (Array.isArray(p.colorVariants)) {
    p.colorVariants.forEach((v: any) => {
      const u = typeof v.image === 'string' ? v.image : v.image?.url;
      if (u && !allImages.includes(u)) allImages.push(u);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(14, 11, 8, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '940px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 240, 0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(139,105,20,0.3)',
          boxShadow: '0 30px 80px rgba(26,18,9,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Jost', sans-serif",
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(139,105,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250, 247, 240, 0.85)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B6914' }}>
                FULL SPECIFICATION AUDIT
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: '#1a1209', color: '#faf7f0', fontFamily: 'monospace' }}>
                by {item.staffUsername}
              </span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 600, color: '#1a1209', margin: '4px 0 0' }}>
              {p.title || 'Untitled Timepiece'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(26,18,9,0.06)',
              border: '1px solid rgba(139,105,20,0.2)',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1a1209',
              transition: 'all 0.15s',
            }}
          >
            <CrossIcon />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '32px' }}>

            {/* Left Column: Visual Media Inspector */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#8B6914', textTransform: 'uppercase' }}>
                PRIMARY PRODUCT IMAGERY
              </p>

              {/* Main Photo Canvas */}
              <div style={{ width: '100%', height: '350px', backgroundColor: '#faf7f0', borderRadius: '16px', border: '1px solid rgba(139,105,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 0 20px rgba(139,105,20,0.04)' }}>
                {activePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePhoto}
                    alt={p.title || 'Product Photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'rgba(26,18,9,0.4)', fontSize: '12px' }}>
                    <WatchIcon />
                    <p style={{ margin: '8px 0 0' }}>No image asset provided</p>
                  </div>
                )}
                {activePhoto && (
                  <span style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '10px', fontWeight: 600, background: 'rgba(26,18,9,0.8)', color: '#fff', padding: '3px 9px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                    High Resolution
                  </span>
                )}
              </div>

              {/* Gallery Thumbnails Strip */}
              {allImages.length > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 600, color: 'rgba(26,18,9,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ALL SUBMITTED IMAGES ({allImages.length})
                  </p>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {allImages.map((imgUrl, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(imgUrl)}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '10px',
                          border: activePhoto === imgUrl ? '2px solid #8B6914' : '1px solid rgba(139,105,20,0.2)',
                          padding: '3px',
                          backgroundColor: '#faf7f0',
                          cursor: 'pointer',
                          flexShrink: 0,
                          overflow: 'hidden',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={'Thumb ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Variants with Photos */}
              {Array.isArray(p.colorVariants) && p.colorVariants.length > 0 && (
                <div style={{ marginTop: '18px', padding: '16px', background: 'rgba(250, 247, 240, 0.85)', borderRadius: '14px', border: '1px solid rgba(139,105,20,0.18)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#8B6914', textTransform: 'uppercase' }}>
                    COLOR VARIANTS & INVENTORY
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {p.colorVariants.map((v: any, idx: number) => {
                      const vImg = typeof v.image === 'string' ? v.image : v.image?.url;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.12)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {vImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={vImg}
                                alt={v.colorName}
                                onClick={() => setActivePhoto(vImg)}
                                style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(139,105,20,0.2)', cursor: 'pointer', background: '#faf7f0' }}
                              />
                            ) : (
                              <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: v.colorHex || '#ccc', border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                            )}
                            <div>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1a1209' }}>{v.colorName}</p>
                              {v.colorHex && <p style={{ margin: '1px 0 0', fontSize: '10px', color: 'rgba(26,18,9,0.5)', fontFamily: 'monospace' }}>{v.colorHex}</p>}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: Number(v.qty) > 0 ? '#065f46' : '#991b1b', background: Number(v.qty) > 0 ? '#d1fae5' : '#fee2e2', padding: '3px 9px', borderRadius: '6px' }}>
                            {v.qty} in stock
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Full Specifications & Catalog Details */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#8B6914', textTransform: 'uppercase' }}>
                CATALOG PRICING & ATTRIBUTES
              </p>

              {/* Price Banner */}
              <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,247,240,0.95) 100%)', borderRadius: '14px', border: '1px solid rgba(139,105,20,0.25)', marginBottom: '18px', boxShadow: '0 4px 14px rgba(139,105,20,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(26,18,9,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Retail Price</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#1a1209', fontFamily: "'Jost', sans-serif" }}>
                    ${Number(p.price || 0).toLocaleString()}
                  </span>
                </div>
                {p.discountPrice && (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid rgba(139,105,20,0.12)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8B6914', fontWeight: 600 }}>Promotional Offer</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#8B6914' }}>${Number(p.discountPrice).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Model Number</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#1a1209', fontFamily: 'monospace' }}>{p.modelNo || 'N/A'}</p>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Brand</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#1a1209' }}>{p.brand || 'Winsor'}</p>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Target Gender</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#1a1209' }}>{p.specifications?.Gender || 'Unisex'}</p>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Watch Shape</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#1a1209' }}>{p.watchShape || 'Round'}</p>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Warranty Duration</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: '#1a1209' }}>{p.warranty ? String(p.warranty).replace('_', ' ') : 'Standard'}</p>
                </div>
                <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid rgba(139,105,20,0.15)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Storefront Status</span>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 600, color: p.isActive !== false ? '#065f46' : '#991b1b' }}>
                    {p.isActive !== false ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Dynamic Technical Specifications */}
              {p.specifications && Object.keys(p.specifications).filter(k => k !== 'Gender').length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 600, color: 'rgba(26,18,9,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    TECHNICAL ATTRIBUTES
                  </p>
                  <div style={{ border: '1px solid rgba(139,105,20,0.18)', borderRadius: '10px', overflow: 'hidden' }}>
                    {Object.entries(p.specifications)
                      .filter(([k]) => k !== 'Gender')
                      .map(([key, val], i) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: i % 2 === 0 ? 'rgba(250, 247, 240, 0.8)' : '#fff', fontSize: '11px' }}>
                          <span style={{ color: 'rgba(26,18,9,0.6)', fontWeight: 500 }}>{key}</span>
                          <span style={{ color: '#1a1209', fontWeight: 600 }}>{String(val)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Full Description */}
              {p.description && (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 600, color: 'rgba(26,18,9,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    EDITORIAL DESCRIPTION
                  </p>
                  <div style={{ padding: '14px', background: 'rgba(250, 247, 240, 0.85)', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.15)', fontSize: '12px', color: '#1a1209', lineHeight: '1.6', maxHeight: '140px', overflowY: 'auto' }}>
                    {p.description}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(139,105,20,0.15)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(250, 247, 240, 0.85)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#1a1209',
              color: '#faf7f0',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}

// In-Card Product Preview (Always shows photo & key details)
function InCardProductPreview({
  item,
  onOpenFull,
  onOpenPhoto,
}: {
  item: PendingApprovalItem;
  onOpenFull: () => void;
  onOpenPhoto: (url: string, alt: string) => void;
}) {
  const p = item.payload;
  const thumbUrl = p.thumbnail?.url || (typeof p.thumbnail === 'string' ? p.thumbnail : '');

  // Count total images
  let imgCount = thumbUrl ? 1 : 0;
  if (Array.isArray(p.images)) imgCount += p.images.length;
  if (Array.isArray(p.colorVariants)) {
    p.colorVariants.forEach((v: any) => {
      if (v.image?.url || (typeof v.image === 'string' && v.image)) imgCount++;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Clickable Image Thumbnail with Zoom Button */}
        <div
          onClick={() => thumbUrl && onOpenPhoto(thumbUrl, p.title || 'Product Image')}
          style={{
            width: '108px',
            height: '108px',
            borderRadius: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(139,105,20,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: thumbUrl ? 'pointer' : 'default',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(26,18,9,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          title={thumbUrl ? 'Click to inspect photo' : 'No photo'}
        >
          {thumbUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl} alt={p.title || 'Product Photo'} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
              <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(26,18,9,0.75)', color: '#fff', borderRadius: '4px', padding: '2px 5px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <EyeIcon /> Photo
              </span>
            </>
          ) : (
            <div style={{ color: 'rgba(26,18,9,0.35)', textAlign: 'center', padding: '4px' }}>
              <WatchIcon />
              <span style={{ fontSize: '9px', display: 'block', marginTop: '2px' }}>No Photo</span>
            </div>
          )}
        </div>

        {/* Primary Product Attributes */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1209' }}>
              {p.title || 'Untitled Model'}
            </h3>
            {p.modelNo && (
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139,105,20,0.12)', color: '#8B6914', fontFamily: 'monospace' }}>
                {p.modelNo}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px 16px', marginTop: '10px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)' }}>
              <span style={{ fontWeight: 600, color: '#1a1209' }}>Price:</span> ${Number(p.price || 0).toLocaleString()}
            </p>
            {p.discountPrice && (
              <p style={{ margin: 0, fontSize: '12px', color: '#8B6914' }}>
                <span style={{ fontWeight: 600 }}>Sale:</span> ${Number(p.discountPrice).toLocaleString()}
              </p>
            )}
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)' }}>
              <span style={{ fontWeight: 600, color: '#1a1209' }}>Gender:</span> {p.specifications?.Gender || 'Unisex'}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)' }}>
              <span style={{ fontWeight: 600, color: '#1a1209' }}>Warranty:</span> {p.warranty ? String(p.warranty).replace('_', ' ') : 'Standard'}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)' }}>
              <span style={{ fontWeight: 600, color: '#1a1209' }}>Assets:</span> {imgCount} photo{imgCount !== 1 ? 's' : ''}
            </p>
            {Array.isArray(p.colorVariants) && (
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(26,18,9,0.7)' }}>
                <span style={{ fontWeight: 600, color: '#1a1209' }}>Variants:</span> {p.colorVariants.length} color{p.colorVariants.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Inspect Full Details Button */}
        <div>
          <button
            onClick={onOpenFull}
            style={{
              padding: '9px 16px',
              backgroundColor: '#1a1209',
              color: '#faf7f0',
              border: 'none',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <EyeIcon /> Inspect Full Details
          </button>
        </div>

      </div>

      {/* Description Snippet */}
      {p.description && (
        <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(26,18,9,0.7)', lineHeight: '1.5', background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.12)' }}>
          <strong style={{ color: '#1a1209' }}>Overview: </strong>
          {p.description.slice(0, 160)}
          {p.description.length > 160 ? '...' : ''}
        </p>
      )}
    </div>
  );
}

// In-Card Fake Review Preview
function InCardReviewPreview({
  item,
  onOpenPhoto,
}: {
  item: PendingApprovalItem;
  onOpenPhoto: (url: string, alt: string) => void;
}) {
  const p = item.payload;
  const rating = Number(p.rating || 5);
  const avatarUrl = p.userAvatar;
  const attachedImgs: string[] = Array.isArray(p.images) ? p.images : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Reviewer Avatar */}
        <div
          onClick={() => avatarUrl && onOpenPhoto(avatarUrl, p.username || 'Reviewer')}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#1a1209',
            color: '#faf7f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: avatarUrl ? 'pointer' : 'default',
            border: '2px solid #8B6914',
            boxShadow: '0 2px 8px rgba(139,105,20,0.18)',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={p.username || 'Reviewer'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (p.username || 'U').charAt(0).toUpperCase()
          )}
        </div>

        {/* Review Details */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1209' }}>{p.username || 'Anonymous'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} filled={star <= rating} />
              ))}
            </div>
            {p.isAnonymous && (
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(26,18,9,0.08)', color: '#1a1209' }}>
                Anonymous
              </span>
            )}
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'rgba(26,18,9,0.85)', lineHeight: '1.5', fontStyle: 'italic', background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(139,105,20,0.12)' }}>
            "{p.comment || 'No comment provided'}"
          </p>
        </div>
      </div>

      {/* Review Attached Photos */}
      {attachedImgs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(26,18,9,0.6)', textTransform: 'uppercase' }}>
            Attached Photos:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {attachedImgs.map((imgUrl, i) => (
              <button
                key={i}
                onClick={() => onOpenPhoto(imgUrl, 'Review Photo ' + (i + 1))}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid rgba(139,105,20,0.3)',
                  padding: '2px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={'Attached ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Approvals Page Component
export default function ApprovalsPage() {
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  // Full inspection modal & Lightbox state
  const [inspectingItem, setInspectingItem] = useState<PendingApprovalItem | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);

  const fetchApprovals = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals?status=${status}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        if (data.pendingCount !== undefined) setPendingCount(data.pendingCount);
      }
    } catch {
      toast.error('Failed to load approvals queue');
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts for tabs & metrics summary
  const fetchCounts = async () => {
    try {
      const [appRes, rejRes] = await Promise.all([
        fetch('/api/admin/approvals?status=approved', { credentials: 'include' }),
        fetch('/api/admin/approvals?status=rejected', { credentials: 'include' }),
      ]);
      const appData = await appRes.json();
      const rejData = await rejRes.json();
      if (appData.success) setApprovedCount(appData.data?.length || 0);
      if (rejData.success) setRejectedCount(rejData.data?.length || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchApprovals(activeTab);
    fetchCounts();
  }, [activeTab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReasons[id]?.trim()) {
      toast.error('Please enter a rejection reason before rejecting.');
      return;
    }
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReasons[id] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
      toast.success(action === 'approve' ? 'Submission approved and published successfully.' : 'Submission rejected.');
      setRejectingId(null);
      fetchApprovals(activeTab);
      fetchCounts();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
  ] as const;

  return (
    <PermissionGate allowedRoles={['admin']}>
      <div
        style={{
          fontFamily: "'Jost', sans-serif",
          color: '#1a1209',
          paddingBottom: '50px',
        }}
      >
        <div style={{ width: '100%' }}>

          {/* ── Executive Luxury Hero Header (Matches Marble Background) ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(250, 247, 240, 0.94) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 105, 20, 0.22)',
              borderRadius: '20px',
              padding: '28px 36px',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(26, 18, 9, 0.04), inset 0 0 30px rgba(139, 105, 20, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Ambient Gold Halo Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '180px',
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201, 161, 74, 0.14) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Watermark Watch Backdrop in Header */}
            <div
              style={{
                position: 'absolute',
                right: '180px',
                top: '-25px',
                bottom: '-25px',
                width: '180px',
                opacity: 0.9,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/winsor_hero_backgroundremoved.webp"
                alt="Winsor Timepiece"
                style={{
                  height: '135%',
                  objectFit: 'contain',
                  transform: 'rotate(12deg) translateY(-4px)',
                  filter: 'drop-shadow(0 12px 22px rgba(139,105,20,0.14))',
                }}
              />
            </div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '620px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 105, 20, 0.1)', border: '1px solid rgba(139, 105, 20, 0.25)', padding: '4px 12px', borderRadius: '20px', marginBottom: '10px' }}>
                <span style={{ color: '#8B6914' }}><ShieldCheckIcon /></span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.16em', color: '#8B6914', textTransform: 'uppercase' }}>
                  WINSOR MAISON • GOVERNANCE AUDIT
                </span>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: 600, color: '#1a1209', margin: '0 0 6px', lineHeight: 1.15 }}>
                Staff Submission Approvals
              </h1>
              <p style={{ fontSize: '13.5px', color: 'rgba(26, 18, 9, 0.65)', margin: 0, lineHeight: 1.55 }}>
                Review high-resolution watch photos, technical specifications, and reviewer submissions. Every change remains offline until authorized by an administrator.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <Link
                href="/admin/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  background: '#1a1209',
                  color: '#faf7f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 14px rgba(26, 18, 9, 0.2)',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(201, 161, 74, 0.3)',
                }}
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* ── Workflow Metrics Stats Ribbon (Matching Background) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 247, 240, 0.94) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '18px 22px',
                border: pendingCount > 0 ? '1.5px solid #8B6914' : '1px solid rgba(139, 105, 20, 0.22)',
                boxShadow: pendingCount > 0 ? '0 8px 24px rgba(139, 105, 20, 0.12)' : '0 4px 16px rgba(26, 18, 9, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', color: '#8B6914', textTransform: 'uppercase' }}>
                  Awaiting Decision
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#1a1209', fontFamily: "'Jost', sans-serif" }}>
                  {pendingCount}
                </p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 105, 20, 0.1)', color: '#8B6914', border: '1px solid rgba(139, 105, 20, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockIcon />
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 247, 240, 0.94) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '18px 22px',
                border: '1px solid rgba(6, 95, 70, 0.22)',
                boxShadow: '0 4px 16px rgba(26, 18, 9, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', color: '#065f46', textTransform: 'uppercase' }}>
                  Approved & Live
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#065f46', fontFamily: "'Jost', sans-serif" }}>
                  {approvedCount}
                </p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 95, 70, 0.1)', color: '#065f46', border: '1px solid rgba(6, 95, 70, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon />
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 247, 240, 0.94) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '18px 22px',
                border: '1px solid rgba(153, 27, 27, 0.22)',
                boxShadow: '0 4px 16px rgba(26, 18, 9, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', color: '#991b1b', textTransform: 'uppercase' }}>
                  Rejected Submissions
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#991b1b', fontFamily: "'Jost', sans-serif" }}>
                  {rejectedCount}
                </p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(153, 27, 27, 0.1)', color: '#991b1b', border: '1px solid rgba(153, 27, 27, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CrossIcon />
              </div>
            </div>
          </div>

          {/* ── Tabs Navigation (Matching Marble Palette) ── */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 105, 20, 0.2)',
              borderRadius: '14px',
              padding: '6px',
              marginBottom: '22px',
              width: 'fit-content',
              boxShadow: '0 4px 16px rgba(26, 18, 9, 0.03)',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: activeTab === tab.key ? '#1a1209' : 'transparent',
                  color: activeTab === tab.key ? '#faf7f0' : 'rgba(26, 18, 9, 0.65)',
                  boxShadow: activeTab === tab.key ? '0 4px 12px rgba(26, 18, 9, 0.18)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span
                    style={{
                      background: tab.key === 'pending' ? '#dc2626' : tab.key === 'approved' ? '#065f46' : '#991b1b',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1.5px 7px',
                      borderRadius: '20px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Queue Content List (Matching Marble Background) ── */}
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '90px 0',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 247, 240, 0.92) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(139, 105, 20, 0.22)',
                boxShadow: '0 8px 30px rgba(26, 18, 9, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 105, 20, 0.2)', borderTopColor: '#8B6914', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13.5px', color: 'rgba(26, 18, 9, 0.65)', fontWeight: 500 }}>Synchronizing governance records...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '90px 24px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(250, 247, 240, 0.94) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(139, 105, 20, 0.22)',
                boxShadow: '0 8px 30px rgba(26, 18, 9, 0.04), inset 0 0 30px rgba(139, 105, 20, 0.02)',
              }}
            >
              <div style={{ width: '56px', height: '56px', margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(139, 105, 20, 0.1)', color: '#8B6914', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 105, 20, 0.25)' }}>
                <CheckIcon />
              </div>
              <p style={{ fontSize: '20px', color: '#1a1209', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, margin: '0 0 6px' }}>
                {activeTab === 'pending' ? 'All Submissions Verified' : 'No ' + activeTab + ' records'}
              </p>
              <p style={{ fontSize: '13.5px', color: 'rgba(26, 18, 9, 0.6)', margin: 0, maxWidth: '420px', marginInline: 'auto', lineHeight: 1.55 }}>
                {activeTab === 'pending' ? 'There are currently no staff actions awaiting review. New product uploads or edits will arrive here instantly.' : 'Archived records for this state will be listed here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map(item => (
                <div
                  key={item._id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 247, 240, 0.94) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(139, 105, 20, 0.22)',
                    borderRadius: '20px',
                    padding: '24px 28px',
                    boxShadow: '0 8px 30px rgba(26, 18, 9, 0.04), inset 0 0 30px rgba(139, 105, 20, 0.02)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: item.actionType === 'product_create' ? 'rgba(37,99,235,0.08)' : item.actionType === 'product_update' ? 'rgba(217,119,6,0.08)' : 'rgba(124,58,237,0.08)',
                          color: item.actionType === 'product_create' ? '#2563eb' : item.actionType === 'product_update' ? '#d97706' : '#7c3aed',
                          border: '1px solid rgba(139, 105, 20, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.actionType === 'product_create' ? <WatchIcon /> : item.actionType === 'product_update' ? <EditIcon /> : <MessageIcon />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1a1209' }}>
                          {ACTION_LABELS[item.actionType]}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'rgba(26, 18, 9, 0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Submitted by <strong>{item.staffUsername}</strong></span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ClockIcon />
                            {new Date(item.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '5px 14px',
                        borderRadius: '20px',
                        border: '1px solid',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        background: item.status === 'pending' ? '#fef3c7' : item.status === 'approved' ? '#d1fae5' : '#fee2e2',
                        color: item.status === 'pending' ? '#92400e' : item.status === 'approved' ? '#065f46' : '#991b1b',
                        borderColor: item.status === 'pending' ? '#fcd34d' : item.status === 'approved' ? '#6ee7b7' : '#fca5a5',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Visual Content Box (With Images and Full Details) */}
                  <div
                    style={{
                      background: 'rgba(250, 247, 240, 0.85)',
                      borderRadius: '14px',
                      padding: '18px',
                      marginBottom: '18px',
                      border: '1px solid rgba(139, 105, 20, 0.16)',
                    }}
                  >
                    {item.actionType === 'fake_review_create' ? (
                      <InCardReviewPreview
                        item={item}
                        onOpenPhoto={(url, alt) => setLightbox({ url, alt })}
                      />
                    ) : (
                      <InCardProductPreview
                        item={item}
                        onOpenFull={() => setInspectingItem(item)}
                        onOpenPhoto={(url, alt) => setLightbox({ url, alt })}
                      />
                    )}
                  </div>

                  {/* Rejection Note Display */}
                  {item.status === 'rejected' && item.rejectionReason && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Rejection Reason
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#7f1d1d', lineHeight: '1.5' }}>
                        {item.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Action Controls for Pending Submissions */}
                  {item.status === 'pending' && (
                    <div>
                      {rejectingId === item._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <textarea
                            placeholder="Enter detailed rejection reason (required)..."
                            value={rejectionReasons[item._id] || ''}
                            onChange={e => setRejectionReasons(r => ({ ...r, [item._id]: e.target.value }))}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '1px solid #fca5a5',
                              borderRadius: '12px',
                              fontSize: '12.5px',
                              fontFamily: "'Jost', sans-serif",
                              background: '#fef2f2',
                              color: '#1a1209',
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleAction(item._id, 'reject')}
                              disabled={processingId === item._id}
                              style={{
                                flex: 1,
                                padding: '11px',
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                opacity: processingId === item._id ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                              }}
                            >
                              <CrossIcon />
                              {processingId === item._id ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              style={{
                                padding: '11px 22px',
                                background: 'rgba(26, 18, 9, 0.06)',
                                color: '#1a1209',
                                border: '1px solid rgba(139, 105, 20, 0.2)',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleAction(item._id, 'approve')}
                            disabled={processingId === item._id}
                            style={{
                              flex: 1,
                              padding: '12px 22px',
                              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              opacity: processingId === item._id ? 0.6 : 1,
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 14px rgba(6, 95, 70, 0.25)',
                            }}
                          >
                            <CheckIcon />
                            {processingId === item._id ? 'Processing Approval...' : 'Approve & Publish'}
                          </button>
                          <button
                            onClick={() => setRejectingId(item._id)}
                            disabled={processingId === item._id}
                            style={{
                              flex: 1,
                              padding: '12px 22px',
                              background: '#fff',
                              color: '#dc2626',
                              border: '1.5px solid #fca5a5',
                              borderRadius: '12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              opacity: processingId === item._id ? 0.6 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            <CrossIcon />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for Full-Resolution Photo Inspection */}
      {lightbox && (
        <ImageLightbox
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Full Product Specifications & Imagery Modal */}
      {inspectingItem && (
        <FullProductModal
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}
    </PermissionGate>
  );
}
