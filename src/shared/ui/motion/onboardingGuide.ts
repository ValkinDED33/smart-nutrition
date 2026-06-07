import type { Variants } from "framer-motion";

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
      ease: [0.22, 1, 0.36, 1],
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

export const onboardingGuideBubbleVariants: Variants = {
  initial: {
    opacity: 0,
    x: 8,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 6,
    transition: {
      duration: 0.16,
    },
  },
};

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

export const onboardingGuideGlowVariants: Variants = {
  animate: {
    scale: [0.96, 1.12, 0.96],
    opacity: [0.58, 0.28, 0.58],
    transition: {
      duration: 2.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};
