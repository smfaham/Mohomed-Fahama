import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sunrise, Sparkles, X, ChevronUp, ChevronDown, Clock, Info, Bell, Vibrate, Layers } from 'lucide-react';
import { SolarEvent, LocationData } from '../types/lumy';
import { calculateNextSunrise, formatWatchTime } from '../utils/solarCalculator';
import { playWatchTick } from '../utils/haptics';

interface SunriseGlanceWidgetProps {
  currentDate: Date;
  location: LocationData;
  events: SolarEvent[];
  notificationsEnabled?: boolean;
  onOpenDetail?: (event: SolarEvent) => void;
  onOpenNotifications?: () => void;
  onTestNotification?: () => void;
  onOpenWidgetPicker?: () => void;
}

export const SunriseGlanceWidget: React.FC<SunriseGlanceWidgetProps> = ({
  currentDate,
  location,
  events,
  notificationsEnabled = true,
  onOpenDetail,
  onOpenNotifications,
  onTestNotification,
  onOpenWidgetPicker,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const sunriseInfo = calculateNextSunrise(currentDate, location.lat, location.lng, events);
  const sunriseEvent = events.find((e) => e.id === 'sunrise');

  if (sunriseInfo.isPolar || !sunriseInfo.sunriseTime) {
    return (
      <div
        id="sunrise-glance-widget"
        className="z-20 px-2.5 py-1 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/50 flex items-center gap-1.5 select-none"
      >
        <Sunrise className="w-3 h-3 text-amber-500/60" />
        <span>No Sunrise (Polar Region)</span>
      </div>
    );
  }

  const sunriseTimeStr = formatWatchTime(sunriseInfo.sunriseTime);
  const civilDawnStr = sunriseInfo.civilDawnTime
    ? formatWatchTime(sunriseInfo.civilDawnTime)
    : null;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWatchTick('tap');
    setIsExpanded((prev) => !prev);
  };

  const handleOpenSunriseDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWatchTick('tap');
    if (sunriseEvent && onOpenDetail) {
      onOpenDetail(sunriseEvent);
    }
  };

  // Ultra-minimal icon chip mode if minimized
  if (isMinimized) {
    return (
      <motion.button
        id="sunrise-glance-minimized"
        onClick={() => {
          playWatchTick('tap');
          setIsMinimized(false);
        }}
        whileTap={{ scale: 0.9 }}
        className="z-20 px-2 py-1 rounded-full bg-[#0E0E12]/90 backdrop-blur-md border border-[#FB923C]/40 text-[#FB923C] flex items-center gap-1 shadow-[0_2px_10px_rgba(251,146,60,0.2)] text-[9px] font-mono select-none active:scale-95 transition-all"
        title="Show sunrise countdown widget"
      >
        <Sunrise className="w-3 h-3 text-[#FB923C] animate-pulse" />
        <span className="font-semibold">{sunriseInfo.countdownShort}</span>
      </motion.button>
    );
  }

  return (
    <div className="relative z-20 flex flex-col items-center select-none">
      {/* Primary Glanceable Capsule Widget Overlay */}
      <motion.div
        id="sunrise-glance-widget"
        whileTap={{ scale: 0.97 }}
        onClick={handleToggleExpand}
        className="group relative cursor-pointer flex flex-col items-center px-3 py-1.5 rounded-2xl bg-[#0B0B0E]/85 backdrop-blur-xl border border-[#FB923C]/35 hover:border-[#FB923C]/70 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_12px_rgba(251,146,60,0.15)] transition-all max-w-[230px]"
        title="Tap to expand sunrise timing & dawn milestones"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-[#FB923C]/70 to-transparent" />

        <div className="flex items-center justify-between w-full gap-2">
          {/* Left: Glowing Sunrise Icon with Aura */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative w-5 h-5 rounded-full bg-[#FB923C]/15 border border-[#FB923C]/40 flex items-center justify-center">
              <Sunrise className="w-3 h-3 text-[#FB923C] drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-75" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[9px] font-mono tracking-wider uppercase text-white/70">
                  Sunrise
                </span>
                <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-white/10 text-orange-200">
                  {sunriseInfo.isTomorrow ? 'TMRW' : 'TODAY'}
                </span>
              </div>
              <span className="text-[8px] font-mono text-white/40 leading-tight">
                at {sunriseTimeStr}
              </span>
            </div>
          </div>

          {/* Right: Exact Countdown */}
          <div className="flex flex-col items-end shrink-0 pl-1">
            <div className="flex items-center gap-0.5 font-mono text-[11px] font-semibold text-orange-200 tracking-tight">
              <span>{sunriseInfo.countdownShort}</span>
            </div>
            <span className="text-[7.5px] font-mono text-white/40 tracking-wider uppercase">
              remaining
            </span>
          </div>

          {/* Quick widget options button */}
          {onOpenWidgetPicker && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playWatchTick('tap');
                onOpenWidgetPicker();
              }}
              className="p-1 -mr-0.5 rounded-full hover:bg-white/15 text-white/40 hover:text-white transition-colors"
              title="Change watch face widget"
            >
              <Layers className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Expand/Collapse chevron indicator */}
          <div className="text-white/30 group-hover:text-white/60 transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </div>
        </div>

        {/* Micro Night-to-Sunrise Progress Line */}
        <div className="w-full mt-1 h-1 rounded-full bg-white/10 overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F27D26] to-[#FDE047] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${sunriseInfo.progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Expanded Glance Modal / Detail Popover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="sunrise-expanded-glance"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute -top-[195px] inset-x-[-15px] z-30 p-3 rounded-2xl bg-[#09090C]/95 backdrop-blur-2xl border border-[#FB923C]/50 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(251,146,60,0.25)] flex flex-col items-center text-center select-none max-w-[260px] mx-auto"
          >
            {/* Header with Title and Minimize/Close Buttons */}
            <div className="flex items-center justify-between w-full pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-[#FB923C]" />
                <span className="text-xs font-serif italic text-white/90">
                  Sunrise Glance
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                  title="Minimize to tiny pill"
                >
                  Min
                </button>
                <button
                  onClick={handleToggleExpand}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                  title="Close expanded glance"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Exact Digital Countdown Display */}
            <div className="my-1.5 flex flex-col items-center">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#FB923C]/80">
                Exact Time Remaining
              </span>
              <div className="font-mono text-xl font-light tracking-[0.15em] text-white my-0.5">
                {sunriseInfo.countdownDigital}
              </div>
              <div className="flex gap-4 text-[7.5px] font-mono text-white/40 uppercase tracking-widest">
                <span>HRS</span>
                <span>MIN</span>
                <span>SEC</span>
              </div>
            </div>

            {/* Milestones Grid */}
            <div className="w-full grid grid-cols-2 gap-1 my-1 text-left">
              {/* Scheduled Sunrise */}
              <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5 flex flex-col">
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">
                  Target Time
                </span>
                <span className="text-xs font-mono font-semibold text-orange-200">
                  {sunriseTimeStr}
                </span>
                <span className="text-[7.5px] font-mono text-[#FB923C]/80">
                  {sunriseInfo.isTomorrow ? 'Tomorrow' : 'Today'}
                </span>
              </div>

              {/* Civil Dawn (First Light) */}
              <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5 flex flex-col">
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">
                  First Light (Dawn)
                </span>
                <span className="text-xs font-mono font-semibold text-sky-200">
                  {civilDawnStr || '--:--'}
                </span>
                <span className="text-[7.5px] font-mono text-sky-400/80">
                  Pre-dawn glow
                </span>
              </div>
            </div>

            {/* 15m Sunrise Notification Alert Status Banner */}
            <div className="w-full flex items-center justify-between px-2 py-1 my-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
              <div className="flex items-center gap-1.5">
                <Bell className={`w-3 h-3 ${notificationsEnabled ? 'text-amber-400' : 'text-white/40'}`} />
                <div className="flex flex-col leading-tight">
                  <span className="text-[8.5px] font-mono text-white/90">
                    15m Alert: {notificationsEnabled ? 'Active' : 'Off'}
                  </span>
                  <span className="text-[7.5px] font-mono text-amber-300/70">
                    Subtle Wear OS Vibration
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onTestNotification && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestNotification();
                    }}
                    className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-[7.5px] font-mono text-amber-200 uppercase transition-colors flex items-center gap-0.5"
                    title="Test 15m sunrise alert and Wear OS vibration"
                  >
                    <Vibrate className="w-2.5 h-2.5" />
                    <span>Test</span>
                  </button>
                )}
                {onOpenNotifications && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNotifications();
                    }}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[7.5px] font-mono text-white/70 uppercase transition-colors"
                  >
                    Config
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex items-center gap-1.5 mt-1">
              <button
                onClick={handleOpenSunriseDetail}
                className="flex-1 py-1 px-2 rounded-lg bg-[#FB923C]/15 hover:bg-[#FB923C]/25 border border-[#FB923C]/40 text-[9px] font-mono tracking-wider uppercase text-[#FB923C] transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                <span>Full Details</span>
              </button>
              <button
                onClick={handleToggleExpand}
                className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[9px] font-mono text-white/80 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
