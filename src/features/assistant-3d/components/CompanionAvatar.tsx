import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import {
  AssistantAvatar as CompanionFallback2D,
  type AssistantAvatarProps,
} from "@shared/components/AssistantAvatar";
import { shouldUseCompanionCanvas, type CompanionAvatarRenderMode } from "./companionAvatarModel";
import { CompanionErrorBoundary } from "./CompanionErrorBoundary";

export interface CompanionAvatarProps extends AssistantAvatarProps {
  renderMode?: CompanionAvatarRenderMode;
  defer3dUntilVisible?: boolean;
  loadingFallback?: ReactNode;
  on3dLoadError?: () => void;
}

const LazyCompanionCanvas = lazy(() =>
  import("./CompanionCanvas").then((module) => ({
    default: module.CompanionCanvas,
  }))
);

const canCreateWebGlContext = () => {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
};

const readSaveDataPreference = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };

  return Boolean(connection.connection?.saveData);
};

export const CompanionAvatar = (props: CompanionAvatarProps) => {
  const {
    renderMode = "2d",
    loadingFallback,
    on3dLoadError,
    defer3dUntilVisible = false,
    ...avatarProps
  } = props;
  const [canUseCanvas] = useState(() => canCreateWebGlContext());
  const [canvasFailed, setCanvasFailed] = useState(false);
  const fallback = <CompanionFallback2D {...avatarProps} />;

  const useCanvas = useMemo(() => {
    if (canvasFailed || defer3dUntilVisible) {
      return false;
    }

    const isMobileViewport =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPowerDevice =
      typeof navigator !== "undefined" &&
      Number.isFinite(navigator.hardwareConcurrency) &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4;

    return shouldUseCompanionCanvas({
      canUseCanvas,
      renderMode,
      size: avatarProps.size,
      isMobileViewport,
      prefersReducedMotion,
      saveData: readSaveDataPreference(),
      lowPowerDevice,
    });
  }, [avatarProps.size, canUseCanvas, canvasFailed, defer3dUntilVisible, renderMode]);

  if (!useCanvas) {
    return fallback;
  }

  const handleCanvasError = () => {
    setCanvasFailed(true);
    on3dLoadError?.();
  };

  return (
    <CompanionErrorBoundary fallback={fallback} onError={handleCanvasError}>
      <Suspense fallback={loadingFallback ?? fallback}>
        <LazyCompanionCanvas {...avatarProps} />
      </Suspense>
    </CompanionErrorBoundary>
  );
};
