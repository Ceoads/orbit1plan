import {
  Atom,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Calculator,
  Camera,
  ChartNoAxesCombined,
  Code2,
  Cog,
  Database,
  Dna,
  DraftingCompass,
  Dumbbell,
  FlaskConical,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Languages,
  Music2,
  Network,
  Palette,
  Scale,
  ShieldCheck,
  Theater,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubjectIconSize = "sm" | "md" | "lg" | "xl";

interface SubjectIconProps {
  name: string;
  legacyIcon?: string | null;
  size?: SubjectIconSize;
  bare?: boolean;
  className?: string;
}

const RULES: Array<[RegExp, LucideIcon]> = [
  [/math|algèbre|algebre|analyse|stat|probab|calcul/, Calculator],
  [/physique|mécanique|mecanique|optique|thermo|électronique|electronique/, Atom],
  [/chimie|biochimie|organique/, FlaskConical],
  [/biologie|génétique|genetique|écologie|ecologie|svt/, Dna],
  [/informatique|programmation|développement|developpement|coding|algorithm|web|javascript|react/, Code2],
  [/base de données|base de donnees|database|sql|bdd|data/, Database],
  [/réseau|reseau|network|linux|serveur|système|systeme/, Network],
  [/cyber|sécurité|securite|security|crypto/, ShieldCheck],
  [/intelligence artificielle|machine learning|deep learning|\bia\b|\bml\b/, BrainCircuit],
  [/anglais|english|allemand|german|espagnol|spanish|chinois|mandarin|japonais|langue|communication/, Languages],
  [/français|francais|littérature|litterature|lettres?/, BookOpen],
  [/histoire|géographie|geographie|sciences po|politique|institutions/, Landmark],
  [/droit|juridique|legal|contrat/, Scale],
  [/économie|economie|finance|comptab|budget|marketing/, ChartNoAxesCombined],
  [/management|gestion|commerce|vente|négociation|negociation|entrepren|business|projet/, BriefcaseBusiness],
  [/ressources humaines|recrutement|sociologie|social|\brh\b/, UsersRound],
  [/psychologie|cognitif|philosophie|éthique|ethique/, BrainCircuit],
  [/art|dessin|peinture|design|graphique|visuel/, Palette],
  [/musique|instrument|solfège|solfege/, Music2],
  [/photo|vidéo|video|audiovisuel/, Camera],
  [/théâtre|theatre|drama|scène|scene/, Theater],
  [/sport|eps|gym|athlétisme|athletisme/, Dumbbell],
  [/santé|sante|médecine|medecine|anatomie|médical|medical/, HeartPulse],
  [/conception|cao|cad|architecture|bâtiment|batiment|construction|urbanisme/, DraftingCompass],
  [/machine|moteur|industriel/, Cog],
];

const LEGACY: Record<string, LucideIcon> = {
  "📐": Calculator,
  "🔢": Calculator,
  "⚛️": Atom,
  "⚡": Atom,
  "🧪": FlaskConical,
  "🧬": Dna,
  "💻": Code2,
  "🌐": Code2,
  "🗄️": Database,
  "🔧": Network,
  "🔐": ShieldCheck,
  "🤖": BrainCircuit,
  "📜": Landmark,
  "🌍": Globe2,
  "⚖️": Scale,
  "📈": ChartNoAxesCombined,
  "📊": ChartNoAxesCombined,
  "💰": ChartNoAxesCombined,
  "🎨": Palette,
  "🎵": Music2,
  "📸": Camera,
  "🎭": Theater,
  "⚽": Dumbbell,
  "🏥": HeartPulse,
  "⚙️": Cog,
};

const getSubjectIcon = (name: string, legacyIcon?: string | null) => {
  const normalized = name.toLocaleLowerCase("fr-FR");
  return RULES.find(([pattern]) => pattern.test(normalized))?.[1]
    ?? (legacyIcon ? LEGACY[legacyIcon] : undefined)
    ?? GraduationCap;
};

const sizes: Record<SubjectIconSize, { frame: string; icon: string }> = {
  sm: { frame: "h-7 w-7 rounded-lg", icon: "h-3.5 w-3.5" },
  md: { frame: "h-9 w-9 rounded-xl", icon: "h-[18px] w-[18px]" },
  lg: { frame: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  xl: { frame: "h-14 w-14 rounded-2xl", icon: "h-6 w-6" },
};

export const SubjectIcon = ({ name, legacyIcon, size = "md", bare = false, className }: SubjectIconProps) => {
  const Icon = getSubjectIcon(name, legacyIcon);
  const dimensions = sizes[size];

  if (bare) {
    return <Icon aria-hidden="true" strokeWidth={1.8} className={cn(dimensions.icon, "shrink-0", className)} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-foreground/[0.055] text-foreground ring-1 ring-inset ring-foreground/[0.07]",
        dimensions.frame,
        className,
      )}
    >
      <Icon strokeWidth={1.7} className={dimensions.icon} />
    </span>
  );
};