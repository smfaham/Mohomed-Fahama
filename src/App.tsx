import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LocationData,
  SolarEvent,
  WearOSTile,
  SunriseAlertNotification,
  WatchFaceWidgetType,
} from './types/lumy';
import {
  PRESET_LOCATIONS,
  getDailySolarEvents,
  calculateSolarPosition,
  calculateMoonInfo,
  getCurrentAndNextPhase,
  calculateNextSunrise,
} from './utils/solarCalculator';
import { playWatchTick, playWearOSVibration, sendBrowserNotification } from './utils/haptics';

import { WatchFrame } from './components/WatchFrame';
import { WearOSStatusBar } from './components/WearOSStatusBar';
import { MainDialTile } from './components/tiles/MainDialTile';
import { GoldenHourTile } from './components/tiles/GoldenHourTile';
import { TimelineTile } from './components/tiles/TimelineTile';
import { MoonTile } from './components/tiles/MoonTile';
import { SunCompassTile } from './components/tiles/SunCompassTile';

import { EventDetailModal } from './components/EventDetailModal';
import { TimeScrubberModal } from './components/TimeScrubberModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { AmbientAODView } from './components/AmbientAODView';
import { WearOSNotificationCard } from './components/WearOSNotificationCard';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { WatchFaceWidgetOptionsModal } from './components/WatchFaceWidgetOptionsModal';

const TILES_LIST: WearOSTile[] = ['dial', 'golden_hour', 'timeline', 'moon', 'compass'];

