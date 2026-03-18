import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject, CalendarEvent, useOrbitData } from "@/hooks/useOrbitData";
import { useTranslation } from "react-i18next";
import { sanitizeText, INPUT_LIMITS } from "@/lib/sanitize";

interface EditClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  subjects: Subject[];
}

export const EditClassModal = ({
  open,
  onOpenChange,
  event,
  subjects,
}: EditClassModalProps) => {
  const { t } = useTranslation();
  const { updateEvent } = useOrbitData();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("__none__");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [eventDate, setEventDate] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setSubjectId(event.subject_id || "__none__");
      setStartTime(event.start_time);
      setEndTime(event.end_time);
      setEventDate(event.event_date || '');
      setRoomNumber(event.room_number || "");
    }
  }, [event]);

  const days = [
    { value: "0", label: t('calendar.daysLong.sunday') },
    { value: "1", label: t('calendar.daysLong.monday') },
    { value: "2", label: t('calendar.daysLong.tuesday') },
    { value: "3", label: t('calendar.daysLong.wednesday') },
    { value: "4", label: t('calendar.daysLong.thursday') },
    { value: "5", label: t('calendar.daysLong.friday') },
    { value: "6", label: t('calendar.daysLong.saturday') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedTitle = sanitizeText(title, INPUT_LIMITS.title);
    const sanitizedRoom = sanitizeText(roomNumber, INPUT_LIMITS.roomNumber);
    if (!sanitizedTitle || !event) return;

    setLoading(true);
    await updateEvent(event.id, {
      title: sanitizedTitle,
      subject_id: subjectId === "__none__" ? null : subjectId,
      start_time: startTime,
      end_time: endTime,
      day_of_week: parseInt(dayOfWeek),
      room_number: sanitizedRoom || null,
    });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('modals.editClass.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('modals.addClass.className')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modals.addClass.classPlaceholder')}
              maxLength={INPUT_LIMITS.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('modals.addClass.subjectOptional')}</Label>
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
            <Label htmlFor="day">{t('modals.addClass.day')}</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder={t('modals.addClass.roomPlaceholder')}
              maxLength={INPUT_LIMITS.roomNumber}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-primary">
              {loading ? t('common.saving') : t('modals.editClass.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};