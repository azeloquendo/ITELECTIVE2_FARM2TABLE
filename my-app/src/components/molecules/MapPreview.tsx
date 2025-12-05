// components/MapPreview.tsx
"use client";
import { useEffect, useRef } from 'react';

interface MapPreviewProps {
  lat: number;
  lng: number;
  accuracy: 'exact' | 'approximate' | 'barangay';
  address: string;
  className?: string;
}

export default function MapPreview({ lat, lng, accuracy, address, className = '' }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    // Initialize OpenStreetMap
    const mapElement = mapRef.current;
    mapElement.innerHTML = ''; // Clear previous map

    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '200';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.marginHeight = 0;
    iframe.marginWidth = 0;
    
    // OpenStreetMap embed URL
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
    iframe.src = embedUrl;
    
    mapElement.appendChild(iframe);

  }, [lat, lng]);

  const getAccuracyColor = () => {
    switch (accuracy) {
      case 'exact': return '#10b981'; // green
      case 'approximate': return '#f59e0b'; // amber
      case 'barangay': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getAccuracyText = () => {
    switch (accuracy) {
      case 'exact': return 'Exact Location';
      case 'approximate': return 'Approximate Area';
      case 'barangay': return 'Barangay Center';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`map-preview ${className}`}>
      <div className="map-header">
        <h4>📍 Location Map</h4>
        <div className="accuracy-badge" style={{ backgroundColor: getAccuracyColor() }}>
          {getAccuracyText()}
        </div>
      </div>
      
      <div ref={mapRef} className="map-container" />
      
      <div className="map-details">
        <div className="coordinates">
          <span>Lat: {lat?.toFixed(6)}</span>
          <span>Lng: {lng?.toFixed(6)}</span>
        </div>
        <div className="address">{address}</div>
      </div>

      <style jsx>{`
        .map-preview {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          margin: 16px 0;
        }
        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }
        .map-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .accuracy-badge {
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }
        .map-container {
          width: 100%;
          height: 200px;
          background: #f3f4f6;
        }
        .map-details {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }
        .coordinates {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        .address {
          font-size: 12px;
          color: #374151;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}