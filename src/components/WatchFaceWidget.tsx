import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sunrise,
  Flame,
  Sun,
  Moon,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';
import {
  SolarEvent,
  LocationData,
  WatchFaceWidgetType,
  SolarPosition,
} from '../types/lumy';
import { SunriseGlanceWidget } from './SunriseGlanceWidget';
import { SolarSpectrumWidget } from './SolarSpectrumWidget';
import {
  calculateNextSunrise,
  calculateMoonInfo,
  formatWatchTime,
  formatDuration,
} from '../utils/solarCalculator';
import { playWatchTick } from '../utils/haptics';

interface WatchFaceWidgetProps {
  widgetType: WatchFaceWidgetType;
  currentDate: Date;
  location: LocationData;
  events: SolarEvent[];
  solarPosition: SolarPosition;
  notificationsEnabled?: boolean;
  onSelectWidget: (type: WatchFaceWidgetType) => void;
  onOpenWidgetPicker: () => void;
  onOpenDetail?: (event: SolarEvent) => void;
  onOpenNotifications?: () => void;
  onTestNotification?: () => void;
  onNavigateTile?: (tileId: string) => void;
}

export const WatchFaceWidget: React.FC<WatchFaceWidgetProps> = ({
  widgetType,
  currentDate,
  location,
  events,
  solarPosition,
  notificationsEnabled = true,
  onSelectWidget,
  onOpenWidgetPicker,
  onOpenDetail,
  onOpenNotifications,
  onTestNotification,
  onNavigateTile,
}) => {
  if (widgetType === 'none') {
    return null;
  }

  // 1. Lumy Solar Spectrum Widget (Orange -> Yellow -> Green -> Blue dial arc)
  if (widgetType === 'solar_spectrum') {
    return (
      <SolarSpectrumWidget
        currentDate={currentDate}
        location={location}
        events={events}
        solarPosition={solarPosition}
        onOpenWidgetPicker={onOpenWidgetPicker}
        onOpenDetail={onOpenDetail}
      />
    );
  }

  // 2. Sunrise widget (delegates to our full interactive SunriseGlanceWidget)
  if (widgetType === 'sunrise') {
    return (
      <SunriseGlanceWidget
        currentDate={currentDate}
        location={location}
        events={events}
        notificationsEnabled={notificationsEnabled}
        onOpenDetail={onOpenDetail}
        onOpenNotifications={onOpenNotifications}
        onTestNotification={onTestNotification}
        onOpenWidgetPicker={onOpenWidgetPicker}
      />
    );
  }

  // 2. Golden Hour Widget
  if (widgetType === 'golden_hour') {
    const morningGolden = events.find((e) => e.id === 'golden_hour_morning');
    const eveningGolden = events.find((e) => e.id === 'golden_hour_evening');
    const now = currentDate.getTime();

    // Determine upcoming or active golden hour
    let activeOrNext: { event: SolarEvent; isCurrent: boolean; targetTime: Date } | null = null;

    const checkGolden = (ev?: SolarEvent) => {
      if (!ev) return null;
      const start = ev.time.getTime();
      const end = ev.endTime?.getTime() || start + 45 * 60000;
      if (now >= start && now <= end) {
        return { event: ev, isCurrent: true, targetTime: new Date(end) };
      }
      if (now < start) {
        return { event: ev, isCurrent: false, targetTime: ev.time };
      }
      return null;
    };

    const morningStatus = checkGolden(morningGolden);
    const eveningStatus = checkGolden(eveningGolden);

    activeOrNext = morningStatus?.isCurrent
      ? morningStatus
      : eveningStatus?.isCurrent
      ? eveningStatus
      : morningStatus && !morningStatus.isCurrent
      ? morningStatus
      : eveningStatus && !eveningStatus.isCurrent
      ? eveningStatus
      : null;

    const countdownMs = activeOrNext
      ? Math.max(0, activeOrNext.targetTime.getTime() - now)
      : 0;
    const countdownStr = formatDuration(countdownMs);

    return (
      <div className="flex flex-col items-center">
        <motion.div
          id="watch-face-golden-widget"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playWatchTick('tap');
            if (activeOrNext?.event && onOpenDetail) {
              onOpenDetail(activeOrNext.event);
            }
          }}
          className="relative flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-[#120D0A]/90 hover:bg-[#1A120D] backdrop-blur-xl border border-[#F27D26]/40 shadow-[0_4px_16px_rgba(242,125,38,0.2)] text-neutral-100 cursor-pointer select-none max-w-[250px]"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#F27D26]/20 border border-[#F27D26]/50 flex items-center justify-center shrink-0">
              <Flame className="w-2.5 h-2.5 text-[#F27D26]" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-[#F27D26] font-semibold">
                  {activeOrNext?.isCurrent ? 'ACTIVE GOLDEN' : 'NEXT GOLDEN'}
                </span>
                <span className="text-[7.5px] font-mono text-white/50">
                  {activeOrNext ? formatWatchTime(activeOrNext.event.time) : '--:--'}
                </span>
              </div>
              <span className="text-[10px] font-serif italic text-white/95">
                {activeOrNext?.isCurrent ? `Ends in ${countdownStr}` : `In ${countdownStr}`}
              </span>
            </div>
          </div>

          {/* Quick widget options button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playWatchTick('tap');
              onOpenWidgetPicker();
            }}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            title="Switch watch face widget"
          >
            <Layers className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // 3. Daylight Duration & Progress Gauge Widget
  if (widgetType === 'daylight') {
    const sunrise = events.find((e) => e.id === 'sunrise')?.time;
    const sunset = events.find((e) => e.id === 'sunset')?.time;

    let daylightDurationStr = '--h --m';
    let percentElapsed = 0;
    let remainingStr = '--';

    if (sunrise && sunset) {
      const totalDaylightMs = sunset.getTime() - sunrise.getTime();
      const now = currentDate.getTime();
      daylightDurationStr = formatDuration(totalDaylightMs);

      if (now < sunrise.getTime()) {
        percentElapsed = 0;
        remainingStr = `Starts in ${formatDuration(sunrise.getTime() - now)}`;
      } else if (now > sunset.getTime()) {
        percentElapsed = 100;
        remainingStr = `Night • Ended ${formatDuration(now - sunset.getTime())} ago`;
      } else {
        const elapsedMs = now - sunrise.getTime();
        percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDaylightMs) * 100)));
        remainingStr = `${formatDuration(sunset.getTime() - now)} left`;
      }
    }

    return (
      <div className="flex flex-col items-center">
        <motion.div
          id="watch-face-daylight-widget"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playWatchTick('tap');
            onOpenWidgetPicker();
          }}
          className="relative flex flex-col gap-0.5 px-2.5 py-1 rounded-2xl bg-[#0D0F14]/90 hover:bg-[#131720] backdrop-blur-xl border border-yellow-500/35 shadow-[0_4px_16px_rgba(234,179,8,0.15)] text-neutral-100 cursor-pointer select-none max-w-[245px] w-full"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <Sun className="w-2.5 h-2.5 text-yellow-400" />
              </div>
              <span className="text-[8.5px] font-mono uppercase tracking-wider text-yellow-300 font-semibold">
                DAYLIGHT • {daylightDurationStr}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-white/70">
                {percentElapsed}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWatchTick('tap');
                  onOpenWidgetPicker();
                }}
                className="p-0.5 rounded-full hover:bg-white/10 text-white/50"
                title="Change widget"
              >
                <Layers className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Miniature Daylight Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden my-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-300"
              style={{ width: `${percentElapsed}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[7.5px] font-mono text-white/60">
            <span>{sunrise ? formatWatchTime(sunrise) : '--'}</span>
            <span className="text-amber-200/90">{remainingStr}</span>
            <span>{sunset ? formatWatchTime(sunset) : '--'}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Solar Noon / Zenith Widget
  if (widgetType === 'solar_noon') {
    const noonEvent = events.find((e) => e.id === 'solar_noon');
    const now = currentDate.getTime();
    const noonMs = noonEvent?.time.getTime() || 0;
    const diffMs = noonMs - now;
    const isPast = diffMs < 0;
    const countdownStr = formatDuration(Math.abs(diffMs));

    return (
      <div className="flex flex-col items-center">
        <motion.div
          id="watch-face-noon-widget"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playWatchTick('tap');
            if (noonEvent && onOpenDetail) {
              onOpenDetail(noonEvent);
            }
          }}
          className="relative flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-[#120E08]/90 hover:bg-[#1A140B] backdrop-blur-xl border border-orange-400/40 shadow-[0_4px_16px_rgba(251,146,60,0.2)] text-neutral-100 cursor-pointer select-none max-w-[250px]"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-orange-300" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-orange-300 font-semibold">
                  SOLAR NOON • {noonEvent ? formatWatchTime(noonEvent.time) : '12:00'}
                </span>
              </div>
              <span className="text-[10px] font-serif italic text-white/95">
                {isPast ? `Passed ${countdownStr} ago` : `Zenith in ${countdownStr}`}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playWatchTick('tap');
              onOpenWidgetPicker();
            }}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            title="Switch watch face widget"
          >
            <Layers className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // 5. Moon Phase Widget
  if (widgetType === 'moon_phase') {
    const moonInfo = calculateMoonInfo(currentDate, location.lat, location.lng);
    const illumPercent = Math.round(moonInfo.fraction * 100);

    return (
      <div className="flex flex-col items-center">
        <motion.div
          id="watch-face-moon-widget"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            playWatchTick('tap');
            if (onNavigateTile) {
              onNavigateTile('moon');
            }
          }}
          className="relative flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-[#0B0D14]/90 hover:bg-[#111522] backdrop-blur-xl border border-indigo-400/40 shadow-[0_4px_16px_rgba(129,140,248,0.2)] text-neutral-100 cursor-pointer select-none max-w-[250px]"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shrink-0">
              <Moon className="w-2.5 h-2.5 text-indigo-300" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                  {moonInfo.phaseName}
                </span>
                <span className="text-[7.5px] font-mono text-white/50">
                  {illumPercent}% LUNAR
                </span>
              </div>
              <span className="text-[10px] font-serif italic text-white/95">
                {moonInfo.moonrise
                  ? `Moonrise ${formatWatchTime(moonInfo.moonrise)}`
                  : 'Tap for lunar tile'}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playWatchTick('tap');
              onOpenWidgetPicker();
            }}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            title="Switch watch face widget"
          >
            <Layers className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
};
