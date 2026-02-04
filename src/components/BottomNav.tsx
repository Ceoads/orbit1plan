import { Home, FolderOpen, CheckSquare, GraduationCap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { motion } from "framer-motion";

export type NavTab = 'pulse' | 'vault' | 'tasks' | 'exams' | 'lab';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  "data-tutorial-pulse"?: string;
  "data-tutorial-lab"?: string;
}

const tabs = [
  { id: 'pulse' as const, label: 'Pulse', icon: Home },
  { id: 'vault' as const, label: 'Vault', icon: FolderOpen },
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'exams' as const, label: 'Exams', icon: GraduationCap },
  { id: 'lab' as const, label: 'Lab', icon: Brain },
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
    <nav 
      className="floating-dock" 
      style={{ 
        isolation: 'isolate',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)'
      }}
    >
      <motion.div 
        className="dock-container"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 25,
          delay: 0.2
        }}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          // Add data attributes for tutorial targeting
          const tutorialAttr = id === 'pulse' 
            ? { "data-tutorial": "pulse-tab" }
            : id === 'lab' 
              ? { "data-tutorial": "lab-tab" }
              : {};
          
          return (
            <motion.button
              key={id}
              onClick={() => handleTabClick(id)}
              className={cn(
                "dock-item hit-target",
                isActive && "dock-item-active"
              )}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.1 }}
              {...tutorialAttr}
            >
              <Icon 
                className={cn(
                  "dock-icon w-5 h-5 ease-apple pointer-events-none",
                  isActive 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium ease-apple pointer-events-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
              
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-primary/10 -z-10"
                  layoutId="activeTabBg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );
};
