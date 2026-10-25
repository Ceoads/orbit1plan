export interface LearningQuestion { question: string; options: string[]; hint: string; type: "single" | "multiple" | "true_false"; difficulty: string; application: boolean }
export interface LearningActivity { id: string; concept_id: string; title: string; kind: string; status: string; position: number; content: { lesson: string; questions: LearningQuestion[]; source_ids: string[] } }
export interface LearningConcept { id: string; title: string; section: string; objective: string; mastery: number; confidence: number; question_count: number; application_count: number; retention_count: number; review_at: string | null }
export interface LearningResponse { selected: number[]; hints: number }
export function understandingLevel(c: Pick<LearningConcept, "mastery" | "confidence" | "application_count" | "retention_count" | "question_count">) {
  if (c.question_count < 4) return "Premières observations";
  if (c.mastery >= 85 && c.confidence >= 0.8 && c.application_count >= 2 && c.retention_count >= 1) return "Maîtrisé";
  if (c.mastery >= 70 && c.confidence >= 0.4) return "Compréhension solide";
  if (c.mastery >= 40) return "En progression";
  return "À pratiquer";
}
export function toggleAnswer(response: LearningResponse, index: number, multiple: boolean): LearningResponse {
  return { ...response, selected: multiple ? response.selected.includes(index) ? response.selected.filter(i => i !== index) : [...response.selected, index] : [index] };
}