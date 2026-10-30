import { describe, expect, it } from "vitest";
import { collectCourseFiles, semesterForCreation } from "../../supabase/functions/google-drive/courseOrganization";

const semesters = [
  { id: "s1", start_date: "2026-09-01", end_date: "2027-01-31" },
  { id: "s2", start_date: "2027-02-01", end_date: "2027-06-30" },
];

describe("Drive course organization", () => {
  it("files by creation date in the matching semester, not the current semester", () => {
    expect(semesterForCreation("2026-10-30T14:08:00Z", semesters)).toBe("s1");
    expect(semesterForCreation("2027-03-10T10:00:00Z", semesters)).toBe("s2");
  });
  it("uses the Paris calendar date at semester boundaries", () => {
    expect(semesterForCreation("2027-01-31T23:30:00Z", semesters)).toBe("s2");
  });
  it("does not guess when semester dates overlap or do not exist", () => {
    expect(semesterForCreation("2026-10-30T14:08:00Z", [...semesters, { ...semesters[0], id: "overlap" }])).toBeNull();
    expect(semesterForCreation("2024-10-30T14:08:00Z", semesters)).toBeNull();
    expect(semesterForCreation("invalid", semesters)).toBeNull();
  });
  it("imports nested course folders and preserves same-name file identities", async () => {
    const folder = "application/vnd.google-apps.folder";
    const pdf = "application/pdf";
    const result = await collectCourseFiles("hub", async (id) => ({ files: id === "hub" ? [
      { id: "maths", name: "Maths", mimeType: folder },
      { id: "history", name: "Histoire", mimeType: folder },
    ] : [{ id: `${id}-chapter`, name: "Chapitre 1.pdf", mimeType: pdf }] }), [pdf]);
    expect(result.files.map((file) => file.id)).toEqual(["maths-chapter", "history-chapter"]);
    expect(result.files.map((file) => file.folder)).toEqual([" / Maths", " / Histoire"]);
  });
  it("paginates nested folders without revisiting a folder or file", async () => {
    const result = await collectCourseFiles("hub", async (_id, token) => token ? ({ files: [
      { id: "a", mimeType: "application/pdf" }, { id: "b", mimeType: "application/pdf" },
      { id: "hub", mimeType: "application/vnd.google-apps.folder" },
    ] }) : ({ files: [{ id: "a", mimeType: "application/pdf" }], nextPageToken: "p2" }), ["application/pdf"]);
    expect(result.files.map((file) => file.id)).toEqual(["a", "b"]);
    expect(result.truncated).toBe(false);
  });
});