# Dossier technique backend Orbit (documentation + copie du code)

Objectif : un livrable téléchargeable, en français, qui explique tout le fonctionnement du backend d'Orbit à des développeurs, accompagné d'une copie du code réel.

## Point important sur l'abonnement

Après vérification du code : **aucun système d'abonnement/paiement n'existe aujourd'hui** dans le backend (pas de Stripe, pas de Paddle, pas de table d'abonnement, pas de notion de plan payant). Le seul "abonnement" présent est la gestion des désabonnements e-mail (`email_unsubscribe_tokens`, `suppressed_emails`).

Le document décrira donc l'existant honnêtement, plus une section séparée et clairement identifiée « Abonnement — à construire » avec l'architecture cible recommandée (table `subscribers`, webhook de paiement, contrôle d'accès aux fonctions IA).

## Livrable 1 — Document explicatif (Markdown + PDF)

Sections prévues :

1. Vue d'ensemble de l'architecture (client React → backend Lovable Cloud/Postgres → fonctions serveur → services IA et e-mail)
2. Authentification et sessions (inscription e-mail, session persistante vs session unique, profils)
3. Schéma de base de données : chaque table (`profiles`, `user_settings`, `subjects`, `calendar_events`, `tasks`, `timeline_tasks`, `notes_vault`, `vault_files`, `vault_filing_history`, `flashcards`, `academic_years`, `semesters`, `quiz_debug_runs`, tables e-mail) avec colonnes, relations et rôle métier
4. Sécurité : RLS par utilisateur, droits accordés, règles à respecter pour toute nouvelle table
5. Pipeline iCal (`sync-calendar`) : récupération de l'URL, parsing, normalisation Europe/Paris, sélection des groupes TP/TD/CM, déduplication, nettoyage des matières par IA (`clean-subjects`), synchronisation quotidienne planifiée et bouton « Synchroniser maintenant »
6. Vault et fichiers : upload, stockage, OCR, classement automatique (`smart-file`), traitement des notes (`process-note`)
7. Moteur IA d'étude : `generate-flashcards`, `generate-quiz` (compression d'image, découpage PDF en segments, fusion des questions, journalisation de debug)
8. Infrastructure e-mail : hook d'authentification, file d'attente, dispatcher, journal d'envoi, désabonnements, domaine d'envoi
9. Déclencheurs et automatisations en base (génération de tâches de révision à partir des examens, etc.)
10. Variables d'environnement et secrets utilisés (noms seulement, jamais de valeurs)
11. Abonnement — architecture cible à construire
12. Guide « par où commencer » pour un nouveau développeur

Chaque section contient un schéma texte du flux et les chemins de fichiers correspondants dans la copie du code.

## Livrable 2 — Archive du code backend

Une archive ZIP contenant :

- `supabase/migrations/` (toutes les migrations SQL, ordre chronologique = historique du schéma)
- `supabase/functions/` (toutes les fonctions serveur, y compris les modèles d'e-mail partagés)
- `supabase/config.toml`
- les fichiers client qui font le pont avec le backend, en lecture seule pour référence (`src/hooks/useOrbitData.tsx`, `useVaultData.tsx`, `useTimelineTasks.tsx`, `useAuth.tsx`, types générés)
- le document explicatif à la racine de l'archive

Aucun secret ni clé privée n'est inclus ; le fichier `.env` est exclu.

## Détails techniques

- Le document est rédigé à partir d'une lecture exhaustive des migrations et des fonctions serveur, pas d'un résumé approximatif.
- Génération PDF via reportlab avec une police Unicode (accents français) et contrôle visuel page par page avant livraison.
- Fichiers déposés dans les Fichiers : `orbit-backend-documentation.md`, `orbit-backend-documentation.pdf`, `orbit-backend.zip`.
- L'archive est assemblée puis inspectée dans un dossier temporaire avant copie, pour vérifier qu'aucun fichier généré ni secret ne s'y glisse.
- Aucune modification du code de l'application.
