import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrbitData } from "@/hooks/useOrbitData";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AddSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorOptions = [
  { key: "math", label: "Blue", color: "bg-primary" },
  { key: "history", label: "Orange", color: "bg-warning" },
  { key: "physics", label: "Green", color: "bg-success" },
  { key: "english", label: "Purple", color: "bg-[hsl(280,67%,55%)]" },
  { key: "chemistry", label: "Red", color: "bg-destructive" },
];

const iconOptions = ["📚", "📐", "🧪", "📖", "🎨", "🌍", "💻", "🎵", "⚽", "🧮", "🔬", "✏️"];

export const AddSubjectModal = ({
  open,
  onOpenChange,
}: AddSubjectModalProps) => {
  const { t } = useTranslation();
  const { createSubject } = useOrbitData();
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [colorKey, setColorKey] = useState("math");
  const [icon, setIcon] = useState("📚");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await createSubject({
      name,
      color_key: colorKey,
      icon,
      teacher_name: teacherName || null,
    });
    setLoading(false);
    
    // Reset form
    setName("");
    setTeacherName("");
    setColorKey("math");
    setIcon("📚");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('modals.addSubject.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('modals.addSubject.subjectName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('modals.addSubject.subjectPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">{t('modals.addSubject.teacherOptional')}</Label>
            <Input
              id="teacher"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder={t('modals.addSubject.teacherPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('modals.addSubject.icon')}</Label>
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
            <Label>{t('modals.addSubject.color')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? t('common.adding') : t('modals.addSubject.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
