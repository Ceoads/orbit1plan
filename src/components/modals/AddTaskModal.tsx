import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject } from "@/hooks/useOrbitData";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    energy_level: 'low' | 'medium' | 'high';
    due_date?: string;
    subject_id?: string;
    priority_score: number;
  }) => void;
  subjects: Subject[];
}

export const AddTaskModal = ({ open, onClose, onAdd, subjects }: AddTaskModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      energy_level: energy,
      due_date: dueDate || undefined,
      subject_id: subjectId || undefined,
      priority_score: energy === 'high' ? 80 : energy === 'medium' ? 50 : 30,
    });
    setTitle("");
    setEnergy('medium');
    setDueDate("");
    setSubjectId("");
    onClose();
  };

  const energyLabels = {
    high: "⚡ Max",
    medium: "☀️ Moyen",
    low: "🌙 Zen",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 backdrop-blur-xl border-white/30 rounded-3xl max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{t('tasks.addTask')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t('tasks.taskName')}</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('tasks.taskPlaceholder')}
              className="rounded-xl bg-white/60"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t('tasks.subject')}</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="rounded-xl bg-white/60">
                <SelectValue placeholder={t('tasks.selectSubject')} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span>{s.icon}</span> {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('tasks.energyLevel')}</Label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setEnergy(level)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    energy === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/60 text-muted-foreground hover:bg-white/80'
                  }`}
                >
                  {energyLabels[level]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('tasks.dueDate')}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="rounded-xl bg-white/60"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full rounded-xl"
          >
            {t('tasks.addTask')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
