import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronRight, Sparkles, BookOpen, Calendar, Loader2 } from "lucide-react";

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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<typeof SUBJECT_PRESETS>([]);
  const [schedule, setSchedule] = useState<{ [key: string]: { start: string; end: string; day: number }[] }>({});
  const [loading, setLoading] = useState(false);

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

  const handleSaveSetup = async () => {
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
            day_of_week: 1, // Monday
            event_type: "class",
          });
        
        if (error) throw error;
      });

      await Promise.all(schedulePromises);

      // Create a sample exam for the first subject
      if (createdSubjects[0]) {
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + 7); // 1 week from now
        
        await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: `${createdSubjects[0].name} Exam`,
          subject_id: createdSubjects[0].id,
          start_time: "09:00",
          end_time: "11:00",
          day_of_week: 5, // Friday
          event_type: "exam",
          exam_date: examDate.toISOString().split("T")[0],
        });
      }

      // Create sample tasks
      await supabase.from("tasks").insert([
        {
          user_id: user.id,
          title: "Welcome to Orbit! Tap the + button to capture notes",
          priority_score: 90,
          energy_level: "low",
          due_date: new Date().toISOString(),
        },
        {
          user_id: user.id,
          title: "Try breaking down a big task with the ✨ button",
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
          Let's set up your brain
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose your subjects to get started
        </p>
      </div>

      {/* Step 1: Select subjects */}
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

      {/* Info card */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              We'll create a sample schedule
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can customize your class times and add exams later in settings.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Continue button */}
      <Button
        onClick={handleSaveSetup}
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
    </div>
  );
};
