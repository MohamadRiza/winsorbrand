'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

const RetailersMap = dynamic(() => import('@/components/RetailersMap'), { ssr: false });

interface Retailer {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  googleMapsLink: string;
  phone?: string;
  websiteUrl?: string;
  operatingHours?: {
    weekdays: { isOpen: boolean; openTime: string; closeTime: string };
    saturday: { isOpen: boolean; openTime: string; closeTime: string };
    sunday: { isOpen: boolean; openTime: string; closeTime: string };
  };
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

function getTodayHours(operatingHours: Retailer['operatingHours']) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const todayName = days[todayIndex];

  // Default fallback values matching client layout
  const defaultHours = {
    weekdays: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
    saturday: { isOpen: true, openTime: '09:30', closeTime: '19:00' },
    sunday: { isOpen: false, openTime: '10:00', closeTime: '18:00' },
  };

  const schedule = operatingHours || defaultHours;

  let currentDayHours;
  if (todayIndex === 0) {
    currentDayHours = schedule.sunday;
  } else if (todayIndex === 6) {
    currentDayHours = schedule.saturday;
  } else {
    currentDayHours = schedule.weekdays;
  }

  // Format times from 24h to 12h format
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutesStr} ${ampm}`;
  };

  if (!currentDayHours || !currentDayHours.isOpen) {
    return {
      statusText: 'Closed Today',
      timeText: 'Closed',
      dayName: todayName,
      isOpen: false
    };
  }

  const openTimeFormatted = formatTime(currentDayHours.openTime);
  const closeTimeFormatted = formatTime(currentDayHours.closeTime);

  return {
    statusText: `${openTimeFormatted} - ${closeTimeFormatted}`,
    timeText: `${openTimeFormatted} - ${closeTimeFormatted}`,
    dayName: todayName,
    isOpen: true
  };
}

export default function StoreLocatorPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  // GPS / Geolocation States
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  // Active / Highlighted Boutique selection
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [listLimit, setListLimit] = useState(4);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/retailers');
      let data: any = { success: false };
      try {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          data = await res.json();
        }
      } catch (e) {
        console.warn('Failed to parse retailers JSON:', e);
      }

      if (data.success) {
        const fetchedList = data.data || [];
        setRetailers(fetchedList);
        setCities(data.cities || []);
        setCountries(data.countries || []);

        if (fetchedList.length > 0) {
          setSelectedBoutiqueId(fetchedList[0]._id);
        }
      }
    } catch (error) {
      console.warn('Failed to load store list:', error);
      toast.error('Could not load store locator list');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateGPS = () => {
    setShowGPSModal(true);
  };

  const handleConfirmGPS = () => {
    setShowGPSModal(false);
    setGpsLoading(true);

    const runFallbackIPLocation = async () => {
      console.warn('Attempting IP-based geolocation fallback...');

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            setUserCoords({ latitude: data.latitude, longitude: data.longitude });
            setGpsActive(true);
            setGpsLoading(false);
            toast.success('Location resolved! Sorting boutiques by proximity.');
            return true;
          }
        }
      } catch (err) {
        console.warn('ipapi.co failed, trying freeipapi...', err);
      }

      try {
        const res = await fetch('https://freeipapi.com/api/json');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            setUserCoords({ latitude: data.latitude, longitude: data.longitude });
            setGpsActive(true);
            setGpsLoading(false);
            toast.success('Location resolved! Sorting boutiques by proximity.');
            return true;
          }
        }
      } catch (err) {
        console.warn('freeipapi.com failed too', err);
      }

      setGpsLoading(false);
      setGpsActive(false);
      setUserCoords(null);
      toast.error('Could not resolve your location. Showing standard listings.');
      return false;
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      runFallbackIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        setGpsActive(true);
        setGpsLoading(false);
        toast.success('Proximity search matched! Sorting boutiques.');
      },
      (error) => {
        console.warn('Browser Geolocation failed, trying IP fallback:', error.message || error);
        runFallbackIPLocation();
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
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

      // Sort by distance (nearest first)
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

  // Sync selected boutique when list is filtered
  useEffect(() => {
    if (processedRetailers.length > 0) {
      const exists = processedRetailers.some(r => r._id === selectedBoutiqueId);
      if (!exists) {
        setSelectedBoutiqueId(processedRetailers[0]._id);
      }
    } else {
      setSelectedBoutiqueId(null);
    }
    setSliderIndex(0);
  }, [searchQuery, selectedCity, selectedCountry, gpsActive, retailers]);

  // Selected boutique details helper
  const selectedBoutique = retailers.find(r => r._id === selectedBoutiqueId) || null;
  const todayHours = selectedBoutique ? getTodayHours(selectedBoutique.operatingHours) : null;

  // Build images array for slider
  const sliderImages = (() => {
    if (!selectedBoutique) return [];
    const mainImg = selectedBoutique.image?.url || BOUTIQUE_PLACEHOLDER;
    return [mainImg];
  })();

  const handleNextSlide = () => {
    setSliderIndex(prev => (prev + 1) % sliderImages.length);
  };

  const handlePrevSlide = () => {
    setSliderIndex(prev => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  return (
    <div style={{ backgroundColor: '#faf7f0', minHeight: '100vh', width: '100%', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600;700&display=swap');

        /* ── LUXURY HERO BANNER ── */
        .locator-hero-banner {
          position: relative;
          min-height: 460px;
          background-image: 
            linear-gradient(180deg, rgba(10, 8, 5, 0.82) 0%, rgba(10, 8, 5, 0.7) 50%, rgba(10, 8, 5, 0.95) 100%),
            radial-gradient(circle at 50% 30%, rgba(223, 177, 91, 0.18) 0%, transparent 65%),
            url('/KCC.webp');
          background-size: cover;
          background-position: center 35%;
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
          padding: 8px 20px;
          background: rgba(139, 105, 20, 0.22);
          border: 1px solid rgba(223, 177, 91, 0.45);
          border-radius: 30px;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          font-weight: 600;
          color: #dfb15b;
          margin-bottom: 18px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .locator-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 4.5vw, 56px);
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0 0 14px;
          color: #ffffff;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
          line-height: 1.15;
        }

        .locator-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: clamp(13px, 1.2vw, 15px);
          font-weight: 300;
          letter-spacing: 0.04em;
          color: rgba(250, 247, 240, 0.85);
          max-width: 680px;
          line-height: 1.65;
          margin: 0;
        }

        /* ── FLOATING TOOLBAR ── */
        .locator-toolbar {
          max-width: 1300px;
          width: calc(100% - 48px);
          margin: -36px auto 36px;
          background: #ffffff;
          border: 1.5px solid rgba(139, 105, 20, 0.18);
          border-radius: 12px;
          padding: 18px 24px;
          box-shadow: 0 12px 36px rgba(26,18,9,0.06);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 15;
          position: relative;
        }
        .locator-search-container {
          position: relative;
          flex: 1.6;
          min-width: 240px;
        }
        .search-icon-svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b6914;
        }
        .search-input-field {
          width: 100%;
          box-sizing: border-box;
          background: #fdfaf6;
          border: 1.5px solid rgba(26,18,9,0.12);
          border-radius: 8px;
          padding: 12px 16px 12px 46px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          transition: all 0.25s ease;
        }
        .search-input-field:focus {
          border-color: #8b6914;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.12);
        }
        
        .locator-filter-select {
          flex: 1;
          min-width: 140px;
          background: #ffffff;
          border: 1.5px solid rgba(26,18,9,0.12);
          border-radius: 8px;
          padding: 12px 36px 12px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: #1a1209;
          outline: none;
          cursor: pointer;
          transition: all 0.25s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B6914' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 14px;
        }
        .locator-filter-select:focus {
          border-color: #8b6914;
          box-shadow: 0 0 0 3px rgba(139,105,20,0.12);
        }

        .location-trigger-btn {
          background: linear-gradient(135deg, #1a1209 0%, #2b2016 100%);
          color: #ffffff;
          border: 1px solid rgba(139, 105, 20, 0.4);
          border-radius: 8px;
          padding: 13px 24px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(26,18,9,0.12);
        }
        .location-trigger-btn:hover {
          background: #8b6914;
          border-color: #8b6914;
          box-shadow: 0 6px 20px rgba(139, 105, 20, 0.25);
          transform: translateY(-1px);
        }
        .location-trigger-btn.gps-active {
          background: #8b6914;
        }

        /* ── MAIN WORKSPACE CONTAINER ── */
        .locator-main-wrapper {
          background-color: #faf7f0;
          padding: 0 4% 80px;
          font-family: 'Jost', sans-serif;
        }
        .locator-workspace-grid {
          max-width: 1300px;
          margin: 0 auto 56px;
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 36px;
          align-items: flex-start;
        }

        /* ── RETAILERS LIST (LEFT) ── */
        .list-column-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .list-result-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(26,18,9,0.55);
          text-transform: uppercase;
          margin: 0 0 4px;
        }
        .list-result-tag span {
          color: #8b6914;
          font-weight: 800;
          margin-right: 4px;
        }

        .retailer-card {
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.08);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          height: 180px;
        }
        .retailer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(26,18,9,0.06);
          border-color: rgba(139,105,20,0.3);
        }
        .retailer-card.selected {
          border-color: #8b6914;
          border-width: 2px;
          box-shadow: 0 10px 28px rgba(139,105,20,0.14);
        }
        
        .retailer-card-img-side {
          position: relative;
          width: 150px;
          height: 100%;
          flex-shrink: 0;
        }
        .retailer-card-details-side {
          padding: 18px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }
        .retailer-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(139,105,20,0.08);
          color: #8b6914;
          border: 1px solid rgba(139,105,20,0.18);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 6px;
        }
        .retailer-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 600;
          color: #1a1209;
          margin: 0 0 4px;
          line-height: 1.25;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .retailer-card-addr {
          font-size: 11.5px;
          color: rgba(26,18,9,0.58);
          margin: 0 0 8px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .retailer-card-distance {
          font-size: 10.5px;
          font-weight: 600;
          color: #8b6914;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .retailer-card-actions {
          display: flex;
          gap: 12px;
          border-top: 1px solid rgba(26,18,9,0.06);
          padding-top: 10px;
          margin-top: auto;
        }
        .card-action-link {
          font-family: 'Jost', sans-serif;
          font-size: 10.5px;
          font-weight: 600;
          color: #8b6914;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }
        .card-action-link:hover {
          color: #1a1209;
        }

        .load-more-locator-btn {
          width: 100%;
          text-align: center;
          background: #ffffff;
          border: 1.5px solid rgba(139,105,20,0.25);
          border-radius: 8px;
          padding: 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1a1209;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }
        .load-more-locator-btn:hover {
          background: #1a1209;
          color: #ffffff;
          border-color: #1a1209;
        }

        /* ── MAP CONTAINER (RIGHT) ── */
        .map-column-container {
          position: sticky;
          top: 100px;
          height: 580px;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid rgba(139, 105, 20, 0.2);
          box-shadow: 0 16px 40px rgba(0,0,0,0.05);
          z-index: 5;
        }

        /* ── HIGHLIGHT DETAIL BOX ── */
        .boutique-highlight-panel {
          max-width: 1300px;
          margin: 0 auto 56px;
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.08);
          border-top: 3.5px solid #8b6914;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.03);
          display: grid;
          grid-template-columns: 1.2fr 1fr;
        }
        .highlight-slider-side {
          background: #faf7f0;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-right: 1.5px solid rgba(26,18,9,0.06);
        }
        .highlight-main-frame {
          position: relative;
          aspect-ratio: 16/10;
          border-radius: 12px;
          overflow: hidden;
          background: #eee;
          box-shadow: 0 4px 18px rgba(0,0,0,0.04);
        }

        .highlight-content-side {
          padding: 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .highlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(139,105,20,0.08);
          color: #8b6914;
          border: 1px solid rgba(139,105,20,0.18);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 4px;
          width: fit-content;
          margin-bottom: 16px;
        }
        .highlight-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3.5vw, 36px);
          font-weight: 500;
          color: #1a1209;
          margin: 0 0 8px;
          line-height: 1.2;
          letter-spacing: 0.01em;
        }
        .highlight-addr {
          font-size: 13.5px;
          color: rgba(26,18,9,0.6);
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .highlight-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .info-card-block {
          background: #faf7f0;
          border: 1px solid rgba(139,105,20,0.12);
          border-radius: 8px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          min-height: 80px;
        }
        .info-card-block svg {
          margin: 0 auto 6px;
          color: #8b6914;
        }
        .info-card-val {
          font-size: 12px;
          font-weight: 600;
          color: #1a1209;
          margin-bottom: 2px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .info-card-label {
          font-size: 9px;
          color: rgba(26,18,9,0.45);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .highlight-desc {
          font-size: 13px;
          color: rgba(26,18,9,0.65);
          line-height: 1.6;
          margin: 0 0 28px;
        }

        .highlight-actions-row {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .highlight-action-btn {
          flex: 1;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          color: #1a1209;
          border: 1.5px solid rgba(26,18,9,0.14);
          border-radius: 8px;
          padding: 13px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .highlight-action-btn:hover {
          background: #1a1209;
          color: #fff;
          border-color: #1a1209;
        }
        .highlight-action-btn.primary {
          background: #8b6914;
          color: #fff;
          border-color: #8b6914;
        }
        .highlight-action-btn.primary:hover {
          background: #a37c17;
          border-color: #a37c17;
          box-shadow: 0 4px 15px rgba(139,105,20,0.25);
        }

        /* ── SERVICE FEATURES BANNER ── */
        .locator-features-banner {
          max-width: 1300px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid rgba(26,18,9,0.08);
          border-radius: 14px;
          padding: 32px 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.02);
        }
        .feature-block-item {
          display: flex;
          align-items: center;
          gap: 16px;
          border-right: 1px solid rgba(26,18,9,0.08);
          padding-right: 16px;
        }
        .feature-block-item:last-child {
          border-right: none;
          padding-right: 0;
        }
        .feature-item-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(139,105,20,0.08);
          border: 1px solid rgba(139,105,20,0.2);
          color: #8b6914;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .feature-item-details h5 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a1209;
          margin: 0 0 3px;
        }
        .feature-item-details p {
          font-size: 11px;
          color: rgba(26,18,9,0.5);
          margin: 0;
          line-height: 1.4;
        }

        /* ── GPS MODAL DIALOG ── */
        .gps-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(10,8,6,0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 24px;
        }
        .gps-modal-box {
          background: #ffffff;
          border-radius: 16px;
          border: 1.5px solid rgba(139,105,20,0.2);
          box-shadow: 0 24px 60px rgba(26,18,9,0.2);
          width: 100%;
          max-width: 420px;
          padding: 32px;
          text-align: center;
          animation: modal-zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modal-zoom {
          from { transform: scale(0.9) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* ── RESPONSIVE STYLES ── */
        @media (max-width: 1024px) {
          .locator-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 28px;
          }
          .locator-search-container, .locator-filter-select, .location-trigger-btn {
            width: 100%;
          }
          .locator-workspace-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .map-column-container {
            position: relative;
            top: 0;
            height: 380px;
          }
          .boutique-highlight-panel {
            grid-template-columns: 1fr;
          }
          .highlight-slider-side {
            border-right: none;
            border-bottom: 1.5px solid rgba(26,18,9,0.06);
          }
          .locator-features-banner {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
          .feature-block-item {
            border-right: none;
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
        }

        @media (max-width: 640px) {
          .locator-hero-banner {
            min-height: 380px;
            padding-top: 100px;
            background-attachment: scroll;
          }
          .retailer-card {
            flex-direction: column;
            height: auto;
          }
          .retailer-card-img-side {
            width: 100%;
            height: 160px;
          }
          .retailer-card-details-side {
            padding: 16px;
          }
          .highlight-content-side {
            padding: 24px;
          }
          .highlight-info-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .info-card-block {
            padding: 12px 6px !important;
            border-radius: 10px !important;
            min-height: 72px !important;
          }
          .info-card-val {
            font-size: 11px !important;
            line-height: 1.25 !important;
          }
          .info-card-label {
            font-size: 8.5px !important;
          }
          .highlight-actions-row {
            flex-direction: column;
            gap: 10px;
          }
          .highlight-action-btn {
            width: 100%;
          }
          .locator-features-banner {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
            padding: 18px 14px !important;
          }
          .feature-block-item {
            padding-right: 0 !important;
            border-right: none !important;
            gap: 10px !important;
            align-items: center !important;
          }
          .feature-item-icon {
            width: 36px !important;
            height: 36px !important;
            flex-shrink: 0 !important;
          }
          .feature-item-details h5 {
            font-size: 10px !important;
            margin: 0 !important;
            line-height: 1.2 !important;
            letter-spacing: 0.04em !important;
          }
          .feature-item-details p {
            display: none !important;
          }
        }
      `}</style>

      {/* ── LUXURY HERO BANNER SECTION ── */}
      <section className="locator-hero-banner">
        <div className="hero-badge-pill">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span>AUTHORIZED RETAILERS & BOUTIQUES</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#dfb15b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </div>
        <h1 className="locator-title">Find A Retailer</h1>
        <p className="locator-subtitle">
          Discover official Winsor partner showrooms and flagship boutiques across Sri Lanka and internationally for an exceptional horological experience.
        </p>
      </section>

      {/* ── SEARCH TOOLBAR ── */}
      <section className="locator-toolbar">
        <div className="locator-search-container">
          <svg className="search-icon-svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by boutique name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="locator-filter-select"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          aria-label="Filter by City"
        >
          <option value="all">All Cities</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="locator-filter-select"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          aria-label="Filter by Country"
        >
          <option value="all">All Countries</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          className={`location-trigger-btn ${gpsActive ? 'gps-active' : ''}`}
          onClick={gpsActive ? handleDeactivateGPS : handleActivateGPS}
          disabled={gpsLoading}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.2" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {gpsLoading ? 'Locating...' : gpsActive ? 'GPS ACTIVE' : 'USE MY LOCATION'}
        </button>
      </section>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="locator-main-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid rgba(139,105,20,0.15)', borderTopColor: '#8b6914',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
            }} />
            <p style={{ color: 'rgba(26,18,9,0.5)', fontSize: '13px', letterSpacing: '0.04em' }}>Loading authorized showrooms…</p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : (
          <>
            <div className="locator-workspace-grid">

              {/* LEFT: BOUTIQUE LIST */}
              <div className="list-column-container">
                <h3 className="list-result-tag">
                  <span>{processedRetailers.length}</span> Retailers Found
                </h3>

                {processedRetailers.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed rgba(26,18,9,0.1)' }}>
                    <p style={{ color: 'rgba(26,18,9,0.45)', fontSize: '13px', margin: 0 }}>No showrooms match your filter criteria.</p>
                  </div>
                ) : (
                  <>
                    {processedRetailers.slice(0, listLimit).map(r => {
                      const isSelected = r._id === selectedBoutiqueId;
                      return (
                        <div
                          key={r._id}
                          className={`retailer-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedBoutiqueId(r._id);
                            setSliderIndex(0);
                          }}
                        >
                          <div className="retailer-card-img-side">
                            <img
                              src={r.image?.url || BOUTIQUE_PLACEHOLDER}
                              alt={r.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="retailer-card-details-side">
                            <div>
                              <span className="retailer-card-badge">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                Authorized Partner
                              </span>
                              <h4 className="retailer-card-name">{r.name}</h4>
                              <p className="retailer-card-addr">{r.address}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="retailer-card-distance">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {r.distance !== undefined ? `${r.distance.toFixed(1)} km away` : `${r.city}, ${r.country}`}
                              </span>

                              <div className="retailer-card-actions" onClick={(e) => e.stopPropagation()}>
                                {r.phone && (
                                  <a href={`tel:${r.phone}`} className="card-action-link">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    Call
                                  </a>
                                )}
                                <a href={r.googleMapsLink} target="_blank" rel="noopener noreferrer" className="card-action-link">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                  Directions
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {processedRetailers.length > listLimit && (
                      <button
                        className="load-more-locator-btn"
                        onClick={() => setListLimit(prev => prev + 4)}
                      >
                        Load More Showrooms ({processedRetailers.length - listLimit} Remaining)
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT: LEAFLET MAP */}
              <div className="map-column-container">
                <RetailersMap
                  retailers={processedRetailers}
                  selectedId={selectedBoutiqueId}
                  onSelectRetailer={setSelectedBoutiqueId}
                  userCoords={userCoords}
                />
              </div>

            </div>

            {/* DETAIL HIGHLIGHT PANEL */}
            {selectedBoutique && (
              <section className="boutique-highlight-panel">

                {/* Image Slider Column */}
                <div className="highlight-slider-side">
                  <div className="highlight-main-frame">
                    <img
                      src={sliderImages[sliderIndex]}
                      alt="Boutique Showroom Interior"
                      className="w-full h-full object-cover"
                    />

                    {sliderImages.length > 1 && (
                      <>
                        <button className="slider-nav-arrow prev" onClick={handlePrevSlide} aria-label="Previous Slide">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <button className="slider-nav-arrow next" onClick={handleNextSlide} aria-label="Next Slide">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info Details Column */}
                <div className="highlight-content-side font-['Jost']">
                  <span className="highlight-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Authorized Showroom Partner
                  </span>
                  <h2 className="highlight-name">{selectedBoutique.name}</h2>
                  <p className="highlight-addr">{selectedBoutique.address}</p>

                  <div className="highlight-info-grid">
                    <div className="info-card-block">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>
                      <span className="info-card-val">{selectedBoutique.country}</span>
                      <span className="info-card-label">Region</span>
                    </div>
                    <div className="info-card-block">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="info-card-val">{todayHours ? todayHours.statusText : '9:30 AM - 7:00 PM'}</span>
                      <span className="info-card-label">
                        {todayHours ? `${todayHours.isOpen ? 'Open' : 'Closed'} (${todayHours.dayName})` : 'Open Today'}
                      </span>
                    </div>
                    <div className="info-card-block">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span className="info-card-val">{selectedBoutique.phone || '011 234 4567'}</span>
                      <span className="info-card-label">Phone</span>
                    </div>
                  </div>

                  <p className="highlight-desc">
                    {selectedBoutique.name} is an official Winsor partner showroom. Explore the complete handcrafted Winsor timepiece collection with expert horology guidance and official after-sales support.
                  </p>

                  <div className="highlight-actions-row">
                    {selectedBoutique.phone && (
                      <a href={`tel:${selectedBoutique.phone}`} className="highlight-action-btn primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        Call Showroom
                      </a>
                    )}
                    <a href={selectedBoutique.googleMapsLink} target="_blank" rel="noopener noreferrer" className="highlight-action-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                      Directions
                    </a>
                    {selectedBoutique.websiteUrl && (
                      <a href={selectedBoutique.websiteUrl} target="_blank" rel="noopener noreferrer" className="highlight-action-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                        Website
                      </a>
                    )}
                  </div>
                </div>

              </section>
            )}

            {/* WHOLESALE & SHOP REGISTRATION CALLOUT */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1209 0%, #2a1f10 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '28px 36px',
              marginBottom: '40px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 12px 32px rgba(26,18,9,0.15)',
              border: '1px solid rgba(223,177,91,0.3)'
            }}>
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#dfb15b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  BECOME AN AUTHORIZED RETAILER / WHOLESALE
                </span>
                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: '#ffffff' }}>
                  Register for Wholesale or Shop Purchases
                </h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
                  Expand your store catalog with luxury Winsor timepieces. Contact our Head Office concierge to initiate your retailer application or place wholesale orders.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="tel:0770716212"
                  style={{
                    padding: '12px 20px',
                    background: '#8b6914',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(139, 105, 20, 0.3)'
                  }}
                >
                  Call Head Office: 077 071 6212
                </a>
                <a
                  href="tel:0778778555"
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    letterSpacing: '0.05em'
                  }}
                >
                  Line 2: 077 877 8555
                </a>
              </div>
            </div>

            {/* SERVICES BANNER */}
            <section className="locator-features-banner">
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Authorized Retailers</h5>
                  <p>100% genuine products with official warranty.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Expert Service</h5>
                  <p>Professional guidance and after-sales support.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="12 8 8 12 12 16 16 12 12 8" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Premium Experience</h5>
                  <p>Discover the complete Winsor collection.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Global Standard</h5>
                  <p>International service and support network.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* GPS Confirmation Popup Modal */}
      {showGPSModal && (
        <div className="gps-modal-overlay">
          <div className="gps-modal-box">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#8b6914' }}>
              <div style={{ background: 'rgba(139,105,20,0.08)', padding: '16px', borderRadius: '50%', display: 'inline-flex' }}>
                <svg className="animate-pulse" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </div>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#1a1209', margin: '0 0 10px' }}>
              Find Nearest Boutique
            </h3>
            <p style={{ fontSize: '13.5px', color: 'rgba(26,18,9,0.7)', lineHeight: '1.5', margin: '0 0 24px' }}>
              Allow us to access your browser location to display authorized showrooms sorted by proximity.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowGPSModal(false)}
                style={{
                  flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(26,18,9,0.15)',
                  borderRadius: '8px', fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#1a1209', cursor: 'pointer'
                }}
              >
                No, Show All
              </button>
              <button
                onClick={handleConfirmGPS}
                style={{
                  flex: 1, padding: '12px', background: '#8b6914', border: 'none', borderRadius: '8px',
                  fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#ffffff', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 105, 20, 0.25)'
                }}
              >
                Yes, Locate Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
