import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Clock, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Calendar,
  BookOpen,
  Bell,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Orbit</span>
          </div>
          <Button onClick={handleGetStarted} className="font-semibold">
            Get Started
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Your Second Brain for School
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Finally Feel in Control
              <br />
              <span className="text-primary">of Your School Life</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stop drowning in forgotten assignments and missed deadlines. 
              Orbit automatically organizes your classes, tasks, and notes — 
              so you can focus on learning, not remembering.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Get Started for Free
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6"
              >
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="glass-card p-4 md:p-8 max-w-4xl mx-auto rounded-2xl border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Today's Classes</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-subject-math/20 rounded-lg p-2 text-sm">
                      <span className="font-medium">Math</span>
                      <span className="text-muted-foreground ml-2">9:00 AM</span>
                    </div>
                    <div className="bg-subject-science/20 rounded-lg p-2 text-sm">
                      <span className="font-medium">Physics</span>
                      <span className="text-muted-foreground ml-2">11:30 AM</span>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl bg-warning/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-warning" />
                    <span className="font-semibold">Priority Tasks</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Essay Draft - Due Tomorrow</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      <span>Study for Quiz</span>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl bg-success/5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-success" />
                    <span className="font-semibold">Recent Notes</span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>AI-summarized notes from your last class...</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agitation Section - "The Old Way" */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Sound Familiar?
            </h2>
            <p className="text-muted-foreground text-lg">
              The daily struggle of staying organized in school
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "The Endless To-Do List",
                description: "You write everything down, but somehow still forget the most important assignment. Your notes are scattered across apps, papers, and messages.",
                icon: Clock,
              },
              {
                title: "The Overwhelm Spiral",
                description: "Looking at your workload makes you freeze. Everything feels equally urgent, so nothing gets done. Deadlines sneak up on you.",
                icon: Brain,
              },
              {
                title: "The Memory Maze",
                description: "\"When is that exam again?\" \"Did I have homework?\" You spend more time trying to remember what to do than actually doing it.",
                icon: Target,
              },
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <problem.icon className="w-6 h-6 text-destructive" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-3">
                      {problem.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {problem.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Pivot - Solution Introduction */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-6 py-3 rounded-full bg-success/10 text-success font-semibold mb-6">
              There's a Better Way
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Meet <span className="text-primary">Orbit</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered second brain that automatically captures, organizes, 
              and prioritizes everything — so you never have to wonder "what's next" again.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Benefit 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center mb-24"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Save Hours Every Week
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Stop wasting time organizing. Orbit syncs with your school calendar, 
                auto-captures notes, and creates tasks from upcoming exams — all automatically.
              </p>
              <ul className="space-y-3">
                {["Auto-sync with your school portal", "Smart task generation from calendar", "One-click note capture"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-primary" />
                <span className="font-semibold">Auto-Synced Calendar</span>
                <span className="ml-auto text-xs text-success bg-success/10 px-2 py-1 rounded-full">Live</span>
              </div>
              <div className="space-y-3">
                {["9:00 - Math", "11:30 - Physics", "14:00 - Literature"].map((item, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-subject-math' : i === 1 ? 'bg-subject-science' : 'bg-subject-literature'}`} />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Benefit 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center mb-24"
          >
            <div className="order-2 md:order-1 glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-warning" />
                <span className="font-semibold">Smart Priority Engine</span>
              </div>
              <div className="space-y-3">
                <div className="bg-destructive/10 rounded-lg p-3 border-l-4 border-destructive">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-destructive">URGENT</span>
                  </div>
                  <p className="text-sm font-medium">Essay Due Tomorrow</p>
                </div>
                <div className="bg-warning/10 rounded-lg p-3 border-l-4 border-warning">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-warning">HIGH</span>
                  </div>
                  <p className="text-sm font-medium">Study for Physics Quiz</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-muted-foreground/30">
                  <p className="text-sm font-medium">Read Chapter 5</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Eliminate Decision Fatigue
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Stop staring at your to-do list wondering where to start. 
                Orbit's AI calculates what matters most based on deadlines, 
                difficulty, and your energy levels.
              </p>
              <ul className="space-y-3">
                {["AI-powered priority scoring", "Energy-based task matching", "Never miss a deadline again"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Benefit 3 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Ace Every Exam
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Your notes, organized by subject. AI summaries that highlight what matters. 
                Everything you need to study, exactly when you need it.
              </p>
              <ul className="space-y-3">
                {["AI-generated study summaries", "Notes linked to classes automatically", "Smart exam preparation reminders"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-success" />
                <span className="font-semibold">Smart Notes Vault</span>
              </div>
              <div className="space-y-3">
                <div className="bg-subject-math/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-subject-math" />
                    <span className="text-sm font-medium">Math Notes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI Summary: Key formulas for derivatives...</p>
                </div>
                <div className="bg-subject-science/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-subject-science" />
                    <span className="text-sm font-medium">Physics Notes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI Summary: Newton's laws explained...</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-12">
              Built for Students Who Think Differently
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  quote: "I finally stopped forgetting assignments. Orbit is like having a personal assistant.",
                  name: "Sarah M.",
                  role: "University Student"
                },
                {
                  quote: "The AI priority system is a game-changer. I actually know what to work on first now.",
                  name: "Alex K.",
                  role: "High School Senior"
                },
                {
                  quote: "My grades improved because I'm not wasting mental energy trying to remember everything.",
                  name: "Jordan T.",
                  role: "College Freshman"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="text-left">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Stop Fighting Your Brain.
              <br />
              <span className="text-primary">Start Working With It.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of students who've discovered what it feels like 
              to actually have their school life under control.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-10 py-7 font-bold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Orbit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Orbit. Your second brain for school.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
