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

export const ROBOT_COMPANION_KINDS: AssistantCompanionKind[] = [
  "robot",
  "robot_minimal",
  "robot_neon",
  "robot_nature",
  "robot_solar",
  "robot_luna",
  "robot_orion",
  "robot_nova",
  "robot_iris",
  "robot_cosmos",
  "robot_crystal",
  "robot_cyber",
  "robot_flame",
  "robot_hologram",
];

export const isRobotCompanionKind = (variant: AssistantCompanionKind) =>
  ROBOT_COMPANION_KINDS.includes(variant);

export interface RobotSkinPalette {
  shell: string;
  shellShadow: string;
  shellHighlight: string;
  visor: string;
  visorGlow: string;
  eye: string;
  core: string;
  coreGlow: string;
  sideLight: string;
  blush: string;
}

export const robotSkinPalettes = {
  robot: {
    shell: "#eef4f7",
    shellShadow: "#9fb3c8",
    shellHighlight: "#ffffff",
    visor: "#070d18",
    visorGlow: "rgba(34,211,238,0.35)",
    eye: "#5eead4",
    core: "#22d3ee",
    coreGlow: "rgba(34,211,238,0.65)",
    sideLight: "#22d3ee",
    blush: "rgba(34,211,238,0.25)",
  },
  robot_minimal: {
    shell: "#151a24",
    shellShadow: "#05070c",
    shellHighlight: "#2f3a4e",
    visor: "#04060b",
    visorGlow: "rgba(148,163,184,0.25)",
    eye: "#f1f5f9",
    core: "#64748b",
    coreGlow: "rgba(148,163,184,0.5)",
    sideLight: "#64748b",
    blush: "rgba(148,163,184,0.2)",
  },
  robot_neon: {
    shell: "#101b33",
    shellShadow: "#070b18",
    shellHighlight: "#3b2d6e",
    visor: "#040312",
    visorGlow: "rgba(168,85,247,0.5)",
    eye: "#c084fc",
    core: "#22d3ee",
    coreGlow: "rgba(168,85,247,0.7)",
    sideLight: "#22d3ee",
    blush: "rgba(168,85,247,0.3)",
  },
  robot_nature: {
    shell: "#eef5ea",
    shellShadow: "#9db8a4",
    shellHighlight: "#ffffff",
    visor: "#0b1410",
    visorGlow: "rgba(74,222,128,0.35)",
    eye: "#86efac",
    core: "#4ade80",
    coreGlow: "rgba(74,222,128,0.6)",
    sideLight: "#4ade80",
    blush: "rgba(74,222,128,0.25)",
  },
  robot_solar: {
    shell: "#fdf3d7",
    shellShadow: "#c9a24b",
    shellHighlight: "#ffffff",
    visor: "#171106",
    visorGlow: "rgba(251,191,36,0.4)",
    eye: "#fde68a",
    core: "#f59e0b",
    coreGlow: "rgba(251,191,36,0.65)",
    sideLight: "#f59e0b",
    blush: "rgba(251,191,36,0.3)",
  },
  robot_luna: {
    shell: "#c9b8f5",
    shellShadow: "#7c5cc9",
    shellHighlight: "#efe8ff",
    visor: "#120b24",
    visorGlow: "rgba(196,181,253,0.45)",
    eye: "#f5d0fe",
    core: "#e9a8f5",
    coreGlow: "rgba(232,121,249,0.65)",
    sideLight: "#c084fc",
    blush: "rgba(232,121,249,0.3)",
  },
  robot_orion: {
    shell: "#0c1626",
    shellShadow: "#020409",
    shellHighlight: "#1e3a52",
    visor: "#010409",
    visorGlow: "rgba(34,211,238,0.4)",
    eye: "#67e8f9",
    core: "#22d3ee",
    coreGlow: "rgba(34,211,238,0.7)",
    sideLight: "#22d3ee",
    blush: "rgba(34,211,238,0.25)",
  },
  robot_nova: {
    shell: "#e8f3e4",
    shellShadow: "#86a988",
    shellHighlight: "#ffffff",
    visor: "#0a140d",
    visorGlow: "rgba(134,239,172,0.4)",
    eye: "#bbf7d0",
    core: "#22c55e",
    coreGlow: "rgba(34,197,94,0.6)",
    sideLight: "#22c55e",
    blush: "rgba(34,197,94,0.28)",
  },
  robot_iris: {
    shell: "#1b1038",
    shellShadow: "#08041a",
    shellHighlight: "#4c1d95",
    visor: "#08041a",
    visorGlow: "rgba(139,92,246,0.55)",
    eye: "#d8b4fe",
    core: "#8b5cf6",
    coreGlow: "rgba(139,92,246,0.75)",
    sideLight: "#a78bfa",
    blush: "rgba(139,92,246,0.32)",
  },
  robot_cosmos: {
    shell: "#241b4d",
    shellShadow: "#0b0620",
    shellHighlight: "#6d5bd0",
    visor: "#060312",
    visorGlow: "rgba(129,140,248,0.55)",
    eye: "#a5b4fc",
    core: "#818cf8",
    coreGlow: "rgba(129,140,248,0.8)",
    sideLight: "#818cf8",
    blush: "rgba(129,140,248,0.32)",
  },
  robot_crystal: {
    shell: "#d9e6ff",
    shellShadow: "#8ea2d8",
    shellHighlight: "#ffffff",
    visor: "#0a1024",
    visorGlow: "rgba(147,197,253,0.5)",
    eye: "#bae6fd",
    core: "#7dd3fc",
    coreGlow: "rgba(125,211,252,0.7)",
    sideLight: "#38bdf8",
    blush: "rgba(125,211,252,0.3)",
  },
  robot_cyber: {
    shell: "#0d1a1a",
    shellShadow: "#020808",
    shellHighlight: "#164e4a",
    visor: "#010606",
    visorGlow: "rgba(45,212,191,0.5)",
    eye: "#5eead4",
    core: "#2dd4bf",
    coreGlow: "rgba(45,212,191,0.75)",
    sideLight: "#2dd4bf",
    blush: "rgba(45,212,191,0.28)",
  },
  robot_flame: {
    shell: "#2a1408",
    shellShadow: "#0d0602",
    shellHighlight: "#7c3a12",
    visor: "#0d0602",
    visorGlow: "rgba(251,146,60,0.55)",
    eye: "#fdba74",
    core: "#f97316",
    coreGlow: "rgba(249,115,22,0.8)",
    sideLight: "#fb923c",
    blush: "rgba(249,115,22,0.32)",
  },
  robot_hologram: {
    shell: "#bfe9ff",
    shellShadow: "#6ba9d8",
    shellHighlight: "#ffffff",
    visor: "#06202f",
    visorGlow: "rgba(56,189,248,0.55)",
    eye: "#7dd3fc",
    core: "#38bdf8",
    coreGlow: "rgba(56,189,248,0.75)",
    sideLight: "#38bdf8",
    blush: "rgba(56,189,248,0.3)",
  },
};

