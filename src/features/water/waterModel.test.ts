import { describe, expect, it } from "vitest";
import {
  createWaterGlassSlots,
  createWeeklyWaterRecords,
  getQuickWaterAmounts,
  isWithinReminderWindow,
  normalizeWaterSlotAmount,
  normalizeWaterState,
} from "./waterModel";

describe("waterModel", () => {
  it("builds stable weekly records from history and the current day", () => {
    const records = createWeeklyWaterRecords(
      {
        consumedMl: 1250,
        dailyWaterGoal: 2100,
        history: [
          {
            date: "2026-05-04",
            consumedMl: 1800,
            targetMl: 2000,
            updatedAt: "2026-05-04T20:00:00.000Z",
          },
          {
            date: "2026-05-01",
            consumedMl: 2200,
            targetMl: 2000,
            updatedAt: "2026-05-01T20:00:00.000Z",
          },
        ],
      },
      new Date(2026, 4, 5, 12)
    );

    expect(records.map((item) => item.date)).toEqual([
      "2026-04-29",
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
      "2026-05-03",
      "2026-05-04",
      "2026-05-05",
    ]);
    expect(records[2]).toMatchObject({ consumedMl: 2200, targetMl: 2000 });
    expect(records[5]).toMatchObject({ consumedMl: 1800, targetMl: 2000 });
    expect(records[6]).toMatchObject({ consumedMl: 1250, targetMl: 2100 });
  });

  it("creates glass slots and clamps edited slot amounts", () => {
    const slots = createWaterGlassSlots(375, 1000, 250);

    expect(slots).toHaveLength(6);
    expect(slots.slice(0, 3).map((slot) => slot.fill)).toEqual([1, 0.5, 0]);
    expect(getQuickWaterAmounts(250)).toEqual([100, 150, 250]);
    expect(normalizeWaterSlotAmount(999, 250)).toBe(250);
    expect(normalizeWaterSlotAmount(-20, 250)).toBe(0);
  });

  it("supports normal and overnight reminder windows", () => {
    expect(
      isWithinReminderWindow("09:00", "21:00", new Date(2026, 4, 5, 10))
    ).toBe(true);
    expect(
      isWithinReminderWindow("09:00", "21:00", new Date(2026, 4, 5, 23))
    ).toBe(false);
    expect(
      isWithinReminderWindow("22:00", "06:00", new Date(2026, 4, 5, 23))
    ).toBe(true);
    expect(
      isWithinReminderWindow("22:00", "06:00", new Date(2026, 4, 5, 2))
    ).toBe(true);
  });

  it("normalizes persisted water state defensively", () => {
    const state = normalizeWaterState({
      consumedMl: "640",
      dailyWaterGoal: -1,
      glassSizeMl: 0,
      lastLoggedOn: "2026-05-05",
      targetMode: "manual",
      history: [
        { date: "bad-date", consumedMl: 1000, targetMl: 2000 },
        { date: "2026-05-04", consumedMl: 1900, targetMl: 2000 },
      ],
      reminders: {
        enabled: true,
        intervalMinutes: 10,
        startTime: "99:00",
        endTime: "20:00",
      },
    });

    expect(state).toMatchObject({
      consumedMl: 640,
      dailyWaterGoal: 2000,
      glassSizeMl: 250,
      lastLoggedOn: "2026-05-05",
      targetMode: "manual",
      reminders: {
        enabled: true,
        intervalMinutes: 30,
        startTime: "09:00",
        endTime: "20:00",
      },
    });
    expect(state.history.map((entry) => entry.date)).toContain("2026-05-05");
    expect(state.history.map((entry) => entry.date)).not.toContain("bad-date");
  });

  it("migrates the legacy dailyTargetMl field into dailyWaterGoal", () => {
    const state = normalizeWaterState({
      dailyTargetMl: 2400,
      consumedMl: 500,
      lastLoggedOn: "2026-05-05",
    });

    expect(state.dailyWaterGoal).toBe(2400);
    expect(state.history.find((entry) => entry.date === "2026-05-05")).toMatchObject({
      targetMl: 2400,
    });
  });
});
