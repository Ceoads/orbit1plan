import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject, useOrbitData } from "@/hooks/useOrbitData";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { sanitizeText, INPUT_LIMITS } from "@/lib/sanitize";

interface AddExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
}

export const AddExamModal = ({
  open,
  onOpenChange,
  subjects,
}: AddExamModalProps) => {
  const { t } = useTranslation();
  const { createEvent } = useOrbitData();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("__none__");
  const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedTitle = sanitizeText(title, INPUT_LIMITS.title);
    const sanitizedRoom = sanitizeText(roomNumber, INPUT_LIMITS.roomNumber);
    if (!sanitizedTitle || !examDate) return;

    const date = new Date(examDate);
    const dayOfWeek = date.getDay();

    setLoading(true);
    await createEvent({
      title: sanitizedTitle,
      subject_id: subjectId === "__none__" ? null : subjectId,
      start_time: startTime,
      end_time: endTime,
      day_of_week: dayOfWeek,
      event_type: 'exam',
      exam_date: examDate,
      event_date: examDate,
      room_number: sanitizedRoom || null,
      teacher_name: null,
      external_id: null,
    });
    setLoading(false);
    
    setTitle("");
    setSubjectId("__none__");
    setRoomNumber("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('modals.addExam.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('modals.addExam.examName')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modals.addExam.examPlaceholder')}
              maxLength={INPUT_LIMITS.title}
              required
            />
          </div>

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
            <Label htmlFor="examDate">{t('modals.addExam.examDate')}</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('modals.addClass.startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('modals.addClass.endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">{t('modals.addClass.roomOptional')}</Label>
            <Input
              id="room"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder={t('modals.addExam.roomPlaceholder')}
              maxLength={INPUT_LIMITS.roomNumber}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? t('common.adding') : t('modals.addExam.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};