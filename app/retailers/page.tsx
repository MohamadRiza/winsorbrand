'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Retailer {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  image?: {
    url: string;
    publicId: string;
  };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  distance?: number; // Calculated dynamically via GPS
}

const BOUTIQUE_PLACEHOLDER = 'https://images.unsplash.com/photo-1582037936109-1a06705d2334?q=80&w=800&auto=format&fit=crop';

// Haversine distance formula in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StoreLocatorPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  // GPS / Geolocation States
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  // Album Carousel States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/retailers');
      const data = await res.json();
      if (data.success) {
        setRetailers(data.data || []);
        setCities(data.cities || []);
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Failed to load store list:', error);
      toast.error('Could not load store locator list');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setShowGPSModal(true);
  };

  const handleConfirmGPS = () => {
    setShowGPSModal(false);
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        setGpsActive(true);
        setGpsLoading(false);
        toast.success('Location matched! Sorting stores by proximity.');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGpsLoading(false);
        setGpsActive(false);
        setUserCoords(null);
        
        let msg = 'Could not access your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Displaying standard listing.';
        }
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleDeactivateGPS = () => {
    setGpsActive(false);
    setUserCoords(null);
    toast.success('GPS proximity deactivated.');
  };

  // Filter and Proximity Sort
  const processedRetailers = (() => {
    let list = [...retailers];

    // 1. Text Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q)
      );
    }

    // 2. City Filter
    if (selectedCity !== 'all') {
      list = list.filter(r => r.city === selectedCity);
    }

    // 3. Country Filter
    if (selectedCountry !== 'all') {
      list = list.filter(r => r.country === selectedCountry);
    }

    // 4. Distance Calculation & Sorting
    if (userCoords && gpsActive) {
      list = list.map(r => {
        if (r.latitude !== undefined && r.longitude !== undefined) {
          const d = calculateHaversineDistance(
            userCoords.latitude,
            userCoords.longitude,
            r.latitude,
            r.longitude
          );
          return { ...r, distance: d };
        }
        return r;
      });

      // Sort by distance (nearest first). Boutique locations without GPS coords are placed last.
      list.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
    }

    return list;
  })();

  // Reset index when search filters or GPS status changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, selectedCity, selectedCountry, gpsActive]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextSlide();
    } else if (isRightSwipe) {
      handlePrevSlide();
    }
  };

  const handleNextSlide = () => {
    if (processedRetailers.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % processedRetailers.length);
  };

  const handlePrevSlide = () => {
    if (processedRetailers.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + processedRetailers.length) % processedRetailers.length);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedCountry('all');
  };

  return (
    <div style={{ backgroundColor: '#faf7f0', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500;600&display=swap');
        
        .locator-banner {
          height: 320px;
          position: relative;
          background-image: linear-gradient(rgba(26,18,9,0.45), rgba(26,18,9,0.65)), url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #ffffff;
          padding: 0 20px;
        }
        .locator-banner h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 6vw, 48px);
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .locator-banner p {
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
          max-width: 600px;
          line-height: 1.5;
        }
        .locator-toolbar {
          max-width: 1200px;
          margin: -30px auto 40px;
          width: calc(100% - 32px);
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.08);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(26,18,9,0.05);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .locator-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 280px;
        }
        .locator-search-input {
          width: 100%;
          background: #fbf9f4;
          border: 1px solid rgba(26,18,9,0.1);
          border-radius: 6px;
          padding: 12px 16px 12px 42px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          transition: border-color 0.2s;
        }
        .locator-search-input:focus {
          border-color: #8B6914;
        }
        .locator-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(26,18,9,0.4);
          pointer-events: none;
        }
        .locator-select {
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.1);
          border-radius: 6px;
          padding: 12px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          cursor: pointer;
          outline: none;
          min-width: 180px;
          transition: border-color 0.2s;
        }
        .locator-select:focus {
          border-color: #8B6914;
        }
        .locator-reset-btn {
          background: none;
          border: 1px solid rgba(26,18,9,0.15);
          color: #1a1209;
          padding: 12px 24px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .locator-reset-btn:hover {
          background: #1a1209;
          color: #ffffff;
          border-color: #1a1209;
        }
        .locator-grid {
          max-width: 1200px;
          margin: 0 auto;
          width: calc(100% - 32px);
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }
        .boutique-card {
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.06);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(26,18,9,0.02);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .boutique-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(26,18,9,0.05);
        }
        .boutique-img-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          background: #fbf9f4;
        }
        .boutique-card-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .boutique-badge {
          display: inline-block;
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8B6914;
          background: rgba(139,105,20,0.1);
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 12px;
          width: fit-content;
        }
        .boutique-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 8px;
          line-height: 1.25;
        }
        .boutique-address {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: rgba(26,18,9,0.6);
          line-height: 1.5;
          margin: 0 0 20px;
          flex: 1;
        }
        .boutique-button {
          display: block;
          width: 100%;
          text-align: center;
          padding: 12px;
          background: #1a1209;
          color: #ffffff;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .boutique-button:hover {
          background: #8B6914;
        }
        .gps-float-btn {
          position: fixed;
          bottom: 32px;
          left: 32px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #1a1209;
          border: 1.5px solid #8B6914;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(26, 18, 9, 0.4);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 99;
        }
        .gps-float-btn:hover {
          background: #8B6914;
          transform: scale(1.06);
          box-shadow: 0 8px 30px rgba(139, 105, 20, 0.4);
        }
        .gps-float-btn.active {
          background: #8B6914;
          border-color: #ffffff;
          box-shadow: 0 0 20px rgba(139, 105, 20, 0.7);
        }

        /* Album View Styles */
        .album-view-container {
          max-width: 900px;
          margin: 0 auto 60px;
          width: calc(100% - 32px);
        }
        .album-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .gps-active-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 105, 20, 0.1);
          color: #8B6914;
          padding: 6px 16px;
          border-radius: 20px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 16px;
          border: 1px solid rgba(139, 105, 20, 0.15);
        }
        .album-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 36px);
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 8px;
          letter-spacing: 0.05em;
        }
        .album-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: rgba(26, 18, 9, 0.6);
          max-width: 500px;
          margin: 0 auto;
        }
        .album-card-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          position: relative;
        }
        .boutique-album-card {
          background: #ffffff;
          border: 1px solid rgba(139, 105, 20, 0.18);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 15px 45px rgba(26, 18, 9, 0.06);
          width: 100%;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .album-card-distance-banner {
          background: linear-gradient(135deg, #1a1209 0%, #302213 100%);
          border-bottom: 1.5px solid #8B6914;
          color: #ffffff;
          padding: 14px 24px;
          text-align: center;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          letter-spacing: 0.05em;
        }
        .album-card-distance-banner .distance-bold {
          color: #dfb15b;
          font-weight: 600;
          font-size: 17px;
        }
        .album-card-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
        }
        .album-card-image-sec {
          position: relative;
          aspect-ratio: 4/3;
          background: #fbf9f4;
          overflow: hidden;
        }
        .album-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .boutique-album-card:hover .album-card-image {
          transform: scale(1.03);
        }
        .nearest-label-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #8B6914;
          color: #ffffff;
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 6px 12px;
          border-radius: 4px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .album-card-info-sec {
          padding: 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .album-card-rank {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #8B6914;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 12px;
          display: block;
        }
        .album-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 4vw, 30px);
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 16px;
          line-height: 1.2;
        }
        .album-card-location-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }
        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .info-icon {
          font-size: 16px;
          line-height: 1;
          margin-top: 2px;
        }
        .info-text {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: rgba(26, 18, 9, 0.65);
          line-height: 1.4;
        }
        .album-card-actions {
          margin-top: auto;
        }
        .album-card-btn.directions {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 13px 20px;
          background: #1a1209;
          color: #ffffff;
          border: 1px solid #1a1209;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.25s ease;
        }
        .album-card-btn.directions:hover {
          background: #8B6914;
          border-color: #8B6914;
          box-shadow: 0 5px 15px rgba(139,105,20,0.2);
        }
        .album-nav-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.12);
          color: #1a1209;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }
        .album-nav-btn:hover {
          background: #1a1209;
          color: #ffffff;
          border-color: #1a1209;
          transform: scale(1.05);
        }
        .album-dots-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }
        .album-dot-btn {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(26, 18, 9, 0.15);
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          padding: 0;
        }
        .album-dot-btn.active {
          background: #8B6914;
          transform: scale(1.35);
        }
        .swipe-helper {
          display: none;
          text-align: center;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          color: rgba(26, 18, 9, 0.4);
          letter-spacing: 0.05em;
          margin-top: 12px;
          text-transform: uppercase;
        }
        .view-toggle-container {
          text-align: center;
          margin-top: 40px;
        }
        .view-toggle-btn.text-link {
          background: none;
          border: none;
          color: #8B6914;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }
        .view-toggle-btn.text-link:hover {
          color: #1a1209;
        }

        /* Card transition animation */
        .album-card-animate {
          animation: cardFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .album-card-layout {
            grid-template-columns: 1fr;
          }
          .album-card-image-sec {
            aspect-ratio: 16/10;
          }
          .album-card-info-sec {
            padding: 24px;
          }
          .album-nav-btn {
            display: none !important;
          }
          .swipe-helper {
            display: block !important;
          }
        }
        
        /* Modal Style */
        .gps-modal {
          position: fixed;
          inset: 0;
          background: rgba(26, 18, 9, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .gps-modal-card {
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.08);
          border-radius: 12px;
          max-width: 400px;
          width: 100%;
          padding: 28px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          animation: modalIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Banner */}
      <header className="locator-banner">
        <p>Authorized Retailers</p>
        <h1>Find a Boutique</h1>
        <p>Experience Winsor horology firsthand at our luxury showrooms and authorized dealer boutiques.</p>
      </header>

      {/* Toolbar Filters */}
      <div className="locator-toolbar">
        {/* Search input */}
        <div className="locator-search-wrapper">
          <input
            type="text"
            placeholder="Search boutique name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="locator-search-input"
          />
          <svg className="locator-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>

        {/* City Filter */}
        {cities.length > 0 && (
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="locator-select"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        )}

        {/* Country Filter */}
        {countries.length > 0 && (
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="locator-select"
          >
            <option value="all">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        )}

        {/* Reset Filter Button */}
        {(searchQuery || selectedCity !== 'all' || selectedCountry !== 'all') && (
          <button onClick={resetFilters} className="locator-reset-btn">
            Clear Filters
          </button>
        )}
      </div>

      {/* Stores List Grid / Swipeable Album */}
      <main>
        {loading ? (
          <div className="locator-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '380px',
                  background: '#ffffff',
                  border: '1px solid rgba(26,18,9,0.06)',
                  borderRadius: '8px',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))}
          </div>
        ) : processedRetailers.length === 0 ? (
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              width: 'calc(100% - 32px)',
              textAlign: 'center',
              padding: '80px 20px',
              background: '#ffffff',
              border: '1px solid rgba(26,18,9,0.06)',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🏬</span>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1209', margin: '0 0 8px' }}>
              No Boutiques Found
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: 'rgba(26,18,9,0.5)', margin: '0 0 20px' }}>
              We could not find any authorized retailers matching your filters.
            </p>
            <button onClick={resetFilters} className="locator-reset-btn">
              Reset Filters
            </button>
          </div>
        ) : gpsActive && userCoords ? (
          /* Swipable Album View */
          <div className="album-view-container">
            <div className="album-header">
              <div className="gps-active-badge">
                <svg
                  className="w-4 h-4 text-[#8B6914] animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{ width: '16px', height: '16px' }}
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 18v2M2 12h2M18 12h2" />
                </svg>
                <span>GPS Proximity Sorting Active</span>
              </div>
              <h2 className="album-title">Nearest Showrooms</h2>
              <p className="album-subtitle">
                Showing boutique {currentIndex + 1} of {processedRetailers.length}, sorted by proximity to your coordinates.
              </p>
            </div>

            <div className="album-card-wrapper">
              {/* Prev Button */}
              <button
                onClick={handlePrevSlide}
                className="album-nav-btn prev"
                aria-label="Previous boutique"
                title="Previous nearest boutique"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Boutique Card */}
              <div
                key={currentIndex}
                className="boutique-album-card album-card-animate"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Distance Banner */}
                <div className="album-card-distance-banner">
                  <span className="distance-bold">
                    {processedRetailers[currentIndex]?.distance !== undefined
                      ? `${processedRetailers[currentIndex].distance!.toFixed(1)} km`
                      : 'N/A'}
                  </span>
                  <span> long distance from you</span>
                </div>

                <div className="album-card-layout">
                  <div className="album-card-image-sec">
                    <img
                      src={processedRetailers[currentIndex]?.image?.url || BOUTIQUE_PLACEHOLDER}
                      alt={processedRetailers[currentIndex]?.name}
                      className="album-card-image"
                    />
                    {currentIndex === 0 && (
                      <span className="nearest-label-badge">Nearest Option</span>
                    )}
                  </div>
                  <div className="album-card-info-sec">
                    <span className="album-card-rank">
                      Boutique Partner #{currentIndex + 1}
                    </span>
                    <h3 className="album-card-name">{processedRetailers[currentIndex]?.name}</h3>

                    <div className="album-card-location-details">
                      <div className="info-row">
                        <span className="info-icon">📍</span>
                        <span className="info-text">{processedRetailers[currentIndex]?.address}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-icon">🏙️</span>
                        <span className="info-text">
                          <strong style={{ color: '#1a1209' }}>
                            {processedRetailers[currentIndex]?.city}, {processedRetailers[currentIndex]?.country}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="album-card-actions">
                      <a
                        href={processedRetailers[currentIndex]?.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="album-card-btn directions"
                      >
                        <span>Get Directions & View Map</span>
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', marginLeft: '6px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextSlide}
                className="album-nav-btn next"
                aria-label="Next boutique"
                title="Next nearest boutique"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Dots */}
            {processedRetailers.length > 1 && (
              <div className="album-dots-container">
                {processedRetailers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`album-dot-btn ${idx === currentIndex ? 'active' : ''}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="swipe-helper">
              <span>← Swipe card to browse nearest options →</span>
            </div>

            <div className="view-toggle-container">
              <button
                onClick={() => setGpsActive(false)}
                className="view-toggle-btn text-link"
              >
                Turn off GPS and view all showrooms in standard grid
              </button>
            </div>
          </div>
        ) : (
          /* Standard Grid View */
          <div className="locator-grid">
            {processedRetailers.map((r) => (
              <div key={r._id} className="boutique-card">
                <div className="boutique-img-container">
                  <img
                    src={r.image?.url || BOUTIQUE_PLACEHOLDER}
                    alt={r.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div className="boutique-card-content">
                  <span className="boutique-badge">
                    🏛️ Winsor Partner
                  </span>

                  <h3 className="boutique-name">{r.name}</h3>

                  <p className="boutique-address">
                    {r.address}
                    <br />
                    <strong style={{ color: '#1a1209' }}>
                      {r.city}, {r.country}
                    </strong>
                  </p>

                  <a
                    href={r.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="boutique-button"
                  >
                    Get Directions ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating GPS Icon Button */}
      {!loading && (
        <button
          onClick={gpsActive ? handleDeactivateGPS : handleActivateGPS}
          className={`gps-float-btn ${gpsActive ? 'active' : ''}`}
          title={gpsActive ? 'Turn off GPS sorting' : 'Find nearest Winsor shop'}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 1.2s linear infinite',
              }}
            />
          ) : (
            <svg 
              className={`w-6 h-6 ${gpsActive ? 'animate-pulse' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '24px', height: '24px' }}
            >
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
      )}

      {/* GPS Confirmation Popup Modal */}
      {showGPSModal && (
        <div className="gps-modal">
          <div className="gps-modal-card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '20px', 
              color: '#8B6914' 
            }}>
              <div style={{
                background: 'rgba(139,105,20,0.1)',
                padding: '16px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg 
                  className="w-10 h-10 animate-pulse" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '40px', height: '40px' }}
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </div>
            </div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '22px',
              fontWeight: 600,
              color: '#1a1209',
              margin: '0 0 10px',
            }}>
              Find Nearest Boutique
            </h3>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '13.5px',
              color: 'rgba(26,18,9,0.7)',
              lineHeight: '1.5',
              margin: '0 0 24px',
            }}>
              Are you looking for the nearest Winsor shop? Allow us to access your location to show showrooms sorted by proximity.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowGPSModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(26,18,9,0.15)',
                  borderRadius: '6px',
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '12px',
                  color: '#1a1209',
                  cursor: 'pointer',
                }}
              >
                No, Show All
              </button>
              <button
                onClick={handleConfirmGPS}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#8B6914',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '12px',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139, 105, 20, 0.25)',
                }}
              >
                Yes, Locate Me
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
