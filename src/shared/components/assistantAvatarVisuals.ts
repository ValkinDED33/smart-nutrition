import type { AssistantCompanionKind } from "@domain/profile/types";

export interface CompanionVisual {
  face: string;
  detail: string;
  shadow: string;
  muzzle: string;
  eye: string;
}

const warmCreamMuzzle = "rgba(254,243,199,0.82)";
const tigerCreamMuzzle = "rgba(255,237,213,0.86)";

export const companionVisuals: Record<AssistantCompanionKind, CompanionVisual> = {
  cat: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #f97316 0%, #fb923c 52%, #facc15 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.24)",
    muzzle: tigerCreamMuzzle,
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
    muzzle: warmCreamMuzzle,
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
  raccoon: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #1f2937 0%, #64748b 54%, #0f766e 100%)",
    detail: "#cbd5e1",
    shadow: "0 18px 36px rgba(71, 85, 105, 0.24)",
    muzzle: "rgba(226,232,240,0.82)",
    eye: "#f8fafc",
  },
  corgi: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.3), transparent 22%), linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fef3c7 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(245, 158, 11, 0.22)",
    muzzle: "rgba(255,247,237,0.9)",
    eye: "#fff7ed",
  },
  wolf: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.24), transparent 22%), linear-gradient(135deg, #334155 0%, #64748b 52%, #0f172a 100%)",
    detail: "#e2e8f0",
    shadow: "0 18px 36px rgba(51, 65, 85, 0.24)",
    muzzle: "rgba(226,232,240,0.82)",
    eye: "#f8fafc",
  },
  tiger: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #111827 0 12%, #f97316 12% 42%, #111827 42% 52%, #f59e0b 52% 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.24)",
    muzzle: tigerCreamMuzzle,
    eye: "#fff7ed",
  },
  bear: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.24), transparent 22%), linear-gradient(135deg, #451a03 0%, #92400e 54%, #f59e0b 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(120, 53, 15, 0.22)",
    muzzle: warmCreamMuzzle,
    eye: "#fef3c7",
  },
  rabbit: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.4), transparent 22%), linear-gradient(135deg, #f8fafc 0%, #c4b5fd 52%, #f9a8d4 100%)",
    detail: "#fce7f3",
    shadow: "0 18px 36px rgba(196, 181, 253, 0.24)",
    muzzle: "rgba(255,255,255,0.9)",
    eye: "#ffffff",
  },
  chameleon: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #15803d 0%, #22c55e 46%, #06b6d4 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 36px rgba(34, 197, 94, 0.24)",
    muzzle: "rgba(220,252,231,0.8)",
    eye: "#ecfeff",
  },
  lion: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.3), transparent 22%), linear-gradient(135deg, #78350f 0%, #d97706 45%, #facc15 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(217, 119, 6, 0.24)",
    muzzle: "rgba(254,243,199,0.86)",
    eye: "#fef3c7",
  },
  otter: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #78350f 0%, #a16207 52%, #0891b2 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(8, 145, 178, 0.2)",
    muzzle: warmCreamMuzzle,
    eye: "#ecfeff",
  },
  hedgehog: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.24), transparent 22%), linear-gradient(135deg, #292524 0%, #78716c 45%, #fbbf24 100%)",
    detail: "#fde68a",
    shadow: "0 18px 36px rgba(68, 64, 60, 0.22)",
    muzzle: "rgba(254,243,199,0.8)",
    eye: "#fef3c7",
  },
  koala: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #475569 0%, #94a3b8 52%, #e2e8f0 100%)",
    detail: "#cbd5e1",
    shadow: "0 18px 36px rgba(71, 85, 105, 0.22)",
    muzzle: "rgba(241,245,249,0.86)",
    eye: "#f8fafc",
  },
  deer: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #92400e 0%, #d97706 52%, #bbf7d0 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(146, 64, 14, 0.22)",
    muzzle: "rgba(254,243,199,0.84)",
    eye: "#fef3c7",
  },
  turtle: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #14532d 0%, #16a34a 48%, #84cc16 100%)",
    detail: "#bef264",
    shadow: "0 18px 36px rgba(22, 163, 74, 0.22)",
    muzzle: "rgba(220,252,231,0.78)",
    eye: "#f7fee7",
  },
  axolotl: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.34), transparent 22%), linear-gradient(135deg, #fb7185 0%, #f9a8d4 52%, #22d3ee 100%)",
    detail: "#fecdd3",
    shadow: "0 18px 36px rgba(251, 113, 133, 0.24)",
    muzzle: "rgba(252,231,243,0.84)",
    eye: "#ffffff",
  },
  phoenix: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.36), transparent 22%), linear-gradient(135deg, #7c2d12 0%, #f97316 42%, #facc15 72%, #ef4444 100%)",
    detail: "#fef08a",
    shadow: "0 18px 36px rgba(249, 115, 22, 0.28)",
    muzzle: "rgba(254,240,138,0.74)",
    eye: "#fefce8",
  },
  forest_spirit: {
    face:
      "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #064e3b 0%, #10b981 45%, #84cc16 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 36px rgba(16, 185, 129, 0.26)",
    muzzle: "rgba(220,252,231,0.76)",
    eye: "#ecfdf5",
  },
  cosmic_beast: {
    face:
      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.38), transparent 18%), radial-gradient(circle at 70% 36%, rgba(34,211,238,0.5), transparent 22%), linear-gradient(135deg, #020617 0%, #4c1d95 52%, #0e7490 100%)",
    detail: "#c4b5fd",
    shadow: "0 18px 42px rgba(124, 58, 237, 0.28)",
    muzzle: "rgba(224,231,255,0.26)",
    eye: "#e0f2fe",
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
    case "rabbit":
      return "48% 48% 58% 58%";
    case "phoenix":
    case "forest_spirit":
    case "cosmic_beast":
      return "46% 54% 56% 44% / 38% 42% 62% 58%";
    default:
      return "28%";
  }
};

export const isLetterCompanion = (variant: AssistantCompanionKind) =>
  variant === "robot" || variant === "human";
