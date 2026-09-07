import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sunrise,
  Flame,
  Sun,
  Moon,
  Compass,
  Check,
  EyeOff,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { WatchFaceWidgetType } from '../types/lumy';
import { playWatchTick, playWearOSVibration } from '../utils/haptics';

interface WidgetOptionMeta {
  type: WatchFaceWidgetType;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
}

const WIDGET_OPTIONS: WidgetOptionMeta[] = [
  {
    type: 'solar_spectrum',
    title: 'Solar Spectrum',
    subtitle: 'Orange → Yellow → Green → Blue dial arc',
    badge: 'CHROMA DIAL',
    icon: Sparkles,
    accentColor: 'text-amber-300',
    borderColor: 'border-amber-500/50',
    bgGlow: 'bg-gradient-to-r from-[#F27D26]/20 via-[#10B981]/15 to-[#3B82F6]/20',
  },
  {
    type: 'sunrise',
    title: 'Sunrise Countdown',
    subtitle: 'Exact countdown & 15m alert',
    badge: 'DAWN ALERT',
    icon: Sunrise,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGlow: 'bg-amber-500/10',
  },
  {
    type: 'golden_hour',
    title: 'Golden Hour',
    subtitle: 'Photography window & warm aura',
    badge: 'PHOTO LIGHT',
    icon: Flame,
    accentColor: 'text-[#F27D26]',
    borderColor: 'border-[#F27D26]/40',
    bgGlow: 'bg-[#F27D26]/10',
  },
  {
    type: 'daylight',
    title: 'Daylight Gauge',
    subtitle: 'Elapsed vs remaining sunlight',
    badge: 'SUN DURATION',
    icon: Sun,
    accentColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgGlow: 'bg-yellow-500/10',
  },
  {
    type: 'solar_noon',
    title: 'Solar Noon & Zenith',
    subtitle: 'Peak sun altitude & solar apex',
    badge: 'ZENITH',
    icon: Sparkles,
    accentColor: 'text-orange-300',
    borderColor: 'border-orange-400/40',
    bgGlow: 'bg-orange-500/10',
  },
  {
    type: 'moon_phase',
    title: 'Moon Phase',
    subtitle: 'Lunar illumination & moonrise',
    badge: 'LUNAR',
    icon: Moon,
    accentColor: 'text-indigo-300',
    borderColor: 'border-indigo-400/40',
    bgGlow: 'bg-indigo-500/10',
  },
  {
    type: 'none',
    title: 'Clean Watch Face',
    subtitle: 'Hide widget for minimal dial',
    badge: 'MINIMAL',
    icon: EyeOff,
    accentColor: 'text-white/50',
    borderColor: 'border-white/20',
    bgGlow: 'bg-white/5',
  },
];

interface WatchFaceWidgetOptionsModalProps {
  currentWidget: WatchFaceWidgetType;
  onSelectWidget: (widget: WatchFaceWidgetType) => void;
  onClose: () => void;
}

export const WatchFaceWidgetOptionsModal: React.FC<WatchFaceWidgetOptionsModalProps> = ({
  currentWidget,
  onSelectWidget,
  onClose,
}) => {
  const handleSelect = (widget: WatchFaceWidgetType) => {
    playWatchTick('tap');
    playWearOSVibration('nudge');
    onSelectWidget(widget);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0A0A0E]/92 backdrop-blur-xl rounded-full flex flex-col items-center justify-start p-3 pt-6 pb-5 text-neutral-100 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* Close button */}
      <button
        onClick={() => {
          playWatchTick('tap');
          onClose();
        }}
        className="absolute top-2.5 right-6 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-colors z-50"
        title="Close widget picker"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-0.5 mb-2.5">
        <div className="flex items-center gap-1 text-white/90">
          <Layers className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-xs font-serif italic tracking-wide text-white">
            Watch Face Widget
          </span>
        </div>
        <span className="text-[8px] font-mono text-white/50 uppercase tracking-widest">
          Choose Complication
        </span>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26]/70 to-transparent mt-0.5" />
      </div>

      {/* Widget List */}
      <div className="w-full max-w-[245px] flex flex-col gap-1.5 pb-2">
        {WIDGET_OPTIONS.map((option) => {
          const isSelected = currentWidget === option.type;
          const IconComponent = option.icon;

          return (
            <motion.button
              key={option.type}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(option.type)}
              className={`w-full p-2 rounded-2xl flex items-center justify-between text-left transition-all border ${
                isSelected
                  ? `${option.bgGlow} ${option.borderColor} ring-1 ring-white/20 shadow-md`
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? `${option.bgGlow} ${option.borderColor}`
                      : 'bg-white/5 border-white/10'
                  }`}
                  style={
                    option.type === 'solar_spectrum'
                      ? {
                          background:
                            'conic-gradient(from 0deg, rgba(242,125,38,0.35), rgba(251,191,36,0.35), rgba(16,185,129,0.35), rgba(59,130,246,0.35), rgba(242,125,38,0.35))',
                        }
                      : undefined
                  }
                >
                  <IconComponent className={`w-3.5 h-3.5 ${option.accentColor}`} />
                </div>

                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-medium text-white/90">
                      {option.title}
                    </span>
                    <span
                      className={`text-[7px] font-mono px-1 py-0.2 rounded font-semibold ${
                        isSelected
                          ? 'bg-white/15 text-white'
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {option.badge}
                    </span>
                  </div>
                  <span className="text-[8px] text-white/50 font-light line-clamp-1">
                    {option.subtitle}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-[#F27D26] flex items-center justify-center text-white shrink-0 ml-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
