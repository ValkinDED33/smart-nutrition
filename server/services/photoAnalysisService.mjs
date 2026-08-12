import sharp from "sharp";
import { StateApiError } from "../lib/domain.mjs";
import { createFallbackPhotoAnalysis } from "./photo/fallbackDraft.mjs";
import { tryAnalyzeWithVisionProvider } from "./photo/visionAnalysis.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const maxPhotoDataUrlLength = 1_700_000;
const maxPhotoDimension = 4_096;
const safePhotoDataUrlPattern = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;
const photoDataUrlPattern =
  /^data:image\/(?<mime>jpeg|jpg|png|webp);base64,(?<payload>[a-z0-9+/=]+)$/i;
const allowedImageFormats = new Set(["jpeg", "png", "webp"]);

const normalizeImageMimeFormat = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "jpg" ? "jpeg" : normalized;
};

const normalizeDietStyle = (value) => {
  if (
    value === "balanced" ||
    value === "vegetarian" ||
    value === "vegan" ||
    value === "pescatarian" ||
    value === "low_carb" ||
    value === "gluten_free"
  ) {
    return value;
  }

  return "balanced";
};

const normalizeMealType = (value) => {
  if (value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack") {
    return value;
  }

  return "meal";
};

const buildBlockedTokens = (profileState) => {
  if (!isRecord(profileState)) {
    return [];
  }

  return [...(Array.isArray(profileState.allergies) ? profileState.allergies : []), ...(Array.isArray(profileState.excludedIngredients) ? profileState.excludedIngredients : [])]
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
};

export const normalizePhotoPayload = async (imageDataUrl) => {
  const match = imageDataUrl.match(photoDataUrlPattern);
  const declaredFormat = normalizeImageMimeFormat(match?.groups?.mime);
  const payload = match?.groups?.payload;

  if (!payload) {
    throw new StateApiError(
      "INVALID_PHOTO_PAYLOAD",
      "Photo analysis requires a valid image data URL."
    );
  }

  try {
    const imageBuffer = Buffer.from(payload, "base64");
    const image = sharp(imageBuffer, { limitInputPixels: 18_000_000 }).rotate();
    const metadata = await image.metadata();
    const detectedFormat = normalizeImageMimeFormat(metadata.format);

    if (!metadata.width || !metadata.height) {
      throw new Error("IMAGE_METADATA_UNAVAILABLE");
    }

    if (!allowedImageFormats.has(detectedFormat) || detectedFormat !== declaredFormat) {
      throw new StateApiError(
        "INVALID_PHOTO_PAYLOAD",
        "Photo MIME type does not match the image payload."
      );
    }

    if (metadata.width > maxPhotoDimension || metadata.height > maxPhotoDimension) {
      throw new StateApiError(
        "INVALID_PHOTO_PAYLOAD",
        "Photo dimensions are too large for analysis."
      );
    }

    const normalizedBuffer = await image
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return {
      width: metadata.width,
      height: metadata.height,
      originalFormat: detectedFormat,
      normalizedFormat: "jpeg",
      normalizedBytes: normalizedBuffer.byteLength,
      base64: normalizedBuffer.toString("base64"),
    };
  } catch (error) {
    if (error instanceof StateApiError) {
      throw error;
    }

    throw new StateApiError(
      "INVALID_PHOTO_PAYLOAD",
      "Photo analysis requires a readable JPEG, PNG, or WebP image."
    );
  }
};

const toPublicPhotoMeta = (photoMeta) => ({
  width: photoMeta.width,
  height: photoMeta.height,
  originalFormat: photoMeta.originalFormat,
  normalizedFormat: photoMeta.normalizedFormat,
  normalizedBytes: photoMeta.normalizedBytes,
});

const normalizeLanguage = (value) =>
  ["uk", "pl", "en"].includes(value) ? value : "en";

export const createPhotoAnalysisService = ({ config = {} } = {}) => ({
  analyzePhoto: async (profileState, requestBody, context = {}) => {
    const imageDataUrl =
      typeof requestBody?.imageDataUrl === "string" ? requestBody.imageDataUrl.trim() : "";
    const mealType = normalizeMealType(requestBody?.mealType);

    if (
      imageDataUrl.length > maxPhotoDataUrlLength ||
      !safePhotoDataUrlPattern.test(imageDataUrl)
    ) {
      throw new StateApiError(
        "INVALID_PHOTO_PAYLOAD",
        "Photo analysis requires a JPEG, PNG, or WebP image data URL under 1.7 MB."
      );
    }

    const photoMeta = await normalizePhotoPayload(imageDataUrl);

    const dietStyle = normalizeDietStyle(profileState?.dietStyle);
    const language = normalizeLanguage(requestBody?.language);
    const blockedTokens = buildBlockedTokens(profileState);
    const visionAnalysis = await tryAnalyzeWithVisionProvider({
      config,
      normalizedPhoto: photoMeta,
      mealType,
      dietStyle,
      blockedTokens,
      language,
    });

    if (visionAnalysis) {
      return {
        ...visionAnalysis,
        image: toPublicPhotoMeta(photoMeta),
      };
    }

    return createFallbackPhotoAnalysis({
      mealType,
      dietStyle,
      blockedTokens,
      mealState: context?.mealState,
      image: toPublicPhotoMeta(photoMeta),
      language,
    });
  },
});
