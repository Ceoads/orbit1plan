import { describe, expect, it } from "vitest";
import { toggleAnswer, understandingLevel } from "./concentration";
const evidence = { mastery: 90, confidence: 1, application_count: 2, retention_count: 1, question_count: 12 };
describe("Concentration: evidence-based progress", () => {
  it("does not call two easy correct answers mastered", () => {
    expect(understandingLevel({ ...evidence, mastery: 100, confidence: 2 / 12, question_count: 2, application_count: 0, retention_count: 0 })).toBe("Premières observations");
  });
  it("requires delayed retention before mastery", () => {
    expect(understandingLevel({ ...evidence, retention_count: 0 })).toBe("Compréhension solide");
    expect(understandingLevel(evidence)).toBe("Maîtrisé");
  });
  it("requires application evidence before mastery", () => {
    expect(understandingLevel({ ...evidence, application_count: 0 })).toBe("Compréhension solide");
  });
  it("distinguishes observed developing and weak understanding", () => {
    expect(understandingLevel({ ...evidence, mastery: 50 })).toBe("En progression");
    expect(understandingLevel({ ...evidence, mastery: 30 })).toBe("À pratiquer");
  });
  it("keeps only one selection for single-answer assessment", () => {
    expect(toggleAnswer({ selected: [0], hints: 1 }, 2, false)).toEqual({ selected: [2], hints: 1 });
  });
  it("allows independent multiple-answer toggles without duplicate choices", () => {
    const first = toggleAnswer({ selected: [0], hints: 0 }, 2, true);
    expect(first.selected).toEqual([0, 2]);
    expect(toggleAnswer(first, 2, true).selected).toEqual([0]);
  });
});