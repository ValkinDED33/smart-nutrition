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
const photoDraftSource = readSource("src/features/meal/photo/photoDraft.ts");
const photoUxSource = readSource("src/features/meal/photo/photoMealAssistantUx.ts");
const fallbackPhotoDraftSource = readSource("server/services/photo/fallbackDraft.mjs");
const assistantAgentServiceSource = readSource("server/agent/agent.service.mjs");
const assistantAgentActionsSource = readSource("server/agent/agent.actions.mjs");
const appLayoutSource = readSource("src/app/layouts/AppLayout.tsx");
const mealBuilderPageSource = readSource("src/pages/MealBuilderPage.tsx");
const registerServiceWorkerSource = readSource("src/shared/lib/registerServiceWorker.ts");
const errorRecoverySource = readSource("src/shared/lib/errorRecovery.ts");
const clientErrorReportingSource = readSource("src/app/runtime/clientErrorReporting.ts");
const serviceWorkerSource = readSource("public/sw.js");
const companionAvatarSource = readSource("src/features/assistant-3d/components/CompanionAvatar.tsx");
const companionAvatarModelSource = readSource("src/features/assistant-3d/components/companionAvatarModel.ts");
const bundleAuditSource = readSource("server/scripts/audit-vite-bundle.mjs");
const gitignoreSource = readSource(".gitignore");
const projectMemorySource = readSource(".codex/PROJECT_MEMORY.md");
const projectDecisionsSource = readSource(".codex/DECISIONS.md");
const projectRulesSource = readSource(".codex/PROJECT_RULES.md");
const chiefSkillSource = readSource(".codex/skills/smart-nutrition-chief/SKILL.md");
const specialistSkillPaths = [
  ".codex/skills/ai-architect/SKILL.md",
  ".codex/skills/knowledge-curator/SKILL.md",
  ".codex/skills/mobile-guardian/SKILL.md",
  ".codex/skills/nutrition-engineer/SKILL.md",
  ".codex/skills/production-auditor/SKILL.md",
  ".codex/skills/production-fixer/SKILL.md",
  ".codex/skills/release-guardian/SKILL.md",
  ".codex/skills/smart-nutrition-brain/SKILL.md",
  ".codex/skills/smart-nutrition-chief/SKILL.md",
];
const specialistSkillSources = specialistSkillPaths.map((skillPath) => ({
  path: skillPath,
  source: readSource(skillPath),
}));

addCheck(
  "photo assistant does not hard-code template recognition foods",
  !/\b(Greek yogurt|Oats|Banana|Breakfast photo draft)\b/.test(photoAssistantSource),
  "PhotoMealAssistant must render provider/user-reviewed results, not a fixed breakfast template."
);

addCheck(
  "project knowledge layer is committed while codex runtime artifacts stay ignored",
  gitignoreSource.includes(".codex/") &&
    gitignoreSource.includes("!.codex/PROJECT_MEMORY.md") &&
    gitignoreSource.includes("!.codex/DECISIONS.md") &&
    gitignoreSource.includes("!.codex/PROJECT_RULES.md") &&
    gitignoreSource.includes("!.codex/skills/*/SKILL.md") &&
    gitignoreSource.includes(".codex/skills/*/*") &&
    projectMemorySource.includes("## Project Vision") &&
    projectMemorySource.includes("## Active Contracts") &&
    projectDecisionsSource.includes("Backend/Cloud Is Source Of Truth") &&
    projectRulesSource.includes("No duplicate systems") &&
    chiefSkillSource.includes("Project Knowledge Layer") &&
    specialistSkillSources.every(({ source }) => source.includes("---") && source.includes("##")),
  "Project memory, ADRs, rules, and specialist SKILL.md files must be allowed into git, while Codex browser profiles, agents, caches, screenshots, and logs stay ignored."
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
  "telegram assistant worker executes only canonical backend actions before success",
  assistantAgentServiceSource.includes("const MIN_EXECUTION_CONFIDENCE = 0.7") &&
    assistantAgentServiceSource.includes("executeIntent(user, intent)") &&
    assistantAgentServiceSource.includes("buildAgentReply({ intent, toolResult") &&
    assistantAgentServiceSource.includes("actions: [") &&
    assistantAgentServiceSource.includes("ok: Boolean(toolResult?.ok)") &&
    assistantAgentActionsSource.includes("if (!toolResult?.ok)") &&
    assistantAgentActionsSource.includes("I will not show it as saved until the backend confirms it.") &&
    assistantAgentActionsSource.includes("не буду показувати це як збережене, поки бекенд не підтвердить"),
  "Telegram assistant worker must not claim saved actions unless the canonical backend tool result is ok."
);

