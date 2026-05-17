## Problème
Sur plusieurs pages, le bouton "Retour" appelle `navigate('/')` au lieu de `navigate(-1)`, ce qui ramène toujours à l'accueil au lieu de la page précédente. Certains textes utilisent aussi des contrastes trop faibles (gris clair sur crème).

## 1. Navigation "Retour" — toujours revenir à la page précédente

Créer un petit hook `useSmartBack()` dans `src/hooks/useSmartBack.tsx` :
- Si `window.history.length > 1` et qu'on n'est pas sur `/landing` ou `/auth` → `navigate(-1)`
- Sinon fallback intelligent (`/` pour pages app, `/landing` si non connecté)
- Joue `haptics.selection()` + `sounds.tap()` pour la cohérence iOS

Remplacer tous les "retour" qui pointent en dur vers `/` :

| Fichier | Ligne | Avant | Après |
|---|---|---|---|
| `src/pages/SettingsPage.tsx` | 448, 468, 655, 677 | `navigate('/')` (bouton "Retour") | `smartBack()` |
| `src/pages/StudyHubPage.tsx` | 75 | `navigate('/')` (close) | `smartBack()` |
| `src/pages/CourseHubPage.tsx` | 330 | `navigate('/lab')` (close après quiz) | garder mais ajouter bouton retour explicite |
| `src/pages/ResetPasswordPage.tsx` | 36 | OK (flow auth, garder) | — |

Garder `navigate(-1)` là où il est déjà correct (CourseHubPage 76/386, StudyHubPage 106/219).

## 2. Header iOS standardisé — bouton Retour visible partout

Créer `src/components/IOSBackButton.tsx` : chevron + label ("Retour"), 44×44pt min, position top-left, safe-area aware, `aria-label="Retour"`.

L'utiliser dans :
- `SettingsPage` (remplace le bouton custom ligne 468)
- `CourseHubPage` (header)
- `StudyHubPage` (remplace le bouton ligne 219)

Sur les pages "racines" (Pulse/Vault/Tasks/Exams/Lab dans `Index.tsx`) → pas de bouton retour, la Tab Bar suffit (déjà conforme HIG).

## 3. Lisibilité & contrastes (WCAG AA)

Audit rapide dans `src/index.css` du token `--muted-foreground` : actuellement trop clair sur fond crème chaud.

- Augmenter le contraste de `--muted-foreground` (cible ratio ≥ 4.5:1 sur `--background`).
- Remplacer dans les composants les usages de `text-muted-foreground/50`, `/60`, `/70` (timestamps tâches, métadonnées) par `text-muted-foreground` plein, ou `text-foreground/70` minimum.
- Vérifier les placeholders d'input : `placeholder:text-muted-foreground` (token), pas de gris arbitraire.

Fichiers à passer en revue : `TasksPage.tsx`, `PulsePage.tsx`, `TheVaultPage.tsx`, `ExamsPage.tsx`, `ExamLabPage.tsx`, `CollapsibleHeader.tsx`, cartes (`ExamCard`, `PriorityTaskCard`, `VaultFileCard`, `NoteCard`).

## 4. Garde-fou navigation

Dans `Index.tsx`, ajouter un effet qui, lors d'un retour navigateur, réapplique le `tab` depuis l'URL si présent — déjà partiellement géré, à compléter pour que l'historique des onglets fonctionne avec le bouton retour natif iOS / Android.

## Hors scope
- Aucune logique backend, aucune migration.
- Pas de refonte visuelle des pages Pulse/Vault/Exams/Lab (uniquement contrastes).
- TasksPage : on garde le design iOS récent, on ajuste seulement les contrastes des métadonnées.

## Fichiers touchés
- Nouveau : `src/hooks/useSmartBack.tsx`, `src/components/IOSBackButton.tsx`
- Modifiés : `src/pages/SettingsPage.tsx`, `src/pages/StudyHubPage.tsx`, `src/pages/CourseHubPage.tsx`, `src/pages/Index.tsx`, `src/index.css`, plus ajustements ponctuels de contrastes dans les pages/cartes listées.
