# Roadmap

## En cours : migration backend vers le Supabase de l'utilisateur
- [ ] Confirmer que l'utilisateur a créé son projet Supabase
- [ ] Récupérer la chaîne de connexion DB + clé service role (à stocker en secrets, jamais affichées)
- [ ] Exécuter les SQL 00 → 01 → 03 → 04 sur la nouvelle base (placeholders `<NEW_PROJECT_REF>` / `<NEW_ANON_KEY>` remplacés)
- [ ] Copier les 23 fichiers storage (`scripts/copy-storage.mjs`)
- [ ] Déployer les 8 Edge Functions sur le nouveau projet
- [ ] Guide : nouvelles clés IA (gateway Lovable non disponible hors Lovable Cloud), secrets e-mail, domaine notify.orbit-plan.com
- [ ] Livrer un dossier de migration mis à jour

## En attente / non bloquant
- Abonnement : pas de système existant, architecture cible documentée (à confirmer)
- Vérification DNS notify.orbit-plan.com en attente
- Cours manquants le dimanche : conversion timezone non confirmée corrigée
