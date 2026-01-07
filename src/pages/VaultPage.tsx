import { useState } from "react";
import { useOrbitData, Subject, Note } from "@/hooks/useOrbitData";
import { SearchBar } from "@/components/SearchBar";
import { NoteCard } from "@/components/NoteCard";
import { CreateSubjectDialog } from "@/components/CreateSubjectDialog";
import { ArrowLeft, FolderOpen, ChevronRight, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const colorStyles: Record<string, { bg: string; border: string }> = {
  math: { bg: "bg-math/10", border: "border-math/20" },
  history: { bg: "bg-warning/10", border: "border-warning/20" },
  physics: { bg: "bg-success/10", border: "border-success/20" },
  english: { bg: "bg-english/10", border: "border-english/20" },
  chemistry: { bg: "bg-destructive/10", border: "border-destructive/20" },
};

export const VaultPage = () => {
  const { subjects, notes, getNotesBySubject, createSubject, deleteSubject } = useOrbitData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Filter notes based on search query
  const filteredNotes = selectedSubject 
    ? getNotesBySubject(selectedSubject.id).filter(note =>
        searchQuery === '' || 
        note.raw_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes.filter(note =>
        searchQuery !== '' && (
          note.raw_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.ai_summary?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

  const handleBack = () => {
    setSelectedSubject(null);
    setSearchQuery("");
  };

  const handleCreateSubject = async (data: {
    name: string;
    icon: string;
    color_key: string;
    teacher_name: string | null;
  }) => {
    const result = await createSubject(data);
    if (result) {
      toast.success(`Subject "${data.name}" created!`);
    }
    return result;
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    const success = await deleteSubject(subjectToDelete.id);
    if (success) {
      setSubjectToDelete(null);
    }
  };

  const getNotesCount = (subjectId: string) => {
    return getNotesBySubject(subjectId).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        {selectedSubject && (
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
              {selectedSubject ? selectedSubject.name : 'AI Vault'}
            </h1>
          </div>
          {selectedSubject && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredNotes.length} notes
            </p>
          )}
        </div>
        {!selectedSubject && (
          <CreateSubjectDialog onCreateSubject={handleCreateSubject} />
        )}
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={selectedSubject ? `Search in ${selectedSubject.name}...` : "Search all notes (OCR)..."}
      />

      {/* Content */}
      {!selectedSubject && searchQuery === '' ? (
        // Subject Grid
        <div className="grid grid-cols-1 gap-3">
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No subjects yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a subject to organize your notes
              </p>
            </div>
          ) : (
            subjects.map(subject => {
              const subjectNotes = getNotesBySubject(subject.id);
              const styles = colorStyles[subject.color_key] || colorStyles.math;
              
              return (
                <div
                  key={subject.id}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 transition-all duration-200",
                    "flex items-center gap-4",
                    styles.bg,
                    styles.border
                  )}
                >
                  <button
                    onClick={() => setSelectedSubject(subject)}
                    className="flex items-center gap-4 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="text-3xl">{subject.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                        {subject.teacher_name && ` • ${subject.teacher_name}`}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSubjectToDelete(subject)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Subject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Notes List
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No notes match your search' : 'No notes yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Capture notes with the + button
              </p>
            </div>
          ) : (
            filteredNotes
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(note => (
                <NoteCard key={note.id} note={note} />
              ))
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
            <AlertDialogDescription>
              {subjectToDelete && getNotesCount(subjectToDelete.id) > 0 ? (
                <>
                  This subject has {getNotesCount(subjectToDelete.id)} notes and cannot be deleted. 
                  Please remove all notes first.
                </>
              ) : (
                <>
                  Are you sure you want to delete "{subjectToDelete?.name}"? 
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {subjectToDelete && getNotesCount(subjectToDelete.id) === 0 && (
              <AlertDialogAction
                onClick={handleDeleteSubject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};