import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("app startup auth contract", () => {
  it("does not call remote session restore for public guests without a session hint", async () => {
    const source = await readSource("src/App.tsx");

    expect(source).toContain("clearSavedSessionHint");
    expect(source).toContain("if (hasSessionHint)");
    expect(source).toContain("dispatch(initializeAuth())");
    expect(source).toContain("dispatch(clearSavedSessionHint())");
    expect(source).not.toContain(
      "if (!isInitialized && !isLoading) {\n      dispatch(initializeAuth());"
    );
  });
});
