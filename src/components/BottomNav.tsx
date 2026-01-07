import { Home, FolderOpen, CheckSquare, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = 'pulse' | 'vault' | 'tasks' | 'exams';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const tabs = [
  { id: 'pulse' as const, label: 'Pulse', icon: Home },
  { id: 'vault' as const, label: 'Vault', icon: FolderOpen },
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'exams' as const, label: 'Exams', icon: GraduationCap },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="mx-4 mb-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-elevated overflow-hidden">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}>
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all",
                      isActive && "scale-110"
                    )} 
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium transition-all",
                  isActive && "text-primary"
                )}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
