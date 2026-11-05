import { Brain, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudyStudioHeader({ kind, title, detail, children }: {
  kind: "quiz" | "flashcards"; title: string; detail?: string; children?: React.ReactNode;
}) {
  const Icon = kind === "quiz" ? Brain : Layers;
  return (
    <header className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Icon className="h-6 w-6" /></span>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal break-words">{title}</h1>
          {detail && <p className="mt-1.5 text-sm text-muted-foreground break-words">{detail}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export function StudyGenerateButton({ loading, label, onClick }: { loading: boolean; label: string; onClick: () => void }) {
  return <Button onClick={onClick} disabled={loading} className="h-14 sm:h-12 w-full rounded-2xl sm:rounded-xl px-5 text-base sm:text-sm">
    <Sparkles className={loading ? "animate-pulse" : ""} />{loading ? "Création en cours…" : label}
  </Button>;
}