export const getRobotSkinPalette = (variant: AssistantCompanionKind): RobotSkinPalette => {
  switch (variant) {
    case "robot_minimal":
      return robotSkinPalettes.robot_minimal;
    case "robot_neon":
      return robotSkinPalettes.robot_neon;
    case "robot_nature":
      return robotSkinPalettes.robot_nature;
    case "robot_solar":
      return robotSkinPalettes.robot_solar;
    case "robot_luna":
      return robotSkinPalettes.robot_luna;
    case "robot_orion":
      return robotSkinPalettes.robot_orion;
    case "robot_nova":
      return robotSkinPalettes.robot_nova;
    case "robot_iris":
      return robotSkinPalettes.robot_iris;
    case "robot_cosmos":
      return robotSkinPalettes.robot_cosmos;
    case "robot_crystal":
      return robotSkinPalettes.robot_crystal;
    case "robot_cyber":
      return robotSkinPalettes.robot_cyber;
    case "robot_flame":
      return robotSkinPalettes.robot_flame;
    case "robot_hologram":
      return robotSkinPalettes.robot_hologram;
    case "robot":
    default:
      return robotSkinPalettes.robot;
  }
};


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
  robot_minimal: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.22), transparent 22%), linear-gradient(135deg, #111827 0%, #334155 58%, #64748b 100%)",
    detail: "#e2e8f0",
    shadow: "0 18px 36px rgba(15, 23, 42, 0.28)",
    muzzle: "rgba(226,232,240,0.16)",
    eye: "#e2e8f0",
  },
  robot_neon: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.3), transparent 22%), linear-gradient(135deg, #020617 0%, #0e7490 48%, #7c3aed 100%)",
    detail: "#22d3ee",
    shadow: "0 18px 40px rgba(34, 211, 238, 0.3)",
    muzzle: "rgba(34,211,238,0.18)",
    eye: "#67e8f9",
  },
  robot_nature: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.28), transparent 22%), linear-gradient(135deg, #064e3b 0%, #10b981 52%, #84cc16 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 38px rgba(16, 185, 129, 0.28)",
    muzzle: "rgba(220,252,231,0.18)",
    eye: "#dcfce7",
  },
  robot_solar: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #7c2d12 0%, #f59e0b 52%, #facc15 100%)",
    detail: "#fde68a",
    shadow: "0 18px 38px rgba(245, 158, 11, 0.28)",
    muzzle: "rgba(254,243,199,0.18)",
    eye: "#fef3c7",
  },
  robot_luna: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #4c1d95 0%, #a78bfa 55%, #f5d0fe 100%)",
    detail: "#e9d5ff",
    shadow: "0 18px 38px rgba(168, 85, 247, 0.3)",
    muzzle: "rgba(233,213,255,0.18)",
    eye: "#f5d0fe",
  },
  robot_orion: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.24), transparent 22%), linear-gradient(135deg, #020617 0%, #0c2a3a 55%, #155e75 100%)",
    detail: "#67e8f9",
    shadow: "0 18px 38px rgba(34, 211, 238, 0.3)",
    muzzle: "rgba(103,232,249,0.16)",
    eye: "#67e8f9",
  },
  robot_nova: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.32), transparent 22%), linear-gradient(135deg, #14532d 0%, #86efac 55%, #f0fdf4 100%)",
    detail: "#bbf7d0",
    shadow: "0 18px 38px rgba(34, 197, 94, 0.28)",
    muzzle: "rgba(187,247,208,0.18)",
    eye: "#dcfce7",
  },
  robot_iris: {
    face:
      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 20%), linear-gradient(135deg, #0f0524 0%, #4c1d95 55%, #7c3aed 100%)",
    detail: "#c4b5fd",
    shadow: "0 18px 42px rgba(124, 58, 237, 0.32)",
    muzzle: "rgba(196,181,253,0.18)",
    eye: "#ddd6fe",
  },
  robot_cosmos: {
    face:
      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 18%), linear-gradient(135deg, #0b0620 0%, #312e81 55%, #0e7490 100%)",
    detail: "#a5b4fc",
    shadow: "0 18px 42px rgba(99, 102, 241, 0.32)",
    muzzle: "rgba(165,180,252,0.18)",
    eye: "#c7d2fe",
  },
  robot_crystal: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.5), transparent 22%), linear-gradient(135deg, #e0f2fe 0%, #a5c4fc 50%, #c4b5fd 100%)",
    detail: "#bae6fd",
    shadow: "0 18px 38px rgba(125, 211, 252, 0.35)",
    muzzle: "rgba(186,230,253,0.2)",
    eye: "#e0f2fe",
  },
  robot_cyber: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.26), transparent 22%), linear-gradient(135deg, #020808 0%, #0f3a38 55%, #14b8a6 100%)",
    detail: "#5eead4",
    shadow: "0 18px 40px rgba(45, 212, 191, 0.32)",
    muzzle: "rgba(94,234,212,0.16)",
    eye: "#99f6e4",
  },
  robot_flame: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.3), transparent 22%), linear-gradient(135deg, #431407 0%, #c2410c 52%, #fbbf24 100%)",
    detail: "#fdba74",
    shadow: "0 18px 40px rgba(249, 115, 22, 0.35)",
    muzzle: "rgba(253,186,116,0.18)",
    eye: "#ffedd5",
  },
  robot_hologram: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.45), transparent 22%), linear-gradient(135deg, rgba(224,242,254,0.9) 0%, rgba(125,211,252,0.85) 55%, rgba(34,211,238,0.85) 100%)",
    detail: "#7dd3fc",
    shadow: "0 18px 40px rgba(56, 189, 248, 0.35)",
    muzzle: "rgba(125,211,252,0.2)",
    eye: "#e0f2fe",
  },
  shiba: {
    face:
      "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.3), transparent 22%), linear-gradient(135deg, #9a3412 0%, #ea580c 48%, #fdba74 100%)",
    detail: "#ffedd5",
    shadow: "0 18px 36px rgba(234, 88, 12, 0.24)",
    muzzle: "rgba(255,247,237,0.92)",
    eye: "#fff7ed",
  },
  baby_dragon: {
    face:
      "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.36), transparent 22%), linear-gradient(135deg, #065f46 0%, #34d399 45%, #a7f3d0 100%)",
    detail: "#fef3c7",
    shadow: "0 18px 36px rgba(52, 211, 153, 0.26)",
    muzzle: "rgba(209,250,229,0.8)",
    eye: "#ecfdf5",
  },
};

export const getCompanionFaceRadius = (variant: AssistantCompanionKind) => {
  if (isRobotCompanionKind(variant)) {
    return "28%";
  }

  switch (variant) {
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
  isRobotCompanionKind(variant) || variant === "human";
