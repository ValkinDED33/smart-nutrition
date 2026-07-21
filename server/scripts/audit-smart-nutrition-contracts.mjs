import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const readSource = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");

const readTrackedFiles = () =>
  execSync("git ls-files", {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const checks = [];

const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const photoAssistantSource = readSource("src/features/meal/PhotoMealAssistant.tsx");
const authRemoteSource = readSource("src/shared/api/authRemote.ts");
const platformApiSource = readSource("src/shared/api/platform.ts");
const visionAnalysisSource = readSource("server/services/photo/visionAnalysis.mjs");
const visionAnalysisTestSource = readSource("server/services/photo/visionAnalysis.test.mjs");
const frontendProductApiSource = readSource("src/shared/api/products.ts");
const mealCloudSyncSource = readSource("src/features/meal/mealCloudSync.ts");
const communityCloudSyncSource = readSource(
  "src/features/community/communityCloudSync.ts"
);
const stateControllerSource = readSource("server/controllers/state.controller.mjs");
const authRepositorySource = readSource("server/repositories/authRepository.mjs");
const telegramServiceSource = readSource("server/services/telegramService.mjs");
const telegramMedicationRemindersSource = readSource(
  "server/services/telegramMedicationReminders.mjs"
);
const registerPageSource = readSource("src/pages/RegisterPage.tsx");
const envExampleSource = readSource(".env.example");
const verifyEmailPageSource = readSource("src/pages/VerifyEmailPage.tsx");
const resetPasswordPageSource = readSource("src/pages/ResetPasswordPage.tsx");
const partnerInvitePageSource = readSource("src/pages/PartnerInvitePage.tsx");
const authCookiesSource = readSource("server/runtime/authCookies.mjs");
const authRoutesSource = readSource("server/routes/auth.routes.mjs");
const profileCloudActionSource = readSource("src/features/profile/useProfileCloudAction.ts");
const barcodeScannerSource = readSource("src/features/meal/BarcodeScanner.tsx");
const productCardSource = readSource("src/features/meal/ProductCard.tsx");
const productNutritionFactsSource = readSource("src/features/meal/ProductNutritionFacts.tsx");
const foodCommandCenterSource = readSource("src/features/meal/FoodCommandCenter.tsx");
const productSearchSource = readSource("src/features/meal/ProductSearch.tsx");
const quickMealComposerSource = readSource("src/features/meal/QuickMealComposer.tsx");
const nutritionLibraryPanelSource = readSource("src/features/meal/NutritionLibraryPanel.tsx");
const mealDayOverviewSource = readSource("src/features/meal/MealDayOverview.tsx");
const yesterdayRepeaterSource = readSource("src/features/meal/YesterdayRepeater.tsx");
const templateVaultSource = readSource("src/features/meal/TemplateVault.tsx");
const productDisplaySource = readSource("src/domain/products/productDisplay.ts");
const productMicronutrientInsightsSource = readSource(
  "src/domain/products/productMicronutrientInsights.ts"
);
const progressPageSource = readSource("src/pages/ProgressPage.tsx");
const progressOverviewCardSource = readSource(
  "src/features/profile/ProgressOverviewCard.tsx"
);
const womenHealthOverviewCardSource = readSource(
  "src/features/profile/WomenHealthOverviewCard.tsx"
);
const syncFeedbackAlertSource = readSource("src/widgets/SyncFeedbackAlert.tsx");
const syncStatusChipSource = readSource("src/widgets/SyncStatusChip.tsx");
const syncMessagingSource = readSource("src/shared/lib/syncMessaging.ts");
const cloudSyncStatusCardSource = readSource(
  "src/features/profile/CloudSyncStatusCard.tsx"
);
const accountDataCardSource = readSource("src/features/profile/AccountDataCard.tsx");
const accountDataCardCopySource = readSource("src/features/profile/accountDataCardCopy.ts");
const fridgeRecipePlannerSource = readSource("src/features/fridge/FridgeRecipePlanner.tsx");
const catalogContributionCardSource = readSource(
  "src/features/platform/CatalogContributionCard.tsx"
);
const adminCenterCardSource = readSource("src/features/platform/AdminCenterCard.tsx");
const sharedLanguageSource = readSource("src/shared/language/index.tsx");
const sharedI18nUkSource = readSource("src/shared/i18n/uk.ts");
const sharedI18nPlSource = readSource("src/shared/i18n/pl.ts");
const sharedI18nEnSource = readSource("src/shared/i18n/en.ts");
const productLookupServiceSource = readSource("server/services/productLookupService.mjs");
const photoDraftSource = readSource("src/features/meal/photo/photoDraft.ts");
const photoUxSource = readSource("src/features/meal/photo/photoMealAssistantUx.ts");
const photoUxTestSource = readSource("src/features/meal/photo/photoMealAssistantUx.test.ts");
const fallbackPhotoDraftSource = readSource("server/services/photo/fallbackDraft.mjs");
const photoAnalysisServiceSource = readSource("server/services/photoAnalysisService.mjs");
const serverConfigSource = readSource("server/config.mjs");
const serverConfigTestSource = readSource("server/config.test.mjs");
const serverIndexSource = readSource("server/index.mjs");
const assistantAgentServiceSource = readSource("server/agent/agent.service.mjs");
const assistantAgentActionsSource = readSource("server/agent/agent.actions.mjs");
const assistantAgentToolsSource = readSource("server/agent/agent.tools.mjs");
const assistantAgentIntentsSource = readSource("server/agent/agent.intents.mjs");
const assistantAgentMemorySource = readSource("server/agent/agent.memory.mjs");
const assistantPromptStackSource = readSource("server/services/ai/assistantPromptStack.mjs");
const assistantApiSource = readSource("src/shared/api/assistant.ts");
const assistantRuntimeCardSource = readSource(
  "src/features/assistant/AssistantRuntimeCard.tsx"
);
const mongoStorageSource = readSource("server/storage/mongo.mjs");
const mongoAiRepositorySource = readSource("server/repositories/mongoAiRepository.mjs");
const appLayoutSource = readSource("src/app/layouts/AppLayout.tsx");
const mealBuilderPageSource = readSource("src/pages/MealBuilderPage.tsx");
const registerServiceWorkerSource = readSource("src/shared/lib/registerServiceWorker.ts");
const errorRecoverySource = readSource("src/shared/lib/errorRecovery.ts");
const clientErrorReportingSource = readSource("src/app/runtime/clientErrorReporting.ts");
const serviceWorkerSource = readSource("public/sw.js");
const companionAvatarSource = readSource("src/features/assistant-3d/components/CompanionAvatar.tsx");
const companionAvatarModelSource = readSource("src/features/assistant-3d/components/companionAvatarModel.ts");
const bundleAuditSource = readSource("server/scripts/audit-vite-bundle.mjs");
const liveAuditSource = readSource("server/scripts/audit-live-production.mjs");
const authenticatedLiveAuditSource = readSource("server/scripts/audit-live-authenticated.mjs");
const packageJsonSource = readSource("package.json");
const productionCheckSource = readSource("server/production-check.mjs");
const gitignoreSource = readSource(".gitignore");
const projectMemorySource = readSource(".codex/PROJECT_MEMORY.md");
const projectDecisionsSource = readSource(".codex/DECISIONS.md");
const projectRulesSource = readSource(".codex/PROJECT_RULES.md");
const chiefSkillSource = readSource(".codex/skills/smart-nutrition-chief/SKILL.md");
const aiReadyDocSource = readSource("docs/AI_READY_TO_USE.md");
const aiIntegrationDocSource = readSource("docs/AI_INTEGRATION_SETUP.md");
const envSetupDocSource = readSource("docs/ENV_SETUP_GUIDE.md");
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
const trackedFiles = readTrackedFiles();
const retiredPhotoDocPhrases = [
  ["manual", "draft", "mode"],
  ["low-confidence", "manual", "draft"],
  ["does", "not", "enable", "paid", "AI", "vision"],
].map((parts) => new RegExp(parts.join("\\s+"), "i"));

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
  "tracked repository excludes runtime and generated artifacts",
  trackedFiles.every(
    (filePath) =>
      !/^\.codex\/(?:chrome|cdp|preview|runtime-smoke|screenshots|vite-dev)/.test(
        filePath
      ) &&
      !/^\.codex-remote-attachments\//.test(filePath) &&
      !/^server\/data\/(?!\.gitkeep$)/.test(filePath) &&
      !/^dist\//.test(filePath) &&
      !/^node_modules\//.test(filePath) &&
      !/Cache_Data|Secure Preferences|(?:^|\/)Preferences$|\.log$|ScreenClip|Photo [0-9]/.test(
        filePath
      )
  ),
  "Git must contain only source, contracts, docs, and skill knowledge; browser profiles, local storage snapshots, remote attachments, cache data, logs, screenshots, and build output must stay out of the index."
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
    visionAnalysisSource.includes("Never return a generic template breakfast") &&
    visionAnalysisTestSource.includes("provider claims high confidence") &&
    visionAnalysisTestSource.includes("confidence: 0.99"),
  "Vision normalization must reject generic breakfast templates even when a provider claims high confidence."
);

addCheck(
  "photo recognition docs match backend vision contract",
  [aiReadyDocSource, aiIntegrationDocSource, envSetupDocSource].every(
    (source) =>
      retiredPhotoDocPhrases.every((pattern) => !pattern.test(source))
  ) &&
    aiReadyDocSource.includes("vision-capable providers") &&
    aiIntegrationDocSource.includes("Saving still requires user confirmation") &&
    envSetupDocSource.includes("фото еды не должно быть шаблоном"),
  "AI docs must not preserve the old manual-draft-only story; docs must reflect backend vision recognition with honest fallback and user confirmation."
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
  "community cloud mutations require canonical backend community state",
  stateControllerSource.includes("sendSavedMeta(response, auth.user, { community })") &&
    authRemoteSource.includes("community?: unknown") &&
    authRemoteSource.includes("data.community") &&
    authRemoteSource.includes("communityUpdatedAt") &&
    communityCloudSyncSource.includes("MISSING_CANONICAL_COMMUNITY_ERROR") &&
    communityCloudSyncSource.includes("if (!result.community)") &&
    communityCloudSyncSource.includes("dispatch(replaceCommunityState(confirmedCommunity))"),
  "Community actions must not dispatch locally computed state as success; backend must return canonical community state and frontend must reject missing canonical payloads."
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
    assistantAgentActionsSource.includes("I will not show it as saved until Smart Nutrition cloud confirms it.") &&
    assistantAgentActionsSource.includes("не буду показувати це як збережене, поки хмара Smart Nutrition не підтвердить") &&
    !/поки бекенд не підтвердить|until the backend confirms|dopóki backend tego nie potwierdzi/i.test(
      assistantAgentActionsSource
    ),
  "Telegram assistant worker must not claim saved actions unless the canonical backend tool result is ok, while visible replies use product cloud language instead of backend jargon."
);

addCheck(
  "assistant reminder tools prefer canonical typed reminder contract",
  assistantAgentToolsSource.includes("getTypedReminderCreator(") &&
    assistantAgentToolsSource.includes("reminders.createReminderFromUserText(user, { type, text }, currentNow)") &&
    assistantAgentToolsSource.includes('getTypedReminderCreator(\n      reminders,\n      "medication"\n    )') &&
    assistantAgentToolsSource.includes('getTypedReminderCreator(reminders, "task")'),
  "AI-created medication and task reminders must prefer createReminderFromUserText and use legacy reminder methods only as compatibility fallback."
);

addCheck(
  "assistant follow-ups use canonical task reminders",
  assistantAgentIntentsSource.includes('intent: "create_follow_up"') &&
    assistantAgentIntentsSource.includes("FOLLOW_UP_WORD_PATTERN") &&
    assistantAgentIntentsSource.includes("RELATIVE_SCHEDULE_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "create_follow_up"') &&
    assistantAgentServiceSource.includes("tools.createFollowUp(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const createFollowUp = async") &&
    assistantAgentToolsSource.includes('getTypedReminderCreator(reminders, "task")') &&
    assistantAgentToolsSource.includes("buildFollowUpReminderText") &&
    assistantAgentToolsSource.includes("DEFAULT_REMINDER_TIMEZONE") &&
    assistantAgentToolsSource.includes("Intl.DateTimeFormat") &&
    assistantAgentActionsSource.includes("followUpCreated") &&
    assistantAgentActionsSource.includes("followUpFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "follow_up_created"') &&
    assistantAgentMemorySource.includes("uses assistant follow-ups"),
  "AI follow-up requests must route through the canonical task reminder contract with explicit local reminder time, confirmed reply copy, and scoped assistant memory."
);

addCheck(
  "assistant meal tool uses canonical product intake",
  assistantAgentToolsSource.includes("stateService.addProductIntake(") &&
    assistantAgentToolsSource.includes('source: "recommendation"') &&
    assistantAgentToolsSource.includes('idempotencyKey: createAssistantMealIntakeKey()') &&
    assistantAgentToolsSource.includes('source: "assistant-agent"') &&
    assistantAgentToolsSource.includes("intakeResult?.outcomes?.mealAdded !== true") &&
    !/stateService\.addMealEntries\(/.test(assistantAgentToolsSource),
  "AI-created food entries must flow through canonical backend-confirmed product intake and must not bypass it with direct addMealEntries."
);

addCheck(
  "assistant favorite product saves use canonical saved meal products",
  assistantAgentIntentsSource.includes('intent: "save_favorite"') &&
    assistantAgentIntentsSource.includes("FAVORITE_SAVE_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "save_favorite"') &&
    assistantAgentServiceSource.includes("tools.saveFavorite(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const saveFavorite = async") &&
    assistantAgentToolsSource.includes('stateService.upsertMealProduct(user, "saved", product') &&
    assistantAgentToolsSource.includes("const confirmedMealState = await stateService.getMealState(user)") &&
    assistantAgentToolsSource.includes("confirmedMealState?.savedProducts") &&
    assistantAgentToolsSource.includes('return { ok: false, code: "FAVORITE_NOT_CONFIRMED" }') &&
    assistantAgentActionsSource.includes("favoriteSaved") &&
    assistantAgentActionsSource.includes("favoriteFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "favorite_saved"') &&
    assistantAgentMemorySource.includes("saves quick products through assistant"),
  "AI save-favorite requests must use canonical meal savedProducts persistence and verify backend restore before visible success."
);

addCheck(
  "assistant recipe creation uses canonical meal templates",
  assistantAgentIntentsSource.includes('intent: "create_recipe"') &&
    assistantAgentIntentsSource.includes("RECIPE_WORD_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "create_recipe"') &&
    assistantAgentServiceSource.includes("tools.createRecipe(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const createRecipe = async") &&
    assistantAgentToolsSource.includes("stateService.addMealTemplate(user, template") &&
    assistantAgentToolsSource.includes("const confirmedMealState = await stateService.getMealState(user)") &&
    assistantAgentToolsSource.includes("findConfirmedTemplate(confirmedMealState, template.id)") &&
    assistantAgentToolsSource.includes('return { ok: false, code: "RECIPE_NOT_CONFIRMED" }') &&
    assistantAgentActionsSource.includes("recipeCreated") &&
    assistantAgentActionsSource.includes("recipeFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "recipe_created"') &&
    assistantAgentMemorySource.includes("creates reusable recipes through assistant") &&
    assistantPromptStackSource.includes("createRecipe") &&
    !assistantPromptStackSource.includes("Future tools may include createRecipe"),
  "AI recipe creation must save canonical meal templates, verify backend restore, and avoid prompt-only recipe success or a second recipe system."
);

addCheck(
  "assistant scanner handoff opens canonical scanner route",
  assistantAgentIntentsSource.includes('intent: "open_scanner"') &&
    assistantAgentIntentsSource.includes("SCANNER_WORD_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "open_scanner"') &&
    assistantAgentServiceSource.includes("tools.openScanner(user, intent.entities)") &&
    assistantAgentServiceSource.includes("targetRoute: toolResult?.targetRoute ?? null") &&
    assistantAgentToolsSource.includes("const openScanner = async") &&
    assistantAgentToolsSource.includes('type: "navigation_handoff"') &&
    assistantAgentToolsSource.includes('targetSurface: "scanner"') &&
    assistantAgentToolsSource.includes('targetRoute: "/meals?mode=barcode"') &&
    assistantAgentActionsSource.includes("scannerOpening") &&
    assistantAgentMemorySource.includes('toolResult.type === "navigation_handoff"') &&
    assistantAgentMemorySource.includes("opens scanner through assistant") &&
    assistantPromptStackSource.includes("openScanner") &&
    assistantApiSource.includes("parseAssistantActions(payload.actions)") &&
    assistantApiSource.includes("isSafeInternalRoute") &&
    assistantRuntimeCardSource.includes("getNavigationTarget") &&
    assistantRuntimeCardSource.includes("navigate(targetRoute)") &&
    mealBuilderPageSource.includes('searchParams.get("mode")') &&
    mealBuilderPageSource.includes('inputMode === "barcode"'),
  "AI scanner requests must produce a safe navigation handoff to the existing meal scanner route, not a second scanner, fake scan result, or text-only instruction."
);

addCheck(
  "assistant photo meal handoff opens canonical photo route",
  assistantAgentIntentsSource.includes('intent: "request_photo_meal_analysis"') &&
    assistantAgentIntentsSource.includes("PHOTO_MEAL_WORD_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "request_photo_meal_analysis"') &&
    assistantAgentServiceSource.includes("tools.requestPhotoMealAnalysis(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const requestPhotoMealAnalysis = async") &&
    assistantAgentToolsSource.includes('targetSurface: "photo_meal"') &&
    assistantAgentToolsSource.includes('targetRoute: "/meals?mode=photo"') &&
    assistantAgentActionsSource.includes("photoMealOpening") &&
    assistantAgentMemorySource.includes("opens photo meal analysis through assistant") &&
    assistantPromptStackSource.includes("requestPhotoMealAnalysis") &&
    assistantApiSource.includes('targetSurface === "photo_meal"') &&
    assistantRuntimeCardSource.includes("getNavigationTarget") &&
    assistantRuntimeCardSource.includes("navigate(targetRoute)") &&
    mealBuilderPageSource.includes('value === "photo"') &&
    mealBuilderPageSource.includes('data-meal-builder-direct-capture="photo"') &&
    mealBuilderPageSource.includes("<PhotoMealAssistant mealType={mealType} />"),
  "AI photo-food requests must hand off to the existing review-first PhotoMealAssistant route, not invent a recognition result or create a second photo meal system."
);

addCheck(
  "assistant weight tool uses backend-confirmed profile state",
  assistantAgentIntentsSource.includes('intent: "log_weight"') &&
    assistantAgentServiceSource.includes('intent.intent === "log_weight"') &&
    assistantAgentServiceSource.includes("tools.logWeight(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const logWeight = async") &&
    assistantAgentToolsSource.includes("stateService.saveProfileState(user, nextProfileState") &&
    assistantAgentToolsSource.includes("const confirmedProfileState = await stateService.getProfileState(user)") &&
    assistantAgentToolsSource.includes('return { ok: false, code: "WEIGHT_NOT_CONFIRMED" }') &&
    assistantAgentActionsSource.includes("weightLogged") &&
    assistantAgentActionsSource.includes("weightFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "weight_logged"') &&
    assistantAgentMemorySource.includes("logs weight through assistant"),
  "AI-created weight check-ins must update canonical profile state, verify the saved history after backend persistence, and refuse visible success without confirmation."
);

addCheck(
  "assistant symptom tool uses backend-confirmed women health profile state",
  assistantAgentIntentsSource.includes('intent: "log_symptom"') &&
    assistantAgentServiceSource.includes('intent.intent === "log_symptom"') &&
    assistantAgentServiceSource.includes("tools.logSymptom(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const logSymptom = async") &&
    assistantAgentToolsSource.includes("womenHealth") &&
    assistantAgentToolsSource.includes("symptomHistory") &&
    assistantAgentToolsSource.includes("stateService.saveProfileState(user, nextProfileState") &&
    assistantAgentToolsSource.includes("const confirmedProfileState = await stateService.getProfileState(user)") &&
    assistantAgentToolsSource.includes('return { ok: false, code: "SYMPTOM_NOT_CONFIRMED" }') &&
    assistantAgentActionsSource.includes("symptomLogged") &&
    assistantAgentActionsSource.includes("symptomSafety") &&
    assistantAgentMemorySource.includes('toolResult.type === "symptom_logged"') &&
    assistantAgentMemorySource.includes("logs symptoms through assistant"),
  "AI-created symptom check-ins must update canonical womenHealth profile state, verify the saved symptom after backend persistence, and answer with safety language rather than diagnosis."
);

addCheck(
  "assistant day summary uses backend snapshot and canonical reminders",
  assistantAgentIntentsSource.includes('intent: "generate_day_summary"') &&
    assistantAgentServiceSource.includes('intent.intent === "generate_day_summary"') &&
    assistantAgentServiceSource.includes("tools.generateDaySummary(user)") &&
    assistantAgentToolsSource.includes("const generateDaySummary = async") &&
    assistantAgentToolsSource.includes("createSnapshotSummary({ user, stateService") &&
    assistantAgentToolsSource.includes("getActiveReminders(reminders, user)") &&
    assistantAgentToolsSource.includes("latestWeight") &&
    assistantAgentToolsSource.includes("recentSymptoms") &&
    assistantAgentActionsSource.includes("toolResult.type === \"day_summary\"") &&
    assistantAgentActionsSource.includes("daySummaryTitle") &&
    assistantAgentMemorySource.includes('toolResult.type === "day_summary"') &&
    assistantAgentMemorySource.includes("asks assistant for daily summaries"),
  "AI-generated day summaries must read canonical backend snapshot/profile/reminder state and respond as an action receipt, not a generic model guess or a second report system."
);

addCheck(
  "assistant progress reports use backend snapshot and canonical reminders",
  assistantAgentIntentsSource.includes('intent: "generate_report"') &&
    assistantAgentIntentsSource.includes("REPORT_WORD_PATTERN") &&
    assistantAgentIntentsSource.includes("REPORT_PERIOD_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "generate_report"') &&
    assistantAgentServiceSource.includes("tools.generateReport(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const generateReport = async") &&
    assistantAgentToolsSource.includes("createReportWindow(period, currentNow)") &&
    assistantAgentToolsSource.includes("getReportMealEntries(summary.snapshot?.meal, window)") &&
    assistantAgentToolsSource.includes("calculateReportWater(summary.snapshot?.water, window)") &&
    assistantAgentToolsSource.includes("getActiveReminders(reminders, user)") &&
    assistantAgentActionsSource.includes('toolResult.type === "progress_report"') &&
    assistantAgentActionsSource.includes("reportTitle") &&
    assistantAgentActionsSource.includes("reportFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "progress_report"') &&
    assistantAgentMemorySource.includes("asks assistant for progress reports") &&
    assistantPromptStackSource.includes("generateReport") &&
    !assistantPromptStackSource.includes("Future tools may include createRecipe, analyzeMeal, analyzePhoto, updateGoal, updateProfile, summarizeProgress, generateReport"),
  "AI weekly/monthly progress reports must read canonical backend snapshot/profile/water/reminder state and respond as a report receipt, not model-generated progress fiction."
);

addCheck(
  "women health UI surfaces symptom history as non-diagnostic care context",
  womenHealthOverviewCardSource.includes('data-women-health-symptom-history="true"') &&
    womenHealthOverviewCardSource.includes("womenHealth.symptomHistory") &&
    womenHealthOverviewCardSource.includes("recentSymptomHistory") &&
    womenHealthOverviewCardSource.includes("copy.symptomHistoryTitle") &&
    womenHealthOverviewCardSource.includes("copy.symptomSafetyNote") &&
    womenHealthOverviewCardSource.includes("getSymptomSeverityColor") &&
    womenHealthOverviewCardSource.includes("formatSymptomDate") &&
    !womenHealthOverviewCardSource.includes("localStorage"),
  "Backend-confirmed AI symptom logs must be visible in the existing women-health profile surface as an observation journal, without local persistence or diagnostic certainty."
);

addCheck(
  "telegram assistant uses profile language for menus callbacks and agent context",
  telegramServiceSource.includes("getTelegramLanguageFromSnapshot(snapshot)") &&
    telegramServiceSource.includes("normalizeTelegramLanguage(user?.languagePreference)") &&
    telegramServiceSource.includes("mainMenuButtons") &&
    telegramServiceSource.includes("buildTelegramMainMenuKeyboard(language)") &&
    telegramServiceSource.includes("getTelegramMainMenuCommandFromText") &&
    telegramServiceSource.includes("handleTelegramMainMenuText(ctx, message)") &&
    telegramServiceSource.includes("buildReminderListMessage(reminders.getUserReminders(user), language)") &&
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
  "telegram reminder command hints use profile language",
  telegramMedicationRemindersSource.includes("replyWithProfileLanguageHint") &&
    telegramMedicationRemindersSource.includes("const language = await resolveUserLanguage(user, ctx)") &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).addTaskHint"
    ) &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).addWaterHint"
    ) &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).addHabitHint"
    ) &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).addSupplementHint"
    ) &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).addGenericHint"
    ) &&
    !telegramMedicationRemindersSource.includes(
      "getReminderCopy(getReminderLanguageFromContext(ctx)).setTimeHint"
    ),
  "Empty Telegram reminder commands must not fall back to Telegram client language when a connected profile language exists."
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
    barcodeScannerSource.includes("? getProductDisplayName(foundProduct, appLanguage)") &&
    barcodeScannerSource.includes("label={copy.scannedCodeReady}") &&
    barcodeScannerSource.indexOf('data-scanner-found-product="primary-result"') <
      barcodeScannerSource.indexOf("label={copy.barcode}") &&
    barcodeScannerSource.indexOf('data-scanner-found-product="primary-result"') <
      barcodeScannerSource.indexOf("{copy.scanHistory}") &&
    barcodeScannerSource.indexOf('data-scanner-found-product="primary-result"') <
      barcodeScannerSource.indexOf("copy.manualTitle"),
  "After scan, the product result must be visible above manual controls/history/fallback panels and the stopped preview must show what was scanned."
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
    productNutritionFactsSource.includes("getProductMicronutrientInsights") &&
    productNutritionFactsSource.includes("micronutrientSignals") &&
    productMicronutrientInsightsSource.includes("seaweed-iodine-source") &&
    productMicronutrientInsightsSource.includes("product.nutrients.iodine") &&
    productMicronutrientInsightsSource.includes("не рахується автоматично") &&
    productNutritionFactsSource.includes("analyzeProductAdditives") &&
    productNutritionFactsSource.includes("getAdditiveRiskColor") &&
    productNutritionFactsSource.includes("additiveDose") &&
    productNutritionFactsSource.includes("additiveCompositionMissing"),
  "Product details must expose micronutrients, iodine, honest seaweed iodine guidance when provider data lacks a number, additive risk, dose guidance, and a clear missing-composition state."
);

addCheck(
  "progress overview keeps water glasses visible and opens counted domains",
  progressPageSource.includes("getSectionForProgressDomain") &&
    progressPageSource.includes('case "water":') &&
    progressPageSource.includes('return "water";') &&
    progressPageSource.includes("onSelectDomain") &&
    progressOverviewCardSource.includes("createWaterGlassSlots") &&
    progressOverviewCardSource.includes("overviewWaterGlasses") &&
    progressOverviewCardSource.includes('data-testid="overview-water-glass"') &&
    progressOverviewCardSource.includes("data-progress-domain={item.domain}") &&
    progressOverviewCardSource.includes("onSelectDomain?.(item.domain)"),
  "Progress must show water glass slots in the first overview and let users open the water tab directly from the counted-domain card."
);

addCheck(
  "backend product lookup imports full canonical nutrients and additive text",
  productLookupServiceSource.includes("additives_tags") &&
    productLookupServiceSource.includes("additives_original_tags") &&
    productLookupServiceSource.includes("readOpenFoodFactsAdditivesText") &&
    productLookupServiceSource.includes("readFirstMicronutrientPerBase(nutriments, [\"iodine\", \"iodide\", \"iodides\"]") &&
    productLookupServiceSource.includes("readFirstNutrimentPerBase") &&
    productLookupServiceSource.includes("monounsaturatedFat") &&
    productLookupServiceSource.includes("polyunsaturatedFat") &&
    productLookupServiceSource.includes("omega3") &&
    productLookupServiceSource.includes("cholesterol") &&
    productLookupServiceSource.includes("glucose") &&
    productLookupServiceSource.includes("fructose") &&
    productLookupServiceSource.includes("sucrose") &&
    productLookupServiceSource.includes("water") &&
    productLookupServiceSource.includes("vitamin-b12") &&
    productLookupServiceSource.includes("readUsdaNutrient(food, [1100]") &&
    productLookupServiceSource.includes("readUsdaNutrient(food, [1103]") &&
    productLookupServiceSource.includes("copper"),
  "Backend product lookup must preserve additive, micronutrient, fatty-acid, sugar-type, water, iodine, selenium, and copper facts from provider data before the frontend renders product facts."
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
  "partner invite page is localized and limited to pregnancy sharing",
  partnerInvitePageSource.includes("partnerInviteCopy") &&
    partnerInvitePageSource.includes("getPartnerInviteCopy(appLanguage)") &&
    partnerInvitePageSource.includes("PENDING_PARTNER_INVITE_KEY") &&
    partnerInvitePageSource.includes("acceptRemotePartnerInvite") &&
    partnerInvitePageSource.includes("захищену хмарну синхронізацію") &&
    partnerInvitePageSource.includes("bezpieczną synchronizację w chmurze") &&
    partnerInvitePageSource.includes("secure cloud sync") &&
    partnerInvitePageSource.includes("без повної синхронізації акаунтів") &&
    partnerInvitePageSource.includes("bez pełnej synchronizacji kont") &&
    partnerInvitePageSource.includes("without full account synchronization") &&
    !/cloud backend/i.test(partnerInvitePageSource),
  "QR partner access must feel native to the app language, route through backend invite acceptance, and communicate limited pregnancy sharing without exposing backend jargon."
);

const polishedPolishSyncSources = [
  syncFeedbackAlertSource,
  syncStatusChipSource,
  syncMessagingSource,
  cloudSyncStatusCardSource,
  accountDataCardCopySource,
  fridgeRecipePlannerSource,
].join("\n");

addCheck(
  "polish cloud account and sync UI uses polished native copy",
  polishedPolishSyncSources.includes("Synchronizacja z chmurą zakończona pomyślnie.") &&
    polishedPolishSyncSources.includes("Błąd synchronizacji") &&
    polishedPolishSyncSources.includes("Dane w chmurze zmieniły się na innym urządzeniu.") &&
    polishedPolishSyncSources.includes("Profil w chmurze") &&
    polishedPolishSyncSources.includes("Chroniona sesja") &&
    polishedPolishSyncSources.includes("Telegram odłączony.") &&
    polishedPolishSyncSources.includes("Nie udało się zapisać lodówki w chmurze.") &&
    !/\b(chmura zakonczona pomyslnie|Blad synchronizacji|czekaja na udana synchronizacje|zmienily sie|urzadzeniu|Nie udalo sie|Nie polaczono|Polaczono|Odlacz|Otworzylismy|lodowki)\b/.test(
      polishedPolishSyncSources
    ),
  "Visible Polish account, cloud-sync, Telegram-link, and fridge-save statuses must not regress into ASCII-only or broken-language copy."
);

addCheck(
  "telegram account UI presents an assistant surface, not a separate bot product",
  accountDataCardCopySource.includes("Підключіть помічника") &&
    accountDataCardCopySource.includes("Завершіть підключення в помічнику.") &&
    accountDataCardCopySource.includes('telegramBot: "Помічник"') &&
    accountDataCardCopySource.includes('telegramBot: "Asystent"') &&
    accountDataCardCopySource.includes("Connect the assistant") &&
    accountDataCardCopySource.includes("Finish connecting with the assistant.") &&
    accountDataCardCopySource.includes('telegramBot: "Assistant"') &&
    !/Connect the bot|Підключіть бота|w bocie|telegramBot: "Bot"/.test(accountDataCardCopySource),
  "Telegram profile settings must describe the same Smart Nutrition AI assistant surface, not a standalone bot product or second AI brain."
);

const humanNutritionCopySources = [
  foodCommandCenterSource,
  productSearchSource,
  quickMealComposerSource,
  nutritionLibraryPanelSource,
  photoAssistantSource,
  mealDayOverviewSource,
  yesterdayRepeaterSource,
  templateVaultSource,
].join("\n");

addCheck(
  "nutrition flows hide backend jargon from regular user copy",
  humanNutritionCopySources.includes("онлайн-каталогу") &&
    humanNutritionCopySources.includes("підтверджено хмарою") &&
    humanNutritionCopySources.includes("katalogu online") &&
    humanNutritionCopySources.includes("potwierdzono w chmurze") &&
    humanNutritionCopySources.includes("online catalog") &&
    humanNutritionCopySources.includes("confirmed in the cloud") &&
    !/backend\/online|backend catalog|backend-каталог|каталог backendu|confirmed by the backend|підтверджено backend|potwierdzon[yo] przez backend|на backend|backendzie/.test(
      humanNutritionCopySources
    ),
  "Food search, photo meal, library, composer, and diary success states must keep backend-confirmed behavior while presenting human product language to regular users."
);

addCheck(
  "nutrition product source labels hide provider ids from regular users",
  productDisplaySource.includes("getProductSourceLabel") &&
    productDisplaySource.includes("Онлайн-каталог") &&
    productDisplaySource.includes("Katalog online") &&
    productDisplaySource.includes("Online catalog") &&
    productCardSource.includes("getProductSourceLabel") &&
    foodCommandCenterSource.includes("getProductSourceLabel") &&
    quickMealComposerSource.includes("getProductSourceLabel") &&
    nutritionLibraryPanelSource.includes("getProductSourceLabel") &&
    !productCardSource.includes("product.source].filter") &&
    !foodCommandCenterSource.includes("selectedProduct.source}`") &&
    !quickMealComposerSource.includes("${selectedProduct.source}") &&
    !nutritionLibraryPanelSource.includes("label={product.source"),
  "Scanner, product cards, quick meal composer, and library surfaces must show localized source labels instead of raw provider ids such as OpenFoodFacts, USDA, or Manual."
);

const humanAuthPlatformCopySources = [
  platformApiSource,
  catalogContributionCardSource,
  adminCenterCardSource,
  sharedLanguageSource,
  sharedI18nUkSource,
  sharedI18nPlSource,
  sharedI18nEnSource,
].join("\n");

addCheck(
  "auth and platform errors use product language instead of infrastructure instructions",
  humanAuthPlatformCopySources.includes("захищену хмарну сесію") &&
    humanAuthPlatformCopySources.includes("bezpieczną sesję w chmurze") &&
    humanAuthPlatformCopySources.includes("secure cloud session") &&
    humanAuthPlatformCopySources.includes("Хмарний сервіс тимчасово недоступний") &&
    humanAuthPlatformCopySources.includes("Usługa w chmurze jest chwilowo niedostępna") &&
    humanAuthPlatformCopySources.includes("cloud service is temporarily unavailable") &&
    humanAuthPlatformCopySources.includes("Лист підтвердження не вдалося відправити. Спробуйте ще раз") &&
    humanAuthPlatformCopySources.includes("Nie udało się wysłać emaila potwierdzającego. Spróbuj ponownie") &&
    humanAuthPlatformCopySources.includes("confirmation email could not be sent. Try again shortly") &&
    humanAuthPlatformCopySources.includes("Хмарний каталог тимчасово недоступний") &&
    humanAuthPlatformCopySources.includes("Katalog w chmurze jest chwilowo niedostępny") &&
    humanAuthPlatformCopySources.includes("cloud catalog is temporarily unavailable") &&
    !/Cloud backend|Backend cloud|backend-сесію|backendową|backend session|API key|адресу API|address or try/.test(
      humanAuthPlatformCopySources
    ),
  "Registration, email delivery, catalog, and admin unavailable states must not expose API/backend setup instructions to regular users."
);

const humanProfileSyncCopySources = [
  accountDataCardCopySource,
  cloudSyncStatusCardSource,
  syncMessagingSource,
  sharedI18nUkSource,
  sharedI18nPlSource,
  sharedI18nEnSource,
].join("\n");

addCheck(
  "profile account and sync UI hides infrastructure jargon from regular users",
  humanProfileSyncCopySources.includes("Хмарний профіль") &&
    humanProfileSyncCopySources.includes("Захищена сесія") &&
    humanProfileSyncCopySources.includes("Дані профілю, харчування, води й налаштувань зберігаються в хмарі") &&
    humanProfileSyncCopySources.includes("Profil w chmurze") &&
    humanProfileSyncCopySources.includes("Chroniona sesja") &&
    humanProfileSyncCopySources.includes("Dane profilu, jedzenia, wody i ustawień są przechowywane w chmurze") &&
    humanProfileSyncCopySources.includes("Cloud profile") &&
    humanProfileSyncCopySources.includes("Protected session") &&
    humanProfileSyncCopySources.includes("profile, meals, water, and settings are stored in the cloud") &&
    humanProfileSyncCopySources.includes("Password reset by email is temporarily unavailable") &&
    !/Remote API account|Zdalne konto API|Віддалений API-акаунт|API-сесія|API session|access \+ refresh|snapshot|snapshots|connected to the backend|підключений до бекенда|połączone z backendem|serwerze nie skonfigurowano|server yet/.test(
      humanProfileSyncCopySources
    ),
  "Regular profile/account/sync surfaces must present cloud profile and protected-session language, while infrastructure terms stay inside code and admin diagnostics."
);

addCheck(
  "regular account settings hide operational backup and runtime details",
  accountDataCardSource.includes("canAccessAdminCenter(user?.role)") &&
    accountDataCardSource.includes("if (!canSeeOperationalDetails)") &&
    accountDataCardSource.includes("return undefined;") &&
    accountDataCardSource.includes("const backupsLoading = canSeeOperationalDetails && backups === null") &&
    accountDataCardSource.includes("getRemoteAccountBackups()") &&
    accountDataCardSource.includes("{canSeeOperationalDetails && (") &&
    accountDataCardSource.includes("runtimeLabels.provider") &&
    accountDataCardSource.includes("copy.backupsTitle"),
  "Regular users must not see or fetch operational backup/runtime details in account settings; those details belong to admin, moderator, helper, or owner diagnostics."
);

addCheck(
  "photo meal unclear images start unselected and show better-photo recovery",
  photoAssistantSource.includes("shouldShowBetterPhotoGuidance") &&
    photoAssistantSource.includes("betterPhotoGuidanceVisible") &&
    photoAssistantSource.includes("createUnavailablePhotoAnalysis") &&
    photoAssistantSource.includes("setAnalysis(createUnavailablePhotoAnalysis(copy))") &&
    !photoAssistantSource.includes("setError(copy.analysisError)") &&
    photoAssistantSource.includes("copy.poorPhotoTips") &&
    photoAssistantSource.includes("copy.retakeClearPhoto") &&
    photoDraftSource.includes('analysis.recognitionStatus === "needs_better_photo"') &&
    photoDraftSource.includes("analysis.confidence < 0.35") &&
    photoUxTestSource.includes("backend photo analysis is unavailable"),
  "Unclear, unavailable, or very low-confidence photo results must not auto-select foods and must guide users to retake a clearer photo."
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
  "photo fallback never invents foods from templates or user history",
  fallbackPhotoDraftSource.includes("I could not confidently identify visible foods") &&
    fallbackPhotoDraftSource.includes("language = FALLBACK_LANGUAGE") &&
    fallbackPhotoDraftSource.includes("normalizeFallbackLanguage(language)") &&
    fallbackPhotoDraftSource.includes("Фото потребує ручної перевірки") &&
    fallbackPhotoDraftSource.includes("Zdjęcie wymaga ręcznego sprawdzenia") &&
    fallbackPhotoDraftSource.includes("No food was automatically identified") &&
    fallbackPhotoDraftSource.includes("void mealState") &&
    fallbackPhotoDraftSource.includes("const items = []") &&
    fallbackPhotoDraftSource.includes("const interpretations = []") &&
    fallbackPhotoDraftSource.includes('recognitionStatus: "needs_better_photo"') &&
    fallbackPhotoDraftSource.includes("confidence: 0") &&
    !fallbackPhotoDraftSource.includes("photo-feedback:user-confirmed") &&
    !fallbackPhotoDraftSource.includes("Previously confirmed by you") &&
    photoAnalysisServiceSource.includes("language,") &&
    !/\b(Greek yogurt|Oats|Banana|Breakfast photo draft)\b/.test(fallbackPhotoDraftSource),
  "When vision providers cannot identify food, fallback must use the request language, request a better/manual photo, and must not fill the draft from templates or previous user corrections."
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

addCheck(
  "live production audit verifies public deployed chain without secrets",
  packageJsonSource.includes(
    '"audit:live": "node --env-file-if-exists=.env server/scripts/audit-live-production.mjs"'
  ) &&
    liveAuditSource.includes("https://smart-nutrition.club") &&
    liveAuditSource.includes("https://smart-nutrition-sk5r.onrender.com") &&
    liveAuditSource.includes("/api/health") &&
    liveAuditSource.includes("/api/ready") &&
    liveAuditSource.includes("robots.txt") &&
    liveAuditSource.includes("sitemap.xml") &&
    liveAuditSource.includes("manifest.webmanifest") &&
    liveAuditSource.includes("routeHeavyVendorPrefixes") &&
    liveAuditSource.includes("access-control-allow-origin") &&
    liveAuditSource.includes("access-control-allow-credentials") &&
    !/\/api\/auth\/login|@gmail\.com|sk-[A-Za-z0-9_-]{12,}|SMART_NUTRITION_.*KEY/.test(liveAuditSource),
  "Deploy verification must have a safe public live smoke command that checks Vercel, Render, SEO, CORS, assets, and sanitized health without protected auth flows or secrets."
);

addCheck(
  "authenticated live smoke requires dedicated credentials and cleans mutations",
  packageJsonSource.includes(
    '"audit:live:auth": "node --env-file-if-exists=.env server/scripts/audit-live-authenticated.mjs"'
  ) &&
    authenticatedLiveAuditSource.includes("SMART_NUTRITION_LIVE_SMOKE_EMAIL") &&
    authenticatedLiveAuditSource.includes("SMART_NUTRITION_LIVE_SMOKE_PASSWORD") &&
    authenticatedLiveAuditSource.includes("/api/auth/login") &&
    authenticatedLiveAuditSource.includes("smart-nutrition-access") &&
    authenticatedLiveAuditSource.includes("smart-nutrition-refresh") &&
    authenticatedLiveAuditSource.includes("/api/auth/session") &&
    authenticatedLiveAuditSource.includes("/api/state") &&
    authenticatedLiveAuditSource.includes("/api/water-state") &&
    authenticatedLiveAuditSource.includes("/api/water") &&
    authenticatedLiveAuditSource.includes("/api/meal/product-intake") &&
    authenticatedLiveAuditSource.includes("/api/reminders") &&
    authenticatedLiveAuditSource.includes("/api/telegram/status") &&
    authenticatedLiveAuditSource.includes("cleanup.push") &&
    authenticatedLiveAuditSource.includes("Smoke account mutations were cleaned up.") &&
    envExampleSource.includes("SMART_NUTRITION_LIVE_SMOKE_EMAIL=") &&
    envExampleSource.includes("SMART_NUTRITION_LIVE_SMOKE_PASSWORD=") &&
    envExampleSource.includes("Use a dedicated verified smoke account") &&
    !/@gmail\.com|sk-[A-Za-z0-9_-]{12,}|SMART_NUTRITION_.*KEY/.test(authenticatedLiveAuditSource),
  "Authenticated production smoke must require a dedicated verified account, use cookie sessions, verify backend-confirmed user flows, clean up smoke mutations, and avoid committed secrets."
);

addCheck(
  "mongodb adapters do not print infrastructure success details directly",
  !/console\.log/.test(mongoStorageSource) &&
    !/console\.log/.test(mongoAiRepositorySource) &&
    mongoStorageSource.includes('logger?.info?.("[mongodb] storage connected"') &&
    mongoAiRepositorySource.includes('logger?.info?.("[mongodb-ai] repository connected"') &&
    !/MongoDB database:|MongoDB host:|Connected to MongoDB Atlas database/.test(
      `${mongoStorageSource}\n${mongoAiRepositorySource}`
    ),
  "MongoDB storage and AI adapters must not print database/host success details directly to stdout; startup diagnostics must stay controlled and sanitized."
);

addCheck(
  "production config rejects AI debug stdout logging",
  serverConfigSource.includes("SMART_NUTRITION_AI_DEBUG_LOGS must be disabled in production.") &&
    /isProduction\s*&&\s*aiDebugLogging/.test(serverConfigSource) &&
    serverConfigTestSource.includes("rejects AI debug logs in production") &&
    serverConfigTestSource.includes("SMART_NUTRITION_AI_DEBUG_LOGS"),
  "Production must not allow raw AI debug stdout logging; provider diagnostics belong in controlled audit/status/error telemetry."
);

addCheck(
  "production config rejects startup debug diagnostics and startup dump is gated",
  serverConfigSource.includes(
    "SMART_NUTRITION_DEBUG_STARTUP_ENABLED must be disabled in production."
  ) &&
    /isProduction\s*&&\s*debugStartupEnabled/.test(serverConfigSource) &&
    serverConfigTestSource.includes("rejects startup debug diagnostics in production") &&
    /if\s*\(serverConfig\.debugStartupEnabled\)\s*\{[\s\S]*?logStartupDiagnostics/.test(
      serverIndexSource
    ),
  "Production must not expose /api/debug/startup or print full startup diagnostics; detailed startup dumps are development-only."
);

addCheck(
  "multi-instance production runtime requires Redis",
  serverConfigSource.includes("SMART_NUTRITION_RUNTIME_INSTANCE_COUNT") &&
    serverConfigSource.includes(
      "SMART_NUTRITION_REDIS_URL is required in production when SMART_NUTRITION_RUNTIME_INSTANCE_COUNT is greater than 1."
    ) &&
    serverConfigTestSource.includes("requires Redis for multi-instance production runtime state") &&
    serverConfigTestSource.includes("accepts single production instances without Redis") &&
    productionCheckSource.includes("Redis matches runtime instance topology") &&
    productionCheckSource.includes("required: config.runtimeInstanceCount > 1") &&
    envExampleSource.includes("SMART_NUTRITION_RUNTIME_INSTANCE_COUNT=1"),
  "A single backend instance may use memory cache/rate limiting, but multi-instance production must require Redis instead of silently drifting into per-instance state."
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
