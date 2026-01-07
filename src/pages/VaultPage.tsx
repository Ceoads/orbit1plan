import { useState } from "react";
import { subjects, mockNotes, getNotesBySubject, Subject } from "@/lib/mockData";
import { SubjectFolder } from "@/components/SubjectFolder";
import { SearchBar } from "@/components/SearchBar";
import { NoteCard } from "@/components/NoteCard";
import { SubjectBadge } from "@/components/SubjectBadge";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const VaultPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Filter notes based on search query (simulating OCR search)
  const filteredNotes = selectedSubject 
    ? getNotesBySubject(selectedSubject.id).filter(note =>
        searchQuery === '' || 
        note.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockNotes.filter(note =>
        searchQuery !== '' && (
          note.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())
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
          {subjects.map(subject => (
            <SubjectFolder
              key={subject.id}
              subject={subject}
              onClick={() => setSelectedSubject(subject)}
            />
          ))}
        </div>
      ) : (
        // Notes List
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No notes match your search' : 'No notes yet'}
              </p>
            </div>
          ) : (
            filteredNotes
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map(note => (
                <NoteCard key={note.id} note={note} />
              ))
          )}
        </div>
      )}
    </div>
  );
};
