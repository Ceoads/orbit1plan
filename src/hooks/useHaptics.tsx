/**
 * Apple HIG-compliant haptic feedback hook
 * Uses specific UI Impact styles for different interaction types
 */

type HapticType = 'selection' | 'soft' | 'success' | 'warning' | 'error';

export const useHaptics = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const triggerHaptic = (type: HapticType = 'selection') => {
    if (!isSupported) return;

    // Light, barely-perceptible patterns matching Apple's haptic styles
    const patterns: Record<HapticType, number | number[]> = {
      // Selection: Ultra-light tap for scrolling/switching tabs
      selection: 10,
      // Soft: Gentle impact for modal opens, pocket space expansion
      soft: 15,
      // Success: Distinct double-tap for task completion
      success: [12, 50, 12],
      // Warning: Slightly stronger for alerts
      warning: [15, 30, 10],
      // Error: Sharp feedback for errors
      error: [20, 40, 20, 40, 20],
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Fail silently - haptics are enhancement, not essential
    }
  };

  return {
    isSupported,
    selection: () => triggerHaptic('selection'),
    soft: () => triggerHaptic('soft'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    trigger: triggerHaptic,
  };
};
