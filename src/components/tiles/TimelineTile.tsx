import React from 'react';
import { SolarEvent } from '../../types/lumy';
import { formatWatchTime } from '../../utils/solarCalculator';
import { Sparkles, Sun, Sunset, Sunrise, Flame, Moon, CloudSun, CheckCircle2 } from 'lucide-react';

interface TimelineTileProps {
  currentDate: Date;
  events: SolarEvent[];
  onSelectEvent: (event: SolarEvent) => void;
}

export const TimelineTile: React.FC<TimelineTileProps> = ({
  currentDate,
  events,
  onSelectEvent,
}) => {
  const nowMs = currentDate.getTime();

  const getIcon = (id: string, color: string) => {
    switch (id) {
      case 'golden_hour_morning':
      case 'golden_hour_evening':
        return <Flame className="w-3.5 h-3.5" style={{ color }} />;
      case 'blue_hour_morning':
      case 'blue_hour_evening':
        return <Moon className="w-3.5 h-3.5" style={{ color }} />;
      case 'sunrise':
        return <Sunrise className="w-3.5 h-3.5" style={{ color }} />;
      case 'sunset':
        return <Sunset className="w-3.5 h-3.5" style={{ color }} />;
      case 'solar_noon':
        return <Sun className="w-3.5 h-3.5" style={{ color }} />;
      default:
        return <CloudSun className="w-3.5 h-3.5" style={{ color }} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-11 pb-8 px-4 text-center select-none overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-[12px] font-serif italic text-[#F27D26] tracking-wide">
            Solar Timeline
          </span>
        </div>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent" />
      </div>

      <div className="w-full max-w-[270px] flex flex-col gap-1.5 pb-6">
        {events.map((ev) => {
          const evStart = ev.time.getTime();
          const evEnd = ev.endTime ? ev.endTime.getTime() : evStart + 30 * 60000;
          const isCurrent = nowMs >= evStart && nowMs <= evEnd;
          const isPast = nowMs > evEnd;

          return (
            <button
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition-all border ${
                isCurrent
                  ? 'bg-[#F27D26]/15 border-[#F27D26]/80 shadow-[0_0_15px_rgba(242,125,38,0.25)]'
                  : isPast
                  ? 'bg-white/[0.02] border-white/5 opacity-40'
                  : 'bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: ev.badgeBg }}
                >
                  {getIcon(ev.id, ev.color)}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs truncate ${
                        isCurrent
                          ? 'text-[#F27D26] font-serif italic font-semibold'
                          : 'text-white/90 font-serif italic'
                      }`}
                    >
                      {ev.name.replace(' (Morning)', ' AM').replace(' (Evening)', ' PM')}
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-ping" />
                    )}
                  </div>
                  <div className="text-[9px] text-white/50 truncate">
                    {ev.description}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="text-[11px] font-mono text-orange-200">
                  {formatWatchTime(ev.time)}
                </div>
                {isPast ? (
                  <span className="text-[8px] font-mono text-white/30">Passed</span>
                ) : isCurrent ? (
                  <span className="text-[8px] font-mono tracking-wider font-bold text-[#F27D26]">ACTIVE</span>
                ) : (
                  <span className="text-[8px] text-white/60 font-mono">
                    {Math.round((evStart - nowMs) / 60000)}m
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
