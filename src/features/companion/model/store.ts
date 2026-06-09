import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  applyCompanionReward,
  createInitialCompanionState,
  equipCompanionItem as equipCompanionCatalogItem,
  getCompanionLevelForXp,
  purchaseCompanionItem as purchaseCompanionCatalogItem,
  unlockCompanionAchievement as unlockAchievement,
  type CompanionAchievement,
  type CompanionAchievementCategory,
  type CompanionLevel,
  type CompanionRewardEvent,
  type CompanionState,
} from "../../../companion";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCompanionLevel = (value: unknown): value is CompanionLevel =>
  value === 1 ||
  value === 2 ||
  value === 3 ||
  value === 4 ||
  value === 5 ||
  value === 6 ||
  value === 7 ||
  value === 8 ||
  value === 9 ||
  value === 10;

const normalizeNumber = (value: unknown, fallback: number, min = 0) => {
  const numberValue = typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

  return Math.max(numberValue, min);
};

const normalizeIsoString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const normalizeIdList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
};

const isCompanionAchievementCategory = (
  value: unknown
): value is CompanionAchievementCategory =>
  value === "start" ||
  value === "nutrition" ||
  value === "hydration" ||
  value === "progress" ||
  value === "companion";

const normalizeAchievement = (value: unknown): CompanionAchievement | null => {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim().length === 0) {
    return null;
  }

  return {
    id: value.id.trim().slice(0, 80),
    title:
      typeof value.title === "string" && value.title.trim().length > 0
        ? value.title.trim().slice(0, 120)
        : value.id.trim().slice(0, 80),
    description:
      typeof value.description === "string" && value.description.trim().length > 0
        ? value.description.trim().slice(0, 240)
        : undefined,
    icon:
      typeof value.icon === "string" && value.icon.trim().length > 0
        ? value.icon.trim().slice(0, 40)
        : undefined,
    category: isCompanionAchievementCategory(value.category)
      ? value.category
      : undefined,
    xpBonus: normalizeNumber(value.xpBonus, 0),
    coinBonus: normalizeNumber(value.coinBonus, 0),
    unlockedAt:
      typeof value.unlockedAt === "string" && value.unlockedAt.trim().length > 0
        ? value.unlockedAt
        : undefined,
  };
};

export const normalizeCompanionState = (value: unknown): CompanionState => {
  const fallback = createInitialCompanionState();

  if (!isRecord(value)) {
    return fallback;
  }

  const xp = normalizeNumber(value.xp, fallback.xp);
  const normalizedLevel = getCompanionLevelForXp(xp);
  const level = isCompanionLevel(value.level) && value.level === normalizedLevel
    ? value.level
    : normalizedLevel;
  const ownedItemIds = normalizeIdList(value.ownedItemIds);

  return {
    level,
    xp,
    coins: normalizeNumber(value.coins, fallback.coins),
    relationshipLevel: normalizeNumber(
      value.relationshipLevel,
      fallback.relationshipLevel,
      1
    ),
    achievements: Array.isArray(value.achievements)
      ? value.achievements
          .map((achievement) => normalizeAchievement(achievement))
          .filter((achievement): achievement is CompanionAchievement => achievement !== null)
      : fallback.achievements,
    ownedItemIds,
    equippedItemIds: normalizeIdList(value.equippedItemIds).filter((itemId) =>
      ownedItemIds.includes(itemId)
    ),
    createdAt: normalizeIsoString(value.createdAt, fallback.createdAt),
    updatedAt: normalizeIsoString(value.updatedAt, fallback.updatedAt),
  };
};

const initialState = createInitialCompanionState();

const companionSlice = createSlice({
  name: "companion",
  initialState,
  reducers: {
    awardCompanionReward(state, action: PayloadAction<CompanionRewardEvent>) {
      return applyCompanionReward(state, action.payload);
    },

    unlockCompanionAchievement(
      state,
      action: PayloadAction<CompanionAchievement>
    ) {
      return unlockAchievement(state, action.payload);
    },

    purchaseCompanionItem(state, action: PayloadAction<string>) {
      return purchaseCompanionCatalogItem(state, action.payload);
    },

    equipCompanionItem(state, action: PayloadAction<string>) {
      return equipCompanionCatalogItem(state, action.payload);
    },

    resetCompanionState() {
      return createInitialCompanionState();
    },

    hydrateCompanionState(_, action: PayloadAction<unknown>) {
      return normalizeCompanionState(action.payload);
    },
  },
});

export const {
  awardCompanionReward,
  unlockCompanionAchievement,
  purchaseCompanionItem,
  equipCompanionItem,
  resetCompanionState,
  hydrateCompanionState,
} = companionSlice.actions;

export default companionSlice.reducer;
