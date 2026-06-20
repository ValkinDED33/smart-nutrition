import { describe, expect, it } from "vitest";
import { shouldUseCompanionCanvas } from "./companionAvatarModel";

describe("shouldUseCompanionCanvas", () => {
  it("keeps the default avatar lightweight", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
      })
    ).toBe(false);
  });

  it("does not load the 3D renderer for small avatars", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        renderMode: "3d",
        size: 34,
      })
    ).toBe(false);
  });

  it("uses the 3D renderer only when it is explicitly allowed and supported", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: true,
        renderMode: "3d",
        size: 76,
      })
    ).toBe(true);
  });

  it("falls back to 2D when WebGL is unavailable", () => {
    expect(
      shouldUseCompanionCanvas({
        canUseCanvas: false,
        renderMode: "3d",
        size: 76,
      })
    ).toBe(false);
  });
});
