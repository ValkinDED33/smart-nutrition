export type CompanionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type KnownCompanionRewardEvent =
  | "registration_completed"
  | "onboarding_completed"
  | "profile_completed"
  | "login_daily"
  | "meal_added"
  | "water_logged"
  | "weight_updated"
  | "goal_completed";

export type CompanionRewardEvent = KnownCompanionRewardEvent | (string & {});

export type CompanionAchievementCategory =
  | "start"
  | "nutrition"
  | "hydration"
  | "progress"
  | "companion";

export type CompanionAchievementId =
  | "onboarding_completed"
  | "first_meal_logged"
  | "first_water_logged"
  | "first_weight_updated"
  | "level_2_reached"
  | "level_5_reached";

export interface CompanionAchievement {
  id: CompanionAchievementId | (string & {});
  title: string;
  description?: string;
  icon?: string;
  category?: CompanionAchievementCategory;
  xpBonus?: number;
  coinBonus?: number;
  unlockedAt?: string;
}

export interface CompanionState {
  level: CompanionLevel;
  xp: number;
  coins: number;
  relationshipLevel: number;
  achievements: CompanionAchievement[];
  ownedItemIds: string[];
  equippedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanionReward {
  event: KnownCompanionRewardEvent;
  xp: number;
  coins: number;
}

export interface CompanionLevelProgress {
  level: CompanionLevel;
  currentXp: number;
  nextLevelXp: number | null;
  progress: number;
}

export type CompanionCatalogCategory =
  | "robot"
  | "animal"
  | "fantasy"
  | "nature"
  | "outfit"
  | "emotion"
  | "accessory"
  | "animation"
  | "premium"
  | "seasonal";

export type CompanionCatalogLocale = "uk" | "pl" | "en";

export type CompanionCatalogRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

type CompanionCatalogCompanionKind =
  | "cat"
  | "dog"
  | "fox"
  | "panda"
  | "owl"
  | "dragon"
  | "capybara"
  | "robot"
  | "human"
  | "raccoon"
  | "corgi"
  | "wolf"
  | "tiger"
  | "bear"
  | "rabbit"
  | "chameleon"
  | "lion"
  | "otter"
  | "hedgehog"
  | "koala"
  | "deer"
  | "turtle"
  | "axolotl"
  | "phoenix"
  | "forest_spirit"
  | "cosmic_beast";

type CompanionItemSlot =
  | "companion"
  | "outfit"
  | "reaction"
  | "accessory"
  | "animation";

export interface CompanionCatalogItem {
  id: string;
  category: CompanionCatalogCategory;
  title: Record<CompanionCatalogLocale, string>;
  description: Record<CompanionCatalogLocale, string>;
  tagLabel: Record<CompanionCatalogLocale, string>;
  price: number;
  rarity: CompanionCatalogRarity;
  slot: CompanionItemSlot;
  companionKind?: CompanionCatalogCompanionKind;
  available: boolean;
}
