import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subject, useOrbitData } from "@/hooks/useOrbitData";
import { cn } from "@/lib/utils";

interface EditSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
}

const colorOptions = [
  { key: "math", label: "Blue", color: "bg-primary" },
  { key: "history", label: "Orange", color: "bg-warning" },
  { key: "physics", label: "Green", color: "bg-success" },
  { key: "english", label: "Purple", color: "bg-[hsl(280,67%,55%)]" },
  { key: "chemistry", label: "Red", color: "bg-destructive" },
];

const iconOptions = ["📚", "📐", "🧪", "📖", "🎨", "🌍", "💻", "🎵", "⚽", "🧮", "🔬", "✏️"];

export const EditSubjectModal = ({
  open,
  onOpenChange,
  subject,
}: EditSubjectModalProps) => {
  const { updateSubject } = useOrbitData();
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [colorKey, setColorKey] = useState("math");
  const [icon, setIcon] = useState("📚");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setTeacherName(subject.teacher_name || "");
      setColorKey(subject.color_key);
      setIcon(subject.icon);
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject) return;

    setLoading(true);
    await updateSubject(subject.id, {
      name,
      color_key: colorKey,
      icon,
      teacher_name: teacherName || null,
    });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher (optional)</Label>
            <Input
              id="teacher"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Mr. Smith"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                    icon === opt
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : "bg-secondary hover:bg-accent"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setColorKey(opt.key)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    opt.color,
                    colorKey === opt.key
                      ? "ring-2 ring-offset-2 ring-foreground scale-110"
                      : "hover:scale-105"
                  )}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
