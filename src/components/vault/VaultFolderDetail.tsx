import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Image as ImageIcon, PenLine, File as FileIcon, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VaultFile, Subject } from "@/hooks/useVaultData";
import { getCourseColor } from "@/lib/courseColors";
import { VaultAddContentMenu } from "./VaultAddContentMenu";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

interface VaultFolderDetailProps {
  subject: Subject;
  files: VaultFile[];
  onContentAdded: () => void;
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

export const VaultFolderDetail = ({ subject, files, onContentAdded }: VaultFolderDetailProps) => {
  const color = getCourseColor(subject.name);
  const groups = useMemo(() => groupByDay(files), [files]);

  return (
    <div className="space-y-6">
      {/* Big folder header */}
      <div className="flex flex-col items-center text-center pt-2">
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
