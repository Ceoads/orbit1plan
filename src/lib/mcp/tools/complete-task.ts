import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "complete_task",
  title: "Terminer une tâche",
  description: "Mark one of the signed-in student's tasks as done (or back to todo).",
  inputSchema: {
    task_id: z.string().uuid(),
    done: z.boolean().default(true),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ task_id, done }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .update({ status: done ? "done" : "todo" })
      .eq("id", task_id)
      .select("id,title,status")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Task not found");
    const task = { id: data.id, title: data.title, status: data.status };
    return { content: [{ type: "text", text: `${task.title} → ${task.status}` }], structuredContent: { task } };
  },
});
