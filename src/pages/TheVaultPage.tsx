import { useState, useEffect } from "react";
import { useVaultData, VaultFile, Subject } from "@/hooks/useVaultData";
import { useAuth } from "@/hooks/useAuth";
import { VaultSubjectCard, VaultFileCard, FilingConfirmationBanner } from "@/components/vault";
import { VaultSubjectDetailView } from "@/components/vault/VaultSubjectDetailView";
import { VaultOnboarding } from "@/components/vault/VaultOnboarding";
import { SmartVaultCapture } from "@/components/vault/SmartVaultCapture";
import { ArrowLeft, Search, Plus, FolderOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSubjectModal } from "@/components/modals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { SwipeableItem } from "@/components/SwipeableItem";
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
  const { user } = useAuth();
  const {
    files,
    subjects,
    loading,
    getFilesBySubject,
    searchFiles,
    getSubjectStats,
    confirmFiling,
    deleteFile,
    refetch,
  } = useVaultData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "subject" | "file";
    id: string;
    name: string;
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [vaultInitialized, setVaultInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkInit = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("user_id", user.id)
        .single();

      const prefs = data?.preferences as any;
      setVaultInitialized(prefs?.vault_initialized === true);
    };
    checkInit();
  }, [user]);

  const subjectStats = getSubjectStats().filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

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
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject && pendingConfirmation.file.extracted_text) {
        try {
          const { data: flashcardsResult, error } =
            await supabase.functions.invoke("generate-flashcards", {
              body: {
                noteContent: pendingConfirmation.file.extracted_text,
                noteId: pendingConfirmation.file.id,
                subjectId,
              },
            });
          if (!error && flashcardsResult?.flashcards?.length > 0) {
            toast.success(`${flashcardsResult.flashcards.length} flashcards créées !`);
          }
        } catch (e) {
          console.error("Error generating flashcards:", e);
        }
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "file") {
      await deleteFile(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleOnboardingComplete = () => {
    setVaultInitialized(true);
    refetch();
  };

  if (loading || vaultInitialized === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if not initialized
  if (!vaultInitialized) {
    return <VaultOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Separate COURS and SAE
  const coursStats = subjectStats.filter((s) => s.icon !== "SAE");
  const saeStats = subjectStats.filter((s) => s.icon === "SAE");

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
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">
              {selectedSubject ? selectedSubject.name : isSearchMode ? "Recherche" : "Vault"}
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
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div
        onClick={() => {
          setIsSearchMode(true);
          setSelectedSubject(null);
        }}
      >
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher dans tous les fichiers (OCR)..."
        />
      </div>

      {/* Empty search help */}
      {isSearchMode && searchQuery === "" && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Tape un mot pour rechercher</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Recherche dans le contenu de tous tes documents
          </p>
        </div>
      )}

      {/* Search Results */}
      {isSearchMode && searchQuery !== "" && (
        <div className="space-y-3">
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {displayedFiles.length} résultat{displayedFiles.length > 1 ? "s" : ""}
              </p>
              {displayedFiles.map((file) => (
                <SwipeableItem
                  key={file.id}
                  onDelete={() =>
                    setDeleteTarget({
                      type: "file",
                      id: file.id,
                      name: file.ai_summary?.substring(0, 30) || "Fichier",
                    })
                  }
                >
                  <VaultFileCard file={file} />
                </SwipeableItem>
              ))}
            </>
          )}
        </div>
      )}

      {/* Subject List (home view) */}
      {!selectedSubject && !isSearchMode && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{files.length}</p>
              <p className="text-sm text-muted-foreground">fichiers dans le coffre</p>
            </div>
          </div>

          {/* COURS section */}
          {coursStats.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Cours
              </p>
              <div className="space-y-2">
                {coursStats.map((subject) => (
                  <VaultSubjectCard
                    key={subject.id}
                    subject={subject}
                    fileCount={subject.fileCount}
                    recentFiles={subject.recentFiles}
                    onClick={() => setSelectedSubject(subject)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SAE section */}
          {saeStats.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                SAE
              </p>
              <div className="space-y-2">
                {saeStats.map((subject) => (
                  <VaultSubjectCard
                    key={subject.id}
                    subject={subject}
                    fileCount={subject.fileCount}
                    recentFiles={subject.recentFiles}
                    onClick={() => setSelectedSubject(subject)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {subjectStats.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune matière</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoute une matière pour commencer
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subject detail */}
      {selectedSubject && !isSearchMode && (
        <VaultSubjectDetailView
          files={displayedFiles}
          subjectId={selectedSubject.id}
          onDeleteFile={(id, name) => setDeleteTarget({ type: "file", id, name })}
          onContentAdded={refetch}
        />
      )}

      {/* Smart Capture */}
      <SmartVaultCapture onFileCaptured={handleFileCaptured} />

      {/* Modal */}
      <AddSubjectModal open={showAddSubject} onOpenChange={setShowAddSubject} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
