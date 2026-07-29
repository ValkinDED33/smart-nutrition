import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Goal } from "@domain/user/types";
import {
  createDefaultNutritionPreferences,
  createDefaultNotificationPreferences,
} from "@domain/user/preferences";
import {
  calculatePaidDayOffCost,
  canUseFreeDay,
  canUsePaidDay,
  completeMotivationTaskState,
  createDefaultAssistantCustomization,
  createDefaultMotivationState,
  refreshMotivationState,
  resetMotivationState,
  updateAchievements,
  applyFreeDayState,
  applyPaidDayState,
} from "@domain/profile/motivation";
import type {
  AdaptiveMode,
  AssistantCustomization,
  AssistantCompanionKind,
  AssistantCompanionRenderMode,
  AssistantMemoryProfile,
  AssistantMood,
  AssistantRole,
  AssistantTone,
  AchievementProgress,
  BloodGroup,
  DietStyle,
  EyeColor,
  MeasurementHistoryItem,
  MotivationHistoryItem,
  MotivationState,
  MotivationTask,
  MotivationTaskCategory,
  PartnerShareInvite,
  PartnerShareLink,
  PartnerSharePermission,
  PartnerSharingState,
  PersonalProfileDetails,
  PetCompanion,
  PremiumPlanId,
  PremiumSubscriptionState,
  ProgressPhotoHistoryItem,
  RelationshipStatus,
  ReminderTimes,
  SupportSystem,
  FamilyLifecycleMode,
  WomenHealthState,
  WeeklyCheckInState,
} from "@domain/profile/types";
import type { AppLanguage } from "@shared/types/i18n";
import { normalizeAssistantOnboardingProfile } from "@core/assistant";
import {
  isFamilyLifecycleMode,
  resolveFamilyLifecycleMode,
} from "@domain/profile/familyLifecycle";
import {
  createDefaultWomenHealthState,
  normalizeWomenHealthState,
} from "@domain/profile/womenHealth";

interface WeightHistoryItem {
  date: string;
  weight: number;
}

export interface ProfileState {
  dailyCalories: number;
  goal: Goal;
  weightHistory: WeightHistoryItem[];
  measurementHistory: MeasurementHistoryItem[];
  progressPhotos: ProgressPhotoHistoryItem[];
  weeklyCheckIn: WeeklyCheckInState;
  maintenanceCalories: number;
  adaptiveCalories: number | null;
  targetWeight: number | null;
  targetWeightStart: number | null;
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  adaptiveMode: AdaptiveMode;
  notificationsEnabled: boolean;
  mealRemindersEnabled: boolean;
  calorieAlertsEnabled: boolean;
  reminderTimes: ReminderTimes;
  languagePreference: AppLanguage;
  motivation: MotivationState;
  assistant: AssistantCustomization;
  premium: PremiumSubscriptionState;
  personalDetails: PersonalProfileDetails;
  womenHealth: WomenHealthState;
  partnerSharing: PartnerSharingState;
  familyLifecycleMode: FamilyLifecycleMode;
}

