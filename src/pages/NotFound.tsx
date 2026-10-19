import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center mesh-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="font-display text-6xl font-bold text-foreground">404</p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Cette page n'existe pas ou a été déplacée. Reviens à ton espace pour retrouver tes cours
          et tes révisions.
        </p>
        <Button
          className="gradient-primary mt-8 rounded-full px-8"
          onClick={() => navigate("/", { replace: true })}
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
