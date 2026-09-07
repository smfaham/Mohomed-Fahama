import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Layers, Sparkles, Sun, Flame, Moon, Sunrise, Sunset } from 'lucide-react';
import { SolarEvent, LocationData, SolarPosition } from '../types/lumy';
import { formatWatchTime, formatDuration } from '../utils/solarCalculator';
import { playWatchTick } from '../utils/haptics';

interface SolarSpectrumWidgetProps {
  currentDate: Date;
  location: LocationData;
  events: SolarEvent[];
  solarPosition: SolarPosition;
  onOpenWidgetPicker: () => void;
  onOpenDetail?: (event: SolarEvent) => void;
}

export const SolarSpectrumWidget: React.FC<SolarSpectrumWidgetProps> = ({
  currentDate,
  events,
  solarPosition,
  onOpenWidgetPicker,
  onOpenDetail,
}) => {
  const nowMs = currentDate.getTime();

  // Find active event and next event
  const { currentEvent, nextEvent, nextDiffMs } = useMemo(() => {
    let current = events[0];
    let next = events[1] || events[0];

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const evStart = ev.time.getTime();
      const evEnd = ev.endTime
        ? ev.endTime.getTime()
        : events[i + 1]
        ? events[i + 1].time.getTime()
        : evStart + 60 * 60000;

      if (nowMs >= evStart && nowMs < evEnd) {
        current = ev;
        next = events[i + 1] || events[0];
        break;
      } else if (nowMs < evStart) {
        next = ev;
        current = events[i - 1] || events[events.length - 1];
        break;
      }
    }

    const targetTime =
      next.time.getTime() > nowMs
        ? next.time
        : current.endTime && current.endTime.getTime() > nowMs
        ? current.endTime
        : next.time;
    const diff = Math.max(0, targetTime.getTime() - nowMs);

    return {
      currentEvent: current,
      nextEvent: next,
      nextDiffMs: diff,
    };
  }, [events, nowMs]);

  // Determine current position on the 4-phase spectrum: Orange -> Yellow -> Green -> Blue
  // Orange: Golden Hour & Sunrise (~0-25%)
  // Yellow: Solar Noon & High Daylight (~25-50%)
  // Green: Horizon Transition & Sunset Twilight (~50-75%)
  // Blue: Blue Hour & Night Canopy (~75-100%)
  const { spectrumPct, zoneName, zoneColor, zoneBg, zoneIcon: ZoneIcon } = useMemo(() => {
    const alt = solarPosition.altitude; // in degrees
    const isAscending = currentDate.getHours() < 12;

    let pct = 0;
    let name = 'Daylight';
    let color = '#FBBF24'; // Yellow
    let bg = 'rgba(251, 191, 36, 0.18)';
    let icon = Sun;

    if (alt > 25) {
      // Zone 2: Yellow (Zenith Daylight)
      name = 'Sun Apex';
      color = '#FBBF24';
      bg = 'rgba(251, 191, 36, 0.20)';
      icon = Sun;
      // Map alt from 25 to 65 -> 28% to 48%
      pct = 28 + Math.min(20, Math.max(0, ((alt - 25) / 40) * 20));
    } else if (alt >= 4 && alt <= 25) {
      // Zone 1 or 2: Orange (Golden Hour / Warm Sun)
      if (isAscending) {
        name = 'Morning Golden';
        color = '#F27D26';
        bg = 'rgba(242, 125, 38, 0.22)';
        icon = Flame;
        pct = 12 + Math.min(14, Math.max(0, ((alt - 4) / 21) * 14));
      } else {
        name = 'Evening Golden';
        color = '#EA580C';
        bg = 'rgba(234, 88, 12, 0.22)';
        icon = Flame;
        pct = 22 + Math.min(10, Math.max(0, ((alt - 4) / 21) * 10));
      }
    } else if (alt >= -4 && alt < 4) {
      // Zone 3: Green (Horizon transition, civil twilight, green flash aura)
      name = alt >= 0 ? 'Solar Horizon' : 'Civil Twilight';
      color = '#10B981';
      bg = 'rgba(16, 185, 129, 0.22)';
      icon = Sparkles;
      // Map alt from -4 to 4 -> 58% to 72%
      pct = 58 + Math.min(14, Math.max(0, ((alt + 4) / 8) * 14));
    } else {
      // Zone 4: Blue (Blue hour, nautical/astronomical twilight, deep sky)
      name = alt >= -12 ? 'Blue Hour' : 'Night Sky';
      color = '#3B82F6';
      bg = 'rgba(59, 130, 246, 0.22)';
      icon = Moon;
      // Map alt from -60 to -4 -> 78% to 96%
      pct = 78 + Math.min(18, Math.max(0, ((alt + 60) / 56) * 18));
    }

    return {
      spectrumPct: Math.max(4, Math.min(96, Math.round(pct))),
      zoneName: name,
      zoneColor: color,
      zoneBg: bg,
      zoneIcon: icon,
    };
  }, [solarPosition.altitude, currentDate]);

  const countdownStr = formatDuration(nextDiffMs);
  const altFormatted = `${solarPosition.altitude >= 0 ? '+' : ''}${Math.round(solarPosition.altitude)}°`;

  return (
    <div className="flex flex-col items-center w-full">
      <motion.div
        id="watch-face-spectrum-widget"
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          playWatchTick('tap');
          if (currentEvent && onOpenDetail) {
            onOpenDetail(currentEvent);
          }
        }}
        className="relative flex flex-col gap-1 px-2.5 py-1.5 rounded-2xl bg-[#0A0C11]/92 hover:bg-[#10131B] backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-[0_4px_18px_rgba(242,125,38,0.2)] text-neutral-100 cursor-pointer select-none max-w-[252px] w-full transition-all"
      >
        {/* Top Header: Lumy Dial Chroma Badge & Live Altitude */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            {/* Miniature Multi-Chromatic Orb (Orange -> Yellow -> Green -> Blue) */}
            <div
              className="w-4 h-4 rounded-full p-[1.5px] shrink-0 shadow-sm relative overflow-hidden"
              style={{
                background:
                  'conic-gradient(from 0deg, #F27D26, #FBBF24, #10B981, #3B82F6, #F27D26)',
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0A0C11] flex items-center justify-center">
                <ZoneIcon className="w-2 h-2" style={{ color: zoneColor }} />
              </div>
            </div>

            {/* Active Spectrum Zone label */}
            <div className="flex items-center gap-1">
              <span
                className="text-[8.5px] font-mono uppercase tracking-wider font-semibold px-1 py-0.2 rounded"
                style={{ color: zoneColor, backgroundColor: zoneBg }}
              >
                {zoneName}
              </span>
              <span className="text-[8px] font-mono text-white/50">
                {altFormatted}
              </span>
            </div>
          </div>

          {/* Quick complication switcher button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playWatchTick('tap');
              onOpenWidgetPicker();
            }}
            className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
            title="Switch complication"
          >
            <Layers className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* The Iconic Lumy Dial Color Spectrum: Orange -> Yellow -> Green -> Blue */}
        <div className="relative w-full my-0.5">
          {/* Gradient Track */}
          <div
            className="w-full h-2 rounded-full relative overflow-hidden shadow-inner"
            style={{
              background:
                'linear-gradient(to right, #F27D26 0%, #FBBF24 33%, #10B981 66%, #3B82F6 100%)',
            }}
          >
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
          </div>

          {/* Dynamic Sun Position Indicator Bead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 flex items-center justify-center"
            style={{ left: `${spectrumPct}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-900 shadow-[0_0_8px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: zoneColor }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Legend & Next Transition Countdown */}
        <div className="flex items-center justify-between text-[7.5px] font-mono text-white/60 pt-0.5">
          {/* Color Stop Anchors */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5 text-orange-400">
              <span className="w-1 h-1 rounded-full bg-[#F27D26]" />
              Sun
            </span>
            <span className="flex items-center gap-0.5 text-yellow-300">
              <span className="w-1 h-1 rounded-full bg-[#FBBF24]" />
              Day
            </span>
            <span className="flex items-center gap-0.5 text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-[#10B981]" />
              Eve
            </span>
            <span className="flex items-center gap-0.5 text-blue-400">
              <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
              Night
            </span>
          </div>

          {/* Countdown until next phase */}
          <span className="text-white/80 font-serif italic truncate max-w-[85px]">
            {nextEvent ? `${nextEvent.name.split(' ')[0]} in ${countdownStr}` : countdownStr}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