interface ProfileTargetsPayload {
  goal: Goal;
  weight: number;
  maintenanceCalories: number;
  targetCalories: number;
  targetWeight: number | null;
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  adaptiveMode: AdaptiveMode;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGoal = (value: unknown): value is Goal =>
  value === "cut" || value === "maintain" || value === "bulk";

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toNullableNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const MAX_PROGRESS_PHOTO_DATA_URL_LENGTH = 1_700_000;
const SAFE_PROGRESS_PHOTO_DATA_URL_PATTERN =
  /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;

const isSafeProgressPhotoDataUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= MAX_PROGRESS_PHOTO_DATA_URL_LENGTH &&
  SAFE_PROGRESS_PHOTO_DATA_URL_PATTERN.test(value);

const isDietStyle = (value: unknown): value is DietStyle =>
  value === "balanced" ||
  value === "vegetarian" ||
  value === "vegan" ||
  value === "pescatarian" ||
  value === "low_carb" ||
  value === "gluten_free";

const isAdaptiveMode = (value: unknown): value is AdaptiveMode =>
  value === "automatic" || value === "manual";
const isAppLanguage = (value: unknown): value is AppLanguage =>
  value === "uk" || value === "pl" || value === "en";
const isAssistantRole = (value: unknown): value is AssistantRole =>
  value === "friend" || value === "assistant" || value === "coach";
const isAssistantTone = (value: unknown): value is AssistantTone =>
  value === "gentle" ||
  value === "playful" ||
  value === "focused" ||
  value === "calm" ||
  value === "scientific";
const isAssistantMood = (value: unknown): value is AssistantMood =>
  value === "idle" ||
  value === "happy" ||
  value === "coach" ||
  value === "concerned" ||
  value === "sleepy" ||
  value === "celebrate";
const isAssistantCompanionKind = (value: unknown): value is AssistantCompanionKind =>
  value === "cat" ||
  value === "dog" ||
  value === "fox" ||
  value === "panda" ||
  value === "owl" ||
  value === "human" ||
  value === "capybara" ||
  value === "dragon" ||
  value === "robot";
const isAssistantCompanionRenderMode = (
  value: unknown
): value is AssistantCompanionRenderMode => value === "2d" || value === "3d";
const isTaskCategory = (value: unknown): value is MotivationTaskCategory =>
  value === "nutrition" || value === "consistency" || value === "reflection";
const isBloodGroup = (value: unknown): value is BloodGroup =>
  value === "unknown" ||
  value === "o_positive" ||
  value === "o_negative" ||
  value === "a_positive" ||
  value === "a_negative" ||
  value === "b_positive" ||
  value === "b_negative" ||
  value === "ab_positive" ||
  value === "ab_negative";
const isEyeColor = (value: unknown): value is EyeColor =>
  value === "unknown" ||
  value === "brown" ||
  value === "blue" ||
  value === "green" ||
  value === "gray" ||
  value === "hazel" ||
  value === "amber" ||
  value === "other";
const isRelationshipStatus = (value: unknown): value is RelationshipStatus =>
  value === "single" ||
  value === "dating" ||
  value === "married" ||
  value === "complicated" ||
  value === "prefer_not";
const isSupportSystem = (value: unknown): value is SupportSystem =>
  value === "self" ||
  value === "partner_supports" ||
  value === "partner_neutral" ||
  value === "family_friends" ||
  value === "low_support" ||
  value === "prefer_not";
const isPetCompanion = (value: unknown): value is PetCompanion =>
  value === "none" ||
  value === "cat" ||
  value === "dog" ||
  value === "cat_and_dog" ||
  value === "other";
const isPartnerSharePermission = (value: unknown): value is PartnerSharePermission =>
  value === "pregnancy_timeline";

const isReminderTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
const toNullableIsoDate = (value: unknown): string | null =>
  value === null ? null : isIsoDate(value) ? value : null;
const isPremiumPlan = (value: unknown): value is PremiumPlanId =>
  value === "free" || value === "pro" || value === "coach";
const isPremiumStatus = (
  value: unknown
): value is PremiumSubscriptionState["status"] =>
  value === "inactive" || value === "trial" || value === "active" || value === "cancelled";

const addDaysIso = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
};

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const normalizeLimitedStringArray = (value: unknown, maxItems = 12) =>
  normalizeStringArray(value)
    .map((item) => item.trim().replace(/\s+/g, " ").slice(0, 120))
    .filter(Boolean)
    .slice(0, maxItems);

const normalizeReminderTimes = (
  value: unknown,
  fallback: ReminderTimes
): ReminderTimes => {
  const record = isRecord(value) ? value : {};

  return {
    breakfast: isReminderTime(record.breakfast) ? record.breakfast : fallback.breakfast,
    lunch: isReminderTime(record.lunch) ? record.lunch : fallback.lunch,
    dinner: isReminderTime(record.dinner) ? record.dinner : fallback.dinner,
    snack: isReminderTime(record.snack) ? record.snack : fallback.snack,
  };
};

const normalizeWeightHistory = (value: unknown): WeightHistoryItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return null;

          return {
            date:
              typeof item.date === "string" && item.date.trim().length > 0
                ? item.date
                : new Date().toISOString(),
            weight: toNumber(item.weight),
          };
        })
        .filter((item): item is WeightHistoryItem => item !== null)
    : [];

const createDefaultWeeklyCheckInState = (): WeeklyCheckInState => ({
  enabled: true,
  remindIntervalDays: 7,
  lastRecordedAt: null,
});

const createDefaultPremiumSubscription = (): PremiumSubscriptionState => ({
  plan: "free",
  status: "inactive",
  startedAt: null,
  trialEndsAt: null,
  renewsAt: null,
  cancelledAt: null,
});

