import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, Calendar, RefreshCw, Check, AlertCircle, 
  Link2, Clock, Loader2, Trash2, BookOpen, Users, Eye,
  MapPin, Navigation, Home
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    getCurrentPosition, 
    hasCampusConfigured, 
    campusName,
    latitude: currentLat,
    longitude: currentLng,
    isOnCampus,
    loading: geoLoading,
    setCurrentAsCampus,
    saveCampusLocation,
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

  useEffect(() => {
    fetchSettings();
  }, [user]);

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
      
      if (data.detectedGroups?.length === 0) {
        toast.info("Aucun groupe détecté automatiquement");
      }
    } catch (error: any) {
      console.error('Error scanning groups:', error);
      toast.error("Erreur lors de la détection des groupes");
    } finally {
      setScanningGroups(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!user) return;
    
    // Basic URL validation
    if (icalUrl && !icalUrl.includes('.ics') && !icalUrl.includes('ical') && !icalUrl.includes('calendar')) {
      toast.error("Cette URL ne semble pas être une URL iCal. Elle devrait contenir '.ics' ou 'ical'");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ical_url: icalUrl || null,
          ical_filter_group: filterGroup || null,
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast.success("Paramètres enregistrés !");
      
      // Trigger sync if URL was added
      if (icalUrl) {
        handleSync();
      }
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
            ? `${result.newSubjects} nouvelles matières découvertes` 
            : result.filterApplied 
              ? `Filtré par: ${result.filterApplied}`
              : undefined,
        });
        if (result.examsFound > 0) {
          toast.info(`📚 ${result.examsFound} examens détectés !`);
        }
        fetchSettings(); // Refresh last synced time
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error("Échec de la synchronisation", {
        description: error.message || "Vérifie ton URL iCal",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ sync_enabled: enabled })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, sync_enabled: enabled } : null);
      toast.success(enabled ? "Synchronisation auto activée" : "Synchronisation auto désactivée");
    } catch (error: any) {
      console.error('Error toggling sync:', error);
      toast.error("Échec de la mise à jour");
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    if (!confirm("Cela va supprimer toutes tes matières, notes et événements. Es-tu sûr ?")) {
      return;
    }
    
    try {
      // Delete in order due to foreign keys
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('notes_vault').delete().eq('user_id', user.id);
      await supabase.from('calendar_events').delete().eq('user_id', user.id);
      await supabase.from('subjects').delete().eq('user_id', user.id);
      
      toast.success("Toutes les données ont été supprimées");
      navigate('/');
    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast.error("Échec de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-lg border-b border-white/20">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">Paramètres</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pb-8 pt-20 space-y-6">
        {/* Calendar Sync Section */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Synchronisation Calendrier</h2>
          </div>
          
          <GlassCard variant="elevated" className="p-5 space-y-5">
            {/* iCal URL Input */}
            <div className="space-y-2">
              <Label htmlFor="ical-url" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                URL iCal
              </Label>
              <Input
                id="ical-url"
                type="url"
                placeholder="https://ton-ecole.edu/calendar.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                className="bg-white/50 border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Trouve ce lien dans les paramètres d'export de ton calendrier (Hyperplanning, Google Calendar, etc.)
              </p>
            </div>

            {/* Group Filter */}
            <div className="space-y-2 border-t border-white/20 pt-4">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Filtre de Groupe
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: TC2 G1 A, L3-B..."
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="flex-1 bg-white/50 border-white/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scanForGroups}
                  disabled={!icalUrl || scanningGroups}
                  title="Détecter les groupes"
                >
                  {scanningGroups ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {detectedGroups.length > 0 && (
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="bg-white/50 border-white/30">
                    <SelectValue placeholder="Groupes détectés..." />
                  </SelectTrigger>
                  <SelectContent>
                    {detectedGroups.map((group) => (
                      <SelectItem key={group.code} value={group.code}>
                        {group.code} ({group.count} cours)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <p className="text-xs text-muted-foreground">
                💡 Entre ton code de groupe pour ne voir que tes cours (ex: TC2 G1 A)
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveUrl}
              disabled={saving}
              className="w-full gradient-primary"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Enregistrer et Synchroniser
            </Button>

            {/* Last Synced */}
            {settings?.last_synced_at && (
              <div className="flex items-center justify-between py-3 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Dernière synchro</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {new Date(settings.last_synced_at).toLocaleString('fr-FR')}
                </span>
              </div>
            )}

            {/* Current Filter */}
            {settings?.ical_filter_group && (
              <div className="flex items-center justify-between py-3 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Filtre actif</span>
                </div>
                <span className="text-sm font-medium text-primary">
                  {settings.ical_filter_group}
                </span>
              </div>
            )}

            {/* Sync Button */}
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing || !icalUrl}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resynchroniser maintenant
                </>
              )}
            </Button>

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-white/20">
              <div>
                <p className="font-medium text-foreground">Synchronisation automatique</p>
                <p className="text-xs text-muted-foreground">Mise à jour quotidienne de ton emploi du temps</p>
              </div>
              <Switch
                checked={settings?.sync_enabled ?? true}
                onCheckedChange={handleToggleSync}
              />
            </div>
          </GlassCard>
        </section>

        {/* Campus Location Section */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-success" />
            <h2 className="font-display font-semibold text-foreground">Localisation Campus</h2>
          </div>
          
          <GlassCard variant="elevated" className="p-5 space-y-4">
            {hasCampusConfigured ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <MapPin className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">{campusName || 'Campus configuré'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isOnCampus ? '📍 Tu es sur le campus' : '🏠 Tu es hors campus'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Configure la position de ton campus pour activer le mode "Travail à domicile" intelligent.
                </p>
                <Input
                  placeholder="Nom de ton campus (ex: Université Paris)"
                  value={campusNameInput}
                  onChange={(e) => setCampusNameInput(e.target.value)}
                  className="bg-white/50"
                />
                <Button
                  onClick={async () => {
                    if (!campusNameInput) {
                      toast.error("Entre le nom de ton campus");
                      return;
                    }
                    setSavingCampus(true);
                    const success = await setCurrentAsCampus(campusNameInput);
                    setSavingCampus(false);
                    if (success) {
                      toast.success("Campus enregistré !");
                      fetchSettings();
                    } else {
                      toast.error("Erreur - vérifie ta géolocalisation");
                    }
                  }}
                  disabled={savingCampus || !campusNameInput}
                  className="w-full"
                >
                  {savingCampus ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  Utiliser ma position actuelle comme campus
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              💡 L'IA utilisera ta position pour mieux suggérer le classement de tes captures
            </p>
          </GlassCard>
        </section>

        {/* How It Works */}
        <section className="animate-fade-in">
          <GlassCard variant="subtle" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Comment ça marche</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Import automatique de ton emploi du temps</li>
                  <li>• Découverte intelligente des matières</li>
                  <li>• Filtrage par groupe pour ne voir que tes cours</li>
                  <li>• Détection des examens et création de tâches</li>
                  <li>• Extraction des salles pour la navigation</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Danger Zone */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-semibold text-destructive">Zone Danger</h2>
          </div>
          
          <GlassCard variant="subtle" className="p-5 space-y-4 border-destructive/20">
            <Button
              variant="outline"
              onClick={handleClearData}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer toutes mes données
            </Button>
            
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full"
            >
              Se déconnecter
            </Button>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
