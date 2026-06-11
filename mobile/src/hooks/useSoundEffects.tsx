/**
 * Sound effects hook.
 *
 * The web app generates short sine-wave "earcons" on the fly via the Web
 * Audio API, which has no direct React Native equivalent. This keeps the
 * same API surface as a no-op so consuming components compile and behave
 * correctly; wire this up to bundled audio assets + expo-audio when sound
 * design assets are available.
 */

type SoundType = 'tap' | 'select' | 'success' | 'open' | 'close';

const playSound = (_type: SoundType = 'tap') => {
  // no-op for now
};

export const useSoundEffects = () => {
  return {
    tap: () => playSound('tap'),
    select: () => playSound('select'),
    success: () => playSound('success'),
    open: () => playSound('open'),
    close: () => playSound('close'),
    play: playSound,
    setEnabled: (_enabled: boolean) => {},
  };
};
