import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { cn } from "@/lib/utils";

type Filter = "all" | "todo" | "done";

const fmtDue = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export const TasksPage = () => {
  const { tasks, subjects, toggleTask, createTask, getSubjectById } = useOrbitData();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => !t.is_subtask)
      .filter((t) => {
        if (filter === "todo") return t.status === "todo";
        if (filter === "done") return t.status === "done";
        return true;
      })
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
  }, [tasks, filter]);

  const handleToggle = (id: string) => {
    haptics.success();
    sounds.tap();
    toggleTask(id);
  };

  return (
    <div className="font-mono pb-32">
      {/* Title */}
      <h1 className="text-mono-title text-foreground">Devoirs</h1>

      {/* Filter tabs */}
      <div className="mt-10 flex gap-8 border-b border-[hsl(var(--border))]">
        {[
          { id: "all" as Filter, label: "All" },
          { id: "todo" as Filter, label: "In Progress" },
          { id: "done" as Filter, label: "Completed" },
        ].map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.selection();
                sounds.tap();
                setFilter(tab.id);
              }}
              className={cn(
                "relative pb-3 text-[12px] font-medium tracking-[0.04em] transition-colors duration-150 ease-out",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-mono-body text-foreground">
            {filter === "done"
              ? "Aucune tâche terminée"
              : "Tous tes devoirs sont faits"}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {filtered.map((task) => {
            const subject = getSubjectById(task.subject_id);
            const done = task.status === "done";
            return (
              <div
                key={task.id}
                className={cn(
                  "bg-card border border-[hsl(var(--border))] rounded-[12px] p-7 transition-all duration-200 ease-out",
                  "hover:border-[hsl(var(--border-hover))]",
                  done && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => handleToggle(task.id)}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-mono-body text-foreground",
                        done && "line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    {subject && (
                      <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mt-2">
                        {subject.name}
                      </p>
                    )}
                    {task.due_date && (
                      <p className="text-mono-meta mt-1">{fmtDue(task.due_date)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add task button */}
      <button
        onClick={() => {
          haptics.soft();
          sounds.tap();
          setShowAdd(true);
        }}
        className="mt-14 w-full h-[52px] bg-primary text-primary-foreground rounded-[12px] font-mono text-sm font-medium flex items-center justify-center gap-2 transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add task
      </button>

      <AddTaskModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={async (data) => {
          await createTask(data);
          setShowAdd(false);
        }}
        subjects={subjects}
      />
    </div>
  );
};
