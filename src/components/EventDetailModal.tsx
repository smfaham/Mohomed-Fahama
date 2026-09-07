import React, { useState } from 'react';
import { SolarEvent } from '../types/lumy';
import { formatWatchTime } from '../utils/solarCalculator';
import { playWatchTick } from '../utils/haptics';
import { X, Camera, Bell, BellRing, Sparkles, Thermometer, Info } from 'lucide-react';

interface EventDetailModalProps {
  event: SolarEvent;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [alertSet, setAlertSet] = useState(false);

  const toggleAlert = () => {
    playWatchTick(alertSet ? 'tap' : 'alarm');
    setAlertSet(!alertSet);
  };

  const getKelvinColor = (k?: number) => {
    if (!k) return '#F59E0B';
    if (k < 3000) return '#EA580C';
    if (k < 4000) return '#F59E0B';
    if (k < 6000) return '#FEF08A';
    if (k < 9000) return '#38BDF8';
    return '#818CF8';
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-xl rounded-full flex flex-col items-center justify-start p-5 pt-7 pb-8 text-neutral-100 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
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

      {/* Header Badge */}
      <div
        className="px-2.5 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase flex items-center gap-1.5 border"
        style={{
          backgroundColor: 'rgba(242,125,38,0.1)',
          borderColor: '#F27D26',
          color: '#F27D26',
        }}
      >
        <Sparkles className="w-3 h-3" />
        <span>{event.category.toUpperCase()}</span>
      </div>

      {/* Event Title */}
      <h2
        className="text-lg font-serif italic text-white text-center mt-2 px-4 leading-tight drop-shadow-sm"
        style={{ fontFamily: "Georgia, 'Newsreader', serif" }}
      >
        {event.name}
      </h2>

      {/* Exact Time Window */}
      <div className="mt-1 font-mono text-xs text-orange-200 flex items-center gap-1">
        <span>{formatWatchTime(event.time)}</span>
        {event.endTime && (
          <>
            <span className="text-white/40">→</span>
            <span>{formatWatchTime(event.endTime)}</span>
          </>
        )}
      </div>

      {/* Light Temperature (Kelvin) */}
      {event.lightTempK && (
        <div className="mt-3 w-full max-w-[240px] p-2.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#F27D26]" />
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Color Temp</div>
              <div className="text-xs font-mono font-medium text-white/90">
                ~{event.lightTempK.toLocaleString()}K
              </div>
            </div>
          </div>
          <div
            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: getKelvinColor(event.lightTempK) }}
          />
        </div>
      )}

      {/* Description */}
      <div className="mt-2 w-full max-w-[240px] p-2.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-left">
        <div className="flex items-center gap-1.5 text-[9px] text-blue-300 font-mono uppercase tracking-widest mb-1">
          <Info className="w-3 h-3 text-blue-300" />
          <span>Atmosphere</span>
        </div>
        <p className="text-[11px] text-white/80 leading-relaxed font-sans">
          {event.description}
        </p>
      </div>

      {/* Photography Advice */}
      {event.photoTip && (
        <div className="mt-2 w-full max-w-[240px] p-2.5 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 text-left">
          <div className="flex items-center gap-1.5 text-[9px] text-[#F27D26] font-mono uppercase tracking-widest mb-1">
            <Camera className="w-3 h-3 text-[#F27D26]" />
            <span>Shooting Advice</span>
          </div>
          <p className="text-[11px] text-orange-100/90 leading-relaxed font-sans">
            {event.photoTip}
          </p>
        </div>
      )}

      {/* Alert Notification Toggle */}
      <div className="mt-3 w-full max-w-[240px] pb-4">
        <button
          onClick={toggleAlert}
          className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono tracking-wide uppercase transition-all ${
            alertSet
              ? 'bg-[#F27D26]/20 border-[#F27D26] text-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.25)]'
              : 'bg-white/10 border-white/10 text-white/80 hover:bg-white/15'
          }`}
        >
          {alertSet ? (
            <>
              <BellRing className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Alert Set (15m before)</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              <span>Notify 15 min prior</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
