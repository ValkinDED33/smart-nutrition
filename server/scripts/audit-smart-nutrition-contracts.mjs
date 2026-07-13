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
const registerPageSource = readSource("src/pages/RegisterPage.tsx");
const verifyEmailPageSource = readSource("src/pages/VerifyEmailPage.tsx");
const resetPasswordPageSource = readSource("src/pages/ResetPasswordPage.tsx");
const authCookiesSource = readSource("server/runtime/authCookies.mjs");
const authRoutesSource = readSource("server/routes/auth.routes.mjs");
const profileCloudActionSource = readSource("src/features/profile/useProfileCloudAction.ts");
const barcodeScannerSource = readSource("src/features/meal/BarcodeScanner.tsx");
const productNutritionFactsSource = readSource("src/features/meal/ProductNutritionFacts.tsx");
const productLookupServiceSource = readSource("server/services/productLookupService.mjs");

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

addCheck(
  "auth session responses keep tokens in httpOnly cookies only",
  authCookiesSource.includes("applyAuthCookies(response, payload)") &&
    authCookiesSource.includes("sendJson(response, statusCode, {") &&
    authCookiesSource.includes("user: payload.user") &&
    authCookiesSource.includes("snapshot: payload.snapshot ?? null") &&
    !/sendJson\(response,\s*statusCode,\s*\{[\s\S]*(token|refreshToken):\s*payload\./.test(
      authCookiesSource
    ),
  "Auth session JSON must not expose access or refresh tokens; cookies are the session transport."
);

addCheck(
  "registration keeps guided steps and backend availability gates",
  ["\"language\"", "\"theme\"", "\"name\"", "\"email\"", "\"password\"", "\"confirm\""].every(
    (step) => registerPageSource.includes(step)
  ) &&
    registerPageSource.includes("checkRegistrationAvailability") &&
    registerPageSource.includes("availabilityBlocksNext") &&
    registerPageSource.includes("disabled={availabilityBlocksNext}"),
  "Registration must stay a guided language/theme/account flow and block taken/unchecked name or email values."
);

addCheck(
  "email verification consumes token safely and routes incomplete profiles to onboarding choice",
  verifyEmailPageSource.includes("clearSensitiveSearchParamsFromCurrentUrl([\"token\"]") &&
    verifyEmailPageSource.includes("verifyRegistration({ token })") &&
    verifyEmailPageSource.includes("hasCompletedOnboardingSnapshot(snapshot)") &&
    verifyEmailPageSource.includes("\"/onboarding/choice\""),
  "Email verification must remove token query data and continue to explicit onboarding choice when profile setup is incomplete."
);

addCheck(
  "password reset consumes token safely and never submits without it",
  resetPasswordPageSource.includes("clearSensitiveSearchParamsFromCurrentUrl([\"token\"]") &&
    resetPasswordPageSource.includes("if (!token)") &&
    resetPasswordPageSource.includes("resetPassword(token, data.password)") &&
    resetPasswordPageSource.includes("disabled={!token || submitting || Boolean(successMessage)}"),
  "Password reset must capture then remove token query data and keep submit disabled without a token."
);

addCheck(
  "auth routes keep availability public and profile mutations protected",
  authRoutesSource.includes("[\"POST\", \"/api/auth/availability\", \"checkRegistrationAvailability\"]") &&
    authRoutesSource.includes("[\"PATCH\", \"/api/auth/profile\", \"updateProfile\"]") &&
    authRoutesSource.includes("[\"PATCH\", \"/api/auth/profile-state\", \"updateProfileAndState\"]"),
  "Registration availability must remain public while profile mutations stay on protected auth routes."
);

addCheck(
  "profile settings use one shared cloud-confirmed action path",
  profileCloudActionSource.includes("saveProfileStateToCloud") &&
    profileCloudActionSource.includes("saveProfileAndUserToCloud") &&
    profileCloudActionSource.includes("replaceProfileState") &&
    profileCloudActionSource.includes("setUser") &&
    profileCloudActionSource.includes("throw caughtError"),
  "Profile settings must use the shared cloud action path and throw on failed persistence instead of fake success."
);

addCheck(
  "barcode scanner shows the confirmed product result before secondary panels",
  barcodeScannerSource.includes('data-scanner-found-product="primary-result"') &&
    barcodeScannerSource.includes('data-scanner-result-alert="confirmed"') &&
    barcodeScannerSource.indexOf('data-scanner-found-product="primary-result"') <
      barcodeScannerSource.indexOf("{copy.scanHistory}") &&
    barcodeScannerSource.indexOf('data-scanner-found-product="primary-result"') <
      barcodeScannerSource.indexOf("copy.manualTitle"),
  "After scan, the product result must be visible above history/fallback/manual panels so users know what was scanned."
);

addCheck(
  "barcode scanner stops camera after a product is resolved",
  /setFoundProduct\(product\);[\s\S]*?stopScanner\(\);/.test(barcodeScannerSource) &&
    barcodeScannerSource.includes("scannedCodeReady") &&
    barcodeScannerSource.includes("scannerRuntimeState"),
  "Scanner camera must stop and show a stable result state after product resolution instead of leaving users in an endless camera state."
);

addCheck(
  "barcode scanner adds food only through canonical backend intake",
  barcodeScannerSource.includes("addProductIntakeToCloud(dispatch") &&
    barcodeScannerSource.includes('source: "barcode"') &&
    barcodeScannerSource.includes("intakeResult.outcomes?.mealAdded") &&
    barcodeScannerSource.includes("Backend did not confirm the meal entry."),
  "Barcode scan add must be backend-confirmed through canonical product intake before showing success."
);

addCheck(
  "product facts table includes vitamins minerals iodine and additive safety",
  productNutritionFactsSource.includes("micronutrientTableKeys") &&
    productNutritionFactsSource.includes('"iodine"') &&
    productNutritionFactsSource.includes("analyzeProductAdditives") &&
    productNutritionFactsSource.includes("getAdditiveRiskColor") &&
    productNutritionFactsSource.includes("additiveDose") &&
    productNutritionFactsSource.includes("additiveCompositionMissing"),
  "Product details must expose micronutrients, iodine, additive risk, dose guidance, and a clear missing-composition state."
);

addCheck(
  "backend product lookup imports label micronutrients and additive text",
  productLookupServiceSource.includes("additives_tags") &&
    productLookupServiceSource.includes("additives_original_tags") &&
    productLookupServiceSource.includes("readOpenFoodFactsAdditivesText") &&
    productLookupServiceSource.includes("readFirstMicronutrientPerBase(nutriments, [\"iodine\", \"iodide\", \"iodides\"]") &&
    productLookupServiceSource.includes("vitamin-b12"),
  "Backend product lookup must preserve additive and micronutrient facts from provider data before the frontend renders product facts."
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
