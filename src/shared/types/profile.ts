export type DietStyle =
  | "balanced"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "low_carb"
  | "gluten_free";

export type AdaptiveMode = "automatic" | "manual";
export type AssistantRole = "friend" | "assistant" | "coach";
export type AssistantTone = "gentle" | "playful" | "focused";
export type MotivationTaskCategory = "nutrition" | "consistency" | "reflection";
export type PremiumPlanId = "free" | "pro" | "coach";
export type PremiumStatus = "inactive" | "trial" | "active" | "cancelled";

export interface MacroTargets {
  protein: number;
  fat: number;
  carbs: number;
}

export interface ReminderTimes {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  mealRemindersEnabled: boolean;
  calorieAlertsEnabled: boolean;
  reminderTimes: ReminderTimes;
}

export interface NutritionPreferences {
  dietStyle: DietStyle;
  allergies: string[];
  excludedIngredients: string[];
  adaptiveMode: AdaptiveMode;
}

export interface AssistantCustomization {
  name: string;
  role: AssistantRole;
  tone: AssistantTone;
  humorEnabled: boolean;
  widgetEnabled: boolean;
  proactiveHintsEnabled: boolean;
}

export interface MeasurementHistoryItem {
  date: string;
  weight: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  chest?: number;
}

export interface ProgressPhotoHistoryItem {
  id: string;
  date: string;
  imageDataUrl: string;
  note?: string;
}

export interface WeeklyCheckInState {
  enabled: boolean;
  remindIntervalDays: number;
  lastRecordedAt: string | null;
}

export interface PremiumSubscriptionState {
  plan: PremiumPlanId;
  status: PremiumStatus;
  startedAt: string | null;
  trialEndsAt: string | null;
  renewsAt: string | null;
  cancelledAt: string | null;
}

export interface MotivationTask {
  id: string;
  title: string;
  description: string;
  points: number;
  category: MotivationTaskCategory;
  createdAt: string;
  completedAt: string | null;
  skippedWithDayOffAt: string | null;
}

export interface MotivationHistoryItem {
  taskId: string;
  title: string;
  pointsEarned: number;
  completedAt: string;
  skipped: boolean;
  usedDayOff: "free" | "paid" | null;
}

export interface AchievementProgress {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

export interface MotivationState {
  points: number;
  level: number;
  completedTasks: number;
  activeTasks: MotivationTask[];
  history: MotivationHistoryItem[];
  achievements: AchievementProgress[];
  lastTaskRefreshDate: string | null;
  freeDayLastUsedAt: string | null;
  paidDayLastUsedAt: string | null;
  paidDayLastUsedMonth: string | null;
}
