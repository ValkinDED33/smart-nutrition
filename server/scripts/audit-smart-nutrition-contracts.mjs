import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const readSource = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");

const fileExists = (relativePath) => existsSync(path.join(rootDir, relativePath));

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
const authSliceSource = readSource("src/features/auth/authSlice.ts");
const appSource = readSource("src/App.tsx");
const syncListenersSource = readSource("src/app/syncListeners.ts");
const platformApiSource = readSource("src/shared/api/platform.ts");
const platformTypesSource = readSource("src/shared/types/platform.ts");
const visionAnalysisSource = readSource("server/services/photo/visionAnalysis.mjs");
const visionAnalysisTestSource = readSource("server/services/photo/visionAnalysis.test.mjs");
const frontendProductApiSource = readSource("src/shared/api/products.ts");
const mealCloudSyncSource = readSource("src/features/meal/mealCloudSync.ts");
const profileCloudSyncSource = readSource("src/features/profile/profileCloudSync.ts");
const waterCloudSyncSource = readSource("src/features/water/waterCloudSync.ts");
const fridgeCloudSyncSource = readSource("src/features/fridge/fridgeCloudSync.ts");
const companionCloudSyncSource = readSource(
  "src/features/companion/companionCloudSync.ts"
);
const cloudSyncErrorsSource = readSource("src/shared/lib/cloudSyncErrors.ts");
const communityCloudSyncSource = readSource(
  "src/features/community/communityCloudSync.ts"
);
const stateControllerSource = readSource("server/controllers/state.controller.mjs");
const stateServiceSource = readSource("server/services/stateService.mjs");
const authServiceSource = readSource("server/services/authService.mjs");
const authServiceTestSource = readSource("server/services/authService.test.mjs");
const errorHandlerSource = readSource("server/runtime/errorHandler.mjs");
const domainSource = readSource("server/lib/domain.mjs");
const authRepositorySource = readSource("server/repositories/authRepository.mjs");
const stateRepositorySource = readSource("server/repositories/stateRepository.mjs");
const telegramServiceSource = readSource("server/services/telegramService.mjs");
const telegramMedicationRemindersSource = readSource(
  "server/services/telegramMedicationReminders.mjs"
);
const registerPageSource = readSource("src/pages/RegisterPage.tsx");
const envExampleSource = readSource("render.env.example");
const verifyEmailPageSource = readSource("src/pages/VerifyEmailPage.tsx");
const forgotPasswordPageSource = readSource("src/pages/ForgotPasswordPage.tsx");
const resetPasswordPageSource = readSource("src/pages/ResetPasswordPage.tsx");
const onboardingWelcomeSource = readSource(
  "src/pages/onboarding/OnboardingWelcomePage.tsx"
);
const onboardingAssistantSource = readSource(
  "src/pages/onboarding/OnboardingAssistantPage.tsx"
);
const onboardingGoalSource = readSource("src/pages/onboarding/OnboardingGoalPage.tsx");
const onboardingMotivationSource = readSource(
  "src/pages/onboarding/OnboardingMotivationPage.tsx"
);
const onboardingFinishSource = readSource("src/pages/onboarding/OnboardingFinishPage.tsx");
const onboardingPageSource = readSource("src/pages/OnboardingPage.tsx");
const assistantDisplayNameSource = readSource(
  "src/features/assistant/assistantDisplayName.ts"
);
const partnerInvitePageSource = readSource("src/pages/PartnerInvitePage.tsx");
const partnerRoutesSource = readSource("server/routes/partner.routes.mjs");
const partnerServiceSource = readSource("server/services/partnerService.mjs");
const emailServiceSource = readSource("server/services/emailService.mjs");
const homePageSource = readSource("src/pages/HomePage.tsx");
const landingPageSource = readSource("src/pages/LandingPage.tsx");
const communitySliceSource = readSource("src/features/community/communitySlice.ts");
const authCookiesSource = readSource("server/runtime/authCookies.mjs");
const authRoutesSource = readSource("server/routes/auth.routes.mjs");
const profileCloudActionSource = readSource("src/features/profile/useProfileCloudAction.ts");
const profileStoreSource = readSource("src/features/profile/model/store.ts");
const profileTypesSource = readSource("src/domain/profile/types.ts");
const familyLifecycleSource = readSource("src/domain/profile/familyLifecycle.ts");
const profileCloudActionCopySource = readSource(
  "src/features/profile/profileCloudActionCopy.ts"
);
const waterCloudActionSource = readSource("src/features/water/useWaterCloudAction.ts");
const waterTrackerSource = readSource("src/features/water/WaterTracker.tsx");
const soundSource = readSource("src/shared/lib/sound.ts");
const quickWeightCheckInSource = readSource("src/features/profile/QuickWeightCheckInCard.tsx");
const adaptiveGoalCardSource = readSource("src/features/profile/AdaptiveGoalCard.tsx");
const weightTrendCardSource = readSource("src/features/profile/WeightTrendCard.tsx");
const bodyWeeklyReportCardSource = readSource("src/features/profile/BodyWeeklyReportCard.tsx");
const measurementsCheckInCardSource = readSource(
  "src/features/profile/MeasurementsCheckInCard.tsx"
);
const communityHubCardSource = readSource("src/features/community/CommunityHubCard.tsx");
const behaviorPersonalizationCardSource = readSource(
  "src/features/profile/BehaviorPersonalizationCard.tsx"
);
const barcodeScannerSource = readSource("src/features/meal/BarcodeScanner.tsx");
const barcodeScannerModelSource = readSource("src/features/meal/barcodeScannerModel.ts");
const productCardSource = readSource("src/features/meal/ProductCard.tsx");
const productNutritionFactsSource = readSource("src/features/meal/ProductNutritionFacts.tsx");
const foodCommandCenterSource = readSource("src/features/meal/FoodCommandCenter.tsx");
const foodCommandCenterModelSource = readSource(
  "src/features/meal/foodCommandCenterModel.ts"
);
const mealActionFeedbackModelSource = readSource(
  "src/features/meal/mealActionFeedbackModel.ts"
);
const mealActionFeedbackHookSource = readSource(
  "src/features/meal/useMealActionFeedback.ts"
);
const mealEntryEditorSource = readSource("src/features/meal/hooks/useMealEntryEditor.ts");
const quickMealComposerModelSource = readSource(
  "src/features/meal/quickMealComposerModel.ts"
);
const productSearchSource = readSource("src/features/meal/ProductSearch.tsx");
const quickMealComposerSource = readSource("src/features/meal/QuickMealComposer.tsx");
const quickProductShelfSource = readSource("src/features/meal/QuickProductShelf.tsx");
const recipeSectionSource = readSource("src/features/meal/RecipeSection.tsx");
const smartRecommendationsSource = readSource("src/features/meal/SmartRecommendations.tsx");
const nutritionLibraryPanelSource = readSource("src/features/meal/NutritionLibraryPanel.tsx");
const mealDayOverviewSource = readSource("src/features/meal/MealDayOverview.tsx");
const yesterdayRepeaterSource = readSource("src/features/meal/YesterdayRepeater.tsx");
const templateVaultSource = readSource("src/features/meal/TemplateVault.tsx");
const productDisplaySource = readSource("src/domain/products/productDisplay.ts");
const productMicronutrientInsightsSource = readSource(
  "src/domain/products/productMicronutrientInsights.ts"
);
const profilePageSource = readSource("src/pages/ProfilePage.tsx");
const profileFormSource = readSource("src/features/profile/ProfileForm.tsx");
const progressPageSource = readSource("src/pages/ProgressPage.tsx");
const progressOverviewCardSource = readSource(
  "src/features/profile/ProgressOverviewCard.tsx"
);
const progressOverviewModelSource = readSource(
  "src/features/profile/progressOverviewModel.ts"
);
const progressActionBarSource = readSource("src/features/profile/ProgressActionBar.tsx");
const womenHealthOverviewCardSource = readSource(
  "src/features/profile/WomenHealthOverviewCard.tsx"
);
const syncFeedbackAlertSource = readSource("src/widgets/SyncFeedbackAlert.tsx");
const syncStatusChipSource = readSource("src/widgets/SyncStatusChip.tsx");
const habitReminderAgentSource = readSource("src/widgets/HabitReminderAgent.tsx");
const syncMessagingSource = readSource("src/shared/lib/syncMessaging.ts");
const backendOfflineBannerSource = readSource("src/shared/components/BackendOfflineBanner.tsx");
const sessionRestoreFallbackSource = readSource(
  "src/shared/components/SessionRestoreFallback.tsx"
);
const cloudSyncStatusCardSource = readSource(
  "src/features/profile/CloudSyncStatusCard.tsx"
);
const accountDataCardSource = readSource("src/features/profile/AccountDataCard.tsx");
const accountDataCardCopySource = readSource("src/features/profile/accountDataCardCopy.ts");
const premiumAccessCardSource = readSource("src/features/profile/PremiumAccessCard.tsx");
const errorBoundarySource = readSource("src/shared/components/ErrorBoundary.tsx");
const lazyModuleRecoverySource = readSource("src/shared/ui/lazyModuleRecovery.ts");
const reminderManagementCardSource = readSource(
  "src/features/profile/ReminderManagementCard.tsx"
);
const reminderManagementModelSource = readSource(
  "src/features/profile/reminderManagementModel.ts"
);
const reminderApiSource = readSource("src/shared/api/reminders.ts");
const reminderRoutesSource = readSource("server/routes/reminder.routes.mjs");
const fridgeRecipePlannerSource = readSource("src/features/fridge/FridgeRecipePlanner.tsx");
const catalogContributionCardSource = readSource(
  "src/features/platform/CatalogContributionCard.tsx"
);
const catalogContributionModelSource = readSource(
  "src/features/platform/catalogContributionModel.ts"
);
const adminCenterCardSource = readSource("src/features/platform/AdminCenterCard.tsx");
const sharedLanguageSource = readSource("src/shared/language/index.tsx");
const sharedI18nUkSource = readSource("src/shared/i18n/uk.ts");
const sharedI18nPlSource = readSource("src/shared/i18n/pl.ts");
const sharedI18nEnSource = readSource("src/shared/i18n/en.ts");
const avatarPresetSource = readSource("src/shared/ui/avatar.ts");
const languageCoverageTestSource = readSource(
  "src/shared/language/languageCoverage.test.ts"
);
const productLookupServiceSource = readSource("server/services/productLookupService.mjs");
const photoDraftSource = readSource("src/features/meal/photo/photoDraft.ts");
const photoUxSource = readSource("src/features/meal/photo/photoMealAssistantUx.ts");
const photoUxTestSource = readSource("src/features/meal/photo/photoMealAssistantUx.test.ts");
const fallbackPhotoDraftSource = readSource("server/services/photo/fallbackDraft.mjs");
const photoAnalysisServiceSource = readSource("server/services/photoAnalysisService.mjs");
const serverConfigSource = readSource("server/config.mjs");
const serverConfigTestSource = readSource("server/config.test.mjs");
const serverIndexSource = readSource("server/index.mjs");
const serverErrorHandlerSource = readSource("server/runtime/errorHandler.mjs");
const aiControllerSource = readSource("server/controllers/ai.controller.mjs");
const assistantAgentServiceSource = readSource("server/agent/agent.service.mjs");
const assistantAgentActionsSource = readSource("server/agent/agent.actions.mjs");
const assistantAgentToolsSource = readSource("server/agent/agent.tools.mjs");
const assistantAgentIntentsSource = readSource("server/agent/agent.intents.mjs");
const assistantAgentMemorySource = readSource("server/agent/agent.memory.mjs");
const assistantPromptStackSource = readSource("server/services/ai/assistantPromptStack.mjs");
const aiServiceSource = readSource("server/services/ai/ai.service.mjs");
const aiSharedSource = readSource("server/services/ai/ai.shared.mjs");
const assistantApiSource = readSource("src/shared/api/assistant.ts");
const aiCompanionPageSource = readSource("src/pages/AiCompanionPage.tsx");
const ecosystemPulseSource = readSource("src/features/assistant/EcosystemPulse.tsx");
const companionProgressCardSource = readSource(
  "src/features/companion/CompanionProgressCard.tsx"
);
const assistantCustomizationCardSource = readSource(
  "src/features/profile/AssistantCustomizationCard.tsx"
);
const assistantRuntimeCardSource = readSource(
  "src/features/assistant/AssistantRuntimeCard.tsx"
);
const nutritionCoachCardSource = readSource("src/features/meal/NutritionCoachCard.tsx");
const aiDiscoveryCardsSource = readSource("src/features/assistant/AIDiscoveryCards.tsx");
const aiDiscoveryCardsModelSource = readSource(
  "src/features/assistant/aiDiscoveryCardsModel.ts"
);
const assistantContextSource = readSource("src/assistant/engine/assistantContext.ts");
const assistantRuntimeRulesSource = readSource(
  "src/assistant/engine/assistantRuntimeRules.ts"
);
const mongoStorageSource = readSource("server/storage/mongo.mjs");
const mongoAiRepositorySource = readSource("server/repositories/mongoAiRepository.mjs");
const appLayoutSource = readSource("src/app/layouts/AppLayout.tsx");
const languageMenuButtonSource = readSource("src/shared/components/LanguageMenuButton.tsx");
const mealBuilderPageSource = readSource("src/pages/MealBuilderPage.tsx");
const pwaUpdateBannerSource = readSource("src/shared/components/PwaUpdateBanner.tsx");
const recipesPageSource = readSource("src/pages/RecipesPage.tsx");
const registerServiceWorkerSource = readSource("src/shared/lib/registerServiceWorker.ts");
const errorRecoverySource = readSource("src/shared/lib/errorRecovery.ts");
const clientErrorReportingSource = readSource("src/app/runtime/clientErrorReporting.ts");
const serviceWorkerSource = readSource("public/sw.js");
const companionAvatarSource = readSource("src/features/assistant-3d/components/CompanionAvatar.tsx");
const companionCanvasSource = readSource("src/features/assistant-3d/components/CompanionCanvas.tsx");
const companionAvatarModelSource = readSource("src/features/assistant-3d/components/companionAvatarModel.ts");
const bundleAuditSource = readSource("server/scripts/audit-vite-bundle.mjs");
const liveAuditSource = readSource("server/scripts/audit-live-production.mjs");
const authenticatedLiveAuditSource = readSource("server/scripts/audit-live-authenticated.mjs");
const transactionalEmailCheckSource = readSource(
  "server/scripts/check-transactional-email.mjs"
);
const seoAuditSource = readSource("server/scripts/audit-seo-discovery.mjs");
const globalAssistantLayerSource = readSource("src/widgets/GlobalAssistantLayer.tsx");
const globalAssistantLayerModelSource = readSource("src/widgets/globalAssistantLayerModel.ts");
const packageJsonSource = readSource("package.json");
const indexHtmlSource = readSource("index.html");
const robotsTxtSource = readSource("public/robots.txt");
const sitemapXmlSource = readSource("public/sitemap.xml");
const imageSitemapXmlSource = readSource("public/sitemap-images.xml");
const llmsTxtSource = readSource("public/llms.txt");
const aiTxtSource = readSource("public/ai.txt");
const productionCheckSource = readSource("server/production-check.mjs");
const qualityGateWorkflowSource = readSource(".github/workflows/quality-gate.yml");
const gitignoreSource = readSource(".gitignore");
const projectMemorySource = readSource(".codex/PROJECT_MEMORY.md");
const projectDecisionsSource = readSource(".codex/DECISIONS.md");
const projectRulesSource = readSource(".codex/PROJECT_RULES.md");
const chiefSkillSource = readSource(".codex/skills/smart-nutrition-chief/SKILL.md");
const aiReadyDocSource = readSource("docs/AI_READY_TO_USE.md");
const aiIntegrationDocSource = readSource("docs/AI_INTEGRATION_SETUP.md");
const envSetupDocSource = readSource("docs/ENV_SETUP_GUIDE.md");
const familyWellnessDocSource = readSource("docs/FAMILY_WELLNESS_ECOSYSTEM.md");
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
  "water and weight companion reward warnings follow profile-language copy",
  waterTrackerSource.includes("rewardSyncWarning") &&
    quickWeightCheckInSource.includes("rewardSyncWarning") &&
    waterTrackerSource.includes("Воду збережено") &&
    waterTrackerSource.includes("Woda została zapisana") &&
    waterTrackerSource.includes("прогрес помічника") &&
    waterTrackerSource.includes("postęp asystenta") &&
    waterTrackerSource.includes("assistant progress") &&
    quickWeightCheckInSource.includes("Вагу збережено") &&
    quickWeightCheckInSource.includes("Waga została zapisana") &&
    !waterTrackerSource.includes("${copy.rewardSyncWarning} ${error.message}") &&
    !quickWeightCheckInSource.includes("${copy.rewardSyncWarning} ${rewardError.message}") &&
    !/Water saved, but companion progress could not sync/.test(waterTrackerSource) &&
    !/прогрес companion|postęp companion|notifications у браузері|notifications w przeglądarce/.test(
      waterTrackerSource
    ) &&
    !/Weight saved, but companion progress could not sync/.test(quickWeightCheckInSource) &&
    !/прогрес companion|postęp companion/.test(quickWeightCheckInSource),
  "Water/weight cloud saves may surface companion reward sync failure separately, but visible warnings must be localized and must not reintroduce hard-coded English or raw backend/provider copy."
);

