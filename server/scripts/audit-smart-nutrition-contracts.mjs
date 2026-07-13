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
const frontendProductApiSource = readSource("src/shared/api/products.ts");
const mealCloudSyncSource = readSource("src/features/meal/mealCloudSync.ts");
const authRepositorySource = readSource("server/repositories/authRepository.mjs");
const telegramServiceSource = readSource("server/services/telegramService.mjs");

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

addCheck(
  "frontend product lookup stays behind Smart Nutrition backend",
  !/https?:\/\/[^"']*(openfoodfacts|nal\.usda)|world\.openfoodfacts|api\.nal\.usda/i.test(frontendProductApiSource) &&
    frontendProductApiSource.includes("requireProductBackendBaseUrl") &&
    frontendProductApiSource.includes("getRemoteAuthBaseUrl"),
  "Frontend product lookup must call the Smart Nutrition backend, not external catalog providers directly."
);

addCheck(
  "granular meal cloud mutations require canonical backend meal state",
  mealCloudSyncSource.includes("MISSING_CANONICAL_MEAL_ERROR") &&
    mealCloudSyncSource.includes("requireConfirmedMealState") &&
    /const\s+requireConfirmedMealState[\s\S]*?if\s*\(!result\.meal\)[\s\S]*?throw new Error\(MISSING_CANONICAL_MEAL_ERROR\)/.test(
      mealCloudSyncSource
    ),
  "Granular meal mutations must reject backend ok responses that do not return canonical meal state."
);

addCheck(
  "legacy reminder repository path delegates to canonical reminders",
  /updateUserMedicationReminders:\s*\(userId,\s*reminders\)\s*=>\s*[\s\S]*storage\.updateUserReminders\?\.\(userId,\s*reminders\)/.test(
    authRepositorySource
  ),
  "Legacy medication reminder repository method must delegate to canonical updateUserReminders before legacy compatibility."
);

addCheck(
  "telegram free text routes through the canonical AI runtime",
  telegramServiceSource.includes("aiService.askQuestion(user") &&
    telegramServiceSource.includes("interactionChannel: \"telegram\""),
  "Telegram conversational text must use the same backend AI assistant runtime as the website."
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
