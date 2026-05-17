## Fond premium « crème chaud » — global

Le fond actuel (`--background: 30 40% 96%`) est plat et froid. On le remplace par une **base crème chaud papier** + une **couche mesh très diffuse** (deux halos pêche/sable à <8% d'opacité) appliquée une seule fois au niveau du `body`, pour que toutes les pages (Vault, Pulse, Tasks, Exams, Lab, Settings) en héritent automatiquement.

### Palette retenue
- Base : `#FAF7F2`
- Mid  : `#F5EFE6`
- Deep : `#EFE7D8` (utilisé uniquement pour les halos)

### Changements

**1. `src/index.css` — tokens (light + dark)**
- `--background` light : `30 40% 96%` → `36 38% 96%` (≈ `#FAF7F2`, crème chaud)
- `--secondary`, `--muted`, `--border` : décalés d'1–2 pts pour rester cohérents avec la nouvelle base
- Nouveau token `--gradient-app-bg` :
  ```
  radial-gradient(ellipse 70% 50% at 15% 0%, hsl(30 60% 92% / 0.55), transparent 60%),
  radial-gradient(ellipse 60% 55% at 100% 100%, hsl(24 55% 90% / 0.45), transparent 60%),
  linear-gradient(180deg, hsl(36 38% 96%), hsl(34 35% 94%))
  ```
- Variante dark : halos très sombres chauds sur base `20 15% 10%` (inchangée), opacité ≤ 25%

**2. `body` (dans `@layer base`)**
- `background: var(--gradient-app-bg) fixed;`
- `background-attachment: fixed;` pour que le mesh ne bouge pas au scroll (sensation premium)
- `min-height: 100dvh;`

**3. Nettoyage ciblé**
- Pages qui forcent `bg-background` plein blanc cassé (Vault, Pulse, Tasks, Exams, Settings) : retirer `bg-background` ou passer en `bg-transparent` pour laisser passer le mesh global. Vérifier ces 5 fichiers seulement, sans toucher au reste.
- Landing Page : **exclue** (a déjà son propre fond marketing animé)
- Modales / Sheets / Cards : inchangés, restent sur `--card` blanc pur — le contraste subtil carte/fond renforce l'effet premium.

### Hors scope
- Pas de changement sur les couleurs accent (pêche/corail conservées)
- Pas de refonte de la Landing
- Pas de changement des cartes dossiers Vault (déjà refaites)

### Fichiers modifiés
- `src/index.css` (tokens + body)
- `src/pages/TheVaultPage.tsx`, `PulsePage.tsx`, `TasksPage.tsx`, `ExamsPage.tsx`, `SettingsPage.tsx` — retrait de `bg-background` sur le wrapper racine si présent
