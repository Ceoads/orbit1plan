# Roadmap

## Classement automatique Drive
- [ ] Compléter le classement existant par matière et semestre selon la date de création
- [ ] Vérifier le tri chronologique et les règles de classement sans doublons

## Performance et réactivité
- [x] Mesurer les requêtes répétées et le délai des commandes
- [x] Mutualiser les chargements et éviter les rafraîchissements inutiles
- [x] Rendre les réponses aux quiz et le chat fluides sans perdre les sauvegardes
- [x] Vérifier les parcours réels : 17 → 5 chargements initiaux, trois choix en 0,2 s et restaurés après actualisation ; navigation bibliothèque sans nouvelle lecture ; commande chat simple en 3,64 s ; 15 tests réussis

## Mode Concentration — premier jalon fonctionnel
- [x] Intégrer les entrées/sorties à Orbit et les yeux de concentration de la mascotte existante
- [x] Parcours téléphone/ordinateur avec matières réelles, sources et introduction unique
- [x] Générer et conserver les leçons/quiz, réponses, preuves de compréhension et reprise
- [x] Préparer automatiquement un renforcement après une difficulté ; vérifier le parcours complet et l’isolation des données
- [x] Livrer le bilan du premier jalon dans CONCENTRATION-STATUS.md ; étapes avancées explicitement non terminées

## Page de présentation
- [x] Moderniser la page et présenter les fonctionnalités existantes avec aperçu interactif et FAQ
- [x] Vérifier les boutons, la démo et l'affichage sur téléphone et ordinateur
- [x] Adapter l’aperçu ordinateur avec navigation latérale, bloc-notes et semaine ; vérifier les trois onglets et préserver le téléphone
- [x] Rendre la présentation vidéo visible : section « Présentation » avec aperçu cliquable, lien dans la navigation, transition sans écran vide

## En cours : migration complète du backend vers le projet Supabase « orbit » de l'utilisateur
- [x] Utilisateur crée un projet Supabase vierge (supabase.com → New project)
- [x] Récupérer NEW_SUPABASE_DB_URL / NEW_SUPABASE_URL / NEW_SUPABASE_ANON_KEY / NEW_SUPABASE_SERVICE_ROLE_KEY via le formulaire sécurisé
- [x] Corriger les valeurs invalides (DB URL tronquée puis mot de passe refusé → reset mot de passe + URI session pooler ; connexion OK)
- [x] Demande « Activer Supabase pour ce projet » : expliqué que Lovable Cloud = moteur Supabase déjà actif, déconnexion impossible ; la migration vers le projet externe est la voie
- [x] Exécuter les SQL 00 → 01 → 03 → 04 → 05 sur la nouvelle base (8 comptes, 17 tables, 60 politiques RLS, 11 triggers + on_auth_user_created recréé car absent de l'export, données complètes ; GRANTs sandbox_exec et ALTER DEFAULT PRIVILEGES ignorés car spécifiques Lovable Cloud)
- [x] Copier les 23 fichiers storage (scripts/copy-storage.mjs) — 22 notes + 1 avatar, accès public/signé testé OK
- [x] Mettre à jour les URL stockées en base (fait via remplacement du ref dans le SQL 03 avant import ; vérifié 0 ancienne URL)
- [x] Déployer les 8 Edge Functions sur le nouveau projet (jeton d'accès reçu, déploiement CLI réussi : auth-email-hook, clean-subjects, generate-flashcards, generate-quiz, process-email-queue, process-note, smart-file, sync-calendar)
- [x] Migrer tous les automatismes : cron daily-sync-calendar vérifié (URL = nouveau projet, clé remplacée), secret vault email_queue_service_role_key créé, 8 fonctions déployées
- [x] IA rebranchée sur Gemini (_shared/ai.ts : GEMINI_API_KEY prioritaire, modèles gemini-3.6-flash / gemini-3.1-flash-image) ; secret posé et 5 fonctions redéployées sur orbit ; test clean-subjects OK
- [ ] E-mails : RESEND_API_KEY + SEND_EMAIL_HOOK_SECRET à recevoir, puis adapter auth-email-hook (signature standard-webhooks + envoi Resend) et activer le hook « Send Email » dans Auth → Hooks
- [ ] DNS notify.orbit-plan.com
- [x] Guide de branchement de l'app : ORBIT-SUPABASE.md (3 variables VITE_*)
- [ ] Export GitHub à lancer par l'utilisateur (menu + → GitHub)
- [ ] Livrer le dossier de migration mis à jour

## Nouveau : version ordinateur (PRD desktop)
- [x] Espace ordinateur (bibliothèque, quiz, fiches)
- [x] Import Google Drive par étudiant (à tester en vrai une fois connecté)
- [x] Quiz 5–20 questions + difficulté

## En attente / non bloquant
- Abonnement : reporté par l'utilisateur (pas de système pour l'instant) ; Stripe choisi comme prestataire futur ; table `subscribers` déjà créée en base comme fondation
- Vérification DNS notify.orbit-plan.com en attente
- Cours manquants le dimanche : conversion timezone non confirmée corrigée

## Nouveau : matières & semestres
- [x] Fiche de cours par matière (chapitres + contenus) synchronisée avec le bloc-notes du jour
- [x] Page Drive dans chaque matière : importer un PDF et le lire (fait : « Ajouter depuis Drive » + « Lire »)
- [x] Suivi des tâches par semestre (échéances, rappels) synchronisé avec le calendrier