const createDefaultPersonalDetails = (): PersonalProfileDetails => ({
  bloodGroup: "unknown",
  eyeColor: "unknown",
  relationshipStatus: "prefer_not",
  supportSystem: "self",
  petCompanion: "none",
});

const createDefaultPartnerSharingState = (): PartnerSharingState => ({
  invites: [],
  links: [],
});

const normalizeMeasurementHistory = (value: unknown): MeasurementHistoryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<MeasurementHistoryItem[]>((history, item) => {
    if (!isRecord(item)) {
      return history;
    }

    history.push({
      date:
        typeof item.date === "string" && item.date.trim().length > 0
          ? item.date
          : new Date().toISOString(),
      weight: toNumber(item.weight),
      waist: toNullableNumber(item.waist) ?? undefined,
      abdomen: toNullableNumber(item.abdomen) ?? undefined,
      hip: toNullableNumber(item.hip) ?? undefined,
      chest: toNullableNumber(item.chest) ?? undefined,
    });

    return history;
  }, []);
};

const normalizeProgressPhotos = (value: unknown): ProgressPhotoHistoryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ProgressPhotoHistoryItem[]>((photos, item, index) => {
    if (!isRecord(item)) {
      return photos;
    }

    const imageDataUrl = isSafeProgressPhotoDataUrl(item.imageDataUrl)
      ? item.imageDataUrl
      : null;

    if (!imageDataUrl) {
      return photos;
    }

    photos.push({
      id:
        typeof item.id === "string" && item.id.trim().length > 0
          ? item.id
          : `progress-photo-${index}-${Date.now()}`,
      date: isIsoDate(item.date) ? item.date : new Date().toISOString(),
      imageDataUrl,
      note:
        typeof item.note === "string" && item.note.trim().length > 0
          ? item.note.trim().slice(0, 160)
          : undefined,
    });

    return photos;
  }, []);
};

const normalizeWeeklyCheckIn = (value: unknown): WeeklyCheckInState => {
  const fallback = createDefaultWeeklyCheckInState();
  const record = isRecord(value) ? value : {};

  return {
    enabled:
      typeof record.enabled === "boolean" ? record.enabled : fallback.enabled,
    remindIntervalDays: Math.max(toNumber(record.remindIntervalDays, 7), 1),
    lastRecordedAt: toNullableIsoDate(record.lastRecordedAt),
  };
};

const normalizePremiumSubscription = (value: unknown): PremiumSubscriptionState => {
  const fallback = createDefaultPremiumSubscription();
  const record = isRecord(value) ? value : {};
  const plan = isPremiumPlan(record.plan) ? record.plan : fallback.plan;
  const status = isPremiumStatus(record.status) ? record.status : fallback.status;

  if (plan === "free" && (status === "trial" || status === "active")) {
    return fallback;
  }

  return {
    plan,
    status,
    startedAt: toNullableIsoDate(record.startedAt),
    trialEndsAt: toNullableIsoDate(record.trialEndsAt),
    renewsAt: toNullableIsoDate(record.renewsAt),
    cancelledAt: toNullableIsoDate(record.cancelledAt),
  };
};

