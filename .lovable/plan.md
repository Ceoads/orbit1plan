## Problèmes identifiés

### 1. Bouton « Sync maintenant » peu visible
Il existe déjà une ligne `Resynchroniser maintenant` dans Paramètres → Synchronisation, mais elle est noyée en bas de la page, sans hiérarchie visuelle. L'utilisateur ne la trouve pas.

### 2. Cours qui apparaissent au mauvais jour (dimanche) et cours manquants
**Cause racine identifiée** dans les vues calendrier (`WeeklyTimeGrid.tsx`, `CalendarDayView.tsx`, `CalendarTodayList.tsx`) :

```ts
const dateStr = date.toISOString().split('T')[0];
```

`toISOString()` retourne la date en **UTC**, pas en heure locale. Pour un utilisateur en France (UTC+1/+2), `new Date(2026, 4, 18)` (lundi minuit Paris) devient `"2026-05-17"` une fois converti en UTC. Conséquences :

- Les `event_date` stockés en heure de Paris (`YYYY-MM-DD` Paris) ne matchent plus la bonne colonne.
- Tout l'affichage est **décalé d'un jour** : un cours du lundi atterrit dans la colonne du dimanche, etc.
- Certains cours disparaissent côté bord de semaine (le lundi tombe avant la fenêtre visible).

Le filtrage de groupe (`eventFilter.ts`, `eventMatchesGroup` backend) n'est pas en cause : l'utilisateur a confirmé n'avoir aucun filtre actif.

## Plan d'action

### 1. Bouton Sync proéminent (`src/pages/SettingsPage.tsx`)
- Sous le champ URL iCal, ajouter un second bouton secondaire **« Synchroniser maintenant »** (icône `RefreshCw`, hauteur 52px, style outline coral) directement à côté ou sous le bouton « Enregistrer et synchroniser » existant.
- Désactivé tant que `icalUrl` est vide. Affiche `Loader2` + texte « Synchronisation… » quand `syncing`.
- Garder la ligne `Resynchroniser maintenant` existante (les power users la trouveront aussi).

### 2. Fix du bug timezone (3 fichiers)
Créer un util `src/lib/dateFormat.ts` :
```ts
export const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
```

Remplacer `date.toISOString().split('T')[0]` par `toLocalDateStr(date)` dans :
- `src/components/calendar/WeeklyTimeGrid.tsx` (ligne 59)
- `src/components/calendar/CalendarDayView.tsx` (lignes ~68, ~80)
- `src/components/calendar/CalendarTodayList.tsx` (ligne ~49)
- `src/pages/TasksPage.tsx` si même pattern présent (à vérifier).

### 3. Forcer un resync après le fix
Le bug masquait peut-être de vrais cours et créait des dimanches fantômes côté affichage uniquement. Une fois le fix appliqué, dire à l'utilisateur de cliquer « Synchroniser maintenant » pour rafraîchir et confirmer que tout s'affiche au bon jour.

## Hors-scope
- Pas de changement de la logique backend `sync-calendar` (le parsing Paris est correct).
- Pas de modification du filtre groupe `eventFilter.ts`.
- Pas de redesign de la page Paramètres au-delà de l'ajout du bouton.

## Fichiers modifiés
- `src/pages/SettingsPage.tsx` (bouton Sync proéminent)
- `src/lib/dateFormat.ts` (nouveau)
- `src/components/calendar/WeeklyTimeGrid.tsx`
- `src/components/calendar/CalendarDayView.tsx`
- `src/components/calendar/CalendarTodayList.tsx`
- `src/pages/TasksPage.tsx` (si concerné)
