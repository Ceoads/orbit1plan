import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon, Zap, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Subject } from "@/hooks/useOrbitData";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200, "Title too long"),
});

interface CreateTaskDialogProps {
  subjects: Subject[];
  onCreateTask: (data: {
    title: string;
    energy_level: 'low' | 'medium' | 'high';
    due_date: string | null;
    subject_id: string | null;
    priority_score: number;
  }) => Promise<any>;
}

export const CreateTaskDialog = ({ subjects, onCreateTask }: CreateTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    
    const result = taskSchema.safeParse({ title });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: result.data.title,
        energy_level: energyLevel,
        due_date: dueDate ? dueDate.toISOString() : null,
        subject_id: subjectId || null,
        priority_score: energyLevel === 'high' ? 80 : energyLevel === 'medium' ? 60 : 40,
      });
      
      // Reset form
      setTitle("");
      setEnergyLevel('medium');
      setDueDate(undefined);
      setSubjectId("");
      setOpen(false);
    } catch (err) {
      setError("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const energyOptions = [
    { value: 'low', label: 'Low Energy', icon: Moon, description: 'Quick & easy' },
    { value: 'medium', label: 'Medium Energy', icon: Sun, description: 'Normal focus' },
    { value: 'high', label: 'High Energy', icon: Zap, description: 'Deep work' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">What needs to be done?</Label>
            <Input
              id="task-title"
              placeholder="e.g., Review chapter 5 notes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/50"
              maxLength={200}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="bg-white/50">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No subject</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <span className="flex items-center gap-2">
                      <span>{subject.icon}</span>
                      <span>{subject.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label>Energy Level Required</Label>
            <div className="grid grid-cols-3 gap-2">
              {energyOptions.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEnergyLevel(value)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    energyLevel === value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mx-auto mb-1",
                    value === 'low' && "text-success",
                    value === 'medium' && "text-warning",
                    value === 'high' && "text-destructive",
                  )} />
                  <p className="text-xs font-medium">{label.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/50",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDueDate(undefined)}
                className="text-xs text-muted-foreground"
              >
                Clear date
              </Button>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex-1 gradient-primary"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};