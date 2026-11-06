import { z } from "npm:zod@3";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const id = z.string().uuid();
export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("file_document"), fileId: id, subjectId: id }),
  z.object({ type: z.literal("create_task"), title: z.string().trim().min(1).max(200), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable(), subjectId: id.optional().nullable() }),
  z.object({ type: z.literal("complete_task"), taskId: id }),
  z.object({ type: z.literal("delete_item"), kind: z.enum(["document", "task", "flashcard"]), id }),
  z.object({ type: z.literal("undo_file"), fileId: id, subjectId: id.nullable(), semesterId: id.nullable() }),
  z.object({ type: z.literal("undo_complete"), taskId: id }),
]);
export type OrbitAction = z.infer<typeof ActionSchema>;

type Result = { ok: true; message: string; undo?: OrbitAction } | { ok: false; error: string };

function semesterFor(createdAt: string, sems: { id: string; start_date: string; end_date: string }[]) {
  const d = createdAt.slice(0, 10);
  const hits = sems.filter((s) => s.start_date <= d && d <= s.end_date);
  return hits.length === 1 ? hits[0].id : null;
}

/** Executes one confirmed action. Every query is scoped to the authenticated user. */
export async function executeAction(admin: SupabaseClient, userId: string, a: OrbitAction): Promise<Result> {
  const own = async (table: string, rowId: string, cols = "id") =>
    (await admin.from(table).select(cols).eq("id", rowId).eq("user_id", userId).maybeSingle()).data as Record<string, any> | null;
  const subjectName = async (sid: string | null | undefined) => (sid ? (await own("subjects", sid, "id,name"))?.name ?? null : null);

  switch (a.type) {
    case "file_document": {
      const f = await own("vault_files", a.fileId, "id,original_filename,subject_id,semester_id,created_at");
      const name = await subjectName(a.subjectId);
      if (!f || !name) return { ok: false, error: "Document ou matière introuvable." };
      const { data: sems } = await admin.from("semesters").select("id,start_date,end_date").eq("user_id", userId);
      const semesterId = f.semester_id ?? semesterFor(f.created_at, sems ?? []);
      const { error } = await admin.from("vault_files").update({ subject_id: a.subjectId, semester_id: semesterId, filing_status: "confirmed" }).eq("id", f.id).eq("user_id", userId);
      if (error) return { ok: false, error: "Le rangement a échoué." };
      return { ok: true, message: `« ${f.original_filename ?? "Document"} » rangé dans ${name}.`, undo: { type: "undo_file", fileId: f.id, subjectId: f.subject_id, semesterId: f.semester_id } };
    }
    case "undo_file": {
      const { error } = await admin.from("vault_files").update({ subject_id: a.subjectId, semester_id: a.semesterId }).eq("id", a.fileId).eq("user_id", userId);
      return error ? { ok: false, error: "Annulation impossible." } : { ok: true, message: "Rangement annulé." };
    }
    case "create_task": {
      if (a.subjectId && !(await subjectName(a.subjectId))) return { ok: false, error: "Matière introuvable." };
      const { error } = await admin.from("tasks").insert({ user_id: userId, title: a.title, due_date: a.dueDate ?? null, subject_id: a.subjectId ?? null });
      return error ? { ok: false, error: "Le devoir n'a pas pu être créé." } : { ok: true, message: `Devoir « ${a.title} » créé.` };
    }
    case "complete_task": {
      const t = await own("tasks", a.taskId, "id,title");
      if (!t) return { ok: false, error: "Devoir introuvable." };
      await admin.from("tasks").update({ status: "done" }).eq("id", t.id).eq("user_id", userId);
      return { ok: true, message: `« ${t.title} » terminé.`, undo: { type: "undo_complete", taskId: t.id } };
    }
    case "undo_complete": {
      const { error } = await admin.from("tasks").update({ status: "todo" }).eq("id", a.taskId).eq("user_id", userId);
      return error ? { ok: false, error: "Annulation impossible." } : { ok: true, message: "Devoir remis à faire." };
    }
    case "delete_item": {
      const table = a.kind === "document" ? "vault_files" : a.kind === "task" ? "tasks" : "flashcards";
      if (!(await own(table, a.id))) return { ok: false, error: "Élément introuvable." };
      const { error } = await admin.from(table).delete().eq("id", a.id).eq("user_id", userId);
      return error ? { ok: false, error: "La suppression a échoué." } : { ok: true, message: "Élément supprimé." };
    }
  }
}

