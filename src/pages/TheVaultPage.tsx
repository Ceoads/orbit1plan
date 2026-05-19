import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useVaultData, VaultFile, Subject } from "@/hooks/useVaultData";
import { useAuth } from "@/hooks/useAuth";
import { VaultFileCard, FilingConfirmationBanner } from "@/components/vault";
import { VaultFolderCard } from "@/components/vault/VaultFolderCard";
import { VaultFolderDetail } from "@/components/vault/VaultFolderDetail";
import { VaultOnboarding } from "@/components/vault/VaultOnboarding";
import { SmartVaultCapture } from "@/components/vault/SmartVaultCapture";
import { VaultNoteEditor } from "@/components/vault/VaultNoteEditor";
import {
  ArrowLeft,
  Search,
  Plus,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Camera,
  PenLine,
  Upload,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSubjectModal } from "@/components/modals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SwipeableItem } from "@/components/SwipeableItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// "all" → tous fichiers, sinon un semester id
type SemesterFilter = string; // "all" | semester.id
const matchesSemester = (file: VaultFile, filter: SemesterFilter): boolean => {
  if (filter === "all") return true;
  return file.semester_id === filter;
};

export const TheVaultPage = () => {
  const { user } = useAuth();
  const {
    files,
    subjects,
    semesters,
    loading,
    getFilesBySubject,
    searchFiles,
    getSubjectStats,
    confirmFiling,
    deleteFile,
    createFile,
    refetch,
  } = useVaultData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [fileFilter, setFileFilter] = useState<SemesterFilter>("all");
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "subject" | "file";
    id: string;
    name: string;
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [vaultInitialized, setVaultInitialized] = useState<boolean | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("vault_recent_searches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem("vault_recent_searches", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeRecentSearch = (q: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== q);
      try {
        localStorage.setItem("vault_recent_searches", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("vault_recent_searches");
    } catch {}
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Auto-select subject from ?subject=<id>
  useEffect(() => {
    const sid = searchParams.get("subject");
    if (!sid) return;

    const clearParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete("subject");
      setSearchParams(next, { replace: true });
    };

    const match = subjects.find((s) => s.id === sid);
    if (match) {
      setSelectedSubject(match);
      clearParam();
      return;
    }

    if (subjects.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name,color_key,teacher_name,icon,ical_code")
        .eq("id", sid)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setSelectedSubject(data as Subject);
      } else {
        toast.error("Matière introuvable");
      }
      clearParam();
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, subjects, setSearchParams]);

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
      if (prefs?.vault_view_mode === "grid" || prefs?.vault_view_mode === "list") {
        setViewMode(prefs.vault_view_mode);
      }
    };
    checkInit();
  }, [user]);

  const setAndPersistViewMode = async (mode: "grid" | "list") => {
    setViewMode(mode);
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("user_id", user.id)
      .single();
    const prefs = (data?.preferences as any) || {};
    await supabase
      .from("profiles")
      .update({ preferences: { ...prefs, vault_view_mode: mode } })
      .eq("user_id", user.id);
  };

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

  const handleRenameSubject = async (subjectId: string, newName: string) => {
    const { error } = await supabase
      .from("subjects")
      .update({ name: newName })
      .eq("id", subjectId);
    if (error) {
      toast.error("Erreur lors du renommage");
      return false;
    }
    toast.success("Dossier renommé");
    setSelectedSubject((s) => (s && s.id === subjectId ? { ...s, name: newName } : s));
    refetch();
    return true;
  };

  const handleDeleteSubject = async (subjectId: string) => {
    // Detach files from this subject so they stay searchable
    await supabase
      .from("vault_files")
      .update({ subject_id: null, filing_status: "pending" })
      .eq("subject_id", subjectId);

    const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return false;
    }
    toast.success("Dossier supprimé");
    setSelectedSubject(null);
    refetch();
    return true;
  };

  // FAB file upload (no subject pre-selected → smart filing)
  const uploadFiles = async (fileList: File[], isPhoto: boolean) => {
    if (!user || fileList.length === 0) return;

    const MAX_BYTES = 20 * 1024 * 1024;
    const accepted: File[] = [];
    for (const f of fileList) {
      if (f.size > MAX_BYTES) {
        toast.warning(`"${f.name}" dépasse 20 Mo, ignoré`);
      } else {
        accepted.push(f);
      }
    }
    if (accepted.length === 0) return;

    const toastId = toast.loading(
      accepted.length === 1
        ? "Import du fichier…"
        : `Import de 0/${accepted.length} fichiers…`
    );

    let done = 0;
    let errors = 0;

    const processOne = async (file: File, index: number) => {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("notes")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from("notes")
          .createSignedUrl(path, 60 * 60 * 24 * 365);

        const fileType = file.type.startsWith("image/")
          ? "photo"
          : file.type.includes("pdf")
          ? "pdf"
          : "document";

        await createFile({
          file_url: urlData?.signedUrl || "",
          subject_id: selectedSubject?.id || null,
          original_filename: file.name,
          file_type: fileType,
          filing_status: selectedSubject ? "confirmed" : "pending",
          tags: [fileType],
        });
      } catch (e) {
        console.error("Upload error:", file.name, e);
        errors++;
      } finally {
        done++;
        if (accepted.length > 1) {
          toast.loading(`Import de ${done}/${accepted.length} fichiers…`, { id: toastId });
        }
      }
    };

    // Concurrency = 3
    const CONCURRENCY = 3;
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, accepted.length) }, async () => {
      while (cursor < accepted.length) {
        const i = cursor++;
        await processOne(accepted[i], i);
      }
    });
    await Promise.all(workers);

    if (errors === 0) {
      toast.success(
        accepted.length === 1
          ? "Fichier ajouté"
          : `${accepted.length} fichiers ajoutés`,
        { id: toastId }
      );
    } else if (errors === accepted.length) {
      toast.error("Aucun fichier ajouté", { id: toastId });
    } else {
      toast.success(
        `${accepted.length - errors} ajouté${accepted.length - errors > 1 ? "s" : ""} • ${errors} en erreur`,
        { id: toastId }
      );
    }
    refetch();
  };

  if (loading || vaultInitialized === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vaultInitialized) {
    return <VaultOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Subject folder counts respect the current file filter
  const filteredCountForSubject = (subjectId: string) =>
    files.filter((f) => f.subject_id === subjectId && matchesSemester(f, fileFilter)).length;

  const inSubject = selectedSubject && !isSearchMode;
  const inSearch = isSearchMode;
  const inHome = !selectedSubject && !isSearchMode;

  return (
    <div className="space-y-5 animate-fade-in pb-32">
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
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1
          className={cn(
            "flex-1 font-display font-bold text-foreground",
            inSubject ? "text-xl" : "text-[28px] leading-tight"
          )}
        >
          {inSubject ? selectedSubject!.name : inSearch ? "Recherche" : "Vault"}
        </h1>

        {inHome && (
          <>
            {/* View toggle */}
            <div className="flex items-center bg-muted/60 rounded-full p-1">
              <button
                onClick={() => setAndPersistViewMode("grid")}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  viewMode === "grid"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground"
                )}
                aria-label="Vue grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAndPersistViewMode("list")}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  viewMode === "list"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground"
                )}
                aria-label="Vue liste"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowAddSubject(true)}
              className="rounded-full h-10 w-10"
              aria-label="Ajouter une matière"
            >
              <FolderPlus className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative" onClick={() => setIsSearchMode(true)}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveRecentSearch(searchQuery);
          }}
          onBlur={() => saveRecentSearch(searchQuery)}
          placeholder="Rechercher dans tous les fichiers (OCR)..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-transparent border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      {/* Home: semester chips */}
      {inHome && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setFileFilter("all")}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              fileFilter === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground border-border hover:border-foreground/40"
            )}
          >
            Tous
          </button>
          {semesters.map((s) => (
            <button
              key={s.id}
              onClick={() => setFileFilter(s.id)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                fileFilter === s.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:border-foreground/40"
              )}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddSemester(true)}
            className="flex-shrink-0 w-9 h-9 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all flex items-center justify-center"
            aria-label="Ajouter un semestre"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search results */}
      {inSearch && searchQuery === "" && (
        <div className="space-y-4">
          {recentSearches.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Clock className="w-3.5 h-3.5" />
                  Recherches récentes
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Effacer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((q) => (
                  <div
                    key={q}
                    className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-muted/60 border border-border hover:border-foreground/40 transition-all"
                  >
                    <button
                      onClick={() => setSearchQuery(q)}
                      className="text-sm text-foreground"
                    >
                      {q}
                    </button>
                    <button
                      onClick={() => removeRecentSearch(q)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
                      aria-label={`Supprimer ${q}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Tape un mot pour rechercher</p>
            </div>
          )}
        </div>
      )}
      {inSearch && searchQuery !== "" && (
        <div className="space-y-3">
          {displayedFiles.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">
                Aucun résultat pour "{searchQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                Le texte OCR de tes fichiers a été analysé, mais ce mot n'a pas été trouvé.
                Vérifie l'orthographe ou essaie un autre mot-clé.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {displayedFiles.length} résultat{displayedFiles.length > 1 ? "s" : ""} trouvé
                {displayedFiles.length > 1 ? "s" : ""} via OCR
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

      {/* Home: folders */}
      {inHome && (
        <>
          {subjectStats.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FolderPlus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Ton coffre est vide
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Ajoute tes premiers cours pour commencer
              </p>
              <Button
                onClick={() => setShowAddSubject(true)}
                className="mt-5 rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ajouter un fichier
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              {subjectStats
                .slice()
                .sort((a, b) => filteredCountForSubject(b.id) - filteredCountForSubject(a.id))
                .map((subject) => (
                  <VaultFolderCard
                    key={subject.id}
                    subject={subject}
                    fileCount={filteredCountForSubject(subject.id)}
                    onClick={() => setSelectedSubject(subject)}
                  />
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {subjectStats
                .slice()
                .sort((a, b) => {
                  const ar = files.find((f) => f.subject_id === a.id)?.created_at || "";
                  const br = files.find((f) => f.subject_id === b.id)?.created_at || "";
                  return br.localeCompare(ar);
                })
                .map((subject) => (
                  <VaultFolderCard
                    key={subject.id}
                    subject={subject}
                    fileCount={filteredCountForSubject(subject.id)}
                    onClick={() => setSelectedSubject(subject)}
                    variant="list"
                  />
                ))}
            </div>
          )}
        </>
      )}

      {/* Subject detail */}
      {inSubject && (
        <VaultFolderDetail
          subject={selectedSubject!}
          files={displayedFiles}
          onContentAdded={refetch}
          onRename={handleRenameSubject}
          onDelete={handleDeleteSubject}
        />
      )}

      {/* Floating Add FAB (home + subject) */}
      {(inHome || inSubject) && (
        <div className="fixed bottom-24 right-4 z-40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Ajouter"
              >
                <Plus className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={12} className="w-56 rounded-2xl mr-1 mb-1">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-3 py-3 rounded-xl">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span>Importer un fichier</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="gap-3 py-3 rounded-xl">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span>Prendre une photo</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="gap-3 py-3 rounded-xl">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Scanner un document</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNoteEditor(true)} className="gap-3 py-3 rounded-xl">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                <span>Note rapide</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) uploadFiles(files, false);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) uploadFiles(files, true);
          e.target.value = "";
        }}
      />

      <VaultNoteEditor
        open={showNoteEditor}
        onOpenChange={setShowNoteEditor}
        onSave={async (title, md) => {
          await createFile({
            file_url: "",
            subject_id: null,
            extracted_text: md,
            ai_summary: title,
            file_type: "note",
            filing_status: "pending",
            tags: ["note"],
            original_filename: `${title}.md`,
          });
          toast.success("Note créée");
          refetch();
        }}
      />

      <SmartVaultCapture onFileCaptured={handleFileCaptured} />

      <AddSubjectModal open={showAddSubject} onOpenChange={setShowAddSubject} />

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

      <AlertDialog open={showAddSemester} onOpenChange={setShowAddSemester}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nouveau semestre</AlertDialogTitle>
            <AlertDialogDescription>
              Donne un nom à ton semestre (ex : 1er semestre, 2e semestre…)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            autoFocus
            value={newSemesterName}
            onChange={(e) => setNewSemesterName(e.target.value)}
            placeholder="1er semestre"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/40"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewSemesterName("")}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const name = newSemesterName.trim();
                if (!name || !user) return;
                const today = new Date();
                const end = new Date();
                end.setMonth(end.getMonth() + 6);
                const { error } = await supabase.from("semesters").insert({
                  user_id: user.id,
                  name,
                  start_date: today.toISOString().slice(0, 10),
                  end_date: end.toISOString().slice(0, 10),
                });
                if (error) {
                  toast.error("Erreur lors de l'ajout");
                  return;
                }
                toast.success("Semestre ajouté");
                setNewSemesterName("");
                setShowAddSemester(false);
                refetch();
              }}
            >
              Ajouter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
