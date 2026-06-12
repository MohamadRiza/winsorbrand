'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface GenderSectionProps {
  gender: 'men' | 'women';
  title: string;
  image: string;
  video: string;
  isMobile: boolean;
}

function GenderSection({ gender, title, image, video, isMobile }: GenderSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset video state when switching between mobile/desktop
    setShouldPlayVideo(false);
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && sectionRef.current) {
      // Mobile: Auto-play video after 5 seconds of visibility
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Start timer when section is visible
            hoverTimerRef.current = setTimeout(() => {
              setShouldPlayVideo(true);
            }, 5000);
          } else {
            // Clear timer if section goes out of view
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
        videoRef.current.play().catch(() => {
          // Autoplay was prevented
        });
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
      className="gender-section"
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
      {/* Loading Image */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `url(${image}) center/cover no-repeat`,
          opacity: isVideoLoaded && (shouldPlayVideo || isHovered) ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Video */}
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
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isVideoLoaded && (shouldPlayVideo || isHovered) ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Overlay Gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          width: '100%',
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 300,
            color: '#ffffff',
            marginBottom: '14px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(0,0,0,0.45)',
          }}
        >
          {title}
        </h2>
        <Link
          href={`/collections/${gender}`}
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: '#ffffff',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '4px',
            display: 'inline-block',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderBottomColor = 'transparent';
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderBottomColor = '#ffffff';
            e.currentTarget.style.opacity = '1';
          }}
        >
          Shop now
        </Link>
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

  // Replace these with your actual image and video URLs
  const menData = {
    image: 'https://cms.longines.com/media/3533/download/2col-men-watches-d.jpg?v=1&w=1920', // Your men's watches image
    video: '/longines.webm', // Your men's watches video
    title: "Men's watches",
  };

  const womenData = {
    image: 'https://cms.longines.com/media/3303/download/3col-women-watches-d.jpg?v=1&w=1920', // Your women's watches image
    video: '/longines.webm', // Your women's watches video
    title: "Women's Watches",
  };

  return (
    <section
      style={{
        width: '100%',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          height: isMobile ? 'auto' : '85vh',
          minHeight: isMobile ? 'auto' : '550px',
          gap: isMobile ? '16px' : '24px',
          padding: isMobile ? '16px' : '40px 80px',
          boxSizing: 'border-box',
        }}
      >
        {/* Men's Section */}
        <div
          style={{
            flex: '1',
            width: '100%',
            height: isMobile ? '45vh' : '100%',
            minHeight: isMobile ? '350px' : 'auto',
          }}
        >
          <GenderSection
            gender="men"
            title={menData.title}
            image={menData.image}
            video={menData.video}
            isMobile={isMobile}
          />
        </div>

        {/* Women's Section */}
        <div
          style={{
            flex: '1',
            width: '100%',
            height: isMobile ? '45vh' : '100%',
            minHeight: isMobile ? '350px' : 'auto',
          }}
        >
          <GenderSection
            gender="women"
            title={womenData.title}
            image={womenData.image}
            video={womenData.video}
            isMobile={isMobile}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .gender-section {
            height: 45vh !important;
            min-height: 350px !important;
          }
        }
      `}</style>
    </section>
  );
}