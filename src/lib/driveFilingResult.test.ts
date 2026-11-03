import { describe, expect, it } from "vitest";
import { filingOutcome } from "../../supabase/functions/google-drive/filingResult";

describe("Drive filing counts actual subject assignments", () => {
  it("does not count a subjectless course with an unchanged semester as filed on repeated runs", () => {
    const row = { subject_id: null, semester_id: "s1" };
    for (let run = 0; run < 2; run++) {
      expect(filingOutcome(row, row)).toEqual({ filed: 0, ambiguous: 1, semestersUpdated: 0 });
    }
  });
  it("keeps a semester-only repair separate from a subject assignment", () => {
    expect(filingOutcome({ subject_id: null, semester_id: null }, { subject_id: null, semester_id: "s1" }))
      .toEqual({ filed: 0, ambiguous: 1, semestersUpdated: 1 });
  });
  it("counts a newly assigned subject as one filed course", () => {
    expect(filingOutcome({ subject_id: null, semester_id: "s1" }, { subject_id: "maths", semester_id: "s1" }))
      .toEqual({ filed: 1, ambiguous: 0, semestersUpdated: 0 });
  });
  it("does not count an already assigned subject when repairing its semester", () => {
    expect(filingOutcome({ subject_id: "maths", semester_id: null }, { subject_id: "maths", semester_id: "s1" }))
      .toEqual({ filed: 0, ambiguous: 0, semestersUpdated: 1 });
  });
});