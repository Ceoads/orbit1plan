# Onboarding desktop première inscription (Orbit)

Objectif : un parcours guidé en 6 étapes pour les nouveaux comptes sur ordinateur, sans rien casser de l'existant (onboarding mobile, SetupWizard, Drive, backend).

## 1. Base de données (migration additive)

Ajouter sur `public.profiles` (nullable, aucune donnée existante touchée) :
- `onboarding_status` text (`not_started` | `in_progress` | `completed` | `skipped`), défaut `not_started`
- `onboarding_current_step` int, défaut 0
- `onboarding_completed_at` timestamptz, `onboarding_skipped_at` timestamptz

Règle d'affichage : wizard visible uniquement si compte créé après le déploiement ET statut `not_started`/`in_progress`. Les comptes existants passent directement au dashboard (on marque `completed` pour les comptes ayant déjà des matières).

## 2. Wizard desktop — `src/components/onboarding/DesktopOnboarding.tsx`

Wizard central : contenu à gauche, aperçu/illustration à droite, barre de progression discrète, boutons « Précédent / Continuer / Passer ». Charte Orbit (pêche/corail/crème, coins arrondis, ombres douces). Chaque étape sauvegarde sa progression en base au fur et à mesure (reprise sans perte après rafraîchissement).

1. **Bienvenue** — 3 capacités (Comprendre / Organiser / Agir), CTA « Configurer mon Orbit » + « Passer pour le moment ».
2. **Faisons connaissance** — prénom, établissement, année, objectif ; prérempli depuis `profiles`, sauvegarde progressive, rien d'obligatoire.
3. **Connecte tes applications** — cartes Google Drive (vrai flux OAuth existant, statuts Non connecté/En cours/Connecté/Erreur) et calendrier iCal (champ URL existant) ; « Continuer sans connecter » ; retour OAuth restaure l'étape.
4. **Importe tes cours** — import PDF (mécanisme Vault existant) ou dossier Drive si connecté ; états chargement/succès/erreur ; étape passable.
5. **Première organisation** — ajouter une vraie tâche ou une échéance (enregistrées en base, visibles au dashboard) ; continuable sans rien créer.
6. **Ton espace est prêt** — récap réel (profil, connexions, documents, tâche) + 3 exemples qui ouvrent Orbit AI ; CTA « Accéder à mon Orbit » → `completed`.

Skip global dès l'étape 1 → `skipped`, accès immédiat au dashboard, jamais relancé.

## 3. Intégration

- `Index.tsx` : sur desktop, si `onboarding_status` ∈ {not_started, in_progress} et compte récent → afficher le wizard à la place de DesktopApp. Mobile inchangé (OrbitOnboarding/SetupWizard existants conservés tels quels).
- `GoogleDriveReturn.tsx` : après OAuth, renvoyer vers l'étape 3 si l'onboarding est en cours.

## 4. Après l'onboarding

- **Widget « Bien démarrer avec Orbit »** sur le dashboard desktop : checklist réelle (profil complété, Drive connecté, calendrier connecté, premier cours, première tâche, essai Orbit AI), calculée depuis les vraies données, mise à jour automatique, masquable définitivement (flag en base, ex. `preferences.checklist_dismissed`).
- **Carte « Terminer la configuration »** discrète si onboarding interrompu (`in_progress`), permettant de reprendre sans être imposé.
- **Mini-tutoriel contextuel** : petites infobulles (navigation, Orbit AI, documents, calendrier, tâches) à la première visite du dashboard post-inscription, « Suivant »/« Terminer », jamais réaffiché (flag en base).

## 5. Tests

Build OK + vérification des règles : nouvel utilisateur → wizard ; completed/skipped → plus jamais affiché ; rafraîchissement → reprise à la bonne étape ; utilisateur existant → rien d'imposé.

## Hors périmètre

Aucune modification du backend, des edge functions, de l'onboarding mobile, ni des pages existantes (sauf insertion du widget et du routage du wizard).
