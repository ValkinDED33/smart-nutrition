import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import serverAssistantWorkerTools from "./assistantWorkerTools.json" with {
  type: "json",
};
import { assistantWorkerTools, buildAssistantWorkerToolLines } from "./assistantWorkerManifest.mjs";

const readJson = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

describe("assistantWorkerManifest", () => {
  it("loads from a server-owned runtime manifest", () => {
    expect(assistantWorkerTools).toHaveLength(serverAssistantWorkerTools.length);
    expect(buildAssistantWorkerToolLines("uk")).toContain(
      "• Планування — День, тиждень, цілі й сімейний ритм."
    );
  });

  it("stays in sync with the client assistant worker manifest", async () => {
    const clientAssistantWorkerTools = await readJson(
      "../../src/features/assistant/assistantWorkerTools.json"
    );

    expect(serverAssistantWorkerTools).toEqual(clientAssistantWorkerTools);
  });
});
