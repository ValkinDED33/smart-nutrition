import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("ProductSearch contract", () => {
  it("uses the user's single assistant identity for product search guidance", async () => {
    const source = await readSource("src/features/meal/ProductSearch.tsx");

    expect(source).toContain("const assistant = useSelector((state: RootState) => state.profile.assistant)");
    expect(source).toContain("getAssistantDisplayName(assistant.name, appLanguage)");
    expect(source).toContain("variant={assistant.companionKind}");
    expect(source).not.toContain("state.profile.assistant.name");
    expect(source).not.toContain('variant="robot"');
  });
});
