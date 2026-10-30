import { describe, expect, it } from "vitest";
import { selectFreshDriveFiles } from "../../supabase/functions/google-drive/driveIdentity";

describe("Drive sync source identity", () => {
  it("imports History Chapitre 1.pdf even when Maths Chapitre 1.pdf was imported", () => {
    const maths = { id: "maths-drive-id", name: "Chapitre 1.pdf" };
    const history = { id: "history-drive-id", name: "Chapitre 1.pdf" };
    expect(selectFreshDriveFiles([maths, history], [maths.id])).toEqual({ fresh: [history], alreadyThere: 1 });
  });

  it("keeps both a Word file and a PDF with the same base name", () => {
    const files = [{ id: "pdf-id", name: "Cours.pdf" }, { id: "word-id", name: "Cours.docx" }];
    expect(selectFreshDriveFiles(files, []).fresh).toEqual(files);
  });

  it("keeps same-name files in a single listing when neither was imported", () => {
    const files = [{ id: "first-id", name: "TD 1.pdf" }, { id: "second-id", name: "TD 1.pdf" }];
    expect(selectFreshDriveFiles(files, []).fresh).toEqual(files);
  });

  it("skips the exact source on a second sync even after it is renamed", () => {
    const file = { id: "source-id", name: "Chapitre 1.pdf" };
    const first = selectFreshDriveFiles([file], []);
    expect(first.fresh).toEqual([file]);
    expect(selectFreshDriveFiles([{ ...file, name: "Renamed.pdf" }], first.fresh.map((item) => item.id)))
      .toEqual({ fresh: [], alreadyThere: 1 });
  });

  it("deduplicates repeated listing entries by ID only", () => {
    const file = { id: "source-id", name: "Cours.pdf" };
    expect(selectFreshDriveFiles([file, file], [])).toEqual({ fresh: [file], alreadyThere: 0 });
  });

  it("keeps unsuccessful imports eligible for retry", () => {
    const files = [{ id: "success-id" }, { id: "failed-id" }];
    expect(selectFreshDriveFiles(files, ["success-id"]).fresh).toEqual([{ id: "failed-id" }]);
  });
});