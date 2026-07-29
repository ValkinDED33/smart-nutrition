import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("AiCompanionPage contract", () => {
  it("keeps assistant sections accessibility copy localized", async () => {
    const source = await readSource("src/pages/AiCompanionPage.tsx");

    expect(source).toContain("sectionsAriaLabel");
    expect(source).toContain("Розділи помічника");
    expect(source).toContain("Sekcje asystenta");
    expect(source).toContain("Assistant sections");
    expect(source).toContain("ariaLabel={copy.sectionsAriaLabel}");
    expect(source).not.toContain('ariaLabel="Assistant companion sections"');
  });
});
