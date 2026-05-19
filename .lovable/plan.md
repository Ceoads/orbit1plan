## Objectif

Permettre l'import de **plusieurs fichiers d'un coup** dans une matière du Vault (et depuis le bouton global), au lieu d'un seul fichier à la fois.

## Problème actuel

Les inputs `<input type="file">` du Vault n'ont pas l'attribut `multiple`. À chaque tap "Importer un fichier", on ne peut choisir qu'un seul PDF/doc/image, puis il faut recommencer toute la séquence (menu → upload → OCR → confirmation) pour le suivant. C'est bloquant quand on veut ajouter un cours complet (10 slides, 5 TD, etc.).

Les emplacements concernés :
- `src/components/vault/VaultAddContentMenu.tsx` — bouton "+" dans une matière (fichiers + photos).
- `src/pages/TheVaultPage.tsx` — FAB global du Vault (fichiers + photos).
- `src/components/vault/SmartVaultCapture.tsx` — capture intelligente (photos + PDF).

## Changements

### 1. Activer la sélection multiple

Ajouter `multiple` à tous les `<input type="file">` d'import (hors capture caméra, qui reste 1 photo à la fois côté natif iOS).

### 2. Traiter le batch en parallèle contrôlé

Dans chaque handler `onChange` :
- Lire `e.target.files` comme un `FileList` complet (au lieu de `files[0]`).
- Afficher un toast de progression unique : « Import de X fichiers… » avec un compteur live.
- Itérer avec une concurrence limitée (3 en parallèle) pour ne pas saturer le réseau / l'OCR.
- Pour chaque fichier : upload Storage → signed URL → `createFile` → OCR si image.
- À la fin : toast récap « X fichiers ajoutés • Y en erreur » + un seul `refetch()`.

### 3. UX pendant l'import

- Le bouton "+" reste en état `isProcessing` (loader) jusqu'à la fin du batch.
- Si un fichier dépasse 20 Mo (limite Supabase Storage), il est sauté avec un toast d'avertissement nommant le fichier.
- L'auto-filing AI (suggestion de matière) ne s'active que sur le FAB global ; dans une matière, tous les fichiers vont directement dedans avec `filing_status: "confirmed"` (comportement actuel conservé).

### 4. Flashcards / OCR

L'OCR par image et la génération de flashcards restent **par fichier** (non groupés). Pour éviter de spammer l'API quand on importe 20 photos, on garde l'OCR mais on ne déclenche **pas** automatiquement la génération de flashcards en mode batch — un toast invitera l'utilisateur à le faire depuis le fichier ou la matière.

## Détails techniques

### Fichiers modifiés

- `src/components/vault/VaultAddContentMenu.tsx`
  - Input fichier : ajouter `multiple`.
  - Renommer `uploadAndProcess(file)` → `uploadAndProcessBatch(files: File[])`.
  - Helper `runWithConcurrency(files, 3, processOne)` interne, pas de nouvelle dépendance.
  - Toast progression via `toast.loading(id)` + `toast.success(id)`.

- `src/pages/TheVaultPage.tsx`
  - Mêmes changements sur l'input fichier du FAB (ligne ~689).
  - `uploadFile` → `uploadFiles(files, isPhoto)` avec la même logique de concurrence.

- `src/components/vault/SmartVaultCapture.tsx`
  - Input PDF/image (ligne ~283) : ajouter `multiple` et itérer.
  - L'input caméra (ligne ~275) reste single (capture native).

### Pas de changement DB

Aucune migration, aucune nouvelle RLS — on réutilise `vault_files` + bucket `notes`.

### Limite Storage

Supabase Storage : 20 Mo / fichier par défaut sur le bucket `notes`. Pas de changement, juste un message clair quand un fichier dépasse.

## Hors scope

- Import d'un **dossier entier** avec arborescence (drag-and-drop d'un folder) — possible avec `webkitdirectory`, à proposer dans un second temps si besoin.
- Partage de fichiers à d'autres utilisateurs (collaboration) — pas demandé ici.
- Upload en arrière-plan persistant (Service Worker) — l'import reste lié à la session active.
