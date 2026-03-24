import { useState, useEffect } from "react";
import { useVaultData, VaultFile, Subject } from "@/hooks/useVaultData";
import { useAuth } from "@/hooks/useAuth";
import { VaultSubjectCard, VaultFileCard, FilingConfirmationBanner } from "@/components/vault";
import { VaultSubjectDetailView } from "@/components/vault/VaultSubjectDetailView";
import { VaultOnboarding } from "@/components/vault/VaultOnboarding";
import { SmartVaultCapture } from "@/components/vault/SmartVaultCapture";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSubjectModal } from "@/components/modals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

  // Check if vault has been initialized
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

  const handleConfirmFiling = async (
    subjectId: string,
    wasCorrect: boolean
  ) => {
    if (!pendingConfirmation) return;
    const success = await confirmFiling(
      pendingConfirmation.file.id,
      subjectId,
      wasCorrect
    );
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
            toast.success(
              `${flashcardsResult.flashcards.length} flashcards creees`
            );
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
      <div className="vault-dark min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if not initialized
  if (!vaultInitialized) {
    return (
      <div className="vault-dark min-h-screen">
        <VaultOnboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Separate COURS and SAE
  const coursStats = subjectStats.filter((s) => s.icon !== "SAE");
  const saeStats = subjectStats.filter((s) => s.icon === "SAE");

  return (
    <div className="vault-dark space-y-6 animate-fade-in pb-32">
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
      <div className="flex items-center gap-3 pt-4">
        {(selectedSubject || isSearchMode) && (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
            {selectedSubject
              ? selectedSubject.name
              : isSearchMode
              ? "Recherche"
              : "Vault"}
          </h1>
          {selectedSubject && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {displayedFiles.length} fichiers
            </p>
          )}
        </div>
        {!selectedSubject && !isSearchMode && (
          <button
            onClick={() => setShowAddSubject(true)}
            className="p-2 rounded-lg border border-[#1E1E24] hover:bg-neutral-900 transition-colors"
          >
            <Plus className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Search */}
      <div
        onClick={() => {
          setIsSearchMode(true);
          setSelectedSubject(null);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans tous les fichiers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-[#1E1E24] text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {/* Empty search help */}
      {isSearchMode && searchQuery === "" && (
        <div className="text-center py-12">
          <p className="text-neutral-500 text-sm">
            Recherche dans le contenu de tous tes documents
          </p>
        </div>
      )}

      {/* Search Results */}
      {isSearchMode && searchQuery !== "" && (
        <div className="space-y-2">
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">
                Aucun resultat pour "{searchQuery}"
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">
                {displayedFiles.length} resultat
                {displayedFiles.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-1">
                {displayedFiles.map((file) => (
                  <SwipeableItem
                    key={file.id}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "file",
                        id: file.id,
                        name:
                          file.ai_summary?.substring(0, 30) || "Fichier",
                      })
                    }
                  >
                    <VaultFileCard file={file} />
                  </SwipeableItem>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Subject List (home view) */}
      {!selectedSubject && !isSearchMode && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex items-baseline gap-3 px-1">
            <span className="text-2xl font-semibold text-neutral-100">
              {files.length}
            </span>
            <span className="text-xs text-neutral-500">fichiers</span>
          </div>

          {/* COURS section */}
          {coursStats.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em] px-1">
                Cours
              </p>
              <div className="space-y-1">
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
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em] px-1">
                SAE
              </p>
              <div className="space-y-1">
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

          {/* Empty state */}
          {subjectStats.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-500 text-sm">Aucune matiere</p>
              <p className="text-neutral-600 text-xs mt-1">
                Ajoute une matiere pour commencer
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subject detail view */}
      {selectedSubject && !isSearchMode && (
        <>
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">Aucun fichier</p>
              <p className="text-neutral-600 text-xs mt-1">
                Capture un document pour commencer
              </p>
            </div>
          ) : (
            <VaultSubjectDetailView
              files={displayedFiles}
              onDeleteFile={(id, name) =>
                setDeleteTarget({ type: "file", id, name })
              }
            />
          )}
        </>
      )}

      {/* Smart Capture */}
      <SmartVaultCapture onFileCaptured={handleFileCaptured} />

      {/* Add subject modal */}
      <AddSubjectModal
        open={showAddSubject}
        onOpenChange={setShowAddSubject}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-neutral-950 border-[#1E1E24]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-200">
              Supprimer ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              "{deleteTarget?.name}" sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#1E1E24] text-neutral-400 hover:bg-neutral-900">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
