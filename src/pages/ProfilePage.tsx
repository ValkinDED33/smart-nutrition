import { lazy, Suspense, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, HeartPulse, MessageCircle } from "lucide-react";
import type { RootState } from "../app/store";
import {
  Avatar,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ProfileForm from "../features/profile/ProfileForm";
import { ProfileSectionTabs } from "../features/profile/ProfileSectionTabs";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  EmptyState,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
} from "@shared/ui";
import { selectTodayMealTotalNutrients } from "../features/meal/selectors";
import {
  selectCurrentWeight,
  selectDailyMacroProgress,
  selectDailyMacroTargets,
} from "../features/profile/selectors";
import type { DietStyle } from "@domain/profile/types";
import {
  canAccessAdminCenter,
  communityStatusLabels,
  resolveCommunityStatus,
} from "@domain/user/roles";
import type { CommunityMemberStatus, UserRole } from "@domain/user/types";
import type { AppLanguage } from "@shared/types/i18n";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import {
  hasWomenHealthContext,
  isWomenHealthVisibleForGender,
} from "@domain/profile/womenHealth";
import { hasActivePregnancyPartnerLink } from "@domain/profile/familyLifecycle";

const PROFILE_CARD_BORDER = "1px solid var(--sn-border-soft)";
const PROFILE_GLASS_BACKGROUND = "var(--sn-surface-glass)";
const PROFILE_ALIGN_START = "flex-start";
const PROFILE_ACCENT_COLOR = "var(--sn-accent)";
const USER_ROLE_LABEL = "User";
const VERIFIED_USER_ROLE_LABEL = "Verified user";
const OWNER_ROLE_LABEL = "Owner";

const WeightTrendCard = lazy(() =>
  import("../features/profile/WeightTrendCard").then((module) => ({
    default: module.WeightTrendCard,
  }))
);
const MeasurementsCheckInCard = lazy(() =>
  import("../features/profile/MeasurementsCheckInCard").then((module) => ({
    default: module.MeasurementsCheckInCard,
  }))
);
const BodyProgressPhotosCard = lazy(() =>
  import("../features/profile/BodyProgressPhotosCard").then((module) => ({
    default: module.BodyProgressPhotosCard,
  }))
);
const BodyWeeklyReportCard = lazy(() =>
  import("../features/profile/BodyWeeklyReportCard").then((module) => ({
    default: module.BodyWeeklyReportCard,
  }))
);
const AdaptiveGoalCard = lazy(() =>
  import("../features/profile/AdaptiveGoalCard").then((module) => ({
    default: module.AdaptiveGoalCard,
  }))
);
const WomenHealthOverviewCard = lazy(() =>
  import("../features/profile/WomenHealthOverviewCard")
);
const MealDayOverview = lazy(() =>
  import("../features/meal/MealDayOverview").then((module) => ({
    default: module.MealDayOverview,
  }))
);
const DailyHistoryExplorer = lazy(() =>
  import("../features/meal/DailyHistoryExplorer").then((module) => ({
    default: module.DailyHistoryExplorer,
  }))
);
const AssistantCustomizationCard = lazy(
  () => import("../features/profile/AssistantCustomizationCard")
);
const CompanionShopCard = lazy(() => import("../features/profile/CompanionShopCard"));
const CommunityHubCard = lazy(() =>
  import("../features/community/CommunityHubCard").then((module) => ({
    default: module.CommunityHubCard,
  }))
);
const BehaviorPersonalizationCard = lazy(
  () => import("../features/profile/BehaviorPersonalizationCard")
);
const MotivationHubCard = lazy(() => import("../features/profile/MotivationHubCard"));
const PremiumAccessCard = lazy(() =>
  import("../features/profile/PremiumAccessCard").then((module) => ({
    default: module.PremiumAccessCard,
  }))
);
const NotificationSettingsCard = lazy(() =>
  import("../features/profile/NotificationSettingsCard").then((module) => ({
    default: module.NotificationSettingsCard,
  }))
);
const ReminderManagementCard = lazy(
  () => import("../features/profile/ReminderManagementCard")
);
const TelegramConnectionCard = lazy(
  () => import("../features/profile/TelegramConnectionCard")
);
const SupplementRecommendationCard = lazy(
  () => import("../features/profile/SupplementRecommendationCard")
);
const CloudSyncStatusCard = lazy(() =>
  import("../features/profile/CloudSyncStatusCard").then((module) => ({
    default: module.CloudSyncStatusCard,
  }))
);
const AccountDataCard = lazy(() =>
  import("../features/profile/AccountDataCard").then((module) => ({
    default: module.AccountDataCard,
  }))
);
const AdminCenterCard = lazy(() =>
  import("../features/platform/AdminCenterCard").then((module) => ({
    default: module.AdminCenterCard,
  }))
);

