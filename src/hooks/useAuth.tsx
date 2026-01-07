import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if this was a session-only login that should be cleared
      const isSessionOnly = sessionStorage.getItem('orbit_session_only') === 'true';
      
      // If user closed browser and reopened, sessionStorage will be empty
      // but localStorage session still exists - we need to check if they previously
      // chose session-only mode
      if (session && !isSessionOnly) {
        setSession(session);
        setUser(session?.user ?? null);
      } else if (session && isSessionOnly) {
        // Keep the session for this tab since sessionStorage persists per-tab
        setSession(session);
        setUser(session?.user ?? null);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    // Handle session-only cleanup when tab/browser closes
    const handleBeforeUnload = () => {
      const isSessionOnly = sessionStorage.getItem('orbit_session_only') === 'true';
      if (isSessionOnly) {
        // Clear the session on browser close for session-only logins
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
