import { useEffect } from "react";

export const SmoothScrollAgent = () => {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let cancelled = false;
    let destroySmoothScroll: (() => void) | undefined;

    void import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) {
          return;
        }

        const lenis = new Lenis({
          autoRaf: true,
          lerp: 0.09,
          wheelMultiplier: 0.85,
        });

        destroySmoothScroll = () => {
          lenis.destroy();
        };
      })
      .catch((error: unknown) => {
        console.warn(
          "[runtime] smooth scroll failed to initialize",
          error instanceof Error ? error.message : "unknown error"
        );
      });

    return () => {
      cancelled = true;
      destroySmoothScroll?.();
    };
  }, []);

  return null;
};
