// A Drive ID, not a display name, identifies a source document.
export function selectFreshDriveFiles<T extends { id: string }>(
  files: T[],
  importedIds: Iterable<string>,
): { fresh: T[]; alreadyThere: number } {
  const imported = new Set(importedIds);
  const listed = new Set<string>();
  const fresh: T[] = [];
  let alreadyThere = 0;
  for (const file of files) {
    if (listed.has(file.id)) continue;
    listed.add(file.id);
    if (imported.has(file.id)) {
      alreadyThere++;
    } else {
      fresh.push(file);
    }
  }
  return { fresh, alreadyThere };
}