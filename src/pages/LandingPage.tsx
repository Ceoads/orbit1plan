import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, CalendarDays, FolderOpen, Sparkles, MessageCircle, Mic, Brain, ListChecks, GraduationCap, NotebookPen, ShieldCheck, MonitorSmartphone, Cloud, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DemoTheatre } from "@/components/demo/DemoTheatre";
import { LandingWorkspace } from "@/components/landing/LandingWorkspace";
import deskImage from "@/assets/landing-desk.jpg";

const features = [
  { icon: MessageCircle, title: "Orbit AI", text: "Un prof perso qui s’appuie sur tes cours, tes tâches et ton emploi du temps pour t’aider à comprendre." },
  { icon: Mic, title: "Parle, Orbit te répond", text: "Pose tes questions à la voix et poursuis la conversation en mode mains libres." },
  { icon: FolderOpen, title: "Google Drive & Vault", text: "Importe tes documents et retrouve-les par matière. L’IA t’aide à les classer selon leur contenu." },
  { icon: CalendarDays, title: "Ton calendrier connecté", text: "Synchronise ton emploi du temps universitaire via iCal et garde tes prochains cours à portée de main." },
  { icon: Brain, title: "Quiz & flashcards", text: "Transforme tes cours en révisions actives, avec des quiz de difficulté adaptée et des fiches mémorisables." },
  { icon: ListChecks, title: "Échéances du semestre", text: "Rassemble devoirs, examens et tâches. Priorise ta journée et retrouve tes rappels au même endroit." },
  { icon: GraduationCap, title: "Tes notes, en perspective", text: "Ajoute tes résultats et coefficients pour suivre tes moyennes par matière et ta moyenne générale." },
  { icon: NotebookPen, title: "Ton bloc-notes du jour", text: "Garde tes idées, tes priorités et tes objectifs de révision dans un espace simple, lié à tes cours." },
  { icon: Image, title: "Des explications visuelles", text: "Demande un dessin ou un schéma à Orbit AI pour voir autrement une notion difficile." },
];
const faqs = [
  { question: "Est-ce que je peux commencer gratuitement ?", answer: "Oui, tu peux créer ton compte et commencer à utiliser Orbit gratuitement. Il n’y a pas d’abonnement à souscrire actuellement." },
  { question: "Dois-je connecter Google Drive ou mon calendrier ?", answer: "Non. Ces connexions sont facultatives : tu peux importer tes documents et ajouter tes matières et tes tâches manuellement. Tu peux connecter tes outils plus tard." },
  { question: "Est-ce qu’Orbit fonctionne sur téléphone et ordinateur ?", answer: "Oui. Le téléphone et l’ordinateur ont chacun un espace adapté, et tu retrouves les données de ton compte sur les deux." },
  { question: "Que peut faire Orbit AI avec mes cours ?", answer: "Orbit peut expliquer une notion, t’aider à réviser et tenir compte du contexte de ton compte. Tu peux aussi lui demander un schéma ou discuter à la voix. Comme toute IA, ses réponses peuvent contenir des erreurs : vérifie les points importants avec tes cours." },
  { question: "Est-ce que je garde le contrôle de mes données ?", answer: "Tu peux déconnecter Google Drive depuis tes réglages et supprimer ton compte. La page Confidentialité détaille les données traitées et les services utilisés par Orbit." },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const reducedMotion = useReducedMotion();
  const reveal = { initial: reducedMotion ? false as const : { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.5 } };
  return (
    <>
      <DemoTheatre isOpen={showDemo} onClose={() => setShowDemo(false)} />
      <div className="landing-page min-h-screen overflow-x-clip bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-2xl">
          <nav aria-label="Navigation principale" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <Link to="/landing" aria-label="Orbit, accueil" className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-6 w-6 text-accent-foreground" />Orbit<span className="hidden text-xs font-normal text-muted-foreground lg:inline">Your second school brain</span></Link>
            <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"><a className="py-3 hover:text-foreground" href="#features">Fonctionnalités</a><a className="py-3 hover:text-foreground" href="#workspace">L’espace Orbit</a><a className="py-3 hover:text-foreground" href="#faq">Questions</a></div>
            <div className="flex items-center gap-1 sm:gap-3"><Button variant="ghost" className="min-h-11 px-2 sm:px-4" onClick={() => navigate('/auth')}>Connexion</Button><Button onClick={() => navigate('/auth')} className="min-h-11 rounded-full px-4 sm:px-5">Commencer<ArrowRight className="hidden sm:block" /></Button></div>
          </nav>
        </header>
        <main>
          <section className="relative isolate px-5 py-16 text-center sm:px-8 sm:py-20">
            <img src={deskImage} alt="" fetchPriority="high" width={1920} height={1088} className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-background/65 dark:bg-background/90" />
            <motion.div {...reveal} className="mx-auto max-w-3xl">
              <p className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-accent-foreground"><Sparkles className="h-4 w-4" /> MOINS DE CHAOS. PLUS DE PLACE POUR TOI.</p>
              <h1 className="text-6xl font-bold leading-tight sm:text-7xl">Orbit</h1>
              <p className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Tes études, l’esprit plus léger.</p>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">Tes cours, ton emploi du temps et tes révisions, réunis. Avec un assistant IA qui connaît ton contexte et t’aide à avancer.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" className="h-12 rounded-full px-6" onClick={() => navigate('/auth')}>Commencer gratuitement<ArrowRight /></Button><Button variant="outline" size="lg" className="h-12 rounded-full bg-card/80 px-6" onClick={() => setShowDemo(true)}><Play />Voir la démo</Button></div>
              <p className="mt-5 text-xs text-muted-foreground">Sur téléphone et ordinateur · Connexions facultatives</p>
            </motion.div>
          </section>
          <div className="border-y border-border/40 bg-card/60 px-5 py-6"><div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">{[{ icon: Cloud, text: "Google Drive" }, { icon: CalendarDays, text: "Calendrier iCal" }, { icon: Mic, text: "Conversation vocale" }, { icon: MonitorSmartphone, text: "Téléphone & ordinateur" }].map(({ icon: Icon, text }) => <span key={text} className="flex items-center gap-2"><Icon className="h-4 w-4 text-accent-foreground" />{text}</span>)}</div></div>
          <section id="workspace" className="scroll-mt-24 px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-6xl">
              <motion.div {...reveal} className="mb-10 text-center"><p className="mb-3 text-sm font-semibold text-accent-foreground">TON ESPACE, PAS UNE APPLICATION DE PLUS</p><h2 className="text-3xl font-bold sm:text-4xl">Tout se retrouve. Tout se relie.</h2><p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">Une journée claire, des cours rangés et un coup de main quand tu bloques.</p></motion.div>
              <motion.div {...reveal}><LandingWorkspace /></motion.div>
            </div>
          </section>
          <section id="features" className="scroll-mt-24 bg-card/50 px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-6xl"><motion.div {...reveal} className="mb-12 max-w-2xl"><p className="mb-3 text-sm font-semibold text-accent-foreground">DU PREMIER COURS AU DERNIER PARTIEL</p><h2 className="text-3xl font-bold sm:text-4xl">Un peu moins à gérer.<br />Beaucoup plus pour avancer.</h2></motion.div>
              <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <motion.article {...reveal} key={title}><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Icon className="h-6 w-6" /></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p></motion.article>)}</div>
            </div>
          </section>
          <section className="px-5 py-20 sm:px-8"><div className="mx-auto max-w-6xl"><motion.div {...reveal} className="mb-12 text-center"><h2 className="text-3xl font-bold sm:text-4xl">Commence là où tu en es.</h2><p className="mt-4 text-muted-foreground">Pas besoin de tout configurer pour faire le premier pas.</p></motion.div><div className="grid gap-10 md:grid-cols-3">{[{ title: "Crée ton espace", text: "Un compte, tes matières, et un endroit pour te poser." }, { title: "Ajoute ton premier cours", text: "Importe un document, ou connecte ton Drive et ton calendrier." }, { title: "Fais ton premier pas", text: "Une question à Orbit, un quiz ou une tâche pour aujourd’hui." }].map((step, index) => <motion.div {...reveal} key={step.title} className="border-t border-border pt-6"><span className="text-sm font-semibold text-accent-foreground">0{index + 1}</span><h3 className="mt-4 text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p></motion.div>)}</div></div></section>
          <section className="bg-secondary/60 px-5 py-12 sm:px-8"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-accent-foreground" /><div><h2 className="text-xl font-bold">Ton espace. Tes données. Ton choix.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Connexions facultatives, déconnexion depuis les réglages et suppression de compte en libre-service.</p></div></div><Button variant="link" asChild className="shrink-0 text-foreground"><Link to="/privacy">Notre engagement<ArrowRight /></Link></Button></div></section>
          <section id="faq" className="scroll-mt-24 px-5 py-20 sm:px-8"><div className="mx-auto max-w-3xl"><h2 className="mb-8 text-3xl font-bold sm:text-4xl">Tu te demandes peut-être…</h2><Accordion type="single" collapsible>{faqs.map((faq, index) => <AccordionItem key={faq.question} value={`faq-${index}`} className="border-border/60"><AccordionTrigger className="gap-5 py-6 text-left text-base">{faq.question}</AccordionTrigger><AccordionContent className="pr-8 leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>
          <section className="bg-accent px-5 py-16 text-center sm:px-8"><motion.div {...reveal} className="mx-auto max-w-2xl"><Sparkles className="mx-auto mb-5 h-8 w-8 text-accent-foreground" /><h2 className="text-3xl font-bold sm:text-4xl">Orbit. Un semestre plus serein.</h2><p className="mt-4 text-muted-foreground">Ton prochain cours est un bon point de départ.</p><Button size="lg" onClick={() => navigate('/auth')} className="mt-7 h-12 rounded-full px-7">Créer mon compte gratuit<ArrowRight /></Button><p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Check className="h-3 w-3" />Commence à ton rythme</p></motion.div></section>
        </main>
        <footer className="px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><Link to="/landing" className="text-xl font-bold">Orbit</Link><p className="mt-1 text-xs text-muted-foreground">Your second school brain</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"><Link to="/privacy" className="hover:text-foreground">Confidentialité</Link><Link to="/terms" className="hover:text-foreground">Conditions d’utilisation</Link><Link to="/delete-account" className="hover:text-foreground">Supprimer mon compte</Link></div><p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Orbit</p></div></footer>
      </div>
    </>
  );
};
export default LandingPage;
