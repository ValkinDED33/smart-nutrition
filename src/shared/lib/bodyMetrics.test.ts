import { describe, expect, it } from "vitest";
import {
  createWeeklyBodyReport,
  detectWeightPlateau,
  getMeasurementDelta,
} from "./bodyMetrics";

describe("bodyMetrics", () => {
  it("detects a stable multi-week weight plateau", () => {
    const plateau = detectWeightPlateau([
      { date: "2026-04-01T08:00:00.000Z", weight: 80 },
      { date: "2026-04-10T08:00:00.000Z", weight: 79.9 },
      { date: "2026-04-22T08:00:00.000Z", weight: 80.2 },
    ]);

    expect(plateau.hasPlateau).toBe(true);
    expect(plateau.weeksStable).toBeGreaterThanOrEqual(2);
  });

  it("calculates measurement deltas from the latest two valid entries", () => {
    const delta = getMeasurementDelta(
      [
        { date: "2026-04-01T08:00:00.000Z", weight: 80, abdomen: 98 },
        { date: "2026-04-08T08:00:00.000Z", weight: 79.5 },
        { date: "2026-04-15T08:00:00.000Z", weight: 79, abdomen: 95.5 },
      ],
      "abdomen"
    );

    expect(delta.current).toBe(95.5);
    expect(delta.delta).toBe(-2.5);
  });

  it("builds the weekly report with BMI and body deltas", () => {
    const report = createWeeklyBodyReport({
      heightCm: 180,
      weightHistory: [
        { date: "2026-04-08T08:00:00.000Z", weight: 82 },
        { date: "2026-04-15T08:00:00.000Z", weight: 81 },
      ],
      measurementHistory: [
        { date: "2026-04-08T08:00:00.000Z", weight: 82, waist: 92, chest: 104 },
        { date: "2026-04-15T08:00:00.000Z", weight: 81, waist: 91, chest: 103.5 },
      ],
    });

    expect(report.latestWeight).toBe(81);
    expect(report.weeklyWeightDelta).toBe(-1);
    expect(report.bmi).toBeCloseTo(25, 1);
    expect(report.waist.delta).toBe(-1);
    expect(report.chest.delta).toBe(-0.5);
  });
});
