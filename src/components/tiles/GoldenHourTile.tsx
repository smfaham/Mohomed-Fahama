import React from 'react';
import { SolarEvent } from '../../types/lumy';
import { Flame, Moon, Sparkles, Clock, Sun } from 'lucide-react';
import { formatWatchTime } from '../../utils/solarCalculator';

interface GoldenHourTileProps {
  currentDate: Date;
  events: SolarEvent[];
  onSelectEvent: (event: SolarEvent) => void;
}

export const GoldenHourTile: React.FC<GoldenHourTileProps> = ({
  currentDate,
  events,
  onSelectEvent,
}) => {
  const morningGolden = events.find((e) => e.id === 'golden_hour_morning');
  const eveningGolden = events.find((e) => e.id === 'golden_hour_evening');
  const morningBlue = events.find((e) => e.id === 'blue_hour_morning');
  const eveningBlue = events.find((e) => e.id === 'blue_hour_evening');

  const nowMs = currentDate.getTime();

  const getDurationMin = (start?: Date, end?: Date) => {
    if (!start || !end) return '45m';
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins}m`;
  };

  const getEventStatus = (ev?: SolarEvent) => {
    if (!ev) return null;
    const start = ev.time.getTime();
    const end = ev.endTime ? ev.endTime.getTime() : start + 45 * 60000;
    if (nowMs >= start && nowMs <= end) {
      return { label: 'ACTIVE NOW', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60' };
    }
    if (nowMs < start) {
      const diffMins = Math.round((start - nowMs) / 60000);
      const hours = Math.floor(diffMins / 60);
      const rem = diffMins % 60;
      const timeStr = hours > 0 ? `in ${hours}h ${rem}m` : `in ${rem}m`;
      return { label: timeStr, color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
    }
    return { label: 'Passed', color: 'text-neutral-500 bg-neutral-900 border-neutral-800' };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 pt-10 pb-6 text-center select-none overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-[12px] font-serif italic text-[#F27D26] tracking-wide">
            Magic Hours
          </span>
        </div>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent" />
      </div>

      {/* Grid of major cards */}
      <div className="w-full max-w-[260px] flex flex-col gap-2">
        {/* Evening Golden Hour Card */}
        {eveningGolden && (
          <button
            onClick={() => onSelectEvent(eveningGolden)}
            className="w-full p-2.5 rounded-2xl bg-[#0F0F15]/90 backdrop-blur-md border border-[#F27D26]/30 hover:border-[#F27D26]/60 shadow-[0_0_20px_rgba(242,125,38,0.1)] transition-all flex flex-col text-left group relative overflow-hidden"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[#F27D26]/20 flex items-center justify-center text-[#F27D26]">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-serif italic font-medium text-white group-hover:text-[#F27D26] transition-colors">
                  Evening Golden
                </span>
              </div>
              {getEventStatus(eveningGolden) && (
                <span
                  className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    getEventStatus(eveningGolden)!.color
                  }`}
                >
                  {getEventStatus(eveningGolden)!.label}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-baseline justify-between text-neutral-300">
              <div className="text-[11px] font-mono text-orange-200">
                {formatWatchTime(eveningGolden.time)} – {eveningGolden.endTime ? formatWatchTime(eveningGolden.endTime) : 'Sunset'}
              </div>
              <span className="text-[10px] text-white/50 font-mono">
                {getDurationMin(eveningGolden.time, eveningGolden.endTime)}
              </span>
            </div>
          </button>
        )}

        {/* Evening Blue Hour Card */}
        {eveningBlue && (
          <button
            onClick={() => onSelectEvent(eveningBlue)}
            className="w-full p-2.5 rounded-2xl bg-[#0F0F15]/90 backdrop-blur-md border border-blue-500/20 hover:border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all flex flex-col text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-serif italic font-medium text-white group-hover:text-blue-300 transition-colors">
                  Evening Blue Hour
                </span>
              </div>
              {getEventStatus(eveningBlue) && (
                <span
                  className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    getEventStatus(eveningBlue)!.color
                  }`}
                >
                  {getEventStatus(eveningBlue)!.label}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-baseline justify-between text-neutral-300">
              <div className="text-[11px] font-mono text-blue-300">
                {formatWatchTime(eveningBlue.time)} – {eveningBlue.endTime ? formatWatchTime(eveningBlue.endTime) : ''}
              </div>
              <span className="text-[10px] text-white/50 font-mono">
                {getDurationMin(eveningBlue.time, eveningBlue.endTime)}
              </span>
            </div>
          </button>
        )}

        {/* Morning Golden Hour Card */}
        {morningGolden && (
          <button
            onClick={() => onSelectEvent(morningGolden)}
            className="w-full p-2 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-[#F27D26]/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-[#F27D26]" />
              <div>
                <div className="text-[11px] font-serif italic text-white/90 group-hover:text-[#F27D26]">Morning Golden</div>
                <div className="text-[10px] font-mono text-orange-200/80">
                  {formatWatchTime(morningGolden.time)}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#F27D26]/90">
              {getDurationMin(morningGolden.time, morningGolden.endTime)}
            </span>
          </button>
        )}
      </div>

      <div className="mt-2 text-[9px] text-white/40 font-mono tracking-wider uppercase">
        Tap card for camera advice
      </div>
    </div>
  );
};
