import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  ArrowLeft, Calendar, RefreshCw, Check, 
  Link2, Clock, Loader2, Trash2, BookOpen, Users, Eye,
  MapPin, Navigation, QrCode, Play, Sparkles, ChevronsUpDown, X,
  ChevronRight, LogOut, Shield, RotateCcw, HelpCircle
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
  TP: "TP", TD: "TD", Groupe: "Groupe", TC: "TC", CM: "CM", Autre: "Autres",
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

// ─── iOS Section Header ───────────────────────────────────────────────────────

function IOSSectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 px-4 mb-1.5 mt-7 first:mt-0"
       style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      {label}
    </p>
  );
}

// ─── iOS Setting Row ──────────────────────────────────────────────────────────

function IOSRow({ 
  icon: Icon, 
  iconBg, 
  label, 
  detail, 
  action, 
  onClick, 
  last = false,
  destructive = false 
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  detail?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3 min-h-[44px] px-4 py-2.5 ${onClick ? 'active:bg-muted/40' : ''} transition-colors`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-[15px] h-[15px] ${destructive ? 'text-destructive-foreground' : 'text-white'}`} />
      </div>
      <div className={`flex items-center justify-between flex-1 min-w-0 ${!last ? 'border-b border-border/30' : ''} py-1`}>
        <div className="min-w-0 flex-1">
          <span className={`text-[15px] font-medium leading-tight ${destructive ? 'text-destructive' : 'text-foreground'}`}>
            {label}
          </span>
          {detail && (
            <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">{detail}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-2 flex items-center">
          {action || (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />)}
        </div>
      </div>
    </Wrapper>
  );
}

// ─── iOS Detail Row (label: value) ────────────────────────────────────────────

function IOSDetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between min-h-[36px] px-4 py-2"
         style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className={`flex-1 ${!last ? 'border-b border-border/30' : ''} ml-3 py-1`}>
        <span className="text-[13px] text-foreground/70 float-right">{value}</span>
      </div>
    </div>
  );
}

// ─── iOS Card wrapper ─────────────────────────────────────────────────────────

function IOSCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-[10px] overflow-hidden shadow-soft ${className}`}>
      {children}
    </div>
  );
}

// ─── Group Dropdown ───────────────────────────────────────────────────────────

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
          <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-muted/30 border-border/40 rounded-lg text-[14px]">
            {activeGroups.length > 0 ? (
              <span>{activeGroups.length} groupe{activeGroups.length > 1 ? 's' : ''} sélectionné{activeGroups.length > 1 ? 's' : ''}</span>
            ) : (
              <span className="text-muted-foreground">Choisir tes groupes...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
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

      {suggestions.length > 0 && (
        <div className="p-3 bg-accent/30 rounded-lg border border-accent/50 space-y-2">
          <p className="text-[11px] font-medium text-accent-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50"
         style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Quicksand", system-ui, sans-serif' }}>
      {/* Fixed iOS-style header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-secondary/70 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-lg mx-auto px-4 h-[52px] flex items-center gap-3">
          <IOSBackButton fallback="/" />
          <h1 className="flex-1 text-center text-[17px] font-semibold text-foreground -mr-12">Paramètres</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-[68px] pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)' }}>

        {/* ──── CALENDRIER ──── */}
        <IOSSectionHeader label="Calendrier" />
        <IOSCard>
          {/* URL iCal input area */}
          <div className="px-4 pt-3 pb-3 space-y-2.5">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://ton-ecole.edu/calendar.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                className="flex-1 rounded-lg bg-muted/40 border-border/30 h-10 text-[14px]"
              />
              <button
                onClick={() => setShowQRScanner(true)}
                className="shrink-0 w-10 h-10 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-center active:bg-muted/60 transition-colors"
              >
                <QrCode className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Compatible Pronote · Hyperplanning · ADE · CELCAT
            </p>
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 ml-4" />

          {/* Groups */}
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">Groupes TP / TD</span>
              <button
                onClick={scanForGroups}
                disabled={!icalUrl || scanningGroups}
                className="flex items-center gap-1 text-[13px] text-primary font-medium disabled:opacity-40 active:opacity-60 transition-opacity"
              >
                {scanningGroups ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                Détecter
              </button>
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
              className="rounded-lg bg-muted/40 border-border/30 h-9 text-[13px]"
            />
          </div>

          {/* Separator */}
          <div className="h-px bg-border/30 ml-4" />

          {/* Save + Sync CTA */}
          <div className="p-4">
            <Button
              onClick={handleSaveUrl}
              disabled={saving}
              className="w-full h-[52px] rounded-2xl font-semibold text-[16px] gradient-primary text-primary-foreground shadow-soft"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
              Enregistrer et synchroniser
            </Button>
          </div>
        </IOSCard>

        {/* Sync status details */}
        {(settings?.last_synced_at || filterGroup) && (
          <>
            <IOSSectionHeader label="Statut" />
            <IOSCard>
              {settings?.last_synced_at && (
                <IOSDetailRow
                  label="Dernière synchro"
                  value={new Date(settings.last_synced_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                />
              )}
              {filterGroup && (
                <IOSDetailRow
                  label="Filtre actif"
                  value={filterGroup}
                  last={true}
                />
              )}
            </IOSCard>
          </>
        )}

        {/* Sync options */}
        <IOSSectionHeader label="Synchronisation" />
        <IOSCard>
          <IOSRow
            icon={RefreshCw}
            iconBg="bg-primary"
            label="Sync automatique"
            detail="Mise à jour quotidienne"
            action={<Switch checked={settings?.sync_enabled ?? true} onCheckedChange={handleToggleSync} />}
          />
          <IOSRow
            icon={RotateCcw}
            iconBg="bg-muted-foreground"
            label="Resynchroniser maintenant"
            last
            onClick={syncing ? undefined : handleSync}
            action={
              syncing ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : undefined
            }
          />
        </IOSCard>

        {/* ──── CAMPUS ──── */}
        <IOSSectionHeader label="Localisation" />
        <IOSCard>
          {hasCampusConfigured ? (
            <>
              <IOSRow
                icon={MapPin}
                iconBg="bg-success"
                label={campusName || 'Campus configuré'}
                detail={isOnCampus ? 'Sur le campus' : 'Hors campus'}
                last
                action={
                  <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${isOnCampus ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {isOnCampus ? '📍 Actif' : '🏠 Inactif'}
                  </span>
                }
              />
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-[13px] text-muted-foreground">Configure la position de ton campus pour le mode intelligent.</p>
              <Input
                placeholder="Nom du campus"
                value={campusNameInput}
                onChange={(e) => setCampusNameInput(e.target.value)}
                className="rounded-lg bg-muted/40 border-border/30 h-10 text-[14px]"
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
                className="w-full h-[44px] rounded-xl text-[14px]"
              >
                {savingCampus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
                Utiliser ma position actuelle
              </Button>
            </div>
          )}
        </IOSCard>

        {/* ──── TUTORIEL ──── */}
        <IOSSectionHeader label="Tutoriel" />
        <IOSCard>
          <IOSRow
            icon={Play}
            iconBg="bg-primary"
            label="Relancer le tutoriel"
            onClick={() => {
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Tutoriel réinitialisé !");
              navigate('/');
            }}
          />
          <IOSRow
            icon={Sparkles}
            iconBg="bg-warning"
            label="Tutoriel complet"
            onClick={() => {
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Tutoriel complet lancé !");
              navigate('/?restart_tutorial=full');
            }}
          />
          <IOSRow
            icon={RotateCcw}
            iconBg="bg-muted-foreground"
            label="Revoir l'intro"
            last
            onClick={() => {
              localStorage.removeItem("orbit_onboarding_seen");
              localStorage.removeItem("orbit_tutorial_completed");
              toast.success("Onboarding réinitialisé !");
              navigate('/');
            }}
          />
        </IOSCard>

        {/* ──── AIDE ──── */}
        <IOSSectionHeader label="À propos" />
        <IOSCard>
          <IOSRow icon={Calendar} iconBg="bg-primary/80" label="Import auto de l'emploi du temps" last={false} />
          <IOSRow icon={Users} iconBg="bg-physics" label="Filtrage par groupe TP / TD" last={false} />
          <IOSRow icon={BookOpen} iconBg="bg-warning" label="Détection auto des examens" last={false} />
          <IOSRow icon={MapPin} iconBg="bg-success" label="Extraction des salles" last />
        </IOSCard>

        {/* ──── VAULT ──── */}
        <IOSSectionHeader label="Vault" />
        <IOSCard className="mb-3">
          <IOSRow
            icon={RotateCcw}
            iconBg="bg-warning"
            label="Réinitialiser le Vault"
            detail="Relancer la configuration des matières"
            last
            onClick={async () => {
              if (!user) return;
              if (!confirm("Réinitialiser le Vault ? Tu pourras reconfigurer tes matières.")) return;
              try {
                await supabase.from('vault_files').delete().eq('user_id', user.id);
                // Remove vault subjects (icon = COURS or SAE)
                await supabase.from('subjects').delete().eq('user_id', user.id).in('icon', ['COURS', 'SAE']);
                // Reset vault_initialized flag
                const { data: profile } = await supabase.from('profiles').select('preferences').eq('user_id', user.id).single();
                const prefs = (profile?.preferences as any) || {};
                delete prefs.vault_initialized;
                await supabase.from('profiles').update({ preferences: prefs }).eq('user_id', user.id);
                toast.success("Vault réinitialisé. Retourne dans le Vault pour reconfigurer.");
              } catch (e) {
                console.error(e);
                toast.error("Erreur lors de la réinitialisation");
              }
            }}
          />
        </IOSCard>

        {/* ──── COMPTE ──── */}
        <IOSSectionHeader label="Compte" />
        <IOSCard className="mb-3">
          <IOSRow
            icon={LogOut}
            iconBg="bg-muted-foreground"
            label="Se déconnecter"
            last
            onClick={signOut}
          />
        </IOSCard>

        {/* Danger zone — separate red-tinted card */}
        <IOSCard className="mb-8 bg-destructive/[0.04]">
          <IOSRow
            icon={Trash2}
            iconBg="bg-destructive"
            label="Supprimer toutes mes données"
            destructive
            last
            onClick={handleClearData}
          />
        </IOSCard>

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

export default SettingsPage;