const profileCopy = {
  uk: {
    weightGoal: "Цільова вага",
    weightGoalSubtitle: "Відстежуйте, як поточна вага рухається до вашої мети.",
    start: "Старт",
    current: "Поточна",
    target: "Ціль",
    remaining: "Залишилось",
    targetMissing: "Додайте цільову вагу в профілі, щоб увімкнути шкалу прогресу.",
    targetReached: "Цілі досягнуто. Можете встановити наступний рубіж.",
    targetSame: "Поточна вага вже збігається з ціллю.",
    targetAway: (value: string) => `До цілі залишилось ${value} кг.`,
    preferencesTitle: "Налаштування",
    profileInfoTitle: "Інформація профілю",
    profileInfoSubtitle: "Спочатку показуємо спокійний підсумок. Поля редагування відкриваються тільки за потреби.",
    editProfile: "Редагувати",
    hideEditor: "Сховати редагування",
    noRestrictions: "Алергії або виключення ще не додані.",
    dietLabel: "Харчування",
    allergiesLabel: "Алергії",
    exclusionsLabel: "Виключено",
    languageLabel: "Мова",
    bloodGroupLabel: "Група крові",
    eyeColorLabel: "Очі",
    relationshipLabel: "Статус",
    supportLabel: "Підтримка",
    petLabel: "Поруч",
    roleLabel: "Роль",
    emailLabel: "Email",
    emailVerified: "підтверджено",
    emailUnverified: "не підтверджено",
    statusLabel: "Статус",
    adaptiveAuto: "Адаптивні калорії оновлюються автоматично.",
    adaptiveManual: "Адаптивні калорії залишаються ручними, доки ви не застосуєте рекомендацію.",
    womenHealthEntryEyebrow: "Доступ відкрито",
    womenHealthEntryTitle: "Жіноче здоров'я поруч",
    womenHealthEntrySubtitle:
      "Вагітність, підготовка, післяпологовий період і сімейна підтримка живуть у цьому профілі.",
    womenHealthEntryAction: "Відкрити розділ",
    telegramEntryTitle: "Telegram поруч",
    telegramEntrySubtitle:
      "Підключіть того самого помічника для нагадувань, задач і персональних підказок.",
    telegramEntryAction: "Підключити",
    macroTitle: "Цілі за макроелементами",
    macroSubtitle: "Добові цілі за білками, жирами та вуглеводами на основі калорій, ваги та мети.",
    tabs: {
      data: "Дані",
      goal: "Ціль",
      womenHealth: "Жіноче здоров'я",
      assistant: "Асистент",
      motivation: "Мотивація",
      security: "Безпека",
    },
    sectionsAriaLabel: "Розділи профілю",
  },
  pl: {
    weightGoal: "Waga docelowa",
    weightGoalSubtitle: "Śledź, jak aktualna masa ciała zbliża się do celu.",
    start: "Start",
    current: "Aktualna",
    target: "Cel",
    remaining: "Pozostało",
    targetMissing: "Dodaj wagę docelową w profilu, aby odblokować skalę postępu.",
    targetReached: "Cel został osiągnięty. Możesz ustawić kolejny etap.",
    targetSame: "Aktualna waga już odpowiada celowi.",
    targetAway: (value: string) => `Do celu pozostało ${value} kg.`,
    preferencesTitle: "Preferencje",
    profileInfoTitle: "Informacje profilu",
    profileInfoSubtitle: "Najpierw pokazujemy spokojne podsumowanie. Pola edycji otwierają się tylko wtedy, gdy są potrzebne.",
    editProfile: "Edytuj",
    hideEditor: "Ukryj edycję",
    noRestrictions: "Nie dodano jeszcze alergii ani wykluczeń.",
    dietLabel: "Styl żywienia",
    allergiesLabel: "Alergie",
    exclusionsLabel: "Wykluczone",
    languageLabel: "Język",
    bloodGroupLabel: "Grupa krwi",
    eyeColorLabel: "Oczy",
    relationshipLabel: "Status",
    supportLabel: "Wsparcie",
    petLabel: "Obok",
    roleLabel: "Rola",
    emailLabel: "Email",
    emailVerified: "potwierdzony",
    emailUnverified: "niepotwierdzony",
    statusLabel: "Status",
    adaptiveAuto: "Adaptacyjne kalorie aktualizują się automatycznie.",
    adaptiveManual: "Adaptacyjne kalorie pozostają ręczne, dopóki nie zastosujesz rekomendacji.",
    womenHealthEntryEyebrow: "Dostęp aktywny",
    womenHealthEntryTitle: "Zdrowie kobiet pod ręką",
    womenHealthEntrySubtitle:
      "Ciąża, przygotowanie, połóg i wsparcie rodzinne działają w tym samym profilu.",
    womenHealthEntryAction: "Otwórz sekcję",
    telegramEntryTitle: "Telegram pod ręką",
    telegramEntrySubtitle:
      "Podłącz tego samego asystenta do przypomnień, zadań i osobistych wskazówek.",
    telegramEntryAction: "Podłącz",
    macroTitle: "Cele makroskładników",
    macroSubtitle: "Dzienne cele białka, tłuszczów i węglowodanów wyliczone z kalorii, masy ciała i celu.",
    tabs: {
      data: "Dane",
      goal: "Cel",
      womenHealth: "Zdrowie kobiet",
      assistant: "Asystent",
      motivation: "Motywacja",
      security: "Bezpieczeństwo",
    },
    sectionsAriaLabel: "Sekcje profilu",
  },
  en: {
    weightGoal: "Target weight",
    weightGoalSubtitle: "Track how your current weight moves toward your goal.",
    start: "Start",
    current: "Current",
    target: "Goal",
    remaining: "Remaining",
    targetMissing: "Add a target weight in your profile to enable the progress scale.",
    targetReached: "Goal reached. You can set the next milestone.",
    targetSame: "Your current weight already matches the goal.",
    targetAway: (value: string) => `${value} kg left to the goal.`,
    preferencesTitle: "Preferences",
    profileInfoTitle: "Profile information",
    profileInfoSubtitle: "We show a calm summary first. Editing fields open only when you need them.",
    editProfile: "Edit",
    hideEditor: "Hide editor",
    noRestrictions: "No allergies or exclusions added yet.",
    dietLabel: "Diet",
    allergiesLabel: "Allergies",
    exclusionsLabel: "Excluded",
    languageLabel: "Language",
    bloodGroupLabel: "Blood group",
    eyeColorLabel: "Eyes",
    relationshipLabel: "Status",
    supportLabel: "Support",
    petLabel: "Nearby",
    roleLabel: "Role",
    emailLabel: "Email",
    emailVerified: "verified",
    emailUnverified: "not verified",
    statusLabel: "Status",
    adaptiveAuto: "Adaptive calories update automatically.",
    adaptiveManual: "Adaptive calories stay manual until you apply a recommendation.",
    womenHealthEntryEyebrow: "Access is active",
    womenHealthEntryTitle: "Women health is ready",
    womenHealthEntrySubtitle:
      "Pregnancy, planning, postpartum, and family support live inside this same profile.",
    womenHealthEntryAction: "Open section",
    telegramEntryTitle: "Telegram is ready",
    telegramEntrySubtitle:
      "Connect the same assistant for reminders, tasks, and personal nudges.",
    telegramEntryAction: "Connect",
    macroTitle: "Macro targets",
    macroSubtitle: "Daily protein, fat, and carbohydrate targets based on calories, weight, and goal.",
    tabs: {
      data: "Data",
      goal: "Goal",
      womenHealth: "Women health",
      assistant: "Assistant",
      motivation: "Motivation",
      security: "Security",
    },
    sectionsAriaLabel: "Profile sections",
  },
} as const;

