# Web → React Native migration status

Tracking the folder-by-folder port of `/src` (Vite + React + Tailwind +
shadcn/ui) to `/mobile/src` (Expo + expo-router + NativeWind).

Legend: ✅ done · 🚧 in progress / partial · ⬜ not started

## Foundation (this batch)

- ✅ Project scaffold: Expo SDK 56, expo-router, NativeWind v4 configured
  with the same color tokens as `src/index.css` (`mobile/src/global.css`,
  `mobile/tailwind.config.js`)
- ✅ Navigation shell: tab navigator (Pulse/Vault/Tasks/Exams/Lab) + stack
  screens for landing/auth/reset-password/settings/course/study, with
  auth-gated redirects (`mobile/src/app/_layout.tsx`)
- ✅ `src/lib` → `mobile/src/lib`
  - `utils.ts`, `dateFormat.ts`, `sanitize.ts`, `courseColors.ts`,
    `eventFilter.ts` ported as-is (pure logic)
  - `courseNavigation.ts` adapted to return expo-router route objects
    instead of URL strings
  - new `types.ts` holding the `Subject`/`CalendarEvent`/`Note`/`Task`
    interfaces (previously defined inside `useOrbitData.tsx`)
- ✅ `src/integrations/supabase` → `mobile/src/lib/supabase`
  - `client.ts` rewritten for AsyncStorage + `EXPO_PUBLIC_` env vars
  - `types.ts` copied as-is (generated DB types)
- ✅ `src/i18n` → `mobile/src/i18n` (same `fr`/`en` resources, AsyncStorage +
  expo-localization instead of browser language detector)
- 🚧 `src/hooks` → `mobile/src/hooks` — only the subset needed for the
  navigation shell so far:
  - `useAuth.tsx` ported (simplified — dropped the web-only
    "session-only" sessionStorage logic)
  - `useHaptics.tsx` ported to `expo-haptics`
  - `useSoundEffects.tsx` ported as a no-op stub (Web Audio API has no RN
    equivalent; needs real audio assets + `expo-audio` later)
  - `use-mobile.tsx` ported to `useWindowDimensions`
  - **Not yet ported**: `useOrbitData.tsx`, `useVaultData.tsx`,
    `useTimelineTasks.tsx`, `useGeolocation.tsx`, `useScrollDirection.tsx`
    (window.scroll-based, needs RN ScrollView rethink), `useSmartBack.tsx`
    (needs expo-router's `router.back()`/`canGoBack()`), `use-toast.ts`
- 🚧 `src/components/ui` — only `button.tsx` and a new `input.tsx` /
  `screen-placeholder.tsx` ported so far. The other ~45 shadcn/ui
  components (dialog, sheet, tabs, accordion, calendar, etc.) are
  **not yet ported** — most are Radix-based and need RN equivalents
  (e.g. `react-native-modal`, `@gorhom/bottom-sheet`, custom tab bars).
- ⬜ `src/components` (BottomNav, GlassCard, modals/, vault/, calendar/,
  timeline/, dashboard/, onboarding/, study-hub/, demo/, etc.) — not
  started
- ⬜ `src/pages` → `mobile/src/app` screens — only placeholder screens
  exist for Pulse/Vault/Tasks/Exams/Lab/Landing/Auth/ResetPassword/
  Settings/CourseHub/StudyHub. Real UI/data-wiring not started.
- ⬜ `src/lib/mockData.ts` — not ported (only used by demo/onboarding)
- ⬜ Toast notifications (`sonner` / `components/ui/toast.tsx`,
  `toaster.tsx`, `sonner.tsx`) — needs an RN toast library
  (e.g. `react-native-toast-message`)
- ⬜ Camera / QR (`QRCodeScanner.tsx`) — port to `expo-camera`
- ⬜ PDF viewing (`study-hub/PdfPagesViewer.tsx`, `react-pdf`,
  `pdfjs-dist`) — needs an RN PDF library (e.g. `react-native-pdf`)
- ⬜ Geolocation (`useGeolocation.tsx`) — port to `expo-location`
- ⬜ Animations (`framer-motion` heavily used) — port to
  `react-native-reanimated` (already installed)
- ⬜ Fonts (Quicksand / Inter / Space Grotesk loaded via Google Fonts
  `@import` in `index.css`) — need to bundle via `@expo-google-fonts/*`
  and `expo-font`

## Suggested next steps (in rough priority order)

1. Port `useOrbitData`, `useVaultData`, `useTimelineTasks` (data layer —
   unblocks real screens)
2. Port core UI primitives used everywhere: `card.tsx`, `dialog.tsx` /
   sheet (modals), `badge.tsx`, `tabs.tsx`, `accordion.tsx`, `progress.tsx`
3. Port `BottomNav` styling details (already have the tab navigator) and
   `GlassCard`
4. Build out the Pulse (home) screen end-to-end as the first full vertical
   slice, since it's the app's landing screen after auth
5. Continue with Vault, Tasks, Exams, Lab, Schedule/Calendar, Study Hub
