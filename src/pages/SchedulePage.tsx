import { useOrbitData } from "@/hooks/useOrbitData";
import { ProfessionalCalendar } from "@/components/calendar";
import { GlassCard } from "@/components/GlassCard";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SchedulePage = () => {
  const { events, subjects, getNotesBySubject, refetch } = useOrbitData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchLastSynced();
  }, [user]);

  const fetchLastSynced = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('last_synced_at, ical_url')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.last_synced_at) {
      setLastSynced(data.last_synced_at);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('ical_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!settings?.ical_url) {
        toast.error("No calendar URL configured", {
          description: "Add your iCal URL in Settings",
          action: {
            label: "Settings",
            onClick: () => navigate('/settings'),
          },
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user.id, icalUrl: settings.ical_url },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`Synced ${result.eventsSynced} events!`);
        await fetchLastSynced();
        refetch();
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      toast.error("Sync failed", { description: error.message });
    } finally {
      setSyncing(false);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const classCount = events.filter(e => e.event_type === 'class').length;
  const examCount = events.filter(e => e.event_type === 'exam').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">
            Schedule
          </h1>
        </div>

        {/* Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="gap-1.5 rounded-full"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {/* Sync Status */}
      {lastSynced && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last synced: {formatLastSynced(lastSynced)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{classCount} classes</span>
            <span className="text-warning">{examCount} exams</span>
          </div>
        </div>
      )}

      {/* Professional Calendar */}
      {events.length > 0 ? (
        <ProfessionalCalendar
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

      {/* Quick Legend */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {subjects.slice(0, 5).map(subject => (
            <div key={subject.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{subject.icon}</span>
              <span>{subject.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};