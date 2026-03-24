import { useState, useRef } from "react";
import { Plus, FileText, Camera, PenLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultNoteEditor } from "./VaultNoteEditor";
import { useAuth } from "@/hooks/useAuth";
import { useVaultData } from "@/hooks/useVaultData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VaultAddContentMenuProps {
  subjectId: string;
  onContentAdded: () => void;
}

export const VaultAddContentMenu = ({ subjectId, onContentAdded }: VaultAddContentMenuProps) => {
  const { user } = useAuth();
  const { createFile } = useVaultData();
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadAndProcess = async (file: File, isPhoto: boolean) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("notes")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const fileUrl = urlData?.signedUrl || "";

      let extractedText: string | null = null;
      let aiSummary: string | null = null;

      // OCR for images
      if (isPhoto || file.type.startsWith("image/")) {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const { data: ocrResult, error: ocrError } = await supabase.functions.invoke(
            "process-note",
            { body: { imageBase64: base64, action: "ocr" } }
          );

          if (!ocrError && ocrResult) {
            extractedText = ocrResult.extractedText || ocrResult.text || null;
            aiSummary = ocrResult.summary || null;
          }
        } catch (e) {
          console.error("OCR error:", e);
        }
      }

      // Determine file type tag
      const fileType = file.type.startsWith("image/")
        ? "photo"
        : file.type.includes("pdf")
        ? "pdf"
        : "document";

      await createFile({
        file_url: fileUrl,
        subject_id: subjectId,
        extracted_text: extractedText,
        ai_summary: aiSummary,
        original_filename: file.name,
        file_type: fileType,
        filing_status: "confirmed",
        tags: [fileType],
      });

      toast.success("Fichier ajouté avec succès");
      onContentAdded();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'ajout du fichier");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndProcess(file, false);
    e.target.value = "";
  };

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndProcess(file, true);
    e.target.value = "";
  };

  const handleNoteSave = async (title: string, markdownContent: string) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Store markdown note as a vault file with extracted_text = markdown content
      await createFile({
        file_url: "",
        subject_id: subjectId,
        extracted_text: markdownContent,
        ai_summary: title,
        file_type: "note",
        filing_status: "confirmed",
        tags: ["note"],
        original_filename: `${title}.md`,
      });

      toast.success("Note créée avec succès");
      onContentAdded();
    } catch (error) {
      console.error("Note save error:", error);
      toast.error("Erreur lors de la création de la note");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="gap-3 py-2.5 rounded-lg"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>Importer un fichier</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => cameraInputRef.current?.click()}
            className="gap-3 py-2.5 rounded-lg"
          >
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span>Capturer / Photo</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowNoteEditor(true)}
            className="gap-3 py-2.5 rounded-lg"
          >
            <PenLine className="w-4 h-4 text-muted-foreground" />
            <span>Note rapide</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelect}
      />

      {/* Note editor */}
      <VaultNoteEditor
        open={showNoteEditor}
        onOpenChange={setShowNoteEditor}
        onSave={handleNoteSave}
      />
    </>
  );
};
