import { describe, expect, it, vi } from 'vitest';
import { createCoalescedSaver } from './coalescedSaver';
describe('draft saves', () => {
  it('coalesces rapid edits and flushes the latest answer before submission', async () => {
    const write = vi.fn(async (_value: string) => undefined);
    const saver = createCoalescedSaver(write, () => undefined);
    saver.schedule('A'); saver.schedule('B'); saver.schedule('C');
    await saver.flush();
    expect(write.mock.calls).toEqual([['C']]);
  });
  it('serializes in-flight writes so older answers cannot overwrite new answers', async () => {
    let release: () => void = () => undefined;
    const first = new Promise<void>(resolve => { release = resolve; });
    const calls: string[] = [];
    const saver = createCoalescedSaver(async value => { calls.push(value); if (value === 'A') await first; }, () => undefined);
    saver.schedule('A'); const firstFlush = saver.flush();
    await Promise.resolve(); await Promise.resolve();
    saver.schedule('B'); const secondFlush = saver.flush();
    expect(calls).toEqual(['A']);
    release(); await Promise.all([firstFlush, secondFlush]);
    expect(calls).toEqual(['A','B']);
  });
  it('reports failed saves and retains them for retry', async () => {
    const report = vi.fn(); const write = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    const saver = createCoalescedSaver(write, report); saver.schedule('A');
    await expect(saver.flush()).rejects.toThrow('offline');
    await saver.flush();
    expect(report).toHaveBeenCalledOnce(); expect(write.mock.calls).toEqual([['A'], ['A']]);
  });
});