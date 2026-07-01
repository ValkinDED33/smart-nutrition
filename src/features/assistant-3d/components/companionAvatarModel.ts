export type CompanionAvatarRenderMode = "2d" | "3d" | "auto";

export const shouldUseCompanionCanvas = ({
  canUseCanvas,
  renderMode = "2d",
  size = 64,
  isMobileViewport = false,
  prefersReducedMotion = false,
  saveData = false,
  lowPowerDevice = false,
}: {
  canUseCanvas: boolean;
  renderMode?: CompanionAvatarRenderMode;
  size?: number;
  isMobileViewport?: boolean;
  prefersReducedMotion?: boolean;
  saveData?: boolean;
  lowPowerDevice?: boolean;
}) => {
  if (
    renderMode === "2d" ||
    size < 48 ||
    !canUseCanvas ||
    prefersReducedMotion ||
    saveData
  ) {
    return false;
  }

  if (renderMode === "auto") {
    return !isMobileViewport && !lowPowerDevice;
  }

  return true;
};
