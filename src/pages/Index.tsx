import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { PulsePage } from "./PulsePage";
import { TheVaultPage } from "./TheVaultPage";
import { TasksPage } from "./TasksPage";
import { ExamsPage } from "./ExamsPage";
import { ExamLabPage } from "./ExamLabPage";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { SetupWizard } from "@/components/SetupWizard";
import { OrbitOnboarding, useTutorial, TutorialStep } from "@/components/onboarding";

const Index = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { subjects, loading, getCurrentClass, getSubjectById, refetch } = useOrbitData();
  const [activeTab, setActiveTab] = useState<NavTab>('pulse');
  const [showSetup, setShowSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const tutorial = useTutorial();

  // Check if user needs onboarding
  const needsSetup = !loading && subjects.length === 0;
  
  // Check for first-time user experience
  useEffect(() => {
    if (!loading && user) {
      const hasSeenOnboarding = localStorage.getItem("orbit_onboarding_seen") === "true";
      const hasTutorialCompleted = tutorial.hasCompletedTutorial();
      
      if (needsSetup && !hasSeenOnboarding) {
        setShowOnboarding(true);
      } else if (!hasTutorialCompleted && subjects.length > 0) {
        // Start tutorial for users who completed setup but not tutorial
        setTutorialActive(true);
        tutorial.startTutorial();
      }
    }
  }, [loading, user, needsSetup, subjects.length]);

  const currentClass = getCurrentClass();
  const currentSubject = currentClass ? getSubjectById(currentClass.subject_id) : null;

  const handleNoteCreated = () => {
    refetch();
  };
  
  // Handle tutorial step advancement based on user actions
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    
    // Advance tutorial based on tab changes
    if (tutorialActive && tutorial.isActive) {
      if (tab === 'lab' && tutorial.currentStep === 'explore-lab') {
        setTimeout(() => tutorial.advanceStep('check-pulse'), 500);
      } else if (tab === 'pulse' && tutorial.currentStep === 'check-pulse') {
        setTimeout(() => tutorial.advanceStep('complete'), 500);
      }
    }
  };
  
  const handleSetupFromOnboarding = () => {
    setShowOnboarding(false);
    setShowSetup(true);
  };
  
  const handleSetupComplete = () => {
    setShowSetup(false);
    refetch();
    // Start tutorial after setup
    setTutorialActive(true);
    tutorial.startTutorial();
  };
  
  const handleTutorialComplete = () => {
    setTutorialActive(false);
  };

  const renderPage = () => {
    if (showSetup || (needsSetup && !showOnboarding)) {
      return <SetupWizard onComplete={handleSetupComplete} />;
    }

    switch (activeTab) {
      case 'pulse':
        return <PulsePage />;
      case 'vault':
        return <TheVaultPage />;
      case 'tasks':
        return <TasksPage />;
      case 'exams':
        return <ExamsPage />;
      case 'lab':
        return <ExamLabPage />;
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
      {/* Onboarding Narrative (first-time users) */}
      {showOnboarding && (
        <OrbitOnboarding
          isFirstTime={true}
          onComplete={handleTutorialComplete}
          onProceedToSetup={handleSetupFromOnboarding}
        />
      )}
      
      {/* Interactive Tutorial Overlay */}
      {tutorialActive && !showOnboarding && !showSetup && (
        <OrbitOnboarding
          isFirstTime={false}
          onComplete={handleTutorialComplete}
          onProceedToSetup={() => {}}
        />
      )}

      {/* Header with logout */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-lg border-b border-white/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-foreground">✨ Orbit</h1>
          <div className="flex items-center gap-2">
            {!needsSetup && !showSetup && (
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

      {/* Bottom Navigation - only show after setup */}
      {!needsSetup && !showSetup && !showOnboarding && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          data-tutorial-pulse="pulse-tab"
          data-tutorial-lab="lab-tab"
        />
      )}
    </div>
  );
};

export default Index;
