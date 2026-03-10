import { CalendarEvent } from "@/hooks/useOrbitData";

// Group identifier patterns (e.g., "G1 A", "G1A", "Groupe A", "TC2 G1 B", "TP1", "TD2", "TP1A")
const GROUP_REGEX = /\b(?:TC\d+\s+)?(?:G\d+\s*[A-Z]|Groupe\s+[A-Z]|TP\d+[A-Z]?|TD\d+[A-Z]?)\b/gi;

// Optional/shared event keywords
const OPTIONAL_KEYWORDS = [
  "atelier",
  "permanence",
  "réunion",
  "tous groupes",
  "facultatif",
  "optionnel",
];

export interface FilteredEvent extends CalendarEvent {
  isOptional?: boolean;
}

/**
 * Normalize a group string for comparison: lowercase, collapse spaces.
 * "TC2 G1 A" → "tc2 g1 a", "G1A" → "g1a"
 */
const normalizeGroup = (g: string): string =>
  g.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Check if two group identifiers match, accounting for spacing variations.
 * "G1 A" matches "G1A" and "G1 A"
 */
const groupsMatch = (eventGroup: string, userGroup: string): boolean => {
  const a = normalizeGroup(eventGroup).replace(/\s/g, "");
  const b = normalizeGroup(userGroup).replace(/\s/g, "");
  return a === b;
};

/**
 * Extract all group identifiers from an event title.
 */
const extractGroups = (title: string): string[] => {
  const matches = title.match(GROUP_REGEX);
  return matches || [];
};

/**
 * Check if an event title contains optional/shared keywords.
 */
const isOptionalEvent = (title: string): boolean => {
  const lower = title.toLowerCase();
  return OPTIONAL_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Filter calendar events based on the user's selected group.
 *
 * Rules:
 * - No user group set → return all events unfiltered
 * - Event has no group identifier → SHOW (full-class event)
 * - Event contains user's group → SHOW
 * - Event contains a different group → HIDE
 * - Event contains optional keywords → SHOW with isOptional=true
 */
export const filterEventsByGroup = (
  events: CalendarEvent[],
  userGroup: string | null | undefined
): FilteredEvent[] => {
  // No group filter set — return everything
  if (!userGroup || userGroup.trim() === "") {
    return events;
  }

  // Extract the group parts from the user's full group string
  // e.g., "TC2 G1 A" → we extract ["TC2 G1 A", "G1 A"] for matching
  const userGroups = extractGroups(userGroup);
  // Also use the full string as a match candidate
  const allUserPatterns = [userGroup, ...userGroups];

  return events.reduce<FilteredEvent[]>((acc, event) => {
    const title = event.title || "";

    // Check optional keywords first
    if (isOptionalEvent(title)) {
      acc.push({ ...event, isOptional: true });
      return acc;
    }

    // Extract group identifiers from event title
    const eventGroups = extractGroups(title);

    // No group identifier in event → it's a full-class event, show it
    if (eventGroups.length === 0) {
      acc.push(event);
      return acc;
    }

    // Check if any event group matches any user group pattern
    const matches = eventGroups.some((eg) =>
      allUserPatterns.some((ug) => groupsMatch(eg, ug))
    );

    if (matches) {
      acc.push(event);
    }
    // else: different group → hide

    return acc;
  }, []);
};
