

## Plan : Améliorer la sélection de groupe TP dans les paramètres et le setup

### Problème
Les utilisateurs peuvent recevoir des cours d'autres groupes TP (ex: TP1 reçoit les cours de TP2) car la sélection de groupe n'est pas assez claire et guidée.

### Ce qui existe déjà
- `GroupSelector.tsx` : détecte les groupes et permet de choisir pendant le setup wizard
- `SettingsPage.tsx` : champ texte libre + bouton scan pour le filtre de groupe
- `eventFilter.ts` : filtrage côté client des événements par groupe
- `sync-calendar/index.ts` : détection de patterns TP, TD, G1, etc. côté serveur
- `GROUP_PATTERNS` inclut déjà `/\b(TP\d+[A-Z]?)\b/gi` et `/\b(TD\d+[A-Z]?)\b/gi`

### Changements prévus

#### 1. Settings : Section "Groupe TP" dédiée et plus visible
**Fichier** : `src/pages/SettingsPage.tsx`
- Remplacer le simple champ texte "Filtre de Groupe" par une section plus guidée :
  - Bouton "Détecter mes groupes" qui scanne automatiquement l'URL iCal
  - Afficher les groupes détectés sous forme de **chips/badges cliquables** (pas un Select caché)
  - Mettre en surbrillance le groupe actuellement sélectionné
  - Garder l'option de saisie manuelle en dessous
  - Ajouter un texte explicatif clair : "Sélectionne ton groupe de TP pour ne voir que tes cours"
  - Après sélection, afficher un aperçu des prochains cours filtrés (réutiliser `previewOnly`)
  - Bouton "Enregistrer et Resynchroniser" qui sauvegarde le groupe ET relance la synchro

#### 2. Setup Wizard : Étape groupe plus explicite
**Fichier** : `src/components/GroupSelector.tsx`
- Améliorer la présentation des groupes détectés :
  - Afficher les groupes sous forme de **cartes cliquables** au lieu d'un Select dropdown
  - Chaque carte montre le code du groupe + nombre de cours
  - Ajouter un titre explicatif : "Dans quel groupe de TP es-tu ?"
  - La carte sélectionnée a un style "active" (bordure primaire, check icon)

#### 3. Filtrage côté client plus robuste
**Fichier** : `src/lib/eventFilter.ts`  
- Élargir `GROUP_REGEX` pour capter les patterns `TP1`, `TP2`, `TD1`, `TD2` en plus des patterns existants
- S'assurer que `TP1` et `TP2` sont bien distingués (pas de match partiel)

### Détails techniques
- Les groupes sont déjà détectés côté serveur via `GROUP_PATTERNS` qui inclut TP/TD
- Le filtre est stocké dans `user_settings.ical_filter_group`
- La synchro serveur filtre déjà via `eventMatchesGroup()`
- Le filtre client dans `eventFilter.ts` agit comme sécurité supplémentaire
- Pas de changement de schéma DB nécessaire

