# Suggestion de matière + bouton « Ranger » par matière

## 1. Suggestion automatique dans l'ajout manuel
- Dans le menu d'ajout du Vault (fichier, photo, note), une matière est pré-sélectionnée selon tes cours du jour :
  1. le cours en train de se dérouler,
  2. sinon le cours qui vient de se terminer (moins de 2 h),
  3. sinon le prochain cours de la journée.
- Une petite pastille « Suggéré · cours de 10h » indique pourquoi ; tu peux changer de matière en un geste.
- Si aucun cours aujourd'hui : la matière ouverte reste le choix par défaut, comme maintenant.
- Réutilise la logique « cours du jour » déjà utilisée par la capture photo (pas de doublon).

## 2. Bouton « Ranger » dans chaque matière
- Petit bouton discret (icône + « Ranger ») dans l'en-tête de chaque matière, dans « Par matière » (bureau) et le Vault (mobile).
- Au clic, Orbit cherche parmi tes documents **non classés** (sans matière) ceux qui parlent de cette matière (titre, résumé, mots-clés, dossier Drive d'origine) et les y déplace, avec le semestre selon leur date de création.
- Jamais de déplacement d'un document déjà rangé dans une autre matière (tes choix manuels sont préservés).
- Résultat affiché : « 3 documents rangés dans Espagnol » avec bouton « Annuler ».
- État de chargement sobre pendant l'analyse ; aucun résultat → « Rien à ranger ».

## Détails techniques
- Hook partagé `useTodayClassSuggestion` extrait de SmartVaultCapture (événements calendrier du jour → subject_id) ; utilisé par VaultAddContentMenu, qui reçoit un sélecteur de matière (valeur `__none__` gérée).
- Nouvelle action `sortIntoSubject` dans la fonction `smart-file` : auth JWT, lit les vault_files de l'utilisateur sans subject_id (bornée à 200), pré-filtre par mots-clés puis classification Gemini via `_shared/ai.ts` (oui/non par document, contexte : nom + summary), mise à jour atomique via RPC service-role qui ne touche que les lignes encore `subject_id IS NULL` et assigne le semestre par date de création. Renvoie les ids déplacés pour l'annulation.
- Annulation : remet `subject_id = NULL` sur ces ids uniquement.
- Invalidation du cache TanStack Query du Vault après action.
- Test Vitest : la suggestion choisit cours en cours > récent > suivant ; un document déjà classé n'est jamais déplacé.
