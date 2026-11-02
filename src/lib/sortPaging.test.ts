import { describe, it, expect } from "vitest";
import { readAllPages, mapLimit } from "../../supabase/functions/_shared/paging";

describe("Ranger reads every unfiled document", () => {
  it("reads past the first page of 100 (250 docs → 250)", async () => {
    const docs = Array.from({ length: 250 }, (_, i) => i);
    const all = await readAllPages(async (from, to) => docs.slice(from, to + 1));
    expect(all).toHaveLength(250);
  });
  it("handles exactly one full page", async () => {
    const docs = Array.from({ length: 100 }, (_, i) => i);
    expect(await readAllPages(async (f, t) => docs.slice(f, t + 1))).toHaveLength(100);
  });
  it("classifies every document with bounded concurrency", async () => {
    let live = 0, peak = 0;
    const out = await mapLimit(Array.from({ length: 20 }, (_, i) => i), 4, async (n) => {
      live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 1)); live--; return n * 2;
    });
    expect(out).toEqual(Array.from({ length: 20 }, (_, i) => i * 2));
    expect(peak).toBeLessThanOrEqual(4);
  });
});
