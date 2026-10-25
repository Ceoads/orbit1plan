import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { LearningActivity, LearningConcept, LearningResponse } from "@/lib/concentration";

export interface ConcentrationOverview { subjects: { id: string; name: string; icon: string; color_key: string }[]; paths: { id: string; subject_id: string; title: string }[]; introSeen: boolean; exams: { id: string; title: string; subject_id: string; exam_date: string }[] }
export interface ConcentrationData {
  path: { id: string; title: string; subject_id: string; coverage_note: string; exam_date: string | null; duration_minutes: number; sources: { id: string; title: string; kind: string; fileId?: string }[] };
  concepts: LearningConcept[]; activities: LearningActivity[];
  session: { activity_id: string | null; status: string; draft: { responses?: LearningResponse[] } } | null;
}
export interface ConcentrationResult { pathId?: string; activity?: LearningActivity | null; targeted?: boolean; ok?: boolean; source?: { title: string; text: string; fileId?: string }; result?: { correct: number; total: number; mastery: number; confidence: number; feedback: { correct: boolean; answer: number[]; explanation: string }[] }; next?: { activity: LearningActivity | null; targeted: boolean } | null; preparationError?: string | null }
export async function concentrationCall<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("concentration", { body });
  if (error) {
    let message = "Orbit est indisponible. Ton travail enregistré est conservé.";
    try { const value = await error.context?.json(); if (value?.error) message = value.error; } catch { /* network failure */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export function useConcentration(pathId: string | null) {
  const { user } = useAuth(); const client = useQueryClient();
  const options = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false, retry: false as const };
  const overview = useQuery({ queryKey: ["concentration-overview", user?.id], queryFn: () => concentrationCall<ConcentrationOverview>({ action: "overview" }), enabled: !!user, ...options });
  const journey = useQuery({ queryKey: ["concentration-path", user?.id, pathId], queryFn: () => concentrationCall<ConcentrationData>({ action: "load", pathId }), enabled: !!user && !!pathId, ...options });
  const action = useMutation({ mutationFn: (body: Record<string, unknown>) => concentrationCall<ConcentrationResult>({ ...(pathId ? { pathId } : {}), ...body }), onSuccess: (_, body) => {
    // Drafts and source reads do not change the path or course catalogue.
    if (body.action !== "session" && body.action !== "source") client.invalidateQueries({ queryKey: ["concentration-path", user?.id, pathId] });
    if (body.action === "intro" || body.action === "create") client.invalidateQueries({ queryKey: ["concentration-overview", user?.id] });
  } });
  return { overview, journey, action };
}