import * as SunCalc from 'suncalc';
import { SolarEvent, SolarPosition, MoonInfo, LocationData } from '../types/lumy';

// Register custom angles for blue hour (-6° to -4° below horizon)
try {
  SunCalc.addTime(-6, 'blueHourMorningStart', 'blueHourEveningEnd');
  SunCalc.addTime(-4, 'blueHourMorningEnd', 'blueHourEveningStart');
} catch {
  // Ignore if already registered
}

export const PRESET_LOCATIONS: LocationData[] = [
  { name: 'Cupertino', city: 'Cupertino, CA', country: 'United States', lat: 37.323, lng: -122.032 },
  { name: 'New York', city: 'New York, NY', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'London', city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Paris', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Reykjavik', city: 'Reykjavík', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
  { name: 'Sydney', city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Honolulu', city: 'Honolulu, HI', country: 'United States', lat: 21.3069, lng: -157.8583 },
  { name: 'Cairo', city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Zurich', city: 'Zürich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
];

export function getCompassDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return directions[index];
}

export function calculateSolarPosition(date: Date, lat: number, lng: number): SolarPosition {
  const pos = SunCalc.getPosition(date, lat, lng);
  const altDeg = pos.altitude * (180 / Math.PI);
  // SunCalc azimuth has 0 = South, West is positive.
  // Standard compass: 0 = North, 90 = East, 180 = South, 270 = West
  const compassDeg = ((pos.azimuth * (180 / Math.PI) + 180) % 360 + 360) % 360;
  
  // Shadow length ratio: cotangent of elevation (if sun above horizon)
  let shadow = 99;
  if (altDeg > 0.5) {
    shadow = 1 / Math.tan(pos.altitude);
  }

  return {
    altitude: altDeg,
    azimuth: compassDeg,
    azimuthCompass: getCompassDirection(compassDeg),
    shadowLengthRatio: Math.min(Math.round(shadow * 10) / 10, 25),
  };
}

export function calculateMoonInfo(date: Date, lat: number, lng: number): MoonInfo {
  const moonIllum = SunCalc.getMoonIllumination(date);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);

  const phase = moonIllum.phase;
  let phaseName = 'New Moon';
  let phaseIcon = 'moon';

  if (phase === 0 || phase === 1) {
    phaseName = 'New Moon';
  } else if (phase < 0.25) {
    phaseName = 'Waxing Crescent';
  } else if (Math.abs(phase - 0.25) < 0.03) {
    phaseName = 'First Quarter';
  } else if (phase < 0.5) {
    phaseName = 'Waxing Gibbous';
  } else if (Math.abs(phase - 0.5) < 0.03) {
    phaseName = 'Full Moon';
  } else if (phase < 0.75) {
    phaseName = 'Waning Gibbous';
  } else if (Math.abs(phase - 0.75) < 0.03) {
    phaseName = 'Last Quarter';
  } else {
    phaseName = 'Waning Crescent';
  }

  return {
    fraction: Math.round(moonIllum.fraction * 100) / 100,
    phaseValue: phase,
    phaseName,
    phaseIcon,
    moonrise: moonTimes.rise || null,
    moonset: moonTimes.set || null,
    isAlwaysUp: moonTimes.alwaysUp,
    isAlwaysDown: moonTimes.alwaysDown,
  };
}

export function getDailySolarEvents(date: Date, lat: number, lng: number): SolarEvent[] {
  const times = SunCalc.getTimes(date, lat, lng);

  // Fallbacks if high latitude or polar day/night
  const safeDate = (d: Date | undefined, fallback: Date) => (d && !isNaN(d.getTime()) ? d : fallback);

  const sunrise = safeDate(times.sunrise, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0));
  const sunset = safeDate(times.sunset, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0));
  const solarNoon = safeDate(times.solarNoon, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0));
  const goldenHourMorningEnd = safeDate(times.goldenHourEnd, new Date(sunrise.getTime() + 45 * 60000));
  const goldenHourEveningStart = safeDate(times.goldenHour, new Date(sunset.getTime() - 45 * 60000));
  
  // Blue hours
  const blueHourMorningStart = new Date(sunrise.getTime() - 35 * 60000);
  const blueHourMorningEnd = new Date(sunrise.getTime() - 10 * 60000);
  const blueHourEveningStart = new Date(sunset.getTime() + 10 * 60000);
  const blueHourEveningEnd = new Date(sunset.getTime() + 35 * 60000);

  const dawn = safeDate(times.dawn, new Date(sunrise.getTime() - 30 * 60000));
  const dusk = safeDate(times.dusk, new Date(sunset.getTime() + 30 * 60000));
  const nauticalDawn = safeDate(times.nauticalDawn, new Date(dawn.getTime() - 30 * 60000));
  const nauticalDusk = safeDate(times.nauticalDusk, new Date(dusk.getTime() + 30 * 60000));
  const nightEnd = safeDate(times.nightEnd, new Date(nauticalDawn.getTime() - 30 * 60000));
  const nightStart = safeDate(times.night, new Date(nauticalDusk.getTime() + 30 * 60000));
  const nadir = safeDate(times.nadir, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0));

  const events: SolarEvent[] = [
    {
      id: 'astronomical_dawn',
      name: 'First Light (Astro Dawn)',
      category: 'twilight',
      time: nightEnd,
      description: 'First subtle photons scatter across high atmosphere. Stars remain bright.',
      iconName: 'Sparkles',
      color: '#818CF8',
      badgeBg: 'rgba(129, 140, 248, 0.15)',
      lightTempK: 12000,
      photoTip: 'Ideal for deep sky astrophotography and horizon silhouettes.',
    },
    {
      id: 'nautical_dawn',
      name: 'Nautical Dawn',
      category: 'twilight',
      time: nauticalDawn,
      description: 'Horizon line becomes discernible at sea. Bright navigational stars visible.',
      iconName: 'Compass',
      color: '#60A5FA',
      badgeBg: 'rgba(96, 165, 250, 0.15)',
      lightTempK: 10000,
      photoTip: 'Long exposure seascape shots with deep saturated cobalt blues.',
    },
    {
      id: 'blue_hour_morning',
      name: 'Morning Blue Hour',
      category: 'blue',
      time: blueHourMorningStart,
      endTime: blueHourMorningEnd,
      description: 'Ethereal, saturated indigo sky with gentle diffused contrast.',
      iconName: 'Moon',
      color: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.2)',
      lightTempK: 8500,
      photoTip: 'Use a tripod for cityscapes; streetlights balance with deep blue skies.',
    },
    {
      id: 'civil_dawn',
      name: 'Civil Dawn',
      category: 'twilight',
      time: dawn,
      description: 'Sun is 6° below horizon. Terrestrial objects clearly visible without lamps.',
      iconName: 'Sunrise',
      color: '#F472B6',
      badgeBg: 'rgba(244, 114, 182, 0.15)',
      lightTempK: 6500,
      photoTip: 'Gentle pastel pinks and purples in the eastern sky.',
    },
    {
      id: 'sunrise',
      name: 'Sunrise',
      category: 'sun',
      time: sunrise,
      description: 'Upper solar limb breaks the theoretical horizon.',
      iconName: 'Sun',
      color: '#FB923C',
      badgeBg: 'rgba(251, 146, 60, 0.2)',
      lightTempK: 2500,
      photoTip: 'High contrast; look for mist, long dramatic shadows and rim lighting.',
    },
    {
      id: 'golden_hour_morning',
      name: 'Morning Golden Hour',
      category: 'golden',
      time: sunrise,
      endTime: goldenHourMorningEnd,
      description: 'Soft, golden, warm directional light with flattering diffused shadows.',
      iconName: 'Flame',
      color: '#FBBF24',
      badgeBg: 'rgba(251, 191, 36, 0.22)',
      lightTempK: 3500,
      photoTip: 'Prime time for portraits, landscapes, and architectural textures.',
    },
    {
      id: 'solar_noon',
      name: 'Solar Noon',
      category: 'sun',
      time: solarNoon,
      description: 'Sun culminates at its highest point in the sky for today.',
      iconName: 'SunMedium',
      color: '#FDE047',
      badgeBg: 'rgba(253, 224, 71, 0.15)',
      lightTempK: 5500,
      photoTip: 'Harsh overhead shadows; great for high-contrast B&W or architectural geometry.',
    },
    {
      id: 'golden_hour_evening',
      name: 'Evening Golden Hour',
      category: 'golden',
      time: goldenHourEveningStart,
      endTime: sunset,
      description: 'Rich amber light, long warm cast shadows, peak photographic warmth.',
      iconName: 'Flame',
      color: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.25)',
      lightTempK: 3200,
      photoTip: 'Warm flares, backlit hair, rim highlights, and golden landscape vistas.',
    },
    {
      id: 'sunset',
      name: 'Sunset',
      category: 'sun',
      time: sunset,
      description: 'Sun limb dips entirely below the horizon line.',
      iconName: 'Sunset',
      color: '#EA580C',
      badgeBg: 'rgba(234, 88, 12, 0.2)',
      lightTempK: 2200,
      photoTip: 'Vibrant gradients from orange to magenta along the horizon.',
    },
    {
      id: 'civil_dusk',
      name: 'Civil Dusk',
      category: 'twilight',
      time: dusk,
      description: 'Warm afterglow fades into dusk. City lights begin to illuminate.',
      iconName: 'CloudSun',
      color: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.15)',
      lightTempK: 7000,
      photoTip: 'Belt of Venus visible opposite the sunset with serene pink hues.',
    },
    {
      id: 'blue_hour_evening',
      name: 'Evening Blue Hour',
      category: 'blue',
      time: blueHourEveningStart,
      endTime: blueHourEveningEnd,
      description: 'Intense cobalt twilight as indirect rays disperse through upper ozone.',
      iconName: 'Moon',
      color: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.22)',
      lightTempK: 8500,
      photoTip: 'Perfect balance between building interior lighting and ambient sky.',
    },
    {
      id: 'nautical_dusk',
      name: 'Nautical Dusk',
      category: 'twilight',
      time: nauticalDusk,
      description: 'Sea horizon disappears. Major stars emerge in the dark blue canopy.',
      iconName: 'Compass',
      color: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      lightTempK: 10500,
      photoTip: 'City skylines and vehicle light trails with deep navy sky.',
    },
    {
      id: 'night_start',
      name: 'Astronomical Night',
      category: 'night',
      time: nightStart,
      description: 'Sky is completely dark. No residual solar scattering remains.',
      iconName: 'Sparkles',
      color: '#A855F7',
      badgeBg: 'rgba(168, 85, 247, 0.15)',
      lightTempK: 15000,
      photoTip: 'Milky Way photography, starry skies, and aurora viewing.',
    },
    {
      id: 'nadir',
      name: 'Solar Midnight (Nadir)',
      category: 'night',
      time: nadir,
      description: 'Sun reaches its lowest point directly on the opposite side of Earth.',
      iconName: 'CircleDot',
      color: '#9333EA',
      badgeBg: 'rgba(147, 51, 234, 0.15)',
      lightTempK: 18000,
      photoTip: 'Peak darkness for long star trail exposures and deep sky telescopes.',
    }
  ];

  // Sort chronologically
  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

