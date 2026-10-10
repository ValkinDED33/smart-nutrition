import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const HOME_PAGE_SOURCE = "src/pages/HomePage.tsx";
const ASSISTANT_SECTION_GUARD = 'activeSection === "assistant"';

describe("HomePage contract", () => {
  it("keeps the dashboard aligned with the fixed AI worker blueprint", async () => {
    const source = await readSource(HOME_PAGE_SOURCE);

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
    expect(source).toContain("useWaterCloudAction(waterActionCopy)");
    expect(source).toContain("buildWaterStateAfterIncrement(water, water.glassSizeMl)");
    expect(source).toContain("runWaterStateSave(nextWater)");
    expect(source).not.toContain("incrementWater");
    expect(source).not.toContain('variant="robot"');
  });

  it("surfaces women-health entrypoint from canonical profile state", async () => {
    const source = await readSource(HOME_PAGE_SOURCE);

    expect(source).toContain("state.profile.womenHealth");
    expect(source).toContain("isWomenHealthVisibleForGender(user.gender)");
    expect(source).toContain("hasWomenHealthContext(womenHealth)");
    expect(source).toContain('const WOMEN_HEALTH_ROUTE = "/women-health"');
    expect(source).toContain('const REMINDERS_ROUTE = "/reminders"');
    expect(source).toContain("path: WOMEN_HEALTH_ROUTE");
    expect(source).toContain("path: REMINDERS_ROUTE");
    expect(source).toContain('testId: "home-women-health-entrypoint"');
    expect(source).toContain("data-home-women-health-entrypoint");
    expect(source).not.toContain("localStorage");
  });

  it("keeps the mobile default dashboard focused before opening deep AI discovery", async () => {
    const source = await readSource(HOME_PAGE_SOURCE);
    const tabsIndex = source.indexOf("<SectionTabs");
    const assistantSectionIndex = source.indexOf(ASSISTANT_SECTION_GUARD);
    const discoveryIndex = source.indexOf("<AIDiscoveryCards");
    const blueprintIndex = source.indexOf("<AIMasterBlueprintPanel");

    expect(tabsIndex).toBeGreaterThan(-1);
    expect(assistantSectionIndex).toBeGreaterThan(tabsIndex);
    expect(discoveryIndex).toBeGreaterThan(assistantSectionIndex);
    expect(blueprintIndex).toBeGreaterThan(assistantSectionIndex);
  });
});
