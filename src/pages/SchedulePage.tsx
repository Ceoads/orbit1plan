import { useOrbitData } from "@/hooks/useOrbitData";
import { ScheduleCalendar } from "@/components/calendar";
import { GlassCard } from "@/components/GlassCard";
import { Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SchedulePage = () => {
  const { events, subjects, getNotesBySubject } = useOrbitData();
  const navigate = useNavigate();

  const handleStudyFocus = (event: any) => {
    if (event.subject_id) {
      const notes = getNotesBySubject(event.subject_id);
      const subject = subjects.find(s => s.id === event.subject_id);
      
      if (notes.length > 0) {
        toast.success(`Found ${notes.length} notes for ${subject?.name || 'this subject'}`, {
          description: "Opening your study materials...",
          action: {
            label: "View",
            onClick: () => navigate('/vault'),
          },
        });
      } else {
        toast.info("No notes yet for this class", {
          description: "Add notes to build your study materials",
          action: {
            label: "Add Note",
            onClick: () => navigate('/vault'),
          },
        });
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Calendar */}
      {events.length > 0 ? (
        <ScheduleCalendar
          events={events}
          subjects={subjects}
          onStudyFocus={handleStudyFocus}
        />
      ) : (
        <GlassCard className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-display font-semibold mb-1">No Schedule Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your school calendar to see your classes here
          </p>
          <Button onClick={() => navigate('/settings')} className="gradient-primary">
            Add Calendar URL
          </Button>
        </GlassCard>
      )}
    </div>
  );
};
