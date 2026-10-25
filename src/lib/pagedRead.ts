/** Read existing collections in bounded pages without silently hiding older records. */
export async function readAllPages<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 25) {
    const { data, error } = await read(from, from + 24);
    if (error) throw error;
    result.push(...(data ?? []));
    if (!data || data.length < 25) return result;
  }
}