const roleLabels = {
  uk: {
    USER: "Користувач",
    VERIFIED_USER: "Підтверджений користувач",
    HELPER: "Помічник",
    NUTRITIONIST: "Нутриціолог",
    MODERATOR: "Модератор",
    ADMIN: "Адміністратор",
    OWNER: "Власник",
    SUPER_ADMIN: "Власник",
  },
  pl: {
    USER: "Użytkownik",
    VERIFIED_USER: "Potwierdzony użytkownik",
    HELPER: "Pomocnik",
    NUTRITIONIST: "Dietetyk",
    MODERATOR: "Moderator",
    ADMIN: "Administrator",
    OWNER: "Właściciel",
    SUPER_ADMIN: "Właściciel",
  },
  en: {
    USER: USER_ROLE_LABEL,
    VERIFIED_USER: VERIFIED_USER_ROLE_LABEL,
    HELPER: "Helper",
    NUTRITIONIST: "Nutritionist",
    MODERATOR: "Moderator",
    ADMIN: "Admin",
    OWNER: OWNER_ROLE_LABEL,
    SUPER_ADMIN: OWNER_ROLE_LABEL,
  },
} as const;

const dietStyleLabels = {
  uk: {
    balanced: "Збалансоване",
    vegetarian: "Вегетаріанське",
    vegan: "Веганське",
    pescatarian: "Пескетаріанське",
    low_carb: "Низьковуглеводне",
    gluten_free: "Без глютену",
  },
  pl: {
    balanced: "Zbilansowana",
    vegetarian: "Wegetariańska",
    vegan: "Wegańska",
    pescatarian: "Peskatariańska",
    low_carb: "Niskowęglowodanowa",
    gluten_free: "Bez glutenu",
  },
  en: {
    balanced: "Balanced",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    pescatarian: "Pescatarian",
    low_carb: "Low carb",
    gluten_free: "Gluten free",
  },
} as const;

