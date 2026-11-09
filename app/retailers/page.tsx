'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import RetailersHeroTypewriter from './RetailersHeroTypewriter';

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

const BOUTIQUE_PLACEHOLDER = '/KCC.webp';

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
      isOpen: false,
    };
  }

  const openTimeFormatted = formatTime(currentDayHours.openTime);
  const closeTimeFormatted = formatTime(currentDayHours.closeTime);

  return {
    statusText: `${openTimeFormatted} - ${closeTimeFormatted}`,
    timeText: `${openTimeFormatted} - ${closeTimeFormatted}`,
    dayName: todayName,
    isOpen: true,
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
    <div style={{ backgroundColor: '#F8F7F4', minHeight: '100vh', width: '100%', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        /* ── HERO BANNER ── */
        .locator-hero-banner {
          position: relative;
          min-height: 400px;
          background-image: 
            linear-gradient(180deg, rgba(14, 14, 14, 0.78) 0%, rgba(14, 14, 14, 0.68) 50%, rgba(14, 14, 14, 0.90) 100%),
            url('/KCC.webp');
          background-size: cover;
          background-position: center 35%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #ffffff;
          padding: 124px 24px 58px;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 4px;
          font-family: 'Jost', sans-serif;
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 14px;
          backdrop-filter: blur(8px);
        }

        /* ── FLOATING TOOLBAR ── */
        .locator-toolbar {
          max-width: 1280px;
          width: calc(100% - 48px);
          box-sizing: border-box;
          margin: -28px auto 32px;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 8px;
          padding: 12px 18px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 15;
          position: relative;
        }
        .locator-search-container {
          position: relative;
          flex: 1.6;
          min-width: 200px;
        }
        .search-icon-svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #777777;
          pointer-events: none;
        }
        .search-input-field {
          width: 100%;
          box-sizing: border-box;
          background: #F8F7F4;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 6px;
          padding: 10.5px 14px 10.5px 40px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #141414;
          outline: none;
          transition: all 0.2s ease;
        }
        .search-input-field::placeholder {
          color: #888888;
        }
        .search-input-field:focus {
          border-color: #141414;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.04);
        }
        
        .locator-filter-select {
          flex: 1;
          min-width: 130px;
          box-sizing: border-box;
          background-color: #F8F7F4;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 6px;
          padding: 10.5px 34px 10.5px 13px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #141414;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23444444' stroke-width='1.8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 13px;
        }
        .locator-filter-select:focus {
          border-color: #141414;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.04);
        }

        .location-trigger-btn {
          background: #141414;
          color: #ffffff;
          border: 1px solid #141414;
          border-radius: 6px;
          padding: 10.5px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .location-trigger-btn:hover {
          background: #2C2C2C;
          border-color: #2C2C2C;
        }
        .location-trigger-btn.gps-active {
          background: #8B6914;
          border-color: #8B6914;
        }

        /* ── MAIN WORKSPACE CONTAINER ── */
        .locator-main-wrapper {
          background-color: #F8F7F4;
          padding: 0 24px 64px;
          font-family: 'Jost', sans-serif;
          box-sizing: border-box;
        }
        .locator-workspace-grid {
          max-width: 1280px;
          margin: 0 auto 40px;
          display: grid;
          grid-template-columns: 460px minmax(0, 1fr);
          gap: 24px;
          align-items: flex-start;
        }

        /* ── RETAILERS LIST (LEFT) ── */
        .list-column-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
          width: 100%;
        }
        .list-result-tag {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: #777777;
          text-transform: uppercase;
          margin: 0 0 4px;
        }
        .list-result-tag span {
          color: #141414;
          font-weight: 600;
          margin-right: 3px;
        }

        .retailer-card {
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: stretch;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-height: 160px;
          width: 100%;
          box-sizing: border-box;
        }
        .retailer-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
          border-color: rgba(20, 20, 20, 0.18);
        }
        .retailer-card.selected {
          border: 1.5px solid #141414;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
        }
        
        .retailer-card-img-side {
          position: relative;
          width: 140px;
          min-height: 160px;
          align-self: stretch;
          flex-shrink: 0;
          overflow: hidden;
          background: #F4F3F0;
        }
        .retailer-card-img-side img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .retailer-card:hover .retailer-card-img-side img {
          transform: scale(1.03);
        }

        .retailer-card-details-side {
          padding: 14px 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          box-sizing: border-box;
        }
        .retailer-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #F8F7F4;
          color: #666666;
          border: 1px solid rgba(20, 20, 20, 0.06);
          border-radius: 3px;
          padding: 2.5px 8px;
          font-size: 8.5px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 6px;
        }
        .retailer-card-name {
          font-family: 'Jost', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: #141414;
          margin: 0 0 3px;
          line-height: 1.35;
          letter-spacing: 0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .retailer-card-addr {
          font-size: 11.5px;
          font-weight: 400;
          color: #666666;
          margin: 0 0 8px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .retailer-card-distance {
          font-size: 11px;
          font-weight: 400;
          color: #666666;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 1;
        }
        .retailer-card-distance svg {
          color: #8B6914;
        }
        
        .retailer-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-top: 1px solid rgba(20, 20, 20, 0.06);
          padding-top: 9px;
          margin-top: auto;
          width: 100%;
        }
        .retailer-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .card-action-link {
          font-family: 'Jost', sans-serif;
          font-size: 10.5px;
          font-weight: 500;
          color: #333333;
          letter-spacing: 0.02em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3.5px 8px;
          border-radius: 4px;
          background: #F8F7F4;
          border: 1px solid rgba(20, 20, 20, 0.08);
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .card-action-link:hover {
          color: #ffffff;
          background: #141414;
          border-color: #141414;
        }

        .load-more-locator-btn {
          width: 100%;
          text-align: center;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 6px;
          padding: 10.5px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #141414;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .load-more-locator-btn:hover {
          background: #141414;
          color: #ffffff;
          border-color: #141414;
        }

        /* ── MAP CONTAINER (RIGHT) ── */
        .map-column-container {
          position: sticky;
          top: 104px;
          height: 560px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(20, 20, 20, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          background: #FFFFFF;
          z-index: 5;
        }

        /* ── HIGHLIGHT DETAIL BOX ── */
        .boutique-highlight-panel {
          max-width: 1280px;
          margin: 0 auto 40px;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.03);
          display: grid;
          grid-template-columns: 1.1fr minmax(0, 1fr);
        }
        .highlight-slider-side {
          background: #F8F7F4;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 14px;
          border-right: 1px solid rgba(20, 20, 20, 0.07);
        }
        .highlight-main-frame {
          position: relative;
          aspect-ratio: 16/10;
          border-radius: 6px;
          overflow: hidden;
          background: #EBE9E4;
          border: 1px solid rgba(20, 20, 20, 0.08);
        }
        .highlight-main-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .highlight-main-frame:hover img {
          transform: scale(1.02);
        }

        .highlight-content-side {
          padding: 34px 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .highlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #F8F7F4;
          color: #666666;
          border: 1px solid rgba(20, 20, 20, 0.07);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 3px;
          width: fit-content;
          margin-bottom: 12px;
        }
        .highlight-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(22px, 2.2vw, 28px);
          font-weight: 400;
          color: #141414;
          margin: 0 0 6px;
          line-height: 1.25;
          letter-spacing: 0.01em;
        }
        .highlight-addr {
          font-size: 13px;
          font-weight: 400;
          color: #666666;
          line-height: 1.5;
          margin: 0 0 18px;
        }

        .highlight-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .info-card-block {
          background: #F8F7F4;
          border: 1px solid rgba(20, 20, 20, 0.06);
          border-radius: 6px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          min-height: 72px;
        }
        .info-card-block svg {
          margin: 0 auto 5px;
          color: #8B6914;
        }
        .info-card-val {
          font-size: 11.5px;
          font-weight: 500;
          color: #141414;
          margin-bottom: 2px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .info-card-label {
          font-size: 9px;
          color: #777777;
          text-transform: uppercase;
          font-weight: 400;
          letter-spacing: 0.04em;
        }

        .highlight-desc {
          font-size: 12.5px;
          font-weight: 400;
          color: #555555;
          line-height: 1.6;
          margin: 0 0 22px;
        }

        .highlight-actions-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .highlight-action-btn {
          flex: 1;
          min-width: 125px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #FFFFFF;
          color: #141414;
          border: 1px solid rgba(20, 20, 20, 0.14);
          border-radius: 5px;
          padding: 10px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .highlight-action-btn:hover {
          background: #141414;
          color: #ffffff;
          border-color: #141414;
        }
        .highlight-action-btn.primary {
          background: #141414;
          color: #ffffff;
          border-color: #141414;
        }
        .highlight-action-btn.primary:hover {
          background: #2C2C2C;
          border-color: #2C2C2C;
        }

        /* ── WHOLESALE BANNER ── */
        .locator-wholesale-banner {
          max-width: 1280px;
          margin: 0 auto 32px;
          background: #141414;
          color: #ffffff;
          border-radius: 10px;
          padding: 28px 32px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-sizing: border-box;
        }

        /* ── SERVICE FEATURES BANNER ── */
        .locator-features-banner {
          max-width: 1280px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 8px;
          padding: 22px 20px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          box-sizing: border-box;
        }
        .feature-block-item {
          display: flex;
          align-items: center;
          gap: 12px;
          border-right: 1px solid rgba(20, 20, 20, 0.08);
          padding-right: 14px;
        }
        .feature-block-item:last-child {
          border-right: none;
          padding-right: 0;
        }
        .feature-item-icon {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background: #F8F7F4;
          border: 1px solid rgba(20, 20, 20, 0.07);
          color: #141414;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .feature-item-details h5 {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #141414;
          margin: 0 0 2px;
        }
        .feature-item-details p {
          font-size: 11px;
          font-weight: 400;
          color: #666666;
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
          background: rgba(14, 14, 14, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 24px;
        }
        .gps-modal-box {
          background: #FFFFFF;
          border-radius: 10px;
          border: 1px solid rgba(20, 20, 20, 0.1);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
          padding: 28px 24px;
          text-align: center;
          animation: modal-zoom 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modal-zoom {
          from { transform: scale(0.96) translateY(6px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* ── RESPONSIVE STYLES ── */
        @media (max-width: 1024px) {
          .locator-toolbar {
            flex-direction: column;
            align-items: stretch;
            width: calc(100% - 32px);
            margin-bottom: 24px;
          }
          .locator-search-container, .locator-filter-select, .location-trigger-btn {
            width: 100%;
            min-width: 0;
          }
          .locator-main-wrapper {
            padding: 0 16px 56px;
          }
          .locator-workspace-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
          }
          .map-column-container {
            position: relative;
            top: 0;
            height: 360px;
          }
          .boutique-highlight-panel {
            grid-template-columns: minmax(0, 1fr);
          }
          .highlight-slider-side {
            border-right: none;
            border-bottom: 1px solid rgba(20, 20, 20, 0.07);
            padding: 18px;
          }
          .locator-features-banner {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .feature-block-item {
            border-right: none;
          }
        }

        @media (max-width: 640px) {
          .locator-hero-banner {
            min-height: 340px;
            padding: 96px 16px 48px;
          }
          .retailer-card {
            flex-direction: column;
            min-height: auto;
          }
          .retailer-card-img-side {
            width: 100%;
            height: 160px;
            min-height: 160px;
          }
          .retailer-card-details-side {
            padding: 14px;
          }
          .retailer-card-name {
            white-space: normal;
          }
          .highlight-content-side {
            padding: 22px 18px;
          }
          .highlight-info-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }
          .info-card-block {
            padding: 10px 5px !important;
            border-radius: 5px !important;
            min-height: 68px !important;
          }
          .info-card-val {
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }
          .info-card-label {
            font-size: 8px !important;
          }
          .highlight-actions-row {
            flex-direction: column;
            gap: 8px;
          }
          .highlight-action-btn {
            width: 100%;
          }
          .locator-wholesale-banner {
            padding: 22px 18px;
          }
          .locator-features-banner {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px 10px !important;
            padding: 16px 12px !important;
          }
          .feature-block-item {
            padding-right: 0 !important;
            border-right: none !important;
            gap: 8px !important;
            align-items: center !important;
          }
          .feature-item-icon {
            width: 32px !important;
            height: 32px !important;
            flex-shrink: 0 !important;
          }
          .feature-item-details h5 {
            font-size: 9.5px !important;
            margin: 0 !important;
            line-height: 1.25 !important;
            letter-spacing: 0.02em !important;
          }
          .feature-item-details p {
            display: none !important;
          }
        }
      `}</style>

      {/* ── HERO BANNER SECTION ── */}
      <section className="locator-hero-banner">
        <div className="hero-badge-pill">
          <span>AUTHORIZED RETAIL NETWORK</span>
        </div>
        <RetailersHeroTypewriter
          title="Find An Authorized Retailer"
          subtitle="Discover verified Winsor showrooms and authorized retail partners across Sri Lanka for authentic timepieces, fittings, and official warranty support."
        />
      </section>

      {/* ── SEARCH TOOLBAR ── */}
      <section className="locator-toolbar">
        <div className="locator-search-container">
          <svg className="search-icon-svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by showroom name or city..."
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div style={{ textAlign: 'center', padding: '90px 20px' }}>
            <div style={{
              width: '30px', height: '30px', border: '2px solid rgba(20,20,20,0.12)', borderTopColor: '#141414',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px'
            }} />
            <p style={{ color: '#666666', fontSize: '12px', letterSpacing: '0.04em' }}>Loading authorized showrooms…</p>
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
                  <div style={{ padding: '36px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(20,20,20,0.08)' }}>
                    <p style={{ color: '#666666', fontSize: '12.5px', margin: 0 }}>No showrooms match your filter criteria.</p>
                  </div>
                ) : (
                  <>
                    {processedRetailers.slice(0, listLimit).map(r => {
                      const isSelected = r._id === selectedBoutiqueId;
                      const cardImg = r.image?.url && r.image.url.trim() !== '' ? r.image.url : BOUTIQUE_PLACEHOLDER;
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
                              src={cardImg}
                              alt={r.name}
                              onError={(e) => {
                                const imgEl = e.target as HTMLImageElement;
                                if (!imgEl.src.endsWith(BOUTIQUE_PLACEHOLDER)) {
                                  imgEl.src = BOUTIQUE_PLACEHOLDER;
                                }
                              }}
                            />
                          </div>

                          <div className="retailer-card-details-side">
                            <div>
                              <span className="retailer-card-badge">
                                Authorized Partner
                              </span>
                              <h4 className="retailer-card-name">{r.name}</h4>
                              <p className="retailer-card-addr">{r.address}</p>
                            </div>

                            <div className="retailer-card-footer">
                              <span
                                className="retailer-card-distance"
                                title={r.distance !== undefined ? `${r.distance.toFixed(1)} km away` : `${r.city}, ${r.country}`}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{r.distance !== undefined ? `${r.distance.toFixed(1)} km away` : `${r.city}, ${r.country}`}</span>
                              </span>

                              <div className="retailer-card-actions" onClick={(e) => e.stopPropagation()}>
                                {r.phone && (
                                  <a href={`tel:${r.phone}`} className="card-action-link" title={`Call ${r.name}`}>
                                    <svg width="9.5" height="9.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    Call
                                  </a>
                                )}
                                <a href={r.googleMapsLink} target="_blank" rel="noopener noreferrer" className="card-action-link" title="Open Google Maps Directions">
                                  <svg width="9.5" height="9.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
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
                      src={sliderImages[sliderIndex] || BOUTIQUE_PLACEHOLDER}
                      alt={selectedBoutique.name}
                      onError={(e) => {
                        const imgEl = e.target as HTMLImageElement;
                        if (!imgEl.src.endsWith(BOUTIQUE_PLACEHOLDER)) {
                          imgEl.src = BOUTIQUE_PLACEHOLDER;
                        }
                      }}
                    />

                    {sliderImages.length > 1 && (
                      <>
                        <button className="slider-nav-arrow prev" onClick={handlePrevSlide} aria-label="Previous Slide">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <button className="slider-nav-arrow next" onClick={handleNextSlide} aria-label="Next Slide">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info Details Column */}
                <div className="highlight-content-side font-['Jost']">
                  <span className="highlight-badge">
                    Authorized Showroom Partner
                  </span>
                  <h2 className="highlight-name">{selectedBoutique.name}</h2>
                  <p className="highlight-addr">{selectedBoutique.address}</p>

                  <div className="highlight-info-grid">
                    <div className="info-card-block">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>
                      <span className="info-card-val">{selectedBoutique.country}</span>
                      <span className="info-card-label">Region</span>
                    </div>
                    <div className="info-card-block">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="info-card-val">{todayHours ? todayHours.statusText : '9:30 AM - 7:00 PM'}</span>
                      <span className="info-card-label">
                        {todayHours ? `${todayHours.isOpen ? 'Open' : 'Closed'} (${todayHours.dayName})` : 'Open Today'}
                      </span>
                    </div>
                    <div className="info-card-block">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span className="info-card-val">{selectedBoutique.phone || '077 071 6212'}</span>
                      <span className="info-card-label">Phone</span>
                    </div>
                  </div>

                  <p className="highlight-desc">
                    {selectedBoutique.name} is an official Winsor partner showroom. Explore the complete Winsor timepiece collection with expert watch guidance and official after-sales support.
                  </p>

                  <div className="highlight-actions-row">
                    {selectedBoutique.phone && (
                      <a href={`tel:${selectedBoutique.phone}`} className="highlight-action-btn primary">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        Call Showroom
                      </a>
                    )}
                    <a href={selectedBoutique.googleMapsLink} target="_blank" rel="noopener noreferrer" className="highlight-action-btn">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                      Directions
                    </a>
                    {selectedBoutique.websiteUrl && (
                      <a href={selectedBoutique.websiteUrl} target="_blank" rel="noopener noreferrer" className="highlight-action-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                        Website
                      </a>
                    )}
                  </div>
                </div>

              </section>
            )}

            {/* WHOLESALE & SHOP REGISTRATION CALLOUT */}
            <div className="locator-wholesale-banner">
              <div>
                <span style={{ fontSize: '9.5px', letterSpacing: '0.16em', color: '#D4AF37', textTransform: 'uppercase', fontWeight: 500, display: 'block', marginBottom: '5px' }}>
                  AUTHORIZED RETAILER & WHOLESALE INQUIRIES
                </span>
                <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 400, margin: '0 0 6px', color: '#ffffff' }}>
                  Partner With Winsor Watches
                </h4>
                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.76)', margin: 0, maxWidth: '580px', lineHeight: 1.6, fontWeight: 300 }}>
                  Expand your showroom catalog with Winsor timepieces. Contact our Head Office team to apply as an authorized retail partner or place wholesale orders.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href="tel:0770716212"
                  style={{
                    padding: '10.5px 18px',
                    background: '#FFFFFF',
                    color: '#141414',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Call Head Office: 077 071 6212
                </a>
                <a
                  href="tel:0778778555"
                  style={{
                    padding: '10.5px 18px',
                    background: 'transparent',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.24)',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Authorized Retailers</h5>
                  <p>100% genuine watches with official warranty.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Expert Service</h5>
                  <p>Professional guidance and after-sales support.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="12 8 8 12 12 16 16 12 12 8" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Complete Collection</h5>
                  <p>Explore Winsor timepieces in person.</p>
                </div>
              </div>
              <div className="feature-block-item">
                <div className="feature-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" /></svg>
                </div>
                <div className="feature-item-details">
                  <h5>Nationwide Network</h5>
                  <p>Verified retail partners across Sri Lanka.</p>
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#141414' }}>
              <div style={{ background: '#F8F7F4', border: '1px solid rgba(20,20,20,0.08)', padding: '14px', borderRadius: '50%', display: 'inline-flex' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </div>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 400, color: '#141414', margin: '0 0 8px' }}>
              Find Nearest Showroom
            </h3>
            <p style={{ fontSize: '13px', color: '#666666', lineHeight: '1.55', margin: '0 0 20px', fontWeight: 400 }}>
              Allow access to your browser location to display authorized Winsor showrooms sorted by proximity.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowGPSModal(false)}
                style={{
                  flex: 1, padding: '10px', background: '#FFFFFF', border: '1px solid rgba(20,20,20,0.14)',
                  borderRadius: '5px', fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 500, color: '#141414', cursor: 'pointer'
                }}
              >
                Show All
              </button>
              <button
                onClick={handleConfirmGPS}
                style={{
                  flex: 1, padding: '10px', background: '#141414', border: '1px solid #141414', borderRadius: '5px',
                  fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#ffffff', fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Use Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
