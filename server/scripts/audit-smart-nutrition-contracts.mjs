import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const readSource = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");

const checks = [];

const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const photoAssistantSource = readSource("src/features/meal/PhotoMealAssistant.tsx");
const authRemoteSource = readSource("src/shared/api/authRemote.ts");
const visionAnalysisSource = readSource("server/services/photo/visionAnalysis.mjs");

addCheck(
  "photo assistant does not hard-code template recognition foods",
  !/\b(Greek yogurt|Oats|Banana|Breakfast photo draft)\b/.test(photoAssistantSource),
  "PhotoMealAssistant must render provider/user-reviewed results, not a fixed breakfast template."
);

addCheck(
  "photo assistant sends profile language to backend analysis",
  /analyzeMealPhoto\(dataUrl,\s*mealType,\s*appLanguage\)/.test(photoAssistantSource),
  "PhotoMealAssistant must pass appLanguage so recognition output follows the user's profile language."
);

addCheck(
  "photo analysis request body includes language",
  /body:\s*JSON\.stringify\(\{\s*imageDataUrl,\s*mealType,\s*language,/s.test(authRemoteSource),
  "authRemote photo-analysis request must include language in the backend contract."
);

addCheck(
  "vision prompt prioritizes recognition before manual fallback",
  visionAnalysisSource.includes("recognition first") &&
    visionAnalysisSource.includes("return an editable draft with the visible ingredients"),
  "Vision prompt must ask providers to recognize visible food first, with manual editing as correction."
);

addCheck(
  "vision normalization rejects generic breakfast hallucinations",
  visionAnalysisSource.includes("looksLikeTemplateBreakfastDraft") &&
    visionAnalysisSource.includes("Never return a generic template breakfast"),
  "Vision normalization must reject low-confidence generic breakfast templates."
);

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Smart Nutrition contract audit failed:");
  for (const check of failed) {
    console.error(`FAIL ${check.label}`);
    console.error(`     ${check.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Smart Nutrition contract audit passed: ${checks.length} checks.`);
}
