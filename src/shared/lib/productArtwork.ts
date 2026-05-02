import type { Product } from "../types/product";

type ArtworkKind =
  | "bowl"
  | "cup"
  | "cheese"
  | "milk"
  | "egg"
  | "meat"
  | "fish"
  | "grain"
  | "bread"
  | "vegetable"
  | "fruit"
  | "nuts"
  | "bottle"
  | "cube"
  | "bar";

interface Palette {
  top: string;
  bottom: string;
  accent: string;
  accentSoft: string;
  ink: string;
}

const palettes: Record<string, Palette> = {
  grain: {
    top: "#fde68a",
    bottom: "#f59e0b",
    accent: "#92400e",
    accentSoft: "#fff7d6",
    ink: "#3f2b1c",
  },
  dairy: {
    top: "#bfdbfe",
    bottom: "#60a5fa",
    accent: "#1d4ed8",
    accentSoft: "#eff6ff",
    ink: "#14213d",
  },
  protein: {
    top: "#fdba74",
    bottom: "#f97316",
    accent: "#9a3412",
    accentSoft: "#fff1e8",
    ink: "#4a2412",
  },
  vegetable: {
    top: "#86efac",
    bottom: "#22c55e",
    accent: "#15803d",
    accentSoft: "#ecfdf5",
    ink: "#163520",
  },
  fruit: {
    top: "#f9a8d4",
    bottom: "#ec4899",
    accent: "#be185d",
    accentSoft: "#fdf2f8",
    ink: "#4a1631",
  },
  nuts: {
    top: "#d6b38b",
    bottom: "#b45309",
    accent: "#7c2d12",
    accentSoft: "#fff7ed",
    ink: "#41210e",
  },
  oil: {
    top: "#fef08a",
    bottom: "#eab308",
    accent: "#a16207",
    accentSoft: "#fefce8",
    ink: "#41330e",
  },
  legume: {
    top: "#c4b5fd",
    bottom: "#8b5cf6",
    accent: "#6d28d9",
    accentSoft: "#f5f3ff",
    ink: "#291447",
  },
  default: {
    top: "#cbd5e1",
    bottom: "#64748b",
    accent: "#334155",
    accentSoft: "#f8fafc",
    ink: "#1e293b",
  },
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const pickPalette = (product: Product) => {
  const group = product.facts?.foodGroup;
  return palettes[group ?? "default"] ?? palettes.default!;
};

const pickArtworkKind = (product: Product): ArtworkKind => {
  const name = product.name.toLowerCase();
  const group = product.facts?.foodGroup;

  if (name.includes("cheese") || name.includes("mozzarella")) return "cheese";
  if (name.includes("milk") || name.includes("kefir")) return "milk";
  if (name.includes("yogurt") || name.includes("skyr") || name.includes("hummus"))
    return "cup";
  if (name.includes("egg")) return "egg";
  if (name.includes("salmon") || name.includes("tuna")) return "fish";
  if (
    name.includes("chicken") ||
    name.includes("turkey") ||
    name.includes("beef")
  )
    return "meat";
  if (name.includes("bread")) return "bread";
  if (name.includes("oil")) return "bottle";
  if (name.includes("tofu")) return "cube";
  if (name.includes("bar")) return "bar";
  if (name.includes("oats")) return "bowl";
  if (name.includes("rice") || name.includes("buckwheat") || name.includes("pasta"))
    return "grain";
  if (name.includes("almond") || name.includes("butter")) return "nuts";
  if (
    name.includes("banana") ||
    name.includes("apple") ||
    name.includes("blueberries") ||
    name.includes("avocado")
  )
    return "fruit";
  if (
    name.includes("tomato") ||
    name.includes("cucumber") ||
    name.includes("pepper") ||
    name.includes("potato")
  )
    return "vegetable";

  if (group === "grain") return "grain";
  if (group === "dairy") return "cup";
  if (group === "protein") return "meat";
  if (group === "vegetable") return "vegetable";
  if (group === "fruit") return "fruit";
  if (group === "nuts") return "nuts";
  if (group === "oil") return "bottle";
  if (group === "legume") return "cube";

  return "bowl";
};

const renderArtwork = (kind: ArtworkKind, palette: Palette) => {
  switch (kind) {
    case "bowl":
      return `
        <ellipse cx="90" cy="104" rx="40" ry="16" fill="${palette.accentSoft}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M50 102 C55 132, 125 132, 130 102" fill="${palette.accent}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="74" cy="92" r="9" fill="${palette.top}"/>
        <circle cx="90" cy="88" r="10" fill="${palette.bottom}"/>
        <circle cx="106" cy="93" r="8" fill="${palette.accentSoft}"/>
      `;
    case "cup":
      return `
        <path d="M58 46 H122 L114 118 C112 128 68 128 66 118 Z" fill="${palette.accentSoft}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M64 46 H116" stroke="${palette.ink}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="90" cy="78" r="18" fill="${palette.top}" opacity="0.8"/>
      `;
    case "cheese":
      return `
        <path d="M50 112 L120 112 L138 76 L72 62 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="82" cy="92" r="7" fill="${palette.bottom}"/>
        <circle cx="104" cy="100" r="5" fill="${palette.bottom}"/>
        <circle cx="111" cy="79" r="6" fill="${palette.bottom}"/>
      `;
    case "milk":
      return `
        <path d="M74 38 H106 L114 56 V120 H66 V56 Z" fill="${palette.accentSoft}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M74 38 L82 24 H98 L106 38" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M80 70 C88 64, 98 64, 106 70" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
      `;
    case "egg":
      return `
        <ellipse cx="90" cy="82" rx="28" ry="36" fill="${palette.accentSoft}" stroke="${palette.ink}" stroke-width="4"/>
        <circle cx="90" cy="84" r="11" fill="${palette.bottom}"/>
      `;
    case "meat":
      return `
        <path d="M58 102 C44 84, 50 56, 78 48 C110 38, 136 56, 130 86 C126 108, 94 122, 74 118 C66 116, 62 110, 58 102 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4"/>
        <ellipse cx="96" cy="80" rx="20" ry="14" fill="${palette.accentSoft}" opacity="0.9"/>
      `;
    case "fish":
      return `
        <path d="M52 84 C64 60, 98 56, 118 72 L138 60 V108 L118 96 C98 112, 64 108, 52 84 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="78" cy="78" r="4" fill="${palette.ink}"/>
      `;
    case "grain":
      return `
        <path d="M74 120 C74 96, 74 70, 74 48" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <path d="M90 120 C90 96, 90 70, 90 40" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <path d="M106 120 C106 96, 106 70, 106 48" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="66" cy="68" rx="10" ry="6" fill="${palette.top}" transform="rotate(-28 66 68)"/>
        <ellipse cx="98" cy="60" rx="10" ry="6" fill="${palette.top}" transform="rotate(28 98 60)"/>
        <ellipse cx="114" cy="76" rx="10" ry="6" fill="${palette.bottom}" transform="rotate(28 114 76)"/>
      `;
    case "bread":
      return `
        <path d="M52 116 V76 C52 56, 68 42, 88 42 C98 42, 108 46, 114 54 C120 46, 130 42, 140 42 C160 42, 176 56, 176 76 V116 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
      `;
    case "vegetable":
      return `
        <circle cx="90" cy="84" r="30" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M90 46 C96 34, 108 30, 120 34" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <path d="M90 54 C82 42, 70 38, 58 42" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="90" cy="48" rx="11" ry="8" fill="${palette.accent}"/>
      `;
    case "fruit":
      return `
        <circle cx="86" cy="86" r="28" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4"/>
        <circle cx="110" cy="82" r="22" fill="${palette.bottom}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M92 58 C96 42, 108 34, 122 36" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="122" cy="42" rx="12" ry="7" fill="${palette.accent}"/>
      `;
    case "nuts":
      return `
        <path d="M76 110 C64 102, 62 84, 74 72 C86 60, 102 62, 110 74 C118 86, 116 102, 104 110 C96 116, 84 116, 76 110 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M114 100 C104 94, 102 80, 110 72 C118 64, 130 66, 136 74 C142 82, 140 94, 132 100 C126 104, 120 104, 114 100 Z" fill="${palette.bottom}" stroke="${palette.ink}" stroke-width="4"/>
      `;
    case "bottle":
      return `
        <path d="M78 34 H102 V46 L110 56 V120 H70 V56 L78 46 Z" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4" stroke-linejoin="round"/>
        <ellipse cx="90" cy="82" rx="18" ry="22" fill="${palette.bottom}" opacity="0.9"/>
      `;
    case "cube":
      return `
        <rect x="56" y="54" width="68" height="68" rx="12" fill="${palette.accentSoft}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M56 76 H124" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M78 54 V122" stroke="${palette.ink}" stroke-width="4"/>
      `;
    case "bar":
      return `
        <rect x="46" y="60" width="88" height="48" rx="16" fill="${palette.top}" stroke="${palette.ink}" stroke-width="4"/>
        <path d="M58 72 H122" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
        <path d="M58 96 H104" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>
      `;
    default:
      return "";
  }
};

export const getProductArtwork = (product: Product) => {
  if (product.imageUrl?.trim()) {
    return product.imageUrl.trim();
  }

  const palette = pickPalette(product);
  const kind = pickArtworkKind(product);
  const label = escapeXml(product.name.slice(0, 22));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 180 140" fill="none">
      <defs>
        <linearGradient id="bg" x1="18" y1="10" x2="156" y2="128" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.top}"/>
          <stop offset="1" stop-color="${palette.bottom}"/>
        </linearGradient>
      </defs>
      <rect width="180" height="140" rx="28" fill="url(#bg)"/>
      <circle cx="148" cy="28" r="24" fill="rgba(255,255,255,0.28)"/>
      <circle cx="28" cy="112" r="18" fill="rgba(255,255,255,0.22)"/>
      <rect x="18" y="14" width="144" height="112" rx="24" fill="rgba(255,255,255,0.18)"/>
      ${renderArtwork(kind, palette)}
      <rect x="18" y="108" width="144" height="18" rx="9" fill="rgba(255,255,255,0.72)"/>
      <text x="90" y="121" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${palette.ink}">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