addCheck(
  "regular cloud recovery copy hides infrastructure jargon",
  [
    backendOfflineBannerSource,
    sessionRestoreFallbackSource,
    premiumAccessCardSource,
    accountDataCardCopySource,
  ].every(
    (source) =>
      source.includes("Хмарний сервіс") ||
      source.includes("хмарною перевіркою") ||
      source.includes("захищену синхронізацію")
  ) &&
    backendOfflineBannerSource.includes("Usługa w chmurze") &&
    sessionRestoreFallbackSource.includes("Cloud service waking up") &&
    premiumAccessCardSource.includes("protected sync") &&
    accountDataCardCopySource.includes("cloud verification") &&
    !/Cloud API|cloud server|Backend прокидається|Доступ керується сервером|zarządzany przez serwer|verified by the server/.test(
      [
        backendOfflineBannerSource,
        sessionRestoreFallbackSource,
        premiumAccessCardSource,
        accountDataCardCopySource,
      ].join("\n")
    ),
  "Regular users may see cloud recovery and account status, but the visible copy must stay product-language and must not expose API/server/backend jargon."
);

addCheck(
  "premium access copy does not leak English constants into localized profile UI",
  premiumAccessCardSource.includes("Поточний") &&
    premiumAccessCardSource.includes("Aktualny") &&
    premiumAccessCardSource.includes("AI-супровід") &&
    premiumAccessCardSource.includes("Opieka AI") &&
    premiumAccessCardSource.includes("AI Guidance") &&
    premiumAccessCardSource.includes("Підсумок помічника") &&
    premiumAccessCardSource.includes("Podsumowanie asystenta") &&
    premiumAccessCardSource.includes("Assistant summary") &&
    premiumAccessCardSource.includes("Їжа і вода") &&
    premiumAccessCardSource.includes("Jedzenie i woda") &&
    premiumAccessCardSource.includes("Без активної підписки") &&
    premiumAccessCardSource.includes("Brak aktywnej subskrypcji") &&
    premiumAccessCardSource.includes("getPremiumStatusLabel(copy, premium.status)") &&
    !/coach-режим|tryb coach|coach mode|Підсумок coach|Podsumowanie coach|Coach summary/.test(
      premiumAccessCardSource
    ) &&
    !premiumAccessCardSource.includes("FOOD_WATER_TRACKING_FEATURE") &&
    !premiumAccessCardSource.includes("label={`${copy.status}: ${premium.status}`"),
  "Premium profile UI must localize plan names, feature labels, current-state labels, and subscription status instead of rendering English constants or raw enum values."
);

const localizedPersonalizationSources = [
  communityHubCardSource,
  behaviorPersonalizationCardSource,
  smartRecommendationsSource,
].join("\n");

addCheck(
  "personalization surfaces keep native profile direction language",
  localizedPersonalizationSources.includes("Ваш напрям із стартового профілю") &&
    localizedPersonalizationSources.includes("Twój kierunek z profilu startowego") &&
    localizedPersonalizationSources.includes("Your starting profile direction") &&
    localizedPersonalizationSources.includes("головний напрям звичок") &&
    localizedPersonalizationSources.includes("główny kierunek nawyków") &&
    localizedPersonalizationSources.includes("Особистий напрям") &&
    localizedPersonalizationSources.includes("Osobisty kierunek") &&
    localizedPersonalizationSources.includes("Personal direction") &&
    !/Ваш фокус із онбордингу|Twój fokus z onboardingu|Your onboarding focus|фокус на звички|fokus na nawyki|Особистий фокус|Osobisty fokus|Personal focus/.test(
      localizedPersonalizationSources
    ),
  "Community, behavior personalization, and smart recommendation copy must use profile direction language instead of onboarding/fokus planning labels."
);

addCheck(
  "scanner manual catalog fallback avoids local-only save language",
  barcodeScannerSource.includes("хмарному профілі") &&
    barcodeScannerSource.includes("profilu w chmurze") &&
    barcodeScannerSource.includes("cloud profile") &&
    !/saved locally|local-only/i.test(barcodeScannerSource) &&
    !/saved locally|local-only/i.test(readSource("src/features/meal/barcodeScannerModel.test.ts")),
  "Scanner manual product fallback may report cloud-confirmed meal/library state and retryable catalog moderation failure, but must not describe persistence as local-only."
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
  "public startup auth restore is gated by a recent session hint",
  appSource.includes("clearSavedSessionHint") &&
    appSource.includes("if (hasSessionHint)") &&
    appSource.includes("dispatch(initializeAuth())") &&
    appSource.includes("dispatch(clearSavedSessionHint())") &&
    !appSource.includes(
      "if (!isInitialized && !isLoading) {\n      dispatch(initializeAuth());"
    ),
  "Public startup must not call /api/auth/session or /api/auth/refresh for first-time guests. Returning users may restore through the existing session-hint path; guests initialize locally as unauthenticated."
);

addCheck(
  "dead-code audit has a single canonical tool",
  trackedFiles.includes("knip.json") &&
    packageJsonSource.includes('"audit:dead": "knip"') &&
    !fileExists(".depcheckrc") &&
    !packageJsonSource.includes('"depcheck"'),
  "Dead-code detection must use the canonical Knip setup only; old Depcheck config must not remain as a parallel unused-audit system."
);

