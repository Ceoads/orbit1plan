import { useOrbitData } from "@/hooks/useOrbitData";
import { ScheduleCalendar } from "@/components/calendar";
import { GlassCard } from "@/components/GlassCard";
import { Calendar, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const SchedulePage = () => {
  const { events, subjects, getNotesBySubject } = useOrbitData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    fetchLastSynced();
  }, [user]);

  const fetchLastSynced = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.last_synced_at) {
      setLastSynced(data.last_synced_at);
    }
  };

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

  const formatLastSynced = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">
            Schedule
          </h1>
        </div>

        {/* Sync Status */}
        {lastSynced && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {formatLastSynced(lastSynced)}</span>
          </div>
        )}
      </div>

      {/* Main Calendar */}
      <ScheduleCalendar
        events={events}
        subjects={subjects}
        onStudyFocus={handleStudyFocus}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {events.filter(e => e.event_type === 'class').length}
          </p>
          <p className="text-xs text-muted-foreground">Weekly Classes</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-bold text-warning">
            {events.filter(e => e.event_type === 'exam').length}
          </p>
          <p className="text-xs text-muted-foreground">Upcoming Exams</p>
        </GlassCard>
      </div>
    </div>
  );
};