const normalizeMotivationTasks = (value: unknown): MotivationTask[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) return null;

          return {
            id:
              typeof item.id === "string"
                ? item.id
                : `task-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            title: typeof item.title === "string" ? item.title : "Task",
            description: typeof item.description === "string" ? item.description : "",
            points: toNumber(item.points, 0),
            category: isTaskCategory(item.category) ? item.category : "consistency",
            createdAt: isIsoDate(item.createdAt) ? item.createdAt : new Date().toISOString(),
            completedAt: toNullableIsoDate(item.completedAt),
            skippedWithDayOffAt: toNullableIsoDate(item.skippedWithDayOffAt),
          };
        })
        .filter((item): item is MotivationTask => item !== null)
    : [];

const normalizeMotivationHistory = (value: unknown): MotivationHistoryItem[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item) || !isIsoDate(item.completedAt)) return null;

          return {
            taskId: typeof item.taskId === "string" ? item.taskId : "task",
            title: typeof item.title === "string" ? item.title : "Task",
            pointsEarned: toNumber(item.pointsEarned, 0),
            completedAt: item.completedAt,
            skipped: Boolean(item.skipped),
            usedDayOff:
              item.usedDayOff === "free" || item.usedDayOff === "paid" ? item.usedDayOff : null,
          };
        })
        .filter((item): item is MotivationHistoryItem => item !== null)
    : [];

const normalizeAchievements = (value: unknown): AchievementProgress[] => {
  const fallback = createDefaultMotivationState().achievements;

  if (!Array.isArray(value)) {
    return fallback;
  }

  return fallback.map((achievement) => {
    const match = value.find(
      (item) => isRecord(item) && typeof item.id === "string" && item.id === achievement.id
    );

    if (!isRecord(match)) {
      return achievement;
    }

    return {
      ...achievement,
      progress: toNumber(match.progress, 0),
      unlockedAt: toNullableIsoDate(match.unlockedAt),
    };
  });
};

const normalizeMotivationState = (value: unknown, goal: Goal): MotivationState => {
  const fallback = createDefaultMotivationState(goal);

  if (!isRecord(value)) {
    return fallback;
  }

  const points = toNumber(value.points, 0);
  const completedTasks = toNumber(value.completedTasks, 0);
  const activeTasks = normalizeMotivationTasks(value.activeTasks);
  const history = normalizeMotivationHistory(value.history);
  const achievements = updateAchievements(
    normalizeAchievements(value.achievements),
    points,
    completedTasks,
    new Date().toISOString()
  );

  return {
    points,
    level: Math.max(toNumber(value.level, 1), 1),
    completedTasks,
    activeTasks: activeTasks.length > 0 ? activeTasks : fallback.activeTasks,
    history,
    achievements,
    lastTaskRefreshDate: isIsoDate(value.lastTaskRefreshDate) ? value.lastTaskRefreshDate.slice(0, 10) : fallback.lastTaskRefreshDate,
    freeDayLastUsedAt: toNullableIsoDate(value.freeDayLastUsedAt),
    paidDayLastUsedAt: toNullableIsoDate(value.paidDayLastUsedAt),
    paidDayLastUsedMonth:
      typeof value.paidDayLastUsedMonth === "string" && /^\d{4}-\d{2}$/.test(value.paidDayLastUsedMonth)
        ? value.paidDayLastUsedMonth
        : null,
  };
};

const normalizeAssistantMemoryProfile = (
  value: unknown,
  fallback: AssistantMemoryProfile
): AssistantMemoryProfile => {
  const record = isRecord(value) ? value : {};

  return {
    goals: normalizeLimitedStringArray(record.goals),
    preferences: normalizeLimitedStringArray(record.preferences),
    conversationHighlights: normalizeLimitedStringArray(record.conversationHighlights),
    lastSyncedAt: toNullableIsoDate(record.lastSyncedAt) ?? fallback.lastSyncedAt,
  };
};

const normalizeAssistantCustomization = (value: unknown): AssistantCustomization => {
  const fallback = createDefaultAssistantCustomization();

  if (!isRecord(value)) {
    return fallback;
  }

  const name =
    typeof value.name === "string" && value.name.trim().length > 0
      ? value.name.trim().slice(0, 32)
      : typeof value.assistantName === "string" && value.assistantName.trim().length > 0
        ? value.assistantName.trim().slice(0, 32)
        : fallback.name;
  const companionKind = isAssistantCompanionKind(value.companionKind)
    ? value.companionKind
    : isAssistantCompanionKind(value.assistantAvatar)
      ? value.assistantAvatar
      : fallback.companionKind;
  const tone = isAssistantTone(value.tone)
    ? value.tone
    : isAssistantTone(value.assistantPersonality)
      ? value.assistantPersonality
      : fallback.tone;

  return {
    name,
    assistantName: name,
    companionKind,
    assistantAvatar: companionKind,
    preferredCompanionRenderMode: isAssistantCompanionRenderMode(
      value.preferredCompanionRenderMode
    )
      ? value.preferredCompanionRenderMode
      : fallback.preferredCompanionRenderMode,
    role: isAssistantRole(value.role) ? value.role : fallback.role,
    tone,
    assistantPersonality: tone,
    assistantMood: isAssistantMood(value.assistantMood)
      ? value.assistantMood
      : fallback.assistantMood,
    assistantMemory: normalizeAssistantMemoryProfile(
      value.assistantMemory,
      fallback.assistantMemory
    ),
    humorEnabled:
      typeof value.humorEnabled === "boolean" ? value.humorEnabled : fallback.humorEnabled,
    widgetEnabled:
      typeof value.widgetEnabled === "boolean" ? value.widgetEnabled : fallback.widgetEnabled,
    proactiveHintsEnabled:
      typeof value.proactiveHintsEnabled === "boolean"
        ? value.proactiveHintsEnabled
        : fallback.proactiveHintsEnabled,
    onboarding: normalizeAssistantOnboardingProfile(value.onboarding),
  };
};

const normalizePersonalDetails = (value: unknown): PersonalProfileDetails => {
  const fallback = createDefaultPersonalDetails();
  const record = isRecord(value) ? value : {};

  return {
    bloodGroup: isBloodGroup(record.bloodGroup) ? record.bloodGroup : fallback.bloodGroup,
    eyeColor: isEyeColor(record.eyeColor) ? record.eyeColor : fallback.eyeColor,
    relationshipStatus: isRelationshipStatus(record.relationshipStatus)
      ? record.relationshipStatus
      : fallback.relationshipStatus,
    supportSystem: isSupportSystem(record.supportSystem)
      ? record.supportSystem
      : fallback.supportSystem,
    petCompanion: isPetCompanion(record.petCompanion)
      ? record.petCompanion
      : fallback.petCompanion,
  };
};

const normalizePartnerPermissions = (value: unknown): PartnerSharePermission[] => {
  const permissions = Array.isArray(value)
    ? value.filter(isPartnerSharePermission)
    : ["pregnancy_timeline"];

  return permissions.includes("pregnancy_timeline") ? ["pregnancy_timeline"] : [];
};

const normalizePartnerSharingState = (value: unknown): PartnerSharingState => {
  const record = isRecord(value) ? value : {};

  const invites: PartnerShareInvite[] = Array.isArray(record.invites)
    ? record.invites
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const id = typeof item.id === "string" ? item.id.trim().slice(0, 96) : "";
          const codeHash =
            typeof item.codeHash === "string" ? item.codeHash.trim().slice(0, 160) : "";
          const expiresAt = toNullableIsoDate(item.expiresAt);
          const createdAt = toNullableIsoDate(item.createdAt);

          if (!id || !codeHash || !expiresAt || !createdAt) {
            return null;
          }

          return {
            id,
            codeHash,
            codePreview:
              typeof item.codePreview === "string"
                ? item.codePreview.trim().replace(/\s+/g, "").slice(-6)
                : "",
            permissions: normalizePartnerPermissions(item.permissions),
            expiresAt,
            createdAt,
            acceptedAt: toNullableIsoDate(item.acceptedAt),
          };
        })
        .filter((item): item is PartnerShareInvite => item !== null)
        .slice(-10)
    : [];

  const links: PartnerShareLink[] = Array.isArray(record.links)
    ? record.links
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const id = typeof item.id === "string" ? item.id.trim().slice(0, 96) : "";
          const partnerUserId =
            typeof item.partnerUserId === "string"
              ? item.partnerUserId.trim().slice(0, 96)
              : "";
          const connectedAt = toNullableIsoDate(item.connectedAt);

          if (!id || !partnerUserId || !connectedAt) {
            return null;
          }

          return {
            id,
            partnerUserId,
            role: item.role === "owner" ? "owner" : "partner",
            permissions: normalizePartnerPermissions(item.permissions),
            status: item.status === "revoked" ? "revoked" : "active",
            connectedAt,
            revokedAt: toNullableIsoDate(item.revokedAt),
          };
        })
        .filter((item): item is PartnerShareLink => item !== null)
        .slice(-10)
    : [];

  return { invites, links };
};

const createInitialProfileState = (): ProfileState => ({
  dailyCalories: 0,
  goal: "maintain",
  weightHistory: [],
  measurementHistory: [],
  progressPhotos: [],
  weeklyCheckIn: createDefaultWeeklyCheckInState(),
  maintenanceCalories: 0,
  adaptiveCalories: null,
  targetWeight: null,
  targetWeightStart: null,
  ...createDefaultNutritionPreferences(),
  ...createDefaultNotificationPreferences(),
  languagePreference: "uk",
  motivation: createDefaultMotivationState(),
  assistant: createDefaultAssistantCustomization(),
  premium: createDefaultPremiumSubscription(),
  personalDetails: createDefaultPersonalDetails(),
  womenHealth: createDefaultWomenHealthState(),
  partnerSharing: createDefaultPartnerSharingState(),
  familyLifecycleMode: "personal",
});

export const normalizeProfileState = (value: unknown): ProfileState => {
  const fallback = createInitialProfileState();

  if (!isRecord(value)) {
    return fallback;
  }

  const womenHealth = normalizeWomenHealthState(value.womenHealth);
  const partnerSharing = normalizePartnerSharingState(value.partnerSharing);

  return {
    dailyCalories: toNumber(value.dailyCalories),
    goal: isGoal(value.goal) ? value.goal : "maintain",
    weightHistory: normalizeWeightHistory(value.weightHistory),
    measurementHistory: normalizeMeasurementHistory(value.measurementHistory),
    progressPhotos: normalizeProgressPhotos(value.progressPhotos),
    weeklyCheckIn: normalizeWeeklyCheckIn(value.weeklyCheckIn),
    maintenanceCalories: toNumber(value.maintenanceCalories),
    adaptiveCalories: toNullableNumber(value.adaptiveCalories),
    targetWeight: toNullableNumber(value.targetWeight),
    targetWeightStart: toNullableNumber(value.targetWeightStart),
    dietStyle: isDietStyle(value.dietStyle) ? value.dietStyle : "balanced",
    allergies: normalizeStringArray(value.allergies),
    excludedIngredients: normalizeStringArray(value.excludedIngredients),
    adaptiveMode: isAdaptiveMode(value.adaptiveMode) ? value.adaptiveMode : "automatic",
    notificationsEnabled:
      typeof value.notificationsEnabled === "boolean"
        ? value.notificationsEnabled
        : fallback.notificationsEnabled,
    mealRemindersEnabled:
      typeof value.mealRemindersEnabled === "boolean"
        ? value.mealRemindersEnabled
        : fallback.mealRemindersEnabled,
    calorieAlertsEnabled:
      typeof value.calorieAlertsEnabled === "boolean"
        ? value.calorieAlertsEnabled
        : fallback.calorieAlertsEnabled,
    reminderTimes: normalizeReminderTimes(value.reminderTimes, fallback.reminderTimes),
    languagePreference: isAppLanguage(value.languagePreference)
      ? value.languagePreference
      : fallback.languagePreference,
    motivation: normalizeMotivationState(
      value.motivation,
      isGoal(value.goal) ? value.goal : "maintain"
    ),
    assistant: normalizeAssistantCustomization(value.assistant),
    premium: normalizePremiumSubscription(value.premium),
    personalDetails: normalizePersonalDetails(value.personalDetails),
    womenHealth,
    partnerSharing,
    familyLifecycleMode: resolveFamilyLifecycleMode({
      explicitMode: value.familyLifecycleMode,
      womenHealth,
      partnerSharing,
    }),
  };
};

const initialState: ProfileState = createInitialProfileState();

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    replaceProfileState(_, action: PayloadAction<unknown>) {
      return normalizeProfileState(action.payload);
    },

    setDailyCalories(state, action: PayloadAction<number>) {
      state.dailyCalories = action.payload;
    },

    setMaintenanceCalories(state, action: PayloadAction<number>) {
      state.maintenanceCalories = action.payload;
    },

    setAdaptiveCalories(state, action: PayloadAction<number | null>) {
      state.adaptiveCalories = action.payload;
      if (action.payload !== null) {
        state.dailyCalories = action.payload;
      }
    },

    setGoal(state, action: PayloadAction<Goal>) {
      state.goal = action.payload;
      state.motivation.lastTaskRefreshDate = null;
      state.motivation = refreshMotivationState(state.motivation, action.payload);
    },

    updateWeight(state, action: PayloadAction<number>) {
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload,
      });
    },

    recordMeasurementCheckIn(
      state,
      action: PayloadAction<{
        weight: number;
        waist?: number;
        abdomen?: number;
        hip?: number;
        chest?: number;
        recordedAt?: string;
      }>
    ) {
      const recordedAt = action.payload.recordedAt ?? new Date().toISOString();

      state.weightHistory.push({
        date: recordedAt,
        weight: action.payload.weight,
      });
      state.measurementHistory.unshift({
        date: recordedAt,
        weight: action.payload.weight,
        waist: action.payload.waist,
        abdomen: action.payload.abdomen,
        hip: action.payload.hip,
        chest: action.payload.chest,
      });
      state.weeklyCheckIn.lastRecordedAt = recordedAt;
    },

    addProgressPhoto(
      state,
      action: PayloadAction<{
        imageDataUrl: string;
        note?: string;
        recordedAt?: string;
      }>
    ) {
      if (!isSafeProgressPhotoDataUrl(action.payload.imageDataUrl)) {
        return;
      }

      const id =
        globalThis.crypto?.randomUUID?.() ??
        `progress-photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      state.progressPhotos.unshift({
        id,
        date: action.payload.recordedAt ?? new Date().toISOString(),
        imageDataUrl: action.payload.imageDataUrl,
        note:
          action.payload.note && action.payload.note.trim().length > 0
            ? action.payload.note.trim().slice(0, 160)
            : undefined,
      });
      state.progressPhotos = state.progressPhotos.slice(0, 12);
    },

    removeProgressPhoto(state, action: PayloadAction<string>) {
      state.progressPhotos = state.progressPhotos.filter(
        (photo) => photo.id !== action.payload
      );
    },

    applyProfileTargets(state, action: PayloadAction<ProfileTargetsPayload>) {
      state.goal = action.payload.goal;
      state.maintenanceCalories = action.payload.maintenanceCalories;
      state.adaptiveCalories = action.payload.targetCalories;
      state.dailyCalories = action.payload.targetCalories;
      state.dietStyle = action.payload.dietStyle;
      state.allergies = action.payload.allergies;
      state.excludedIngredients = action.payload.excludedIngredients;
      state.adaptiveMode = action.payload.adaptiveMode;
      state.motivation.lastTaskRefreshDate = null;
      state.motivation = refreshMotivationState(state.motivation, action.payload.goal);
      if (action.payload.targetWeight === null) {
        state.targetWeight = null;
        state.targetWeightStart = null;
      } else {
        const targetChanged = state.targetWeight !== action.payload.targetWeight;
        state.targetWeight = action.payload.targetWeight;

        if (state.targetWeightStart === null || targetChanged) {
          state.targetWeightStart = action.payload.weight;
        }
      }
      state.weightHistory.push({
        date: new Date().toISOString(),
        weight: action.payload.weight,
      });
    },

    updateNotificationPreferences(
      state,
      action: PayloadAction<{
        notificationsEnabled?: boolean;
        mealRemindersEnabled?: boolean;
        calorieAlertsEnabled?: boolean;
        reminderTimes?: Partial<ReminderTimes>;
      }>
    ) {
      if (typeof action.payload.notificationsEnabled === "boolean") {
        state.notificationsEnabled = action.payload.notificationsEnabled;
      }

      if (typeof action.payload.mealRemindersEnabled === "boolean") {
        state.mealRemindersEnabled = action.payload.mealRemindersEnabled;
      }

      if (typeof action.payload.calorieAlertsEnabled === "boolean") {
        state.calorieAlertsEnabled = action.payload.calorieAlertsEnabled;
      }

      if (action.payload.reminderTimes) {
        state.reminderTimes = normalizeReminderTimes(action.payload.reminderTimes, state.reminderTimes);
      }
    },

    setProfileLanguage(state, action: PayloadAction<AppLanguage>) {
      state.languagePreference = action.payload;
    },

    setAssistantCustomization(
      state,
      action: PayloadAction<Partial<AssistantCustomization>>
    ) {
      state.assistant = normalizeAssistantCustomization({
        ...state.assistant,
        ...action.payload,
      });
    },

    updatePersonalDetails(
      state,
      action: PayloadAction<Partial<PersonalProfileDetails>>
    ) {
      state.personalDetails = normalizePersonalDetails({
        ...state.personalDetails,
        ...action.payload,
      });
    },

    updateWomenHealth(state, action: PayloadAction<Partial<WomenHealthState>>) {
      state.womenHealth = normalizeWomenHealthState({
        ...state.womenHealth,
        ...action.payload,
        updatedAt: new Date().toISOString(),
      });
      state.familyLifecycleMode = resolveFamilyLifecycleMode({
        explicitMode: state.familyLifecycleMode,
        womenHealth: state.womenHealth,
        partnerSharing: state.partnerSharing,
      });
    },

    setFamilyLifecycleMode(state, action: PayloadAction<FamilyLifecycleMode>) {
      if (!isFamilyLifecycleMode(action.payload)) {
        return;
      }

      state.familyLifecycleMode = resolveFamilyLifecycleMode({
        explicitMode: action.payload,
        womenHealth: state.womenHealth,
        partnerSharing: state.partnerSharing,
      });
    },

    refreshMotivationTasks(state, action: PayloadAction<string | undefined>) {
      state.motivation = refreshMotivationState(
        state.motivation,
        state.goal,
        action.payload ?? new Date().toISOString()
      );
    },

    completeMotivationTask(
      state,
      action: PayloadAction<{ taskId: string; completedAt?: string }>
    ) {
      state.motivation = completeMotivationTaskState(
        state.motivation,
        action.payload.taskId,
        action.payload.completedAt
      );
    },

    activateWeeklyDayOff(state, action: PayloadAction<{ usedAt?: string } | undefined>) {
      const usedAt = action.payload?.usedAt ?? new Date().toISOString();

      if (!canUseFreeDay(state.motivation.freeDayLastUsedAt, usedAt)) {
        return;
      }

      state.motivation = applyFreeDayState(state.motivation, usedAt);
    },

    buyMonthlyDayOff(state, action: PayloadAction<{ usedAt?: string } | undefined>) {
      const usedAt = action.payload?.usedAt ?? new Date().toISOString();

      if (!canUsePaidDay(state.motivation.paidDayLastUsedMonth, usedAt)) {
        return;
      }

      const cost = calculatePaidDayOffCost(state.motivation.history, usedAt);

      if (state.motivation.points < cost) {
        return;
      }

      state.motivation = applyPaidDayState(state.motivation, cost, usedAt);
    },

    startPremiumTrial(state, action: PayloadAction<{ startedAt?: string } | undefined>) {
      const startedAt = action.payload?.startedAt ?? new Date().toISOString();
      const startDate = new Date(startedAt);
      const safeStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;

      state.premium = {
        plan: "pro",
        status: "trial",
        startedAt: safeStartDate.toISOString(),
        trialEndsAt: addDaysIso(safeStartDate, 7),
        renewsAt: addDaysIso(safeStartDate, 7),
        cancelledAt: null,
      };
    },

    activatePremiumPlan(
      state,
      action: PayloadAction<{
        plan: Exclude<PremiumPlanId, "free">;
        activatedAt?: string;
      }>
    ) {
      const activatedAt = action.payload.activatedAt ?? new Date().toISOString();
      const startDate = new Date(activatedAt);
      const safeStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;

      state.premium = {
        plan: action.payload.plan,
        status: "active",
        startedAt: safeStartDate.toISOString(),
        trialEndsAt: null,
        renewsAt: addDaysIso(safeStartDate, 30),
        cancelledAt: null,
      };
    },

    cancelPremiumSubscription(
      state,
      action: PayloadAction<{ cancelledAt?: string } | undefined>
    ) {
      const cancelledAt = action.payload?.cancelledAt ?? new Date().toISOString();
      const cancelDate = new Date(cancelledAt);
      const safeCancelDate = Number.isNaN(cancelDate.getTime()) ? new Date() : cancelDate;

      state.premium = {
        plan: "free",
        status: "cancelled",
        startedAt: state.premium.startedAt,
        trialEndsAt: null,
        renewsAt: null,
        cancelledAt: safeCancelDate.toISOString(),
      };
    },

    resetMotivationProgress(state) {
      state.motivation = resetMotivationState(state.goal);
    },

  },
});

export const {
  replaceProfileState,
  setDailyCalories,
  setMaintenanceCalories,
  setAdaptiveCalories,
  setGoal,
  updateWeight,
  recordMeasurementCheckIn,
  addProgressPhoto,
  removeProgressPhoto,
  applyProfileTargets,
  updateNotificationPreferences,
  setProfileLanguage,
  setAssistantCustomization,
  updatePersonalDetails,
  updateWomenHealth,
  setFamilyLifecycleMode,
  refreshMotivationTasks,
  completeMotivationTask,
  activateWeeklyDayOff,
  buyMonthlyDayOff,
  startPremiumTrial,
  activatePremiumPlan,
  cancelPremiumSubscription,
  resetMotivationProgress,
} = profileSlice.actions;

export default profileSlice.reducer;
