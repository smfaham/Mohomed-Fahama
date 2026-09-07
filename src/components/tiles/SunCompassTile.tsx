import React from 'react';
import { SolarPosition } from '../../types/lumy';
import { Compass, Sun, Navigation } from 'lucide-react';

interface SunCompassTileProps {
  solarPosition: SolarPosition;
}

export const SunCompassTile: React.FC<SunCompassTileProps> = ({ solarPosition }) => {
  const { altitude, azimuth, azimuthCompass, shadowLengthRatio } = solarPosition;
  const isAboveHorizon = altitude > 0;

  // Azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  // Compass radius
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;

  const sunAngleRad = ((azimuth - 90) * Math.PI) / 180;
  const sunX = cx + r * Math.cos(sunAngleRad);
  const sunY = cy + r * Math.sin(sunAngleRad);

  // Shadow angle is exactly 180° opposite to sun azimuth
  const shadowAngleRad = ((azimuth + 180 - 90) * Math.PI) / 180;
  const shadowX = cx + (r - 12) * Math.cos(shadowAngleRad);
  const shadowY = cy + (r - 12) * Math.sin(shadowAngleRad);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 pt-10 pb-6 text-center select-none overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="text-[12px] font-serif italic text-[#F27D26] tracking-wide">
            Sun Compass
          </span>
        </div>
        <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent" />
      </div>

      {/* Compass SVG */}
      <div className="relative my-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40">
          <defs>
            <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F27D26" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Compass rings */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 4" />

          {/* Cardinal markers */}
          <text x={cx} y={cy - r + 14} textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">
            N
          </text>
          <text x={cx + r - 12} y={cy + 4} textAnchor="middle" fill="#8A8A93" fontSize="9" fontWeight="bold">
            E
          </text>
          <text x={cx} y={cy + r - 6} textAnchor="middle" fill="#8A8A93" fontSize="9" fontWeight="bold">
            S
          </text>
          <text x={cx - r + 12} y={cy + 4} textAnchor="middle" fill="#8A8A93" fontSize="9" fontWeight="bold">
            W
          </text>

          {/* Center reference point */}
          <circle cx={cx} cy={cy} r="3" fill="#52525B" />

          {/* Ray from center to sun position */}
          <line
            x1={cx}
            y1={cy}
            x2={sunX}
            y2={sunY}
            stroke="#F27D26"
            strokeWidth="1.5"
            strokeDasharray={isAboveHorizon ? 'none' : '2 2'}
            opacity={isAboveHorizon ? 0.95 : 0.4}
          />

          {/* Ray from center to shadow position */}
          {isAboveHorizon && (
            <line
              x1={cx}
              y1={cy}
              x2={shadowX}
              y2={shadowY}
              stroke="#64748B"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          )}

          {/* Sun marker */}
          <circle
            cx={sunX}
            cy={sunY}
            r="7"
            fill={isAboveHorizon ? '#F27D26' : '#475569'}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-mono font-medium text-white/90">
            {Math.round(azimuth)}°
          </span>
          <span className="text-[10px] font-serif italic text-[#F27D26]">
            {azimuthCompass}
          </span>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="w-full max-w-[240px] grid grid-cols-2 gap-1.5 mt-1">
        <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-left">
          <span className="text-[8px] text-white/40 uppercase tracking-widest block">Sun Altitude</span>
          <span className="text-[11px] font-mono text-orange-200">
            {Math.round(altitude)}° {isAboveHorizon ? 'Above' : 'Below'}
          </span>
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-left">
          <span className="text-[8px] text-white/40 uppercase tracking-widest block">Shadow Ratio</span>
          <span className="text-[11px] font-mono text-white/90">
            {isAboveHorizon ? `${shadowLengthRatio}x height` : 'No shadow'}
          </span>
        </div>
      </div>
    </div>
  );
};
