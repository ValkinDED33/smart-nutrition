import {
  getCompanionReward,
  type CompanionRewardEvent,
} from "../../../companion";

export const getCompanionRewardXp = (event: CompanionRewardEvent) =>
  getCompanionReward(event)?.xp ?? 0;

export const createCompanionRewardAnalyticsPayload = (
  event: CompanionRewardEvent
) => ({
  companionRewardEvent: event,
  companionXpAwarded: getCompanionRewardXp(event),
});
