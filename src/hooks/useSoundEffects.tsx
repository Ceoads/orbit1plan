/**
 * Apple-style minimalistic sound effects (earcons)
 * Uses Web Audio API for precise, short sine wave sounds
 */

import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'tap' | 'select' | 'success' | 'open' | 'close';

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabled = useRef(true);

  useEffect(() => {
    // Cleanup audio context on unmount
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType = 'tap') => {
    if (!isEnabled.current) return;

    try {
      const ctx = getAudioContext();
      
      // Sound configurations - minimalistic sine wave pings
      const configs: Record<SoundType, { frequency: number; duration: number; volume: number; type: OscillatorType }> = {
        // Ultra-short high tap for micro-interactions
        tap: { frequency: 1200, duration: 0.04, volume: 0.08, type: 'sine' },
        // Slightly longer for selections
        select: { frequency: 880, duration: 0.06, volume: 0.1, type: 'sine' },
        // Pleasant double-ping for success
        success: { frequency: 1400, duration: 0.08, volume: 0.12, type: 'sine' },
        // Soft rising tone for opening
        open: { frequency: 600, duration: 0.1, volume: 0.08, type: 'sine' },
        // Soft falling tone for closing
        close: { frequency: 500, duration: 0.08, volume: 0.06, type: 'sine' },
      };

      const config = configs[type];
      const now = ctx.currentTime;

      // Create oscillator
      const oscillator = ctx.createOscillator();
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);

      // Create gain node for volume control and fade
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + config.duration);

      // For success, add a second ping
      if (type === 'success') {
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1800, now + 0.08);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(config.volume, now + 0.085);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.16);
      }
    } catch {
      // Fail silently - sounds are enhancement only
    }
  }, [getAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabled.current = enabled;
  }, []);

  return {
    tap: () => playSound('tap'),
    select: () => playSound('select'),
    success: () => playSound('success'),
    open: () => playSound('open'),
    close: () => playSound('close'),
    play: playSound,
    setEnabled,
  };
};
