import React, { useRef } from 'react';
import { playWatchTick } from '../utils/haptics';
import { WearOSTile, WatchFaceWidgetType } from '../types/lumy';
import { ChevronLeft, ChevronRight, Watch, Eye, RotateCw, Layers } from 'lucide-react';

interface WatchFrameProps {
  children: React.ReactNode;
  activeTile: WearOSTile;
  onTileChange: (tile: WearOSTile) => void;
  onCrownClick: () => void;
  onCrownRotate: (direction: 'up' | 'down') => void;
  showCase: boolean;
  onToggleCase: () => void;
  activeWidgetOption?: WatchFaceWidgetType;
  onOpenWidgetPicker?: () => void;
}

const TILES_ORDER: WearOSTile[] = ['dial', 'golden_hour', 'timeline', 'moon', 'compass'];

export const WatchFrame: React.FC<WatchFrameProps> = ({
  children,
  activeTile,
  onTileChange,
  onCrownClick,
  onCrownRotate,
  showCase,
  onToggleCase,
  activeWidgetOption,
  onOpenWidgetPicker,
}) => {
  const currentIndex = TILES_ORDER.indexOf(activeTile);

  const handleNextTile = () => {
    const nextIdx = (currentIndex + 1) % TILES_ORDER.length;
    playWatchTick('tick');
    onTileChange(TILES_ORDER[nextIdx]);
  };

  const handlePrevTile = () => {
    const prevIdx = (currentIndex - 1 + TILES_ORDER.length) % TILES_ORDER.length;
    playWatchTick('tick');
    onTileChange(TILES_ORDER[prevIdx]);
  };

  const handleCrownWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      onCrownRotate('down');
    } else {
      onCrownRotate('up');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 px-2 sm:px-6 relative select-none bg-[#050505] overflow-hidden">
      {/* Sophisticated Dark Ambient Background Glows */}
      <div className="absolute top-[-50px] left-[-50px] w-[320px] h-[320px] bg-[#F27D26]/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20px] right-[-20px] w-[240px] h-[240px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Top App Bar with Wear OS Mode controls */}
      <header className="w-full max-w-xl flex items-center justify-between mb-3 px-2 text-neutral-400 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F27D26] to-amber-400 flex items-center justify-center text-neutral-950 font-black text-xs shadow-[0_0_12px_rgba(242,125,38,0.4)]">
            B
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span className="font-serif italic text-white tracking-wide">Brivo</span>
              <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/70 font-mono tracking-wider">
                Wear OS
              </span>
            </h1>
          </div>
        </div>

        {/* Widget Option and Casing toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          {activeTile === 'dial' && onOpenWidgetPicker && (
            <button
              id="header-widget-option-btn"
              onClick={() => {
                playWatchTick('tap');
                onOpenWidgetPicker();
              }}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10.5px] font-mono flex items-center gap-1.5 transition-all shadow-sm"
              title="Change Watch Face Widget Option"
            >
              <Layers className="w-3 h-3 text-[#F27D26]" />
              <span className="tracking-wider uppercase text-[9.5px]">Widget</span>
            </button>
          )}

          <button
            id="toggle-case-mode-btn"
            onClick={onToggleCase}
            className={`px-3 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition-all backdrop-blur-md ${
              showCase
                ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                : 'bg-[#F27D26]/15 border-[#F27D26]/40 text-[#F27D26]'
            }`}
            title="Toggle Watch Case / Borderless Round Screen"
          >
            <Watch className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase text-[10px]">{showCase ? 'Cased' : 'Pure Round'}</span>
          </button>
        </div>
      </header>

      {/* Main Watch Simulator Area */}
      <main className="relative flex items-center justify-center my-auto z-10">
        {/* If Cased mode: Render physical watch body, straps, bezel, and crown */}
        {showCase ? (
          <div className="relative flex items-center justify-center p-6">
            {/* Top silicone watch strap */}
            <div className="absolute -top-16 w-36 h-24 bg-gradient-to-b from-[#18181A] to-[#0D0D0E] rounded-t-3xl border-t border-x border-neutral-800 shadow-xl" />

            {/* Bottom silicone watch strap */}
            <div className="absolute -bottom-16 w-36 h-24 bg-gradient-to-t from-[#18181A] to-[#0D0D0E] rounded-b-3xl border-b border-x border-neutral-800 shadow-xl" />

            {/* Sophisticated Dark Titanium Watch Case */}
            <div className="relative w-[320px] h-[320px] xs:w-[340px] xs:h-[340px] sm:w-[380px] sm:h-[380px] rounded-full border-[14px] border-[#1A1A1A] bg-black shadow-[0_0_80px_rgba(242,125,38,0.15),0_25px_60px_-15px_rgba(0,0,0,0.95)] p-[2px] flex items-center justify-center">
              {/* Inner ambient atmosphere gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#0F0F15] via-[#1A0D05] to-[#2D1204] opacity-80 pointer-events-none z-0" />

              {/* 3D Glass curved reflection highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/[0.04] via-transparent to-transparent pointer-events-none z-30" />

              {/* Round OLED Watch Screen (1:1 circular aspect) */}
              <div
                className="w-full h-full rounded-full bg-black relative overflow-hidden flex items-center justify-center z-10"
                style={{
                  clipPath: 'circle(50% at 50% 50%)',
                }}
              >
                {children}
              </div>

              {/* Physical Rotating Digital Crown on the Right */}
              <div
                onWheel={handleCrownWheel}
                className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-40 group"
                title="Interactive Wear OS Crown (Scroll or Click)"
              >
                <button
                  id="physical-crown-btn"
                  onClick={() => {
                    playWatchTick('tap');
                    onCrownClick();
                  }}
                  className="w-5 h-14 rounded-r-md bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-900 border-y border-r border-neutral-700 shadow-xl cursor-pointer active:translate-x-[-1px] transition-transform flex flex-col items-center justify-center gap-1 hover:brightness-110"
                >
                  {/* Ribbed tactile ridges on crown */}
                  <div className="w-3 h-0.5 bg-[#F27D26]/60 rounded-full" />
                  <div className="w-3 h-0.5 bg-neutral-500 rounded-full" />
                  <div className="w-3 h-0.5 bg-[#F27D26]/60 rounded-full" />
                  <div className="w-3 h-0.5 bg-neutral-500 rounded-full" />
                </button>
                <span className="absolute left-7 text-[9px] font-mono text-neutral-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-800">
                  Rotate / Press
                </span>
              </div>

              {/* Secondary hardware button */}
              <div className="absolute -right-2 top-[32%] -translate-y-1/2 w-2 h-7 rounded-r-sm bg-neutral-800 border-y border-r border-neutral-700 shadow" />
            </div>
          </div>
        ) : (
          /* Pure Round Screen Mode (No casing) */
          <div className="relative w-[300px] h-[300px] xs:w-[330px] xs:h-[330px] sm:w-[360px] sm:h-[360px] rounded-full border-[8px] border-[#1A1A1A] bg-black shadow-[0_0_80px_rgba(242,125,38,0.15),0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F15] via-[#1A0D05] to-[#2D1204] opacity-80 pointer-events-none z-0" />
            <div
              className="w-full h-full rounded-full bg-black relative overflow-hidden flex items-center justify-center z-10"
              style={{
                clipPath: 'circle(50% at 50% 50%)',
              }}
            >
              {children}
            </div>
          </div>
        )}
      </main>

      {/* Tile Navigation & Wear OS Controls Footer */}
      <footer className="w-full max-w-md flex flex-col items-center gap-2 mt-3 z-20">
        {/* Swipe Tile Controls (Arrows + Tile Indicators) */}
        <div className="flex items-center justify-center gap-3">
          <button
            id="btn-prev-tile"
            onClick={handlePrevTile}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white transition-colors"
            title="Previous Tile (Swipe Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Tile dots */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            {TILES_ORDER.map((tile) => {
              const isActive = tile === activeTile;
              const labels: Record<WearOSTile, string> = {
                dial: 'Dial',
                golden_hour: 'Magic Hours',
                timeline: 'Schedule',
                moon: 'Moon',
                compass: 'Compass',
              };

              return (
                <button
                  key={tile}
                  onClick={() => {
                    playWatchTick('tick');
                    onTileChange(tile);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    isActive ? 'w-5 bg-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.5)]' : 'w-1.5 bg-neutral-700 hover:bg-neutral-600'
                  }`}
                  title={`Tile: ${labels[tile]}`}
                />
              );
            })}
          </div>

          <button
            id="btn-next-tile"
            onClick={handleNextTile}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white transition-colors"
            title="Next Tile (Swipe Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Tile Name & Rotary simulation tip */}
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="font-serif italic text-white/80 tracking-wide capitalize">
            {activeTile.replace('_', ' ')}
          </span>
          <span className="text-white/20">•</span>
          <button
            id="btn-crown-sim"
            onClick={() => onCrownRotate('down')}
            className="flex items-center gap-1.5 hover:text-[#F27D26] text-white/60 transition-colors"
            title="Simulate rotating the watch bezel / crown"
          >
            <RotateCw className="w-3 h-3 text-[#F27D26]" />
            <span className="text-[10px] tracking-wider uppercase font-mono">Turn Crown</span>
          </button>
        </div>

        {/* Sophisticated Dark Solar Tracking Interface Label */}
        <div className="flex flex-col items-center opacity-30 mt-1 pointer-events-none">
          <div className="w-px h-8 bg-white/20 mb-2" />
          <span className="text-[10px] tracking-[0.5em] uppercase font-light text-white">Solar Tracking Interface</span>
        </div>
      </footer>
    </div>
  );
};
