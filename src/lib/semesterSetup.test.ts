import { describe, expect, it } from "vitest";
import { needsSemesterSetup, semesterSetupError } from "./semesterSetup";
const rows = [
  { name: "Semestre 1", start_date: "2026-09-01", end_date: "2027-01-31" },
  { name: "Semestre 2", start_date: "2027-02-01", end_date: "2027-06-30" },
];
describe("semester dates setup", () => {
  it("asks when dates are missing, including skipped onboarding", () => {
    expect(needsSemesterSetup([])).toBe(true);
    expect(needsSemesterSetup([{ ...rows[0], end_date: "" }])).toBe(true);
  });
  it("does not repeat the question after valid dates are saved", () => {
    expect(needsSemesterSetup(rows)).toBe(false);
  });
  it("rejects overlapping semesters rather than assigning arbitrarily", () => {
    expect(semesterSetupError([rows[0], { ...rows[1], start_date: "2027-01-31" }])).not.toBeNull();
  });
  it("rejects reversed and impossible dates", () => {
    expect(semesterSetupError([{ ...rows[0], end_date: "2026-08-31" }, rows[1]])).not.toBeNull();
    expect(semesterSetupError([{ ...rows[0], start_date: "2026-02-30" }, rows[1]])).not.toBeNull();
  });
});