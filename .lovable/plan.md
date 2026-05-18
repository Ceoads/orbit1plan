## Objectif

Mémoriser la préférence de vue du Vault (liste/grille) entre les sessions, et confirmer/affiner la recherche OCR temps réel sur toutes les notes.

## 1. Persistance du mode de vue (liste / grille)

Stocker la préférence dans `profiles.preferences` (colonne jsonb déjà existante, déjà lue par TheVaultPage pour `vault_initialized`).

Dans `src/pages/TheVaultPage.tsx` :
- Au montage (dans le `useEffect` qui lit `profiles.preferences`), récupérer `prefs?.vault_view_mode` et l'utiliser comme valeur initiale de `viewMode` (fallback `"list"`).
- Pour éviter le flash, initialiser `viewMode` à `null` puis n'afficher la liste/grille qu'une fois la préférence chargée (ou garder `"list"` par défaut — flash minime).
- Lors du clic sur les boutons grille/liste, mettre à jour l'état local **et** persister via `supabase.from("profiles").update({ preferences: { ...prefs, vault_view_mode: mode } }).eq("user_id", user.id)`.
- Encapsuler dans un petit helper `setAndPersistViewMode(mode)` pour éviter la duplication.

Aucune migration n'est nécessaire : la colonne `preferences jsonb` existe déjà sur `profiles`.

## 2. Recherche OCR temps réel

La recherche existe déjà :
- `useVaultData.searchFiles(query)` filtre sur `extracted_text`, `ai_summary` et `tags` (insensible à la casse).
- L'input dans `TheVaultPage` met à jour `searchQuery` à chaque frappe → filtrage en temps réel, sur **tous** les fichiers de l'utilisateur (pas seulement la matière courante).
- Le placeholder mentionne déjà l'OCR.

Améliorations légères pour répondre clairement à la demande :
- S'assurer que cliquer sur la barre de recherche bascule en `isSearchMode` même depuis l'intérieur d'une matière (actuellement bloqué par `!inSubject`), afin que la recherche couvre toujours toutes les notes.
- Ajouter une mise en évidence du terme recherché dans `VaultFileCard` (surligner les occurrences dans `ai_summary` / extrait OCR) — optionnel mais utile.
- Afficher un petit compteur "Recherche dans X fichiers OCR" sous la barre quand `isSearchMode` est actif et vide.

## Détails techniques

Fichiers modifiés :
- `src/pages/TheVaultPage.tsx` — lecture/écriture de `preferences.vault_view_mode`, déblocage de `isSearchMode` depuis une matière, micro-UI search.
- (Optionnel) `src/components/vault/VaultFileCard.tsx` — surlignage du terme recherché (prop `highlight?: string`).

Aucun changement de base de données, aucune nouvelle dépendance.