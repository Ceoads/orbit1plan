import { useState, useRef, useCallback } from "react";
import { Bold, Italic, Heading1, Heading2, List, Quote, Minus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VaultNoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, markdownContent: string) => void;
  initialTitle?: string;
  initialContent?: string;
}

const TOOLBAR_ACTIONS = [
  { icon: Bold, label: "Gras", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italique", prefix: "*", suffix: "*" },
  { icon: Heading1, label: "Titre", prefix: "# ", suffix: "", lineStart: true },
  { icon: Heading2, label: "Sous-titre", prefix: "## ", suffix: "", lineStart: true },
  { icon: List, label: "Liste", prefix: "* ", suffix: "", lineStart: true },
  { icon: Quote, label: "Citation", prefix: "> ", suffix: "", lineStart: true },
  { icon: Minus, label: "Séparateur", prefix: "\n---\n", suffix: "", lineStart: true },
] as const;

export const VaultNoteEditor = ({
  open,
  onOpenChange,
  onSave,
  initialTitle = "",
  initialContent = "",
}: VaultNoteEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback(
    (prefix: string, suffix: string, lineStart?: boolean) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = content.substring(start, end);

      let newContent: string;
      let newCursorPos: number;

      if (lineStart) {
        // Insert at beginning of current line
        const lineStartIdx = content.lastIndexOf("\n", start - 1) + 1;
        newContent = content.substring(0, lineStartIdx) + prefix + content.substring(lineStartIdx);
        newCursorPos = start + prefix.length;
      } else if (selected) {
        newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
        newCursorPos = end + prefix.length + suffix.length;
      } else {
        newContent = content.substring(0, start) + prefix + suffix + content.substring(end);
        newCursorPos = start + prefix.length;
      }

      setContent(newContent);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [content]
  );

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave(title.trim() || "Note sans titre", content);
    setTitle("");
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium text-muted-foreground">
              Nouvelle note
            </DialogTitle>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() && !content.trim()}
              className="rounded-xl gap-1.5 h-8"
            >
              <Save className="w-3.5 h-3.5" />
              Enregistrer
            </Button>
          </div>
        </DialogHeader>

        {/* Title */}
        <div className="px-5 pt-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            className="w-full text-xl font-semibold text-foreground placeholder:text-muted-foreground/50 bg-transparent border-none outline-none"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-5 py-2 border-b border-border/50">
          {TOOLBAR_ACTIONS.map((action) => {
            const Icon = action.icon;
            const { label, prefix, suffix } = action;
            const lineStart = "lineStart" in action ? action.lineStart : false;
            return (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => applyFormat(prefix, suffix, lineStart)}
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80",
                "transition-colors duration-150"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Commence à écrire en Markdown..."
            className={cn(
              "w-full min-h-[300px] bg-transparent border-none outline-none resize-none",
              "text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40",
              "font-mono"
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
