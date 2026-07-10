import type { AssistantCompanionKind } from "@domain/profile/types";

export interface CompanionVisual {
  face: string;
  detail: string;
  shadow: string;
  muzzle: string;
  eye: string;
}

export const companionVisuals: Record<AssistantCompanionKind, CompanionVisual> = {
  cat: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #f97316 0%, #fb923c 52%, #facc15 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.24)",
    muzzle: "rgba(255,237,213,0.86)",
    eye: "#fff7ed",
  },
  dog: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #7c3f16 0%, #b45309 52%, #f59e0b 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(161, 98, 7, 0.24)",
    muzzle: "rgba(254,243,199,0.9)",
    eye: "#fef3c7",
  },
  fox: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #ea580c 0%, #f97316 50%, #111827 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(234, 88, 12, 0.24)",
    muzzle: "rgba(255,247,237,0.92)",
    eye: "#fff7ed",
  },
  panda: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 24%), linear-gradient(135deg, #111827 0%, #f8fafc 42%, #cbd5e1 100%)",
    detail: "#111827",
    shadow: "0 18px 36px rgba(15, 23, 42, 0.22)",
    muzzle: "rgba(255,255,255,0.94)",
    eye: "#f8fafc",
  },
  owl: {
    face:
      "radial-gradient(circle at 36% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #78350f 0%, #ca8a04 50%, #fde68a 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(120, 53, 15, 0.22)",
    muzzle: "rgba(254,243,199,0.72)",
    eye: "#fff7ed",
  },
  human: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #0f766e 0%, #14b8a6 48%, #2563eb 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(20, 184, 166, 0.24)",
    muzzle: "rgba(219,234,254,0.2)",
    eye: "#eff6ff",
  },
  capybara: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.24), transparent 22%), linear-gradient(135deg, #92400e 0%, #d97706 52%, #0f766e 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(146, 64, 14, 0.22)",
    muzzle: "rgba(254,243,199,0.82)",
    eye: "#fef3c7",
  },
  dragon: {
    face:
      "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.34), transparent 22%), linear-gradient(135deg, #166534 0%, #16a34a 42%, #7c3aed 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(22, 163, 74, 0.24)",
    muzzle: "rgba(220,252,231,0.74)",
    eye: "#fefce8",
  },
  robot: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #65a30d 100%)",
    detail: "#dbeafe",
    shadow: "0 18px 36px rgba(15, 118, 110, 0.28)",
    muzzle: "rgba(219,234,254,0.18)",
    eye: "#e0f2fe",
  },
};

export const getCompanionFaceRadius = (variant: AssistantCompanionKind) => {
  switch (variant) {
    case "robot":
      return "28%";
    case "cat":
      return "50%";
    case "dog":
      return "48% 48% 55% 55%";
    case "fox":
      return "44% 44% 58% 58%";
    case "panda":
      return "50%";
    case "owl":
      return "50% 50% 42% 42%";
    case "human":
      return "48% 48% 54% 54%";
    case "capybara":
      return "52% 52% 48% 48%";
    case "dragon":
      return "46% 54% 56% 44% / 38% 42% 62% 58%";
    default:
      return "28%";
  }
};

export const isLetterCompanion = (variant: AssistantCompanionKind) =>
  variant === "robot" || variant === "human";
