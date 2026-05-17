# Calendrier — vue Liste uniquement

Objectif : supprimer la vue grille hebdomadaire et ne garder que la vue Liste "Aujourd'hui", en s'assurant que chaque cours cliqué ouvre les mêmes détails que dans l'ancienne vue emploi du temps (Course Hub avec Auto-Vault, génération de flashcards et de quiz). Les examens conservent l'ouverture de la `ExamDetailModal`.

## Changements

### `src/components/calendar/CalendarPocketSpace.tsx`
- Supprimer l'état `viewMode` et le bouton toggle (icônes `LayoutList` / `CalendarRange`).
- Supprimer l'import et le rendu de `WeeklyTimeGrid` ainsi que la logique de swipe horizontal `handleHorizontalSwipe` / `drag="x"` sur le conteneur de vue (la vue Liste a déjà sa propre semaine cliquable).
- Garder le header compact : bouton retour, mois/année avec date-picker, bouton "Aujourd'hui", flèches `prev` / `next` semaine. Les flèches déplacent `currentWeekStart` ET mettent à jour `selectedDate` pour rester cohérent (sinon les flèches semblent sans effet en vue Liste).
- Rendre uniquement `<CalendarTodayList ... onEventClick={handleEventClick} />`.
- Ajouter `handleEventClick(event)` :
  - si `event.event_type === 'exam'` → `setSelectedExam(event)` (ouvre `ExamDetailModal`),
  - sinon → `navigate(\`/course/\${event.id}\`)` puis `onClose()` pour fermer le pocket space (mêmes étapes que `WeeklyTimeGrid.handleEventClick`).
  - Ajouter `useNavigate` depuis `react-router-dom`.
- Nettoyer la logique de scroll : `CalendarTodayList` utilise déjà la classe `calendar-scroll-container`, donc le listener existant continue de fonctionner pour le drag-to-dismiss conditionnel.

### `src/components/calendar/CalendarTodayList.tsx`
- Aucun changement structurel — le prop `onEventClick` existe déjà et est appelé sur chaque carte de cours. Vérifier juste qu'il est branché depuis le parent.

### `src/components/calendar/index.ts`
- Optionnel : retirer l'export de `WeeklyTimeGrid` si plus aucun consommateur ne l'utilise. À vérifier avec `rg "WeeklyTimeGrid"` ; si d'autres écrans (ex. `SchedulePage`, `ScheduleCalendar`, `ScheduleWidget`) l'utilisent encore, on laisse le fichier en place et on retire seulement l'usage dans `CalendarPocketSpace`.

## Comportement final
- Ouverture du Calendar Pocket Space → vue Liste "aujourd'hui" directement, avec la bande hebdo cliquable, groupes Matin/Après-midi/Soir et dock flottant.
- Tap sur un cours → navigation vers `/course/:id` (Course Hub : Auto-Vault, flashcards, quiz, notes, etc.).
- Tap sur un examen → `ExamDetailModal` comme avant.
- Flèches `< >` et bouton "Aujourd'hui" naviguent toujours, mais à l'échelle de la semaine affichée dans la bande et de la date sélectionnée.
