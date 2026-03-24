import { useState } from "react";
import { useVaultData, VaultFile, Subject } from "@/hooks/useVaultData";
import { useOrbitData } from "@/hooks/useOrbitData";
import { SearchBar } from "@/components/SearchBar";
import { SwipeableItem } from "@/components/SwipeableItem";
import { VaultSubjectCard, VaultFileCard, FilingConfirmationBanner } from "@/components/vault";
import { VaultSubjectDetailView } from "@/components/vault/VaultSubjectDetailView";
import { SmartVaultCapture } from "@/components/vault/SmartVaultCapture";
import { ArrowLeft, FolderOpen, Search, Sparkles, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddSubjectModal, EditSubjectModal } from "@/components/modals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingConfirmation {
  file: VaultFile;
  suggestedSubjectId: string | null;
  suggestedSubjectName: string | null;
  suggestedSubjectIcon: string | null;
  confidence: number;
}

export const TheVaultPage = () => {
  const { 
    files, 
    subjects, 
    loading, 
    getFilesBySubject, 
    searchFiles, 
    getSubjectStats,
    confirmFiling,
    deleteFile,
    dismissPending,
    refetch,
  } = useVaultData();
  
  const { refetch: refetchOrbitData } = useOrbitData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'file'; id: string; name: string } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Get subject stats for cards
  const subjectStats = getSubjectStats();

  // Filter files based on search or selected subject
  const displayedFiles = searchQuery.trim() 
    ? searchFiles(searchQuery)
    : selectedSubject 
      ? getFilesBySubject(selectedSubject.id)
      : [];

  const handleBack = () => {
    setSelectedSubject(null);
    setSearchQuery("");
    setIsSearchMode(false);
  };

  const handleFileCaptured = (file: VaultFile, aiResult: any) => {
    setPendingConfirmation({
      file,
      suggestedSubjectId: aiResult.suggestedSubjectId,
      suggestedSubjectName: aiResult.suggestedSubjectName,
      suggestedSubjectIcon: aiResult.suggestedSubjectIcon,
      confidence: aiResult.confidence,
    });
  };

  const handleConfirmFiling = async (subjectId: string, wasCorrect: boolean) => {
    if (!pendingConfirmation) return;
    
    const success = await confirmFiling(pendingConfirmation.file.id, subjectId, wasCorrect);
    if (success) {
      setPendingConfirmation(null);
      
      // Generate flashcards automatically
      const subject = subjects.find(s => s.id === subjectId);
      if (subject && pendingConfirmation.file.extracted_text) {
        toast.loading("✨ Génération des flashcards...", { id: "flashcards" });
        
        try {
          const { data: flashcardsResult, error } = await supabase.functions.invoke("generate-flashcards", {
            body: { 
              noteContent: pendingConfirmation.file.extracted_text,
              noteId: pendingConfirmation.file.id,
              subjectId: subjectId,
            },
          });

          if (error) throw error;

          toast.dismiss("flashcards");
          if (flashcardsResult?.flashcards?.length > 0) {
            toast.success(`🎴 ${flashcardsResult.flashcards.length} flashcards créées !`, {
              description: "Va dans le Lab pour réviser",
              action: {
                label: "Lab",
                onClick: () => window.location.href = "/exam-lab",
              }
            });
          }
        } catch (e) {
          console.error("Error generating flashcards:", e);
          toast.dismiss("flashcards");
        }
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'file') {
      await deleteFile(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleSearchFocus = () => {
    setIsSearchMode(true);
    setSelectedSubject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-32">
      {/* Pending confirmation banner */}
      {pendingConfirmation && (
        <FilingConfirmationBanner
          file={pendingConfirmation.file}
          subjects={subjects}
          suggestedSubjectId={pendingConfirmation.suggestedSubjectId}
          suggestedSubjectName={pendingConfirmation.suggestedSubjectName}
          suggestedSubjectIcon={pendingConfirmation.suggestedSubjectIcon}
          confidence={pendingConfirmation.confidence}
          onConfirm={handleConfirmFiling}
          onDismiss={() => setPendingConfirmation(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        {(selectedSubject || isSearchMode) && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">
              {selectedSubject ? selectedSubject.name : isSearchMode ? 'Recherche' : 'The Vault'}
            </h1>
          </div>
          {selectedSubject && (
            <p className="text-sm text-muted-foreground mt-1">
              {displayedFiles.length} fichiers
            </p>
          )}
        </div>
        {!selectedSubject && !isSearchMode && (
          <Button 
            size="icon" 
            onClick={() => setShowAddSubject(true)}
            className="rounded-full h-10 w-10 gradient-primary shadow-lg"
            data-tutorial="add-button"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div onClick={handleSearchFocus}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher dans tous les fichiers (OCR)..."
        />
      </div>

      {/* Empty search mode help */}
      {isSearchMode && searchQuery === '' && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Tape un mot pour rechercher</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            L'IA recherche dans le texte extrait de tous tes documents
          </p>
        </div>
      )}

      {/* Search Results */}
      {isSearchMode && searchQuery !== '' && (
        <div className="space-y-3">
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {displayedFiles.length} résultat{displayedFiles.length > 1 ? 's' : ''} trouvé{displayedFiles.length > 1 ? 's' : ''}
              </p>
              {displayedFiles.map(file => (
                <SwipeableItem
                  key={file.id}
                  onDelete={() => setDeleteTarget({ 
                    type: 'file', 
                    id: file.id, 
                    name: file.ai_summary?.substring(0, 30) || 'Fichier' 
                  })}
                >
                  <VaultFileCard file={file} />
                </SwipeableItem>
              ))}
            </>
          )}
        </div>
      )}

      {/* Subject Grid (home view) */}
      {!selectedSubject && !isSearchMode && (
        <div className="space-y-4">
          {/* Stats summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{files.length}</p>
              <p className="text-sm text-muted-foreground">fichiers dans le coffre</p>
            </div>
          </div>

          {/* Subject grid */}
          <div className="grid grid-cols-3 gap-4">
            {subjectStats.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune matière</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoute une matière pour commencer à organiser
                </p>
              </div>
            ) : (
              subjectStats.map(subject => (
                <SwipeableItem
                  key={subject.id}
                  onEdit={() => setEditingSubject(subject)}
                >
                  <VaultSubjectCard
                    subject={subject}
                    fileCount={subject.fileCount}
                    recentFiles={subject.recentFiles}
                    onClick={() => setSelectedSubject(subject)}
                  />
                </SwipeableItem>
              ))
            )}
          </div>
        </div>
      )}

      {/* Files list (subject view) */}
      {selectedSubject && !isSearchMode && (
        <>
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun fichier dans cette matière</p>
              <p className="text-sm text-muted-foreground mt-1">
                Capture un document pour commencer
              </p>
            </div>
          ) : (
            <VaultSubjectDetailView
              files={displayedFiles}
              onDeleteFile={(id, name) => setDeleteTarget({ type: 'file', id, name })}
            />
          )}
        </>
      )}

      {/* Smart Capture Button */}
      <SmartVaultCapture onFileCaptured={handleFileCaptured} />

      {/* Modals */}
      <AddSubjectModal
        open={showAddSubject}
        onOpenChange={setShowAddSubject}
      />
      <EditSubjectModal
        open={!!editingSubject}
        onOpenChange={(open) => !open && setEditingSubject(null)}
        subject={editingSubject}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce {deleteTarget?.type === 'file' ? 'fichier' : 'dossier'} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Es-tu sûr de vouloir supprimer "{deleteTarget?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
