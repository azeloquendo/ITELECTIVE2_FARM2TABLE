// src/components/LocationPicker.tsx
"use client";
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet'; 
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom farm icon
const farmIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Map click handler component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number } | null;
  address?: string;
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation = null,
  address = "" 
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation);
  const [map, setMap] = useState<any>(null);

  // Default center (Zambales area)
  const defaultCenter: [number, number] = [15.3000, 120.0000];

  // Geocode address when address changes
  useEffect(() => {
    if (address && !selectedLocation) {
      geocodeAddress(address);
    }
  }, [address]);

  const geocodeAddress = async (fullAddress: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setSelectedLocation(location);
        onLocationSelect(location.lat, location.lng);
        
        // Center map on the location
        if (map) {
          map.setView([location.lat, location.lng], 15);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    const location = { lat, lng };
    setSelectedLocation(location);
    onLocationSelect(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          onLocationSelect(location.lat, location.lng);
          
          // Center map on current location
          if (map) {
            map.setView([location.lat, location.lng], 15);
          }
        },
        (error) => {
          alert('Unable to get your current location. Please allow location access or click on the map.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please click on the map to select your farm location.');
    }
  };

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <h3 className="location-picker-title">📍 Select Your Farm Location</h3>
        <p className="location-picker-description">
          Click on the map to mark your farm location or use your current location
        </p>
        
        <div className="location-picker-actions">
          <button 
            type="button" 
            className="location-action-btn"
            onClick={handleUseCurrentLocation}
          >
            📍 Use My Current Location
          </button>
        </div>
      </div>

      <div className="location-map-container">
        <MapContainer
          center={selectedLocation || defaultCenter}
          zoom={selectedLocation ? 15 : 10}
          style={{ height: '300px', width: '100%', borderRadius: '8px' }}
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]} 
              icon={farmIcon}
            />
          )}
        </MapContainer>
      </div>

      {selectedLocation && (
        <div className="location-coordinates">
          <p className="coordinates-text">
            <strong>Selected Location:</strong><br />
            Latitude: {selectedLocation.lat.toFixed(6)}<br />
            Longitude: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      <style jsx>{`
        .location-picker {
          margin: 20px 0;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #f8fafc;
        }

        .location-picker-header {
          margin-bottom: 15px;
        }

        .location-picker-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .location-picker-description {
          color: #718096;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .location-picker-actions {
          margin-bottom: 15px;
        }

        .location-action-btn {
          background: #48bb78;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .location-action-btn:hover {
          background: #38a169;
        }

        .location-map-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .location-coordinates {
          margin-top: 15px;
          padding: 12px;
          background: #edf2f7;
          border-radius: 6px;
          border-left: 4px solid #48bb78;
        }

        .coordinates-text {
          font-size: 14px;
          color: #4a5568;
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}