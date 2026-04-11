"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Fix static marker icon issue in Leaflet + Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onLocationSelect: (address: string) => void;
  onClose: () => void;
}

export default function MapPickerComponent({ onLocationSelect, onClose }: MapPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Default to Tokyo if no location
  const defaultCenter: [number, number] = [35.6762, 139.6503];

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });

    return position === null ? null : <Marker position={position} icon={customIcon}></Marker>;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      if (data && data.display_name) {
        onLocationSelect(data.display_name);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        },
        (err) => {
          console.error(err);
          setLoading(false);
          alert("Failed to get current location. Please check your permissions.");
        }
      );
    } else {
      setLoading(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-zoom-in">
        
        {/* Header */}
        <div className="p-4 border-b border-[#E4E0D9] flex justify-between items-center bg-white z-10">
          <div>
            <h3 className="text-xl font-bold font-display text-[#111]">Choose Pickup Location</h3>
            <p className="text-[#7A746D] text-sm">Click anywhere on the map to set your pickup address.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F8F7F5] flex items-center justify-center text-[#111] hover:bg-[#E4E0D9] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-white z-10 border-b border-[#E4E0D9]">
          <button 
            type="button" 
            onClick={useCurrentLocation}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 h-12 bg-[#C41230] text-white font-bold rounded-lg hover:bg-[#A00F27] transition-colors disabled:opacity-70"
          >
            <MapPin className="size-5" />
            {loading ? "Locating..." : "Use My Current Location"}
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
