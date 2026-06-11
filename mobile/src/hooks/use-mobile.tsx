import { useWindowDimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

/**
 * On native platforms this is effectively always `true` (phones), but it
 * mirrors the web app's hook so shared logic can branch on screen width
 * (useful on tablets and the web build of this Expo app).
 */
export function useIsMobile() {
  const { width } = useWindowDimensions();
  return width < MOBILE_BREAKPOINT;
}
