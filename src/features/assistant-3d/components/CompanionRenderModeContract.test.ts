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

  it("does not let explicit 3D replace the unified production assistant", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        renderMode: "3d",
        size: 220,
      })
    ).toBe(false);
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

  it("keeps the assistant page on the unified avatar path instead of exposing renderer controls", async () => {
    const sources = await Promise.all([readSource("../../../pages/AiCompanionPage.tsx")]);

    sources.forEach((source) => {
      expect(source).toContain("useCompanionRenderModePreference");
      expect(source).toContain("Companion3DLoadingFallback");
      expect(source).toContain("on3dLoadError");
      expect(source).toContain("Як помічник з'являється");
      expect(source).toContain("Jak asystent się pojawia");
      expect(source).toContain("How the assistant appears");
      expect(source).toContain("Ефектно");
      expect(source).toContain("Efektownie");
      expect(source).toContain("Expressive");
      expect(source).not.toContain("CompanionRenderModeControl");
      expect(source).not.toContain('renderMode="3d"');
      expect(source).not.toContain('useState<CompanionRenderModeValue>("2d")');
      expect(source).not.toMatch(
        /Стиль присутності|Легкий образ|Живий образ|Styl obecności|Lekki wygląd|Żywy wygląd|Presence style|Light look|Living look|Швидкий 2D|Живий 3D|Fast 2D|Live 3D|Szybki 2D|Żywy 3D/
      );
    });
  });

  it("keeps the companion shop magical instead of exposing renderer jargon", async () => {
    const source = await readSource("../../profile/CompanionShopCard.tsx");

    expect(source).toContain("useCompanionRenderModePreference");
    expect(source).toContain("Companion3DLoadingFallback");
    expect(source).toContain("on3dLoadError");
    expect(source).not.toContain("CompanionRenderModeControl");
    expect(source).not.toMatch(
      /Стиль присутності|Легкий образ|Живий образ|Styl obecności|Lekki wygląd|Żywy wygląd|Presence style|Light look|Living look|Швидкий 2D|Живий 3D|Fast 2D|Live 3D|Szybki 2D|Żywy 3D/
    );
  });

  it("keeps assistant customization product-led instead of exposing renderer jargon", async () => {
    const source = await readSource("../../profile/AssistantCustomizationCard.tsx");

    expect(source).toContain("useCompanionRenderModePreference");
    expect(source).toContain("Companion3DLoadingFallback");
    expect(source).toContain("on3dLoadError");
    expect(source).toContain("appearanceTitle");
    expect(source).toContain("appearanceHint");
    expect(source).not.toContain("CompanionRenderModeControl");
    expect(source).not.toMatch(
      /Стиль присутності|Легкий образ|Живий образ|Styl obecności|Lekki wygląd|Żywy wygląd|Presence style|Light look|Living look|Швидкий 2D|Живий 3D|Fast 2D|Live 3D|Szybki 2D|Żywy 3D/
    );
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

  it("keeps the legacy 3D canvas out of the canonical companion avatar path", async () => {
    const source = await readSource("CompanionAvatar.tsx");

    expect(source).toContain("CompanionFallback2D");
    expect(source).toContain("@shared/components/AssistantAvatar");
    expect(source).not.toContain("CompanionCanvas");
    expect(source).not.toContain("lazy(");
    expect(source).not.toContain("Suspense");
  });
});
