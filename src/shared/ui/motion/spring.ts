import type { Transition } from "framer-motion";

export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
};

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 30,
};

export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

export const EASE_EMPHASIZED = [0.22, 1, 0.36, 1] as const;
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
