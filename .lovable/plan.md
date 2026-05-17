## Goal
Refine `TasksPage` to match the reference (IMG_1387.jpeg): a calmer, cleaner Apple-style layout, and make the week strip **horizontally swipeable** to jump weeks/dates — with Apple-grade spring motion, haptics, and earcon sounds.

## Reference vibe deltas (vs current Tasks page)

The current page is close but slightly noisy. Align with the reference:

- **Date labels**: switch from single letters ("L M M J V S D") to **3-letter uppercase** ("LUN MAR MER JEU VEN SAM DIM") — bolder, more readable.
- **Date numbers**: bigger, heavier (≈ `text-xl`, `font-bold`), more vertical breathing room.
- **Selected day indicator**: small coral dot **below** the number (matching reference), not a wide pill.
- **Stats row**: simplify to two clean items — `● {todo} items` and `○ {done} terminées` — drop the "examens" chip (already shown in the narrative above).
- **Narrative line**: keep, slightly tighter leading.
- **Energy filters**: hide on this view (not in reference). Keep the state/code but remove them from the render to match the screenshot's calmness. (Out of scope to delete logic.)
- **Task rows**: keep current minimal style — small subject emoji on the left when available (reference shows 🤝 for "Nego"), checkmark circle for done tasks, time on the right. Use the subject icon if `task.subject_id` resolves to a subject with an icon; otherwise show the existing circle checkbox.
- **Card**: pure white-ish (`bg-card`) with very soft shadow, no backdrop blur tint.

## Swipeable week strip (the big new feature)

Wrap the week row in a horizontally-draggable `motion.div` with **paged snap** behavior.

- State: `weekOffset` (integer, 0 = current week, -1 = prev, +1 = next).
- Render **3 weeks side-by-side** (`weekOffset - 1`, `weekOffset`, `weekOffset + 1`), each taking 100% width, inside an `overflow-hidden` container. Translate horizontally with `x = -weekOffset * 100%`.
- `motion.div` with `drag="x"`, `dragConstraints={{ left: 0, right: 0 }}` and `dragElastic={0.2}` for rubber-banding.
- `onDragEnd`: if `offset.x < -60 || velocity.x < -400` → `weekOffset += 1` (next week). Inverse for previous. Use `transition={{ type: "spring", stiffness: 320, damping: 32 }}` for the snap (Apple-like critically damped).
- On week change: `haptics.selection()` + `sounds.select()`.
- On tapping a day: `haptics.selection()` + `sounds.tap()`, `setSelectedDay(d)`.
- Smoothly animate the coral underline dot between days using `layoutId="day-dot"`.

Also add chevron tap targets (left/right) for accessibility — same handlers as swipe.

## Apple-style motion + sound polish

- Global spring: `{ stiffness: 320, damping: 28 }` (slightly more damping than current 22 for that calm iOS feel).
- Hook in `useSoundEffects`:
  - week change → `sounds.select()`
  - day tap → `sounds.tap()`
  - task complete → `sounds.success()` (already haptic)
  - FAB open → `sounds.open()`
- Keep current haptics calls; add sounds alongside.

## Files to modify

- `src/pages/TasksPage.tsx` (only)

## Technical notes

- Use `useMemo` to compute the 3 visible weeks from `weekOffset` + a fixed `anchorMonday` (this week's Monday at mount).
- When user picks a day in a non-current week, `selectedDay` updates accordingly; the big "DIM" header and date stack reflect it.
- Keep `layoutId="day-indicator"` for the dot but scope it per-week to avoid cross-week layout glitches (use `layoutId={`dot-${weekOffset}`}`).
- No backend changes; no other pages touched (Pulse/Vault/Exams/Lab untouched per prior instruction).

## Out of scope

- Removing energy filter logic (just hidden in JSX).
- Subject-icon rendering for tasks — only add if trivial via existing `subjects` array; otherwise keep current circle. (Will add: lookup `subjects.find(s => s.id === task.subject_id)?.icon` and show as emoji if present, falling back to the circle.)
