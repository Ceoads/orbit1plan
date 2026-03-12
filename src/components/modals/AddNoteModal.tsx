import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject, useOrbitData } from "@/hooks/useOrbitData";
import { useTranslation } from "react-i18next";
import { sanitizeNoteContent, INPUT_LIMITS } from "@/lib/sanitize";

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  defaultSubjectId?: string | null;
}

export const AddNoteModal = ({
  open,
  onOpenChange,
  subjects,
  defaultSubjectId = null,
}: AddNoteModalProps) => {
  const { t } = useTranslation();
  const { createNote } = useOrbitData();
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || "__none__");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeNoteContent(rawText, INPUT_LIMITS.noteContent);
    if (!sanitized) return;

    setLoading(true);
    await createNote({
      subject_id: subjectId === "__none__" ? null : subjectId,
      raw_text: sanitized,
      ai_summary: null,
      media_url: null,
      event_id: null,
    });
    setLoading(false);
    
    setRawText("");
    if (!defaultSubjectId) setSubjectId("__none__");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('modals.addNote.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('modals.addClass.subject')}</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder={t('modals.addClass.selectSubject')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('common.none')}</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.icon} {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('modals.addNote.content')}</Label>
            <Textarea
              id="content"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t('modals.addNote.contentPlaceholder')}
              className="min-h-[150px] resize-none"
              maxLength={INPUT_LIMITS.noteContent}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? t('common.adding') : t('modals.addNote.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};