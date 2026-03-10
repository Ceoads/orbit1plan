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
  Calendar, AlertCircle, Eye, Sparkles, CheckCircle2, ChevronsUpDown, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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

function categorizeGroup(code: string): string {
  const upper = code.toUpperCase();
  if (/^TP\d/i.test(upper)) return "TP";
  if (/^TD\d/i.test(upper)) return "TD";
  if (/^G\d/i.test(upper) || /^GROUPE/i.test(upper)) return "Groupe";
  if (/^TC\d/i.test(upper)) return "TC";
  if (/^CM/i.test(upper)) return "CM";
  return "Autre";
}

const categoryLabels: Record<string, string> = {
  TP: "🔬 TP",
  TD: "📝 TD",
  Groupe: "👥 Groupe",
  TC: "🎓 Tronc commun",
  CM: "🏛️ CM",
  Autre: "📋 Autres",
};

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
  const [popoverOpen, setPopoverOpen] = useState(false);

  const loadingMessages = [
    "Connexion au serveur...",
    "Téléchargement du calendrier...",
    "Analyse des événements...",
    "Détection des groupes...",
  ];

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
    if (icalUrl) scanForGroups();
  }, [icalUrl]);

  useEffect(() => {
    if (loading && loadingStep < loadingMessages.length - 1) {
      const timer = setTimeout(() => setLoadingStep(prev => prev + 1), 800);
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
      setDetectedGroups(data.detectedGroups || []);
      setTotalEventsScanned(data.totalEventsScanned || 0);
      if ((data.detectedGroups || []).length === 0) setShowManual(true);
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

  /**
   * Given a group code like "TP1", find related groups (e.g. "TD1", "G1 A")
   * that share the same number suffix and exist in detectedGroups.
   */
  const findRelatedGroups = (code: string): string[] => {
    // Extract the numeric part: "TP1" → "1", "TP1A" → "1A", "TD2" → "2"
    const match = code.match(/^(?:TP|TD|G|CM|TC)(\d+\s*[A-Z]?)$/i);
    if (!match) return [];
    const suffix = match[1].replace(/\s/g, "");
    const codeType = code.replace(/\d.*$/, "").toUpperCase(); // "TP", "TD", etc.

    const relatedTypes = ["TP", "TD", "G", "CM", "TC"];
    const related: string[] = [];

    for (const g of detectedGroups) {
      if (g.code === code) continue;
      const gMatch = g.code.match(/^(?:TP|TD|G|CM|TC)(\d+\s*[A-Z]?)$/i);
      if (!gMatch) continue;
      const gSuffix = gMatch[1].replace(/\s/g, "");
      const gType = g.code.replace(/\d.*$/, "").toUpperCase();

      // Same suffix, different type → related
      if (gSuffix === suffix && gType !== codeType && relatedTypes.includes(gType)) {
        related.push(g.code);
      }
    }
    return related;
  };

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleGroupToggle = (code: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      const wasAdded = !next.has(code);
      if (wasAdded) {
        next.add(code);
        // Find related groups to suggest
        const related = findRelatedGroups(code).filter(r => !next.has(r));
        setSuggestions(prev => [...new Set([...prev.filter(s => !next.has(s)), ...related])]);
      } else {
        next.delete(code);
        setSuggestions(prev => prev.filter(s => s !== code));
      }
      const groupStr = Array.from(next).join(",");
      if (groupStr) fetchPreview(groupStr);
      return next;
    });
    setManualGroup("");
  };

  const handleAcceptSuggestion = (code: string) => {
    setSuggestions(prev => prev.filter(s => s !== code));
    handleGroupToggle(code);
  };

  const handleDismissSuggestion = (code: string) => {
    setSuggestions(prev => prev.filter(s => s !== code));
  };

  const handleConfirm = async () => {
    const groupToSave = selectedGroupString || manualGroup;
    setSyncing(true);
    try {
      await supabase.from('user_settings').upsert({
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
        setTimeout(() => onGroupSelected(groupToSave || ''), 1000);
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
          <div className="space-y-3">
            {/* Multi-select dropdown */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between h-auto min-h-[44px] bg-background/50 border-border"
                >
                  {selectedGroups.size > 0 ? (
                    <span className="text-sm font-medium">
                      {selectedGroups.size} groupe{selectedGroups.size > 1 ? 's' : ''} sélectionné{selectedGroups.size > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Choisir tes groupes...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            {/* Auto-suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 bg-accent/30 rounded-xl border border-accent/50 space-y-2">
                <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Groupes liés détectés
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(code => (
                    <div key={code} className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptSuggestion(code)}
                        className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10"
                      >
                        <Check className="w-3 h-3" />
                        Ajouter {code}
                      </Button>
                      <button onClick={() => handleDismissSuggestion(code)} className="text-muted-foreground hover:text-foreground p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un groupe..." />
                  <CommandList>
                    <CommandEmpty>Aucun groupe trouvé.</CommandEmpty>
                    {Object.entries(groupedByCategory).map(([cat, groups]) => (
                      <CommandGroup key={cat} heading={categoryLabels[cat] || cat}>
                        {groups.map((group) => {
                          const isActive = selectedGroups.has(group.code);
                          return (
                            <CommandItem
                              key={group.code}
                              value={group.code}
                              onSelect={() => handleGroupToggle(group.code)}
                              className="cursor-pointer"
                            >
                              <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isActive ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                                {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="flex-1 font-medium">{group.code}</span>
                              <span className="text-xs text-muted-foreground">{group.count} cours</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected badges */}
            {selectedGroups.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedGroups).map(code => (
                  <Badge key={code} variant="default" className="gap-1 pr-1">
                    {code}
                    <button onClick={() => handleGroupToggle(code)} className="ml-1 rounded-full hover:bg-primary-foreground/20 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
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

      {/* Preview */}
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

      {/* Actions */}
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
