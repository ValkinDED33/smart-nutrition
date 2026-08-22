import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("HomePage contract", () => {
  it("keeps the dashboard aligned with the fixed AI worker blueprint", async () => {
    const source = await readSource("src/pages/HomePage.tsx");

    expect(source).toContain('data-ai-worker-command-center="true"');
    expect(source).toContain('data-ai-worker-home-center="true"');
    expect(source).toContain('data-home-command-center="ecosystem-rail"');
    expect(source).toContain('data-home-command-center="live-panels"');
    expect(source).toContain('data-home-command-center="hero-core"');
    expect(source).toContain('data-home-command-center="assistant-dock"');
    expect(source).toContain('data-ai-worker-route-item="true"');
    expect(source).toContain('data-ai-worker-metric="true"');
    expect(source).toContain('data-ai-worker-tool-grid="true"');
    expect(source).toContain('data-ai-worker-tool="true"');
    expect(source).toContain("<AIMasterBlueprintPanel");
    expect(source).toContain("homeBlueprintPatterns");
    expect(source).toContain("copy.blueprintPatterns.slider");
    expect(source).toContain("copy.blueprintPatterns.accordion");
    expect(source).toContain("copy.blueprintPatterns.sheet");
    expect(source).toContain("copy.blueprintPatterns.expand");
    expect(source).toContain("copy.blueprintPatterns.swipe");
    expect(source).toContain("copy.blueprintPatterns.drag");
    expect(source).toContain("copy.blueprintPatterns.context");
    expect(source).toContain("variant={assistant.companionKind}");
    expect(source).not.toContain('variant="robot"');
  });

  it("surfaces women-health entrypoint from canonical profile state", async () => {
    const source = await readSource("src/pages/HomePage.tsx");

    expect(source).toContain("state.profile.womenHealth");
    expect(source).toContain("isWomenHealthVisibleForGender(user.gender)");
    expect(source).toContain("hasWomenHealthContext(womenHealth)");
    expect(source).toContain('const WOMEN_HEALTH_ROUTE = "/profile#women-health"');
    expect(source).toContain("path: WOMEN_HEALTH_ROUTE");
    expect(source).toContain('testId: "home-women-health-entrypoint"');
    expect(source).toContain("data-home-women-health-entrypoint");
    expect(source).not.toContain("localStorage");
  });
});
