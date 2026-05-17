import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Image as ImageIcon,
  PenLine,
  File as FileIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VaultFile, Subject } from "@/hooks/useVaultData";
import { getCourseColor } from "@/lib/courseColors";
import { VaultAddContentMenu } from "./VaultAddContentMenu";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VaultFolderDetailProps {
  subject: Subject;
  files: VaultFile[];
  onContentAdded: () => void;
  onRename?: (subjectId: string, newName: string) => Promise<boolean> | boolean;
  onDelete?: (subjectId: string) => Promise<boolean> | boolean;
}

function groupByDay(files: VaultFile[]) {
  const map = new Map<string, { label: string; files: VaultFile[]; time: number }>();
  for (const f of files) {
    const d = new Date(f.created_at);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEEE d MMMM", { locale: fr });
    const entry = map.get(key);
    if (entry) entry.files.push(f);
    else map.set(key, { label, files: [f], time: d.getTime() });
  }
  return Array.from(map.values()).sort((a, b) => b.time - a.time);
}

export const VaultFolderDetail = ({
  subject,
  files,
  onContentAdded,
  onRename,
  onDelete,
}: VaultFolderDetailProps) => {
  const color = getCourseColor(subject.name);
  const groups = useMemo(() => groupByDay(files), [files]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(subject.name);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleShare = async () => {
    const lines = files
      .slice(0, 20)
      .map((f) => `• ${f.ai_summary?.substring(0, 60) || f.original_filename || "Document"}`)
      .join("\n");
    const text = `${subject.name} — ${files.length} document${files.length > 1 ? "s" : ""}\n${lines}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: subject.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copié dans le presse-papier");
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleRenameSubmit = async () => {
    const next = renameValue.trim();
    if (!next || next === subject.name) {
      setRenameOpen(false);
      return;
    }
    if (!onRename) return;
    const ok = await onRename(subject.id, next);
    if (ok) setRenameOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    const ok = await onDelete(subject.id);
    if (ok) setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Big folder header */}
      <div className="flex flex-col items-center text-center pt-2 relative">
        <div className="absolute right-0 top-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
                aria-label="Options du dossier"
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(subject.name);
                  setRenameOpen(true);
                }}
                className="gap-3 py-2.5 rounded-lg"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <span>Renommer</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare} className="gap-3 py-2.5 rounded-lg">
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span>Partager</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="gap-3 py-2.5 rounded-lg text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative w-24 h-20">
          <BigFolder color={color.hex} />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mt-3">
          {subject.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {files.length} {files.length === 1 ? "document" : "documents"}
        </p>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Documents
        </span>
        <VaultAddContentMenu subjectId={subject.id} onContentAdded={onContentAdded} />
      </div>

      {/* Grouped by date */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Aucun document pour le moment</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Ajoute un fichier, une photo ou une note
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-1 mb-3">
                <p className="text-base font-bold text-foreground capitalize">{g.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {g.files.length} {g.files.length === 1 ? "document" : "documents"}
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                {g.files.map((f) => (
                  <DocThumb key={f.id} file={f} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Renommer le dossier</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            placeholder="Nouveau nom"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRenameSubmit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{subject.name}" sera supprimé. Les {files.length} document
              {files.length > 1 ? "s" : ""} resteront accessibles depuis la recherche
              mais ne seront plus rangés dans ce dossier.
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

const DocThumb = ({ file }: { file: VaultFile }) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const title =
    file.ai_summary?.substring(0, 30) ||
    file.original_filename ||
    "Document";

  const onClick = () => {
    haptics.selection();
    navigate(`/study/${file.id}`);
  };

  return (
    <button
      onClick={onClick}
      className="snap-start flex-shrink-0 w-[100px] flex flex-col items-start gap-1.5 group"
    >
      <div
        className={cn(
          "w-[100px] h-[130px] rounded-xl overflow-hidden bg-white",
          "border border-border shadow-sm flex items-center justify-center",
          "transition-transform duration-200 active:scale-95"
        )}
      >
        {file.thumbnail_url ? (
          <img src={file.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : file.file_type === "photo" && file.file_url ? (
          <img src={file.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : file.file_type === "pdf" ? (
          <FileText className="w-8 h-8 text-destructive" />
        ) : file.file_type === "note" ? (
          <PenLine className="w-8 h-8 text-primary" />
        ) : file.file_type === "photo" ? (
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        ) : (
          <FileIcon className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <p className="text-[11px] text-foreground line-clamp-1 w-full text-left px-0.5">
        {title}
      </p>
    </button>
  );
};

const BigFolder = ({ color }: { color: string }) => (
  <div className="relative w-full h-full">
    <div
      className="absolute left-[6%] right-[10%] -top-2 h-[60%] rounded-md bg-white shadow"
      style={{ transform: "rotate(-4deg)", zIndex: 1 }}
    />
    <div
      className="absolute left-[12%] right-[8%] -top-1 h-[60%] rounded-md bg-white shadow"
      style={{ transform: "rotate(3deg)", zIndex: 2 }}
    />
    <div
      className="absolute top-0 left-0 h-[28%] w-[55%] rounded-t-xl"
      style={{ background: color, filter: "brightness(0.92)", zIndex: 3 }}
    />
    <div
      className="absolute top-[20%] left-0 right-0 bottom-0 rounded-xl"
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0.1) 100%)`,
        boxShadow: `0 10px 22px -8px ${color}80, inset 0 -3px 0 rgba(0,0,0,0.08)`,
        zIndex: 4,
      }}
    />
  </div>
);

export const FolderMenuTrigger = () => (
  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors">
    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
  </button>
);
