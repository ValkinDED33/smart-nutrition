import { useEffect } from "react";
import Lenis from "lenis";

export const SmoothScrollAgent = () => {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 0.85,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
};
