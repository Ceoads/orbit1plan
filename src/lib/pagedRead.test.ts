import { describe, it, expect } from 'vitest';
import { readAllPages } from './pagedRead';
describe('bounded collection reads', () => {
  it('retains older records past the first page', async () => {
    const rows = Array.from({ length: 53 }, (_, id) => ({ id }));
    const ranges: number[][] = [];
    const result = await readAllPages(async (from, to) => { ranges.push([from, to]); return { data: rows.slice(from, to + 1), error: null }; });
    expect(result).toEqual(rows);
    expect(ranges).toEqual([[0,24], [25,49], [50,74]]);
  });
  it('does not hide read failures', async () => {
    await expect(readAllPages(async () => ({ data: null, error: new Error('offline') }))).rejects.toThrow('offline');
  });
});