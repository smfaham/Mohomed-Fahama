// Web Audio API simulated haptic / mechanical watch tick
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playWatchTick(type: 'tick' | 'tap' | 'alarm' = 'tick') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'tick') {
      // Subtle high-pitch mechanical watch click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.012);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.015);
    } else if (type === 'tap') {
      // Soft haptic feedback
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.035);
    } else if (type === 'alarm') {
      // Dual tone notification chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.23);
    }
  } catch {
    // Ignore audio context errors gracefully if blocked by browser autoplay policy
  }
}

/**
 * Subtle vibration pattern typical of Wear OS devices:
 * Linear Resonant Actuator (LRA) gentle double-pulse (60ms on, 90ms pause, 60ms on).
 * Triggers hardware vibration via navigator.vibrate AND synthesizes an authentic
 * acoustic LRA motor resonance hum via Web Audio API for desktop & sandboxed preview.
 */
export function playWearOSVibration(pattern: 'double-pulse' | 'gentle-buzz' | 'nudge' = 'double-pulse') {
  // 1. Hardware physical vibration if supported on device (mobile Chrome, Wear OS browsers)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      if (pattern === 'double-pulse') {
        navigator.vibrate([60, 90, 60]);
      } else if (pattern === 'gentle-buzz') {
        navigator.vibrate([80, 50, 40]);
      } else {
        navigator.vibrate([50]);
      }
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Synthesized acoustic LRA motor resonance for desktop & iframe environments
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const createLraBurst = (startTime: number, duration: number) => {
      // Primary resonant motor frequency (145 Hz)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, startTime);
      osc.frequency.exponentialRampToValueAtTime(138, startTime + duration);

      // Sub-bass undertone for tactile depth (72 Hz)
      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(72, startTime);

      // Low pass filter to emulate wrist enclosure
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, startTime);

      // Mechanical casing onset micro-transient
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1600, startTime);
      clickGain.gain.setValueAtTime(0.04, startTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.008);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(startTime);
      clickOsc.stop(startTime + 0.01);

      // Pulse volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      subOsc.start(startTime);
      osc.stop(startTime + duration + 0.02);
      subOsc.stop(startTime + duration + 0.02);
    };

    if (pattern === 'double-pulse') {
      // Classic Wear OS notification: 2 gentle pulses separated by 95ms
      createLraBurst(now, 0.065);
      createLraBurst(now + 0.16, 0.065);
    } else if (pattern === 'gentle-buzz') {
      createLraBurst(now, 0.09);
    } else {
      createLraBurst(now, 0.05);
    }
  } catch {
    // Ignore audio context errors gracefully
  }
}

/**
 * Requests browser notification permission if available
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Sends Web API Notification if granted
 */
export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'wearos-sunrise-notification-15m',
      });
    } catch {
      // May be blocked in some sandboxed iframes
    }
  }
}

