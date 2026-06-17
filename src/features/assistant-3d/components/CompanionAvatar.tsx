import { lazy, Suspense } from "react";
import {
  AssistantAvatar as CompanionFallback2D,
  type AssistantAvatarProps,
} from "@shared/components/AssistantAvatar";
import { CompanionErrorBoundary } from "./CompanionErrorBoundary";

const CompanionCanvas = lazy(() =>
  import("./CompanionCanvas").then((module) => ({
    default: module.CompanionCanvas,
  }))
);

let cachedWebGlSupport: boolean | null = null;

const canUseCompanionCanvas = () => {
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

export const CompanionAvatar = (props: AssistantAvatarProps) => {
  const size = props.size ?? 64;
  const fallback = <CompanionFallback2D {...props} />;

  if (size < 48 || !canUseCompanionCanvas()) {
    return fallback;
  }

  return (
    <CompanionErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <CompanionCanvas {...props} />
      </Suspense>
    </CompanionErrorBoundary>
  );
};
