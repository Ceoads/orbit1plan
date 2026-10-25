/** Coalesce edits, serialize writes, and flush before leaving or submitting. */
export function createCoalescedSaver<T>(write: (value: T) => Promise<unknown>, onError: (error: unknown) => void, delay = 400) {
  let pending: { value: T } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tail: Promise<unknown> = Promise.resolve();
  const enqueue = () => {
    clearTimeout(timer); timer = undefined;
    const item = pending; pending = undefined;
    if (!item) return;
    tail = tail.catch(() => undefined).then(() => write(item.value)).catch(error => {
      pending ??= item; onError(error); throw error;
    });
    void tail.catch(() => undefined);
  };
  return {
    schedule(value: T) { pending = { value }; clearTimeout(timer); timer = setTimeout(enqueue, delay); },
    async flush() { enqueue(); await tail; if (pending) { enqueue(); await tail; } },
  };
}