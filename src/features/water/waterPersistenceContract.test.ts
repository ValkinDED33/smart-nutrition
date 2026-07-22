import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(resolve(process.cwd(), path), "utf8");

const normalizeNewlines = (source: string) => source.replace(/\r\n/g, "\n");
const WATER_TRACKER_SOURCE_PATH = "src/features/water/WaterTracker.tsx";

describe("water persistence contract", () => {
  it("exposes one cloud-confirmed water action hook with retry support", async () => {
    const source = await readSource("src/features/water/useWaterCloudAction.ts");

    expect(source).toContain("saveWaterStateToCloud");
    expect(source).toContain("replaceWaterState");
    expect(source).toContain("runWaterStateSave");
    expect(source).toContain("retryLastWaterSave");
    expect(source).toContain("failedWaterRef.current = nextWater");
    expect(source).toContain("surfaceFailure");
    expect(source).toContain("resolveWaterCloudActionErrorMessage");
    expect(source).toContain("copy.saveFailed");
    expect(source).toContain("copy.saveInProgress");
    expect(source).toContain("throw caughtError");
    expect(source).not.toContain("Water could not be saved. Please try again.");
    expect(source).not.toContain("Water is already being saved. Please wait a moment.");
    expect(source).not.toContain("setError(message)");
    expect(source).not.toContain("setError(inProgressError.message)");
  });

  it("keeps WaterTracker on the shared cloud action contract", async () => {
    const source = normalizeNewlines(
      await readSource(WATER_TRACKER_SOURCE_PATH)
    );

    expect(source).toContain("useWaterCloudAction");
    expect(source).toContain("saveFailed: copy.saveError");
    expect(source).toContain("saveInProgress: copy.saveInProgress");
    expect(source).toContain("runWaterStateSave(nextWater)");
    expect(source).toContain("retryLastWaterSave");
    expect(source).toContain("waterActionHasRetry");
    expect(source).not.toContain("saveWaterStateToCloud(dispatch");
    expect(source).not.toContain("dispatch(replaceWaterState");
  });

  it("does not clear target or glass drafts after a failed cloud save", async () => {
    const source = normalizeNewlines(
      await readSource(WATER_TRACKER_SOURCE_PATH)
    );

    expect(source).toContain("if (!saved) {\n          return;\n        }\n\n        setTargetDraft(null);");
    expect(source).toContain("if (!saved) {\n        return;\n      }\n\n      setGlassSizeDraft(null);");
  });

  it("keeps partial-glass editor open until save is confirmed", async () => {
    const source = await readSource(WATER_TRACKER_SOURCE_PATH);

    expect(source).toContain("const saved = await saveWaterState(nextWater)");
    expect(source).toContain("if (!saved) {\n      return;\n    }\n\n    setEditingSlot(null);");
  });

  it("localizes companion reward sync warnings without weakening water save success", async () => {
    const source = await readSource(WATER_TRACKER_SOURCE_PATH);

    expect(source).toContain("rewardSyncWarning");
    expect(source).toContain("Воду збережено");
    expect(source).toContain("Woda została zapisana");
    expect(source).toContain("Water was saved");
    expect(source).not.toContain("error instanceof Error ? error.message");
    expect(source).not.toContain("${copy.rewardSyncWarning} ${error.message}");
    expect(source).not.toContain("Water saved, but companion progress could not sync");
  });
});
