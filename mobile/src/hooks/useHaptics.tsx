/**
 * Apple HIG-compliant haptic feedback hook.
 * Native port of the web app's useHaptics, backed by expo-haptics.
 */
import * as Haptics from 'expo-haptics';

type HapticType = 'selection' | 'soft' | 'success' | 'warning' | 'error';

const triggerHaptic = (type: HapticType = 'selection') => {
  switch (type) {
    case 'selection':
      Haptics.selectionAsync();
      break;
    case 'soft':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
};

export const useHaptics = () => {
  return {
    selection: () => triggerHaptic('selection'),
    soft: () => triggerHaptic('soft'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    trigger: triggerHaptic,
  };
};