export function getCurrentAndNextPhase(events: SolarEvent[], now: Date) {
  const nowMs = now.getTime();

  // Determine current active event
  let currentEvent = events[0];
  let nextEvent = events[1] || events[0];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const evStart = ev.time.getTime();
    const evEnd = ev.endTime ? ev.endTime.getTime() : (events[i + 1] ? events[i + 1].time.getTime() : evStart + 60 * 60000);

    if (nowMs >= evStart && nowMs < evEnd) {
      currentEvent = ev;
      nextEvent = events[i + 1] || events[0];
      break;
    } else if (nowMs < evStart) {
      nextEvent = ev;
      currentEvent = events[i - 1] || events[events.length - 1];
      break;
    }
  }

  // Calculate time diff to next event
  const targetTime = nextEvent.time.getTime() > nowMs ? nextEvent.time : (currentEvent.endTime && currentEvent.endTime.getTime() > nowMs ? currentEvent.endTime : nextEvent.time);
  const diffMs = Math.max(0, targetTime.getTime() - nowMs);
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;

  let countdownStr = '';
  if (diffHours > 0) {
    countdownStr = `${diffHours}h ${remMinutes}m`;
  } else {
    countdownStr = `${diffMinutes}m`;
  }

  return {
    current: currentEvent,
    next: nextEvent,
    countdownStr,
    diffMinutes,
  };
}

