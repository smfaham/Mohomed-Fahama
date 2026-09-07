import React, { useState } from 'react';
import { playWatchTick } from '../utils/haptics';
import { X, RotateCcw, Flame, Sun, Sunset, Moon, Sparkles, Eye, EyeOff, Bell, Sunrise } from 'lucide-react';
import { SolarEvent } from '../types/lumy';

interface TimeScrubberModalProps {
  currentDate: Date;
  isSimulating: boolean;
  events: SolarEvent[];
  onTimeChange: (newDate: Date) => void;
  onResetTime: () => void;
  onClose: () => void;
}

export const TimeScrubberModal: React.FC<TimeScrubberModalProps> = ({
  currentDate,
  isSimulating,
  events,
  onTimeChange,
  onResetTime,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const hours = Math.floor(val / 60);
    const mins = val % 60;
    const d = new Date(currentDate);
    d.setHours(hours, mins, 0, 0);
    playWatchTick('tick');
    onTimeChange(d);
  };

  const jumpToEvent = (ev: SolarEvent) => {
    playWatchTick('tap');
    const d = new Date(currentDate);
    d.setHours(ev.time.getHours(), ev.time.getMinutes(), 0, 0);
    onTimeChange(d);
  };

  const morningGolden = events.find((e) => e.id === 'golden_hour_morning');
  const noon = events.find((e) => e.id === 'solar_noon');
  const eveningGolden = events.find((e) => e.id === 'golden_hour_evening');
  const sunset = events.find((e) => e.id === 'sunset');
  const blueHour = events.find((e) => e.id === 'blue_hour_evening');
  const sunrise = events.find((e) => e.id === 'sunrise');

  if (isMinimized) {
    return (
      <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-3.5 pt-6 pb-6 select-none animate-in fade-in duration-150">
        {/* Top compact time badge */}
        <div className="pointer-events-auto flex items-center justify-between px-3 py-1.5 rounded-full bg-[#0A0A0C]/85 backdrop-blur-md border border-white/15 shadow-xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-white/95 tracking-wider">
              {currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            {isSimulating && (
              <span className="text-[8px] font-mono uppercase text-[#F27D26] tracking-wider font-bold">
                SIM
              </span>
            )}
          </div>
          <button
            onClick={() => {
              playWatchTick('tap');
              setIsMinimized(false);
            }}
            className="ml-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            title="Expand scrubber controls"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom floating slider dock */}
        <div className="pointer-events-auto w-full max-w-[240px] mx-auto p-2.5 rounded-2xl bg-[#0A0A0C]/90 backdrop-blur-md border border-white/15 shadow-2xl flex flex-col items-center">
          <input
            id="solar-time-slider-compact"
            type="range"
            min="0"
            max="1439"
            value={currentMinutes}
            onChange={handleSliderChange}
            className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
          />
          <div className="flex justify-between w-full text-[8px] text-white/50 font-mono mt-1">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 px-0.5">
            {isSimulating && (
              <button
                onClick={() => {
                  playWatchTick('tap');
                  onResetTime();
                }}
                className="flex items-center gap-1 text-[9px] font-mono text-[#F27D26] hover:text-orange-300 transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Now</span>
              </button>
            )}
            <button
              onClick={() => {
                playWatchTick('tap');
                onClose();
              }}
              className="ml-auto text-[9px] font-mono text-white/60 hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-[#0A0A0C]/80 backdrop-blur-md rounded-full flex flex-col items-center justify-start p-4 pt-7 pb-6 text-neutral-100 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
      {/* Top action controls: Peek Dial & Close */}
      <div className="absolute top-2.5 right-6 flex items-center gap-1.5 z-50">
        <button
          onClick={() => {
            playWatchTick('tap');
            setIsMinimized(true);
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-colors"
          title="Minimize HUD to see dial rotate"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            playWatchTick('tap');
            onClose();
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 mb-1">
        <span className="text-[12px] font-serif italic text-[#F27D26] tracking-wide">
          Solar Simulator
        </span>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent" />
      </div>

      {/* Large Digital Scrub Time */}
      <div className="mt-1 font-mono text-2xl font-light text-white/95 tracking-widest">
        {currentDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}
      </div>

      {isSimulating && (
        <span className="text-[9px] text-[#F27D26] font-mono tracking-wider uppercase -mt-0.5">
          Simulated Solar Position
        </span>
      )}

      {/* Slider */}
      <div className="w-full max-w-[220px] mt-2.5 flex flex-col items-center">
        <input
          id="solar-time-slider"
          type="range"
          min="0"
          max="1439"
          value={currentMinutes}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
        />
        <div className="flex justify-between w-full text-[8px] text-white/40 font-mono mt-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Jump presets */}
      <div className="mt-2.5 w-full max-w-[240px]">
        <div className="text-[9px] text-white/40 font-mono uppercase tracking-widest mb-1.5 text-center">
          Jump to Solar Event
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {morningGolden && (
            <button
              onClick={() => jumpToEvent(morningGolden)}
              className="px-2 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#F27D26]/50 flex flex-col items-center gap-0.5 text-center transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-[#F27D26]" />
              <span className="text-[9px] font-serif italic text-white/90">AM Gold</span>
            </button>
          )}

          {noon && (
            <button
              onClick={() => jumpToEvent(noon)}
              className="px-2 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-amber-400/50 flex flex-col items-center gap-0.5 text-center transition-all"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[9px] font-serif italic text-white/90">Noon</span>
            </button>
          )}

          {eveningGolden && (
            <button
              onClick={() => jumpToEvent(eveningGolden)}
              className="px-2 py-1.5 rounded-xl bg-[#F27D26]/15 border border-[#F27D26]/50 hover:border-[#F27D26] flex flex-col items-center gap-0.5 text-center transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-[#F27D26]" />
              <span className="text-[9px] font-serif italic text-[#F27D26] font-semibold">PM Gold</span>
            </button>
          )}

          {sunset && (
            <button
              onClick={() => jumpToEvent(sunset)}
              className="px-2 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#F27D26]/50 flex flex-col items-center gap-0.5 text-center transition-all"
            >
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[9px] font-serif italic text-white/90">Sunset</span>
            </button>
          )}

          {blueHour && (
            <button
              onClick={() => jumpToEvent(blueHour)}
              className="px-2 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-blue-400/50 flex flex-col items-center gap-0.5 text-center transition-all"
            >
              <Moon className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-[9px] font-serif italic text-white/90">Blue Hr</span>
            </button>
          )}

          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(0, 0, 0, 0);
              onTimeChange(d);
            }}
            className="px-2 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-indigo-400/50 flex flex-col items-center gap-0.5 text-center transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[9px] font-serif italic text-white/90">Midnight</span>
          </button>

          {sunrise && (
            <button
              onClick={() => {
                playWatchTick('tap');
                const d = new Date(currentDate);
                const targetMs = sunrise.time.getTime() - 15 * 60000;
                const target = new Date(targetMs);
                d.setHours(target.getHours(), target.getMinutes(), 0, 0);
                onTimeChange(d);
              }}
              className="px-2 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 flex flex-col items-center gap-0.5 text-center transition-all"
              title="Jump to 15m before sunrise to trigger alert"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[8.5px] font-mono text-amber-300 font-semibold leading-tight">-15m Dawn</span>
            </button>
          )}
        </div>
      </div>

      {/* Reset button */}
      {isSimulating && (
        <button
          onClick={() => {
            playWatchTick('tap');
            onResetTime();
          }}
          className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] font-mono tracking-wider uppercase transition-colors shadow-sm"
        >
          <RotateCcw className="w-3 h-3 text-[#F27D26]" />
          <span>Reset to Now</span>
        </button>
      )}
    </div>
  );
};
