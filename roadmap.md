# Roadmap

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
- [ ] Secrets à fournir par l'utilisateur sur le nouveau projet : clé IA propre (le gateway Lovable n'existe pas hors Lovable Cloud), RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET + activer le hook « Send Email » dans Auth → Hooks, DNS notify.orbit-plan.com
- [ ] Guide : clé IA propre (le gateway Lovable n'existe pas hors Lovable Cloud), secrets e-mail (RESEND, SEND_EMAIL_HOOK_SECRET, vault email_queue_service_role_key), domaine notify.orbit-plan.com
- [ ] Livrer le dossier de migration mis à jour

## En attente / non bloquant
- Abonnement : reporté par l'utilisateur (pas de système pour l'instant) ; Stripe choisi comme prestataire futur ; table `subscribers` déjà créée en base comme fondation
- Vérification DNS notify.orbit-plan.com en attente
- Cours manquants le dimanche : conversion timezone non confirmée corrigée
