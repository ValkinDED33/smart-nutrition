import type { Variants } from "framer-motion";
import { EASE_EMPHASIZED } from "./spring";

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: "blur(8px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.32,
      ease: EASE_EMPHASIZED,
      when: "beforeChildren",
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(8px)",
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
};

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
