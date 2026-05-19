import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useHaptics } from "@/hooks/useHaptics";
import { NavTab } from "@/components/BottomNav";
import { ProfileAvatar, useCurrentProfile } from "@/components/ProfileAvatar";

interface CollapsibleHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  showSettings: boolean;
}

export const CollapsibleHeader = ({
  activeTab,
  onTabChange,
  showSettings,
}: CollapsibleHeaderProps) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { profile, email } = useCurrentProfile();

  // Disable hide behavior on Pulse (home) page
  const isHomePage = activeTab === "pulse";
  const { scrollDirection, isAtTop } = useScrollDirection({
    disabled: isHomePage,
    threshold: 15,
  });

  const isVisible = isHomePage || isAtTop || scrollDirection === "up";

  const handleLogoClick = () => {
    if (activeTab !== "pulse") {
      haptics.soft();
      onTabChange("pulse");
    }
  };

  const handleAvatarClick = () => {
    haptics.selection();
    navigate("/settings");
  };

  return (
    <>
      <div className="h-14" />

      <AnimatePresence>
        {isVisible && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40"
          >
            <div
              className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              }}
            />

            <div className="relative bg-white/60 backdrop-blur-lg border-b border-white/20 transition-all duration-300">
              <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
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

                {showSettings && (
                  <motion.button
                    onClick={handleAvatarClick}
                    whileTap={{ scale: 0.92 }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
                    aria-label="Ouvrir le profil"
                  >
                    <ProfileAvatar
                      size={36}
                      avatarUrl={profile?.avatar_url}
                      displayName={profile?.display_name}
                      email={email}
                    />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
    </>
  );
};
