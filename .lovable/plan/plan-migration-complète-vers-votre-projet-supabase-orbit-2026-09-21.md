# Plan — Migration complète vers votre projet Supabase « orbit »

## État vérifié

- 3 clés sur 4 sont valides : URL du projet, clé anon, clé service_role (testées avec succès).
- La chaîne de connexion base de données est invalide : seulement 3 caractères (« dej »), copie tronquée.
- Le dossier de migration est prêt : SQL 00→05, 23 fichiers du Vault, scripts, 9 fonctions backend.

## Étape 1 — Vous : récupérer la bonne chaîne de connexion

1. Sur le tableau de bord de votre projet Supabase, cliquez sur le bouton **« Connect »** en haut de la page.
2. Dans la fenêtre, copiez l'URI **« Session pooler »** : `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-...pooler.supabase.com:5432/postgres`
3. Remplacez `[YOUR-PASSWORD]` par le mot de passe de base choisi à la création du projet (si le mot de passe contient `@ # : / ?`, encodez-le : `@` → `%40`).
4. Je rouvrirai le formulaire sécurisé pour que vous la colliez.

## Étape 2 — Moi : exécuter la migration (automatique dès la clé reçue)

1. Test de connexion à la nouvelle base.
2. Exécution des SQL dans l'ordre : comptes utilisateurs (00) → structure complète : 17 tables, fonctions, déclencheurs, politiques de sécurité (01) → toutes les données (03) → stockage, extensions et tâches planifiées (04) → table abonnements (05). Les références à l'ancien projet sont remplacées par les vôtres automatiquement.
3. Copie des 23 fichiers du Vault (notes + avatars) vers le stockage du nouveau projet.
4. Mise à jour des adresses de fichiers enregistrées en base vers le nouveau domaine.
5. Vérification : comptage des lignes par table et contrôle d'accès aux fichiers.

## Étape 3 — Déploiement des fonctions backend (avec vous)

Les 9 fonctions (synchro iCal, OCR, quiz, flashcards, e-mails…) se déploient via l'outil en ligne de commande Supabase, qui exige un **jeton d'accès personnel** (supabase.com/dashboard/account/tokens). Je vous guiderai pour le créer et le coller dans le formulaire sécurisé, puis je déploie tout.

## Étape 4 — Secrets et services à recréer sur le nouveau projet

- Clé IA propre (le service d'IA de Lovable Cloud n'existe pas hors Lovable Cloud).
- Secrets e-mail (Resend, signature des e-mails d'authentification).
- Reconfiguration du domaine d'envoi notify.orbit-plan.com.

## Important — connexion de l'app

L'app dans Lovable reste branchée sur Lovable Cloud (fichier de configuration généré automatiquement, non modifiable). Le basculement vers votre projet se fait **après export du code vers votre GitHub**, en renseignant 3 variables d'environnement (URL + clé anon) — je fournirai le guide. Jusque-là, l'app continue de fonctionner normalement sur Lovable Cloud.

## Détails techniques

- Remplacements automatiques dans les SQL : ancien identifiant de projet → nouveau, jeton anon → le vôtre.
- Copie de stockage : `scripts/copy-storage.mjs` (clé service_role, jamais affichée).
- Aucun secret n'apparaît en clair : tout passe par le formulaire sécurisé et les variables d'environnement.
