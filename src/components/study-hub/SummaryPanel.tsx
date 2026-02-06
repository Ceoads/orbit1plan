import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";

interface SummaryPanelProps {
  summary: string | null;
  transcript: string | null;
  isRegenerating: boolean;
}

export const SummaryPanel = ({ summary, transcript, isRegenerating }: SummaryPanelProps) => {
  const haptics = useHaptics();
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyTranscript = async () => {
    if (!transcript) return;
    
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      haptics.success();
      toast.success("Texte copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  // Parse summary into key points if it contains bullet points or numbered lists
  const parseKeyPoints = (text: string | null): string[] => {
    if (!text) return [];
    
    // Split by common list patterns
    const lines = text.split(/[\n\r]+/).filter(line => line.trim());
    
    // If we have 2+ lines, treat as separate points
    if (lines.length >= 2) {
      return lines.map(line => 
        line.replace(/^[-•*\d.]+\s*/, '').trim()
      ).filter(Boolean);
    }
    
    // Otherwise return as single point
    return [text];
  };

  const keyPoints = parseKeyPoints(summary);

  return (
    <div className="space-y-4">
      {/* AI Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-card border border-border shadow-soft"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">L'Essentiel</h3>
        </div>

        {isRegenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : keyPoints.length > 0 ? (
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{point}</p>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Aucun résumé disponible. Clique sur le bouton de régénération pour analyser le document.
          </p>
        )}
      </motion.div>

      {/* Transcript Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-card border border-border shadow-soft"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">Transcription</h3>
          </div>
          
          {transcript && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTranscript}
              className="rounded-lg h-8 px-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {isRegenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-full" />
          </div>
        ) : transcript ? (
          <div>
            <p className={cn(
              "text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed",
              !showFullTranscript && "line-clamp-4"
            )}>
              {transcript}
            </p>
            
            {transcript.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
              onClick={() => {
                  haptics.selection();
                  setShowFullTranscript(!showFullTranscript);
                }}
                className="mt-2 w-full rounded-lg h-8 text-primary"
              >
                {showFullTranscript ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Voir tout le texte
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Aucun texte extrait. Le document sera analysé par OCR lors de la régénération.
          </p>
        )}
      </motion.div>
    </div>
  );
};
