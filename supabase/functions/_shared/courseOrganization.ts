export type SemesterRange = { id: string; start_date: string; end_date: string };

// Creation dates are compared in the student's calendar timezone, not import time.
export function semesterForCreation(iso: string, semesters: SemesterRange[]): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  const matches = semesters.filter((semester) => semester.start_date <= day && day <= semester.end_date);
  // Overlapping or missing ranges must never silently file in an arbitrary semester.
  return matches.length === 1 ? matches[0].id : null;
}

type DriveEntry = { id: string; name?: string; mimeType: string; createdTime?: string };
type DrivePage = { files?: DriveEntry[]; nextPageToken?: string };
export type CourseFile = { id: string; name?: string; folder: string; createdTime?: string };

// Both OAuth and Hub use the same bounded, read-only nested-folder traversal.
export async function collectCourseFiles(
  root: string,
  list: (folder: string, pageToken?: string) => Promise<DrivePage>,
  supported: string[],
) {
  const queue = [{ id: root, path: "" }];
  const visited = new Set<string>();
  const seenFiles = new Set<string>();
  const files: CourseFile[] = [];
  let truncated = false;
  while (queue.length && visited.size < 100 && files.length < 500) {
    const folder = queue.shift();
    if (!folder || visited.has(folder.id)) continue;
    visited.add(folder.id);
    let token: string | undefined;
    do {
      const page = await list(folder.id, token);
      for (const entry of page.files ?? []) {
        if (entry.mimeType === "application/vnd.google-apps.folder") {
          if (queue.length + visited.size < 100) queue.push({ id: entry.id, path: `${folder.path} / ${entry.name ?? ""}` });
          else truncated = true;
        } else if (supported.includes(entry.mimeType) && !seenFiles.has(entry.id)) {
          seenFiles.add(entry.id);
          files.push({ id: entry.id, name: entry.name, createdTime: entry.createdTime, folder: folder.path });
          if (files.length === 500) break;
        }
      }
      token = page.nextPageToken;
    } while (token && files.length < 500);
    if (token) truncated = true;
  }
  return { files, truncated: truncated || queue.length > 0 };
}