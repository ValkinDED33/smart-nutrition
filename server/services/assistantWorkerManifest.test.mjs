import { describe, expect, it } from "vitest";
import serverAssistantWorkerTools from "./assistantWorkerTools.json" with {
  type: "json",
};
import clientAssistantWorkerTools from "../../src/features/assistant/assistantWorkerTools.json" with {
  type: "json",
};
import { assistantWorkerTools, buildAssistantWorkerToolLines } from "./assistantWorkerManifest.mjs";

describe("assistantWorkerManifest", () => {
  it("loads from a server-owned runtime manifest", () => {
    expect(assistantWorkerTools).toHaveLength(serverAssistantWorkerTools.length);
    expect(buildAssistantWorkerToolLines("uk")).toContain(
      "• Планування — День, тиждень, цілі й сімейний ритм."
    );
  });

  it("stays in sync with the client assistant worker manifest", () => {
    expect(serverAssistantWorkerTools).toEqual(clientAssistantWorkerTools);
  });
});
