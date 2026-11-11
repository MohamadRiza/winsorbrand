import React from 'react';

export interface ProductCardSkeletonGridProps {
  /** Number of glowing placeholder watch cards to display inside `.product-grid` */
  count?: number;
}

export default function ProductCardSkeletonGrid({ count = 8 }: ProductCardSkeletonGridProps) {
  return (
    <>
      <style>{`
        .wps-card {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid rgba(139, 105, 20, 0.11);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 18px rgba(20, 16, 10, 0.025);
        }
        .wps-glow {
          background: linear-gradient(
            110deg,
            #f5f2eb 22%,
            #fcfbf8 38%,
            #efe5ce 50%,
            #fcfbf8 62%,
            #f5f2eb 78%
          );
          background-size: 240% 100%;
          animation: wps-shimmer 1.75s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .wps-glow-gold {
          background: linear-gradient(
            110deg,
            rgba(166, 124, 25, 0.12) 22%,
            rgba(229, 193, 92, 0.26) 46%,
            rgba(166, 124, 25, 0.12) 78%
          );
          background-size: 240% 100%;
          animation: wps-shimmer 1.75s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .wps-stage {
          position: relative;
          aspect-ratio: 1;
          width: 100%;
          background: #f9f7f2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
        }
        .wps-dial-ghost {
          width: 58%;
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1.5px solid rgba(139, 105, 20, 0.1);
          box-shadow: inset 0 0 24px rgba(139, 105, 20, 0.04);
        }
        .wps-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          width: 56px;
          height: 18px;
          border-radius: 4px;
        }
        .wps-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .wps-line {
          border-radius: 4px;
        }
        .wps-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px solid rgba(20, 20, 20, 0.05);
        }
        @keyframes wps-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -40% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wps-glow,
          .wps-glow-gold {
            animation: none;
          }
        }
        @media (max-width: 768px) {
          .wps-stage {
            padding: 14px;
          }
          .wps-body {
            padding: 12px;
            gap: 8px;
          }
        }
      `}</style>

      <div className="product-grid" aria-busy="true" aria-label="Loading timepieces">
        {Array.from({ length: count }).map((_, idx) => {
          const delay = `${(idx % 4) * 110}ms`;
          return (
            <div key={idx} className="wps-card">
              <div className="wps-stage wps-glow" style={{ animationDelay: delay }}>
                <div className="wps-badge wps-glow-gold" style={{ animationDelay: delay }} />
                <div className="wps-dial-ghost" />
              </div>

              <div className="wps-body">
                <div
                  className="wps-line wps-glow"
                  style={{ height: '14px', width: '74%', animationDelay: delay }}
                />
                <div
                  className="wps-line wps-glow"
                  style={{ height: '10px', width: '54%', animationDelay: delay }}
                />
                <div
                  className="wps-line wps-glow-gold"
                  style={{ height: '13px', width: '38%', marginTop: '4px', animationDelay: delay }}
                />
                <div className="wps-actions">
                  <div
                    className="wps-line wps-glow"
                    style={{ height: '32px', flex: 1, borderRadius: '6px', animationDelay: delay }}
                  />
                  <div
                    className="wps-line wps-glow"
                    style={{ height: '32px', width: '38px', borderRadius: '6px', animationDelay: delay }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
