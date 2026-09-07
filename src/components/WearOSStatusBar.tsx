import React from 'react';
import { Battery, MapPin, Moon, Bell, BellOff } from 'lucide-react';
import { LocationData } from '../types/lumy';

interface WearOSStatusBarProps {
  currentDate: Date;
  location: LocationData;
  batteryLevel?: number;
  notificationsEnabled?: boolean;
  onToggleAOD: () => void;
  onOpenLocation: () => void;
  onOpenNotifications?: () => void;
}

export const WearOSStatusBar: React.FC<WearOSStatusBarProps> = ({
  currentDate,
  location,
  batteryLevel = 84,
  notificationsEnabled = true,
  onToggleAOD,
  onOpenLocation,
  onOpenNotifications,
}) => {
  const timeFormatted = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="absolute top-2 left-0 right-0 z-20 flex flex-col items-center justify-start pointer-events-auto px-6">
      {/* Top row: Status indicators */}
      <div className="flex items-center justify-between w-full max-w-[260px] text-[11px] font-medium text-white/60">
        {/* Left: Ambient AOD toggle & Notification alert icon */}
        <div className="flex items-center gap-1 -ml-1">
          <button
            id="btn-toggle-aod"
            onClick={onToggleAOD}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-white/60 hover:text-[#F27D26] hover:bg-white/5 transition-colors"
            title="Toggle Wear OS Ambient Always-On Display (AOD)"
          >
            <Moon className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="text-[10px] font-mono tracking-wider hidden xs:inline">AOD</span>
          </button>

          {onOpenNotifications && (
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className={`p-1 rounded-full hover:bg-white/10 transition-colors ${
                notificationsEnabled ? 'text-amber-400' : 'text-white/30'
              }`}
              title={notificationsEnabled ? '15m Sunrise Alert Active (Tap to test)' : 'Sunrise Alerts Off'}
            >
              {notificationsEnabled ? (
                <div className="relative">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Watch Time in Sophisticated Dark Pill */}
        <div className="bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/5 shadow-sm">
          <span className="text-[12px] font-mono font-medium tracking-[0.2em] uppercase text-white/90">
            {timeFormatted}
          </span>
        </div>

        {/* Battery */}
        <div className="flex items-center gap-1 text-[11px] text-white/60 font-mono">
          <span>{batteryLevel}%</span>
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Location Badge */}
      <button
        id="btn-change-location"
        onClick={onOpenLocation}
        className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-medium transition-all group shadow-sm"
        title="Change Location"
      >
        <MapPin className="w-2.5 h-2.5 text-[#F27D26] group-hover:scale-110 transition-transform" />
        <span className="truncate max-w-[120px] font-serif italic text-white/90">{location.name}</span>
      </button>
    </div>
  );
};
