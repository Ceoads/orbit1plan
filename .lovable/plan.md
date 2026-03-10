

## Plan : Sélection multi-groupe (TP + TD) avec hiérarchie

### Problème
En fac française, les groupes sont hiérarchiques :
- TP1 et TP2 sont dans TD1
- TP3 et TP4 sont dans TD2
- Un étudiant en TP1 doit voir les cours TP1 **et** TD1, mais pas TP2

Le filtre actuel ne permet de sélectionner qu'un seul groupe, donc un étudiant TP1 rate ses cours de TD1 (ou voit tous les TD).

### Solution
Permettre la sélection de **plusieurs groupes** : l'utilisateur choisit son TP **et** son TD (et éventuellement son groupe CM/amphi).

### Changements prévus

#### 1. GroupSelector — Sélection multi-groupe
**Fichier** : `src/components/GroupSelector.tsx`
- Changer la sélection de "un seul groupe" à "plusieurs groupes"
- Catégoriser les groupes détectés par type (TP, TD, G, CM...) avec des sections séparées
- Titre explicatif : "Sélectionne ton groupe de TP **et** ton groupe de TD"
- Stocker la sélection comme une liste séparée par des virgules (ex: `"TP1,TD1"`)

#### 2. Settings — Affichage multi-badges
**Fichier** : `src/pages/SettingsPage.tsx`
- Permettre de sélectionner/désélectionner plusieurs badges de groupes
- Stocker en `"TP1,TD1"` dans `ical_filter_group`

#### 3. Filtrage côté serveur — Support multi-groupe
**Fichier** : `supabase/functions/sync-calendar/index.ts`
- `eventMatchesGroup` : parser `filterGroup` comme liste séparée par virgules
- Un événement passe si il matche **n'importe lequel** des groupes sélectionnés
- Un événement sans groupe passe toujours (cours magistral)

#### 4. Filtrage côté client — Support multi-groupe
**Fichier** : `src/lib/eventFilter.ts`
- `filterEventsByGroup` : parser `userGroup` comme liste de groupes
- Même logique : match si l'événement contient au moins un des groupes de l'utilisateur

### Pas de changement DB
Le champ `ical_filter_group` (texte) stocke déjà une string — on passe juste de `"TP1"` à `"TP1,TD1"`.

