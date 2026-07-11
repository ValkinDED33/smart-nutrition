import {
  createInitialCompanionState,
  getCompanionAchievementById,
  getNextLevelProgress,
  type CompanionAchievement,
  type CompanionState,
} from "../../companion";

export interface CompanionProgressCardModel {
  level: number;
  xp: number;
  nextLevelXp: number | null;
  xpToNextLevel: number;
  progressPercent: number;
  coins: number;
  relationshipLevel: number;
  evolutionStage: "spark" | "aware" | "trusted" | "deep";
  bondPercent: number;
  nextRitual: "complete_onboarding" | "log_meal" | "log_water" | "keep_rhythm";
  recentAchievements: CompanionAchievement[];
}

const getAchievementTime = (achievement: CompanionAchievement) => {
  const timestamp = achievement.unlockedAt ? Date.parse(achievement.unlockedAt) : 0;

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getEvolutionStage = (level: number, relationshipLevel: number) => {
  if (level >= 8 || relationshipLevel >= 7) {
    return "deep";
  }

  if (level >= 5 || relationshipLevel >= 5) {
    return "trusted";
  }

  if (level >= 3 || relationshipLevel >= 3) {
    return "aware";
  }

  return "spark";
};

const getNextRitual = ({
  level,
  relationshipLevel,
  achievementsCount,
}: {
  level: number;
  relationshipLevel: number;
  achievementsCount: number;
}) => {
  if (achievementsCount === 0) {
    return "complete_onboarding";
  }

  if (level < 3) {
    return "log_meal";
  }

  if (relationshipLevel < 5) {
    return "log_water";
  }

  return "keep_rhythm";
};

export const buildCompanionProgressCardModel = (
  state?: CompanionState | null
): CompanionProgressCardModel => {
  const companion = state ?? createInitialCompanionState();
  const progress = getNextLevelProgress(companion.xp);
  const nextLevelXp = progress.nextLevelXp;
  const xpToNextLevel =
    nextLevelXp === null ? 0 : Math.max(nextLevelXp - progress.currentXp, 0);

  return {
    level: progress.level,
    xp: progress.currentXp,
    nextLevelXp,
    xpToNextLevel,
    progressPercent: Math.round(progress.progress * 100),
    coins: Math.max(0, Math.floor(companion.coins)),
    relationshipLevel: Math.max(1, Math.floor(companion.relationshipLevel)),
    evolutionStage: getEvolutionStage(
      progress.level,
      Math.max(1, Math.floor(companion.relationshipLevel))
    ),
    bondPercent: Math.min(
      100,
      Math.max(0, Math.round((Math.max(1, Math.floor(companion.relationshipLevel)) / 10) * 100))
    ),
    nextRitual: getNextRitual({
      level: progress.level,
      relationshipLevel: Math.max(1, Math.floor(companion.relationshipLevel)),
      achievementsCount: companion.achievements.length,
    }),
    recentAchievements: [...companion.achievements]
      .sort((left, right) => getAchievementTime(right) - getAchievementTime(left))
      .slice(0, 3)
      .map((achievement) => {
        const catalogAchievement = getCompanionAchievementById(achievement.id);

        return catalogAchievement
          ? { ...catalogAchievement, ...achievement }
          : achievement;
      }),
  };
};
