import { describe, expect, it, vi } from "vitest";
import { createAssistantRuntimeMemory } from "./assistantMemory";

describe("assistant runtime memory", () => {
  it("confirms history clear only after the backend clear succeeds", async () => {
    const clearHistory = vi.fn().mockResolvedValueOnce(true);
    const memory = createAssistantRuntimeMemory({ clearHistory });

    await expect(memory.clearHistory("user-1")).resolves.toBe(true);

    expect(clearHistory).toHaveBeenCalledWith("user-1");
  });

  it("does not report a successful history clear when the backend rejects it", async () => {
    const clearHistory = vi
      .fn()
      .mockRejectedValueOnce(new Error("AI history clear failed."));
    const memory = createAssistantRuntimeMemory({ clearHistory });

    await expect(memory.clearHistory("user-1")).rejects.toThrow(
      "AI history clear failed."
    );
  });
});
