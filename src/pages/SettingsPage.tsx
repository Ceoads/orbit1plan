import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, Calendar, RefreshCw, Check, AlertCircle, 
  Link2, Clock, Loader2, Trash2, BookOpen 
} from "lucide-react";

interface UserSettings {
  ical_url: string | null;
  last_synced_at: string | null;
  sync_enabled: boolean;
  timezone: string;
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

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
        setSettings(data);
        setIcalUrl(data.ical_url || "");
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!user) return;
    
    // Basic URL validation
    if (icalUrl && !icalUrl.includes('.ics') && !icalUrl.includes('ical') && !icalUrl.includes('calendar')) {
      toast.error("This doesn't look like an iCal URL. It should contain '.ics' or 'ical'");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ical_url: icalUrl || null,
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast.success("Calendar URL saved!");
      
      // Trigger sync if URL was added
      if (icalUrl) {
        handleSync();
      }
    } catch (error: any) {
      console.error('Error saving URL:', error);
      toast.error("Failed to save URL");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!user || !icalUrl) {
      toast.error("Please add your calendar URL first");
      return;
    }
    
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { userId: user.id, icalUrl },
      });
      
      if (error) throw error;
      
      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`Synced ${result.eventsSynced} events!`, {
          description: result.newSubjects > 0 
            ? `${result.newSubjects} new subjects discovered` 
            : undefined,
        });
        if (result.examsFound > 0) {
          toast.info(`📚 ${result.examsFound} exams detected!`);
        }
        fetchSettings(); // Refresh last synced time
      } else {
        throw new Error(result?.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error("Failed to sync calendar", {
        description: error.message || "Check your iCal URL",
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
      toast.success(enabled ? "Auto-sync enabled" : "Auto-sync disabled");
    } catch (error: any) {
      console.error('Error toggling sync:', error);
      toast.error("Failed to update setting");
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    if (!confirm("This will delete all your subjects, notes, and events. Are you sure?")) {
      return;
    }
    
    try {
      // Delete in order due to foreign keys
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('notes_vault').delete().eq('user_id', user.id);
      await supabase.from('calendar_events').delete().eq('user_id', user.id);
      await supabase.from('subjects').delete().eq('user_id', user.id);
      
      toast.success("All data cleared");
      navigate('/');
    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast.error("Failed to clear data");
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
          <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pb-8 pt-20 space-y-6">
        {/* Calendar Sync Section */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Calendar Sync</h2>
          </div>
          
          <GlassCard variant="elevated" className="p-5 space-y-5">
            {/* iCal URL Input */}
            <div className="space-y-2">
              <Label htmlFor="ical-url" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Your iCal URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ical-url"
                  type="url"
                  placeholder="https://your-school.edu/calendar.ics"
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  className="flex-1 bg-white/50 border-white/30"
                />
                <Button 
                  onClick={handleSaveUrl}
                  disabled={saving}
                  size="icon"
                  className="gradient-primary"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find this in your school's calendar export settings (Hyperplanning, Google Calendar, etc.)
              </p>
            </div>

            {/* Last Synced */}
            {settings?.last_synced_at && (
              <div className="flex items-center justify-between py-3 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Last synced</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {new Date(settings.last_synced_at).toLocaleString()}
                </span>
              </div>
            )}

            {/* Sync Button */}
            <Button
              onClick={handleSync}
              disabled={syncing || !icalUrl}
              className="w-full gradient-primary"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>

            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-white/20">
              <div>
                <p className="font-medium text-foreground">Auto-sync enabled</p>
                <p className="text-xs text-muted-foreground">Automatically update your schedule daily</p>
              </div>
              <Switch
                checked={settings?.sync_enabled ?? true}
                onCheckedChange={handleToggleSync}
              />
            </div>
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
                <p className="font-medium text-foreground mb-1">How iCal Sync Works</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Automatically imports your class schedule</li>
                  <li>• Discovers subjects from event titles</li>
                  <li>• Detects exams and creates study tasks</li>
                  <li>• Extracts room numbers for navigation</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Danger Zone */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-semibold text-destructive">Danger Zone</h2>
          </div>
          
          <GlassCard variant="subtle" className="p-5 space-y-4 border-destructive/20">
            <Button
              variant="outline"
              onClick={handleClearData}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
            
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
