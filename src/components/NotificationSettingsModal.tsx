import React from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, X, Vibrate, Check, Sparkles, Send } from 'lucide-react';
import { playWatchTick, playWearOSVibration, requestNotificationPermission } from '../utils/haptics';
import { formatWatchTime } from '../utils/solarCalculator';

interface NotificationSettingsModalProps {
  notificationsEnabled: boolean;
  onToggleEnabled: () => void;
  onTriggerTestNotification: () => void;
  nextSunriseTime?: Date | null;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  notificationsEnabled,
  onToggleEnabled,
  onTriggerTestNotification,
  nextSunriseTime,
  onClose,
}) => {
  const handleRequestBrowser = async () => {
    playWatchTick('tap');
    const granted = await requestNotificationPermission();
    if (granted) {
      playWearOSVibration('double-pulse');
    }
  };

  const formattedSunrise = nextSunriseTime ? formatWatchTime(nextSunriseTime) : '--:--';
  const alertTime = nextSunriseTime
    ? formatWatchTime(new Date(nextSunriseTime.getTime() - 15 * 60000))
    : '--:--';

  return (
    <div className="absolute inset-0 z-50 bg-[#09090C]/90 backdrop-blur-xl rounded-full flex flex-col items-center justify-start p-4 pt-7 pb-6 text-neutral-100 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* Close Button */}
      <button
        onClick={() => {
          playWatchTick('tap');
          onClose();
        }}
        className="absolute top-3 right-6 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-colors z-50"
        title="Close settings"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-0.5 mb-2">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-serif italic text-white tracking-wide">
            Sunrise Alerts
          </span>
        </div>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      </div>

      {/* Main Toggle Card */}
      <div className="w-full max-w-[240px] p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between mb-2">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-medium text-white/90">
            15m Sunrise Alert
          </span>
          <span className="text-[8.5px] font-mono text-white/50">
            Wear OS gentle vibration
          </span>
        </div>

        <button
          id="btn-toggle-sunrise-alert"
          onClick={() => {
            playWatchTick('tap');
            onToggleEnabled();
            if (!notificationsEnabled) {
              playWearOSVibration('nudge');
            }
          }}
          className={`relative w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
            notificationsEnabled ? 'bg-amber-500' : 'bg-white/20'
          }`}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ x: notificationsEnabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Schedule Info Card */}
      <div className="w-full max-w-[240px] p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1 mb-2 text-left">
        <div className="flex justify-between items-center text-[9px] font-mono">
          <span className="text-white/50 uppercase">Next Sunrise</span>
          <span className="text-amber-300 font-semibold">{formattedSunrise}</span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono">
          <span className="text-white/50 uppercase">Alert Trigger (-15m)</span>
          <span className="text-white/90">{alertTime}</span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono">
          <span className="text-white/50 uppercase">Haptic Engine</span>
          <span className="text-white/70">LRA Double-Pulse</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 w-full max-w-[240px]">
        {/* Immediate Test Alert Button */}
        <button
          id="btn-test-sunrise-alert"
          onClick={() => {
            playWatchTick('tap');
            onTriggerTestNotification();
            onClose();
          }}
          className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-200 font-semibold transition-all active:scale-95"
        >
          <Vibrate className="w-3.5 h-3.5 text-amber-400" />
          <span>Test Alert & Vibration</span>
        </button>

        {/* Optional Browser System Notification Permission */}
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
          <button
            onClick={handleRequestBrowser}
            className="w-full py-1 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 flex items-center justify-center gap-1.5 text-[9px] font-mono text-white/70 transition-colors"
          >
            <Send className="w-3 h-3 text-white/50" />
            <span>Enable System Notifications</span>
          </button>
        )}
      </div>
    </div>
  );
};
