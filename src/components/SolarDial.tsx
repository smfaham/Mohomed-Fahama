import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SolarEvent, SolarPosition } from '../types/lumy';
import { formatWatchTime } from '../utils/solarCalculator';
import { Sparkles, Sun, Sunset, Sunrise, Flame, Moon, CloudSun, Eye } from 'lucide-react';

interface SolarDialProps {
  currentDate: Date;
  events: SolarEvent[];
  solarPosition: SolarPosition;
  onOpenDetail?: (event: SolarEvent) => void;
}

export const SolarDial: React.FC<SolarDialProps> = ({
  currentDate,
  events,
  solarPosition,
  onOpenDetail,
}) => {
  // Center is (160, 160) inside a 320x320 SVG viewport
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 122; // dial track radius
  const strokeWidth = 8;

  // 24 hour dial: 00:00 is at bottom (90 deg in SVG math), 12:00 is at top (-90 deg)
  // Let angle = (hours / 24) * 360 - 90. So 12:00 = 180 - 90 = 90 deg?
  // Let's standardise:
  // Top (12:00 PM / Solar Noon) = 270 deg (or -90 deg)
  // Bottom (00:00 / Midnight) = 90 deg
  // Left (06:00 AM / Sunrise) = 180 deg
  // Right (18:00 PM / Sunset) = 0 deg
  const timeToAngle = (d: Date): number => {
    const hours = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    // Map 12:00 -> -90 deg, 18:00 -> 0 deg, 24/0 -> 90 deg, 06:00 -> 180 deg
    return (hours / 24) * 360 + 90; // at 00:00: 90 deg (bottom); at 12:00: 270 deg (top); at 06:00: 180 deg (left); at 18:00: 360=0 deg (right)
  };

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    // Ensure positive sweep
    let sweep = endAngle - startAngle;
    while (sweep < 0) sweep += 360;
    if (sweep >= 360) sweep = 359.99;

    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = sweep <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  // Find key event times
  const sunriseEv = events.find((e) => e.id === 'sunrise') || events[0];
  const sunsetEv = events.find((e) => e.id === 'sunset') || events[events.length - 1];
  const goldenMorning = events.find((e) => e.id === 'golden_hour_morning');
  const goldenEvening = events.find((e) => e.id === 'golden_hour_evening');
  const blueMorning = events.find((e) => e.id === 'blue_hour_morning');
  const blueEvening = events.find((e) => e.id === 'blue_hour_evening');

  const sunriseAngle = timeToAngle(sunriseEv.time);
  const sunsetAngle = timeToAngle(sunsetEv.time);

  // Current target sun angle
  const targetSunAngle = timeToAngle(currentDate);
  const prevAngleRef = useRef(targetSunAngle);
  const cumulativeAngleRef = useRef(targetSunAngle);
  const [animatedSunAngle, setAnimatedSunAngle] = useState(targetSunAngle);
  const [scrubTwist, setScrubTwist] = useState(0);

  useEffect(() => {
    let delta = targetSunAngle - prevAngleRef.current;
    // Shortest angular path unwrapping so the sun never makes a 360-deg reverse sweep
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    cumulativeAngleRef.current += delta;
    prevAngleRef.current = targetSunAngle;
    setAnimatedSunAngle(cumulativeAngleRef.current);

    // Apply mechanical spring twist to the dial if time updated (scrubber movement)
    if (Math.abs(delta) > 0.8) {
      const impulse = Math.max(-8, Math.min(8, delta * 0.08));
      setScrubTwist(impulse);
      const timer = setTimeout(() => {
        setScrubTwist(0);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [targetSunAngle]);

  // Determine current active phase
  const nowMs = currentDate.getTime();
  let activeEvent = events[0];
  let nextEvent = events[1] || events[0];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const evStart = ev.time.getTime();
    const evEnd = ev.endTime ? ev.endTime.getTime() : (events[i + 1] ? events[i + 1].time.getTime() : evStart + 60 * 60000);

    if (nowMs >= evStart && nowMs < evEnd) {
      activeEvent = ev;
      nextEvent = events[i + 1] || events[0];
      break;
    } else if (nowMs < evStart) {
      nextEvent = ev;
      activeEvent = events[i - 1] || events[events.length - 1];
      break;
    }
  }

  // Time remaining to next event
  const targetDate = nextEvent.time.getTime() > nowMs ? nextEvent.time : (activeEvent.endTime && activeEvent.endTime.getTime() > nowMs ? activeEvent.endTime : nextEvent.time);
  const diffMs = Math.max(0, targetDate.getTime() - nowMs);
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;
  const countdownText = diffHours > 0 ? `${diffHours}h ${remMinutes}m` : `${diffMinutes}m`;

  const isSunAboveHorizon = solarPosition.altitude > 0;

  // Compute times for the 3-column glanceable grid
  const blueTime = blueEvening ? formatWatchTime(blueEvening.time) : (blueMorning ? formatWatchTime(blueMorning.time) : '--:--');
  const sunsetTime = formatWatchTime(sunsetEv.time);
  const lastLightEv = events.find((e) => e.id === 'night_start' || e.id === 'astronomical_dusk') || events[events.length - 1];
  const lastLightTime = lastLightEv ? formatWatchTime(lastLightEv.time) : '--:--';

  // Get matching icon for active event
  const renderEventIcon = () => {
    switch (activeEvent.id) {
      case 'golden_hour_morning':
      case 'golden_hour_evening':
        return <Flame className="w-4 h-4 text-[#F27D26] animate-pulse" />;
      case 'blue_hour_morning':
      case 'blue_hour_evening':
        return <Moon className="w-4 h-4 text-blue-300" />;
      case 'sunrise':
        return <Sunrise className="w-4 h-4 text-orange-400" />;
      case 'sunset':
        return <Sunset className="w-4 h-4 text-[#F27D26]" />;
      case 'solar_noon':
        return <Sun className="w-4 h-4 text-amber-300" />;
      case 'night_start':
      case 'nadir':
      case 'astronomical_dawn':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return isSunAboveHorizon ? (
          <Sun className="w-4 h-4 text-[#F27D26]" />
        ) : (
          <CloudSun className="w-4 h-4 text-indigo-300" />
        );
    }
  };

  return (
    <motion.div
      id="solar-dial-main-assembly"
      className="relative flex items-center justify-center w-full h-full select-none"
      initial={{ rotate: -20, scale: 0.94 }}
      animate={{ rotate: scrubTwist, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 110,
        damping: 17,
        mass: 0.85,
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full max-w-[340px] max-h-[340px] drop-shadow-2xl"
      >
        <defs>
          {/* Gradients for segments */}
          <linearGradient id="daylightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F27D26" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="goldenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F27D26" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="sunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="50%" stopColor="#F27D26" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle dial tick ring from Sophisticated Dark design */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + 18}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
          strokeDasharray="2 6"
        />

        {/* Concentric subtle hairline ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + 10}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
        />

        {/* Sophisticated Dark dashed solar arc accent */}
        <path
          d={describeArc(cx, cy, radius + 10, sunriseAngle, sunsetAngle)}
          fill="none"
          stroke="#F27D26"
          strokeWidth="1.5"
          strokeDasharray="1, 4"
          opacity="0.6"
        />

        {/* Base background ring: Night/Twilight track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#141416"
          strokeWidth={strokeWidth}
        />

        {/* Daylight arc (from sunrise to sunset) */}
        <path
          d={describeArc(cx, cy, radius, sunriseAngle, sunsetAngle)}
          fill="none"
          stroke="url(#daylightGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Morning Golden Hour Arc */}
        {goldenMorning && goldenMorning.endTime && (
          <path
            d={describeArc(
              cx,
              cy,
              radius,
              timeToAngle(goldenMorning.time),
              timeToAngle(goldenMorning.endTime)
            )}
            fill="none"
            stroke="#F27D26"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
          />
        )}

        {/* Evening Golden Hour Arc */}
        {goldenEvening && goldenEvening.endTime && (
          <path
            d={describeArc(
              cx,
              cy,
              radius,
              timeToAngle(goldenEvening.time),
              timeToAngle(goldenEvening.endTime)
            )}
            fill="none"
            stroke="#F27D26"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
          />
        )}

        {/* Morning Blue Hour Arc */}
        {blueMorning && blueMorning.endTime && (
          <path
            d={describeArc(
              cx,
              cy,
              radius,
              timeToAngle(blueMorning.time),
              timeToAngle(blueMorning.endTime)
            )}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Evening Blue Hour Arc */}
        {blueEvening && blueEvening.endTime && (
          <path
            d={describeArc(
              cx,
              cy,
              radius,
              timeToAngle(blueEvening.time),
              timeToAngle(blueEvening.endTime)
            )}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Horizon dashed line (connecting sunrise and sunset points) */}
        <line
          x1={polarToCartesian(cx, cy, radius - 14, sunriseAngle).x}
          y1={polarToCartesian(cx, cy, radius - 14, sunriseAngle).y}
          x2={polarToCartesian(cx, cy, radius - 14, sunsetAngle).x}
          y2={polarToCartesian(cx, cy, radius - 14, sunsetAngle).y}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />

        {/* Cardinal / 12h labels */}
        <text
          x={cx}
          y={cy - radius + 22}
          textAnchor="middle"
          fill="#8A8A93"
          fontSize="9"
          fontWeight="600"
          letterSpacing="1.5"
          className="font-mono"
        >
          12 PM
        </text>
        <text
          x={cx}
          y={cy + radius - 14}
          textAnchor="middle"
          fill="#5A5A63"
          fontSize="9"
          fontWeight="600"
          letterSpacing="1.5"
          className="font-mono"
        >
          12 AM
        </text>

        {/* Sunrise marker badge */}
        <circle
          cx={polarToCartesian(cx, cy, radius, sunriseAngle).x}
          cy={polarToCartesian(cx, cy, radius, sunriseAngle).y}
          r="3.5"
          fill="#FB923C"
        />
        {/* Sunset marker badge */}
        <circle
          cx={polarToCartesian(cx, cy, radius, sunsetAngle).x}
          cy={polarToCartesian(cx, cy, radius, sunsetAngle).y}
          r="3.5"
          fill="#F27D26"
        />

        {/* Rotating Sun Assembly with Smooth Continuous Spring Motion */}
        <motion.g
          id="solar-dial-sun-rotator"
          animate={{ rotate: animatedSunAngle }}
          transition={{
            type: 'spring',
            stiffness: 110,
            damping: 18,
            mass: 0.75,
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Radial Pointer Ray connecting inner track towards Sun */}
          <line
            x1={cx}
            y1={cy - radius + 22}
            x2={cx}
            y2={cy - radius + 7}
            stroke={isSunAboveHorizon ? 'rgba(251,146,60,0.5)' : 'rgba(148,163,184,0.35)'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Sun Aura Glow */}
          <circle
            cx={cx}
            cy={cy - radius}
            r="18"
            fill="url(#sunGlow)"
            filter="url(#glow)"
            opacity={isSunAboveHorizon ? 0.95 : 0.4}
          />

          {/* Micro Celestial Orbital Ring */}
          <circle
            cx={cx}
            cy={cy - radius}
            r="8.5"
            fill="none"
            stroke={isSunAboveHorizon ? '#FB923C' : '#94A3B8'}
            strokeWidth="1"
            opacity="0.6"
            strokeDasharray="2 2"
          />

          {/* Animated Sun Orb */}
          <circle
            cx={cx}
            cy={cy - radius}
            r="6"
            fill={isSunAboveHorizon ? '#FDE047' : '#94A3B8'}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>

      {/* Center Informational Display - Wear OS Circular Touch Focal Area with Sophisticated Dark Styling */}
      <motion.button
        id="wear-center-display-btn"
        onClick={() => onOpenDetail?.(activeEvent)}
        whileTap={{ scale: 0.96 }}
        className="absolute inset-0 m-auto w-[210px] h-[210px] rounded-full flex flex-col items-center justify-between py-5 px-3 text-center cursor-pointer group transition-all z-20 select-none"
        title="Tap to see light details"
      >
        {/* Top small phase / icon chip */}
        <div className="flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
          {renderEventIcon()}
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/70">
            {solarPosition.azimuthCompass} • {Math.round(solarPosition.altitude)}°
          </span>
        </div>

        {/* Hero Phase Name & Countdown */}
        <div className="flex flex-col items-center my-0.5">
          {/* Gradient accent divider line */}
          <div className="w-28 sm:w-36 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent mb-1.5" />
          
          <h1
            className="text-xl sm:text-2xl font-serif italic text-[#F27D26] drop-shadow-[0_2px_12px_rgba(242,125,38,0.35)] line-clamp-1 leading-tight"
            style={{ fontFamily: "Georgia, 'Newsreader', serif" }}
          >
            {activeEvent.name.replace(' (Morning)', '').replace(' (Evening)', '')}
          </h1>

          <p className="text-xs font-light tracking-wide text-white/90 mt-0.5">
            {nowMs < targetDate.getTime() ? `In ${countdownText}` : `Ends in ${countdownText}`}
          </p>
        </div>

        {/* 3-Column Sophisticated Dark Metrics Grid */}
        <div className="w-full grid grid-cols-3 gap-0.5 px-2 py-1 bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/5">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">Blue</span>
            <span className="text-[11px] font-mono text-blue-300">{blueTime}</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">Sunset</span>
            <span className="text-[11px] font-mono text-orange-200">{sunsetTime}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">Last</span>
            <span className="text-[11px] font-mono text-white/60">{lastLightTime}</span>
          </div>
        </div>

        {/* Active Phase Status indicator */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26] animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#F27D26]">Active Phase</span>
        </div>
      </motion.button>
    </motion.div>
  );
};
