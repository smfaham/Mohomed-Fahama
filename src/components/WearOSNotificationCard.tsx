import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sunrise, X, Clock, Vibrate, ChevronRight, BellRing } from 'lucide-react';
import { SunriseAlertNotification, SolarEvent } from '../types/lumy';
import { formatWatchTime } from '../utils/solarCalculator';
import { playWatchTick, playWearOSVibration } from '../utils/haptics';

interface WearOSNotificationCardProps {
  notification: SunriseAlertNotification;
  sunriseEvent?: SolarEvent;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onViewEvent?: (event: SolarEvent) => void;
}

export const WearOSNotificationCard: React.FC<WearOSNotificationCardProps> = ({
  notification,
  sunriseEvent,
  onDismiss,
  onSnooze,
  onViewEvent,
}) => {
  const [isVibratingEffect, setIsVibratingEffect] = useState(true);

  // Trigger brief visual vibration shimmer on mount matching the 2-pulse haptic timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVibratingEffect(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const sunriseTimeFormatted = formatWatchTime(notification.sunriseTime);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWatchTick('tap');
    onDismiss();
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWatchTick('tap');
    onSnooze(5);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    playWatchTick('tap');
    if (sunriseEvent && onViewEvent) {
      onViewEvent(sunriseEvent);
      onDismiss();
    }
  };

  const handleReplayVibration = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVibratingEffect(true);
    playWearOSVibration('double-pulse');
    setTimeout(() => setIsVibratingEffect(false), 500);
  };

  return (
    <motion.div
      id="wearos-notification-banner"
      initial={{ y: -130, opacity: 0, scale: 0.92 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        x: isVibratingEffect ? [-1.5, 1.5, -1, 1, 0] : 0,
      }}
      exit={{ y: -130, opacity: 0, scale: 0.92 }}
      transition={{
        y: { type: 'spring', stiffness: 180, damping: 20 },
        x: { duration: 0.25, repeat: isVibratingEffect ? 1 : 0 },
      }}
      className="absolute top-2 inset-x-2.5 z-50 p-3 rounded-3xl bg-[#0F0F14]/95 backdrop-blur-2xl border border-amber-500/45 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.25)] select-none text-neutral-100 flex flex-col items-center max-w-[270px] mx-auto pointer-events-auto"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Sunrise className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
            {notification.isTest ? 'TEST • SUNRISE ALERT' : 'SUNRISE IN 15 MIN'}
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Center Body Message */}
      <div className="my-2 flex flex-col items-center text-center px-1">
        <div className="flex items-center gap-1.5 font-serif italic text-base font-normal text-white">
          <span>Sunrise at {sunriseTimeFormatted}</span>
        </div>
        <p className="text-[10px] text-white/70 leading-tight mt-0.5 max-w-[220px]">
          {notification.message}
        </p>

        {/* Subtle Wear OS Vibration Indicator Pill */}
        <button
          onClick={handleReplayVibration}
          className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[8.5px] font-mono text-amber-200/90 transition-colors"
          title="Tap to replay subtle Wear OS vibration pattern"
        >
          <Vibrate className={`w-3 h-3 text-amber-400 ${isVibratingEffect ? 'animate-bounce' : ''}`} />
          <span>Wear OS Haptic: Double Pulse</span>
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-1.5 w-full mt-0.5">
        <button
          onClick={handleSnooze}
          className="px-2 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/80 transition-all active:scale-95"
          title="Snooze alert for 5 minutes"
        >
          <Clock className="w-3 h-3 text-amber-300" />
          <span>Snooze 5m</span>
        </button>

        {sunriseEvent && onViewEvent ? (
          <button
            onClick={handleView}
            className="px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 flex items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-wider text-amber-200 font-semibold transition-all active:scale-95 shadow-sm"
            title="View full sunrise details"
          >
            <span>View</span>
            <ChevronRight className="w-3 h-3 text-amber-300" />
          </button>
        ) : (
          <button
            onClick={handleDismiss}
            className="px-2 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-[9px] font-mono uppercase tracking-wider text-white/80 transition-all active:scale-95"
          >
            Dismiss
          </button>
        )}
      </div>
    </motion.div>
  );
};
