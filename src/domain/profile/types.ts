export type DietStyle =
  | "balanced"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "low_carb"
  | "gluten_free";

export type AdaptiveMode = "automatic" | "manual";
export type AssistantCompanionKind =
  | "robot"
  | "cat"
  | "dog"
  | "fox"
  | "panda"
  | "owl"
  | "human"
  | "capybara"
  | "dragon";
export type AssistantRole = "friend" | "assistant" | "coach";
export type AssistantTone = "gentle" | "playful" | "focused" | "calm" | "scientific";
export type AssistantMood = "idle" | "happy" | "coach" | "concerned" | "sleepy" | "celebrate";

export interface AssistantMemoryProfile {
  goals: string[];
  preferences: string[];
  conversationHighlights: string[];
  lastSyncedAt: string | null;
}
export type AssistantDietFriction =
  | "unknown"
  | "emotional_eating"
  | "chaotic_schedule"
  | "evening_snacking"
  | "low_energy"
  | "social_pressure";
export type AssistantMotivationStyle = "gentle" | "direct" | "energetic";
export type MotivationTaskCategory = "nutrition" | "consistency" | "reflection";
export type PremiumPlanId = "free" | "pro" | "coach";
export type PremiumStatus = "inactive" | "trial" | "active" | "cancelled";
export type BloodGroup =
  | "unknown"
  | "o_positive"
  | "o_negative"
  | "a_positive"
  | "a_negative"
  | "b_positive"
  | "b_negative"
  | "ab_positive"
  | "ab_negative";
export type EyeColor =
  | "unknown"
  | "brown"
  | "blue"
  | "green"
  | "gray"
  | "hazel"
  | "amber"
  | "other";
export type RelationshipStatus =
  | "single"
  | "dating"
  | "married"
  | "complicated"
  | "prefer_not";
export type SupportSystem =
  | "self"
  | "partner_supports"
  | "partner_neutral"
  | "family_friends"
  | "low_support"
  | "prefer_not";
export type PetCompanion = "none" | "cat" | "dog" | "cat_and_dog" | "other";

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
  assistantName: string;
  companionKind: AssistantCompanionKind;
  assistantAvatar: AssistantCompanionKind;
  role: AssistantRole;
  tone: AssistantTone;
  assistantPersonality: AssistantTone;
  assistantMood: AssistantMood;
  assistantMemory: AssistantMemoryProfile;
  humorEnabled: boolean;
  widgetEnabled: boolean;
  proactiveHintsEnabled: boolean;
  onboarding: AssistantOnboardingProfile;
}

export interface AssistantOnboardingProfile {
  preferredName: string;
  primaryGoalNote: string;
  goalSelections: string[];
  mainFriction: AssistantDietFriction;
  mainFrictions: AssistantDietFriction[];
  motivationStyle: AssistantMotivationStyle;
  motivationStyles: AssistantMotivationStyle[];
  supportNote: string;
  completedAt: string | null;
}

export interface PersonalProfileDetails {
  bloodGroup: BloodGroup;
  eyeColor: EyeColor;
  relationshipStatus: RelationshipStatus;
  supportSystem: SupportSystem;
  petCompanion: PetCompanion;
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
