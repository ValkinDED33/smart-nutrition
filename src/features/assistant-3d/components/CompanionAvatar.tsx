import type { ReactNode } from "react";
import {
  AssistantAvatar as CompanionFallback2D,
  type AssistantAvatarProps,
} from "@shared/components/AssistantAvatar";
import type { CompanionAvatarRenderMode } from "./companionAvatarModel";

export interface CompanionAvatarProps extends AssistantAvatarProps {
  renderMode?: CompanionAvatarRenderMode;
  defer3dUntilVisible?: boolean;
  loadingFallback?: ReactNode;
  on3dLoadError?: () => void;
}

export const CompanionAvatar = (props: CompanionAvatarProps) => (
  <CompanionFallback2D {...props} />
);
