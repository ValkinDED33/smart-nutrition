import type { Variants } from "framer-motion";
import { EASE_EMPHASIZED } from "./spring";

export const pageSectionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: EASE_EMPHASIZED,
    },
  },
};
