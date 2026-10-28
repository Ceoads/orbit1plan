// Pulls the Google Drive folder ID out of a pasted share link (or a raw ID).
const ID = /^[A-Za-z0-9_-]{10,200}$/;

export function extractDriveFolderId(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (ID.test(v)) return v;
  let url: URL;
  try { url = new URL(v); } catch { return null; }
  if (!/(^|\.)drive\.google\.com$/.test(url.hostname)) return null;
  const m = url.pathname.match(/\/folders\/([A-Za-z0-9_-]+)/);
  const id = m?.[1] ?? url.searchParams.get("id");
  return id && ID.test(id) ? id : null;
}

/** Folder ID plus the optional `resourcekey` some link-shared folders need. */
export function parseDriveFolderLink(input: string): { id: string; resourceKey?: string } | null {
  const id = extractDriveFolderId(input);
  if (!id) return null;
  try {
    const rk = new URL(input.trim()).searchParams.get("resourcekey");
    if (rk && /^[A-Za-z0-9_-]{1,100}$/.test(rk)) return { id, resourceKey: rk };
  } catch { /* raw ID */ }
  return { id };
}
