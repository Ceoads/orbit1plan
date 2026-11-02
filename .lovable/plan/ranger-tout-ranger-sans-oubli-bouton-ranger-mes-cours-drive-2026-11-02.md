# Ranger : tout ranger, sans oubli + bouton « Ranger mes cours Drive »

## Ce qui ne va pas aujourd'hui
- Le bouton « Ranger » d'une matière appelle une action de rangement qui n'existe pas réellement côté serveur : l'appel échoue ou ne range qu'une partie des documents.
- Le rangement automatique des cours Drive ne traite que 25 documents à la fois, et il n'y a aucun bouton visible pour le lancer soi-même.
- Les Google Docs sont déjà exportés en texte + PDF et analysés en entier à l'import : rien à changer de ce côté, ce texte sera réutilisé pour le rangement.

## 1. Bouton « Ranger » d'une matière — range tout ce qui lui appartient
- Parcourt **tous** les documents sans matière (par pages de 100, sans plafond), pas seulement les premiers.
- Pour chaque document : l'IA lit le nom, le résumé et le texte complet (texte extrait, ou le PDF lu directement si aucun texte n'a encore été extrait — scans compris) et décide s'il appartient à cette matière, en comparant avec toutes tes autres matières.
- Analyse par petits lots en parallèle pour rester rapide ; un document dont l'analyse échoue est réessayé une fois, puis compté à part (« 2 documents n'ont pas pu être analysés ») au lieu d'être ignoré en silence.
- Chaque document rangé reçoit aussi le bon semestre selon sa date de création.
- Message final : « X documents rangés dans [matière] », avec « Annuler » comme aujourd'hui.

## 2. Nouveau bouton « Ranger mes cours Drive » dans « Par matière »
- Petit bouton sobre (même style que « Ranger ») en haut de « Par matière », à côté de « Synchroniser ».
- Un clic : l'IA range automatiquement **tous** les cours Drive sans matière dans la matière qui leur correspond, et complète les semestres manquants.
- Progression affichée (« Analyse 12/40… »), puis résumé : « 38 cours rangés · 2 à classer à la main ». Les documents trop ambigus restent sans matière plutôt que d'être mal rangés.
- Le même rangement continue de s'exécuter automatiquement après chaque synchronisation Drive.

## Vérification
- Créer plusieurs documents sans matière (plus de 25) dans ton compte de test, cliquer « Ranger » puis « Ranger mes cours Drive », et vérifier dans « Par matière » que tous les documents concernés ont bien été déplacés, avec le bon semestre.
- Tests automatiques sur la pagination (aucun document oublié au-delà d'une page).

## Détails techniques
- `smart-file/index.ts` : implémenter la fonction `sortIntoSubject` manquante (référencée mais non définie). Lecture paginée `vault_files` where `subject_id is null` (range 0..99, 100..199…), classification via `_shared/ai.ts` (multimodal PDF si `extracted_text` vide), concurrence 4, retry 1, update `where subject_id is null` + `semester_id` via `semesterForCreation`, renvoie `{ movedIds, failed }`.
- `google-drive/index.ts` action `autoFile` : accepter un curseur `{ after }`, traiter par lots de 25 et renvoyer `{ filed, ambiguous, nextCursor }` ; le client boucle jusqu'à `nextCursor = null` (évite les délais d'exécution).
- Nouveau composant `SortDriveCoursesButton` dans l'en-tête « Par matière » (desktop `DesktopApp.tsx` et vue mobile du Vault), invalidation du cache TanStack Query des documents à la fin.
- Test Vitest pour l'aide de pagination partagée.
