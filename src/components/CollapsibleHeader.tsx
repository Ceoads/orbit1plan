import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useHaptics } from "@/hooks/useHaptics";
import { NavTab } from "@/components/BottomNav";

interface CollapsibleHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  showSettings: boolean;
  onSignOut: () => void;
}

export const CollapsibleHeader = ({
  activeTab,
  onTabChange,
  showSettings,
  onSignOut,
}: CollapsibleHeaderProps) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  
  // Disable hide behavior on Pulse (home) page
  const isHomePage = activeTab === "pulse";
  const { scrollDirection, isAtTop } = useScrollDirection({ 
    disabled: isHomePage,
    threshold: 15 
  });
  
  // Header is visible when:
  // 1. On home page (always visible)
  // 2. At top of page
  // 3. Scrolling up
  const isVisible = isHomePage || isAtTop || scrollDirection === "up";

  const handleLogoClick = () => {
    if (activeTab !== "pulse") {
      haptics.soft();
      onTabChange("pulse");
    }
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-14" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="fixed top-0 left-0 right-0 z-40"
          >
            {/* Gradient fade at top for iPhone status bar blend */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              }}
            />
            
            {/* Main header content */}
            <div className="relative bg-white/60 backdrop-blur-lg border-b border-white/20 transition-all duration-300">
              <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                {/* Interactive Logo - Home Button */}
                <motion.button
                  onClick={handleLogoClick}
                  className={`font-display text-lg font-bold text-foreground transition-all duration-200 ${
                    activeTab !== "pulse" 
                      ? "cursor-pointer hover:text-primary active:scale-95" 
                      : "cursor-default"
                  }`}
                  whileTap={activeTab !== "pulse" ? { scale: 0.95 } : {}}
                  aria-label="Return to home"
                >
                  ✨ Orbit
                </motion.button>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {showSettings && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate("/settings")}
                      className="rounded-full min-w-[44px] min-h-[44px]"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSignOut}
                    className="rounded-full text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px]"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
    </>
  );
};
