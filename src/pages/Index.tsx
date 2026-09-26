import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { SwipeablePages } from "@/components/SwipeablePages";
import { PulsePage } from "./PulsePage";
import { TheVaultPage } from "./TheVaultPage";
import { TasksPage } from "./TasksPage";
import { ExamsPage } from "./ExamsPage";
import { ExamLabPage } from "./ExamLabPage";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { SetupWizard } from "@/components/SetupWizard";
import { OrbitOnboarding, useTutorial } from "@/components/onboarding";
import { CollapsibleHeader } from "@/components/CollapsibleHeader";
import DesktopApp from "./DesktopApp";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { subjects, loading, refetch } = useOrbitData();
  const [activeTab, setActiveTab] = useState<NavTab>('pulse');
  const [showSetup, setShowSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const tutorial = useTutorial();
  const isDesktop = useIsDesktop();

  // Check if user needs onboarding
  const needsSetup = !loading && subjects.length === 0;
  
  // Check for URL parameter to restart tutorial from "welcome" or navigate to a tab
  useEffect(() => {
    const restartTutorial = searchParams.get("restart_tutorial");
    const tabParam = searchParams.get("tab") as NavTab | null;

    if (restartTutorial === "full" && user && !loading) {
      setSearchParams({});
      setTutorialActive(true);
      tutorial.startTutorial();
    } else if (tabParam && ['pulse', 'vault', 'tasks', 'exams', 'lab'].includes(tabParam)) {
      setActiveTab(tabParam);
      setSearchParams({});
    }
  }, [searchParams, user, loading]);
  
  // Check for first-time user experience
  useEffect(() => {
    if (!loading && user) {
      const hasSeenOnboarding = localStorage.getItem("orbit_onboarding_seen") === "true";
      const hasTutorialCompleted = tutorial.hasCompletedTutorial();
      
      // Show onboarding for first-time users (no subjects and haven't seen onboarding)
      if (needsSetup && !hasSeenOnboarding) {
        setShowOnboarding(true);
      } 
      // Start tutorial for users who have subjects but haven't completed tutorial
      // This covers both iCal sync AND manual setup
      else if (!hasTutorialCompleted && subjects.length > 0 && !showSetup) {
        setTutorialActive(true);
        tutorial.startTutorial();
      }
    }
  }, [loading, user, needsSetup, subjects.length, showSetup]);
  
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
    // Mark onboarding as seen when proceeding to setup
    localStorage.setItem("orbit_onboarding_seen", "true");
    setShowOnboarding(false);
    setShowSetup(true);
  };
  
  const handleSetupComplete = async () => {
    setShowSetup(false);
    // Refetch to get newly created subjects
    await refetch();
    
    // ALWAYS start tutorial after setup (manual OR iCal)
    // Skip "add-subject" step since subjects are already created during setup
    // Small delay to ensure UI is ready
    setTimeout(() => {
      setTutorialActive(true);
      tutorial.startTutorialFromStep("explore-lab");
    }, 500);
  };
  
  const handleTutorialComplete = () => {
    setTutorialActive(false);
  };

  // Memoize page components to prevent re-renders
  const pageComponents = useMemo(() => ({
    pulse: <PulsePage />,
    vault: <TheVaultPage />,
    tasks: <TasksPage />,
    exams: <ExamsPage />,
    lab: <ExamLabPage />,
  }), []);

  const renderPage = () => {
    if (showSetup || (needsSetup && !showOnboarding)) {
      return <SetupWizard onComplete={handleSetupComplete} />;
    }

    return (
      <SwipeablePages
        activeTab={activeTab}
        onTabChange={handleTabChange}
        children={pageComponents}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isDesktop && !needsSetup && !showSetup && !showOnboarding) {
    return <DesktopApp />;
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

      {/* Collapsible Header with Home Logo */}
      <CollapsibleHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showSettings={!needsSetup && !showSetup}
      />

      {/* Main Content - pt-6 since CollapsibleHeader includes spacer */}
      <main className="container max-w-lg mx-auto px-4 pb-32 pt-6 relative" style={{ zIndex: 1 }}>
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
