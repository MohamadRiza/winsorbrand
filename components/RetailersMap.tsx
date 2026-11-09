'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapRetailer {
  _id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

interface RetailersMapProps {
  retailers: MapRetailer[];
  selectedId: string | null;
  onSelectRetailer: (id: string) => void;
  userCoords: { latitude: number; longitude: number } | null;
}

export default function RetailersMap({
  retailers,
  selectedId,
  onSelectRetailer,
  userCoords,
}: RetailersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on Sri Lanka by default
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 8,
      zoomControl: false,
    });

    // Add zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Custom Winsor Pin Icon - Sleek minimalist Swiss pin
    const winsorIcon = L.divIcon({
      className: 'winsor-leaflet-pin',
      html: `
        <div style="
          background: #141414;
          border: 1.5px solid #ffffff;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.22);
          transition: transform 0.2s ease;
          cursor: pointer;
        " class="marker-pin-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <circle cx="12" cy="11" r="2.5"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Custom Active Pin Icon
    const activeIcon = L.divIcon({
      className: 'winsor-leaflet-pin-active',
      html: `
        <div style="
          background: #141414;
          border: 2px solid #8B6914;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B6914;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
          cursor: pointer;
        " class="marker-pin-inner-active">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <circle cx="12" cy="11" r="2.5"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    // Populate Retailer Markers
    retailers.forEach(r => {
      if (r.latitude !== undefined && r.longitude !== undefined) {
        const marker = L.marker([r.latitude, r.longitude], {
          icon: r._id === selectedId ? activeIcon : winsorIcon,
        }).addTo(map);

        // Bind luxury popup
        marker.bindPopup(`
          <div style="font-family: 'Jost', sans-serif; padding: 4px 6px; color: #141414;">
            <p style="font-weight: 500; font-size: 13px; margin: 0 0 3px; color: #141414; line-height: 1.35;">
              ${r.name}
            </p>
            <p style="font-size: 11px; margin: 0; color: #666666; line-height: 1.4;">
              ${r.address}
            </p>
          </div>
        `, { closeButton: false });

        marker.on('click', () => {
          onSelectRetailer(r._id);
        });

        markersRef.current[r._id] = marker;
      }
    });

    // Fit bounds to show all markers if not focused
    if (!selectedId && retailers.length > 0) {
      const validPoints = retailers
        .filter(r => r.latitude !== undefined && r.longitude !== undefined)
        .map(r => L.latLng(r.latitude!, r.longitude!));
      
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [retailers, selectedId]);

  // Handle flyTo when selectedId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const marker = markersRef.current[selectedId];
    if (marker) {
      const latLng = marker.getLatLng();
      map.flyTo(latLng, 14, {
        animate: true,
        duration: 1.2,
      });
      marker.openPopup();
    }
  }, [selectedId]);

  // Update User Coordinates Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-pulse',
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="
              position: absolute;
              top: 3px;
              left: 3px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #141414;
              border: 2px solid #ffffff;
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
              z-index: 10;
            "></div>
            <div style="
              position: absolute;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: rgba(20,20,20,0.18);
              animation: user-pulse 1.8s infinite ease-out;
              z-index: 1;
            "></div>
          </div>
          <style>
            @keyframes user-pulse {
              0% { transform: scale(0.6); opacity: 1; }
              100% { transform: scale(1.8); opacity: 0; }
            }
          </style>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([userCoords.latitude, userCoords.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarkerRef.current = marker;

      // Pan to user coords
      map.panTo([userCoords.latitude, userCoords.longitude]);
    }
  }, [userCoords]);

  return (
    <div className="retailers-map-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <style jsx global>{`
        .retailers-map-wrapper .leaflet-tile-pane {
          filter: saturate(0.85) contrast(1.02) brightness(1.01);
        }
        .retailers-map-wrapper .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(20, 20, 20, 0.08);
          background: #ffffff;
        }
        .retailers-map-wrapper .leaflet-popup-tip {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
