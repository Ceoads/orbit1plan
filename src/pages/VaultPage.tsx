import { useState } from "react";
import { useOrbitData, Subject, Note } from "@/hooks/useOrbitData";
import { SearchBar } from "@/components/SearchBar";
import { NoteCard } from "@/components/NoteCard";
import { ArrowLeft, FolderOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const colorStyles: Record<string, { bg: string; border: string }> = {
  math: { bg: "bg-math/10", border: "border-math/20" },
  history: { bg: "bg-warning/10", border: "border-warning/20" },
  physics: { bg: "bg-success/10", border: "border-success/20" },
  english: { bg: "bg-english/10", border: "border-english/20" },
  chemistry: { bg: "bg-destructive/10", border: "border-destructive/20" },
};

export const VaultPage = () => {
  const { subjects, notes, getNotesBySubject } = useOrbitData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

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
                Complete setup to add your subjects
              </p>
            </div>
          ) : (
            subjects.map(subject => {
              const subjectNotes = getNotesBySubject(subject.id);
              const styles = colorStyles[subject.color_key] || colorStyles.math;
              
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    "flex items-center gap-4",
                    styles.bg,
                    styles.border
                  )}
                >
                  <div className="text-3xl">{subject.icon}</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-display font-semibold text-foreground">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
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
    </div>
  );
};
