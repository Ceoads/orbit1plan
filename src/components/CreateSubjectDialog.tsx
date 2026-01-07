import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(50, "Name too long"),
});

const SUBJECT_ICONS = ['📐', '📜', '⚡', '📚', '🧪', '🌍', '🎨', '💻', '🔬', '📊', '🎵', '🏃', '🗣️', '✏️', '🧮'];
const SUBJECT_COLORS = [
  { key: 'math', label: 'Blue', class: 'bg-primary' },
  { key: 'history', label: 'Amber', class: 'bg-warning' },
  { key: 'physics', label: 'Green', class: 'bg-success' },
  { key: 'english', label: 'Purple', class: 'bg-[hsl(280,67%,55%)]' },
  { key: 'chemistry', label: 'Red', class: 'bg-destructive' },
];

interface CreateSubjectDialogProps {
  onCreateSubject: (data: {
    name: string;
    icon: string;
    color_key: string;
    teacher_name: string | null;
  }) => Promise<any>;
}

export const CreateSubjectDialog = ({ onCreateSubject }: CreateSubjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📚");
  const [colorKey, setColorKey] = useState("math");
  const [teacher, setTeacher] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    
    const result = subjectSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateSubject({
        name: result.data.name,
        icon,
        color_key: colorKey,
        teacher_name: teacher.trim() || null,
      });
      
      // Reset form
      setName("");
      setIcon("📚");
      setColorKey("math");
      setTeacher("");
      setOpen(false);
    } catch (err) {
      setError("Failed to create subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Subject</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              placeholder="e.g., Mathematics, Physics..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/50"
              maxLength={50}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xl transition-all flex items-center justify-center",
                    icon === emoji
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  onClick={() => setColorKey(color.key)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    color.class,
                    colorKey === color.key
                      ? "ring-2 ring-offset-2 ring-foreground scale-110"
                      : "hover:scale-105"
                  )}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Teacher (optional) */}
          <div className="space-y-2">
            <Label htmlFor="teacher-name">Teacher (optional)</Label>
            <Input
              id="teacher-name"
              placeholder="e.g., Prof. Smith"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="bg-white/50"
              maxLength={100}
            />
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
              disabled={isSubmitting || !name.trim()}
              className="flex-1 gradient-primary"
            >
              {isSubmitting ? "Creating..." : "Add Subject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};