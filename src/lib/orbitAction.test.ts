import { describe, it, expect } from "vitest";
import { splitOrbitAction } from "./orbitAction";

const block = (o: unknown) => `Je peux le faire.\n\`\`\`orbit-action\n${JSON.stringify(o)}\n\`\`\``;

describe("splitOrbitAction", () => {
  it("extracts a proposed action and hides the block", () => {
    const r = splitOrbitAction(block({ type: "complete_task", taskId: "x", label: "Terminer ?" }));
    expect(r.text).toBe("Je peux le faire.");
    expect(r.action?.type).toBe("complete_task");
  });
  it("rejects unknown action types", () => {
    expect(splitOrbitAction(block({ type: "drop_everything" })).action).toBeNull();
  });
  it("hides a half-streamed block without proposing anything", () => {
    const r = splitOrbitAction("Ok\n```orbit-action\n{\"type\":");
    expect(r.action).toBeNull();
    expect(r.pending).toBe(true);
    expect(r.text).toBe("Ok");
  });
});
