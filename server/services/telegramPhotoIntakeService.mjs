import { StateApiError } from "../lib/domain.mjs";
import { normalizePhotoPayload } from "./photoAnalysisService.mjs";
import { tryAnalyzeVisionJson } from "./photo/visionAnalysis.mjs";

const maxPhotoDataUrlLength = 1_700_000;
const safePhotoDataUrlPattern = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;
const intakeKinds = new Set([
  "food",
  "blood_pressure",
  "medication",
  "prescription",
  "health_document",
  "unknown",
]);

const normalizeLanguage = (value) => (["uk", "pl", "en"].includes(value) ? value : "en");

const normalizeText = (value, fallback = "", maxLength = 240) => {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, maxLength);
};

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);

const normalizeKind = (value) => {
  const kind = String(value ?? "").trim();
  return intakeKinds.has(kind) ? kind : "unknown";
};

const normalizeConfidence = (value) => clamp(value, 0.05, 0.92);

const toStringList = (value, fallback = []) => {
  const items = Array.isArray(value) ? value : fallback;
  return items.map((item) => normalizeText(item, "", 180)).filter(Boolean).slice(0, 6);
};

const toNumberOrNull = (value, { min, max } = {}) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (Number.isFinite(min) && number < min) {
    return null;
  }

  if (Number.isFinite(max) && number > max) {
    return null;
  }

  return Math.round(number);
};

const normalizeMedicationItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      name: normalizeText(item?.name, `Medication ${index + 1}`, 100),
      doseText: normalizeText(item?.doseText, "", 80),
      scheduleText: normalizeText(item?.scheduleText, "", 140),
      routeText: normalizeText(item?.routeText, "", 80),
      confidence: normalizeConfidence(item?.confidence),
    }))
    .slice(0, 8);

export const buildTelegramPhotoIntakePrompt = ({ language = "en", caption = "" } = {}) => `
You are Smart Nutrition Telegram photo intake. Return ONLY valid JSON.

Purpose:
- Classify a user-sent Telegram photo into one of:
  food, blood_pressure, medication, prescription, health_document, unknown.
- Extract useful visible information without pretending it is saved.
- Use ${language} for user-facing labels, summary, cautions, and questions.

Critical safety rules:
- Do not diagnose, prescribe, change medication, or claim medical certainty.
- Blood pressure photos: extract systolic, diastolic, pulse, unit, and visible timestamp only when clearly visible. If not clear, leave null and ask for a clearer photo.
- Medication/prescription photos: extract visible medicine names, dose text, schedule text, and questions. Never infer dosage that is not visible.
- Food photos can be classified as food, but do not estimate ingredients here; food is handled by the canonical photo meal analyzer.
- If blurry, cropped, too dark, or not readable, set imageQuality to "unclear", confidence below 0.35, and ask for a better photo.
- The answer is a review draft. Backend-confirmed save must happen through Smart Nutrition tools/contracts after user confirmation.

Context caption:
${normalizeText(caption, "none", 500)}

JSON schema:
{
  "kind": "blood_pressure",
  "title": "Blood pressure reading",
  "summary": "I can read the visible measurement, but please confirm before saving.",
  "imageQuality": "clear",
  "confidence": 0.74,
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "unit": "mmHg",
    "measuredAtText": "today 21:00"
  },
  "medications": [
    {
      "name": "Vitamin D",
      "doseText": "2000 IU",
      "scheduleText": "after breakfast",
      "routeText": "oral",
      "confidence": 0.72
    }
  ],
  "visibleText": ["short OCR snippets"],
  "questions": ["Please confirm the time of measurement."],
  "cautions": ["This is not a diagnosis."]
}
`;

export const normalizeTelegramPhotoIntakeAnalysis = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const kind = normalizeKind(payload.kind);
  const confidence = normalizeConfidence(payload.confidence);
  const bloodPressure = payload.bloodPressure && typeof payload.bloodPressure === "object"
    ? {
        systolic: toNumberOrNull(payload.bloodPressure.systolic, { min: 40, max: 260 }),
        diastolic: toNumberOrNull(payload.bloodPressure.diastolic, { min: 30, max: 180 }),
        pulse: toNumberOrNull(payload.bloodPressure.pulse, { min: 25, max: 240 }),
        unit: normalizeText(payload.bloodPressure.unit, "mmHg", 20),
        measuredAtText: normalizeText(payload.bloodPressure.measuredAtText, "", 80),
      }
    : {
        systolic: null,
        diastolic: null,
        pulse: null,
        unit: "mmHg",
        measuredAtText: "",
      };

  return {
    kind,
    title: normalizeText(payload.title, "Photo received", 100),
    summary: normalizeText(
      payload.summary,
      "I prepared a review draft from the photo. Please confirm before saving.",
      260
    ),
    imageQuality: payload.imageQuality === "unclear" ? "unclear" : "clear",
    confidence,
    bloodPressure,
    medications: normalizeMedicationItems(payload.medications),
    visibleText: toStringList(payload.visibleText),
    questions: toStringList(payload.questions, [
      "Please confirm whether this should be saved in Smart Nutrition.",
    ]),
    cautions: toStringList(payload.cautions, [
      "Review draft only. I did not save anything without confirmation.",
    ]),
    manualReviewRequired: true,
  };
};

export const createTelegramPhotoIntakeService = ({
  config = {},
  photoAnalysisService = null,
} = {}) => ({
  analyzePhoto: async (profileState, requestBody = {}, context = {}) => {
    const imageDataUrl =
      typeof requestBody.imageDataUrl === "string" ? requestBody.imageDataUrl.trim() : "";

    if (
      imageDataUrl.length > maxPhotoDataUrlLength ||
      !safePhotoDataUrlPattern.test(imageDataUrl)
    ) {
      throw new StateApiError(
        "INVALID_PHOTO_PAYLOAD",
        "Telegram photo intake requires a JPEG, PNG, or WebP image data URL under 1.7 MB."
      );
    }

    const normalizedPhoto = await normalizePhotoPayload(imageDataUrl);
    const language = normalizeLanguage(requestBody.language);
    const caption = normalizeText(requestBody.caption, "", 500);
    const genericAnalysis = await tryAnalyzeVisionJson({
      config,
      normalizedPhoto,
      maxOutputTokens: 1_400,
      systemPrompt:
        "You return strict JSON for Smart Nutrition Telegram photo intake. Never claim saved actions. Medical content is review-only.",
      prompt: buildTelegramPhotoIntakePrompt({ language, caption }),
      normalizePayload: normalizeTelegramPhotoIntakeAnalysis,
    });

    if (genericAnalysis?.kind === "food" && photoAnalysisService?.analyzePhoto) {
      const foodAnalysis = await photoAnalysisService.analyzePhoto(
        profileState,
        {
          imageDataUrl,
          mealType: context?.mealType ?? "meal",
          language,
        },
        { mealState: context?.mealState }
      );

      return {
        kind: "food",
        food: foodAnalysis,
        classifier: genericAnalysis,
      };
    }

    return genericAnalysis ?? {
      kind: "unknown",
      title: "Photo received",
      summary:
        "I could not read this photo safely. Please send a clearer photo or add a short caption.",
      imageQuality: "unclear",
      confidence: 0.1,
      bloodPressure: {
        systolic: null,
        diastolic: null,
        pulse: null,
        unit: "mmHg",
        measuredAtText: "",
      },
      medications: [],
      visibleText: [],
      questions: ["What should I read from this photo: food, blood pressure, or medication?"],
      cautions: ["I did not save anything without confirmation."],
      manualReviewRequired: true,
    };
  },
});
