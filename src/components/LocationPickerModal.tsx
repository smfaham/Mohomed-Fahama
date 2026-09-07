import React, { useState } from 'react';
import { LocationData } from '../types/lumy';
import { PRESET_LOCATIONS } from '../utils/solarCalculator';
import { playWatchTick } from '../utils/haptics';
import { X, Navigation, Search, MapPin, Check } from 'lucide-react';

interface LocationPickerModalProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredLocations = PRESET_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleUseGPS = () => {
    playWatchTick('tap');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLoc: LocationData = {
          name: 'Current Location',
          city: 'Your Coordinates',
          country: 'GPS Fix',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        onSelectLocation(userLoc);
        onClose();
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg('GPS unavailable, using preset');
        setTimeout(() => setErrorMsg(''), 3000);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-xl rounded-full flex flex-col items-center justify-start p-4 pt-8 pb-7 text-neutral-100 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
      {/* Close button */}
      <button
        onClick={() => {
          playWatchTick('tap');
          onClose();
        }}
        className="absolute top-3 right-8 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-colors z-50"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-[12px] font-serif italic text-[#F27D26] tracking-wide">
            Location
          </span>
        </div>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent" />
      </div>

      {/* GPS Button */}
      <button
        onClick={handleUseGPS}
        disabled={isLocating}
        className="w-full max-w-[230px] py-2 px-3 rounded-xl bg-[#F27D26]/15 border border-[#F27D26]/50 hover:bg-[#F27D26]/25 text-[#F27D26] flex items-center justify-center gap-2 text-[11px] font-mono tracking-wider uppercase transition-all mb-2 shadow-sm"
      >
        <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
        <span>{isLocating ? 'Acquiring GPS...' : 'Use Current GPS'}</span>
      </button>

      {errorMsg && (
        <span className="text-[9px] text-rose-400 mb-1 font-mono">{errorMsg}</span>
      )}

      {/* Search Input */}
      <div className="w-full max-w-[230px] relative mb-2">
        <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Search world cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F27D26]/70 font-sans"
        />
      </div>

      {/* Cities list */}
      <div className="w-full max-w-[240px] flex flex-col gap-1 pb-4">
        {filteredLocations.map((loc) => {
          const isSelected =
            Math.abs(loc.lat - currentLocation.lat) < 0.05 &&
            Math.abs(loc.lng - currentLocation.lng) < 0.05;

          return (
            <button
              key={loc.name}
              onClick={() => {
                playWatchTick('tap');
                onSelectLocation(loc);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition-all border ${
                isSelected
                  ? 'bg-[#F27D26]/20 border-[#F27D26]/80 text-white'
                  : 'bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-white/20 text-white/80'
              }`}
            >
              <div>
                <div className="text-xs font-serif italic text-white/95">{loc.name}</div>
                <div className="text-[9px] font-mono text-white/40">{loc.country}</div>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#F27D26]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
