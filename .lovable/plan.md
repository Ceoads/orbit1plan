## Objectif

Remplacer le duo `Settings + LogOut` dans le header par un **avatar circulaire unique** qui ouvre la page `/settings` (push iOS classique). Restructurer cette page en **Hero Profil + blocs cartes hiérarchisés**, avec la déconnexion logée dans une « Zone de danger » en bas.

---

## 1. Header — avatar unique avec possibilité d'ajouter une photo bien crop

Fichier : `src/components/CollapsibleHeader.tsx`

- Supprimer les deux boutons icônes (`Settings`, `LogOut`) et la prop `onSignOut`.
- Remplacer par un **bouton avatar 36×36 rond** à droite :
  - Image de profil si disponible, sinon **initiales** sur fond dégradé Peach/Coral (cohérent avec la palette Orbit).
  - Anneau subtil `ring-1 ring-border/40`, `active:scale-95`, haptique `selection` au tap.
  - Tap → `navigate('/settings')`.
- `showSettings` reste la condition d'affichage de l'avatar (caché pendant setup/onboarding).
- Mettre à jour `src/pages/Index.tsx` pour retirer `onSignOut` du header (la déconnexion vit désormais dans `/settings`).

## 2. Page Profil — restructuration

Fichier : `src/pages/SettingsPage.tsx` (titre mis à jour, contenu réorganisé)

### Header de page (épuré)

- Gauche : `IOSBackButton` (← Retour).
- Centre : titre **« Profil »** (Outfit, semibold).
- Droite : vide (équilibre visuel).
- Transition push native déjà gérée par React Router + `SwipeablePages` ; pas de changement de routing.

### Hero Block (haut de page)

Carte blanche `rounded-3xl` :

- Avatar **64×64** (image ou initiales avec dégradé Peach).
- Nom (`display_name` depuis `profiles`, fallback = local-part de l'email).
- Sous-texte gris discret : groupe TP/TD principal détecté depuis `user_settings.ical_filter_group` (ex. *TC2 G1*), ou e-mail si non configuré.

### Bloc 1 — Emploi du temps

Réutilise les contrôles existants :

- Lien ADE/Hyperplanning + bouton QR Code.
- Groupes TP / TD (combobox actuelle).
- Bouton primaire « Enregistrer et synchroniser » (saumon, pleine largeur).

### Bloc 2 — Automatisation & Statut

- Switch *Sync automatique*.
- Ligne cliquable *Resynchroniser maintenant*.
- Metadata gris clair `text-[11px]` : *Dernière synchro : 17 mai à 23h44* (depuis `user_settings.last_synced_at`).

### Bloc 3 — Fonctionnalités intelligentes

- Filtrage par groupe.
- Détection auto des examens.
- Extraction des salles.
- Séparateur fin puis ligne discrète *Réinitialiser le Vault* (gris).

### Bloc 4 — Support & Tutoriels

- Position du campus (Localisation).
- Relancer le tutoriel.

### Bloc 5 — Zone de danger

Carte isolée, légèrement détachée :

- *Se déconnecter* (icône `LogOut` discrète, texte neutre).
- *Supprimer toutes mes données* (rouge soft, conservé).

### Footer

Hors cartes, centré, `text-[11px] text-muted-foreground` :

- Aide & Support · Politique de confidentialité
- *Orbit OS — v1.0.0 (Production)*

---

## Détails techniques

- **Avatar component** : nouveau petit composant `src/components/ProfileAvatar.tsx` (taille variable `sm`/`lg`) — initiales calculées depuis `display_name || email`, dégradé `from-[hsl(var(--peach))] to-[hsl(var(--coral))]`. Réutilisé dans le header et le Hero.
- **Données profil** : récupérer `profiles.display_name` + `user_settings.ical_filter_group` dans `SettingsPage` (une seule requête combinée au mount).
- **Déconnexion** : importer `useAuth().signOut` directement dans `SettingsPage` pour la ligne Bloc 5.
- **Aucune migration DB** nécessaire (champs existants suffisent ; pas d'avatar_url demandé).
- **Routing inchangé** : `/settings` continue de monter `SettingsPage`, le push iOS est déjà fourni par la navigation existante.
- **Tokens design** : strictement `hsl(var(--*))` Peach/Coral/Cream, `rounded-3xl`, `shadow-[0_8px_30px_rgb(0,0,0,0.03)]`, fonts Outfit/Quicksand — aucune couleur en dur.
- **Hit targets** : avatar header et toutes les lignes ≥ 44×44 pt.

---

## Hors scope (à confirmer si souhaité plus tard)

- Upload d'une vraie photo de profil (ajout colonne `avatar_url` + bucket storage).
- Slide-up sheet alternatif (l'utilisateur a explicitement choisi le push classique).