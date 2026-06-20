export type CompanionAvatarRenderMode = "2d" | "3d" | "auto";

export const shouldUseCompanionCanvas = ({
  canUseCanvas,
  renderMode = "2d",
  size = 64,
}: {
  canUseCanvas: boolean;
  renderMode?: CompanionAvatarRenderMode;
  size?: number;
}) => renderMode !== "2d" && size >= 48 && canUseCanvas;
