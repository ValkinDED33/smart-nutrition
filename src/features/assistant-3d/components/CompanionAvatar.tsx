import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AssistantAvatar as CompanionFallback2D,
  type AssistantAvatarProps,
} from "@shared/components/AssistantAvatar";
import { CompanionErrorBoundary } from "./CompanionErrorBoundary";
import {
  shouldUseCompanionCanvas,
  type CompanionAvatarRenderMode,
} from "./companionAvatarModel";

export interface CompanionAvatarProps extends AssistantAvatarProps {
  renderMode?: CompanionAvatarRenderMode;
  defer3dUntilVisible?: boolean;
  loadingFallback?: ReactNode;
  on3dLoadError?: () => void;
}

const CompanionCanvas = lazy(() =>
  import("./CompanionCanvas").then((module) => ({
    default: module.CompanionCanvas,
  }))
);

let cachedWebGlSupport: boolean | null = null;
let companionCanvasDisabledAfterFailure = false;

const canUseCompanionCanvas = () => {
  if (companionCanvasDisabledAfterFailure) {
    return false;
  }

  if (cachedWebGlSupport !== null) {
    return cachedWebGlSupport;
  }

  if (typeof document === "undefined") {
    cachedWebGlSupport = false;
    return cachedWebGlSupport;
  }

  try {
    const canvas = document.createElement("canvas");
    cachedWebGlSupport = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    );
  } catch {
    cachedWebGlSupport = false;
  }

  return cachedWebGlSupport;
};

type NavigatorWithDeviceHints = Navigator & {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
};

const getCompanionCanvasRuntimeGuards = () => {
  if (typeof window === "undefined") {
    return {
      canUseCanvas: false,
      isMobileViewport: false,
      prefersReducedMotion: false,
      saveData: false,
      lowPowerDevice: false,
    };
  }

  const navigatorHints = window.navigator as NavigatorWithDeviceHints;
  const hardwareConcurrency = navigatorHints.hardwareConcurrency ?? 4;
  const deviceMemory = navigatorHints.deviceMemory ?? 4;

  return {
    canUseCanvas: canUseCompanionCanvas(),
    isMobileViewport: Boolean(
      window.matchMedia?.("(max-width: 767px), (pointer: coarse)").matches
    ),
    prefersReducedMotion: Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ),
    saveData: Boolean(navigatorHints.connection?.saveData),
    lowPowerDevice: hardwareConcurrency <= 2 || deviceMemory <= 2,
  };
};

const canObserveViewport = () =>
  typeof window !== "undefined" && "IntersectionObserver" in window;

export const CompanionAvatar = ({
  renderMode = "2d",
  defer3dUntilVisible = true,
  loadingFallback,
  on3dLoadError,
  ...props
}: CompanionAvatarProps) => {
  const size = props.size ?? 64;
  const fallback = <CompanionFallback2D {...props} />;
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const canDeferCanvas = defer3dUntilVisible && canObserveViewport();
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const shouldRenderCanvas = shouldUseCompanionCanvas({
    ...getCompanionCanvasRuntimeGuards(),
    renderMode,
    size,
  }) && !canvasFailed;

  const handleCanvasError = () => {
    companionCanvasDisabledAfterFailure = true;
    setCanvasFailed(true);
    on3dLoadError?.();
  };

  useEffect(() => {
    if (!shouldRenderCanvas || !canDeferCanvas || hasEnteredViewport) {
      return undefined;
    }

    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [canDeferCanvas, hasEnteredViewport, shouldRenderCanvas]);

  if (!shouldRenderCanvas) {
    return fallback;
  }

  if (canDeferCanvas && !hasEnteredViewport) {
    return (
      <span ref={containerRef} style={{ display: "inline-flex", lineHeight: 0 }}>
        {fallback}
      </span>
    );
  }

  return (
    <span ref={containerRef} style={{ display: "inline-flex", lineHeight: 0 }}>
      <CompanionErrorBoundary fallback={fallback} onError={handleCanvasError}>
        <Suspense fallback={loadingFallback ?? fallback}>
          <CompanionCanvas {...props} />
        </Suspense>
      </CompanionErrorBoundary>
    </span>
  );
};
