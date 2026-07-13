import type {
  CompanionAchievement,
  CompanionAchievementId,
  CompanionRewardEvent,
  CompanionState,
} from "../types";

const companionAchievementCatalog: Record<
  CompanionAchievementId,
  CompanionAchievement
> = {
  onboarding_completed: {
    id: "onboarding_completed",
    title: "Старт налаштовано",
    description: "Завершено onboarding і створено базу для персонального плану.",
    icon: "sparkles",
    category: "start",
  },
  first_meal_logged: {
    id: "first_meal_logged",
    title: "Перший прийом їжі",
    description: "Додано перший запис харчування.",
    icon: "utensils",
    category: "nutrition",
  },
  first_water_logged: {
    id: "first_water_logged",
    title: "Перший стакан",
    description: "Зафіксовано перший запис води.",
    icon: "droplets",
    category: "hydration",
  },
  first_weight_updated: {
    id: "first_weight_updated",
    title: "Перший check-in ваги",
    description: "Оновлено вагу і відкрито шлях до трендів.",
    icon: "scale",
    category: "progress",
  },
  level_2_reached: {
    id: "level_2_reached",
    title: "Рівень 2",
    description: "Компаньйон став сильнішим завдяки вашим звичкам.",
    icon: "level-up",
    category: "companion",
  },
  level_5_reached: {
    id: "level_5_reached",
    title: "Рівень 5",
    description: "Стабільність вже перетворюється на систему.",
    icon: "award",
    category: "companion",
  },
};

const rewardAchievementMap: Partial<Record<CompanionRewardEvent, CompanionAchievementId>> = {
  onboarding_completed: "onboarding_completed",
  meal_added: "first_meal_logged",
  water_logged: "first_water_logged",
  weight_updated: "first_weight_updated",
};

const getAchievementFromCatalog = (
  achievementId: CompanionAchievementId
): CompanionAchievement | null =>
  Object.values(companionAchievementCatalog).find(
    (achievement) => achievement.id === achievementId
  ) ?? null;

const getAchievementIdForReward = (
  event: CompanionRewardEvent
): CompanionAchievementId | undefined =>
  Object.entries(rewardAchievementMap).find(([rewardEvent]) => rewardEvent === event)?.[1];

const hasAchievement = (state: CompanionState, achievementId: string) =>
  state.achievements.some((achievement) => achievement.id === achievementId);

const getPendingAchievement = (
  state: CompanionState,
  achievementId: CompanionAchievementId | undefined
) => {
  if (!achievementId || hasAchievement(state, achievementId)) {
    return null;
  }

  return getAchievementFromCatalog(achievementId);
};

export const getCompanionAchievementById = (
  id: string
): CompanionAchievement | null =>
  Object.values(companionAchievementCatalog).find((achievement) => achievement.id === id) ??
  null;

export const evaluateAchievementsAfterReward = (
  state: CompanionState,
  event: CompanionRewardEvent
): CompanionAchievement[] => {
  const candidates = [
    getPendingAchievement(state, getAchievementIdForReward(event)),
    state.level >= 2 ? getPendingAchievement(state, "level_2_reached") : null,
    state.level >= 5 ? getPendingAchievement(state, "level_5_reached") : null,
  ];

  return candidates.filter(
    (achievement): achievement is CompanionAchievement => achievement !== null
  );
};
