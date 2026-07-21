import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const RAW_ERROR_TERNARY = "error instanceof Error ? error.message";

describe("food surface error contract", () => {
  it("keeps barcode scanner save failures free of raw backend/provider messages", async () => {
    const source = await readSource("src/features/meal/BarcodeScanner.tsx");

    expect(source).toContain("setSaveError(copy.saveFailed)");
    expect(source).toContain("message: copy.catalogRetry");
    expect(source).not.toContain("PlatformApiError");
    expect(source).not.toContain(RAW_ERROR_TERNARY);
    expect(source).not.toContain("error.message");
    expect(source).not.toContain("intakeCatalog.message");
    expect(source).not.toContain("CLOUD_SAVE_ERROR_MESSAGE");
  });

  it("keeps meal entry editor failures free of raw backend/provider messages", async () => {
    const source = await readSource("src/features/meal/hooks/useMealEntryEditor.ts");

    expect(source).toContain("Could not save meal. Please try again.");
    expect(source).not.toContain(RAW_ERROR_TERNARY);
    expect(source).not.toContain("Could not save meal to cloud.");
  });

  it("keeps quick meal and shared meal action feedback free of raw exception text", async () => {
    const quickComposerSource = await readSource("src/features/meal/QuickMealComposer.tsx");
    const feedbackHookSource = await readSource("src/features/meal/useMealActionFeedback.ts");

    expect(quickComposerSource).toContain("message: copy.mealSaveFailed");
    expect(quickComposerSource).not.toContain(RAW_ERROR_TERNARY);
    expect(quickComposerSource).not.toContain("QUICK_MEAL_SAVE_ERROR");
    expect(feedbackHookSource).toContain("message: getFailedMealActionCopy(copy, kind)");
    expect(feedbackHookSource).not.toContain(RAW_ERROR_TERNARY);
    expect(feedbackHookSource).not.toContain("defaultErrorMessage");
  });
});
