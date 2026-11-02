export type ClassEvent = {
  subject_id: string | null;
  start_time: string;
  end_time: string;
  day_of_week?: number | null;
  event_date?: string | null;
  event_type?: string | null;
};

export type ClassSuggestion = { subjectId: string; reason: "current" | "recent" | "next"; startTime: string };

const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Picks a subject from today's classes: current class, else one ended < 2h ago, else the next one. */
export function suggestSubjectFromToday(events: ClassEvent[], now = new Date()): ClassSuggestion | null {
  const today = localDate(now);
  const t = now.getHours() * 60 + now.getMinutes();
  const classes = events
    .filter((e) => e.subject_id && (e.event_type ?? "class") === "class")
    .filter((e) => (e.event_date ? e.event_date.slice(0, 10) === today : e.day_of_week === now.getDay()))
    .map((e) => ({ e, s: mins(e.start_time), end: mins(e.end_time) }))
    .sort((a, b) => a.s - b.s);
  const pick = (c: (typeof classes)[number] | undefined, reason: ClassSuggestion["reason"]) =>
    c ? { subjectId: c.e.subject_id as string, reason, startTime: c.e.start_time.slice(0, 5) } : null;
  const current = classes.find((c) => c.s <= t && c.end >= t);
  if (current) return pick(current, "current");
  const recent = classes.filter((c) => c.end < t && t - c.end <= 120).pop();
  if (recent) return pick(recent, "recent");
  return pick(classes.find((c) => c.s > t), "next");
}
