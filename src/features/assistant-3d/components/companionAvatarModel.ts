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

const MINIMUM_CANVAS_SIZE = 96;

export const shouldUseCompanionCanvas = ({
  canUseCanvas,
  renderMode = "2d",
  size = 64,
  isMobileViewport = false,
  prefersReducedMotion = false,
  saveData = false,
  lowPowerDevice = false,
}: CompanionCanvasGuards) =>
  canUseCanvas &&
  renderMode === "3d" &&
  size >= MINIMUM_CANVAS_SIZE &&
  !isMobileViewport &&
  !prefersReducedMotion &&
  !saveData &&
  !lowPowerDevice;
