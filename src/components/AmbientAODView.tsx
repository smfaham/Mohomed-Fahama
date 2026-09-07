import React from 'react';
import { playWatchTick } from '../utils/haptics';
import { SolarEvent, SolarPosition } from '../types/lumy';
import { Flame } from 'lucide-react';

interface AmbientAODViewProps {
  currentDate: Date;
  solarPosition: SolarPosition;
  nextEvent: SolarEvent;
  countdownText: string;
  onWake: () => void;
}

export const AmbientAODView: React.FC<AmbientAODViewProps> = ({
  currentDate,
  solarPosition,
  nextEvent,
  countdownText,
  onWake,
}) => {
  const timeFormatted = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateFormatted = currentDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      id="aod-wake-container"
      onClick={() => {
        playWatchTick('tap');
        onWake();
      }}
      className="absolute inset-0 z-50 bg-[#050505] text-neutral-400 rounded-full flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer border border-white/5 animate-in fade-in duration-300"
      title="Tap to wake display"
    >
      {/* Subtle outer AOD ring from Sophisticated Dark design */}
      <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute inset-5 rounded-full border border-white/[0.02] pointer-events-none" />

      <div className="text-[11px] font-serif italic text-white/40 tracking-widest mb-1">
        {dateFormatted}
      </div>

      {/* OLED Watch Time */}
      <div className="font-mono text-4xl sm:text-5xl font-extralight text-white/95 tracking-[0.15em]">
        {timeFormatted}
      </div>

      {/* Next solar phase glance */}
      <div className="mt-4 flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-white/80 text-xs shadow-sm">
        <Flame className="w-3.5 h-3.5 text-[#F27D26]" />
        <span className="font-serif italic text-white/90">{nextEvent.name.replace(' (Morning)', '').replace(' (Evening)', '')}</span>
        <span className="text-white/30">•</span>
        <span className="font-mono text-orange-200">{countdownText}</span>
      </div>

      <div className="mt-6 text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
        Tap screen to wake
      </div>
    </button>
  );
};
