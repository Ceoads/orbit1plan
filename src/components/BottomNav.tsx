import { CalendarDays, CheckSquare, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export type NavTab = 'pulse' | 'vault' | 'tasks' | 'exams' | 'lab';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  "data-tutorial-pulse"?: string;
  "data-tutorial-lab"?: string;
}

// Spec: only 3 tabs — Schedule (pulse), Tasks, Exams.
// Vault & Lab remain accessible via header / direct routes but are
// excluded from the stark bottom nav per the Linear/Vercel brief.
const tabConfig = [
  { id: 'pulse' as const, label: 'Schedule', icon: CalendarDays },
  { id: 'tasks' as const, label: 'Tasks',    icon: CheckSquare },
  { id: 'exams' as const, label: 'Exams',    icon: GraduationCap },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const handleTabClick = (id: NavTab) => {
    if (id !== activeTab) {
      haptics.selection();
      sounds.tap();
      onTabChange(id);
    }
  };

  return (
    <nav className="floating-dock font-mono">
      <div className="dock-container">
        {tabConfig.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const tutorialAttr =
            id === 'pulse' ? { "data-tutorial": "pulse-tab" } : {};
          return (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={cn(
                "dock-item touch-manipulation",
                isActive && "dock-item-active"
              )}
              {...tutorialAttr}
            >
              <Icon
                className={cn(
                  "dock-icon w-[18px] h-[18px] pointer-events-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="pointer-events-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
