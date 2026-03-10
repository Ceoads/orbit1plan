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
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { 
  ArrowLeft, Calendar, RefreshCw, Check, AlertCircle, 
  Link2, Clock, Loader2, Trash2, BookOpen, Users, Eye,
  MapPin, Navigation, Home, QrCode, Play, Sparkles
} from "lucide-react";

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
  const [showQRScanner, setShowQRScanner] = useState(false);

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
    
    // Normalize webcal:// to https:// for display
    let normalizedUrl = icalUrl;
    if (normalizedUrl.startsWith('webcal://')) {
      normalizedUrl = normalizedUrl.replace('webcal://', 'https://');
      setIcalUrl(normalizedUrl);
    }
    
    // Broader URL validation for French school platforms
    if (normalizedUrl && !normalizedUrl.includes('.ics') && !normalizedUrl.includes('ical') && !normalizedUrl.includes('calendar') && !normalizedUrl.includes('webcal') && !normalizedUrl.includes('planning') && !normalizedUrl.includes('pronote') && !normalizedUrl.includes('hyperplanning') && !normalizedUrl.includes('celcat') && !normalizedUrl.includes('ade')) {
      toast.error("Oups, ce lien ne semble pas être un calendrier valide", {
        description: "L'URL doit provenir de Pronote, Hyperplanning, ADE, CELCAT ou contenir .ics",
      });
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
      const errorMsg = error.message || '';
      if (errorMsg.includes('ICAL_EXPIRED')) {
        toast.error("🔑 Lien expiré", {
          description: "Ton lien iCal a expiré. Régénère-le dans ton ENT (Pronote, Hyperplanning...).",
          duration: 8000,
        });
      } else if (errorMsg.includes('ICAL_NOT_FOUND')) {
        toast.error("🔍 Lien introuvable", {
          description: "Vérifie l'URL dans les paramètres de ton école.",
        });
      } else {
        toast.error("Échec de la synchronisation", {
          description: "Vérifie ton URL iCal et ta connexion internet",
        });
      }
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
                URL iCal / vCal
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ical-url"
                  type="url"
                  placeholder="https://ton-ecole.edu/calendar.ics"
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  className="flex-1 bg-white/50 border-white/30"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQRScanner(true)}
                  title="Scanner un QR code"
                  className="shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                📱 Compatible avec <span className="font-medium text-foreground">Pronote</span>, <span className="font-medium text-foreground">Hyperplanning</span>, <span className="font-medium text-foreground">ADE</span>, <span className="font-medium text-foreground">CELCAT</span>, <span className="font-medium text-foreground">EDT</span> et Google Calendar
              </p>
            </div>

            {/* Group Filter - Guided Section */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Groupe de TP / TD
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scanForGroups}
                  disabled={!icalUrl || scanningGroups}
                >
                  {scanningGroups ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Eye className="w-3 h-3 mr-1" />
                  )}
                  Détecter
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Sélectionne ton groupe pour ne voir que tes cours et éviter ceux des autres TP/TD.
              </p>

              {/* Detected groups as clickable badges */}
              {detectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detectedGroups.map((group) => {
                    const isActive = filterGroup === group.code;
                    return (
                      <button
                        key={group.code}
                        onClick={() => setFilterGroup(isActive ? "" : group.code)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                        }`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5" />}
                        {group.code}
                        <span className="text-xs text-muted-foreground ml-1">({group.count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Manual input always visible */}
              <Input
                placeholder="Ou entre ton groupe : TP1, TD2, TC2 G1 A..."
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="bg-background/50 border-border"
              />

              {filterGroup && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Filtre actif : {filterGroup}</span>
                </div>
              )}
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

        {/* Tutorial Section */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Tutoriel</h2>
          </div>
          
          <GlassCard variant="elevated" className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Parcours Orbit</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Revisite le tutoriel interactif pour découvrir toutes les fonctionnalités d'Orbit.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset tutorial flags
                    localStorage.removeItem("orbit_tutorial_completed");
                    toast.success("Tutoriel réinitialisé !", {
                      description: "Retourne sur l'accueil pour le relancer",
                    });
                    navigate('/');
                  }}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Relancer le tutoriel
                </Button>
              </div>
            </div>
            
            {/* Option to restart full tutorial from welcome */}
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("orbit_tutorial_completed");
                toast.success("Tutoriel complet lancé !");
                navigate('/?restart_tutorial=full');
              }}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Relancer le tutoriel complet
            </Button>
            
            {/* Option to restart full onboarding narrative */}
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem("orbit_onboarding_seen");
                localStorage.removeItem("orbit_tutorial_completed");
                toast.success("Onboarding réinitialisé !");
                navigate('/');
              }}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              Revoir l'introduction narrative
            </Button>
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

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          onScan={(url) => {
            setIcalUrl(url);
            setShowQRScanner(false);
            toast.success("URL importée !", { description: "Clique sur 'Enregistrer' pour synchroniser" });
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
