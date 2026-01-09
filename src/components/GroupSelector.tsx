import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Loader2, Users, ChevronDown, Check, Search, 
  Calendar, AlertCircle, Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export const GroupSelector = ({ icalUrl, onGroupSelected, onSkip }: GroupSelectorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detectedGroups, setDetectedGroups] = useState<DetectedGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [manualGroup, setManualGroup] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (icalUrl) {
      scanForGroups();
    }
  }, [icalUrl]);

  const scanForGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { 
          userId: user?.id, 
          icalUrl, 
          scanOnly: true  // New mode: just scan for groups
        },
      });

      if (error) throw error;

      const groups = data.detectedGroups || [];
      setDetectedGroups(groups);

      // Auto-select if only one group found
      if (groups.length === 1) {
        setSelectedGroup(groups[0].code);
        fetchPreview(groups[0].code);
      } else if (groups.length === 0) {
        setShowManual(true);
      }
    } catch (error: any) {
      console.error('Error scanning for groups:', error);
      setShowManual(true);
      toast.error("Impossible de détecter les groupes", {
        description: "Entrez votre code de groupe manuellement",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async (groupCode: string) => {
    if (!groupCode) return;
    
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar', {
        body: { 
          userId: user?.id, 
          icalUrl, 
          previewOnly: true,
          filterGroup: groupCode
        },
      });

      if (error) throw error;

      setPreviewEvents(data.previewEvents || []);
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    fetchPreview(value);
  };

  const handleConfirm = async () => {
    const groupToSave = selectedGroup || manualGroup;
    if (!groupToSave) {
      toast.error("Veuillez sélectionner ou entrer votre groupe");
      return;
    }

    try {
      // Save the group filter to user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ical_filter_group: groupToSave,
        }, { onConflict: 'user_id' });

      onGroupSelected(groupToSave);
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (loading) {
    return (
      <GlassCard variant="elevated" className="p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-display font-semibold text-foreground">
              Analyse de ton emploi du temps...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Recherche des groupes dans ton calendrier
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Ton Groupe</h2>
        </div>

        {detectedGroups.length > 0 && !showManual ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nous avons trouvé ces groupes :</Label>
              <Select value={selectedGroup} onValueChange={handleGroupChange}>
                <SelectTrigger className="w-full bg-white/50 border-white/30">
                  <SelectValue placeholder="Sélectionne ton groupe" />
                </SelectTrigger>
                <SelectContent>
                  {detectedGroups.map((group) => (
                    <SelectItem key={group.code} value={group.code}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium">{group.code}</span>
                        <span className="text-xs text-muted-foreground">
                          ({group.count} cours)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManual(true)}
              className="text-muted-foreground"
            >
              Mon groupe n'est pas dans la liste
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedGroups.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Aucun groupe détecté automatiquement. Entre ton code manuellement.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="manual-group">Code de groupe</Label>
              <Input
                id="manual-group"
                placeholder="Ex: TC2 G1 A, L3-B, INFO-S3..."
                value={manualGroup}
                onChange={(e) => {
                  setManualGroup(e.target.value);
                  setSelectedGroup("");
                }}
                className="bg-white/50 border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                💡 Ce code apparaît généralement dans les titres de tes cours
              </p>
            </div>

            {detectedGroups.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManual(false)}
                className="text-primary"
              >
                ← Retour à la sélection
              </Button>
            )}
          </div>
        )}
      </GlassCard>

      {/* Preview Section */}
      {(selectedGroup || manualGroup) && (
        <GlassCard variant="subtle" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Aperçu de tes prochains cours</span>
          </div>
          
          {loadingPreview ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : previewEvents.length > 0 ? (
            <div className="space-y-2">
              {previewEvents.slice(0, 3).map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 bg-white/50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.day} • {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucun cours trouvé pour ce groupe
            </p>
          )}
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleConfirm}
          disabled={!selectedGroup && !manualGroup}
          className="w-full h-12 rounded-xl gradient-primary text-white font-medium"
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmer et Synchroniser
        </Button>

        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full text-muted-foreground"
          >
            Ignorer le filtrage (afficher tous les cours)
          </Button>
        )}
      </div>
    </div>
  );
};