const personalDetailLabels = {
  uk: {
    bloodGroup: {
      unknown: "—",
      o_positive: "O+",
      o_negative: "O-",
      a_positive: "A+",
      a_negative: "A-",
      b_positive: "B+",
      b_negative: "B-",
      ab_positive: "AB+",
      ab_negative: "AB-",
    },
    eyeColor: {
      unknown: "—",
      brown: "карі",
      blue: "голубі",
      green: "зелені",
      gray: "сірі",
      hazel: "горіхові",
      amber: "бурштинові",
      other: "інші",
    },
    relationshipStatus: {
      single: "сам/сама",
      dating: "у стосунках",
      married: "шлюб",
      complicated: "складно",
      prefer_not: "—",
    },
    supportSystem: {
      self: "сам/сама",
      partner_supports: "партнер підтримує",
      partner_neutral: "партнер нейтральний",
      family_friends: "близькі",
      low_support: "мало підтримки",
      prefer_not: "—",
    },
    petCompanion: {
      none: "—",
      cat: "кіт",
      dog: "собака",
      cat_and_dog: "кіт і собака",
      other: "інше",
    },
  },
  pl: {
    bloodGroup: {
      unknown: "—",
      o_positive: "O+",
      o_negative: "O-",
      a_positive: "A+",
      a_negative: "A-",
      b_positive: "B+",
      b_negative: "B-",
      ab_positive: "AB+",
      ab_negative: "AB-",
    },
    eyeColor: {
      unknown: "—",
      brown: "brązowe",
      blue: "niebieskie",
      green: "zielone",
      gray: "szare",
      hazel: "piwne",
      amber: "bursztynowe",
      other: "inne",
    },
    relationshipStatus: {
      single: "sam/sama",
      dating: "w związku",
      married: "małżeństwo",
      complicated: "skomplikowane",
      prefer_not: "—",
    },
    supportSystem: {
      self: "sam/sama",
      partner_supports: "partner wspiera",
      partner_neutral: "partner neutralny",
      family_friends: "bliscy",
      low_support: "mało wsparcia",
      prefer_not: "—",
    },
    petCompanion: {
      none: "—",
      cat: "kot",
      dog: "pies",
      cat_and_dog: "kot i pies",
      other: "inne",
    },
  },
  en: {
    bloodGroup: {
      unknown: "—",
      o_positive: "O+",
      o_negative: "O-",
      a_positive: "A+",
      a_negative: "A-",
      b_positive: "B+",
      b_negative: "B-",
      ab_positive: "AB+",
      ab_negative: "AB-",
    },
    eyeColor: {
      unknown: "—",
      brown: "brown",
      blue: "blue",
      green: "green",
      gray: "gray",
      hazel: "hazel",
      amber: "amber",
      other: "other",
    },
    relationshipStatus: {
      single: "single",
      dating: "dating",
      married: "married",
      complicated: "complicated",
      prefer_not: "—",
    },
    supportSystem: {
      self: "myself",
      partner_supports: "partner supports",
      partner_neutral: "partner neutral",
      family_friends: "family or friends",
      low_support: "low support",
      prefer_not: "—",
    },
    petCompanion: {
      none: "—",
      cat: "cat",
      dog: "dog",
      cat_and_dog: "cat and dog",
      other: "other",
    },
  },
} as const;

const getRoleLabels = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return roleLabels.pl;
    case "en":
      return roleLabels.en;
    case "uk":
    default:
      return roleLabels.uk;
  }
};

const getProfileCopy = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return profileCopy.pl;
    case "en":
      return profileCopy.en;
    case "uk":
    default:
      return profileCopy.uk;
  }
};

const getRoleLabel = (language: AppLanguage, role: UserRole) => {
  const labels = getRoleLabels(language);

  switch (role) {
    case "VERIFIED_USER":
      return labels.VERIFIED_USER;
    case "HELPER":
      return labels.HELPER;
    case "NUTRITIONIST":
      return labels.NUTRITIONIST;
    case "MODERATOR":
      return labels.MODERATOR;
    case "ADMIN":
      return labels.ADMIN;
    case "OWNER":
      return labels.OWNER;
    case "SUPER_ADMIN":
      return labels.SUPER_ADMIN;
    case "USER":
    default:
      return labels.USER;
  }
};

const getDietStyleLabels = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return dietStyleLabels.pl;
    case "en":
      return dietStyleLabels.en;
    case "uk":
    default:
      return dietStyleLabels.uk;
  }
};

