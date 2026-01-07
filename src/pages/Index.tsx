import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { SmartCaptureButton } from "@/components/SmartCaptureButton";
import { PulsePage } from "./PulsePage";
import { SchedulePage } from "./SchedulePage";
import { VaultPage } from "./VaultPage";
import { TasksPage } from "./TasksPage";
import { ExamsPage } from "./ExamsPage";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { SetupWizard } from "@/components/SetupWizard";

const Index = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { subjects, loading, getCurrentClass, getSubjectById, refetch } = useOrbitData();
  const [activeTab, setActiveTab] = useState<NavTab>('pulse');
  const [showSetup, setShowSetup] = useState(false);

  // Check if user needs onboarding
  const needsSetup = !loading && subjects.length === 0;

  const currentClass = getCurrentClass();
  const currentSubject = currentClass ? getSubjectById(currentClass.subject_id) : null;

  const handleNoteCreated = () => {
    refetch();
  };

  const renderPage = () => {
    if (needsSetup || showSetup) {
      return <SetupWizard onComplete={() => { setShowSetup(false); refetch(); }} />;
    }

    switch (activeTab) {
      case 'pulse':
        return <PulsePage />;
      case 'schedule':
        return <SchedulePage />;
      case 'vault':
        return <VaultPage />;
      case 'tasks':
        return <TasksPage />;
      case 'exams':
        return <ExamsPage />;
      default:
        return <PulsePage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-background">
      {/* Header with logout */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-lg border-b border-white/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-foreground">✨ Orbit</h1>
          <div className="flex items-center gap-2">
            {!needsSetup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="rounded-full"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 pb-32 pt-20">
        {renderPage()}
      </main>

      {/* Smart Capture FAB - only show after setup */}
      {!needsSetup && !showSetup && (
        <SmartCaptureButton
          currentSubject={currentSubject ? {
            id: currentSubject.id,
            name: currentSubject.name,
            icon: currentSubject.icon,
          } : null}
          onNoteCreated={handleNoteCreated}
        />
      )}

      {/* Bottom Navigation - only show after setup */}
      {!needsSetup && !showSetup && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default Index;
