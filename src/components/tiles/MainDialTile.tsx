import React from 'react';
import { SolarDial } from '../SolarDial';
import { WatchFaceWidget } from '../WatchFaceWidget';
import { SolarEvent, SolarPosition, LocationData, WatchFaceWidgetType } from '../../types/lumy';
import { SlidersHorizontal, Calendar, Layers, Sunrise, Flame, Sun, Sparkles, Moon, EyeOff } from 'lucide-react';
import { playWatchTick } from '../../utils/haptics';

interface MainDialTileProps {
  currentDate: Date;
  location: LocationData;
  events: SolarEvent[];
  solarPosition: SolarPosition;
  notificationsEnabled?: boolean;
  activeWidgetOption?: WatchFaceWidgetType;
  onSelectWidgetOption?: (widget: WatchFaceWidgetType) => void;
  onOpenWidgetPicker?: () => void;
  onOpenDetail: (event: SolarEvent) => void;
  onOpenScrubber: () => void;
  onOpenTimeline: () => void;
  onOpenNotifications?: () => void;
  onTestNotification?: () => void;
  onNavigateTile?: (tileId: string) => void;
}

export const MainDialTile: React.FC<MainDialTileProps> = ({
  currentDate,
  location,
  events,
  solarPosition,
  notificationsEnabled = true,
  activeWidgetOption = 'sunrise',
  onSelectWidgetOption,
  onOpenWidgetPicker,
  onOpenDetail,
  onOpenScrubber,
  onOpenTimeline,
  onOpenNotifications,
  onTestNotification,
  onNavigateTile,
}) => {
  // Helper label and icon for widget complication button
  const getWidgetBtnInfo = () => {
    switch (activeWidgetOption) {
      case 'solar_spectrum':
        return { label: 'Chroma', icon: Sparkles, color: 'text-amber-400' };
      case 'sunrise':
        return { label: 'Dawn', icon: Sunrise, color: 'text-amber-400' };
      case 'golden_hour':
        return { label: 'Golden', icon: Flame, color: 'text-[#F27D26]' };
      case 'daylight':
        return { label: 'Daylight', icon: Sun, color: 'text-yellow-400' };
      case 'solar_noon':
        return { label: 'Noon', icon: Sparkles, color: 'text-orange-300' };
      case 'moon_phase':
        return { label: 'Moon', icon: Moon, color: 'text-indigo-300' };
      case 'none':
      default:
        return { label: '+ Widget', icon: EyeOff, color: 'text-white/40' };
    }
  };

  const widgetInfo = getWidgetBtnInfo();
  const WidgetIcon = widgetInfo.icon;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between pt-12 pb-2 px-2 select-none">
      {/* Central Interactive Dial */}
      <div className="relative w-full flex-1 flex items-center justify-center -my-3">
        <SolarDial
          currentDate={currentDate}
          events={events}
          solarPosition={solarPosition}
          onOpenDetail={onOpenDetail}
        />
      </div>

      {/* Configurable Watch Face Widget Option Overlay */}
      <div className="relative z-20 w-full flex justify-center mb-1">
        <WatchFaceWidget
          widgetType={activeWidgetOption}
          currentDate={currentDate}
          location={location}
          events={events}
          solarPosition={solarPosition}
          notificationsEnabled={notificationsEnabled}
          onSelectWidget={onSelectWidgetOption || (() => {})}
          onOpenWidgetPicker={onOpenWidgetPicker || (() => {})}
          onOpenDetail={onOpenDetail}
          onOpenNotifications={onOpenNotifications}
          onTestNotification={onTestNotification}
          onNavigateTile={onNavigateTile}
        />
      </div>

      {/* Bottom Glanceable Wear OS Pill Actions in Sophisticated Dark Theme */}
      <div className="z-10 mb-1 flex items-center justify-center gap-1.5 w-full max-w-[270px]">
        {/* Simulate Time button */}
        <button
          id="btn-scrub-time"
          onClick={onOpenScrubber}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-[9.5px] font-mono tracking-wider uppercase text-white/90 active:scale-95 transition-all shadow-md group"
          title="Time Scrubber / Rotary simulation"
        >
          <SlidersHorizontal className="w-2.5 h-2.5 text-[#F27D26] group-hover:rotate-45 transition-transform" />
          <span>Sim</span>
        </button>

        {/* Watch Face Widget Option Complication Selector */}
        <button
          id="btn-watch-face-widget-option"
          onClick={() => {
            playWatchTick('tap');
            onOpenWidgetPicker?.();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-[9.5px] font-mono tracking-wider uppercase text-white/90 active:scale-95 transition-all shadow-md group"
          title="Customize watch face widget complication option"
        >
          <WidgetIcon className={`w-2.5 h-2.5 ${widgetInfo.color} group-hover:scale-110 transition-transform`} />
          <span className="truncate max-w-[54px]">{widgetInfo.label}</span>
          <Layers className="w-2 h-2 text-white/40" />
        </button>

        {/* Solar Schedule button */}
        <button
          id="btn-view-timeline"
          onClick={onOpenTimeline}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-[9.5px] font-mono tracking-wider uppercase text-white/90 active:scale-95 transition-all shadow-md group"
          title="View today's solar schedule"
        >
          <Calendar className="w-2.5 h-2.5 text-blue-300 group-hover:scale-110 transition-transform" />
          <span>Sched</span>
        </button>
      </div>
    </div>
  );
};

