'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface GenderSectionProps {
  gender: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  video?: string;
  isMobile: boolean;
  buttonText: string;
  buttonType?: 'outline' | 'link';
  objectPosition?: string;
}

function GenderSection({
  gender,
  title,
  subtitle,
  description,
  image,
  video,
  isMobile,
  buttonText,
  buttonType = 'outline',
  objectPosition = 'center'
}: GenderSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setShouldPlayVideo(false);
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && sectionRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            hoverTimerRef.current = setTimeout(() => {
              setShouldPlayVideo(true);
            }, 5000);
          } else {
            if (hoverTimerRef.current) {
              clearTimeout(hoverTimerRef.current);
            }
            setShouldPlayVideo(false);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(sectionRef.current);

      return () => {
        observer.disconnect();
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
        }
      };
    }
  }, [isMobile]);

  useEffect(() => {
    if (videoRef.current) {
      if (shouldPlayVideo || (isHovered && !isMobile)) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [shouldPlayVideo, isHovered, isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  return (
    <div
      ref={sectionRef}
      className="gender-section group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Zoomable Media Container Wrapper */}
      <div
        style={{
          position: 'absolute',
          top: '-25%',
          left: '-25%',
          width: '150%',
          height: '150%',
          transform: isHovered ? 'scale(0.73)' : 'scale(0.68)',
          transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Loading Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `url(${image}) ${objectPosition}/cover no-repeat`,
            opacity: isVideoLoaded && (shouldPlayVideo || isHovered) ? 0 : 1,
            transition: 'opacity 0.6s ease-in-out',
          }}
        />

        {/* Video */}
        {video && (
          <video
            ref={videoRef}
            src={video}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: objectPosition,
              opacity: isVideoLoaded && (shouldPlayVideo || isHovered) ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
            }}
          />
        )}
      </div>

      {/* Left-to-Right Shading Gradient for enhanced text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 45%, transparent 90%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: isMobile ? '6%' : '8%',
          transform: 'translateY(-50%)',
          textAlign: 'left',
          width: '88%',
          maxWidth: buttonType === 'link' ? '500px' : (isMobile ? '160px' : '420px'),
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {subtitle && (
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: isMobile ? '7.5px' : '10px',
              fontWeight: 600,
              color: '#dfb15b',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: isMobile ? '4px' : '10px',
              display: 'block',
            }}
          >
            {subtitle}
          </span>
        )}

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: buttonType === 'link'
              ? (isMobile ? 'clamp(18px, 4vw, 24px)' : 'clamp(28px, 4.5vw, 42px)')
              : (isMobile ? 'clamp(12px, 3.2vw, 15px)' : 'clamp(20px, 3vw, 28px)'),
            fontWeight: 300,
            color: '#ffffff',
            marginBottom: buttonType === 'link' ? '4px' : (isMobile ? '10px' : '22px'),
            letterSpacing: '0.04em',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: isMobile ? '9.5px' : '13px',
              fontWeight: 300,
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: '0.04em',
              marginBottom: isMobile ? '12px' : '22px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}

        {buttonType === 'link' ? (
          <Link
            href={`/collections/${gender}`}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: isMobile ? '8.5px' : '11px',
              fontWeight: 500,
              color: '#ffffff',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {buttonText}
          </Link>
        ) : (
          <Link
            href={`/collections/${gender}`}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: isMobile ? '7.5px' : '10px',
              fontWeight: 500,
              color: '#ffffff',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              border: '1px solid #8B6914',
              padding: isMobile ? '6px 14px' : '11px 24px',
              display: 'inline-block',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#8B6914';
              e.currentTarget.style.borderColor = '#8B6914';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#8B6914';
            }}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function GenderCollectionSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menData = {
    image: '/winsor_man.png',
    video: '/longines.webm',
    title: "Engineered for those who never settle.",
  };

  const womenData = {
    image: '/winsor_girl_G.png',
    video: '/longines.webm',
    title: "Timeless beauty that complements every you.",
  };

  const giftData = {
    image: '/graduation_gift.png',
    video: '/longines.webm',
    title: "The Perfect Gift",
  };

  return (
    <section
      style={{
        width: '100%',
        background: '#faf7f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: isMobile ? '12px' : '24px',
          padding: isMobile ? '12px' : '40px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Row: Men & Women side-by-side on both mobile and desktop */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: isMobile ? '12px' : '24px',
            width: '100%',
            height: isMobile ? '28vh' : '62vh',
            minHeight: isMobile ? '180px' : '460px',
          }}
        >
          {/* Men's Card */}
          <div
            style={{
              flex: '1',
              height: '100%',
            }}
          >
            <GenderSection
              gender="men"
              subtitle="BUILT FOR ADVENTURE"
              title={menData.title}
              image={menData.image}
              video={menData.video}
              buttonText="Explore Mens →"
              buttonType="outline"
              objectPosition="center 15%"
              isMobile={isMobile}
            />
          </div>

          {/* Women's Card */}
          <div
            style={{
              flex: '1',
              height: '100%',
            }}
          >
            <GenderSection
              gender="women"
              subtitle="DESIGNED FOR GRACE"
              title={womenData.title}
              image={womenData.image}
              video={womenData.video}
              buttonText="Explore Womens →"
              buttonType="outline"
              objectPosition="center 18%"
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Bottom Row: Full-width Gift Card */}
        <div
          style={{
            width: '100%',
            height: isMobile ? '22vh' : '38vh',
            minHeight: isMobile ? '140px' : '280px',
          }}
        >
          <GenderSection
            gender="gifts"
            title={giftData.title}
            description="Give more than time. Give a memory."
            image={giftData.image}
            video={giftData.video}
            buttonText="Explore Gift Sets →"
            buttonType="link"
            objectPosition="center 30%"
            isMobile={isMobile}
          />
        </div>
      </div>
    </section>
  );
}