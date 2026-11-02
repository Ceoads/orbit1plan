import { describe, it, expect } from "vitest";
import { suggestSubjectFromToday } from "./todayClassSuggestion";

const now = new Date(2026, 10, 2, 12, 0); // Monday 12:00
const ev = (subject_id: string, start_time: string, end_time: string) => ({ subject_id, start_time, end_time, event_date: "2026-11-02", event_type: "class" });

describe("suggestSubjectFromToday", () => {
  it("prefers the class in progress", () => {
    expect(suggestSubjectFromToday([ev("a", "09:00", "10:30"), ev("b", "11:30", "12:30"), ev("c", "14:00", "15:00")], now)?.subjectId).toBe("b");
  });
  it("falls back to a class ended under 2 hours ago", () => {
    expect(suggestSubjectFromToday([ev("a", "09:00", "10:30"), ev("c", "14:00", "15:00")], now)).toMatchObject({ subjectId: "a", reason: "recent" });
  });
  it("then to the next class of the day", () => {
    expect(suggestSubjectFromToday([ev("a", "08:00", "09:30"), ev("c", "14:00", "15:00")], now)).toMatchObject({ subjectId: "c", reason: "next" });
  });
  it("ignores other days", () => {
    expect(suggestSubjectFromToday([{ ...ev("a", "11:00", "13:00"), event_date: "2026-11-03" }], now)).toBeNull();
  });
});