export default function App() {
  // Current time state
  const [realTime, setRealTime] = useState<Date>(new Date());
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);
  const [targetDate, setTargetDate] = useState<Date>(new Date());

  // Location state (default to Cupertino)
  const [location, setLocation] = useState<LocationData>(PRESET_LOCATIONS[0]);

  // Wear OS UI state
  const [activeTile, setActiveTile] = useState<WearOSTile>('dial');
  const [isAOD, setIsAOD] = useState<boolean>(false);
  const [showCase, setShowCase] = useState<boolean>(true);

  // Modals & Notifications
  const [selectedEvent, setSelectedEvent] = useState<SolarEvent | null>(null);
  const [showScrubber, setShowScrubber] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState<boolean>(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState<boolean>(false);

  // Watch Face Widget Option state (with persistence)
  const [activeWidgetOption, setActiveWidgetOption] = useState<WatchFaceWidgetType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumy_watchface_widget');
      if (
        saved &&
        ['solar_spectrum', 'sunrise', 'golden_hour', 'daylight', 'solar_noon', 'moon_phase', 'none'].includes(saved)
      ) {
        return saved as WatchFaceWidgetType;
      }
    }
    return 'solar_spectrum'; // Default to the iconic Lumy Solar Spectrum widget
  });

  // 15-minute Sunrise Local Notification system state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumy_sunrise_notifications');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [activeNotification, setActiveNotification] = useState<SunriseAlertNotification | null>(null);
  const lastAlertSunriseRef = useRef<number | null>(null);
  const snoozeUntilRef = useRef<number | null>(null);

  // Touch gesture state for swipeable tiles on watch face
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effective time being rendered
  const effectiveTime = useMemo(() => {
    if (simulatedTime) {
      const d = new Date(targetDate);
      d.setHours(
        simulatedTime.getHours(),
        simulatedTime.getMinutes(),
        simulatedTime.getSeconds(),
        0
      );
      return d;
    }
    const d = new Date(targetDate);
    d.setHours(
      realTime.getHours(),
      realTime.getMinutes(),
      realTime.getSeconds(),
      0
    );
    return d;
  }, [realTime, simulatedTime, targetDate]);

  // Compute astronomical solar & lunar data
  const events = useMemo(() => {
    return getDailySolarEvents(effectiveTime, location.lat, location.lng);
  }, [effectiveTime, location.lat, location.lng]);

  const solarPosition = useMemo(() => {
    return calculateSolarPosition(effectiveTime, location.lat, location.lng);
  }, [effectiveTime, location.lat, location.lng]);

  const moonInfo = useMemo(() => {
    return calculateMoonInfo(effectiveTime, location.lat, location.lng);
  }, [effectiveTime, location.lat, location.lng]);

  const phaseStatus = useMemo(() => {
    return getCurrentAndNextPhase(events, effectiveTime);
  }, [events, effectiveTime]);

  // Upcoming sunrise countdown info
  const nextSunriseInfo = useMemo(() => {
    return calculateNextSunrise(effectiveTime, location.lat, location.lng, events);
  }, [effectiveTime, location.lat, location.lng, events]);

  // Local notification trigger: 15 minutes before the next sunrise event
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (nextSunriseInfo.isPolar || !nextSunriseInfo.sunriseTime) return;

    const diffMs = nextSunriseInfo.diffMs;
    const sunriseTimestamp = nextSunriseInfo.sunriseTime.getTime();

    // Trigger window: exactly 15 minutes or less remaining until sunrise (15 min = 900,000 ms) and not in the past (> 0)
    const isWithin15Minutes = diffMs <= 15 * 60 * 1000 && diffMs > 0;
    const hasFiredForThisSunrise = lastAlertSunriseRef.current === sunriseTimestamp;
    const isSnoozed = snoozeUntilRef.current ? Date.now() < snoozeUntilRef.current : false;

    if (isWithin15Minutes && !hasFiredForThisSunrise && !isSnoozed) {
      lastAlertSunriseRef.current = sunriseTimestamp;

      // 1. Wear OS subtle vibration pattern (LRA double-pulse + hardware vibrate)
      playWearOSVibration('double-pulse');

      const sunriseFormatted = nextSunriseInfo.sunriseTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // 2. Web API system notification if granted
      sendBrowserNotification(
        'Sunrise in 15 Minutes',
        `Sunrise occurs at ${sunriseFormatted}. Morning blue hour light is now emerging.`
      );

      // 3. Wear OS Heads-Up Notification Card
      setActiveNotification({
        id: `sunrise-alert-${sunriseTimestamp}`,
        title: 'Sunrise in 15 Minutes',
        message: `Morning blue hour has begun. Sunrise is in 15 minutes at ${sunriseFormatted}.`,
        sunriseTime: nextSunriseInfo.sunriseTime,
        diffMinutes: Math.max(1, Math.round(diffMs / 60000)),
        isTest: false,
        timestamp: new Date(),
      });
    }
  }, [effectiveTime, nextSunriseInfo, notificationsEnabled]);

  // Auto-dismiss active notification after 9 seconds if not interacted
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  // Immediate Test Trigger for user testing
  const handleTriggerTestNotification = () => {
    playWearOSVibration('double-pulse');
    const targetSunrise = nextSunriseInfo.sunriseTime || new Date(Date.now() + 15 * 60 * 1000);
    const sunriseFormatted = targetSunrise.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    sendBrowserNotification(
      'Sunrise in 15 Minutes (Wear OS Test)',
      `Subtle dual-pulse vibration triggered for upcoming ${sunriseFormatted} sunrise.`
    );

    setActiveNotification({
      id: `test-sunrise-alert-${Date.now()}`,
      title: 'Sunrise in 15 Minutes',
      message: `Wear OS subtle vibration triggered. Sunrise scheduled at ${sunriseFormatted}.`,
      sunriseTime: targetSunrise,
      diffMinutes: 15,
      isTest: true,
      timestamp: new Date(),
    });
  };

  // Crown rotation handler
  const handleCrownRotate = (direction: 'up' | 'down') => {
    playWatchTick('tick');
    // If scrubber modal is active, rotating crown scrubs the solar time directly
    if (showScrubber) {
      const base = simulatedTime ? new Date(simulatedTime) : new Date(effectiveTime);
      const deltaMinutes = direction === 'down' ? 15 : -15;
      base.setMinutes(base.getMinutes() + deltaMinutes);
      setSimulatedTime(base);
      return;
    }

    const currentIdx = TILES_LIST.indexOf(activeTile);
    if (direction === 'down') {
      const next = (currentIdx + 1) % TILES_LIST.length;
      setActiveTile(TILES_LIST[next]);
    } else {
      const prev = (currentIdx - 1 + TILES_LIST.length) % TILES_LIST.length;
      setActiveTile(TILES_LIST[prev]);
    }
  };

  // Crown click handler (wake up or close modals / back to main dial)
  const handleCrownClick = () => {
    if (activeNotification) {
      setActiveNotification(null);
      return;
    }
    if (showNotificationSettings) {
      setShowNotificationSettings(false);
      return;
    }
    if (showWidgetPicker) {
      setShowWidgetPicker(false);
      return;
    }
    if (isAOD) {
      setIsAOD(false);
      return;
    }
    if (selectedEvent) {
      setSelectedEvent(null);
      return;
    }
    if (showScrubber) {
      setShowScrubber(false);
      return;
    }
    if (showLocationPicker) {
      setShowLocationPicker(false);
      return;
    }
    // If not on dial, return to dial
    if (activeTile !== 'dial') {
      setActiveTile('dial');
    }
  };

  // Swipe gesture handlers on watch display
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (Math.abs(diffX) > minSwipeDistance) {
      const currentIdx = TILES_LIST.indexOf(activeTile);
      if (diffX > 0) {
        // Swiped left -> next tile
        const next = (currentIdx + 1) % TILES_LIST.length;
        playWatchTick('tick');
        setActiveTile(TILES_LIST[next]);
      } else {
        // Swiped right -> prev tile
        const prev = (currentIdx - 1 + TILES_LIST.length) % TILES_LIST.length;
        playWatchTick('tick');
        setActiveTile(TILES_LIST[prev]);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Top Notification banner if in simulation mode */}
      {simulatedTime && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Simulating time at{' '}
              <strong>
                {effectiveTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>
          <button
            onClick={() => {
              playWatchTick('tap');
              setSimulatedTime(null);
            }}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-semibold"
          >
            Reset to Real-Time
          </button>
        </div>
      )}

      {/* Main Watch Frame & Content */}
      <WatchFrame
        activeTile={activeTile}
        onTileChange={setActiveTile}
        onCrownClick={handleCrownClick}
        onCrownRotate={handleCrownRotate}
        showCase={showCase}
        onToggleCase={() => setShowCase(!showCase)}
        activeWidgetOption={activeWidgetOption}
        onOpenWidgetPicker={() => {
          playWatchTick('tap');
          setShowWidgetPicker(true);
        }}
      >
        {/* Watch Face Container */}
        <div
          className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-950 select-none touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Status Bar (Battery, Location, AOD toggle, Sunrise Alert) */}
          <WearOSStatusBar
            currentDate={effectiveTime}
            location={location}
            batteryLevel={88}
            notificationsEnabled={notificationsEnabled}
            onToggleAOD={() => {
              playWatchTick('tap');
              setIsAOD(!isAOD);
            }}
            onOpenLocation={() => {
              playWatchTick('tap');
              setShowLocationPicker(true);
            }}
            onOpenNotifications={() => {
              playWatchTick('tap');
              setShowNotificationSettings(true);
            }}
          />

          {/* Active Wear OS Tile View */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTile === 'dial' && (
                <motion.div
                  key="dial"
                  initial={{ opacity: 0, scale: 0.94, rotate: -22 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.04, rotate: 18 }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 18,
                    mass: 0.85,
                  }}
                  className="w-full h-full"
                >
                  <MainDialTile
                    currentDate={effectiveTime}
                    location={location}
                    events={events}
                    solarPosition={solarPosition}
                    notificationsEnabled={notificationsEnabled}
                    activeWidgetOption={activeWidgetOption}
                    onSelectWidgetOption={(widget) => {
                      setActiveWidgetOption(widget);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('lumy_watchface_widget', widget);
                      }
                    }}
                    onOpenWidgetPicker={() => {
                      playWatchTick('tap');
                      setShowWidgetPicker(true);
                    }}
                    onOpenDetail={(ev) => {
                      playWatchTick('tap');
                      setSelectedEvent(ev);
                    }}
                    onOpenScrubber={() => {
                      playWatchTick('tap');
                      setShowScrubber(true);
                    }}
                    onOpenTimeline={() => {
                      playWatchTick('tap');
                      setActiveTile('timeline');
                    }}
                    onOpenNotifications={() => {
                      playWatchTick('tap');
                      setShowNotificationSettings(true);
                    }}
                    onTestNotification={handleTriggerTestNotification}
                    onNavigateTile={(tileId) => {
                      setActiveTile(tileId as WearOSTile);
                    }}
                  />
                </motion.div>
              )}

              {activeTile === 'golden_hour' && (
                <motion.div
                  key="golden_hour"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full"
                >
                  <GoldenHourTile
                    currentDate={effectiveTime}
                    events={events}
                    onSelectEvent={(ev) => {
                      playWatchTick('tap');
                      setSelectedEvent(ev);
                    }}
                  />
                </motion.div>
              )}

              {activeTile === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full"
                >
                  <TimelineTile
                    currentDate={effectiveTime}
                    events={events}
                    onSelectEvent={(ev) => {
                      playWatchTick('tap');
                      setSelectedEvent(ev);
                    }}
                  />
                </motion.div>
              )}

              {activeTile === 'moon' && (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full"
                >
                  <MoonTile moonInfo={moonInfo} />
                </motion.div>
              )}

              {activeTile === 'compass' && (
                <motion.div
                  key="compass"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full"
                >
                  <SunCompassTile solarPosition={solarPosition} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wear OS Heads-Up Notification Card (Sunrise in 15 Minutes) */}
          <AnimatePresence>
            {activeNotification && (
              <WearOSNotificationCard
                notification={activeNotification}
                sunriseEvent={events.find((e) => e.id === 'sunrise')}
                onDismiss={() => setActiveNotification(null)}
                onSnooze={(mins) => {
                  snoozeUntilRef.current = Date.now() + mins * 60000;
                  setActiveNotification(null);
                }}
                onViewEvent={(ev) => {
                  setSelectedEvent(ev);
                  setActiveNotification(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Modal: Event Detail */}
          {selectedEvent && (
            <EventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}

          {/* Modal: Watch Face Widget Complication Picker */}
          {showWidgetPicker && (
            <WatchFaceWidgetOptionsModal
              currentWidget={activeWidgetOption}
              onSelectWidget={(w) => {
                setActiveWidgetOption(w);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('lumy_watchface_widget', w);
                }
              }}
              onClose={() => setShowWidgetPicker(false)}
            />
          )}

          {/* Modal: Notification Settings */}
          {showNotificationSettings && (
            <NotificationSettingsModal
              notificationsEnabled={notificationsEnabled}
              onToggleEnabled={() => {
                setNotificationsEnabled((prev) => {
                  const nextVal = !prev;
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('lumy_sunrise_notifications', String(nextVal));
                  }
                  return nextVal;
                });
              }}
              onTriggerTestNotification={handleTriggerTestNotification}
              nextSunriseTime={nextSunriseInfo.sunriseTime}
              onClose={() => setShowNotificationSettings(false)}
            />
          )}

          {/* Modal: Time Scrubber */}
          {showScrubber && (
            <TimeScrubberModal
              currentDate={effectiveTime}
              isSimulating={simulatedTime !== null}
              events={events}
              onTimeChange={(newDate) => {
                setSimulatedTime(newDate);
              }}
              onResetTime={() => {
                setSimulatedTime(null);
              }}
              onClose={() => setShowScrubber(false)}
            />
          )}

          {/* Modal: Location Picker */}
          {showLocationPicker && (
            <LocationPickerModal
              currentLocation={location}
              onSelectLocation={(loc) => setLocation(loc)}
              onClose={() => setShowLocationPicker(false)}
            />
          )}

          {/* Wear OS Always-On Display (Ambient OLED Mode) */}
          {isAOD && (
            <AmbientAODView
              currentDate={effectiveTime}
              solarPosition={solarPosition}
              nextEvent={phaseStatus.next}
              countdownText={phaseStatus.countdownStr}
              onWake={() => setIsAOD(false)}
            />
          )}
        </div>
      </WatchFrame>

      {/* Subtle feature footer */}
      <div className="w-full py-2 text-center text-[11px] text-neutral-500 font-mono">
        Brivo for Wear OS • Solar & Lunar Companion for Smartwatches
      </div>
    </div>
  );
}
