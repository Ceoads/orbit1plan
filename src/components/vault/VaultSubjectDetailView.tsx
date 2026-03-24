import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { differenceInDays, isToday, startOfDay } from "date-fns";
import { VaultFile } from "@/hooks/useVaultData";
import { VaultFileCard } from "./VaultFileCard";
import { SwipeableItem } from "@/components/SwipeableItem";
import { cn } from "@/lib/utils";

interface VaultSubjectDetailViewProps {
  files: VaultFile[];
  onDeleteFile: (id: string, name: string) => void;
}

type FilterType = "Tous" | "Cours" | "TP" | "TD";
const FILTERS: FilterType[] = ["Tous", "Cours", "TP", "TD"];

function getDocumentCategory(file: VaultFile): "Cours" | "TP" | "TD" {
  const tags = (file.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("tp") || t.includes("exercice"))) return "TP";
  if (tags.some((t) => t.includes("td") || t.includes("correction"))) return "TD";
  return "Cours";
}

interface Group {
  label: string;
  files: VaultFile[];
  defaultOpen: boolean;
}

function groupByDate(files: VaultFile[]): Group[] {
  const now = startOfDay(new Date());
  const groups: Group[] = [
    { label: "Aujourd'hui", files: [], defaultOpen: true },
    { label: "Cette semaine", files: [], defaultOpen: true },
    { label: "Semaine derniere", files: [], defaultOpen: false },
    { label: "Ce mois-ci", files: [], defaultOpen: false },
    { label: "Plus ancien", files: [], defaultOpen: false },
  ];

  for (const file of files) {
    const diff = differenceInDays(now, startOfDay(new Date(file.created_at)));
    if (isToday(new Date(file.created_at))) groups[0].files.push(file);
    else if (diff <= 7) groups[1].files.push(file);
    else if (diff <= 14) groups[2].files.push(file);
    else if (diff <= 30) groups[3].files.push(file);
    else groups[4].files.push(file);
  }

  return groups.filter((g) => g.files.length > 0);
}

const CollapsibleGroup = ({
  group,
  onDeleteFile,
}: {
  group: Group;
  onDeleteFile: (id: string, name: string) => void;
}) => {
  const [open, setOpen] = useState(group.defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full py-2 text-left"
      >
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em]">
          {group.label}
        </span>
        <span className="text-[10px] text-neutral-600">
          ({group.files.length})
        </span>
      </button>

      {open && (
        <div className="space-y-1 mt-1">
          {group.files.map((file) => (
            <SwipeableItem
              key={file.id}
              onDelete={() =>
                onDeleteFile(file.id, file.ai_summary?.substring(0, 30) || "Fichier")
              }
            >
              <VaultFileCard file={file} />
            </SwipeableItem>
          ))}
        </div>
      )}
    </div>
  );
};

export const VaultSubjectDetailView = ({
  files,
  onDeleteFile,
}: VaultSubjectDetailViewProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(() => {
    let result = [...files].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (activeFilter !== "Tous") {
      result = result.filter((f) => getDocumentCategory(f) === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.extracted_text?.toLowerCase().includes(q) ||
          f.ai_summary?.toLowerCase().includes(q) ||
          f.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [files, activeFilter, searchQuery]);

  const useGroups = files.length >= 5;
  const groups = useMemo(
    () => (useGroups ? groupByDate(filteredFiles) : []),
    [filteredFiles, useGroups]
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher (OCR)..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-[#1E1E24] text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeFilter === filter
                ? "bg-neutral-100 text-neutral-900"
                : "bg-transparent text-neutral-500 hover:text-neutral-300 border border-[#1E1E24]"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Files */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-neutral-500 text-sm">Aucun document</p>
        </div>
      ) : useGroups ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <CollapsibleGroup
              key={group.label}
              group={group}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredFiles.map((file) => (
            <SwipeableItem
              key={file.id}
              onDelete={() =>
                onDeleteFile(
                  file.id,
                  file.ai_summary?.substring(0, 30) || "Fichier"
                )
              }
            >
              <VaultFileCard file={file} />
            </SwipeableItem>
          ))}
        </div>
      )}
    </div>
  );
};