addCheck(
  "AI Discovery Cards are a canonical read-only home pattern",
  homePageSource.includes("<AIDiscoveryCards") &&
    homePageSource.includes("context={dailyContext}") &&
    homePageSource.includes("intelligence={intelligence}") &&
    homePageSource.includes("onRunAction={runAssistantAction}") &&
    homePageSource.includes("buildAIDiscoveryTimeline") &&
    homePageSource.includes("const heroStory = useMemo") &&
    homePageSource.includes("aria-label={copy.heroStoryLabel}") &&
    homePageSource.includes("onClick={item.action ? () => runAssistantAction") &&
    aiDiscoveryCardsSource.includes("buildAIDiscoveryCards") &&
    aiDiscoveryCardsSource.includes("buildAIDiscoveryTimeline") &&
    aiDiscoveryCardsSource.includes("buildAIDiscoveryAura") &&
    aiDiscoveryCardsSource.includes('data-ai-discovery-aura="true"') &&
    aiDiscoveryCardsSource.includes("motion.section") &&
    aiDiscoveryCardsSource.includes("discoveryRevealVariants") &&
    aiDiscoveryCardsSource.includes("playAIDiscoverySound") &&
    aiDiscoveryCardsSource.includes("runDiscoveryAction") &&
    aiDiscoveryCardsSource.includes("aria-label={text.timelineTitle}") &&
    aiDiscoveryCardsSource.includes("runDiscoveryAction(action") &&
    aiDiscoveryCardsModelSource.includes("DailyContext") &&
    aiDiscoveryCardsModelSource.includes("AssistantHomeAction") &&
    aiDiscoveryCardsModelSource.includes("AIDiscoveryTimelineItem") &&
    aiDiscoveryCardsModelSource.includes("AIDiscoveryAura") &&
    aiDiscoveryCardsModelSource.includes("context.progress.calories") &&
    aiDiscoveryCardsModelSource.includes("context.week.daysLogged") &&
    aiDiscoveryCardsModelSource.includes("buildAIDiscoveryTimeline") &&
    aiDiscoveryCardsModelSource.includes("context.today.entries") &&
    aiDiscoveryCardsModelSource.includes("context.primaryFocus") &&
    aiDiscoveryCardsModelSource.includes("context.progress.water") &&
    !/localStorage|Math\.random|setTimeout|fetch\(|axios|mock|placeholder/i.test(
      `${aiDiscoveryCardsSource}\n${aiDiscoveryCardsModelSource}`
    ),
  "AI Discovery Cards, AI Aura, AI Timeline, motion, and optional click sound must be branded living-card layers over canonical day context and existing assistant actions, not a second AI brain, autoplay noise, random mock feed, or local-only state."
);

addCheck(
  "Living AI Interface philosophy is captured as a product contract",
  projectMemorySource.includes("Living AI Interface") &&
    projectMemorySource.includes("entering a calm AI wellness space") &&
    projectMemorySource.includes("AI Discovery Cards") &&
    projectMemorySource.includes("canonical state") &&
    projectMemorySource.includes("must not become decorative noise") &&
    projectMemorySource.includes("duplicated persistence"),
  "Smart Nutrition's signature interface direction must stay documented as a canonical, state-backed product philosophy rather than drifting into decorative effects or fake personalization."
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
  "frontend product lookup errors hide backend and provider internals",
  frontendProductApiSource.includes("getProductLookupSafeMessage") &&
    frontendProductApiSource.includes("PRODUCT_LOOKUP_AUTH_REQUIRED") &&
    frontendProductApiSource.includes("PRODUCT_LOOKUP_BACKEND_UNAVAILABLE") &&
    frontendProductApiSource.includes("PRODUCT_LOOKUP_FAILED") &&
    !/Backend session is required for product lookup|Backend unavailable for product lookup|Product lookup backend is unavailable|Product lookup timed out|Product lookup failed|payload\.message/.test(
      frontendProductApiSource
    ),
  "Frontend product lookup errors must preserve typed codes/statuses while keeping backend/provider/raw payload details out of future user-visible error.message text."
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
  "product intake catalog retry response hides raw submission errors",
  stateServiceSource.includes("CATALOG_SUBMISSION_RETRY_MESSAGE") &&
    stateServiceSource.includes("message: CATALOG_SUBMISSION_RETRY_MESSAGE") &&
    !stateServiceSource.includes("message: error instanceof Error ? error.message") &&
    !stateServiceSource.includes('"Catalog submission failed."'),
  "Product intake may save the meal when catalog moderation fails, but the API retry message must not leak raw provider/backend exception text."
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
  "telegram and AI preserve saved women-health context despite stale user gender snapshots",
  telegramServiceSource.includes("const hasWomenHealthContext =") &&
    telegramServiceSource.includes("hasWomenHealthContext(womenHealth)") &&
    !telegramServiceSource.includes(
      "womenHealth: user?.gender === \"female\" ? profile.womenHealth : undefined"
    ) &&
    aiServiceSource.includes("const normalizeWomenHealth = (value) =>") &&
    aiServiceSource.includes("const mode = allowedModes.includes(record.mode)") &&
    !aiServiceSource.includes("gender === \"female\" && allowedModes.includes(record.mode)") &&
    aiSharedSource.includes("const hasWomenHealthContext =") &&
    aiSharedSource.includes("context.womenHealth?.mode && context.womenHealth.mode !== \"none\"") &&
    !aiSharedSource.includes("context.gender === \"female\" && context.womenHealth?.mode") &&
    assistantContextSource.includes("hasWomenHealthContext(profile.womenHealth)") &&
    !assistantContextSource.includes(
      "user?.gender === \"female\"\n        ? profile.womenHealth"
    ) &&
    !assistantRuntimeRulesSource.includes("context.gender !== \"female\" || womenHealth.mode"),
  "Telegram and shared AI prompt context must use canonical women-health profile state when it exists; stale auth/user gender snapshots must not hide pregnancy, planning, postpartum, symptom, or family context from the assistant."
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
    mealBuilderPageSource.includes("<PhotoMealAssistant mealType={displayedMealType} />"),
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
  "assistant daily plans are backend-backed review-only drafts",
  assistantAgentIntentsSource.includes('intent: "generate_daily_plan"') &&
    assistantAgentIntentsSource.includes("DAILY_PLAN_PATTERN") &&
    assistantAgentServiceSource.includes('intent.intent === "generate_daily_plan"') &&
    assistantAgentServiceSource.includes("tools.generateDailyPlan(user)") &&
    assistantAgentToolsSource.includes("const generateDailyPlan = async") &&
    assistantAgentToolsSource.includes("createSnapshotSummary({ user, stateService") &&
    assistantAgentToolsSource.includes("getActiveReminders(reminders, user)") &&
    assistantAgentToolsSource.includes("buildDailyPlanDraft({ summary, activeReminders, user })") &&
    assistantAgentToolsSource.includes('type: "daily_plan_draft"') &&
    assistantAgentToolsSource.includes("reviewOnly: true") &&
    assistantAgentActionsSource.includes('toolResult.type === "daily_plan_draft"') &&
    assistantAgentActionsSource.includes("dailyPlanReviewOnly") &&
    assistantAgentMemorySource.includes('toolResult.type === "daily_plan_draft"') &&
    assistantAgentMemorySource.includes("asks assistant for reviewable daily plans") &&
    assistantPromptStackSource.includes("generateDailyPlan") &&
    !assistantPromptStackSource.includes("createDailyPlan") &&
    !/generateDailyPlan[\s\S]*stateService\.addProductIntake\(/.test(assistantAgentToolsSource) &&
    !/generateDailyPlan[\s\S]*createReminderFromUserText\(/.test(assistantAgentToolsSource),
  "AI daily planning must be a read-only review draft over canonical snapshot/reminder state, not a second meal planner, fake saved diary, or reminder creator."
);

addCheck(
  "assistant daily plan item application uses existing canonical food/reminder flows",
  assistantAgentIntentsSource.includes('intent: "apply_daily_plan_item"') &&
    assistantAgentIntentsSource.includes("APPLY_PLAN_PATTERN") &&
    assistantAgentIntentsSource.includes("readDailyPlanApplyTarget") &&
    assistantAgentServiceSource.includes('intent.intent === "apply_daily_plan_item"') &&
    assistantAgentServiceSource.includes("tools.applyDailyPlanItem(user, intent.entities)") &&
    assistantAgentToolsSource.includes("const applyDailyPlanItem = async") &&
    assistantAgentToolsSource.includes("getTypedReminderCreator(reminders, type)") &&
    assistantAgentToolsSource.includes('type: "daily_plan_item_applied"') &&
    assistantAgentToolsSource.includes('targetSurface: "food"') &&
    assistantAgentToolsSource.includes('"/meals?mode=search&focus=protein"') &&
    assistantAgentToolsSource.includes('"/meals?mode=search&focus=food"') &&
    assistantAgentActionsSource.includes('toolResult.type === "daily_plan_item_applied"') &&
    assistantAgentActionsSource.includes("dailyPlanApplyFailed") &&
    assistantAgentMemorySource.includes('toolResult.type === "daily_plan_item_applied"') &&
    assistantAgentMemorySource.includes("applies daily plan items through reminders") &&
    assistantPromptStackSource.includes("applyDailyPlanItem") &&
    mealBuilderPageSource.includes("normalizeFoodCommandFocus(searchParams.get(\"focus\"))") &&
    mealBuilderPageSource.includes("createFoodCommandFocusQuery(commandFocus)") &&
    mealBuilderPageSource.includes("initialQuery={commandFocusQuery}") &&
    foodCommandCenterSource.includes("initialQuery = \"\"") &&
    productSearchSource.includes("initialQuery = \"\"") &&
    !/applyDailyPlanItem[\s\S]*stateService\.addProductIntake\(/.test(assistantAgentToolsSource) &&
    !/applyDailyPlanItem[\s\S]*stateService\.addMealTemplate\(/.test(assistantAgentToolsSource),
  "Applying a daily plan item must route through existing food navigation or canonical reminders; it must not create a second planner or silently save meals/templates."
);

addCheck(
  "food logging uses one command center over canonical entry flows",
  mealBuilderPageSource.includes("<FoodCommandCenter") &&
    mealBuilderPageSource.includes("onOpenTarget={openFoodCommandTarget}") &&
    mealBuilderPageSource.includes('target === "catalog"') &&
    mealBuilderPageSource.includes('setActiveSection("templates")') &&
    foodCommandCenterSource.includes('data-food-command-target="photo"') &&
    foodCommandCenterSource.includes('data-food-command-target="barcode"') &&
    foodCommandCenterSource.includes('data-food-command-target="composer"') &&
    foodCommandCenterSource.includes('data-food-command-target="favorites"') &&
    foodCommandCenterSource.includes('data-food-command-target="search"') &&
    foodCommandCenterSource.includes('onClick={() => onOpenTarget("catalog")}') &&
    !mealBuilderPageSource.includes("const mealInputModes") &&
    !mealBuilderPageSource.includes("getMealInputModeCopy") &&
    !mealBuilderPageSource.includes("MEAL_INPUT_GRID_COLUMNS"),
  "Food logging must feel like one command surface. Barcode, photo, search, saved products, builder, and catalog contribution must route into existing canonical flows instead of duplicating mode-picking UI or looping catalog fallback back to search."
);

addCheck(
  "food command center parses text and voice-style meal commands through canonical intake",
  foodCommandCenterModelSource.includes("parseFoodCommandText") &&
    foodCommandCenterModelSource.includes("isFoodCommandUnitCompatible") &&
    foodCommandCenterModelSource.includes("FOOD_ACTION_PATTERN") &&
    foodCommandCenterSource.includes("parseFoodCommandText(normalizedQuery)") &&
    foodCommandCenterSource.includes('data-food-command-voice-action="speech-recognition"') &&
    foodCommandCenterSource.includes('data-food-command-intake-action="typed-command"') &&
    foodCommandCenterSource.includes("recognition.onerror = () =>") &&
    foodCommandCenterSource.includes("setActionError(copy.voiceUnavailable)") &&
    !foodCommandCenterSource.includes("setActionError(event.message") &&
    !foodCommandCenterSource.includes("event.message || event.error") &&
    foodCommandCenterSource.includes("addSelectedProduct(") &&
    foodCommandCenterSource.includes("addProductIntakeToCloud") &&
    foodCommandCenterSource.includes("parsedCommand.mealType ?? mealType") &&
    !foodCommandCenterSource.includes("localStorage") &&
    !foodCommandCenterSource.includes("addMealEntriesToCloud"),
  "Typed and browser voice food commands must resolve into the existing FoodCommandCenter and save only through backend-confirmed product intake with compatible units."
);

addCheck(
  "product corrections route through shared catalog moderation",
  productCardSource.includes('data-product-correction-action="catalog-contribution"') &&
    productCardSource.includes("<CatalogContributionCard") &&
    productCardSource.includes("initialProduct={product}") &&
    catalogContributionCardSource.includes("initialProduct") &&
    catalogContributionCardSource.includes("createCatalogContributionFormFromProduct") &&
    catalogContributionModelSource.includes("createCatalogContributionFormFromProduct") &&
    catalogContributionModelSource.includes("product.barcode?.replace(/\\D/g, \"\")") &&
    catalogContributionModelSource.includes("formatCatalogNumber(product.nutrients.calories)") &&
    catalogContributionModelSource.includes("formatCatalogNumber(product.nutrients.protein)") &&
    catalogContributionModelSource.includes("formatCatalogNumber(product.nutrients.fat)") &&
    catalogContributionModelSource.includes("formatCatalogNumber(product.nutrients.carbs)") &&
    catalogContributionCardSource.includes("categoryCustom") &&
    catalogContributionCardSource.includes("getSubmissionCategoryLabel") &&
    catalogContributionCardSource.includes("copy.categoryCustom") &&
    !catalogContributionCardSource.includes('<MenuItem value="">Manual</MenuItem>') &&
    !catalogContributionCardSource.includes('item.category ?? item.brand ?? "Manual"') &&
    !productCardSource.includes("setProduct(") &&
    !productCardSource.includes("localStorage"),
  "Product correction after scan/search must be a prefilled shared-catalog moderation submission with localized fallback labels, not a local fake product edit or second catalog persistence path."
);

addCheck(
  "reminder manager surfaces backend-confirmed adherence history",
  reminderManagementCardSource.includes("getReminderAdherenceSummary(reminder)") &&
    reminderManagementCardSource.includes("getReminderAdherenceRangeSummary(sortedItems, 7)") &&
    reminderManagementCardSource.includes("getReminderAdherenceRangeSummary(sortedItems, 30)") &&
    reminderManagementCardSource.includes('data-reminder-adherence-report="true"') &&
    reminderManagementCardSource.includes("adherence.completionRate") &&
    reminderManagementCardSource.includes("adherence.lastEvent") &&
    reminderManagementModelSource.includes("ReminderAdherenceRangeSummary") &&
    reminderManagementModelSource.includes("activeReminderCount") &&
    reminderManagementModelSource.includes("riskLevel") &&
    reminderManagementCardSource.includes("copy.eventCounts") &&
    reminderManagementCardSource.includes("copy.lastAction") &&
    reminderManagementCardSource.includes("copy.noEvents"),
  "The web reminder manager must show confirmed reminder event history and 7/30-day adherence reports from canonical backend state instead of hiding taken/skipped/snoozed actions in Telegram only."
);

addCheck(
  "event-based after-meal reminders stay visible in web reminder contracts",
  reminderRoutesSource.includes("trigger:") &&
    reminderRoutesSource.includes('kind: "after_meal"') &&
    reminderApiSource.includes("export type ReminderTrigger") &&
    reminderApiSource.includes('kind: "after_meal"') &&
    reminderManagementModelSource.includes("formatReminderScheduleLabel") &&
    reminderManagementCardSource.includes("formatReminderScheduleLabel({") &&
    reminderManagementCardSource.includes("copy.afterMealEditText"),
  "After-meal medication reminders are canonical reminder triggers backed by meal-state delivery; the API and web UI must not hide them as blank fixed-time reminders."
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
  "women health baby preview uses shared profile cloud action",
  womenHealthOverviewCardSource.includes("useProfileCloudAction") &&
    womenHealthOverviewCardSource.includes("getProfileCloudActionCopy") &&
    womenHealthOverviewCardSource.includes("profileActionCopy") &&
    womenHealthOverviewCardSource.includes(
      "profileAction.runProfileStateSave(nextProfile)"
    ) &&
    womenHealthOverviewCardSource.includes("profileActionCopy.saveInProgress") &&
    womenHealthOverviewCardSource.includes("buildProfileStateAfterAction") &&
    womenHealthOverviewCardSource.includes("updateWomenHealth(womenHealthPatch)") &&
    !womenHealthOverviewCardSource.includes("saveProfileStateToCloud") &&
    !womenHealthOverviewCardSource.includes("replaceProfileState(nextProfile)"),
  "Women-health baby preview is profile state and must use the shared cloud-confirmed profile action path instead of a component-local save/replace path."
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
  "telegram after-meal reminders explain diary-triggered timing",
  telegramMedicationRemindersSource.includes("afterMealCreatedHint") &&
    telegramMedicationRemindersSource.includes("afterMealNotificationHint") &&
    telegramMedicationRemindersSource.includes("triggerWindow") &&
    telegramMedicationRemindersSource.includes("offsetMinutes") &&
    telegramMedicationRemindersSource.includes("buildAfterMealCreatedHint(reminder, language)") &&
    telegramMedicationRemindersSource.includes("buildAfterMealNotificationHint(reminder, language)") &&
    telegramMedicationRemindersSource.includes("formatReminderTriggerWindow(reminder, language)") &&
    !telegramMedicationRemindersSource.includes("`${label} +${offsetMinutes} min`"),
  "After-meal Telegram reminders must explain that they fire from a real meal diary entry, keep the active language, and avoid presenting a fixed time as truth."
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
  ["\"language\"", "\"theme\"", "\"name\"", "\"email\"", "\"password\""].every(
    (step) => registerPageSource.includes(step)
  ) &&
    registerPageSource.includes("{...passwordField}") &&
    registerPageSource.includes("confirmPasswordField") &&
    registerPageSource.includes("const shouldShowConfirmPasswordError") &&
    registerPageSource.includes("Boolean(dirtyFields.confirmPassword)") &&
    registerPageSource.includes("Boolean(touchedFields.confirmPassword)") &&
    registerPageSource.includes("submitCount > 0") &&
    registerPageSource.includes("error={shouldShowConfirmPasswordError}") &&
    registerPageSource.includes("shouldShowConfirmPasswordError") &&
    registerPageSource.includes("PasswordVisibilityButton") &&
    !registerPageSource.includes('| "confirm"') &&
    !registerPageSource.includes('case "confirm"') &&
    !registerPageSource.includes('registrationStep === "confirm"') &&
    registerPageSource.includes("checkRegistrationAvailability") &&
    registerPageSource.includes('data-register-verification-panel="true"') &&
    registerPageSource.includes('data-register-delivery-failure-panel="true"') &&
    registerPageSource.includes('data-register-account-form="true"') &&
    registerPageSource.includes("const showRegistrationForm = !pendingVerification && !deliveryUnavailableEmail") &&
    registerPageSource.includes("{showRegistrationForm && (") &&
    registerPageSource.includes("setDeliveryUnavailableEmail(data.email)") &&
    registerPageSource.includes("void handleSubmit(onSubmit)();") &&
    registerPageSource.includes("pendingVerification ? (") &&
    registerPageSource.includes("languagePreference: appLanguage") &&
    registerPageSource.includes("availabilityBlocksNext") &&
    registerPageSource.includes("availabilityBlocksSubmit") &&
    registerPageSource.includes("disabled={availabilityBlocksNext}") &&
    registerPageSource.includes("disabled={submitting || availabilityBlocksSubmit}") &&
    registerPageSource.includes('setRegistrationStep("name")') &&
    registerPageSource.includes('setRegistrationStep("email")'),
  "Registration must stay a guided language/theme/account flow, pass the selected app language into backend profile creation, and block taken, unchecked, stale, or unavailable name/email values before account creation."
);

addCheck(
  "new-user community seed follows the selected profile language",
  authServiceSource.includes("languagePreference: readEnumValue") &&
    authServiceSource.includes("createInitialCommunityState(user.languagePreference)") &&
    domainSource.includes("const communitySeeds") &&
    domainSource.includes("createInitialCommunityState = (languagePreference = \"uk\")") &&
    domainSource.includes("communitySeeds[normalizeAppLanguage(languagePreference)]") &&
    domainSource.includes("Białkowe śniadanie w słoiku") &&
    domainSource.includes("Білковий сніданок у банці") &&
    communitySliceSource.includes("Білковий сніданок у банці") &&
    communitySliceSource.includes("Коуч Smart Nutrition") &&
    !/High-protein breakfast jar|How I broke a hydration slump|Собрала белковый|Сегодня делаю|Если вес стоит|стаканы наконец/.test(
      communitySliceSource
    ),
  "The first community experience must use the selected profile language from registration; frontend fallback defaults must not show mixed English/Russian seed content before cloud restore."
);

addCheck(
  "assistant naming stays user-owned and display-safe",
  domainSource.includes("assistantName: \"\"") &&
    onboardingAssistantSource.includes("getAssistantPreviewName") &&
    !onboardingAssistantSource.includes("disabled={state.assistantName.trim()") &&
    onboardingFinishSource.includes("name: state.assistantName.trim()") &&
    assistantDisplayNameSource.includes("legacyAssistantNames") &&
    assistantDisplayNameSource.includes("getAssistantFallbackName") &&
    assistantDisplayNameSource.includes("getAssistantDisplayName") &&
    ["ваш помічник", "Twój asystent", "your assistant"].every((fallback) =>
      assistantDisplayNameSource.includes(fallback)
    ),
  "The assistant must not get a fake default name or block onboarding. Empty or legacy names remain empty in cloud state and only use localized display fallbacks in UI."
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

const updatePasswordIndex = authServiceSource.indexOf("await authRepository.updateUserPassword?.");
const consumeResetTokenIndex = authServiceSource.indexOf(
  "await authRepository.markPasswordResetTokenConsumed?."
);

addCheck(
  "password reset updates password before consuming reset token",
  updatePasswordIndex >= 0 &&
    consumeResetTokenIndex >= 0 &&
    updatePasswordIndex < consumeResetTokenIndex &&
    authServiceTestSource.includes(
      "keeps a password reset token usable when the password update fails"
    ) &&
    authServiceTestSource.includes("markPasswordResetTokenConsumed).not.toHaveBeenCalled()"),
  "Password reset tokens must not be consumed until the new password is saved; otherwise a transient database failure can burn the only recovery link without changing the password."
);

addCheck(
  "auth and community visible errors hide raw API exception text",
  resetPasswordPageSource.includes("AUTH_INVALID_RESET_TOKEN_KEY") &&
    resetPasswordPageSource.includes('t("auth.weakResetPassword")') &&
    !resetPasswordPageSource.includes("setServerError(error.message)") &&
    forgotPasswordPageSource.includes('t("auth.forgotGenericError")') &&
    !forgotPasswordPageSource.includes(": error.message") &&
    communityHubCardSource.includes("saveFailed") &&
    communityHubCardSource.includes("message: copy.saveFailed") &&
    communityHubCardSource.includes("Спільнота Smart Nutrition") &&
    communityHubCardSource.includes("Społeczność Smart Nutrition") &&
    communityHubCardSource.includes("Оновлення стрічки") &&
    communityHubCardSource.includes("synchronizacji w chmurze") &&
    communityHubCardSource.includes('like: "Підтримати"') &&
    communityHubCardSource.includes('like: "Wesprzyj"') &&
    !/локальний статус community|lokalny status community|local community status/.test(
      communityHubCardSource
    ) &&
    !communityHubCardSource.includes("getCommunityErrorMessage") &&
    !communityHubCardSource.includes("error instanceof Error && error.message") &&
    !communityHubCardSource.includes("Could not save community changes. Please try again."),
  "Auth recovery and community action failures must render localized product-language retry copy instead of raw backend/API exception text; regular community controls must not leak English or implementation-status wording into localized UI."
);

addCheck(
  "onboarding finish sync failures hide raw API exception text",
  onboardingFinishSource.includes('const message = t("error.genericProfile")') &&
    onboardingFinishSource.includes("enqueueSyncOutbox(message)") &&
    onboardingFinishSource.includes("markSyncError(message)") &&
    !onboardingFinishSource.includes("error instanceof Error") &&
    !onboardingFinishSource.includes("error.message"),
  "Final onboarding save failures must keep sync outbox and visible alerts in localized product-language recovery copy."
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
  profileCloudActionSource.includes("saveProfileStateToCloudWithConflictRebase") &&
    profileCloudActionSource.includes("saveProfileAndUserToCloud") &&
    profileCloudActionSource.includes("replaceProfileState") &&
    profileCloudActionSource.includes("setUser") &&
    profileCloudActionSource.includes("throw caughtError"),
  "Profile settings must use the shared cloud action path and throw on failed persistence instead of fake success."
);

addCheck(
  "combined profile-state saves reject duplicate names before state persistence",
    authServiceSource.includes("const assertProfileNameAvailable") &&
    authServiceSource.includes("existingNameUser.id !== currentUserId") &&
    authServiceSource.includes('throw new AuthApiError("NAME_IN_USE"') &&
    authServiceSource.indexOf("await assertProfileNameAvailable(profileInput.name, currentUser.id)") <
      authServiceSource.indexOf("const atomicResult") &&
    errorHandlerSource.includes('error.code === "NAME_IN_USE"') &&
    errorHandlerSource.includes("This name is already used."),
  "Combined profile/user updates must reject duplicate names with a public conflict before writing profile-state so failed user updates cannot leave partial cloud state."
);

addCheck(
  "combined profile-state saves prefer atomic backend-confirmed profile",
  authRoutesSource.includes("saveProfileAndUser:") &&
    authRoutesSource.includes("stateService.saveProfileStateWithUser") &&
    authServiceSource.includes("typeof saveProfileAndUser === \"function\"") &&
    authServiceSource.includes("assertCombinedProfileSaveResult") &&
    authServiceSource.includes("assertProfileStatePersistenceError") &&
    authServiceSource.includes("[auth] profile-state persistence failed") &&
    authServiceSource.includes("\"STATE_SYNC_UNAVAILABLE\"") &&
    authServiceSource.includes("const atomicResult") &&
    authServiceSource.includes("atomicResult?.profile ?? (await saveProfileState(body?.profile))") &&
    authServiceSource.includes("!isRecord(updatedUser) || !isRecord(savedProfile)") &&
    authServiceSource.includes("profile: savedProfile") &&
    stateServiceSource.includes("saveProfileStateWithUser") &&
    stateServiceSource.includes(
      'if (typeof stateRepository.upsertUserProfileAndState === "function")'
    ) &&
    stateRepositorySource.includes("upsertUserProfileAndState") &&
    stateRepositorySource.includes(
      'if (typeof storage.upsertUserProfileAndState === "function")'
    ) &&
    !stateRepositorySource.includes("storage.upsertUserProfileAndState?.") &&
    !stateRepositorySource.includes("?? null") &&
    mongoStorageSource.includes("upsertUserProfileAndState") &&
    mongoStorageSource.includes("await session.withTransaction(async () =>") &&
    mongoStorageSource.includes("isMongoTransactionUnsupportedError") &&
    mongoStorageSource.includes("writeProfileAndUserDocumentsWithoutTransaction") &&
    mongoStorageSource.includes("error instanceof StateApiError") &&
    authRemoteSource.includes("profile?: unknown") &&
    authRemoteSource.includes("profile: data.profile") &&
    authRemoteSource.includes("profileUpdatedAt:") &&
    profileCloudSyncSource.includes("normalizeProfileState(rebasedResult.profile ?? rebasedProfile)") &&
    profileCloudSyncSource.includes("normalizeProfileState(result.profile ?? profile)"),
  "Combined profile/user updates must use an atomic storage save when available and return the normalized backend-confirmed profile so frontend state cannot drift from the cloud source of truth."
);

addCheck(
  "mongodb profile-state writes use transactional CAS instead of check-then-write",
  mongoStorageSource.includes("const writeProfileAndUserDocuments = async (session) =>") &&
    mongoStorageSource.includes("await session.withTransaction(async () =>") &&
    mongoStorageSource.includes(
      "normalizedSyncContext.baseVersion\n              ? { userId, updatedAt: normalizedSyncContext.baseVersion }"
    ) &&
    mongoStorageSource.includes("if (normalizedSyncContext.baseVersion && stateUpdate.matchedCount === 0)") &&
    mongoStorageSource.includes("const userUpdate = await collections.users.updateOne(") &&
    mongoStorageSource.includes("{ session }") &&
    mongoStorageSource.indexOf("const writeProfileAndUserDocuments = async (session)") <
      mongoStorageSource.indexOf("const writeProfileAndUserDocumentsWithoutTransaction") &&
    !/const writeProfileAndUserDocuments = async \(session\)[\s\S]*?Promise\.all[\s\S]*?const writeProfileAndUserDocumentsWithoutTransaction/.test(
      mongoStorageSource
    ),
  "Mongo combined profile/user saves must keep profile, state meta, and user writes in one transaction when supported, compare baseVersion inside the states.updateOne filter, and avoid Promise.all inside the transaction."
);

addCheck(
  "mongodb full snapshot writes compare state version inside the write filter",
  mongoStorageSource.includes("const writeSnapshot = async (") &&
    mongoStorageSource.includes("const writeSnapshotDocuments = async (session = undefined)") &&
    mongoStorageSource.includes("await session.withTransaction(async () =>") &&
    mongoStorageSource.includes("baseVersion ? { userId, updatedAt: baseVersion } : { userId }") &&
    mongoStorageSource.includes("if (baseVersion && stateUpdate.matchedCount === 0)") &&
    !/const writeSnapshotDocuments = async \(session = undefined\)[\s\S]*?Promise\.all[\s\S]*?const writeSnapshotDocumentsWithoutTransaction/.test(
      mongoStorageSource
    ),
  "Mongo full snapshot saves must use compare-and-set on states.updatedAt in the write operation itself so concurrent device writes return STATE_CONFLICT instead of silently overwriting each other."
);

addCheck(
  "expired token cleanup is scheduled outside the request hot path",
  serverIndexSource.includes("const runTokenCleanup = () =>") &&
    serverIndexSource.includes("scheduleTokenCleanup(serverConfig.tokenCleanupIntervalMs)") &&
    serverIndexSource.includes("runTokenCleanup();\nscheduleTokenCleanup();") &&
    !/const routeRequest = async[\s\S]*?authService\.cleanupExpiredSessions\(\)[\s\S]*?const server = http\.createServer/.test(
      serverIndexSource
    ),
  "Expired session/reset/verification token cleanup must run as startup/scheduled housekeeping, not as a global storage delete scan on every API request."
);

addCheck(
  "profile-only saves rebase cloud conflicts instead of surfacing stale-profile failure",
  profileCloudSyncSource.includes("rebaseProfileStateChange") &&
    profileCloudSyncSource.includes("saveProfileStateToCloudWithConflictRebase") &&
    profileCloudSyncSource.includes("applyProfileStateDelta") &&
    profileCloudSyncSource.includes("syncRemoteProfileState(rebasedProfile)") &&
    profileCloudActionSource.includes("saveProfileStateToCloudWithConflictRebase") &&
    profileCloudActionSource.includes("dispatch(replaceProfileState(saved.profile))"),
  "Direct profile state saves must replay the user's profile change on top of the latest cloud snapshot after STATE_CONFLICT, not ask ordinary users to repeat the same action or overwrite fresh cloud fields with stale local state."
);

addCheck(
  "auth and onboarding profile bootstrap use shared cloud-confirmed action path",
  registerPageSource.includes("useProfileCloudAction") &&
    registerPageSource.includes("getProfileCloudActionCopy") &&
    registerPageSource.includes(
      "profileAction.runProfileStateSave(sessionProfile)"
    ) &&
    !registerPageSource.includes("saveProfileStateToCloud") &&
    !registerPageSource.includes("replaceProfileState(sessionProfile)") &&
    verifyEmailPageSource.includes("useProfileCloudAction") &&
    verifyEmailPageSource.includes("getProfileCloudActionCopy") &&
    verifyEmailPageSource.includes(
      "profileActionRef.current.runProfileStateSave(sessionProfile)"
    ) &&
    !verifyEmailPageSource.includes("saveProfileStateToCloud") &&
    !verifyEmailPageSource.includes("replaceProfileState(sessionProfile)") &&
    onboardingFinishSource.includes("useProfileCloudAction") &&
    onboardingFinishSource.includes("getProfileCloudActionCopy") &&
    onboardingFinishSource.includes("const applyOnboardingProfilePatch =") &&
    onboardingFinishSource.includes("profileAction.runProfileAndUserSave(") &&
    onboardingFinishSource.includes("applyOnboardingProfilePatch") &&
    !onboardingFinishSource.includes("saveProfileAndUserToCloud") &&
    !onboardingFinishSource.includes("replaceProfileState(nextProfile)"),
  "Registration, email verification, and onboarding completion must not own a second profile save/replace path; they must use the shared profile cloud-action hook, and final onboarding must replay the same answer patch after a cloud conflict."
);

addCheck(
  "onboarding finish keeps finish-now separate from optional personalization",
  onboardingGoalSource.includes("navigate(stepPaths.finish)") &&
    onboardingMotivationSource.includes("personalizationCompleted: true") &&
    onboardingFinishSource.includes(
      "const canContinuePersonalization = !state.personalizationCompleted"
    ) &&
    onboardingFinishSource.includes("const continuePersonalization = () =>") &&
    onboardingFinishSource.includes("navigate(stepPaths.friction)") &&
    onboardingFinishSource.includes(
      'data-onboarding-continue-personalization="true"'
    ) &&
    !onboardingFinishSource.includes('saveOnboarding("/profile")') &&
    !onboardingFinishSource.includes('navigate("/profile"'),
  "Finish now must be the only path that marks onboarding complete; continuing personalization must keep the draft open and route into the optional questionnaire."
);

addCheck(
  "protected onboarding redirects enter the choice step directly",
  appSource.includes('const ONBOARDING_ENTRY_PATH = "/onboarding/choice"') &&
    appSource.includes("to={ONBOARDING_ENTRY_PATH}") &&
    registerPageSource.includes('navigate("/onboarding/choice")') &&
    verifyEmailPageSource.includes('"/onboarding/choice"') &&
    onboardingPageSource.includes(
      '<Route index element={<Navigate to={stepPaths.choice} replace />} />'
    ),
  "Authenticated users who still need onboarding must land on the explicit continue-or-skip choice, not a root onboarding screen that feels like language/theme setup is being repeated."
);

addCheck(
  "onboarding welcome has no disabled language placeholder",
  !onboardingWelcomeSource.includes('value="add"') &&
    !onboardingWelcomeSource.includes('t("language.add")') &&
    !/disabled[\s\S]{0,220}language\.add/.test(onboardingWelcomeSource),
  "Onboarding language setup must offer only real selectable languages; disabled add-language placeholders are dead UI."
);

addCheck(
  "saved women-health context controls unfinished onboarding gender seed",
  onboardingPageSource.includes("shouldUseProfileWomenHealth") &&
    onboardingPageSource.includes('shouldUseProfileWomenHealth\n              ? "female"') &&
    onboardingPageSource.includes("hasWomenHealthContext(profile.womenHealth)") &&
    !onboardingPageSource.includes(
      '!onboardingCompleted && hasDraft ? draft.gender : user?.gender ?? "male"'
    ),
  "Unfinished onboarding must seed female-context state from saved canonical women-health profile data so final onboarding cannot erase pregnancy/family answers because the auth user snapshot is stale."
);

addCheck(
  "onboarding completion failures are retryable and preserve draft answers",
  onboardingFinishSource.includes("writePreAuthOnboardingDraft") &&
    onboardingFinishSource.includes("preserveDraft();") &&
    onboardingFinishSource.includes('data-onboarding-save-recovery="true"') &&
    onboardingFinishSource.includes('t("onboarding.retrySave")') &&
    onboardingFinishSource.includes('t("onboarding.backToAnswers")'),
  "A failed final profile save must not discard onboarding answers; the UI needs an explicit retry and safe return path."
);

addCheck(
  "quick weight save rebases cloud conflicts instead of surfacing fake failure",
  quickWeightCheckInSource.includes("profileAction.runProfileAndUserSave") &&
    quickWeightCheckInSource.includes("buildProfileStateAfterWeightSave") &&
    quickWeightCheckInSource.includes("(freshProfile) =>") &&
    quickWeightCheckInSource.includes(
      "buildProfileStateAfterWeightSave(freshProfile, roundedWeight)"
    ) &&
    profileCloudSyncSource.includes(
      "saveProfileAndUserToCloudWithConflictRebase"
    ) &&
    profileCloudSyncSource.includes(
      "recoverLatestCloudSnapshotAfterConflict(dispatch)"
    ) &&
    profileCloudSyncSource.includes("const rebasedProfile = rebaseProfile(freshProfile)") &&
    profileCloudSyncSource.includes(
      "const rebasedResult = await syncRemoteProfileWithUser(user, rebasedProfile)"
    ),
  "Quick weight check-ins must preserve backend-confirmed success while automatically replaying the same user intent on top of the latest cloud snapshot after a STATE_CONFLICT."
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
  "scanner water and AI discovery sounds avoid base64 audio decoding crashes",
  soundSource.includes("createOscillator") &&
    soundSource.includes("playUiTickSound") &&
    soundSource.includes("playAIDiscoverySound") &&
    waterTrackerSource.includes("playUiTickSound") &&
    aiDiscoveryCardsSource.includes("playAIDiscoverySound") &&
    aiDiscoveryCardsSource.includes("runDiscoveryAction") &&
    !soundSource.includes("atob") &&
    !soundSource.includes("base64") &&
    !soundSource.includes("data:audio") &&
    !soundSource.includes("Howl") &&
    !soundSource.includes("howler") &&
    !waterTrackerSource.includes("use-sound") &&
    !waterTrackerSource.includes("uiTickSoundDataUrl"),
  "Scanner, water, and AI discovery feedback must use Web Audio oscillator tones only and play from user-driven UI actions; embedded base64 audio or Howler/use-sound decoding can crash Android/WebView with InvalidCharacterError."
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
  "product card details use branded magic expand without replacing canonical actions",
  productCardSource.includes("productRevealVariants") &&
    productCardSource.includes("playGentleClickSound") &&
    productCardSource.includes('data-product-magic-expand="nutrition-facts"') &&
    productCardSource.includes('data-product-magic-expand-panel="nutrition-facts"') &&
    productCardSource.includes('data-product-magic-expand="catalog-correction"') &&
    productCardSource.includes("aria-expanded={detailsOpen}") &&
    productCardSource.includes("aria-expanded={correctionOpen}") &&
    productCardSource.includes("rotate(180deg)") &&
    productCardSource.includes("<ProductNutritionFacts product={product} />") &&
    productCardSource.includes("addProductIntakeToCloud") &&
    productCardSource.includes("saveMealProductToCloud"),
  "Product card expand/collapse interactions must feel like the Smart Nutrition living UI while preserving canonical product add, save, details, and catalog-correction flows."
);

addCheck(
  "progress overview keeps water glasses visible and opens counted domains",
  progressPageSource.includes("getSectionForProgressDomain") &&
    progressPageSource.includes('case "water":') &&
    progressPageSource.includes('return "water";') &&
    progressPageSource.includes("onSelectDomain") &&
    progressOverviewCardSource.includes("createProgressOverviewItems") &&
    progressOverviewCardSource.includes("formatProgressPercent") &&
    progressOverviewCardSource.includes("getProgressToneColor") &&
    progressOverviewModelSource.includes("caloriesProgress") &&
    progressOverviewModelSource.includes("proteinProgress") &&
    progressOverviewModelSource.includes("waterProgress") &&
    progressOverviewModelSource.includes("mealsProgress") &&
    progressOverviewModelSource.includes("weightProgress") &&
    progressOverviewModelSource.includes("checkInProgress") &&
    progressOverviewCardSource.includes("createWaterGlassSlots") &&
    progressOverviewCardSource.includes("overviewWaterGlasses") &&
    progressOverviewCardSource.includes('data-testid="overview-water-glass"') &&
    progressOverviewCardSource.includes("data-progress-domain={item.domain}") &&
    progressOverviewCardSource.includes("onSelectDomain?.(item.domain)") &&
    !progressOverviewCardSource.includes("const caloriesProgress"),
  "Progress must show all counted domains through a tested model, keep water glass slots in the first overview, and let users open detail tabs from each counted-domain card."
);

addCheck(
  "progress surface accessibility and copy actions stay localized",
  progressPageSource.includes("sectionsAriaLabel") &&
    progressPageSource.includes("ariaLabel={copy.sectionsAriaLabel}") &&
    !progressPageSource.includes('ariaLabel="Progress sections"') &&
    progressActionBarSource.includes("reportTitle") &&
    progressActionBarSource.includes("copyText.reportTitle") &&
    !progressActionBarSource.includes("PROGRESS_REPORT_TITLE"),
  "Progress tabs and copied progress reports must use active-language copy instead of hardcoded English labels."
);

addCheck(
  "progress overview check-in label stays localized",
  progressOverviewCardSource.includes('checkIn: "Заміри"') &&
    progressOverviewCardSource.includes('checkIn: "Pomiary"') &&
    progressOverviewCardSource.includes('checkIn: "Check-in"') &&
    !progressOverviewCardSource
      .slice(progressOverviewCardSource.indexOf("uk:"), progressOverviewCardSource.indexOf("en:"))
      .includes('checkIn: "Check-in"'),
  "Ukrainian and Polish progress overview cards must describe body measurements in native product language; English Check-in is allowed only in the English copy branch."
);

const localizedSectionTabSources = [
  homePageSource,
  mealBuilderPageSource,
  recipesPageSource,
  profilePageSource,
  nutritionLibraryPanelSource,
  quickProductShelfSource,
].join("\n");

addCheck(
  "primary section tabs use active-language accessibility copy",
  homePageSource.includes("ariaLabel={copy.sectionsAriaLabel}") &&
    mealBuilderPageSource.includes("ariaLabel={copy.sectionsAriaLabel}") &&
    mealBuilderPageSource.includes("ariaLabel={copy.addToolsAriaLabel}") &&
    recipesPageSource.includes("ariaLabel={sections.sectionsAriaLabel}") &&
    profilePageSource.includes("ariaLabel={copy.sectionsAriaLabel}") &&
    nutritionLibraryPanelSource.includes("ariaLabel={labels.sectionsAriaLabel}") &&
    quickProductShelfSource.includes('ariaLabel={t("quickShelf.sectionsAriaLabel")}') &&
    sharedLanguageSource.includes("Розділи швидких продуктів") &&
    sharedLanguageSource.includes("Sekcje szybkich produktów") &&
    sharedI18nEnSource.includes("Quick product sections") &&
    !/ariaLabel="(?:Dashboard sections|Meal sections|Meal add tools|Recipe page sections|Profile sections|Nutrition library sections|Quick product shelf sections)"/.test(
      localizedSectionTabSources
    ),
  "Primary product SectionTabs must expose localized accessibility labels instead of hardcoded English navigation labels."
);

addCheck(
  "profile avatar presets use localized visible and accessibility copy",
  profileFormSource.includes("avatarImageAlt") &&
    profileFormSource.includes("avatarPresetAction") &&
    profileFormSource.includes("getAvatarPresetLabel(copy, preset.id)") &&
    profileFormSource.includes("alt={copy.avatarImageAlt}") &&
    profileFormSource.includes("alt={presetLabel}") &&
    profileFormSource.includes("aria-label={copy.avatarPresetAction(presetLabel)}") &&
    profileFormSource.includes("Ліс") &&
    profileFormSource.includes("Wschód słońca") &&
    !profileFormSource.includes("{preset.label}") &&
    !avatarPresetSource.includes('aria-label="Avatar"'),
  "Profile avatar preset buttons must show active-language labels and must not expose generic English avatar labels from SVG data URLs."
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

addCheck(
  "transactional email has a Brevo primary and Resend reserve inside the canonical email service",
  emailServiceSource.includes("BREVO_TRANSACTIONAL_EMAIL_URL") &&
    emailServiceSource.includes("https://api.brevo.com/v3/smtp/email") &&
    emailServiceSource.includes("EMAIL_PROVIDER_TIMEOUT_MS") &&
    emailServiceSource.includes("createTimeoutSignal") &&
    emailServiceSource.includes("signal: timeoutSignal.signal") &&
    emailServiceSource.includes("const sendWithBrevo") &&
    emailServiceSource.includes("const sendWithResend") &&
    emailServiceSource.includes("[email] brevo delivery attempt failed") &&
    emailServiceSource.includes("falling back to resend transactional delivery") &&
    emailServiceSource.includes("provider: brevo ? BREVO_PROVIDER : RESEND_PROVIDER") &&
    packageJsonSource.includes(
      '"email:check": "node --env-file-if-exists=.env server/scripts/check-transactional-email.mjs"'
    ) &&
    transactionalEmailCheckSource.includes("Transactional email delivery is configured.") &&
    transactionalEmailCheckSource.includes("Available providers:") &&
    transactionalEmailCheckSource.includes("SMART_NUTRITION_EMAIL_CHECK_TO") &&
    transactionalEmailCheckSource.includes("sendRegistrationVerificationEmail") &&
    transactionalEmailCheckSource.includes("Transactional email real delivery smoke passed.") &&
    transactionalEmailCheckSource.includes("Transactional email real delivery smoke failed.") &&
    transactionalEmailCheckSource.includes("SMART_NUTRITION_BREVO_API_KEY or SMART_NUTRITION_RESEND_API_KEY") &&
    !packageJsonSource.includes("check-resend-email.mjs") &&
    !transactionalEmailCheckSource.includes("Resend email delivery is not configured"),
  "Registration, password reset, and partner invite emails must use one canonical email service with Brevo as the primary transactional provider, timeout/retry protection, Resend as reserve, and one provider-neutral diagnostic command that can optionally prove real delivery."
);

addCheck(
  "production transactional email sender address is validated before startup",
  serverConfigSource.includes("isValidEmailAddress") &&
    serverConfigSource.includes(
      "SMART_NUTRITION_EMAIL_FROM_ADDRESS must be a valid email address in production."
    ) &&
    serverConfigTestSource.includes("rejects invalid production transactional email sender addresses") &&
    serverConfigTestSource.includes("noreplyàsmart-nutrition.club"),
  "Production must not report email as configured when the sender address is malformed; invalid sender addresses must fail config validation before registration users see delivery errors."
);

addCheck(
  "partner invites support email delivery through the canonical invite contract",
  partnerRoutesSource.includes("partnerEmail: body?.partnerEmail") &&
    partnerServiceSource.includes("normalizeEmail") &&
    partnerServiceSource.includes("emailService?.sendPartnerInviteEmail") &&
    partnerServiceSource.includes("delivery: partnerEmail ? \"email\" : \"manual\"") &&
    emailServiceSource.includes("sendPartnerInviteEmail") &&
    emailServiceSource.includes("private profile data are not shared") &&
    authRemoteSource.includes("partnerEmail?: string") &&
    authRemoteSource.includes("body: JSON.stringify({ partnerEmail") &&
    womenHealthOverviewCardSource.includes("partnerEmail") &&
    womenHealthOverviewCardSource.includes("copy.partnerEmailLabel") &&
    womenHealthOverviewCardSource.includes("createRemotePartnerInvite(partnerEmail)") &&
    womenHealthOverviewCardSource.includes("copy.partnerEmailDeliveryFailed"),
  "Family partner invitations must offer QR/code/link plus optional email delivery through the same backend invite and privacy-scoped partner-sharing contract, not a second family invite system."
);

addCheck(
  "partner pregnancy share exposes full weekly baby development context",
  partnerServiceSource.includes("weeklyPregnancyDevelopment") &&
    partnerServiceSource.includes("getPregnancyAge") &&
    partnerServiceSource.includes("completedWeeks") &&
    partnerServiceSource.includes("trimester: getTrimester(week)") &&
    partnerServiceSource.includes("month: getPregnancyMonth(totalDays)") &&
    partnerServiceSource.includes("lengthCm") &&
    partnerServiceSource.includes("weightG") &&
    partnerServiceSource.includes("timeline: age") &&
    authRemoteSource.includes("timeline: {") &&
    authRemoteSource.includes("completedWeeks: number") &&
    authRemoteSource.includes("lengthCm: number") &&
    womenHealthOverviewCardSource.includes('data-partner-pregnancy-weekly-view="true"') &&
    womenHealthOverviewCardSource.includes('data-partner-baby-week-visual="true"') &&
    womenHealthOverviewCardSource.includes("BabyWeekVisual") &&
    womenHealthOverviewCardSource.includes("getBabyVisualPalette") &&
    womenHealthOverviewCardSource.includes("copy.partnerBabyThisWeek") &&
    womenHealthOverviewCardSource.includes("formatPregnancyAge") &&
    womenHealthOverviewCardSource.includes("share.timeline?.trimester") &&
    womenHealthOverviewCardSource.includes("share.timeline?.month") &&
    womenHealthOverviewCardSource.includes("share.baby.lengthCm") &&
    womenHealthOverviewCardSource.includes("share.baby.weightG"),
  "A connected partner must see a complete pregnancy timeline: weeks plus days, trimester, month, days to due date, baby size equivalent, length, weight, and weekly development copy through the existing scoped partner-sharing endpoint."
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
    polishedPolishSyncSources.includes("Nie udało się zapisać lodówki. Spróbuj ponownie.") &&
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

addCheck(
  "saved nutrition library is one hub over canonical meal and community state",
  nutritionLibraryPanelSource.includes('data-my-library-overview="true"') &&
    nutritionLibraryPanelSource.includes("savedOverviewItems") &&
    nutritionLibraryPanelSource.includes("count: savedProducts.length") &&
    nutritionLibraryPanelSource.includes("count: templates.length") &&
    nutritionLibraryPanelSource.includes("count: visibleSavedPosts.length") &&
    nutritionLibraryPanelSource.includes("useSelector(selectSavedProducts)") &&
    nutritionLibraryPanelSource.includes("useSelector(selectMealTemplates)") &&
    nutritionLibraryPanelSource.includes("state.community.favoritePostIds") &&
    !nutritionLibraryPanelSource.includes("localStorage") &&
    !nutritionLibraryPanelSource.includes("myLibrarySlice"),
  "My Library must be a visible hub over canonical saved products, meal templates, and saved community materials, not a second local library system."
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

addCheck(
  "auth api errors preserve codes without exposing raw backend payload messages",
  authRemoteSource.includes("AUTH_API_ERROR_MESSAGES") &&
    authRemoteSource.includes("const createAuthError") &&
    authRemoteSource.includes("A user with this email already exists.") &&
    authRemoteSource.includes("Invalid email or password.") &&
    !authRemoteSource.includes('new AuthApiError("EMAIL_IN_USE", error.message)') &&
    !authRemoteSource.includes('new AuthApiError("NAME_IN_USE", error.message)') &&
    !authRemoteSource.includes('new AuthApiError("INVALID_CREDENTIALS", error.message)') &&
    !authRemoteSource.includes('new AuthApiError("WEAK_PASSWORD", error.message)'),
  "Frontend auth API errors may use backend codes/status for control flow, but AuthApiError messages must come from safe product-language client copy."
);

addCheck(
  "platform api errors never expose raw backend/provider payload messages",
  platformApiSource.includes("getPlatformErrorMessage") &&
    platformApiSource.includes("PLATFORM_ERROR_MESSAGES") &&
    platformApiSource.includes("status: number | null") &&
    !platformApiSource.includes("payload.message ??") &&
    !platformApiSource.includes("new PlatformApiError(\n      payload.code") &&
    adminCenterCardSource.includes("nextError instanceof PlatformApiError") &&
    catalogContributionCardSource.includes("setLoadError(copy.backendUnavailable)"),
  "Platform API callers may preserve error codes/status, but visible admin/catalog surfaces must receive safe product-language messages instead of raw backend/provider payload text."
);

const humanProfileSyncCopySources = [
  accountDataCardCopySource,
  adaptiveGoalCardSource,
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
    humanProfileSyncCopySources.includes("Автоматичний режим") &&
    humanProfileSyncCopySources.includes("Tryb ręczny") &&
    humanProfileSyncCopySources.includes("Automatic mode gently") &&
    !/Remote API account|Zdalne konto API|Віддалений API-акаунт|API-сесія|API session|access \+ refresh|snapshot|snapshots|connected to the backend|підключений до бекенда|połączone z backendem|serwerze nie skonfigurowano|server yet/.test(
      humanProfileSyncCopySources
    ) &&
    !/Automatic mode keeps the target aligned|Manual mode waits/.test(
      humanProfileSyncCopySources
    ),
  "Regular profile/account/sync surfaces must present cloud profile and protected-session language, while infrastructure terms stay inside code and admin diagnostics."
);

addCheck(
  "regular sync errors never render raw backend/provider messages",
  syncMessagingSource.includes("unknownIssue") &&
    authSliceSource.includes("sanitizeSyncErrorMessage") &&
    authSliceSource.includes("getActionSyncErrorMessage") &&
    authSliceSource.includes("SYNC_SAVE_FAILED_MESSAGE") &&
    !authSliceSource.includes(": result.message ??") &&
    !authSliceSource.includes("state.syncError = action.payload ??") &&
    syncMessagingSource.includes("Останні зміни поки не підтвердилися") &&
    syncMessagingSource.includes("Ostatnie zmiany nie zostały jeszcze potwierdzone") &&
    syncMessagingSource.includes("The latest changes are not confirmed yet") &&
    !syncMessagingSource.includes("return message;"),
  "Unknown sync errors must fall back to localized product-language retry copy before they reach auth state or visible sync UI instead of exposing raw backend/provider exception text."
);

addCheck(
  "admin users view exposes real account and session status metadata",
  platformTypesSource.includes("lastSessionAt: string | null") &&
    platformTypesSource.includes("hasActiveSession: boolean") &&
    platformTypesSource.includes("usersOnline: number") &&
    adminCenterCardSource.includes("accountCreated") &&
    adminCenterCardSource.includes("lastSession") &&
    adminCenterCardSource.includes("hasActiveSession") &&
    adminCenterCardSource.includes("usersOnline") &&
    adminCenterCardSource.includes("usersPanelTitle") &&
    adminCenterCardSource.includes("attentionUsers") &&
    adminCenterCardSource.includes("protectedUsers") &&
    adminCenterCardSource.includes("emailConfirmed") &&
    adminCenterCardSource.includes("bannedAt") &&
    adminCenterCardSource.includes("banReason"),
  "Admin user management must be an operational account/session tool, not a status-only card; online and last-session data must come from backend-confirmed user summaries."
);

addCheck(
  "direct UI translation keys are covered in every app language",
  languageCoverageTestSource.includes("collectDirectTranslationKeys") &&
    languageCoverageTestSource.includes("Object.entries(languageDictionaries)") &&
    languageCoverageTestSource.includes("appLanguages") &&
    languageCoverageTestSource.includes("missingKeys") &&
    languageCoverageTestSource.includes("toEqual([])") &&
    sharedI18nEnSource.includes('"productFacts.title"') &&
    sharedI18nEnSource.includes('"productSearch.title"') &&
    sharedI18nEnSource.includes('"templates.title"') &&
    sharedI18nEnSource.includes('"profile.title"'),
  "Direct t(\"...\") calls must be backed by all active dictionaries so production UI cannot render raw keys such as weekly.title or productFacts.title."
);

addCheck(
  "cloud action sync wrappers sanitize backend/provider messages",
  cloudSyncErrorsSource.includes("resolveCloudSyncFailureMessage") &&
    mealCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    profileCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    waterCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    fridgeCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    companionCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    communityCloudSyncSource.includes("resolveCloudSyncFailureMessage") &&
    syncListenersSource.includes("resolveCloudSyncFailureMessage") &&
    !mealCloudSyncSource.includes("result.message || result.code") &&
    !profileCloudSyncSource.includes("result.message ??") &&
    !waterCloudSyncSource.includes("result.message ??") &&
    !fridgeCloudSyncSource.includes("result.message || result.code") &&
    !companionCloudSyncSource.includes("result.message ??") &&
    !communityCloudSyncSource.includes("result.message || result.code") &&
    !syncListenersSource.includes("result.message ??") &&
    !authRemoteSource.includes("Backend unavailable. Please reconnect.") &&
    authRemoteSource.includes(
      "The Smart Nutrition cloud service is temporarily unavailable"
    ),
  "Meal, profile, water, fridge, community, companion, automatic sync, and auth unavailable errors must preserve cloud/conflict meaning without exposing raw backend/provider message text."
);

addCheck(
  "backend route errors expose safe public messages instead of raw exception text",
  serverErrorHandlerSource.includes("authErrorMessages") &&
    serverErrorHandlerSource.includes("platformErrorMessages") &&
    serverErrorHandlerSource.includes("assistantErrorMessages") &&
    serverErrorHandlerSource.includes("stateErrorMessages") &&
    serverErrorHandlerSource.includes("getPublicAssistantDetails") &&
    serverErrorHandlerSource.includes("Product catalog is temporarily unavailable.") &&
    !serverErrorHandlerSource.includes("sendError(response, statusCode, error.code, error.message") &&
    !serverErrorHandlerSource.includes("sendError(response, statusCode, error.code, error.message, error.details") &&
    !serverErrorHandlerSource.includes("providerMessage"),
  "Backend route error envelopes must preserve codes/status while mapping public messages from safe code dictionaries and stripping provider/backend details from ordinary API responses."
);

addCheck(
  "water cloud action feedback hides raw backend/provider failure details",
  waterCloudActionSource.includes("resolveWaterCloudActionErrorMessage") &&
    waterCloudActionSource.includes("copy.saveFailed") &&
    waterCloudActionSource.includes("copy.saveInProgress") &&
    waterTrackerSource.includes("saveFailed: copy.saveError") &&
    waterTrackerSource.includes("saveInProgress: copy.saveInProgress") &&
    !waterCloudActionSource.includes("Water could not be saved. Please try again.") &&
    !waterCloudActionSource.includes("Water is already being saved. Please wait a moment.") &&
    !waterCloudActionSource.includes("setError(message)") &&
    !waterCloudActionSource.includes("setError(inProgressError.message)") &&
    !waterTrackerSource.includes("error instanceof Error ? error.message"),
  "Water save and retry failures must stay retryable without rendering raw backend/provider exception text."
);

addCheck(
  "profile cloud action feedback hides raw backend/provider failure details",
  profileCloudActionSource.includes("resolveProfileCloudActionErrorMessage") &&
    profileCloudActionSource.includes("copy.saveFailed") &&
    profileCloudActionSource.includes("copy.saveInProgress") &&
    profileCloudActionCopySource.includes("ProfileCloudActionCopy") &&
    profileCloudActionCopySource.includes("getProfileCloudActionCopy") &&
    profileCloudActionCopySource.includes("Не вдалося зберегти зміни профілю") &&
    profileCloudActionCopySource.includes("Nie udało się zapisać zmian profilu") &&
    !profileCloudActionSource.includes(
      "Profile changes could not be saved. Please try again."
    ) &&
    !profileCloudActionSource.includes(
      "Profile changes are already being saved. Please wait a moment."
    ) &&
    !profileCloudActionSource.includes("setError(message)") &&
    !profileCloudActionSource.includes("setError(inProgressError.message)") &&
    !profileCloudActionSource.includes("error.message :") &&
    !profileCloudActionSource.includes("? caughtError.message"),
  "Profile action, profile state, and profile+user saves must not render raw backend/provider exception text."
);

addCheck(
  "meal action feedback hides raw backend/provider failure details",
  mealActionFeedbackModelSource.includes("text: `${copy.failed[state.kind]} ${copy.retry}`") &&
    !mealActionFeedbackModelSource.includes("${state.message") &&
    !mealActionFeedbackModelSource.includes("state.message || copy.retry") &&
    mealActionFeedbackHookSource.includes("message: getFailedMealActionCopy(copy, kind)") &&
    !mealActionFeedbackHookSource.includes("error instanceof Error ? error.message") &&
    !mealActionFeedbackHookSource.includes("defaultErrorMessage"),
  "Food add/edit/delete/repeat/template/product failure notices must stay retryable without rendering raw backend/provider exception text."
);

addCheck(
  "quick meal composer feedback hides raw backend/provider failure details",
  quickMealComposerModelSource.includes("text: `${copy.failed} ${copy.retry}`") &&
    !quickMealComposerModelSource.includes("${state.message") &&
    !quickMealComposerModelSource.includes("state.message || copy.retry") &&
    quickMealComposerSource.includes("message: copy.mealSaveFailed") &&
    !quickMealComposerSource.includes("error instanceof Error ? error.message") &&
    !quickMealComposerSource.includes("QUICK_MEAL_SAVE_ERROR"),
  "Quick meal composer save failures must stay retryable without rendering raw backend/provider exception text."
);

addCheck(
  "catalog contribution feedback hides raw backend/provider failure details",
  catalogContributionModelSource.includes("text: `${copy.failed} ${copy.retry}`") &&
    !catalogContributionModelSource.includes("${state.message") &&
    !catalogContributionModelSource.includes("state.message || copy.retry"),
  "Shared catalog contribution failures must stay retryable without rendering raw backend/provider exception text."
);

addCheck(
  "scanner catalog moderation feedback hides raw backend/provider failure details",
  barcodeScannerModelSource.includes("text: `${copy.catalogFailed} ${copy.catalogRetry}`") &&
    !barcodeScannerModelSource.includes("${state.message") &&
    !barcodeScannerModelSource.includes("state.message || copy.catalogRetry"),
  "Scanner manual-product catalog moderation failures must stay retryable without rendering raw backend/provider exception text."
);

addCheck(
  "food command surface hides raw backend/provider save failure details",
  foodCommandCenterSource.includes("setActionError(copy.saveFailed)") &&
    !foodCommandCenterSource.includes("error instanceof Error ? error.message") &&
    !foodCommandCenterSource.includes("Could not save meal to cloud."),
  "FoodCommandCenter save and recent-product failures must render product-language recovery copy instead of raw backend/provider exception text."
);

addCheck(
  "barcode scanner surface hides raw backend/provider save failure details",
  barcodeScannerSource.includes("setSaveError(copy.saveFailed)") &&
    barcodeScannerSource.includes("message: copy.catalogRetry") &&
    !barcodeScannerSource.includes("CLOUD_SAVE_ERROR_MESSAGE") &&
    !barcodeScannerSource.includes("intakeCatalog.message") &&
    !barcodeScannerSource.includes("PlatformApiError") &&
    !barcodeScannerSource.includes("error instanceof Error ? error.message") &&
    !barcodeScannerSource.includes("error.message"),
  "Barcode scanner save, history, and catalog submission failures must render product-language recovery copy instead of raw backend/provider exception text."
);

addCheck(
  "meal entry editor hides raw backend/provider save failure details",
  mealEntryEditorSource.includes("setSaveError(copy.saveFailed)") &&
    !mealEntryEditorSource.includes("error instanceof Error ? error.message") &&
    !mealEntryEditorSource.includes("Could not save meal. Please try again.") &&
    !mealEntryEditorSource.includes("Could not save meal to cloud."),
  "Meal entry edit/remove failures must render product-language recovery copy instead of raw backend/provider exception text."
);

addCheck(
  "recipe builder visible actions are localized through recipe copy",
  recipeSectionSource.includes("{copy.builderTitle}") &&
    recipeSectionSource.includes("label={copy.recipeNameLabel}") &&
    recipeSectionSource.includes("label={copy.ingredientSearchLabel}") &&
    recipeSectionSource.includes("{copy.publishRecipe}") &&
    !recipeSectionSource.includes(">Custom recipe builder<") &&
    !recipeSectionSource.includes('label="Recipe name"') &&
    !recipeSectionSource.includes('label="Search ingredient"') &&
    !recipeSectionSource.includes(">Publish recipe<"),
  "Recipe builder labels, helper text, custom descriptions, and publish actions must stay in the active language copy layer instead of leaking hard-coded English into localized food UI."
);

addCheck(
  "catalog contribution card hides raw backend/provider save failure details",
  catalogContributionCardSource.includes("message: copy.retry") &&
    !catalogContributionCardSource.includes("PlatformApiError") &&
    !catalogContributionCardSource.includes("nextError.message"),
  "Shared catalog contribution component failures must render retry copy instead of raw backend/provider exception text."
);

addCheck(
  "fridge planner hides raw backend/provider save failure details",
  fridgeRecipePlannerSource.includes("mealSaveFailed") &&
    fridgeRecipePlannerSource.includes("setFridgeSaveError(copy.saveFailed)") &&
    fridgeRecipePlannerSource.includes("setMealSaveError(copy.mealSaveFailed)") &&
    !fridgeRecipePlannerSource.includes("error instanceof Error ? error.message") &&
    !fridgeRecipePlannerSource.includes("fridgeError instanceof Error") &&
    !fridgeRecipePlannerSource.includes("Could not save meal to cloud.") &&
    !/save(?:d)? fridge to cloud|lodówki w chmurze|хмар/i.test(
      fridgeRecipePlannerSource
    ),
  "Fridge planner meal/fridge save failures must show product-language retry copy instead of raw backend/provider exception text."
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
  "pwa update banner explains user benefit without deployment jargon",
  pwaUpdateBannerSource.includes("останні виправлення") &&
    pwaUpdateBannerSource.includes("najnowszych poprawek") &&
    pwaUpdateBannerSource.includes("latest fixes") &&
    !/stale cache|deployment|деплою|wdrożeniu/i.test(pwaUpdateBannerSource),
  "PWA update prompts must explain fixes and stability to regular users, not cache/deployment internals."
);

const userFacingRecoveryCopySources = [
  sharedI18nUkSource,
  sharedI18nPlSource,
  sharedI18nEnSource,
  sharedLanguageSource,
  lazyModuleRecoverySource,
  mealBuilderPageSource,
].join("\n");

addCheck(
  "crash and lazy-section recovery copy hides cache internals",
  userFacingRecoveryCopySources.includes("стабільний екран") &&
    userFacingRecoveryCopySources.includes("stabilny ekran") &&
    userFacingRecoveryCopySources.includes("stable screen") &&
    userFacingRecoveryCopySources.includes("without signing you out") &&
    mealBuilderPageSource.includes("interrupted this tool") &&
    !/stale UI cache|old cache|cache UI|старий UI-кеш|старий кеш|stary cache|stary plik/i.test(
      userFacingRecoveryCopySources
    ) &&
    !/old chunk|старий chunk|stary chunk/i.test(userFacingRecoveryCopySources),
  "Crash and lazy-section recovery prompts must explain safe recovery to regular users, not cache/file internals."
);

addCheck(
  "error boundary diagnostics are user-facing while details stay internal",
  errorBoundarySource.includes("recoveryDetailsLabel") &&
    sharedI18nUkSource.includes("Деталі збережено для відновлення") &&
    sharedI18nPlSource.includes("Szczegóły zapisano do naprawy") &&
    sharedI18nEnSource.includes("Recovery details saved") &&
    !errorBoundarySource.includes('label="stale build"') &&
    !errorBoundarySource.includes("diagnostic.errorName}: ${this.state.diagnostic.message"),
  "Crash UI may show a short diagnostic code, but raw stale-build/error-name/message details must stay in telemetry, not ordinary UI."
);

addCheck(
  "regular assistant settings hide AI provider diagnostics",
  aiCompanionPageSource.includes("canAccessAdminCenter(user?.role)") &&
    aiControllerSource.includes("canSeeAssistantDiagnostics") &&
    aiControllerSource.includes("toPublicRuntimeStatus") &&
    aiControllerSource.includes("providers: []") &&
    aiControllerSource.includes("model: null") &&
    aiControllerSource.includes("baseUrl: null") &&
    aiControllerSource.includes("canSeeAssistantDiagnostics(auth?.user)") &&
    !aiControllerSource.includes("sendJson(response, 200, aiService.getRuntimeStatus())") &&
    aiCompanionPageSource.includes("const canSeeAssistantOperations") &&
    aiCompanionPageSource.includes(
      "canSeeAssistantOperations ? copy.operationsTitle : copy.readinessTitle"
    ) &&
    aiCompanionPageSource.includes("Assistant readiness") &&
    aiCompanionPageSource.includes("Gotowość asystenta") &&
    aiCompanionPageSource.includes("Готовність помічника") &&
    aiCompanionPageSource.includes("Team diagnostics") &&
    aiCompanionPageSource.includes("Osobisty asystent") &&
    aiCompanionPageSource.includes("Dostawcy AI") &&
    aiCompanionPageSource.includes("Uwaga na wodę") &&
    aiCompanionPageSource.includes("Особистий помічник") &&
    aiCompanionPageSource.includes("Час перевірити прогрес") &&
    !/Osobisty companion|Providerzy AI|Fokus na wodzie|Nowy companion|Особистий companion|Новий companion/.test(
      aiCompanionPageSource
    ) &&
    !/Below you can see active providers|Niżej widać aktywnych providerów|Нижче видно активних провайдерів/.test(
      aiCompanionPageSource
    ),
  "Regular assistant settings and /api/ai/status must show product readiness language for regular users; provider/model/fallback diagnostics belong behind admin-center role access."
);

addCheck(
  "AI companion section navigation uses active-language accessibility copy",
  aiCompanionPageSource.includes("sectionsAriaLabel") &&
    aiCompanionPageSource.includes("Розділи помічника") &&
    aiCompanionPageSource.includes("Sekcje asystenta") &&
    aiCompanionPageSource.includes("Assistant sections") &&
    aiCompanionPageSource.includes("ariaLabel={copy.sectionsAriaLabel}") &&
    !aiCompanionPageSource.includes('ariaLabel="Assistant companion sections"'),
  "AI companion section tabs must use active-language accessibility copy instead of hardcoded English labels."
);

const regularAssistantCopySources = [
  aiCompanionPageSource,
  assistantRuntimeCardSource,
].join("\n");

addCheck(
  "regular assistant fallback copy hides AI infrastructure language",
  regularAssistantCopySources.includes("Помічник тимчасово працює в обмеженому режимі") &&
    regularAssistantCopySources.includes("Asystent tymczasowo działa w ograniczonym trybie") &&
    regularAssistantCopySources.includes("The assistant is temporarily in limited mode") &&
    regularAssistantCopySources.includes("Живий діалог тимчасово обмежений") &&
    regularAssistantCopySources.includes("Żywy dialog jest chwilowo ograniczony") &&
    regularAssistantCopySources.includes("Live conversation is temporarily limited") &&
    !/Cloud AI is unavailable|Хмарний AI зараз недоступний|Chmurowy AI jest teraz niedostępny|production AI|local context|локального контексту|lokalnego kontekstu/.test(
      regularAssistantCopySources
    ),
  "Regular assistant unavailable/fallback states must explain limited helper behavior, not cloud AI, production AI, or local-context internals."
);

addCheck(
  "guest landing page keeps localized assistant language",
  landingPageSource.includes("Побачити помічника") &&
    landingPageSource.includes("простір з помічником") &&
    landingPageSource.includes("запитати помічника") &&
    landingPageSource.includes("AI-сканер їжі") &&
    landingPageSource.includes("Zobacz asystenta") &&
    landingPageSource.includes("przestrzeń z asystentem") &&
    landingPageSource.includes("zapytaj asystenta") &&
    landingPageSource.includes("AI skaner jedzenia") &&
    !/Побачити companion|companion-платформа|запитати companion|Zobacz companion|companion-platforma|zapytaj companion/.test(
      landingPageSource
    ),
  "Public landing copy must sell the assistant experience in the selected language instead of exposing mixed English product-planning labels."
);

addCheck(
  "guest landing first viewport exposes a living companion scene",
  landingPageSource.includes("landingCompanionOrbitRings") &&
    landingPageSource.includes("landingCompanionSignalNodes") &&
    landingPageSource.includes('data-landing-living-companion-field="true"') &&
    landingPageSource.includes('data-landing-living-companion-stage="true"') &&
    landingPageSource.includes("landingCompanionOrbit") &&
    landingPageSource.includes("landingCompanionSignal") &&
    landingPageSource.includes("prefers-reduced-motion: reduce") &&
    landingPageSource.includes("playAIDiscoverySound") &&
    landingPageSource.includes("playGentleClickSound"),
  "The public landing hero must feel like a live AI space with user-triggered feedback and motion safety, not a static calorie-counter splash."
);

const localizedAssistantExperienceSources = [
  ecosystemPulseSource,
  companionProgressCardSource,
  assistantCustomizationCardSource,
].join("\n");

addCheck(
  "assistant growth and settings keep localized helper language",
  localizedAssistantExperienceSources.includes("Розвиток помічника") &&
    localizedAssistantExperienceSources.includes("помічник отримав перший справжній контекст") &&
    localizedAssistantExperienceSources.includes("Превʼю помічника") &&
    localizedAssistantExperienceSources.includes("зв'язок з помічником") &&
    localizedAssistantExperienceSources.includes("Rozwój asystenta") &&
    localizedAssistantExperienceSources.includes("asystent dostał pierwszy prawdziwy kontekst") &&
    localizedAssistantExperienceSources.includes("Podgląd asystenta") &&
    localizedAssistantExperienceSources.includes("więź z asystentem") &&
    !/Розвиток компаньйона|компаньйон отримав|Превʼю companion|Rozwój companiona|companion dostał|Podgląd companion|постійним companion|stałego companion|зв'язок з companion|więź z companion/.test(
      localizedAssistantExperienceSources
    ),
  "Assistant growth, profile customization, and ecosystem pulse copy must use native localized helper language instead of mixed companion/onboarding planning jargon."
);

const localizedAssistantCoachSources = [
  assistantRuntimeCardSource,
  nutritionCoachCardSource,
].join("\n");

addCheck(
  "assistant and nutrition coach surfaces keep native helper language",
  localizedAssistantCoachSources.includes("харчовому аналізу") &&
    localizedAssistantCoachSources.includes("Який зараз головний напрям?") &&
    localizedAssistantCoachSources.includes("Харчовий помічник") &&
    localizedAssistantCoachSources.includes("Оцінка помічника") &&
    localizedAssistantCoachSources.includes("analizy żywienia") &&
    localizedAssistantCoachSources.includes("Jaki jest teraz główny kierunek?") &&
    localizedAssistantCoachSources.includes("Asystent żywieniowy") &&
    localizedAssistantCoachSources.includes("Ocena asystenta") &&
    !/coach-аналітиці|focus коуча|Харчовий коуч|Оцінка коуча|Головний фокус|analizy coacha|fokus coacha|Coach żywieniowy|Ocena coacha|Główny fokus/.test(
      localizedAssistantCoachSources
    ),
  "Assistant runtime and nutrition analysis surfaces must speak native helper language in Ukrainian/Polish instead of coach/focus planning jargon."
);

addCheck(
  "global assistant layer keeps visible assistant language",
  globalAssistantLayerSource.includes("Головне на день") &&
    globalAssistantLayerSource.includes("Відкрити помічника") &&
    globalAssistantLayerSource.includes("livingMessages") &&
    globalAssistantLayerSource.includes("Почнемо історію дня") &&
    globalAssistantLayerModelSource.includes("resolveGlobalAssistantNoticeKey") &&
    globalAssistantLayerModelSource.includes("hasNoMealsToday") &&
    globalAssistantLayerModelSource.includes("waterBehindTarget") &&
    globalAssistantLayerModelSource.includes("weightUpdatedToday") &&
    globalAssistantLayerSource.includes("Kierunek dnia") &&
    globalAssistantLayerSource.includes("Otwórz asystenta") &&
    globalAssistantLayerSource.includes("Today’s direction") &&
    globalAssistantLayerSource.includes("Open assistant") &&
    !/Відкрити коуча|коуч",|Fokus na dzień|Otwórz coacha|chip: "coach"|Daily focus|Open coach/.test(
      globalAssistantLayerSource
    ),
  "The global assistant overlay is visible across the app and must speak as Smart Nutrition's assistant, not expose coach/focus planning labels."
);

addCheck(
  "language menu avoids MUI aria-hidden focus conflicts",
  appLayoutSource.includes('id="language-menu-button"') &&
    languageMenuButtonSource.includes("const trigger = event.currentTarget") &&
    languageMenuButtonSource.includes("trigger.blur()") &&
    languageMenuButtonSource.includes("setAnchorEl(trigger)") &&
    languageMenuButtonSource.includes("disableRestoreFocus"),
  "Shared language menu triggers must release focus before opening MUI modal menus so the app root is not aria-hidden while it still contains the focused button."
);

addCheck(
  "habit reminders keep native localized copy and product-owned notification keys",
  habitReminderAgentSource.includes("Нагадування про сніданок") &&
    habitReminderAgentSource.includes("Щотижневе оновлення вже на часі") &&
    habitReminderAgentSource.includes("Przypomnienie o śniadaniu") &&
    habitReminderAgentSource.includes("Cotygodniowa aktualizacja jest już na czasie") &&
    habitReminderAgentSource.includes("weekly-body-update") &&
    habitReminderAgentSource.includes("assistant-evening-insight") &&
    !/Чек-ін по сніданку|Check-in śniadania|Щотижневий check-in|Weekly check-in jest już na czasie|weekly-check-in|coach-focus|const focus =/.test(
      habitReminderAgentSource
    ),
  "PWA/browser reminder notifications must not leak check-in, coach-focus, or mixed planning jargon into Ukrainian/Polish user copy or notification identifiers."
);

const localizedBodyProgressSources = [
  quickWeightCheckInSource,
  weightTrendCardSource,
  bodyWeeklyReportCardSource,
  measurementsCheckInCardSource,
].join("\n");

addCheck(
  "body progress surfaces keep localized measurement language",
  localizedBodyProgressSources.includes("Останні записи ваги") &&
    localizedBodyProgressSources.includes("AI-сигнал стабілізації ваги") &&
    localizedBodyProgressSources.includes("щотижневий запис") &&
    localizedBodyProgressSources.includes("прогрес помічника") &&
    localizedBodyProgressSources.includes("Ostatnie zapisy wagi") &&
    localizedBodyProgressSources.includes("AI-sygnał stabilizacji wagi") &&
    localizedBodyProgressSources.includes("tygodniowy zapis") &&
    localizedBodyProgressSources.includes("postęp asystenta") &&
    !/Останні check-in|Перші два check-in|Ще немає weekly check-in|AI визначення plateau|сигнал plateau|Ostatnie check-iny|Pierwsze dwa check-iny|Brak zapisanych weekly check-in|Osobisty fokus asystenta|postęp companion|прогрес companion/.test(
      localizedBodyProgressSources
    ),
  "Weight, measurements, and weekly body-report surfaces must use native body-progress language in Ukrainian/Polish instead of check-in, plateau, focus, or companion planning jargon."
);

addCheck(
  "female profile and saved women-health context expose a dedicated profile section",
  profilePageSource.includes("isWomenHealthVisibleForGender(user.gender)") &&
    profilePageSource.includes("hasWomenHealthContext(profile.womenHealth)") &&
    womenHealthOverviewCardSource.includes("hasWomenHealthContext(womenHealth)") &&
    womenHealthOverviewCardSource.includes("isWomenHealthVisibleForGender(user?.gender) ||") &&
    profilePageSource.includes('id: "women-health"') &&
    profilePageSource.includes("copy.tabs.womenHealth") &&
    profilePageSource.includes("<WomenHealthOverviewCard />"),
  "Female accounts and accounts with canonical women-health profile context must see pregnancy, children/family preview, postpartum, cycle, symptom, and partner-sharing context as a first-class profile section, not as hidden data-tab content or a stale auth-gender casualty."
);

addCheck(
  "profile role chips use localized labels",
  profilePageSource.includes('USER: "Користувач"') &&
    profilePageSource.includes('VERIFIED_USER: "Підтверджений користувач"') &&
    profilePageSource.includes('ADMIN: "Адміністратор"') &&
    profilePageSource.includes('OWNER: "Власник"') &&
    profilePageSource.includes('USER: "Użytkownik"') &&
    profilePageSource.includes('VERIFIED_USER: "Potwierdzony użytkownik"') &&
    profilePageSource.includes('ADMIN: "Administrator"') &&
    profilePageSource.includes('OWNER: "Właściciel"') &&
    profilePageSource.includes("getRoleLabel(appLanguage, user.role)"),
  "Regular profile chips must show user-role names in the active app language and not leak internal English role labels into Ukrainian or Polish surfaces."
);

addCheck(
  "family wellness is documented as one lifecycle layer",
  familyWellnessDocSource.includes("Family Wellness is a lifecycle layer") &&
    familyWellnessDocSource.includes("Backend/cloud is the source of truth") &&
    familyWellnessDocSource.includes("The existing `womenHealth` profile state remains the canonical owner") &&
    familyWellnessDocSource.includes("Partner Mode is a scoped family view, not full account synchronization") &&
    familyWellnessDocSource.includes("Baby data must be backend-owned and permission-scoped") &&
    familyWellnessDocSource.includes("Never diagnoses") &&
    familyWellnessDocSource.includes("No duplicate family app") &&
    projectDecisionsSource.includes("ADR-026: Family Wellness Is A Lifecycle Layer") &&
    projectRulesSource.includes("Family Wellness must be one lifecycle layer") &&
    projectMemorySource.includes("Family Wellness is now an accepted strategic product layer"),
  "Family Wellness must be governed as one account/profile/cloud/AI/Telegram lifecycle system with scoped partner permissions, medical safety boundaries, and no local-only family truth."
);

addCheck(
  "family lifecycle mode is canonical profile and AI context",
  profileTypesSource.includes("export type FamilyLifecycleMode") &&
    familyLifecycleSource.includes("resolveFamilyLifecycleMode") &&
    familyLifecycleSource.includes("womenHealth.mode === \"pregnant\"") &&
    familyLifecycleSource.includes("link.role === \"partner\"") &&
    familyLifecycleSource.includes("permissions.includes(\"pregnancy_timeline\")") &&
    !familyLifecycleSource.includes("localStorage") &&
    profileStoreSource.includes("familyLifecycleMode: FamilyLifecycleMode") &&
    profileStoreSource.includes("familyLifecycleMode: \"personal\"") &&
    profileStoreSource.includes("resolveFamilyLifecycleMode({") &&
    domainSource.includes("familyLifecycleMode: \"personal\"") &&
    aiServiceSource.includes("normalizeFamilyLifecycleMode") &&
    aiSharedSource.includes("familyLifecycleMode:") &&
    aiSharedSource.includes("Family lifecycle mode:") &&
    projectMemorySource.includes("familyLifecycleMode") &&
    projectDecisionsSource.includes("canonical `familyLifecycleMode`"),
  "Family Wellness lifecycle must live in canonical profile state, derive pregnancy/partner truth from existing womenHealth/partner-sharing contracts, and feed AI context without creating a second family store."
);

addCheck(
  "assistant client errors hide backend and provider internals",
  assistantApiSource.includes("class AssistantApiError") &&
    assistantApiSource.includes("getAssistantSafeMessage") &&
    assistantApiSource.includes("ASSISTANT_AUTH_REQUIRED") &&
    assistantApiSource.includes("ASSISTANT_UNAVAILABLE") &&
    assistantApiSource.includes("ASSISTANT_REQUEST_FAILED") &&
    assistantApiSource.includes("ASSISTANT_RESPONSE_INVALID") &&
    !/Backend session is required for assistant requests|Backend unavailable for assistant requests|AI request failed|AI history request failed|AI history clear failed|Invalid AI response payload|Invalid AI history payload/.test(
      assistantApiSource
    ),
  "Assistant API helpers must throw typed product-language errors; backend/provider/raw payload details must not become future user-visible error.message text."
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
  "3d companion visibly earns its lazy vendor weight",
  companionCanvasSource.includes("CompanionAuraField") &&
    companionCanvasSource.includes("companionSignalNodes") &&
    companionCanvasSource.includes('name="companion-3d-living-aura"') &&
    companionCanvasSource.includes("torusGeometry") &&
    companionCanvasSource.includes("pointLight") &&
    companionCanvasSource.includes("useFrame") &&
    companionCanvasSource.includes("active ? 0.82 : 0.58"),
  "Lazy 3D companion code must produce a visibly richer living scene, not a heavy WebGL chunk that looks like the 2D avatar."
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
  "search discovery covers broad crawler and AI answer engine entry points",
  packageJsonSource.includes('"audit:seo": "node server/scripts/audit-seo-discovery.mjs"') &&
    indexHtmlSource.includes('name="googlebot"') &&
    indexHtmlSource.includes('name="bingbot"') &&
    indexHtmlSource.includes('"@graph"') &&
    indexHtmlSource.includes('"@type": "Organization"') &&
    indexHtmlSource.includes('"@type": "WebSite"') &&
    indexHtmlSource.includes('"@type": "WebApplication"') &&
    robotsTxtSource.includes("Sitemap: https://smart-nutrition.club/sitemap.xml") &&
    robotsTxtSource.includes("Sitemap: https://smart-nutrition.club/sitemap-images.xml") &&
    robotsTxtSource.includes("Allow: /llms.txt") &&
    robotsTxtSource.includes("Allow: /ai.txt") &&
    robotsTxtSource.includes("Disallow: /*?token=") &&
    sitemapXmlSource.includes("<lastmod>2026-07-29</lastmod>") &&
    imageSitemapXmlSource.includes("<image:loc>https://smart-nutrition.club/og.png</image:loc>") &&
    llmsTxtSource.includes("Backend/cloud state is the source of truth") &&
    aiTxtSource.includes("LLM summary: https://smart-nutrition.club/llms.txt") &&
    seoAuditSource.includes("image sitemap exposes public visual discovery assets only") &&
    seoAuditSource.includes("AI answer engines receive a public project summary") &&
    liveAuditSource.includes("/sitemap-images.xml") &&
    liveAuditSource.includes("/llms.txt") &&
    liveAuditSource.includes("/ai.txt"),
  "Search discovery must expose canonical public metadata, text/image sitemaps, and AI discovery summaries while keeping protected/token routes blocked from crawler discovery."
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
    authenticatedLiveAuditSource.includes("/api/auth/profile-state") &&
    authenticatedLiveAuditSource.includes("live profile-state save is backend-confirmed") &&
    authenticatedLiveAuditSource.includes("live profile-state mutation survives session restore") &&
    authenticatedLiveAuditSource.includes("X-State-Version") &&
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
  "github quality gate blocks unsafe master changes",
  qualityGateWorkflowSource.includes("name: Smart-Nutrition") &&
    qualityGateWorkflowSource.includes("push:") &&
    qualityGateWorkflowSource.includes("pull_request:") &&
    qualityGateWorkflowSource.includes("- master") &&
    qualityGateWorkflowSource.includes("node-version: 22") &&
    qualityGateWorkflowSource.includes("npm ci") &&
    qualityGateWorkflowSource.includes("npm run quality") &&
    qualityGateWorkflowSource.includes("npm run audit:security") &&
    qualityGateWorkflowSource.includes("npm run server:check") &&
    qualityGateWorkflowSource.includes("SMART_NUTRITION_DATABASE_PROVIDER: mongodb") &&
    qualityGateWorkflowSource.includes("SMART_NUTRITION_AUTH_COOKIE_SAME_SITE: None") &&
    qualityGateWorkflowSource.includes('SMART_NUTRITION_AUTH_COOKIE_SECURE: "true"') &&
    qualityGateWorkflowSource.includes("SMART_NUTRITION_BREVO_API_KEY: ci_brevo_quality_key_not_a_secret"),
  "GitHub must run the same production quality gate on master pushes and pull requests so deploys cannot bypass lint, build, tests, bundle, SEO, dead-code, dependency, security, cycle, architecture, contract, and production config checks."
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
