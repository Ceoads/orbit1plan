# Fix 404 sur "Voir toutes les notes de ce cours"

## Problème
Dans `src/pages/CourseHubPage.tsx`, le bouton "Voir toutes les notes de ce cours" appelle `navigate('/vault')`, mais la route `/vault` n'existe pas dans `src/App.tsx`. Vault est un onglet de la page racine accessible via `/?tab=vault` (voir `src/pages/Index.tsx` ligne 38). Résultat : `NotFound` (404).

Le même problème existe potentiellement pour le bouton "Examens" qui pointe vers `/exams` — à vérifier et corriger de la même manière (`/?tab=exams`).

## Fix
Dans `src/pages/CourseHubPage.tsx` :
- Remplacer `navigate('/vault')` par `navigate('/?tab=vault')` pour le bouton "Voir toutes les notes de ce cours".
- Remplacer `navigate('/exams')` par `navigate('/?tab=exams')` pour le bouton lié à l'examen (même cause).

## Surlignage noir de la date
Aucun changement nécessaire : `CalendarTodayList` applique déjà `backgroundColor: #1A1A1A` sur la pastille de la date sélectionnée dans la bande hebdo (visible sur la capture IMG_1374, "MAR 19" en noir). La logique reste : tap sur un jour → met à jour `selectedDate` → highlight noir suit l'utilisateur.
