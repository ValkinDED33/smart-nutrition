import type { Variants } from "framer-motion";
import { EASE_EMPHASIZED } from "./spring";

export const bottomSheetVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: EASE_EMPHASIZED,
    },
  },
  exit: {
    opacity: 0,
    y: 28,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
};

export const sideSheetVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 28,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: EASE_EMPHASIZED,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};
