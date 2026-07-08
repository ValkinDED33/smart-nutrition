import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { shouldUseCompanionCanvas } from "./companionAvatarModel";

const readSource = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

describe("explicit 3D companion surface contract", () => {
  it("defaults the companion renderer to 2D unless the user explicitly enables 3D", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        renderMode: "2d",
        size: 220,
      })
    ).toBe(false);
  });

  it("allows explicit 3D when the desktop-class device supports it", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        renderMode: "3d",
        size: 220,
      })
    ).toBe(true);
  });

  it("does not let explicit 3D preference bypass mobile and low-power runtime guards", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        isMobileViewport: true,
        renderMode: "3d",
        size: 220,
      })
    ).toBe(false);

    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        lowPowerDevice: true,
        renderMode: "3d",
        size: 220,
      })
    ).toBe(false);
  });

  it("keeps explicit 3D surfaces user-controlled with local fallback and error recovery", async () => {
    const sources = await Promise.all([
      readSource("../../../pages/AiCompanionPage.tsx"),
      readSource("../../profile/AssistantCustomizationCard.tsx"),
      readSource("../../profile/CompanionShopCard.tsx"),
    ]);

    sources.forEach((source) => {
      expect(source).toContain("useCompanionRenderModePreference");
      expect(source).toContain("CompanionRenderModeControl");
      expect(source).toContain("Companion3DLoadingFallback");
      expect(source).toContain("on3dLoadError");
      expect(source).not.toContain('renderMode="3d"');
      expect(source).not.toContain('useState<CompanionRenderModeValue>("2d")');
    });
  });

  it("persists render mode through one profile-backed preference hook", async () => {
    const source = await readSource("../../profile/useCompanionRenderModePreference.ts");

    expect(source).toContain("preferredCompanionRenderMode");
    expect(source).toContain("useProfileCloudAction");
    expect(source).toContain("runProfileAction");
    expect(source).toContain("setAssistantCustomization");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
  });
});