export function formatWatchTime(date: Date, includeSeconds = false): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

export function formatDuration(diffMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export interface NextSunriseInfo {
  sunriseTime: Date | null;
  isTomorrow: boolean;
  civilDawnTime: Date | null;
  diffMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  countdownShort: string;
  countdownDigital: string;
  progressPct: number;
  isPolar: boolean;
}

export function calculateNextSunrise(
  now: Date,
  lat: number,
  lng: number,
  todayEvents?: SolarEvent[]
): NextSunriseInfo {
  const nowMs = now.getTime();
  const todaySunriseEv = todayEvents?.find((e) => e.id === 'sunrise');
  const todayTimes = SunCalc.getTimes(now, lat, lng);
  const todaySunrise = todaySunriseEv ? todaySunriseEv.time : todayTimes.sunrise;

  let sunriseTime: Date | null = null;
  let civilDawnTime: Date | null = null;
  let isTomorrow = false;
  let isPolar = false;

  if (todaySunrise && !isNaN(todaySunrise.getTime()) && nowMs < todaySunrise.getTime()) {
    // Sunrise is later today
    sunriseTime = todaySunrise;
    isTomorrow = false;
    const todayDawnEv = todayEvents?.find((e) => e.id === 'civil_dawn');
    civilDawnTime = todayDawnEv ? todayDawnEv.time : todayTimes.dawn;
  } else {
    // Today's sunrise has passed or today has no sunrise; check tomorrow
    isTomorrow = true;
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
    const tomorrowTimes = SunCalc.getTimes(tomorrow, lat, lng);
    if (tomorrowTimes.sunrise && !isNaN(tomorrowTimes.sunrise.getTime())) {
      sunriseTime = tomorrowTimes.sunrise;
      civilDawnTime = tomorrowTimes.dawn;
    } else {
      isPolar = true;
    }
  }

  if (!sunriseTime || isNaN(sunriseTime.getTime())) {
    return {
      sunriseTime: null,
      isTomorrow: false,
      civilDawnTime: null,
      diffMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      countdownShort: '--:--',
      countdownDigital: '--:--:--',
      progressPct: 0,
      isPolar: true,
    };
  }

  const diffMs = Math.max(0, sunriseTime.getTime() - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const countdownShort = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const countdownDigital = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  // Progress calculation: Estimate from prior sunset to upcoming sunrise (approx 12h night)
  // or clamp 24-hour cycle
  const nightSpan = 12 * 3600 * 1000;
  const elapsedInNight = Math.max(0, nightSpan - diffMs);
  const progressPct = Math.min(100, Math.max(0, Math.round((elapsedInNight / nightSpan) * 100)));

  return {
    sunriseTime,
    isTomorrow,
    civilDawnTime,
    diffMs,
    hours,
    minutes,
    seconds,
    countdownShort,
    countdownDigital,
    progressPct,
    isPolar,
  };
}
