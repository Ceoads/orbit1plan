import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Erreur applicative interceptée:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center mesh-background p-6">
        <div className="w-full max-w-md rounded-3xl bg-card p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="font-display text-5xl font-bold text-foreground">Oups</p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Quelque chose s'est mal passé. Ton travail est en sécurité : recharge la page pour
            reprendre là où tu en étais.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button className="gradient-primary rounded-full" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => (window.location.href = "/")}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
