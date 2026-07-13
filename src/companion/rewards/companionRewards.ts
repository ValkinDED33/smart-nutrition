import type {
  CompanionAchievement,
  CompanionReward,
  CompanionRewardEvent,
  CompanionState,
  KnownCompanionRewardEvent,
} from "../types";

const companionRewardTable: Record<KnownCompanionRewardEvent, CompanionReward> = {
  registration_completed: {
    event: "registration_completed",
    xp: 100,
    coins: 0,
  },
  onboarding_completed: {
    event: "onboarding_completed",
    xp: 100,
    coins: 20,
  },
  profile_completed: {
    event: "profile_completed",
    xp: 50,
    coins: 0,
  },
  login_daily: {
    event: "login_daily",
    xp: 5,
    coins: 0,
  },
  meal_added: {
    event: "meal_added",
    xp: 10,
    coins: 2,
  },
  water_logged: {
    event: "water_logged",
    xp: 5,
    coins: 1,
  },
  weight_updated: {
    event: "weight_updated",
    xp: 10,
    coins: 3,
  },
  goal_completed: {
    event: "goal_completed",
    xp: 50,
    coins: 10,
  },
};

const findCompanionReward = (event: CompanionRewardEvent) =>
  Object.values(companionRewardTable).find((reward) => reward.event === event) ?? null;

export const getCompanionReward = (
  event: CompanionRewardEvent
): CompanionReward | null =>
  findCompanionReward(event);

export const hasCompanionAchievement = (
  state: CompanionState,
  achievementId: string
) => state.achievements.some((achievement) => achievement.id === achievementId);

export const unlockCompanionAchievement = (
  state: CompanionState,
  achievement: CompanionAchievement,
  now = new Date().toISOString()
): CompanionState => {
  if (hasCompanionAchievement(state, achievement.id)) {
    return state;
  }

  return {
    ...state,
    achievements: [
      ...state.achievements,
      {
        ...achievement,
        unlockedAt: achievement.unlockedAt ?? now,
      },
    ],
    updatedAt: now,
  };
};
