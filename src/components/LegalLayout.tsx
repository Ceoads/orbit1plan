import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LegalLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/landing")}
          className="mb-8 -ml-2 rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <header className="mb-10 space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">{subtitle}</p>
        </header>

        <div className="space-y-8 rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] md:p-10">
          {children}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Une question ? Écris-nous à{" "}
          <a
            href="mailto:contact@orbit-plan.com"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            contact@orbit-plan.com
          </a>
        </p>
      </div>
    </div>
  );
};

export const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
    <div className="text-[15px] leading-relaxed text-muted-foreground space-y-3">{children}</div>
  </section>
);

export const LegalList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 pl-1">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
