## Vault — Glass Folder Redesign

Replace the colorful 3D gradient folders with the **frosted, neutral folder** style from the reference (Invoices screenshot). The course color moves *inside* the folder as tinted peeking papers — the folder body itself becomes a soft, glassy off‑white.

### Visual spec (matches reference)

**Folder card (160×180, radius ~28px)**
- Body: frosted off‑white `#F2F2F2 → #E8E8E8` vertical gradient, soft inner highlight at the top
- Drop shadow: `0 10px 24px rgba(0,0,0,0.08)` + tiny `0 1px 0 rgba(255,255,255,0.6)` inner top edge
- Folder tab: short rounded bump on the top‑left (~45% width, 14% height), same off‑white, slightly darker
- 2–3 papers peeking out the top‑left corner, tinted with the course color at low opacity (~`color + 35% white`), each rotated a few degrees, with a tiny status chip (green check / orange dot) on the top paper
- Center of the folder body stays empty (no big logo) — keeps it minimalist
- Status dot removed from the card corner (the peeking‑paper chip replaces it)

**Label below card**
- `Course name  4` — name in `#1A1A1A` 14px medium, count in `#9A9A9A` 14px, inline, centered under the card (reference uses centered text)

**Empty folder**
- Same frosted body, no peeking papers, gray dot chip only

### Layout changes on the Vault home

- Center the folder labels (currently left‑aligned)
- Tighten grid gap to ~20px to match reference breathing room
- Keep semester chips row and `+` button exactly as they are now

### Files to change

- `src/components/vault/VaultFolderCard.tsx` — full rewrite of the grid variant (list variant untouched)
- No changes to `TheVaultPage.tsx`, data hooks, or Supabase

### Out of scope

- The big orange hero folder in the second reference (folder detail header) — not part of this request
- Bottom nav redesign from the reference — keep existing nav
