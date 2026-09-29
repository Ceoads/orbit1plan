import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_schedule",
  title: "Emploi du temps",
  description: "List the signed-in student's upcoming classes and exams between two dates.",
  inputSchema: {
    from: z.string().optional().describe("Start date YYYY-MM-DD (default today)."),
    to: z.string().optional().describe("End date YYYY-MM-DD (default +7 days)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const start = from ?? new Date().toISOString().slice(0, 10);
    const end = to ?? new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("calendar_events")
      .select("id,title,event_date,start_time,end_time,room_number,teacher_name,event_type")
      .gte("event_date", start)
      .lte("event_date", end)
      .order("event_date")
      .order("start_time")
      .limit(200);
    if (error) throw new ToolError(error.message);
    const events = (data ?? []).map((e) => ({
      id: e.id, title: e.title, date: e.event_date, start: e.start_time, end: e.end_time,
      room: e.room_number, teacher: e.teacher_name, type: e.event_type,
    }));
    return { content: [{ type: "text", text: JSON.stringify(events) }], structuredContent: { events } };
  },
});
