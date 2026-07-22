import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

describe("Smart Nutrition visual system contract", () => {
  it("exposes one theme-driven companion visual language", async () => {
    const source = await readSource("../theme/AppThemeProvider.tsx");

    expect(source).toContain("--sn-companion-hero");
    expect(source).toContain("--sn-companion-overlay");
    expect(source).toContain("--sn-portal-ring");
    expect(source).toContain("--sn-scene-landscape");
    expect(source).toContain(".sn-companion-panel");
    expect(source).toContain(
      "linear-gradient(135deg, var(--sn-surface-elevated), var(--sn-surface-glass))",
    );
  });

  it("keeps shared page, card, and auth surfaces on the premium system", async () => {
    const [pageShell, sectionCard, authSurface] = await Promise.all([
      readSource("./PageShell.tsx"),
      readSource("./SectionCard.tsx"),
      readSource("./AuthSurface.tsx"),
    ]);

    expect(pageShell).toContain('className="sn-premium-panel sn-page-hero"');
    expect(sectionCard).toContain('className="sn-premium-panel"');
    expect(authSurface).toContain('className="sn-premium-panel"');
    expect(authSurface).toContain("var(--sn-companion-hero)");
  });

  it("keeps authenticated home using theme-aware companion colors", async () => {
    const [source, assistantDisplayNameSource] = await Promise.all([
      readSource("../../pages/HomePage.tsx"),
      readSource("../../features/assistant/assistantDisplayName.ts"),
    ]);

    expect(source).toContain("useAppColorMode");
    expect(source).toContain("heroBackground");
    expect(source).toContain("heroOverlay");
    expect(source).toContain("heroRing");
    expect(source).toContain("Smart Nutrition AI");
    expect(source).toContain("getAssistantDisplayName");
    expect(assistantDisplayNameSource).toContain("legacyAssistantNames");
    expect(source).toContain("env(safe-area-inset-bottom");
    expect(source).not.toContain('className="sn-companion-panel"');
    expect(source).not.toContain("HyeMye");
  });
});
