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

    // CartoDB Positron - Beautiful light-gray/cream clean map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
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

    // Custom Winsor Pin Icon
    const winsorIcon = L.divIcon({
      className: 'winsor-leaflet-pin',
      html: `
        <div style="
          background: #1a1209;
          border: 2px solid #8b6914;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 15px rgba(26,18,9,0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        " class="marker-pin-inner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <circle cx="12" cy="11" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    // Custom Active Pin Icon
    const activeIcon = L.divIcon({
      className: 'winsor-leaflet-pin-active',
      html: `
        <div style="
          background: #8b6914;
          border: 2px solid #ffffff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 0 20px rgba(139,105,20,0.6);
          transition: all 0.3s ease;
          transform: scale(1.1);
          cursor: pointer;
        " class="marker-pin-inner-active">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <circle cx="12" cy="11" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Populate Retailer Markers
    retailers.forEach(r => {
      if (r.latitude !== undefined && r.longitude !== undefined) {
        const marker = L.marker([r.latitude, r.longitude], {
          icon: r._id === selectedId ? activeIcon : winsorIcon,
        }).addTo(map);

        // Bind luxury popup
        marker.bindPopup(`
          <div style="font-family: 'Jost', sans-serif; padding: 6px 10px; color: #1a1209;">
            <p style="font-weight: 600; font-size: 13px; margin: 0 0 4px; text-transform: uppercase; color: #8b6914;">
              ${r.name}
            </p>
            <p style="font-size: 11px; margin: 0; color: rgba(26,18,9,0.7); line-height: 1.4;">
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
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="
              position: absolute;
              top: 4px;
              left: 4px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #007aff;
              border: 2px solid #ffffff;
              box-shadow: 0 0 10px rgba(0,122,255,0.5);
              z-index: 10;
            "></div>
            <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: rgba(0,122,255,0.25);
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
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([userCoords.latitude, userCoords.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarkerRef.current = marker;

      // Pan to user coords
      map.panTo([userCoords.latitude, userCoords.longitude]);
    }
  }, [userCoords]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}
