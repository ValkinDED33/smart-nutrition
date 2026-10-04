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
  it("collapses the decorative board by default and exposes an accessible toggle", () => {
    const html = renderToString(
      <AIMasterBlueprintPanel
        eyebrow="Smart Nutrition AI"
        title="Blueprint"
        description="Board description"
        patterns={[]}
      />
    );

    expect(html).toContain('data-ai-master-blueprint-collapsed="true"');
    expect(html).toContain('data-ai-master-blueprint-collapsible="true"');
    expect(html).toContain('data-ai-master-blueprint-mobile-toggle="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="');
    expect(html).toContain("Показати всю карту");
  });
});
