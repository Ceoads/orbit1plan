# Roadmap

## En cours : création d'un projet Supabase neuf + migration complète du backend
- [ ] Utilisateur crée un projet Supabase vierge (supabase.com → New project)
- [ ] Récupérer NEW_SUPABASE_DB_URL / NEW_SUPABASE_URL / NEW_SUPABASE_ANON_KEY / NEW_SUPABASE_SERVICE_ROLE_KEY via le formulaire sécurisé
- [ ] Exécuter les SQL 00 → 01 → 03 → 04 sur la nouvelle base (remplacer qaansoasbfzjsxsqpcsb + placeholders `<NEW_PROJECT_REF>` / `<NEW_ANON_KEY>`)
- [ ] Copier les 23 fichiers storage (scripts/copy-storage.mjs)
- [ ] Déployer les 8 Edge Functions sur le nouveau projet
- [ ] Mettre à jour les URL stockées en base (notes_vault.media_url, vault_files.file_url/thumbnail_url, profiles.avatar_url) vers le nouveau domaine
- [ ] Guide : clé IA propre (le gateway Lovable n'existe pas hors Lovable Cloud), secrets e-mail (RESEND, SEND_EMAIL_HOOK_SECRET, vault email_queue_service_role_key), domaine notify.orbit-plan.com
- [ ] Livrer le dossier de migration mis à jour

## En attente / non bloquant
- Abonnement : pas de système existant, architecture cible documentée (à confirmer)
- Vérification DNS notify.orbit-plan.com en attente
- Cours manquants le dimanche : conversion timezone non confirmée corrigée
