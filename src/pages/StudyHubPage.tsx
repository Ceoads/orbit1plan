import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/study-hub/DocumentViewer";
import { SummaryPanel } from "@/components/study-hub/SummaryPanel";
import { PracticeZone } from "@/components/study-hub/PracticeZone";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface VaultFileWithSubject {
  id: string;
  file_url: string;
  extracted_text: string | null;
  ai_summary: string | null;
  tags: string[];
  created_at: string;
  subject_id: string | null;
  subjects?: {
    id: string;
    name: string;
    icon: string;
    color_key: string;
  } | null;
}

export const StudyHubPage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const haptics = useHaptics();
  const isMobile = useIsMobile();
  
  const [file, setFile] = useState<VaultFileWithSubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);

  // Fetch file data with subject info
  useEffect(() => {
    const fetchFile = async () => {
      if (!fileId || !user) return;

      try {
        const { data, error } = await supabase
          .from('vault_files')
          .select(`
            *,
            subjects (
              id,
              name,
              icon,
              color_key
            )
          `)
          .eq('id', fileId)
          .single();

        if (error) throw error;
        setFile(data as VaultFileWithSubject);
      } catch (error) {
        console.error('Error fetching file:', error);
        toast.error("Fichier introuvable");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId, user, navigate]);

  // Handle swipe to dismiss
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 150) {
      haptics.soft();
      navigate(-1);
    }
    setDragY(0);
  };

  // Regenerate AI content
  const handleRegenerate = async () => {
    if (!file?.file_url) return;
    
    setRegenerating(true);
    haptics.selection();
    toast.loading("🧠 Régénération de l'analyse...", { id: "regenerate" });

    try {
      // Re-process the note with AI
      const { data, error } = await supabase.functions.invoke('process-note', {
        body: { 
          imageBase64: file.file_url,
          action: 'ocr'
        }
      });

      if (error) throw error;

      // Update the file with new AI analysis
      const { error: updateError } = await supabase
        .from('vault_files')
        .update({
          extracted_text: data.rawText,
          ai_summary: data.aiSummary,
        })
        .eq('id', file.id);

      if (updateError) throw updateError;

      setFile(prev => prev ? {
        ...prev,
        extracted_text: data.rawText,
        ai_summary: data.aiSummary,
      } : null);

      toast.dismiss("regenerate");
      toast.success("✨ Analyse mise à jour !");
      haptics.success();
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.dismiss("regenerate");
      toast.error("Erreur lors de la régénération");
    } finally {
      setRegenerating(false);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (score: number) => {
    setQuizScore(score);
    haptics.success();

    // Update file with quiz score
    if (file) {
      await supabase
        .from('vault_files')
        .update({
          tags: [...(file.tags || []), `quiz:${score}%`]
        })
        .eq('id', file.id);
    }
  };

  // Share as PDF
  const handleShare = () => {
    haptics.selection();
    toast.info("📄 Export PDF bientôt disponible");
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement du Study Hub...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <p className="text-muted-foreground">Fichier introuvable</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen mesh-background"
      drag={isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDrag={(_, info) => setDragY(info.offset.y)}
      onDragEnd={handleDragEnd}
      style={{ y: dragY > 0 ? dragY * 0.3 : 0 }}
    >
      {/* Swipe indicator */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 ios-glass border-b border-border/50 px-4 py-3 pt-safe">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl hit-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{file.subjects?.icon || '📄'}</span>
                <h1 className="font-display font-bold text-foreground text-dynamic-body line-clamp-1">
                  {file.subjects?.name || 'Document'}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(file.created_at).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quizScore !== null && (
              <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                Score: {quizScore}%
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-xl hit-target"
            >
              <RefreshCw className={cn("w-5 h-5", regenerating && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-xl hit-target"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={cn(
        "max-w-6xl mx-auto p-4 pb-safe",
        isMobile ? "space-y-4" : "grid grid-cols-2 gap-6"
      )}>
        {/* Document Viewer - Left/Top */}
        <section className={cn(!isMobile && "sticky top-20 h-fit")}>
          <DocumentViewer 
            fileUrl={file.file_url} 
            fileName={file.subjects?.name || 'Document'} 
          />
        </section>

        {/* Right side / Bottom content */}
        <section className="space-y-4">
          {/* Summary Panel */}
          <SummaryPanel
            summary={file.ai_summary}
            transcript={file.extracted_text}
            isRegenerating={regenerating}
          />

          {/* Practice Zone */}
          <PracticeZone
            fileId={file.id}
            subjectId={file.subject_id}
            extractedText={file.extracted_text}
            fileUrl={file.file_url}
            onQuizComplete={handleQuizComplete}
          />
        </section>
      </main>
    </motion.div>
  );
};
