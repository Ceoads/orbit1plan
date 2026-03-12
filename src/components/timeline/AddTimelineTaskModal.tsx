import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { detectCategory, CATEGORY_COLORS, type CreateTimelineTask } from "@/hooks/useTimelineTasks";
import { format } from "date-fns";
import { sanitizeText, sanitizeNoteContent, INPUT_LIMITS } from "@/lib/sanitize";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (task: CreateTimelineTask) => void;
  defaultDate?: Date;
  defaultHour?: number;
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

export const AddTimelineTaskModal = ({ open, onClose, onAdd, defaultDate, defaultHour }: Props) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [category, setCategory] = useState('personal');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState('medium');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setNote('');
      setIcon('📝');
      setCategory('personal');
      setPriority('medium');
      setDuration(60);
      const d = defaultDate || new Date();
      setDate(format(d, 'yyyy-MM-dd'));
      setTime(defaultHour !== undefined ? `${String(defaultHour).padStart(2, '0')}:00` : '14:00');
    }
  }, [open, defaultDate, defaultHour]);

  useEffect(() => {
    if (title.length > 2) {
      const detected = detectCategory(title);
      setCategory(detected.category);
      setIcon(detected.icon);
    }
  }, [title]);

  const handleSubmit = () => {
    const sanitizedTitle = sanitizeText(title, INPUT_LIMITS.title);
    const sanitizedNote = sanitizeNoteContent(note, 500);
    if (!sanitizedTitle || !date || !time) return;
    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    onAdd({
      title: sanitizedTitle,
      category,
      icon,
      color: CATEGORY_COLORS[category] || '#ff9f6b',
      scheduled_at,
      estimated_duration: duration,
      priority,
      note: sanitizedNote || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Titre *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Réviser anglais, Yoga..."
              className="rounded-xl"
              maxLength={INPUT_LIMITS.title}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Icône</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(i => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === c.id
                      ? 'text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                  style={category === c.id ? { backgroundColor: CATEGORY_COLORS[c.id] } : {}}
                >
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
            <label className="text-sm font-medium text-foreground mb-1 block">Durée estimée *</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === d.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Priorité</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    priority === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Note (optionnel)</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Chapitres 3-4, salle B2..."
              className="rounded-xl resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !date || !time}
              className="flex-1 rounded-xl"
            >
              Créer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};