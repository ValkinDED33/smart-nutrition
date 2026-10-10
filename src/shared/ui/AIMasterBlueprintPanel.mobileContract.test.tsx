import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../theme/colorMode", () => ({
  useAppColorMode: () => ({
    isDarkMode: false,
    mode: "light",
    setMode: vi.fn(),
    toggleMode: vi.fn(),
  }),
}));

vi.mock("../language", () => ({
  useLanguage: () => ({
    appLanguage: "uk",
    t: (key: string) => key,
  }),
}));

vi.mock("../components/AssistantAvatar", () => ({
  AssistantAvatar: () => null,
}));

import { AIMasterBlueprintPanel } from "./AIMasterBlueprintPanel";

describe("AIMasterBlueprintPanel compact mobile contract", () => {
  it("renders the compact action hub and exposes accessible expansion controls", () => {
    const html = renderToString(
      <AIMasterBlueprintPanel
        eyebrow="Smart Nutrition AI"
        title="Blueprint"
        description="Board description"
        patterns={[]}
      />
    );

    expect(html).toContain('data-ai-action-hub-panel="true"');
    expect(html).toContain('data-ai-action-hub-actions="true"');
    expect(html).not.toContain("Interaction & Motion System");
  });
});
