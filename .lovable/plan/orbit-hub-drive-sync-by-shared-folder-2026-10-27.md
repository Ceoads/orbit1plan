# Orbit Hub — Drive sync by shared folder

Adds a second way to connect Google Drive: the student shares one folder ("Orbit Hub") with Orbit's sync bot. The existing "Connect with Google" button, imports and daily sync stay as they are — nothing is removed or duplicated.

## What the student sees
A 3-step sheet (Apple style, Orbit colours, springy transitions, 3-dot progress):
1. **Set up your Orbit Hub** — create a folder named "Orbit Hub" in Drive (button opens Drive). "I've created it".
2. **Connect the Sync Bot** — bot email shown in a pill with "Copy" (checkmark on success); share as Editor. "Email added".
3. **Paste the Folder Link** — large input; the folder ID is pulled out of the link automatically, green tick when valid. "Connect Drive" checks the bot can actually see the folder, saves it, shows a checkmark animation, then closes.

Clear error if the folder isn't shared yet ("Orbit can't see this folder yet — check it's shared with the bot").

Entry points: the existing Drive page on desktop, and the Drive step of the desktop onboarding (as an alternative option next to Google sign-in).

## Sync
- The existing daily Drive sync also reads each student's Orbit Hub folder through the bot, using the same dedup, 25-file limit, and AI subject filing already in place.
- "Sync now" button on the Drive page; Library/Quiz/Fiches refresh afterwards.

## What I need from you
A Google service account key (JSON) for the bot — entered through a secure form, stored server-side only. The bot email shown in step 2 will be the real one from that key (not the placeholder in the brief).

## Technical details
- Migration: `profiles.drive_hub_folder_id text`, `drive_hub_connected_at timestamptz` (RLS already covers profiles; folder ID validated server-side by regex `[A-Za-z0-9_-]{10,}`).
- Secret `GOOGLE_SERVICE_ACCOUNT_JSON`; new action in the existing Drive edge function: `hub_info` (returns bot email), `hub_link` (JWT-verified user, verifies folder via service-account token, saves ID), `hub_sync`. Service-account token minted with signed JWT in Deno, never sent to client.
- Daily sync job extended to iterate profiles with a hub folder.
- `src/lib/driveFolderId.ts` extractor + Vitest tests (folders URL, `open?id=`, `u/0/folders`, raw ID, invalid).
- Component `src/components/drive/DriveOnboardingModal.tsx` using existing Dialog/Drawer and design tokens; TanStack Query invalidation of the vault cache after link/sync.
