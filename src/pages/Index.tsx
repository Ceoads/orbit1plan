import { useState } from "react";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { SmartCaptureButton } from "@/components/SmartCaptureButton";
import { PulsePage } from "./PulsePage";
import { VaultPage } from "./VaultPage";
import { TasksPage } from "./TasksPage";
import { ExamsPage } from "./ExamsPage";
import { toast } from "sonner";
import { getCurrentClass, getSubjectById } from "@/lib/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('pulse');

  const handleCapture = (type: 'photo' | 'voice') => {
    const currentClass = getCurrentClass();
    const subject = currentClass ? getSubjectById(currentClass.subjectId) : null;

    if (type === 'photo') {
      if (subject) {
        toast.success(`📸 Photo captured!`, {
          description: `Tagged as ${subject.icon} ${subject.name}. AI analyzing...`,
          duration: 3000,
        });
        
        // Simulate AI processing
        setTimeout(() => {
          toast.success(`✨ Note processed!`, {
            description: `Key concepts extracted and review task created.`,
            duration: 4000,
          });
        }, 2000);
      } else {
        toast.info(`📸 Photo captured!`, {
          description: `No active class detected. You can tag it manually.`,
        });
      }
    } else {
      toast.success(`🎤 Recording started...`, {
        description: subject 
          ? `Will be saved to ${subject.icon} ${subject.name}`
          : `Recording voice note...`,
      });
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'pulse':
        return <PulsePage />;
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

  return (
    <div className="min-h-screen mesh-background">
      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 pb-32 pt-6">
        {renderPage()}
      </main>

      {/* Smart Capture FAB */}
      <SmartCaptureButton onCapture={handleCapture} />

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
