import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("HomePage contract", () => {
  it("surfaces women-health entrypoint from canonical profile state", async () => {
    const source = await readSource("src/pages/HomePage.tsx");

    expect(source).toContain("state.profile.womenHealth");
    expect(source).toContain("isWomenHealthVisibleForGender(user.gender)");
    expect(source).toContain("hasWomenHealthContext(womenHealth)");
    expect(source).toContain('path: "/profile#women-health"');
    expect(source).toContain('testId: "home-women-health-entrypoint"');
    expect(source).toContain("data-home-women-health-entrypoint");
    expect(source).not.toContain("localStorage");
  });
});
