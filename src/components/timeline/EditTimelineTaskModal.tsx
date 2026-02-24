import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_COLORS, type TimelineTask } from "@/hooks/useTimelineTasks";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  task: TimelineTask | null;
  onUpdate: (id: string, updates: Partial<TimelineTask>) => void;
  onDelete: (id: string) => void;
}

const ICONS = ['📚', '📝', '💪', '🏦', '🛒', '☕', '🎮', '🎵'];
const CATEGORIES = [
  { id: 'study', label: '📚 Études' },
  { id: 'sport', label: '💪 Sport' },
  { id: 'personal', label: '🏦 Perso' },
  { id: 'other', label: '✨ Autre' },
];
const DURATIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
];

export const EditTimelineTaskModal = ({ open, onClose, task, onUpdate, onDelete }: Props) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [category, setCategory] = useState('personal');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState('medium');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setIcon(task.icon);
      setCategory(task.category);
      const d = new Date(task.scheduled_at);
      setDate(format(d, 'yyyy-MM-dd'));
      setTime(format(d, 'HH:mm'));
      setDuration(task.estimated_duration);
      setPriority(task.priority);
      setNote(task.note || '');
    }
  }, [task, open]);

  const handleSave = () => {
    if (!task || !title.trim()) return;
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    onUpdate(task.id, {
      title: title.trim(),
      icon,
      category,
      color: CATEGORY_COLORS[category] || '#ff9f6b',
      scheduled_at,
      estimated_duration: duration,
      priority,
      note: note.trim() || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Modifier la tâche</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Titre *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Icône</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === c.id ? 'text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                  style={category === c.id ? { backgroundColor: CATEGORY_COLORS[c.id] } : {}}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Heure *</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Durée</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button key={d.value} onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${duration === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Priorité</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${priority === p ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                  {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Note</label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} className="rounded-xl resize-none" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="destructive" size="icon" onClick={handleDelete} className="rounded-xl">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Annuler</Button>
            <Button onClick={handleSave} disabled={!title.trim()} className="flex-1 rounded-xl">Sauvegarder</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