const getDietStyleLabel = (
  labels: ReturnType<typeof getDietStyleLabels>,
  dietStyle: DietStyle
) => {
  switch (dietStyle) {
    case "vegetarian":
      return labels.vegetarian;
    case "vegan":
      return labels.vegan;
    case "pescatarian":
      return labels.pescatarian;
    case "low_carb":
      return labels.low_carb;
    case "gluten_free":
      return labels.gluten_free;
    case "balanced":
    default:
      return labels.balanced;
  }
};

const getPersonalDetailLabels = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return personalDetailLabels.pl;
    case "en":
      return personalDetailLabels.en;
    case "uk":
    default:
      return personalDetailLabels.uk;
  }
};

const getCommunityStatusLabel = (status: CommunityMemberStatus) => {
  switch (status) {
    case "ACTIVE_MEMBER":
      return communityStatusLabels.ACTIVE_MEMBER;
    case "TRUSTED_MEMBER":
      return communityStatusLabels.TRUSTED_MEMBER;
    case "COMMUNITY_EXPERT":
      return communityStatusLabels.COMMUNITY_EXPERT;
    case "NEW_MEMBER":
    default:
      return communityStatusLabels.NEW_MEMBER;
  }
};

const getLanguageLabel = (
  labels: Record<AppLanguage, string>,
  language: AppLanguage
) => {
  switch (language) {
    case "pl":
      return labels.pl;
    case "en":
      return labels.en;
    case "uk":
    default:
      return labels.uk;
  }
};

