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
}) =>
  renderMode !== "2d" &&
  size >= 48 &&
  canUseCanvas &&
  !isMobileViewport &&
  !prefersReducedMotion &&
  !saveData &&
  !lowPowerDevice;
