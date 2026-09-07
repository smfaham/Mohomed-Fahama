import React from 'react';
import { MoonInfo } from '../../types/lumy';
import { formatWatchTime } from '../../utils/solarCalculator';
import { Moon, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface MoonTileProps {
  moonInfo: MoonInfo;
}

export const MoonTile: React.FC<MoonTileProps> = ({ moonInfo }) => {
  const illuminationPct = Math.round(moonInfo.fraction * 100);

  // Render SVG moon illumination
  // Moon phase: 0 = new moon, 0.5 = full moon, 1.0 = new moon
  const renderMoonSvg = () => {
    const r = 36;
    const cx = 50;
    const cy = 50;
    const p = moonInfo.phaseValue; // 0 to 1

    // Determine shadow curve for SVG mask
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[0_0_15px_rgba(226,232,240,0.35)]">
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#F8FAFC" />
            <stop offset="90%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>
          <filter id="craterFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.85  0 0 0 0.15 0" />
            <feComposite in2="SourceGraphic" in="gl" operator="in" />
          </filter>
        </defs>

        {/* Dark side base */}
        <circle cx={cx} cy={cy} r={r} fill="#1E293B" stroke="#334155" strokeWidth="1" />

        {/* Illuminated side */}
        {p === 0 ? null : p >= 0.48 && p <= 0.52 ? (
          // Full moon
          <circle cx={cx} cy={cy} r={r} fill="url(#moonGlow)" />
        ) : (
          // Custom realistic crescent / gibbous
          <g>
            <circle cx={cx} cy={cy} r={r} fill="url(#moonGlow)" />
            {/* Shadow overlay based on phase */}
            <path
              d={
                p < 0.5
                  ? // Waxing: shadow on the left
                    `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${Math.abs(r - 2 * r * p * 2)} ${r} 0 0 ${
                        p < 0.25 ? 1 : 0
                      } ${cx} ${cy - r}`
                  : // Waning: shadow on the right
                    `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${Math.abs(r - 2 * r * (p - 0.5) * 2)} ${r} 0 0 ${
                        p < 0.75 ? 0 : 1
                      } ${cx} ${cy - r}`
              }
              fill="#1E293B"
            />
          </g>
        )}

        {/* Subtle crater details */}
        <circle cx="44" cy="42" r="5" fill="#64748B" opacity="0.15" />
        <circle cx="56" cy="58" r="7" fill="#64748B" opacity="0.12" />
        <circle cx="58" cy="38" r="4" fill="#64748B" opacity="0.12" />
      </svg>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 pt-10 pb-6 text-center select-none overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-blue-300" />
          <span className="text-[12px] font-serif italic text-white/90 tracking-wide">
            Lunar Companion
          </span>
        </div>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      </div>

      {/* Realistic Moon */}
      <div className="my-1 flex items-center justify-center">
        {renderMoonSvg()}
      </div>

      {/* Phase title & Illumination % */}
      <h3 className="text-base font-serif italic text-white tracking-tight mt-1" style={{ fontFamily: "Georgia, 'Newsreader', serif" }}>
        {moonInfo.phaseName}
      </h3>
      <div className="text-[11px] font-mono text-blue-300">
        {illuminationPct}% Illuminated
      </div>

      {/* Moonrise & Moonset quick cards */}
      <div className="mt-2.5 w-full max-w-[240px] grid grid-cols-2 gap-1.5">
        <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-left">
          <ArrowUpRight className="w-3 h-3 text-blue-300 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8px] text-white/40 uppercase tracking-widest block">Moonrise</span>
            <span className="text-[11px] font-mono text-white/90 truncate block">
              {moonInfo.moonrise ? formatWatchTime(moonInfo.moonrise) : '--:--'}
            </span>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-left">
          <ArrowDownRight className="w-3 h-3 text-indigo-300 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8px] text-white/40 uppercase tracking-widest block">Moonset</span>
            <span className="text-[11px] font-mono text-white/90 truncate block">
              {moonInfo.moonset ? formatWatchTime(moonInfo.moonset) : '--:--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
