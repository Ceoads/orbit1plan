import { Home, FolderOpen, CheckSquare, GraduationCap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = 'pulse' | 'vault' | 'tasks' | 'exams' | 'lab';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const tabs = [
  { id: 'pulse' as const, label: 'Pulse', icon: Home },
  { id: 'vault' as const, label: 'Vault', icon: FolderOpen },
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'exams' as const, label: 'Exams', icon: GraduationCap },
  { id: 'lab' as const, label: 'Lab', icon: Brain },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="floating-dock pb-safe">
      <div className="dock-container">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "dock-item",
                isActive && "dock-item-active"
              )}
            >
              <Icon 
                className={cn(
                  "dock-icon w-5 h-5 transition-all duration-200",
                  isActive 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};