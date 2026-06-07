import type { Variants } from "framer-motion";
import { EASE_EMPHASIZED } from "./spring";

export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: EASE_EMPHASIZED,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
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
    y: 6,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};

export const staggerFadeContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};
