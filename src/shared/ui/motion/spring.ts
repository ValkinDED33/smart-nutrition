import type { Transition } from "framer-motion";

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 30,
};

export const EASE_EMPHASIZED = [0.22, 1, 0.36, 1] as const;
