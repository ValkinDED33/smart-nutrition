import type { Variants } from "framer-motion";
import { EASE_EMPHASIZED } from "./spring";

export const modalBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.14,
      ease: "easeOut",
    },
  },
};

export const modalPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.26,
      ease: EASE_EMPHASIZED,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};
