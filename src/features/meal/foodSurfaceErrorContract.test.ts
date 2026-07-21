import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("food surface error contract", () => {
  it("keeps barcode scanner save failures free of raw backend/provider messages", async () => {
    const source = await readSource("src/features/meal/BarcodeScanner.tsx");

    expect(source).toContain("setSaveError(copy.saveFailed)");
    expect(source).toContain("message: copy.catalogRetry");
    expect(source).not.toContain("PlatformApiError");
    expect(source).not.toContain("error instanceof Error ? error.message");
    expect(source).not.toContain("error.message");
    expect(source).not.toContain("intakeCatalog.message");
    expect(source).not.toContain("CLOUD_SAVE_ERROR_MESSAGE");
  });

  it("keeps meal entry editor failures free of raw backend/provider messages", async () => {
    const source = await readSource("src/features/meal/hooks/useMealEntryEditor.ts");

    expect(source).toContain("Could not save meal. Please try again.");
    expect(source).not.toContain("error instanceof Error ? error.message");
    expect(source).not.toContain("Could not save meal to cloud.");
  });
});
