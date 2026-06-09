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
  recentAchievements: CompanionAchievement[];
}

const getAchievementTime = (achievement: CompanionAchievement) => {
  const timestamp = achievement.unlockedAt ? Date.parse(achievement.unlockedAt) : 0;

  return Number.isFinite(timestamp) ? timestamp : 0;
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
