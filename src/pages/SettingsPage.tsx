import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  ArrowLeft, Calendar, RefreshCw, Check, AlertCircle,
  Link2, Clock, Loader2, Trash2, BookOpen, Users, Eye,
  MapPin, Navigation, QrCode, Play, Sparkles, ChevronsUpDown, X,
  ChevronRight, LogOut, Shield
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categorizeGroupSettings(code: string): string {
  const upper = code.toUpperCase();
  if (/^TP\d/i.test(upper)) return "TP";
  if (/^TD\d/i.test(upper)) return "TD";
  if (/^G\d/i.test(upper) || /^GROUPE/i.test(upper)) return "Groupe";
  if (/^TC\d/i.test(upper)) return "TC";
  if (/^CM/i.test(upper)) return "CM";
  return "Autre";
}

const settingsCategoryLabels: Record<string, string> = {
  TP: "🔬 TP", TD: "📝 TD", Groupe: "👥 Groupe", TC: "🎓 TC", CM: "🏛️ CM", Autre: "📋 Autres",
};

function findRelatedGroupsSettings(
  code: string,
  detectedGroups: { code: string; count: number }[]
): string[] {
  const match = code.match(/^(?:TP|TD|G|CM|TC)(\d+\s*[A-Z]?)$/i);
  if (!match) return [];
  const suffix = match[1].replace(/\s/g, "");
  const codeType = code.replace(/\d.*$/, "").toUpperCase();
  const relatedTypes = ["TP", "TD", "G", "CM", "TC"];
  const related: string[] = [];
  for (const g of detectedGroups) {
    if (g.code === code) continue;
    const gMatch = g.code.match(/^(?:TP|TD|G|CM|TC)(\d+\s*[A-Z]?)$/i);
    if (!gMatch) continue;
    const gSuffix = gMatch[1].replace(/\s/g, "");
    const gType = g.code.replace(/\d.*$/, "").toUpperCase();
    if (gSuffix === suffix && gType !== codeType && relatedTypes.includes(gType)) {
      related.push(g.code);
    }
  }
  return related;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsGroupDropdown({ detectedGroups, filterGroup, onFilterGroupChange, suggestions, onAcceptSuggestion, onDismissSuggestion }: {
  detectedGroups: { code: string; count: number }[];
  filterGroup: string;
  onFilterGroupChange: (val: string) => void;
  suggestions: string[];
  onAcceptSuggestion: (code: string) => void;
  onDismissSuggestion: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeGroups = filterGroup.split(",").map(g => g.trim()).filter(Boolean);

  const grouped: Record<string, typeof detectedGroups> = {};
  for (const g of detectedGroups) {
    const cat = categorizeGroupSettings(g.code);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(g);
  }

  const toggle = (code: string) => {
    const current = filterGroup.split(",").map(g => g.trim()).filter(Boolean);
    const next = current.includes(code) ? current.filter(g => g !== code) : [...current, code];
    onFilterGroupChange(next.join(","));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-[44px] bg-background/50 border-border rounded-xl">
            {activeGroups.length > 0 ? (
              <span className="text-sm">{activeGroups.length} groupe{activeGroups.length > 1 ? 's' : ''}</span>
            ) : (
              <span className="text-muted-foreground text-sm">Choisir tes groupes...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandList>
              <CommandEmpty>Aucun groupe.</CommandEmpty>
              {Object.entries(grouped).map(([cat, groups]) => (
                <CommandGroup key={cat} heading={settingsCategoryLabels[cat] || cat}>
                  {groups.map(g => {
                    const isActive = activeGroups.includes(g.code);
                    return (
                      <CommandItem key={g.code} value={g.code} onSelect={() => toggle(g.code)} className="cursor-pointer">
                        <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isActive ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                          {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="flex-1 font-medium">{g.code}</span>
                        <span className="text-xs text-muted-foreground">{g.count} cours</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-accent/30 rounded-xl border border-accent/50 space-y-2">
          <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Groupes liés détectés
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(code => (
              <div key={code} className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onAcceptSuggestion(code)} className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10">
                  <Check className="w-3 h-3" />
                  Ajouter {code}
                </Button>
                <button onClick={() => onDismissSuggestion(code)} className="text-muted-foreground hover:text-foreground p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active badges */}
      {activeGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeGroups.map(code => (
            <Badge key={code} variant="default" className="gap-1 pr-1 text-xs">
              {code}
              <button
                onClick={() => {
                  const next = activeGroups.filter(g => g !== code);
                  onFilterGroupChange(next.join(","));
                }}
                className="ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Setting row component ────────────────────────────────────────────────────

function SettingRow({ icon: Icon, label, description, action, border = true }: {
  icon: React.ElementType;
  label: string;
  description?: string;
  action: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-3.5 ${border ? 'border-b border-border/30' : ''}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface UserSettings {
  ical_url: string | null;
  ical_filter_group: string | null;
  last_synced_at: string | null;
  sync_enabled: boolean;
  timezone: string;
  campus_latitude: number | null;
  campus_longitude: number | null;
  campus_radius_meters: number;
  campus_name: string | null;
}

interface DetectedGroup {
  code: string;
  count: number;
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    hasCampusConfigured,
    campusName,
    isOnCampus,
    setCurrentAsCampus,
  } = useGeolocation();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [detectedGroups, setDetectedGroups] = useState<DetectedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanningGroups, setScanningGroups] = useState(false);
  const [campusNameInput, setCampusNameInput] = useState("");
  const [savingCampus, setSavingCampus] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings(data as UserSettings);
        setIcalUrl(data.ical_url || "");
        setFilterGroup(data.ical_filter_group || "");
        setCampusNameInput(data.campus_name || "");
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanForGroups = async () => {
    if (!icalUrl) return;
    setScanningGroups(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user?.id, icalUrl, scanOnly: true },
      });
      if (error) throw error;
      setDetectedGroups(data.detectedGroups || []);
      if (data.detectedGroups?.length === 0) toast.info("Aucun groupe détecté");
    } catch (error: any) {
      console.error('Error scanning groups:', error);
      toast.error("Erreur lors de la détection");
    } finally {
      setScanningGroups(false);
    }
  };

  const handleFilterGroupChange = (newVal: string) => {
    const oldGroups = filterGroup.split(",").map(g => g.trim()).filter(Boolean);
    const newGroups = newVal.split(",").map(g => g.trim()).filter(Boolean);
    // Find newly added groups
    const added = newGroups.filter(g => !oldGroups.includes(g));
    if (added.length > 0) {
      const newSuggestions: string[] = [];
      for (const code of added) {
        const related = findRelatedGroupsSettings(code, detectedGroups)
          .filter(r => !newGroups.includes(r));
        newSuggestions.push(...related);
      }
      setSuggestions(prev => [...new Set([...prev.filter(s => !newGroups.includes(s)), ...newSuggestions])]);
    }
    setFilterGroup(newVal);
  };

  const handleAcceptSuggestion = (code: string) => {
    setSuggestions(prev => prev.filter(s => s !== code));
    const current = filterGroup.split(",").map(g => g.trim()).filter(Boolean);
    if (!current.includes(code)) {
      const next = [...current, code].join(",");
      handleFilterGroupChange(next);
    }
  };

  const handleDismissSuggestion = (code: string) => {
    setSuggestions(prev => prev.filter(s => s !== code));
  };

  const handleSaveUrl = async () => {
    if (!user) return;
    let normalizedUrl = icalUrl;
    if (normalizedUrl.startsWith('webcal://')) {
      normalizedUrl = normalizedUrl.replace('webcal://', 'https://');
      setIcalUrl(normalizedUrl);
    }
    if (normalizedUrl && !normalizedUrl.includes('.ics') && !normalizedUrl.includes('ical') && !normalizedUrl.includes('calendar') && !normalizedUrl.includes('webcal') && !normalizedUrl.includes('planning') && !normalizedUrl.includes('pronote') && !normalizedUrl.includes('hyperplanning') && !normalizedUrl.includes('celcat') && !normalizedUrl.includes('ade')) {
      toast.error("Ce lien ne semble pas être un calendrier valide");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        ical_url: icalUrl || null,
        ical_filter_group: filterGroup || null,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success("Paramètres enregistrés !");
      if (icalUrl) handleSync();
    } catch (error: any) {
      console.error('Error saving URL:', error);
      toast.error("Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!user || !icalUrl) {
      toast.error("Ajoute d'abord ton URL de calendrier");
      return;
    }
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user.id, icalUrl, filterGroup: filterGroup || undefined },
      });
      if (error) throw error;
      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`${result.eventsSynced} cours synchronisés !`, {
          description: result.newSubjects > 0
            ? `${result.newSubjects} nouvelles matières`
            : result.filterApplied
              ? `Filtré par: ${result.filterApplied}`
              : undefined,
        });
        if (result.examsFound > 0) toast.info(`📚 ${result.examsFound} examens détectés !`);
        fetchSettings();
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error("Échec de la synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_settings').update({ sync_enabled: enabled }).eq('user_id', user.id);
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, sync_enabled: enabled } : null);
      toast.success(enabled ? "Sync auto activée" : "Sync auto désactivée");
    } catch (error: any) {
      toast.error("Échec de la mise à jour");
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    if (!confirm("Supprimer toutes tes données ? Cette action est irréversible.")) return;
    try {
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('notes_vault').delete().eq('user_id', user.id);
      await supabase.from('calendar_events').delete().eq('user_id', user.id);
      await supabase.from('subjects').delete().eq('user_id', user.id);
      toast.success("Données supprimées");
      navigate('/');
    } catch (error: any) {
      toast.error("Échec de la suppression");
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full -ml-2 w-9 h-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">Paramètres</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 pt-[72px]">
        {/* ──── Calendrier section ──── */}
        <SectionHeader icon={Calendar} label="Calendrier" color="text-primary" />

        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden mb-4">
          {/* URL iCal */}
          <div className="p-4 space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL iCal</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://ton-ecole.edu/calendar.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                className="flex-1 rounded-xl bg-muted/30 border-border/50 h-11"
              />
              <Button variant="outline" size="icon" onClick={() => setShowQRScanner(true)} className="shrink-0 rounded-xl h-11 w-11">
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Compatible <span className="font-medium text-foreground/70">Pronote</span> · <span className="font-medium text-foreground/70">Hyperplanning</span> · <span className="font-medium text-foreground/70">ADE</span> · <span className="font-medium text-foreground/70">CELCAT</span>
            </p>
          </div>

          <div className="h-px bg-border/30 mx-4" />

          {/* Groupes */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groupes TP / TD</Label>
              <Button variant="ghost" size="sm" onClick={scanForGroups} disabled={!icalUrl || scanningGroups} className="h-7 text-xs rounded-lg">
                {scanningGroups ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                Détecter
              </Button>
            </div>

            {detectedGroups.length > 0 && (
              <SettingsGroupDropdown
                detectedGroups={detectedGroups}
                filterGroup={filterGroup}
                onFilterGroupChange={handleFilterGroupChange}
                suggestions={suggestions}
                onAcceptSuggestion={handleAcceptSuggestion}
                onDismissSuggestion={handleDismissSuggestion}
              />
            )}

            <Input
              placeholder="Ou entre tes groupes : TP1, TD1..."
              value={filterGroup}
              onChange={(e) => handleFilterGroupChange(e.target.value)}
              className="rounded-xl bg-muted/30 border-border/50 h-10 text-sm"
            />
          </div>

          <div className="h-px bg-border/30 mx-4" />

          {/* Save + Sync */}
          <div className="p-4 space-y-3">
            <Button onClick={handleSaveUrl} disabled={saving} className="w-full h-11 rounded-xl font-medium gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Enregistrer et synchroniser
            </Button>

            {settings?.last_synced_at && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Dernière synchro</span>
                <span className="font-medium text-foreground/70">{new Date(settings.last_synced_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-border/30 mx-4" />

          {/* Sync settings rows */}
          <div className="px-4">
            <SettingRow
              icon={RefreshCw}
              label="Sync automatique"
              description="Mise à jour quotidienne"
              action={<Switch checked={settings?.sync_enabled ?? true} onCheckedChange={handleToggleSync} />}
            />
            <SettingRow
              icon={RefreshCw}
              label="Resynchroniser"
              border={false}
              action={
                <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing || !icalUrl} className="h-8 text-xs rounded-lg">
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lancer"}
                </Button>
              }
            />
          </div>
        </div>

        {/* ──── Campus section ──── */}
        <SectionHeader icon={MapPin} label="Campus" color="text-emerald-500" />

        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden mb-4">
          <div className="p-4">
            {hasCampusConfigured ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{campusName || 'Campus configuré'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isOnCampus ? '📍 Sur le campus' : '🏠 Hors campus'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Configure la position de ton campus pour le mode intelligent.</p>
                <Input
                  placeholder="Nom du campus"
                  value={campusNameInput}
                  onChange={(e) => setCampusNameInput(e.target.value)}
                  className="rounded-xl bg-muted/30 border-border/50 h-10"
                />
                <Button
                  onClick={async () => {
                    if (!campusNameInput) { toast.error("Entre le nom"); return; }
                    setSavingCampus(true);
                    const success = await setCurrentAsCampus(campusNameInput);
                    setSavingCampus(false);
                    if (success) { toast.success("Campus enregistré !"); fetchSettings(); }
                    else toast.error("Erreur - vérifie ta géolocalisation");
                  }}
                  disabled={savingCampus || !campusNameInput}
                  className="w-full h-10 rounded-xl"
                >
                  {savingCampus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
                  Utiliser ma position
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ──── Tutoriel section ──── */}
        <SectionHeader icon={Sparkles} label="Tutoriel" color="text-primary" />

        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden mb-4">
          <button
            onClick={() => {
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Tutoriel réinitialisé !");
              navigate('/');
            }}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border/30"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground flex-1 text-left">Relancer le tutoriel</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Tutoriel complet lancé !");
              navigate('/?restart_tutorial=full');
            }}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b border-border/30"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground flex-1 text-left">Tutoriel complet</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("orbit_onboarding_seen");
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Onboarding réinitialisé !");
              navigate('/');
            }}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <Play className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground flex-1 text-left">Revoir l'intro</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ──── Infos section ──── */}
        <SectionHeader icon={BookOpen} label="Aide" color="text-muted-foreground" />

        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden mb-4 p-4">
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2"><span>📅</span> Import automatique de ton emploi du temps</li>
            <li className="flex items-center gap-2"><span>🎯</span> Filtrage par groupe de TP / TD</li>
            <li className="flex items-center gap-2"><span>📚</span> Détection auto des examens</li>
            <li className="flex items-center gap-2"><span>🏛️</span> Extraction des salles</li>
          </ul>
        </div>

        {/* ──── Danger zone ──── */}
        <SectionHeader icon={Shield} label="Compte" color="text-destructive" />

        <div className="bg-card rounded-2xl border border-border/40 overflow-hidden mb-4">
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors border-b border-border/30"
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm font-medium text-destructive flex-1 text-left">Supprimer mes données</span>
            <ChevronRight className="w-4 h-4 text-destructive/50" />
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground flex-1 text-left">Se déconnecter</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </main>

      {/* QR Scanner */}
      {showQRScanner && (
        <QRCodeScanner
          onScan={(url) => {
            setIcalUrl(url);
            setShowQRScanner(false);
            toast.success("URL importée !");
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

// ─── Tiny section header ──────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-6 first:mt-0 px-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

export default SettingsPage;
