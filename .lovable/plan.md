

## Plan : Remplacer les cartes par une liste déroulante multi-sélection

### Constat
L'interface actuelle avec des cartes en grille est trop complexe pour l'utilisateur moyen. Une simple liste déroulante avec des cases à cocher (multi-select) est plus intuitive et standard.

### Changements

#### `src/components/GroupSelector.tsx`
Remplacer la grille de cartes par :
- Un composant basé sur `Popover` + `Command` (cmdk, déjà installé) qui fait office de combobox multi-select
- Chaque groupe apparaît comme une ligne avec une case à cocher, le code du groupe, et le nombre de cours
- Les groupes restent catégorisés par type (TP, TD, etc.) via des `CommandGroup`
- Les groupes sélectionnés s'affichent comme des badges sous le bouton déclencheur
- Le texte explicatif reste : "Choisis ton groupe de TP **et** ton groupe de TD"
- Garder le fallback manuel si aucun groupe détecté

#### `src/pages/SettingsPage.tsx`
Même approche pour la section groupe dans les paramètres :
- Remplacer les badges cliquables par un Popover multi-select similaire
- Afficher les sélections comme des badges en dessous

### Composants utilisés
- `Popover` + `PopoverTrigger` + `PopoverContent` (déjà dans le projet)
- `Command` / `CommandGroup` / `CommandItem` (cmdk, déjà installé)
- `Check` icon pour les items sélectionnés
- `Badge` pour afficher la sélection

### Pas de changement backend
Même format de stockage (`"TP1,TD1"` dans `ical_filter_group`), même logique de filtrage.

