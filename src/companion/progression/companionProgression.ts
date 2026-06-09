import { evaluateAchievementsAfterReward } from "../achievements/companionAchievements";
import { getCompanionReward } from "../rewards/companionRewards";
import type {
  CompanionLevel,
  CompanionLevelProgress,
  CompanionRewardEvent,
  CompanionState,
} from "../types";

export const companionLevelThresholds: Record<CompanionLevel, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
  6: 1400,
  7: 2000,
  8: 2800,
  9: 3700,
  10: 4800,
};

const companionLevels = Object.keys(companionLevelThresholds)
  .map(Number)
  .sort((left, right) => left - right) as CompanionLevel[];

const normalizeXp = (xp: number) =>
  Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;

export const createInitialCompanionState = (
  now = new Date().toISOString()
): CompanionState => ({
  level: 1,
  xp: 0,
  coins: 0,
  relationshipLevel: 1,
  achievements: [],
  createdAt: now,
  updatedAt: now,
});

export const getCompanionLevelForXp = (xp: number): CompanionLevel => {
  const safeXp = normalizeXp(xp);

  return companionLevels.reduce<CompanionLevel>((currentLevel, level) => {
    return safeXp >= companionLevelThresholds[level] ? level : currentLevel;
  }, 1);
};

export const getNextLevelProgress = (xp: number): CompanionLevelProgress => {
  const safeXp = normalizeXp(xp);
  const level = getCompanionLevelForXp(safeXp);
  const currentLevelXp = companionLevelThresholds[level];
  const nextLevel = companionLevels.find((candidate) => candidate > level) ?? null;

  if (nextLevel === null) {
    return {
      level,
      currentXp: safeXp,
      nextLevelXp: null,
      progress: 1,
    };
  }

  const nextLevelXp = companionLevelThresholds[nextLevel];
  const xpInLevel = safeXp - currentLevelXp;
  const xpForLevel = nextLevelXp - currentLevelXp;

  return {
    level,
    currentXp: safeXp,
    nextLevelXp,
    progress: Math.max(0, Math.min(1, xpInLevel / xpForLevel)),
  };
};

export const applyCompanionReward = (
  state: CompanionState,
  event: CompanionRewardEvent,
  now = new Date().toISOString()
): CompanionState => {
  const reward = getCompanionReward(event);

  if (!reward) {
    return state;
  }

  const nextXp = normalizeXp(state.xp + reward.xp);
  const nextCoins = normalizeXp(state.coins + reward.coins);

  let nextState: CompanionState = {
    ...state,
    xp: nextXp,
    coins: nextCoins,
    level: getCompanionLevelForXp(nextXp),
    updatedAt: now,
  };

  for (let index = 0; index < 6; index += 1) {
    const achievements = evaluateAchievementsAfterReward(nextState, event);

    if (achievements.length === 0) {
      break;
    }

    const bonusXp = achievements.reduce(
      (sum, achievement) => sum + normalizeXp(achievement.xpBonus ?? 0),
      0
    );
    const bonusCoins = achievements.reduce(
      (sum, achievement) => sum + normalizeXp(achievement.coinBonus ?? 0),
      0
    );
    const xpWithBonus = normalizeXp(nextState.xp + bonusXp);

    nextState = {
      ...nextState,
      xp: xpWithBonus,
      coins: normalizeXp(nextState.coins + bonusCoins),
      level: getCompanionLevelForXp(xpWithBonus),
      achievements: [
        ...nextState.achievements,
        ...achievements.map((achievement) => ({
          ...achievement,
          unlockedAt: achievement.unlockedAt ?? now,
        })),
      ],
      updatedAt: now,
    };
  }

  return nextState;
};