const ProfilePage = () => {
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const {
    dailyCalories,
    targetWeight,
    targetWeightStart,
    dietStyle,
    allergies,
    excludedIngredients,
    adaptiveMode,
    languagePreference,
    personalDetails,
  } = profile;
  const totalMealNutrients = useSelector(selectTodayMealTotalNutrients);
  const currentWeight = useSelector(selectCurrentWeight);
  const macroTargets = useSelector(selectDailyMacroTargets);
  const macroProgress = useSelector(selectDailyMacroProgress);
  const { t, appLanguage, languageLabels } = useLanguage();
  const copy = getProfileCopy(appLanguage);
  const renderLazySection = (
    tabKey: string,
    tabLabel: string,
    fallback: ReactNode,
    children: ReactNode
  ) => {
    const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, tabLabel);

    return (
      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey={`profile:${tabKey}`}
      >
        <Suspense fallback={fallback}>{children}</Suspense>
      </LazyModuleBoundary>
    );
  };
  const localizedDietLabels = getDietStyleLabels(appLanguage);
  const localizedPersonalDetails = getPersonalDetailLabels(appLanguage);

  if (!user) {
    return (
      <EmptyState
        title={t("profile.notFound")}
        description={t("dashboard.needLogin")}
      />
    );
  }

  const communityStatus =
    user.communityStatus ?? resolveCommunityStatus(user.reputationScore);
  const canSeeOperationalDetails = canAccessAdminCenter(user.role);
  const canSeeWomenHealthSection =
    isWomenHealthVisibleForGender(user.gender) ||
    hasWomenHealthContext(profile.womenHealth) ||
    hasActivePregnancyPartnerLink(profile.partnerSharing);
  const caloriePercent = dailyCalories
    ? Math.min((totalMealNutrients.calories / dailyCalories) * 100, 100)
    : 0;
  const hasTargetWeight = typeof targetWeight === "number" && Number.isFinite(targetWeight);
  const progressStart = targetWeightStart ?? currentWeight;
  const effectiveTargetWeight = hasTargetWeight ? targetWeight : currentWeight;
  const distanceToTarget = Math.abs(effectiveTargetWeight - currentWeight);
  const fullDistance = Math.abs(effectiveTargetWeight - progressStart);
  const targetReached = hasTargetWeight
    ? fullDistance === 0
      ? currentWeight === effectiveTargetWeight
      : effectiveTargetWeight < progressStart
        ? currentWeight <= effectiveTargetWeight
        : currentWeight >= effectiveTargetWeight
    : false;
  const remainingWeight = hasTargetWeight && !targetReached ? distanceToTarget : 0;
  const weightProgress = !hasTargetWeight
    ? 0
    : fullDistance === 0
      ? currentWeight === effectiveTargetWeight
        ? 100
        : 0
      : Math.min((Math.abs(currentWeight - progressStart) / fullDistance) * 100, 100);
  const weightSummary = !hasTargetWeight
    ? copy.targetMissing
    : targetReached
      ? fullDistance === 0
        ? copy.targetSame
        : copy.targetReached
      : copy.targetAway(remainingWeight.toFixed(1));

  return (
    <PageShell
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      assistantHint={<EcosystemPulse focus="profile" />}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 1,
          border: PROFILE_CARD_BORDER,
          background:
            "linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(101,163,13,0.14) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ xs: PROFILE_ALIGN_START, md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.avatar} sx={{ width: 84, height: 84 }}>
              {user.name[0]}
            </Avatar>
            <Box>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 900 }}>
                {user.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {user.email}
              </Typography>
            </Box>
          </Stack>

          <Stack
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "flex-end" }}
            sx={{ width: { xs: "100%", md: "auto" }, maxWidth: { md: 620 } }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent={{ xs: PROFILE_ALIGN_START, md: "flex-end" }}
            >
              <Chip
                label={`${copy.roleLabel}: ${getRoleLabel(appLanguage, user.role)}`}
                color={user.role === "USER" ? "default" : "primary"}
                variant={user.role === "USER" ? "outlined" : "filled"}
              />
              <Chip
                label={`${copy.emailLabel}: ${
                  user.emailVerified ? copy.emailVerified : copy.emailUnverified
                }`}
                color={user.emailVerified ? "success" : "warning"}
                variant="outlined"
              />
              <Chip label={`${t("dashboard.age")}: ${user.age}`} />
              <Chip label={`${t("dashboard.weight")}: ${currentWeight.toFixed(1)} ${t("common.kg")}`} />
              <Chip label={`${t("dashboard.height")}: ${user.height} ${t("common.cm")}`} />
              {canSeeOperationalDetails && (
                <>
                  <Chip
                    label={`${copy.statusLabel}: ${getCommunityStatusLabel(communityStatus)}`}
                    variant="outlined"
                  />
                  <Chip
                    label={`${copy.bloodGroupLabel}: ${localizedPersonalDetails.bloodGroup[personalDetails.bloodGroup]}`}
                  />
                  <Chip
                    label={`${copy.eyeColorLabel}: ${localizedPersonalDetails.eyeColor[personalDetails.eyeColor]}`}
                  />
                  <Chip
                    label={`${copy.relationshipLabel}: ${localizedPersonalDetails.relationshipStatus[personalDetails.relationshipStatus]}`}
                  />
                  <Chip
                    label={`${copy.supportLabel}: ${localizedPersonalDetails.supportSystem[personalDetails.supportSystem]}`}
                  />
                  <Chip
                    label={`${copy.petLabel}: ${localizedPersonalDetails.petCompanion[personalDetails.petCompanion]}`}
                  />
                </>
              )}
              {hasTargetWeight && (
                <Chip
                  label={`${copy.target}: ${effectiveTargetWeight.toFixed(1)} ${t("common.kg")}`}
                />
              )}
            </Stack>

            {canSeeWomenHealthSection && (
              <Stack
                data-women-health-entrypoint="true"
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{
                  width: "100%",
                  p: 1.5,
                  borderRadius: 1,
                  border: PROFILE_CARD_BORDER,
                  background:
                    "linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(132,204,22,0.12) 100%)",
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 38,
                      height: 38,
                      flex: "0 0 auto",
                      borderRadius: 1,
                      color: PROFILE_ACCENT_COLOR,
                      bgcolor: "rgba(20,184,166,0.14)",
                    }}
                  >
                    <HeartPulse size={20} aria-hidden="true" />
                  </Box>
                  <Box minWidth={0}>
                    <Typography
                      variant="caption"
                      sx={{ color: PROFILE_ACCENT_COLOR, fontWeight: 900 }}
                    >
                      {copy.womenHealthEntryEyebrow}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      {copy.womenHealthEntryTitle}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.45 }}>
                      {copy.womenHealthEntrySubtitle}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  component={RouterLink}
                  to="/profile#women-health"
                  variant="contained"
                  endIcon={<ArrowRight size={16} aria-hidden="true" />}
                  sx={{
                    alignSelf: { xs: "stretch", sm: "center" },
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copy.womenHealthEntryAction}
                </Button>
              </Stack>
            )}

            <Stack
              data-telegram-entrypoint="true"
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              sx={{
                width: "100%",
                p: 1.5,
                borderRadius: 1,
                border: PROFILE_CARD_BORDER,
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.11) 0%, rgba(20,184,166,0.12) 100%)",
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 38,
                    height: 38,
                    flex: "0 0 auto",
                    borderRadius: 1,
                    color: PROFILE_ACCENT_COLOR,
                    bgcolor: "rgba(14,165,233,0.14)",
                  }}
                >
                  <MessageCircle size={20} aria-hidden="true" />
                </Box>
                <Box minWidth={0}>
                  <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {copy.telegramEntryTitle}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.45 }}>
                    {copy.telegramEntrySubtitle}
                  </Typography>
                </Box>
              </Stack>
              <Button
                component={RouterLink}
                to="/profile#telegram-connect"
                variant="outlined"
                endIcon={<ArrowRight size={16} aria-hidden="true" />}
                sx={{
                  alignSelf: { xs: "stretch", sm: "center" },
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                {copy.telegramEntryAction}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {renderLazySection(
        "telegram",
        "Telegram",
        <LoadingSkeleton cards={1} bodyRows={2} />,
        <TelegramConnectionCard />
      )}

      <ProfileSectionTabs
        ariaLabel={copy.sectionsAriaLabel}
        sections={[
          {
            id: "data",
            label: copy.tabs.data,
            content: (
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 1,
                    border: PROFILE_CARD_BORDER,
                    backgroundColor: PROFILE_GLASS_BACKGROUND,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: PROFILE_ALIGN_START, sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
                          {copy.profileInfoTitle}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                          {copy.profileInfoSubtitle}
                        </Typography>
                      </Box>
                      <Button
                        variant={profileEditorOpen ? "outlined" : "contained"}
                        onClick={() => setProfileEditorOpen((current) => !current)}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                      >
                        {profileEditorOpen ? copy.hideEditor : copy.editProfile}
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`${copy.emailLabel}: ${user.email}`} variant="outlined" />
                      <Chip
                        label={`${copy.emailLabel}: ${
                          user.emailVerified ? copy.emailVerified : copy.emailUnverified
                        }`}
                        color={user.emailVerified ? "success" : "warning"}
                        variant="outlined"
                      />
                      <Chip label={`${t("dashboard.age")}: ${user.age}`} />
                      <Chip label={`${t("dashboard.weight")}: ${currentWeight.toFixed(1)} ${t("common.kg")}`} />
                      <Chip label={`${t("dashboard.height")}: ${user.height} ${t("common.cm")}`} />
                      <Chip label={`${copy.dietLabel}: ${getDietStyleLabel(localizedDietLabels, dietStyle)}`} />
                      <Chip label={`${copy.languageLabel}: ${getLanguageLabel(languageLabels, languagePreference)}`} />
                      {hasTargetWeight && (
                        <Chip
                          label={`${copy.target}: ${effectiveTargetWeight.toFixed(1)} ${t("common.kg")}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                {profileEditorOpen && <ProfileForm />}
                {renderLazySection(
                  "data",
                  copy.tabs.data,
                  <LoadingSkeleton cards={3} chart bodyRows={3} />,
                  <Stack spacing={3}>
                    <WeightTrendCard />
                    <MeasurementsCheckInCard />
                    <BodyProgressPhotosCard />
                  </Stack>
                )}
              </Stack>
            ),
          },
          {
            id: "goal",
            label: copy.tabs.goal,
            content: (
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                    gap: 3,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 1,
                      border: PROFILE_CARD_BORDER,
                      backgroundColor: PROFILE_GLASS_BACKGROUND,
                    }}
                  >
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {t("profile.progress")}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                      {totalMealNutrients.calories.toFixed(0)} / {dailyCalories} {t("common.kcal")}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={caloriePercent}
                      sx={{ height: 12, borderRadius: 999 }}
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 1,
                      border: PROFILE_CARD_BORDER,
                      backgroundColor: PROFILE_GLASS_BACKGROUND,
                    }}
                  >
                    <Stack spacing={1.6}>
                      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
                        {copy.weightGoal}
                      </Typography>
                      <Typography color="text.secondary">{copy.weightGoalSubtitle}</Typography>
                      <Typography color="text.secondary">{weightSummary}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={weightProgress}
                        sx={{
                          height: 12,
                          borderRadius: 999,
                          bgcolor: "rgba(15, 23, 42, 0.08)",
                          "& .MuiLinearProgress-bar": {
                            background:
                              "linear-gradient(135deg, rgba(15,118,110,1) 0%, rgba(101,163,13,1) 100%)",
                          },
                        }}
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={`${copy.start}: ${progressStart.toFixed(1)} ${t("common.kg")}`} />
                        <Chip label={`${copy.current}: ${currentWeight.toFixed(1)} ${t("common.kg")}`} />
                        <Chip
                          label={
                            hasTargetWeight
                              ? `${copy.target}: ${effectiveTargetWeight.toFixed(1)} ${t("common.kg")}`
                              : copy.target
                          }
                          color={hasTargetWeight ? "primary" : "default"}
                          variant={hasTargetWeight ? "filled" : "outlined"}
                        />
                        {hasTargetWeight && (
                          <Chip
                            label={`${copy.remaining}: ${remainingWeight.toFixed(1)} ${t("common.kg")}`}
                            color={targetReached ? "success" : "default"}
                          />
                        )}
                      </Stack>
                      {hasTargetWeight && (
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {progressStart.toFixed(1)} {t("common.kg")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {weightProgress.toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {effectiveTargetWeight.toFixed(1)} {t("common.kg")}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 1,
                    border: PROFILE_CARD_BORDER,
                    backgroundColor: PROFILE_GLASS_BACKGROUND,
                  }}
                >
                  <Stack spacing={1.4}>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
                      {copy.macroTitle}
                    </Typography>
                    <Typography color="text.secondary">{copy.macroSubtitle}</Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                        gap: 2,
                      }}
                    >
                      {[
                        {
                          label: t("dashboard.protein"),
                          current: macroProgress.protein.current,
                          target: macroTargets.protein,
                          progress: macroProgress.protein.progress,
                        },
                        {
                          label: t("dashboard.fat"),
                          current: macroProgress.fat.current,
                          target: macroTargets.fat,
                          progress: macroProgress.fat.progress,
                        },
                        {
                          label: t("dashboard.carbs"),
                          current: macroProgress.carbs.current,
                          target: macroTargets.carbs,
                          progress: macroProgress.carbs.progress,
                        },
                      ].map((macro) => (
                        <Paper
                          key={macro.label}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            borderColor: "rgba(15, 23, 42, 0.08)",
                          }}
                        >
                          <Stack spacing={1}>
                            <Typography sx={{ fontWeight: 800 }}>{macro.label}</Typography>
                            <Typography color="text.secondary">
                              {macro.current.toFixed(1)} / {macro.target.toFixed(0)} {t("common.g")}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={macro.progress}
                              sx={{ height: 8, borderRadius: 999 }}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Box>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 1,
                    border: PROFILE_CARD_BORDER,
                    backgroundColor: PROFILE_GLASS_BACKGROUND,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
                      {copy.preferencesTitle}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`${copy.dietLabel}: ${getDietStyleLabel(localizedDietLabels, dietStyle)}`} />
                      <Chip label={`${copy.languageLabel}: ${getLanguageLabel(languageLabels, languagePreference)}`} />
                      {allergies.map((item) => (
                        <Chip key={`allergy-${item}`} label={`${copy.allergiesLabel}: ${item}`} />
                      ))}
                      {excludedIngredients.map((item) => (
                        <Chip key={`excluded-${item}`} label={`${copy.exclusionsLabel}: ${item}`} />
                      ))}
                    </Stack>
                    {allergies.length === 0 && excludedIngredients.length === 0 && (
                      <Typography color="text.secondary">{copy.noRestrictions}</Typography>
                    )}
                    <Typography color="text.secondary">
                      {adaptiveMode === "automatic" ? copy.adaptiveAuto : copy.adaptiveManual}
                    </Typography>
                  </Stack>
                </Paper>

                {renderLazySection(
                  "goal",
                  copy.tabs.goal,
                  <LoadingSkeleton cards={3} chart bodyRows={3} />,
                  <Stack spacing={3}>
                    <AdaptiveGoalCard />
                    <BodyWeeklyReportCard />
                    <MealDayOverview />
                    <DailyHistoryExplorer />
                  </Stack>
                )}
              </Stack>
            ),
          },
          ...(canSeeWomenHealthSection
            ? [
                {
                  id: "women-health",
                  label: copy.tabs.womenHealth,
                  content: renderLazySection(
                    "women-health",
                    copy.tabs.womenHealth,
                    <LoadingSkeleton cards={3} chart bodyRows={3} />,
                    <WomenHealthOverviewCard />
                  ),
                },
              ]
            : []),
          {
            id: "assistant",
            label: copy.tabs.assistant,
            content: (
              renderLazySection(
                "assistant",
                copy.tabs.assistant,
                <LoadingSkeleton cards={3} bodyRows={3} />,
                <Stack spacing={3}>
                  <CompanionShopCard />
                  <AssistantCustomizationCard />
                  <CommunityHubCard />
                </Stack>
              )
            ),
          },
          {
            id: "motivation",
            label: copy.tabs.motivation,
            content: (
              renderLazySection(
                "motivation",
                copy.tabs.motivation,
                <LoadingSkeleton cards={3} bodyRows={3} />,
                <Stack spacing={3}>
                  <BehaviorPersonalizationCard />
                  <MotivationHubCard />
                  <PremiumAccessCard />
                </Stack>
              )
            ),
          },
          {
            id: "security",
            label: copy.tabs.security,
            content: (
              renderLazySection(
                "security",
                copy.tabs.security,
                <LoadingSkeleton cards={4} bodyRows={3} />,
                <Stack spacing={3}>
                  <NotificationSettingsCard />
                  <SupplementRecommendationCard />
                  <ReminderManagementCard />
                  {canSeeOperationalDetails && <CloudSyncStatusCard />}
                  <AccountDataCard />
                  {canSeeOperationalDetails && <AdminCenterCard />}
                </Stack>
              )
            ),
          },
        ]}
      />
    </PageShell>
  );
};

export default ProfilePage;
