# Orbit Plan — Mobile (React Native / Expo)

This is the React Native port of the Orbit Plan web app (`/src` at the repo
root), built with [Expo](https://expo.dev) + [expo-router](https://docs.expo.dev/router/introduction)
so it can be shipped to the App Store and Google Play.

The web app and this mobile app live side by side in the same repository.
The web app is unaffected by this folder.

## Stack

- **Expo SDK 56** + **expo-router** (file-based navigation, in `src/app`)
- **NativeWind v4** — Tailwind classes (`className`) on React Native
  components, sharing the same design tokens (`src/global.css`) as the
  web app's `src/index.css`
- **Supabase** (`@supabase/supabase-js`) with `AsyncStorage` session storage
- **react-i18next** with the same `fr`/`en` locale files as the web app
- **TanStack Query** for data fetching/caching

## Get started

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or `w` (web) — or
scan the QR code with Expo Go on a physical device.

## Project structure

```
src/
  app/            expo-router screens (file-based routing)
    (tabs)/       Pulse, Vault, Tasks, Exams, Lab — bottom tab navigator
    landing.tsx, auth.tsx, reset-password.tsx, settings.tsx
    course/[eventId].tsx, study/[fileId].tsx
  components/ui/  NativeWind-based UI primitives (shadcn/ui equivalents)
  hooks/          Ported hooks (useAuth, useHaptics, ...)
  lib/            Shared pure logic + Supabase client (ported from src/lib)
  i18n/           i18next setup + locale JSON (ported from src/i18n)
```

## Migration status

See [`MIGRATION_STATUS.md`](./MIGRATION_STATUS.md) for the folder-by-folder
porting progress from the web app.

## Environment variables

Supabase config lives in `.env` using the `EXPO_PUBLIC_` prefix required by
Expo to expose variables to the client bundle (mirrors the root `.env`,
which uses the `VITE_` prefix for the web build).
