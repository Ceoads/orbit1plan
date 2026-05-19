## Problème

1. **PDF ne charge pas** ("Impossible de charger le PDF") — le worker `pdf.worker.min.mjs?url` n'est pas toujours résolu correctement par Vite en preview (MIME `.mjs` / chemin worker). Le viewer affiche systématiquement le fallback.
2. **Tout le PDF se charge d'un coup** — chaque `<Page>` rend immédiatement, ce qui gèle l'UI sur les longs PDF (10+ pages).
3. **Plein écran lourd** — même problème, plus `<motion.div>` avec `layoutId` qui re-mesure tout pendant l'ouverture.
4. **Bouton "Onglet" peu visible** sur fond noir et fermeture peu accessible au pouce.

## Plan

### 1. `PdfPagesViewer.tsx` — lazy loading + worker fiable

- Charger le worker depuis CDN (`unpkg`) avec la version exacte de `pdfjs-dist` pour éviter le résolveur Vite :
  ```ts
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  ```
  (résout l'erreur de chargement vue sur la capture).
- Nouveau composant interne `LazyPage` :
  - Wrapper `div` placeholder avec hauteur estimée (ratio A4 = `width * 1.414`) pour préserver le scroll.
  - `IntersectionObserver` avec `rootMargin: "800px 0px"` → ne monte le `<Page>` que lorsqu'il approche du viewport.
  - Garde la page montée une fois vue (évite re-render au scroll arrière), mais avec une option `unmountFarPages` pour libérer la mémoire au-delà de ±5 pages dans le mode plein écran.
- Ajout d'un prop `containerRef?: RefObject<HTMLDivElement>` pour utiliser le scroll-container parent comme `root` de l'observer (sinon viewport global rate les pages en modal).
- Passer `renderMode="canvas"` explicitement + `devicePixelRatio` capé à 2 pour éviter les canvas géants sur Retina.
- Compteur de pages chargées dans le placeholder ("Page X / N").

### 2. `DocumentViewer.tsx` — plein écran fluide

- Passer la `ref` du conteneur scrollable à `PdfPagesViewer` dans les deux modes (compact + fullscreen) pour que l'IntersectionObserver fonctionne dans la modal.
- Plein écran PDF :
  - Retirer `layoutId` du wrapper PDF (image only) — évite le coût de FLIP layout sur le PDF.
  - Barre d'outils plus tactile : bouton fermer `44×44` à gauche, bouton "Onglet" avec fond `bg-white/10` + ring, `pt-safe`.
  - Ajouter un mini-indicateur de pagination flottant en bas ("3 / 12") basé sur le scroll du conteneur, en `bg-black/60 backdrop-blur` `rounded-full`.
  - Activer `overscroll-contain` + `touch-action: pan-y` sur le scroller pour éviter le pull-to-refresh natif iOS.
- Ajouter un raccourci : tap sur le fond hors-PDF ferme la modal (avec `stopPropagation` sur la zone PDF).
- Le bouton "Onglet" ouvre dans un nouvel onglet (déjà fait) — vérifier `rel="noopener noreferrer"`.

### 3. Hors scope

- Pas de modif backend, RLS, edge functions, ou OCR.
- Pas de pagination "page par page" — on garde le scroll continu, juste lazy.
- Pas de mise en cache disque ; pdf.js gère son cache mémoire.

## Fichiers modifiés

- `src/components/study-hub/PdfPagesViewer.tsx` (lazy + worker CDN + container root)
- `src/components/study-hub/DocumentViewer.tsx` (passage de ref, toolbar plein écran, indicateur page)
