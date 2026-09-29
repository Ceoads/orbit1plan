import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "Lister les tâches",
  description: "List the signed-in student's Orbit tasks, optionally filtered by status.",
  inputSchema: {
    status: z.enum(["todo", "done", "all"]).default("todo").describe("Filter by status."),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    let q = supabaseForUser(ctx)
      .from("tasks")
      .select("id,title,status,due_date,energy_level,priority_score")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const tasks = (data ?? []).map((t) => ({
      id: t.id, title: t.title, status: t.status, due_date: t.due_date,
      energy_level: t.energy_level, priority_score: t.priority_score,
    }));
    return { content: [{ type: "text", text: JSON.stringify(tasks) }], structuredContent: { tasks } };
  },
});
