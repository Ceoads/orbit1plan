import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Loader2, Users, Check, 
  Calendar, AlertCircle, Eye, Sparkles, CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GroupSelectorProps {
  icalUrl: string;
  onGroupSelected: (group: string) => void;
  onSkip?: () => void;
}

interface DetectedGroup {
  code: string;
  count: number;
}

interface PreviewEvent {
  title: string;
  time: string;
  day: string;
}

/** Categorize a group code into TP, TD, G, or Other */
function categorizeGroup(code: string): string {
  const upper = code.toUpperCase();
  if (/^TP\d/i.test(upper)) return "TP";
  if (/^TD\d/i.test(upper)) return "TD";
  if (/^G\d/i.test(upper) || /^GROUPE/i.test(upper)) return "Groupe";
  if (/^TC\d/i.test(upper)) return "TC";
  if (/^CM/i.test(upper)) return "CM";
  return "Autre";
}

export const GroupSelector = ({ icalUrl, onGroupSelected, onSkip }: GroupSelectorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [detectedGroups, setDetectedGroups] = useState<DetectedGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [manualGroup, setManualGroup] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [totalEventsScanned, setTotalEventsScanned] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const loadingMessages = [
    "Connexion au serveur...",
    "Téléchargement du calendrier...",
    "Analyse des 100 premiers événements...",
    "Détection des groupes...",
  ];

  // Group detected groups by category
  const groupedByCategory = useMemo(() => {
    const cats: Record<string, DetectedGroup[]> = {};
    for (const g of detectedGroups) {
      const cat = categorizeGroup(g.code);
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(g);
    }
    return cats;
  }, [detectedGroups]);

  const selectedGroupString = useMemo(() => {
    return Array.from(selectedGroups).join(",");
  }, [selectedGroups]);

  useEffect(() => {
    if (icalUrl) {
      scanForGroups();
    }
  }, [icalUrl]);

  useEffect(() => {
    if (loading && loadingStep < loadingMessages.length - 1) {
      const timer = setTimeout(() => {
        setLoadingStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, loadingStep]);

  const scanForGroups = async () => {
    setLoading(true);
    setLoadingStep(0);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user?.id, icalUrl, scanOnly: true },
      });
      if (error) throw error;

      const groups = data.detectedGroups || [];
      setDetectedGroups(groups);
      setTotalEventsScanned(data.totalEventsScanned || 0);

      if (groups.length === 0) {
        setShowManual(true);
      }
    } catch (error: any) {
      console.error('Error scanning for groups:', error);
      setShowManual(true);
      toast.error("Impossible de détecter les groupes", {
        description: "Vérifie l'URL ou entre ton groupe manuellement",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async (groupCodes: string) => {
    if (!groupCodes) return;
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user?.id, icalUrl, previewOnly: true, filterGroup: groupCodes },
      });
      if (error) throw error;
      setPreviewEvents(data.previewEvents || []);
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGroupToggle = (code: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      // Fetch preview with new selection
      const groupStr = Array.from(next).join(",");
      if (groupStr) fetchPreview(groupStr);
      return next;
    });
    setManualGroup("");
  };

  const handleConfirm = async () => {
    const groupToSave = selectedGroupString || manualGroup;
    setSyncing(true);
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ical_filter_group: groupToSave || null,
          ical_url: icalUrl,
        }, { onConflict: 'user_id' });

      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user?.id, icalUrl, filterGroup: groupToSave || undefined },
      });
      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        setSyncSuccess(true);
        toast.success(`${result.eventsSynced} cours synchronisés !`, {
          description: groupToSave ? `Filtré par: ${groupToSave}` : 'Tous les cours importés',
        });
        setTimeout(() => { onGroupSelected(groupToSave || ''); }, 1000);
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast.error("Erreur lors de la synchronisation", { description: error.message });
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="text-center w-full max-w-xs">
            <p className="font-display font-semibold text-foreground mb-2">Analyse en cours...</p>
            <Progress value={(loadingStep + 1) / loadingMessages.length * 100} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground animate-pulse">{loadingMessages[loadingStep]}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (syncSuccess) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-foreground">Synchronisation réussie !</p>
            <p className="text-sm text-muted-foreground mt-1">Redirection en cours...</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const categoryLabels: Record<string, string> = {
    TP: "🔬 Groupe de TP",
    TD: "📝 Groupe de TD",
    Groupe: "👥 Groupe général",
    TC: "🎓 Tronc commun",
    CM: "🏛️ Cours magistral",
    Autre: "📋 Autres groupes",
  };

  return (
    <div className="space-y-4">
      <GlassCard variant="elevated" className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Sélectionne tes groupes</h2>
          </div>
          {totalEventsScanned > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {totalEventsScanned} analysés
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choisis ton groupe de <strong>TP</strong> et ton groupe de <strong>TD</strong> pour ne voir que tes cours.
          <br />
          <span className="text-xs">💡 Ex : si tu es en TP1, tu es aussi en TD1 — sélectionne les deux.</span>
        </p>

        {detectedGroups.length > 0 && !showManual ? (
          <div className="space-y-5">
            {/* Groups by category */}
            {Object.entries(groupedByCategory).map(([cat, groups]) => (
              <div key={cat} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {categoryLabels[cat] || cat}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {groups.map((group) => {
                    const isActive = selectedGroups.has(group.code);
                    return (
                      <button
                        key={group.code}
                        onClick={() => handleGroupToggle(group.code)}
                        className={`relative flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                          isActive
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <span className={`font-display font-bold text-lg ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {group.code}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.count} cours
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Selected summary */}
            {selectedGroups.size > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-primary font-medium">
                  Sélection : {Array.from(selectedGroups).join(" + ")}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManual(true)}
              className="text-muted-foreground w-full"
            >
              Mon groupe n'est pas dans la liste
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedGroups.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Aucun groupe détecté automatiquement. Entre tes codes manuellement.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="manual-group">Codes de groupes (séparés par des virgules)</Label>
              <Input
                id="manual-group"
                placeholder="Ex: TP1, TD1"
                value={manualGroup}
                onChange={(e) => { setManualGroup(e.target.value); setSelectedGroups(new Set()); }}
                className="bg-background/50 border-border"
              />
              <p className="text-xs text-muted-foreground">
                💡 Entre ton groupe TP <strong>et</strong> ton groupe TD. Laisse vide pour tout importer.
              </p>
            </div>
            {detectedGroups.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowManual(false)} className="text-primary">
                ← Retour à la sélection
              </Button>
            )}
          </div>
        )}
      </GlassCard>

      {/* Preview Section */}
      {(selectedGroups.size > 0 || manualGroup) && (
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Aperçu des prochains cours</span>
          </div>
          {loadingPreview ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : previewEvents.length > 0 ? (
            <div className="space-y-2">
              {previewEvents.slice(0, 4).map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.day} • {event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Aucun cours futur trouvé pour ce filtre</p>
          )}
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleConfirm}
          disabled={syncing}
          className="w-full h-12 rounded-xl gradient-primary text-white font-medium"
        >
          {syncing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Synchronisation...</>
          ) : (
            <><Check className="w-5 h-5 mr-2" />
              {selectedGroups.size > 0
                ? `Synchroniser (${Array.from(selectedGroups).join(" + ")})`
                : manualGroup
                  ? `Synchroniser (${manualGroup})`
                  : 'Synchroniser tous les cours'}
            </>
          )}
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={syncing} className="w-full text-muted-foreground">
            Configurer plus tard
          </Button>
        )}
      </div>
    </div>
  );
};
