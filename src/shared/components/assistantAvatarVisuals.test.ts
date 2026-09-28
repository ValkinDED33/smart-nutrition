import { describe, expect, it } from "vitest";
import type { AssistantCompanionKind } from "@domain/profile/types";
import {
  ROBOT_COMPANION_KINDS,
  getRobotSkinPalette,
  isRobotCompanionKind,
} from "./assistantAvatarVisuals";

const readPaletteColors = (palette: ReturnType<typeof getRobotSkinPalette>) => [
  palette.shell,
  palette.shellShadow,
  palette.shellHighlight,
  palette.visor,
  palette.visorGlow,
  palette.eye,
  palette.core,
  palette.coreGlow,
  palette.sideLight,
  palette.blush,
];

describe("assistantAvatarVisuals robot skins", () => {
  it("keeps every robot skin wired to a palette with real colors", () => {
    ROBOT_COMPANION_KINDS.forEach((kind) => {
      const colors = readPaletteColors(getRobotSkinPalette(kind));

      expect(colors.every((color) => Boolean(color)), kind).toBe(true);
    });
  });

  it("keeps light and dark robot skins visually distinct from each other", () => {
    const signatures = ROBOT_COMPANION_KINDS.map((kind) => {
      const palette = getRobotSkinPalette(kind);
      return `${palette.shell}|${palette.core}`;
    });

    expect(new Set(signatures).size).toBe(ROBOT_COMPANION_KINDS.length);
  });

  it("keeps the classic robot as the shared fallback for non-robot companions", () => {
    const nonRobotKinds: AssistantCompanionKind[] = ["cat", "panda", "human"];

    nonRobotKinds.forEach((kind) => {
      expect(isRobotCompanionKind(kind)).toBe(false);
      expect(getRobotSkinPalette(kind)).toEqual(getRobotSkinPalette("robot"));
    });
  });

  it("keeps free and premium robot looks on the same skin contract", () => {
    ROBOT_COMPANION_KINDS.forEach((kind) => {
      expect(isRobotCompanionKind(kind)).toBe(true);
      expect(getRobotSkinPalette(kind).coreGlow).toMatch(/^rgba\(/);
    });
  });
});
