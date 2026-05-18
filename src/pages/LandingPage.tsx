import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Calendar, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Play
} from "lucide-react";
import { DemoTheatre } from "@/components/demo/DemoTheatre";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      icon: Calendar,
      title: "Emploi du temps intelligent",
      description: "Sync automatique avec ton calendrier universitaire. Plus jamais de cours manqués.",
      color: "from-primary/20 to-accent/20"
    },
    {
      icon: BookOpen,
      title: "Vault de notes organisé",
      description: "Tes notes classées automatiquement par matière grâce à l'IA.",
      color: "from-secondary/30 to-primary/20"
    },
    {
      icon: Brain,
      title: "Exam Lab",
      description: "Flashcards générées par IA pour réviser efficacement.",
      color: "from-accent/20 to-secondary/30"
    },
    {
      icon: Target,
      title: "Gestion des tâches",
      description: "Priorise tes devoirs selon leur urgence et importance.",
      color: "from-primary/30 to-accent/20"
    }
  ];

  const stats = [
    { value: "2x", label: "Plus productif" },
    { value: "0", label: "Cours oubliés" },
    { value: "100%", label: "Organisé" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <>
    {/* Demo Theatre Modal */}
    <DemoTheatre isOpen={showDemo} onClose={() => setShowDemo(false)} />
    
    <div className={`landing-scope min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 overflow-x-hidden transition-all duration-500 ${showDemo ? 'blur-xl scale-95' : ''}`}>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360]
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-2xl">✨</span>
            <span className="font-display text-xl font-bold text-foreground">Orbit</span>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              Connexion
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/25"
            >
              Commencer
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-32 pb-20 px-4"
        style={{ opacity, scale }}
      >
        <div className="container max-w-6xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">L'assistant étudiant ultime</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight"
            >
              Ta vie étudiante,
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                parfaitement organisée
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Orbit synchronise ton emploi du temps, organise tes notes et te prépare aux examens. 
              Tout ce dont tu as besoin, dans une seule app.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                Commencer gratuitement
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="rounded-full px-8 py-6 text-lg border-2 hover:bg-secondary/50 group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="flex justify-center gap-8 md:gap-16 mt-16"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            className="relative mt-20"
            variants={floatingVariants}
            animate="animate"
          >
            <motion.div 
              className="relative mx-auto max-w-4xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {/* Phone Mockup */}
              <div className="relative mx-auto w-64 md:w-80">
                <div className="bg-gradient-to-br from-card to-secondary/50 rounded-[3rem] p-3 shadow-2xl shadow-primary/20 border border-border/50">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* App Preview Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">✨ Orbit</span>
                        <div className="w-8 h-8 rounded-full bg-primary/20" />
                      </div>
                      <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-4">
                        <div className="text-xs text-muted-foreground">Prochain cours</div>
                        <div className="font-semibold text-sm mt-1">Marketing Digital</div>
                        <div className="text-xs text-muted-foreground mt-1">📍 Salle 204 • 14h00</div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">📘</div>
                          <div className="flex-1">
                            <div className="text-xs font-medium">Économie</div>
                            <div className="text-[10px] text-muted-foreground">3 notes</div>
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">⚖️</div>
                          <div className="flex-1">
                            <div className="text-xs font-medium">Droit</div>
                            <div className="text-[10px] text-muted-foreground">5 notes</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div 
                className="absolute -left-4 md:-left-20 top-20 bg-card/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/50"
                animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tâche complétée</div>
                    <div className="text-sm font-medium">Révision Chapitre 3 ✓</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -right-4 md:-right-16 top-40 bg-card/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/50"
                animate={{ y: [5, -5, 5], rotate: [2, -2, 2] }}
                transition={{ duration: 6, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Flashcards générées</div>
                    <div className="text-sm font-medium">15 nouvelles cartes</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Tout ce qu'il te faut pour réussir
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils pensés pour les étudiants, par des étudiants.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${feature.color} border border-border/50 backdrop-blur-sm`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-6 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Fini le chaos,
                <br />
                <span className="text-primary">place à la sérénité</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Clock, text: "Gagne 2h par semaine en organisation" },
                  { icon: TrendingUp, text: "Améliore tes notes avec les révisions IA" },
                  { icon: Calendar, text: "Ne rate plus jamais un cours ou deadline" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-lg text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 border border-border/50">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-background/80 rounded-2xl p-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Calendrier synchronisé</span>
                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 bg-background/80 rounded-2xl p-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">12 flashcards prêtes</span>
                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 bg-background/80 rounded-2xl p-4">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm">Prochain examen dans 3 jours</span>
                    <Sparkles className="w-5 h-5 text-primary ml-auto" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="container max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary to-accent p-12 text-center">
            {/* Animated Background */}
            <motion.div 
              className="absolute inset-0 opacity-30"
              animate={{ 
                backgroundPosition: ["0% 0%", "100% 100%"]
              }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              style={{
                backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)",
                backgroundSize: "30px 30px"
              }}
            />
            
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Prêt à transformer ta vie étudiante ?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Rejoins des milliers d'étudiants qui ont déjà adopté Orbit pour réussir leurs études.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-lg font-semibold shadow-xl"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-display font-bold text-foreground">Orbit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Orbit. Fait avec ❤️ pour les étudiants.
          </p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default LandingPage;
