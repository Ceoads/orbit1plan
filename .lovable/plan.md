## Vision

Bascule complète d'Orbit (sauf `/landing`) du Soft UI Peach/Coral vers **Linear/Vercel Mono** : monospace, contrastes francs, géométrie 12px, zéro ombre, zéro gradient, zéro blur. L'orange `#FF6B35` reste l'accent unique (proche de l'ancien Coral, donc cohérent avec l'identité Orbit). Mode **light par défaut**, toggle dark dans le header.

⚠️ Refactor d'envergure : ce plan touche tokens globaux + ~30 composants. Je le livre en **3 phases** ; chacune est mergeable indépendamment.

---

## Phase 1 — Fondations (tokens, fonts, primitives)

### 1.1 Tokens design (`src/index.css` + `tailwind.config.ts`)
Réécriture complète des variables HSL :

**Light (par défaut)**
- `--background` → `#FAFAF8` (off-white chaud)
- `--surface-secondary` → `#F5F5F3`
- `--card` → `#FFFFFF`
- `--foreground` → `#1A1A1A`
- `--muted-foreground` → `#606060`
- `--tertiary-foreground` → `#888888`
- `--border` → `rgba(0,0,0,0.05)`
- `--border-hover` → `rgba(0,0,0,0.10)`
- `--primary` → `#FF6B35`

**Dark**
- `--background` → `#0A0A0A`
- `--surface-secondary` → `#111111`
- `--card` → `#1A1A1A`
- `--foreground` → `#FFFFFF`
- `--muted-foreground` → `#A0A0A0`
- `--tertiary-foreground` → `#787878`
- `--border` → `rgba(255,255,255,0.06)`
- `--border-hover` → `rgba(255,255,255,0.12)`

**Suppressions globales**
- Toutes les classes `shadow-*` custom (`shadow-soft`, `shadow-elegant`, `shadow-peach`…) → no-op (vide).
- Toutes les classes `gradient-*` → fond plat `bg-primary`.
- `backdrop-blur` → retiré sur surfaces app (gardé sur modaux iOS si nécessaire).
- Radius : `--radius` = `12px` (cards/buttons), `--radius-sm` = `8px` (inputs), `--radius-lg` = `16px` (large containers). Suppression des `rounded-full`/`rounded-pill` sur cards.

### 1.2 Typographie
- Ajouter **JetBrains Mono** (400, 500, 600) via `<link>` Google Fonts dans `index.html`.
- Remplacer `font-sans` / Outfit / Quicksand par `font-mono` (JetBrains Mono → IBM Plex Mono → Courier New → monospace) sur **toute l'app sauf `/landing`**.
- Stratégie : wrapper `<AppShell>` qui applique `font-mono` au root du layout authentifié ; la landing garde son CSS scope avec `font-sans` explicite.
- Échelle type (variables CSS) :
  - `--text-title` : 40px / 600 / -0.02em
  - `--text-body` : 14px / 500
  - `--text-meta` : 12px / 400
  - `--text-section` : 11px / 500 / 0.08em / UPPERCASE

### 1.3 Mode par défaut + toggle
- Mettre `defaultTheme="light"` dans `ThemeProvider`.
- Toggle Dark/Light minimaliste (icône sun/moon, 16px, monospace) intégré dans header de chaque page principale.

### 1.4 Primitives shadcn
Réécrire les variants des composants suivants pour respecter le système :
- `button.tsx` : variant `default` = `bg-primary text-white rounded-[12px] h-11 hover:opacity-90 transition-opacity` ; `ghost` = `text-muted-foreground hover:text-foreground` ; **aucune** ombre.
- `card.tsx` : `bg-card border border-border rounded-[12px] p-7` (28px) — pas d'ombre.
- `input.tsx` : `rounded-[8px] border-border h-11 focus:border-border-hover` — pas d'anneau.
- `tabs.tsx` : version "text + underline" (pas de pill).
- `checkbox.tsx` : cercle outline 16px → fill orange + check sur état coché (animation 300ms ease-out).

---

## Phase 2 — Les 3 pages spécifiées au pixel près

### 2.1 Schedule (renommer interne `PulsePage` → conserver mais redesign hub)
Décision : le **Pulse Dashboard** actuel devient l'écran "Schedule" tel que décrit. La logique métier (Room Reminder, Class Recap) est conservée mais reformatée en lignes monospace minimalistes.

Layout strict du brief :
- Header : logo Orbit 11px + toggle dark/light
- Titre "Schedule" (40px mono 600)
- Greeting "Monday, May 19" (14px mono)
- Sub "Tu as X tâches et Y examens aujourd'hui." (12px gray)
- Stats line "0 items · 0 completed" (12px mono)
- Week strip horizontal scroll : `LUN 18 | MAR 19 | …`, jour courant = dot orange 4px
- Liste de courses : cards 28px padding, border 1px, pas d'ombre
- Empty state texte centré
- Bottom button "Add course" orange `#FF6B35`, radius 12px

