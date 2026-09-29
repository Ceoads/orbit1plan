import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Créer une tâche",
  description: "Create a new task in the signed-in student's Orbit task list.",
  inputSchema: {
    title: z.string().trim().min(1).max(300).describe("Task title."),
    due_date: z.string().optional().describe("Optional due date (ISO 8601)."),
    energy_level: z.enum(["low", "medium", "high"]).default("medium"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, due_date, energy_level }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .insert({ user_id: ctx.getUserId(), title, due_date: due_date ?? null, energy_level })
      .select("id,title,status,due_date")
      .single();
    if (error) throw new ToolError(error.message);
    const task = { id: data.id, title: data.title, status: data.status, due_date: data.due_date };
    return { content: [{ type: "text", text: `Tâche créée : ${task.title}` }], structuredContent: { task } };
  },
});
