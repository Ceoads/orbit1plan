import { supabase } from "@/integrations/supabase/client";

export type PadKind = "task" | "exam";
export interface PadItem { id: string; kind: PadKind; text: string; taskId?: string | null }

/** Notepad "day" starts at 07:30 Europe/Paris. Returns YYYY-MM-DD of the current cycle. */
export const parisCycleKey = (now = new Date()) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(now).map((x) => [x.type, x.value])
  );
  const mins = (Number(p.hour) % 24) * 60 + Number(p.minute);
  const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
  if (mins < 7 * 60 + 30) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Adds a "à réviser" line to today's notepad and creates the linked task (same behaviour as typing it in the notepad). */
export async function sendToTodayNotepad(userId: string, text: string, subjectId?: string | null) {
  const due = new Date(); due.setHours(23, 59, 0, 0);
  const { data: task } = await supabase.from("tasks").insert({
    user_id: userId, title: text, priority_score: 70, energy_level: "medium", due_date: due.toISOString(), subject_id: subjectId ?? null,
  }).select("id").single();
  const cycle = parisCycleKey();
  const { data } = await supabase.from("daily_notepads").select("items").eq("user_id", userId).eq("cycle_date", cycle).maybeSingle();
  const items = ((data?.items as unknown) as PadItem[]) || [];
  const next = [...items, { id: crypto.randomUUID(), kind: "task" as const, text, taskId: task?.id ?? null }];
  const { error } = await supabase.from("daily_notepads").upsert({ user_id: userId, cycle_date: cycle, items: next as never }, { onConflict: "user_id,cycle_date" });
  if (error) throw error;
}
