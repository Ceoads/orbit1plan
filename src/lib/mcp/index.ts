import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTasks from "./tools/list-tasks";
import createTask from "./tools/create-task";
import completeTask from "./tools/complete-task";
import listSchedule from "./tools/list-schedule";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "orbit-plan",
  title: "Orbit plan",
  version: "0.1.0",
  instructions:
    "Orbit is a student assistant. Use `list_schedule` for classes/exams, `list_tasks` to see tasks, `create_task` to add one, and `complete_task` to mark one done. All data belongs to the signed-in student.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSchedule, listTasks, createTask, completeTask],
});
