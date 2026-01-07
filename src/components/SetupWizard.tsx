import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronRight, Sparkles, BookOpen, Calendar, Loader2, Link2 } from "lucide-react";

const SUBJECT_PRESETS = [
  { name: "Mathematics", icon: "📐", colorKey: "math" },
  { name: "History", icon: "📜", colorKey: "history" },
  { name: "Physics", icon: "⚡", colorKey: "physics" },
  { name: "English", icon: "📚", colorKey: "english" },
  { name: "Chemistry", icon: "🧪", colorKey: "chemistry" },
  { name: "Biology", icon: "🧬", colorKey: "physics" },
  { name: "Geography", icon: "🌍", colorKey: "history" },
  { name: "Art", icon: "🎨", colorKey: "english" },
];

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard = ({ onComplete }: SetupWizardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [icalUrl, setIcalUrl] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<typeof SUBJECT_PRESETS>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const toggleSubject = (subject: typeof SUBJECT_PRESETS[0]) => {
    setSelectedSubjects(prev => {
      const exists = prev.some(s => s.name === subject.name);
      if (exists) {
        return prev.filter(s => s.name !== subject.name);
      }
      if (prev.length >= 5) {
        toast.info("Maximum 5 subjects for now");
        return prev;
      }
      return [...prev, subject];
    });
  };

  const handleIcalSync = async () => {
    if (!user || !icalUrl) return;
    
    // Basic URL validation
    if (!icalUrl.includes('.ics') && !icalUrl.includes('ical') && !icalUrl.includes('calendar') && !icalUrl.includes('planning')) {
      toast.error("This doesn't look like an iCal URL");
      return;
    }
    
    setSyncing(true);
    try {
      // Save the URL first
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ical_url: icalUrl,
        }, { onConflict: 'user_id' });

      // Trigger sync
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user.id, icalUrl },
      });
      
      if (error) throw error;
      
      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`Imported ${result.eventsSynced} events!`, {
          description: `${result.newSubjects} subjects discovered`,
        });
        
        // Create welcome tasks
        await supabase.from("tasks").insert([
          {
            user_id: user.id,
            title: "Welcome to Orbit! Your schedule is synced ✨",
            priority_score: 90,
            energy_level: "low",
            due_date: new Date().toISOString(),
          },
        ]);
        
        onComplete();
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error("Failed to sync calendar", {
        description: "Try the manual setup instead",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSetup = async () => {
    if (!user || selectedSubjects.length === 0) return;

    setLoading(true);
    try {
      // Create subjects
      const subjectPromises = selectedSubjects.map(async (s) => {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            user_id: user.id,
            name: s.name,
            icon: s.icon,
            color_key: s.colorKey,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      });

      const createdSubjects = await Promise.all(subjectPromises);

      // Create sample schedule (Monday classes)
      const schedulePromises = createdSubjects.map(async (subject, index) => {
        const startHour = 9 + index;
        const { error } = await supabase
          .from("calendar_events")
          .insert({
            user_id: user.id,
            title: subject.name,
            subject_id: subject.id,
            start_time: `${startHour.toString().padStart(2, "0")}:00`,
            end_time: `${(startHour + 1).toString().padStart(2, "0")}:00`,
            day_of_week: 1,
            event_type: "class",
          });
        
        if (error) throw error;
      });

      await Promise.all(schedulePromises);

      // Create a sample exam
      if (createdSubjects[0]) {
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + 7);
        
        await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: `${createdSubjects[0].name} Exam`,
          subject_id: createdSubjects[0].id,
          start_time: "09:00",
          end_time: "11:00",
          day_of_week: 5,
          event_type: "exam",
          exam_date: examDate.toISOString().split("T")[0],
        });
      }

      // Create welcome tasks
      await supabase.from("tasks").insert([
        {
          user_id: user.id,
          title: "Welcome to Orbit! Tap + to capture notes",
          priority_score: 90,
          energy_level: "low",
          due_date: new Date().toISOString(),
        },
        {
          user_id: user.id,
          title: "Try breaking down a task with the ✨ button",
          priority_score: 70,
          energy_level: "medium",
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      toast.success("Setup complete! Welcome to Orbit 🚀");
      onComplete();
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error("Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in py-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {step === 1 ? "Connect Your Schedule" : "Choose Your Subjects"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {step === 1 
            ? "Paste your school's calendar URL for automatic sync"
            : "Or set up subjects manually"
          }
        </p>
      </div>

      {step === 1 ? (
        <>
          {/* iCal URL Input */}
          <GlassCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">School Calendar URL</h2>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://hplanning.univ.fr/ical/..."
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  className="pl-10 h-12 bg-white/50 border-white/30 rounded-xl"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Find this in Hyperplanning, Google Calendar, or your school portal under "Export" or "Subscribe"
              </p>
            </div>
          </GlassCard>

          {/* Sync Button */}
          <Button
            onClick={handleIcalSync}
            disabled={!icalUrl || syncing}
            className="w-full h-14 rounded-xl gradient-primary text-white font-medium text-lg"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Importing Schedule...
              </>
            ) : (
              <>
                Import My Schedule
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Or divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Manual Setup */}
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="w-full h-12 rounded-xl"
          >
            Set Up Manually
          </Button>
        </>
      ) : (
        <>
          {/* Subject Selection */}
          <GlassCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Your Subjects</h2>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedSubjects.length}/5 selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_PRESETS.map((subject) => {
                const isSelected = selectedSubjects.some(s => s.name === subject.name);
                return (
                  <button
                    key={subject.name}
                    onClick={() => toggleSubject(subject)}
                    className={`
                      p-3 rounded-xl border-2 transition-all text-left
                      ${isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-white/30 bg-white/50 hover:border-primary/50"
                      }
                    `}
                  >
                    <span className="text-2xl">{subject.icon}</span>
                    <p className="font-medium mt-1 text-sm">{subject.name}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Continue button */}
          <Button
            onClick={handleManualSetup}
            disabled={selectedSubjects.length === 0 || loading}
            className="w-full h-14 rounded-xl gradient-primary text-white font-medium text-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setStep(1)}
            className="w-full"
          >
            ← Back to Calendar Import
          </Button>
        </>
      )}
    </div>
  );
};
