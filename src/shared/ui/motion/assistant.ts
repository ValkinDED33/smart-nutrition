import type { Transition, Variants } from "framer-motion";
import { EASE_EMPHASIZED, SPRING_SNAPPY } from "./spring";

const idleBreathingTransition: Transition = {
  duration: 3.4,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
};

const activeTiltTransition: Transition = {
  duration: 2.2,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
};

export const assistantAvatarRootVariants: Variants = {
  idle: {
    y: [0, 1.5],
    scale: [1, 0.992],
    rotate: [0, -0.6],
    transition: idleBreathingTransition,
  },
  active: {
    y: [0, -4, 1],
    scale: [1, 1.015, 1],
    rotate: [0, -2, 1],
    transition: activeTiltTransition,
  },
  sleepy: {
    y: [0, 2],
    scale: [1, 0.985],
    opacity: [0.92, 0.78],
    transition: {
      duration: 3.2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
    },
  },
  celebrate: {
    y: [0, -5, 0],
    scale: [1, 1.035, 1],
    rotate: [0, -3, 2],
    transition: {
      duration: 1.35,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

export const assistantAvatarHover = {
  y: -3,
  scale: 1.04,
  rotate: -1.5,
  transition: SPRING_SNAPPY,
};

export const assistantEyeBlinkTransition: Transition = {
  duration: 4.8,
  ease: "easeInOut",
  times: [0, 0.9, 0.94, 0.98, 1],
  repeat: Infinity,
};

export const assistantSpeechBubbleVariants: Variants = {
  initial: {
    opacity: 0,
    x: 8,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.26,
      ease: EASE_EMPHASIZED,
    },
  },
  exit: {
    opacity: 0,
    x: 6,
    scale: 0.985,
    transition: {
      duration: 0.16,
      ease: "easeOut",
    },
  },
};

export const assistantSpeechStaggerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
};

export const assistantAuraVariants: Variants = {
  animate: {
    scale: [0.96, 1.12, 0.96],
    opacity: [0.58, 0.28, 0.58],
    transition: {
      duration: 2.8,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
