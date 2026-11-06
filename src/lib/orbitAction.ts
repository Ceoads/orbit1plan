export type OrbitActionOp = { type: string; label?: string; [k: string]: unknown };

const ALLOWED = new Set(["file_document", "create_task", "complete_task", "delete_item"]);
const BLOCK = /```orbit-action\s*([\s\S]*?)(```|$)/;

/** Splits an Orbit AI reply into visible text and an optional proposed action (never auto-executed). */
export function splitOrbitAction(content: string): { text: string; action: OrbitActionOp | null; pending: boolean } {
  const m = content.match(BLOCK);
  if (!m) return { text: content, action: null, pending: false };
  const text = content.slice(0, m.index).trimEnd();
  if (m[2] !== "```") return { text, action: null, pending: true };
  try {
    const op = JSON.parse(m[1].trim());
    if (!op || typeof op !== "object" || !ALLOWED.has(op.type)) return { text, action: null, pending: false };
    return { text, action: op, pending: false };
  } catch {
    return { text, action: null, pending: false };
  }
}
