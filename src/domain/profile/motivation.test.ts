import { describe, expect, it } from "vitest";
import {
  applyPaidDayState,
  calculatePaidDayOffCost,
  canUseFreeDay,
  canUsePaidDay,
  completeMotivationTaskState,
  createDefaultMotivationState,
} from "./motivation";

describe("motivation", () => {
  it("awards points and unlocks the first achievement", () => {
    const state = createDefaultMotivationState("maintain");
    const firstTaskId = state.activeTasks[0]?.id;

    expect(firstTaskId).toBeDefined();
    const next = completeMotivationTaskState(state, firstTaskId!, "2026-04-03T10:00:00.000Z");

    expect(next.points).toBeGreaterThan(0);
    expect(next.completedTasks).toBe(1);
    expect(next.achievements.find((item) => item.id === "first-step")?.unlockedAt).toBe(
      "2026-04-03T10:00:00.000Z"
    );
  });

  it("enforces weekly and monthly day-off limits", () => {
    expect(canUseFreeDay(null, "2026-04-10T08:00:00.000Z")).toBe(true);
    expect(canUseFreeDay("2026-04-05T08:00:00.000Z", "2026-04-10T08:00:00.000Z")).toBe(
      false
    );
    expect(canUsePaidDay("2026-04", "2026-04-20T08:00:00.000Z")).toBe(false);
    expect(canUsePaidDay("2026-03", "2026-04-20T08:00:00.000Z")).toBe(true);
  });

  it("calculates a paid day cost from the current month history", () => {
    const state = createDefaultMotivationState("cut");
    const firstTaskId = state.activeTasks[0]?.id;

    expect(firstTaskId).toBeDefined();
    const afterFirst = completeMotivationTaskState(
      state,
      firstTaskId!,
      "2026-04-03T10:00:00.000Z"
    );
    const secondTaskId = afterFirst.activeTasks[1]?.id;

    expect(secondTaskId).toBeDefined();
    const afterSecond = completeMotivationTaskState(
      afterFirst,
      secondTaskId!,
      "2026-04-04T10:00:00.000Z"
    );

    expect(calculatePaidDayOffCost(afterSecond.history, "2026-04-20T10:00:00.000Z")).toBe(
      40
    );
  });

  it("deducts points when a paid day off is used", () => {
    const state = createDefaultMotivationState("bulk");
    const firstTaskId = state.activeTasks[0]?.id;

    expect(firstTaskId).toBeDefined();
    const completed = completeMotivationTaskState(
      state,
      firstTaskId!,
      "2026-04-03T10:00:00.000Z"
    );
    const next = applyPaidDayState(completed, 10, "2026-04-20T08:00:00.000Z");

    expect(next.points).toBe(completed.points - 10);
    expect(next.paidDayLastUsedMonth).toBe("2026-04");
  });
});
