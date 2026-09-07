export type SolarPhaseType =
  | 'night'
  | 'astronomical_twilight'
  | 'nautical_twilight'
  | 'blue_hour_morning'
  | 'civil_twilight_morning'
  | 'sunrise'
  | 'golden_hour_morning'
  | 'day'
  | 'solar_noon'
  | 'golden_hour_evening'
  | 'sunset'
  | 'blue_hour_evening'
  | 'civil_twilight_evening'
  | 'nautical_twilight_evening'
  | 'astronomical_twilight_evening';

export interface SolarEvent {
  id: string;
  name: string;
  category: 'golden' | 'blue' | 'sun' | 'twilight' | 'night';
  time: Date;
  endTime?: Date;
  description: string;
  iconName: string;
  color: string;
  badgeBg: string;
  lightTempK?: number;
  photoTip?: string;
  isPast?: boolean;
  isCurrent?: boolean;
}

export interface SolarPosition {
  altitude: number; // in degrees (-90 to +90)
  azimuth: number;  // in degrees (0 = South in suncalc, or converted to North-based 0-360)
  azimuthCompass: string; // e.g. "SW", "ENE"
  shadowLengthRatio: number; // tan(90 - alt)
}

export interface MoonInfo {
  fraction: number; // 0 to 1
  phaseValue: number; // 0 to 1 (0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter)
  phaseName: string;
  phaseIcon: string;
  moonrise: Date | null;
  moonset: Date | null;
  isAlwaysUp?: boolean;
  isAlwaysDown?: boolean;
}

export interface LocationData {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone?: string;
}

export type WearOSTile = 'dial' | 'golden_hour' | 'timeline' | 'moon' | 'compass';

export type WatchFaceWidgetType =
  | 'solar_spectrum' // Lumy Solar Spectrum (Orange -> Yellow -> Green -> Blue dial arc)
  | 'sunrise'        // Sunrise countdown & blue hour
  | 'golden_hour'    // Golden hour countdown & photography window
  | 'daylight'       // Daylight elapsed / remaining progress gauge
  | 'solar_noon'     // Solar noon zenith & elevation peak
  | 'moon_phase'     // Lunar phase & illumination %
  | 'none';          // Clean dial (no secondary widget)

export interface SunriseAlertNotification {
  id: string;
  title: string;
  message: string;
  sunriseTime: Date;
  diffMinutes: number;
  isTest?: boolean;
  timestamp: Date;
}
