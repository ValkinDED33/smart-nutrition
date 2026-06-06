export interface AvatarPreset {
  id: string;
  label: string;
  url: string;
}

interface AvatarPresetDefinition {
  id: string;
  label: string;
  start: string;
  end: string;
  accent: string;
  symbol: string;
}

const presetDefinitions: AvatarPresetDefinition[] = [
  {
    id: "forest",
    label: "Forest",
    start: "#0f766e",
    end: "#65a30d",
    accent: "#ecfccb",
    symbol: "F",
  },
  {
    id: "sunrise",
    label: "Sunrise",
    start: "#ea580c",
    end: "#f59e0b",
    accent: "#ffedd5",
    symbol: "S",
  },
  {
    id: "ocean",
    label: "Ocean",
    start: "#0369a1",
    end: "#38bdf8",
    accent: "#e0f2fe",
    symbol: "O",
  },
  {
    id: "berry",
    label: "Berry",
    start: "#be185d",
    end: "#8b5cf6",
    accent: "#fce7f3",
    symbol: "B",
  },
  {
    id: "stone",
    label: "Stone",
    start: "#334155",
    end: "#64748b",
    accent: "#e2e8f0",
    symbol: "T",
  },
  {
    id: "mint",
    label: "Mint",
    start: "#059669",
    end: "#2dd4bf",
    accent: "#d1fae5",
    symbol: "M",
  },
];

const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createPresetAvatar = ({
  start,
  end,
  accent,
  symbol,
}: AvatarPresetDefinition) =>
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="34" fill="url(#bg)" />
      <circle cx="60" cy="44" r="22" fill="${accent}" opacity="0.94" />
      <path d="M30 99c6-20 21-30 30-30s24 10 30 30" fill="${accent}" opacity="0.94" />
      <text x="60" y="52" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="${start}">
        ${symbol}
      </text>
    </svg>
  `);

export const avatarPresets: AvatarPreset[] = presetDefinitions.map((preset) => ({
  id: preset.id,
  label: preset.label,
  url: createPresetAvatar(preset),
}));

const hashSeed = (seed: string) =>
  Array.from(seed).reduce((hash, char) => {
    const next = (hash << 5) - hash + char.charCodeAt(0);
    return next | 0;
  }, 0);

export const getDefaultAvatar = (seed: string) => {
  const fallback = avatarPresets[0]?.url ?? "";

  if (!seed.trim()) {
    return fallback;
  }

  const index = Math.abs(hashSeed(seed)) % avatarPresets.length;
  return avatarPresets[index]?.url ?? fallback;
};

const loadImageFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be loaded."));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image could not be processed."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image could not be converted."));
    };

    reader.onerror = () => reject(new Error("Image could not be converted."));
    reader.readAsDataURL(blob);
  });

export const resizeAvatarFile = async (
  file: File,
  options?: {
    maxSide?: number;
    maxBytes?: number;
  }
) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type.");
  }

  const image = await loadImageFile(file);
  const maxBytes = options?.maxBytes ?? 320 * 1024;
  let maxSide = Math.min(options?.maxSide ?? 640, Math.max(image.width, image.height));
  let quality = 0.88;
  let lastDataUrl = "";

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, quality);
    lastDataUrl = await blobToDataUrl(blob);

    if (blob.size <= maxBytes || maxSide <= 220) {
      return lastDataUrl;
    }

    maxSide = Math.max(220, Math.round(maxSide * 0.82));
    quality = Math.max(0.62, quality - 0.06);
  }

  return lastDataUrl;
};