addCheck(
  "telegram assistant uses profile language for menus callbacks and agent context",
  telegramServiceSource.includes("getTelegramLanguageFromSnapshot(snapshot)") &&
    telegramServiceSource.includes("normalizeTelegramLanguage(user?.languagePreference)") &&
    telegramServiceSource.includes("buildTelegramMainMenuKeyboard(language)") &&
    telegramServiceSource.includes("buildTelegramWaterActionKeyboard({ language") &&
    telegramServiceSource.includes("copy.waterSaved") &&
    telegramServiceSource.includes("copy.waterSaveFailed") &&
    telegramServiceSource.includes("copy.waterStatusUpdated") &&
    telegramServiceSource.includes("context: await buildTelegramAssistantContext(user)") &&
    assistantAgentActionsSource.includes("waterUnit") &&
    assistantAgentActionsSource.includes("${text.waterUnit}"),
  "Telegram quick buttons, callback feedback, assistant context, and water units must follow the user's profile language."
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

addCheck(
  "photo meal save requires reviewed selected ingredients and backend confirmation",
  photoAssistantSource.includes("selectedItemIndexes.includes(index)") &&
    photoAssistantSource.includes("copy.nothingSelected") &&
    photoAssistantSource.includes("copy.incompleteCorrection") &&
    photoAssistantSource.includes("createConfirmedPhotoEntries") &&
    photoAssistantSource.includes("addMealEntriesToCloud(dispatch, meal, resolvedEntries)") &&
    photoAssistantSource.includes("runMealAction"),
  "Photo meal analysis must remain an editable draft and save only selected reviewed items through backend-confirmed meal sync."
);

addCheck(
  "photo meal unclear images start unselected and show better-photo recovery",
  photoAssistantSource.includes("shouldShowBetterPhotoGuidance") &&
    photoAssistantSource.includes("betterPhotoGuidanceVisible") &&
    photoAssistantSource.includes("copy.poorPhotoTips") &&
    photoAssistantSource.includes("copy.retakeClearPhoto") &&
    photoDraftSource.includes('analysis.recognitionStatus === "needs_better_photo"') &&
    photoDraftSource.includes("analysis.confidence < 0.35"),
  "Unclear or very low-confidence photo results must not auto-select foods and must guide users to retake a clearer photo."
);

addCheck(
  "photo assistant hides raw AI confidence and research wording from users",
  !/copy\.confidence|confidence \* 100[^`]*%|low confidence|manual verification|manual review|candidate/i.test(
    photoAssistantSource
  ) &&
    photoAssistantSource.includes("reviewStatusTitle") &&
    photoAssistantSource.includes('data-photo-review-status="draft-not-saved"'),
  "Photo UX must present consumer-friendly review states rather than raw model confidence or research terminology."
);

addCheck(
  "photo fallback never invents generic foods without user history",
  fallbackPhotoDraftSource.includes("getFeedbackItemsFromMealState") &&
    fallbackPhotoDraftSource.includes("photo-feedback:user-confirmed") &&
    fallbackPhotoDraftSource.includes('recognitionStatus: feedbackItems.length > 0 ? "needs_review" : "needs_better_photo"') &&
    !/\b(Greek yogurt|Oats|Banana|Breakfast photo draft)\b/.test(fallbackPhotoDraftSource),
  "Fallback photo analysis must use only user-confirmed history or request a better/manual photo, never a generic food template."
);

addCheck(
  "photo review state always requires confirmation for uncertain analysis",
  photoUxSource.includes("requiresPhotoMealConfirmation") &&
    photoUxSource.includes("shouldStartWithSuggestionsOnly") &&
    photoUxSource.includes("needsDetails") &&
    photoDraftSource.includes("analysis.confidence < 0.7 || analysis.manualReviewRequired"),
  "Photo recognition must distinguish ready/review/needs-details and require user confirmation for uncertain drafts."
);

addCheck(
  "mobile shell reserves safe area for bottom navigation and content",
  appLayoutSource.includes('minHeight: "100dvh"') &&
    appLayoutSource.includes('bottom: "max(12px, env(safe-area-inset-bottom, 0px))"') &&
    appLayoutSource.includes("visibleMobileTabs.map") &&
    appLayoutSource.includes("BottomNavigation") &&
    mealBuilderPageSource.includes('height: "calc(88px + env(safe-area-inset-bottom))"') &&
    /pb:\s*user[\s\S]*?\?\s*\{\s*xs:\s*16,\s*md:\s*5\s*\}/.test(appLayoutSource),
  "Mobile pages must reserve bottom safe-area space so fixed navigation does not cover scanner, photo, meal, or profile actions."
);

addCheck(
  "meal capture actions open scanner and photo directly",
  mealBuilderPageSource.includes("const directCaptureModule = inputMode === \"barcode\"") &&
    mealBuilderPageSource.includes('data-meal-builder-direct-capture="barcode"') &&
    mealBuilderPageSource.includes('data-meal-builder-direct-capture="photo"') &&
    /const openScanner = \(\) => \{[\s\S]*?nextParams\.set\("mode", "barcode"\);[\s\S]*?setActiveSection\("scan"\);[\s\S]*?\};/.test(
      mealBuilderPageSource
    ) &&
    /if \(target === "photo"\) \{[\s\S]*?handleInputModeChange\("photo"\);[\s\S]*?return;[\s\S]*?\}/.test(
      mealBuilderPageSource
    ),
  "Food scanner and photo meal entry must open as first-class capture surfaces, not buried behind secondary tabs or scroll-only panels."
);

addCheck(
  "mobile scanner preview and resolution state are stable",
  barcodeScannerSource.includes("scannerPreviewSx") &&
    barcodeScannerSource.includes('data-scanner-preview-shell="stable"') &&
    barcodeScannerSource.includes("BARCODE_SCANNER_PREVIEW_MOBILE_HEIGHT_CSS") &&
    barcodeScannerSource.includes("BARCODE_SCAN_NO_RESULT_TIMEOUT_MS") &&
    barcodeScannerSource.includes("scanTimedOut") &&
    /setFoundProduct\(product\);[\s\S]*?stopScanner\(\);/.test(barcodeScannerSource),
  "Mobile barcode scanning must use a stable preview shell, show recovery after no result, and stop the camera after a confirmed product."
);

addCheck(
  "pwa update flow has user controlled activation and reload fallback",
  registerServiceWorkerSource.includes("PWA_UPDATE_READY_EVENT") &&
    registerServiceWorkerSource.includes("PWA_UPDATE_RELOAD_FALLBACK_MS") &&
    registerServiceWorkerSource.includes("workbox.addEventListener(\"waiting\"") &&
    registerServiceWorkerSource.includes("workbox.messageSkipWaiting()") &&
    registerServiceWorkerSource.includes("workbox.addEventListener(\"controlling\"") &&
    registerServiceWorkerSource.includes("reloadAfterUpdate()") &&
    registerServiceWorkerSource.includes("window.setTimeout"),
  "PWA updates must show an explicit update path and still reload if controlling does not arrive quickly."
);

addCheck(
  "stale chunk failures recover by clearing runtime caches",
  clientErrorReportingSource.includes('window.addEventListener("vite:preloadError"') &&
    clientErrorReportingSource.includes("preloadEvent.preventDefault()") &&
    clientErrorReportingSource.includes("shouldAttemptStaleBuildRecovery") &&
    clientErrorReportingSource.includes("recoverApplicationAfterStaleBuild(window.location.href)") &&
    errorRecoverySource.includes("ChunkLoadError") &&
    errorRecoverySource.includes("clearRuntimeCaches") &&
    errorRecoverySource.includes("navigator.serviceWorker.getRegistrations") &&
    errorRecoverySource.includes("window.caches.delete") &&
    errorRecoverySource.includes("sn_recovery"),
  "Vite stale chunk crashes must be reported and recovered through service worker, cache, and volatile state cleanup."
);

addCheck(
  "service worker avoids stale app chunks",
  serviceWorkerSource.includes('fetch(request, { cache: "reload" })') &&
    serviceWorkerSource.includes('fetch(request, { cache: "no-store" })') &&
    serviceWorkerSource.includes('url.pathname.startsWith("/assets/")') &&
    serviceWorkerSource.includes('event.data?.type === "SKIP_WAITING"') &&
    !/self\.skipWaiting\(\)[\s\S]*self\.addEventListener\("install"/.test(serviceWorkerSource),
  "Service worker must not serve stale hashed assets after deploy and must wait for explicit activation."
);

addCheck(
  "3d companion stays lazy and disabled on constrained mobile devices",
  companionAvatarSource.includes("const CompanionCanvas = lazy(") &&
    companionAvatarSource.includes("defer3dUntilVisible = true") &&
    companionAvatarSource.includes("IntersectionObserver") &&
    companionAvatarSource.includes("prefersReducedMotion") &&
    companionAvatarSource.includes("saveData") &&
    companionAvatarSource.includes("lowPowerDevice") &&
    companionAvatarModelSource.includes("isMobileViewport") &&
    companionAvatarModelSource.includes("prefersReducedMotion") &&
    companionAvatarModelSource.includes("saveData") &&
    companionAvatarModelSource.includes("lowPowerDevice") &&
    companionAvatarModelSource.includes("return false"),
  "3D companion must not load heavy WebGL on mobile, reduced-motion, save-data, low-power, or unsupported devices."
);

addCheck(
  "bundle audit protects initial payload from route-heavy vendors",
  bundleAuditSource.includes("modulePreloadPattern") &&
    bundleAuditSource.includes("acceptedInitialPayloadLimitBytes") &&
    bundleAuditSource.includes("initialPayloadBytes") &&
    bundleAuditSource.includes("routeHeavyVendorPrefixes") &&
    bundleAuditSource.includes('"scanner-vendor-"') &&
    bundleAuditSource.includes('"three-core-vendor-"') &&
    bundleAuditSource.includes('"react-three-vendor-"') &&
    bundleAuditSource.includes('"markdown-vendor-"') &&
    bundleAuditSource.includes('"browser-image-compression-"') &&
    bundleAuditSource.includes('"analytics-vendor-"') &&
    bundleAuditSource.includes("must stay route-lazy"),
  "Bundle audit must inspect modulepreload initial assets, cap initial payload, and block scanner/photo/markdown/analytics/native/3D vendors from startup."
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
