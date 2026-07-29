import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("AI Discovery Cards contract", () => {
  it("keeps discovery cards tied to canonical daily context and existing actions", async () => {
    const componentSource = await readSource(
      "src/features/assistant/AIDiscoveryCards.tsx"
    );
    const modelSource = await readSource(
      "src/features/assistant/aiDiscoveryCardsModel.ts"
    );
    const homeSource = await readSource("src/pages/HomePage.tsx");

    expect(componentSource).toContain("buildAIDiscoveryCards");
    expect(componentSource).toContain("buildAIDiscoveryTimeline");
    expect(componentSource).toContain("aria-label={text.timelineTitle}");
    expect(componentSource).toContain("onRunAction(item.action");
    expect(modelSource).toContain("DailyContext");
    expect(modelSource).toContain("AssistantHomeAction");
    expect(modelSource).toContain("AIDiscoveryTimelineItem");
    expect(modelSource).toContain("buildAIDiscoveryTimeline");
    expect(homeSource).toContain("buildAIDiscoveryTimeline");
    expect(homeSource).toContain("const heroStory = useMemo");
    expect(homeSource).toContain("aria-label={copy.heroStoryLabel}");
    expect(homeSource).toContain("onClick={item.action ? () => runAssistantAction");
    expect(homeSource).toContain("<AIDiscoveryCards");
    expect(homeSource).toContain("context={dailyContext}");
    expect(homeSource).toContain("intelligence={intelligence}");
    expect(homeSource).toContain("onRunAction={runAssistantAction}");
    expect(`${componentSource}\n${modelSource}`).not.toMatch(
      /localStorage|Math\.random|setTimeout|fetch\(|axios|mock|placeholder/i
    );
  });
});
