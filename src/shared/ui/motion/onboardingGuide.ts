import type { Variants } from "framer-motion";
import {
  assistantAuraVariants,
  assistantSpeechBubbleVariants,
  assistantSpeechStaggerVariants,
} from "./assistant";
import { EASE_EMPHASIZED } from "./spring";

export const onboardingGuideShellVariants: Variants = {
  initial: {
    opacity: 0,
    filter: "blur(14px)",
  },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.34,
      ease: EASE_EMPHASIZED,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(12px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const onboardingGuideFloatVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3.4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

export const onboardingGuideBubbleVariants = assistantSpeechBubbleVariants;
export const onboardingGuideStaggerVariants = assistantSpeechStaggerVariants;

export const onboardingGuideAvatarVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.88,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
    },
  },
};

export const onboardingGuideGlowVariants = assistantAuraVariants;
