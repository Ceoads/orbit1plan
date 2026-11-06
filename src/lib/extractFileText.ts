import { supabase } from "@/integrations/supabase/client";

const PDF_MAX = 8 * 1024 * 1024;

/** Reads photos and PDFs on upload so Orbit AI, quizzes and flashcards can use their content. */
export async function extractFileText(file: File): Promise<{ text: string | null; summary: string | null }> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!file.type.startsWith("image/") && !(isPdf && file.size <= PDF_MAX)) return { text: null, summary: null };
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const { data, error } = await supabase.functions.invoke("process-note", { body: { imageBase64: base64, action: "ocr", mimeType: isPdf ? "application/pdf" : file.type } });
    if (error || !data) return { text: null, summary: null };
    const summary = data.aiSummary && data.aiSummary !== "Unable to parse structured response" ? data.aiSummary : null;
    return { text: data.rawText || null, summary };
  } catch {
    return { text: null, summary: null };
  }
}