/** Builds the per-subject context so Orbit sees everything tied to each subject. */
export async function subjectContext(admin: SupabaseClient, userId: string, today: string) {
  const [subjects, files, cards, paths, concepts, exams, tasks, grades] = await Promise.all([
    admin.from("subjects").select("id,name").eq("user_id", userId).limit(60),
    admin.from("vault_files").select("id,original_filename,subject_id,ai_summary,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(80),
    admin.from("flashcards").select("id,subject_id,mastered,question").eq("user_id", userId).limit(500),
    admin.from("learning_paths").select("id,subject_id,title,status").eq("user_id", userId).limit(30),
    admin.from("learning_concepts").select("path_id,mastery").eq("user_id", userId).limit(500),
    admin.from("calendar_events").select("title,exam_date,subject_id").eq("user_id", userId).eq("event_type", "exam").gte("exam_date", today).order("exam_date").limit(15),
    admin.from("tasks").select("id,title,due_date,subject_id").eq("user_id", userId).eq("status", "todo").order("due_date").limit(30),
    admin.from("grades").select("label,value,max_value,coefficient,subject_id").eq("user_id", userId).order("grade_date", { ascending: false }).limit(30),
  ]);
  const subs = subjects.data ?? [];
  const name = (sid: string | null) => subs.find((s) => s.id === sid)?.name ?? "sans matière";
  const blocks = subs.map((s) => {
    const f = (files.data ?? []).filter((x) => x.subject_id === s.id);
    const c = (cards.data ?? []).filter((x) => x.subject_id === s.id);
    const p = (paths.data ?? []).filter((x) => x.subject_id === s.id).map((x) => {
      const cs = (concepts.data ?? []).filter((k) => k.path_id === x.id);
      const m = cs.length ? Math.round((cs.reduce((a, k) => a + Number(k.mastery), 0) / cs.length) * 100) : 0;
      return `${x.title} (${m} % maîtrisé)`;
    });
    const e = (exams.data ?? []).filter((x) => x.subject_id === s.id).map((x) => `${x.title} le ${x.exam_date}`);
    return [
      `## ${s.name} [subjectId=${s.id}]`,
      f.length ? `Documents :\n${f.slice(0, 15).map((x) => `- ${x.original_filename ?? "Document"} [fileId=${x.id}]${x.ai_summary ? ` — ${x.ai_summary.slice(0, 120)}` : ""}`).join("\n")}` : "Documents : aucun",
      `Fiches : ${c.length} dont ${c.filter((x) => x.mastered).length} maîtrisées`,
      p.length ? `Parcours Concentration : ${p.join(", ")}` : "",
      e.length ? `Examens à venir : ${e.join(", ")}` : "",
    ].filter(Boolean).join("\n");
  });
  const orphans = (files.data ?? []).filter((x) => !x.subject_id);
  const ctx = [
    `Matières :\n${blocks.join("\n\n") || "aucune"}`,
    orphans.length ? `Documents sans matière :\n${orphans.map((x) => `- ${x.original_filename ?? "Document"} [fileId=${x.id}]`).join("\n")}` : "",
    `Devoirs à faire :\n${(tasks.data ?? []).map((t) => `- ${t.title} · ${name(t.subject_id)}${t.due_date ? ` (échéance ${t.due_date.slice(0, 10)})` : ""} [taskId=${t.id}]`).join("\n") || "aucun"}`,
    `Notes chiffrées :\n${(grades.data ?? []).map((g) => `- ${name(g.subject_id)} · ${g.label} : ${g.value}/${g.max_value} (coef ${g.coefficient})`).join("\n") || "aucune"}`,
  ].filter(Boolean).join("\n\n");
  return ctx.slice(0, 12000);
}

export const ACTION_PROMPT = `\n\nTu peux proposer UNE action quand l'étudiant le demande clairement (ranger un document, créer un devoir, terminer un devoir, supprimer un document/devoir/fiche). Utilise uniquement les identifiants entre crochets ci-dessus, jamais inventés. Termine alors ta réponse par un bloc exactement de cette forme :
\`\`\`orbit-action
{"type":"file_document","fileId":"…","subjectId":"…","label":"Ranger « nom » dans Matière ?"}
\`\`\`
Types : file_document {fileId, subjectId} · create_task {title, dueDate?: "AAAA-MM-JJ", subjectId?} · complete_task {taskId} · delete_item {kind: "document"|"task"|"flashcard", id}. Ajoute toujours "label" : une courte question de confirmation en français. Dis à l'étudiant que rien ne change avant sa confirmation. N'affirme jamais qu'une action est faite.`;