### 2.2 Devoirs (`TasksPage.tsx` — refonte totale)
⚠️ La TasksPage actuelle vient juste d'être refaite en iOS day-view (motion intensive). Ce brief **remplace** cette version par la liste mono stark.
- Titre "Devoirs" 40px mono
- Filter tabs text-only avec underline orange 2px sur active
- Task list : checkbox cercle outline → fill orange ; titre 14px mono 500 ; sujet 11px uppercase ; due 12px gray ; padding 28px ; border 1px
- Coché : opacity 60% + strikethrough
- Empty state texte
- Bouton "Add task" orange

### 2.3 Examens (`ExamsPage.tsx`)
- Titre "Examens" 40px mono
- Section label "À VENIR" 11px uppercase
- Cards exam : nom 14px / date 12px / badge "X jours" (8px radius) coloré selon urgence (rouge <3j, orange 3-7j, gris >7j)
- Progress bar 2px height, fill orange, label "X% prepared" 11px gray
- Section "Terminés" collapsible (chevron monospace)
- Empty state texte
- Bouton "Add exam" orange

### 2.4 Bottom Navigation (refonte `FloatingDockNav`)
Remplace la pill blur 25px par version stark :
- Fixed bottom, fond `bg-background/95` (pas de blur)
- 3 onglets : Schedule | Tasks | Exams (texte mono 11px + icône outline lucide)
- Actif : texte orange + underline 2px orange ; inactif : gris `#A0A0A0`
- Pas de pill, pas d'ombre, pas de glass

---

## Phase 3 — Alignement du reste de l'app

Pages restantes : **Vault, Lab, Settings, CourseHub, StudyHub, ExamLab, Onboarding, Auth, Timeline**.

Approche : ne pas tout réinventer page par page (sinon ~80h de refonte). À la place, **propagation automatique via les tokens Phase 1** + audit ciblé :

1. Les tokens HSL + suppression des classes `shadow-*`/`gradient-*` redessinent 70 % du visuel d'office.
2. Audit page par page :
   - Remplacer `font-sans` résiduels par `font-mono`
   - Remplacer `rounded-3xl`/`rounded-full` (sauf avatars circulaires) par `rounded-[12px]`
   - Retirer emojis décoratifs des CTA (gardés sur cartes de matières car porteurs d'info)
   - Section labels en 11px uppercase tracking-wide
   - Inputs `h-11 rounded-[8px]`
3. Modales : remplacer fond peach/cream par `bg-card border border-border`, pas de blur.
4. Onboarding : conserver le contenu pédagogique, restyle les écrans avec typographie mono + cards stark (les Lottie animations restent).
5. Landing **intouchée** (scope CSS isolé via `font-sans` explicite sur `/landing`).

### Micro-interactions (globales)
Ajouter classes utilitaires dans `index.css` :
- `.transition-border` (border-color 150ms ease-out)
- `.transition-fade-page` (opacity 200ms ease-out — pour `AnimatePresence` des routes)
- Désactiver `whileTap={{ scale }}` partout dans les boutons app (garder uniquement opacité).
- Progress bar : `cubic-bezier(0.33, 0.66, 0.66, 1)` 600ms.

---

## Memory updates
- **Remplacer** `mem://style/aesthetic-tokens` (Soft UI Peach) par nouvelle entrée **Linear Mono Tokens** (#0A0A0A/#FAFAF8, #FF6B35, JetBrains Mono, radius 12px, no shadows).
- **Mettre à jour** `mem://core` : retirer "Peach/Coral/Cream", "Outfit/Quicksand", "backdrop blur 25px". Ajouter "Linear/Vercel mono aesthetic, JetBrains Mono, #FF6B35 single accent, light default, no shadows/gradients/blur".
- **Mettre à jour** `mem://features/floating-dock-nav` : nouvelle version text+underline.
- **Mettre à jour** `mem://style/haptic-and-motion-design` : retirer scale animations, garder haptics.
- **Marquer obsolète** `mem://features/pulse-dashboard-layout` (Peach Primary Class card → version stark).

---

## Hors-scope
- `/landing` (et son demo theatre) : intouchée.
- Logique métier (sync iCal, AI Vault, génération flashcards) : aucune modification.
- Database, Edge Functions : intouchées.
- Pas de toggle "Soft UI vs Pro Mono" — l'utilisateur a choisi le full switch.

---

## Livraison
Je livre les **3 phases dans le même tour** (sinon l'app sera incohérente entre les phases). Concrètement :
1. Tokens + fonts + primitives shadcn (Phase 1)
2. Schedule + Devoirs + Examens + BottomNav (Phase 2)
3. Audit propagation sur Vault/Lab/Settings/CourseHub/StudyHub/ExamLab/Auth/Modales (Phase 3)
4. Update memories

Risque assumé : certaines pages secondaires (StudyHub, ExamLab interne) auront un rendu "correct par défaut" via les tokens mais pourront nécessiter une passe d'ajustement après ton retour visuel. Je signalerai chaque écran à valider.
