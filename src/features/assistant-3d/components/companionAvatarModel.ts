export type CompanionAvatarRenderMode = "2d" | "3d" | "auto";

type CompanionCanvasGuards = {
  canUseCanvas: boolean;
  renderMode?: CompanionAvatarRenderMode;
  size?: number;
  isMobileViewport?: boolean;
  prefersReducedMotion?: boolean;
  saveData?: boolean;
  lowPowerDevice?: boolean;
};

// The full-body shared avatar is the canonical Smart Nutrition assistant.
// Keep the legacy canvas path disabled until it can match the accepted product visual system.
export const shouldUseCompanionCanvas: (guards: CompanionCanvasGuards) => boolean = () => false;
