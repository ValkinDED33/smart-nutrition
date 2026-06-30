import { describe, expect, it } from "vitest";
import { createInitialWaterState } from "./waterSlice";
import {
  buildWaterStateAfterGlassSizeChange,
  buildWaterStateAfterIncrement,
  buildWaterStateAfterReminderChange,
  buildWaterStateAfterSetAmount,
  buildWaterStateAfterTargetChange,
} from "./waterSaveModel";

describe("waterSaveModel", () => {
  it("previews water amount changes through the real reducer", () => {
    const initial = createInitialWaterState();
    const withSetAmount = buildWaterStateAfterSetAmount(initial, 400);
    const withIncrement = buildWaterStateAfterIncrement(withSetAmount, 250);

    expect(withSetAmount.consumedMl).toBe(400);
    expect(withIncrement.consumedMl).toBe(650);
    expect(withIncrement.history.at(-1)?.consumedMl).toBe(650);
  });

  it("previews target, glass size, and reminders before cloud confirmation", () => {
    const initial = createInitialWaterState();
    const withTarget = buildWaterStateAfterTargetChange(initial, 2300);
    const withGlass = buildWaterStateAfterGlassSizeChange(withTarget, 300);
    const withReminders = buildWaterStateAfterReminderChange(withGlass, {
      enabled: true,
      intervalMinutes: 90,
    });

    expect(withTarget).toMatchObject({
      dailyWaterGoal: 2300,
      targetMode: "manual",
    });
    expect(withGlass.glassSizeMl).toBe(300);
    expect(withReminders.reminders).toMatchObject({
      enabled: true,
      intervalMinutes: 90,
    });
  });
});
