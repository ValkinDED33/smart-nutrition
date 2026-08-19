import { describe, expect, it } from "vitest";
import {
  createDefaultWomenHealthState,
  getEffectivePregnancyWeek,
  hasWomenHealthContext,
  normalizeWomenHealthState,
} from "./womenHealth";
import {
  estimatePregnancyDatesFromAge,
  estimatePregnancyFromDueDate,
  estimatePregnancyFromLastPeriod,
  getPregnancyMonth,
  getPregnancyTrimester,
} from "./pregnancyDateMath";

const NOW = new Date("2026-07-12T12:00:00.000Z");
const AGE_14W2D = { week: 14, day: 2, totalDays: 100 };
const ESTIMATED_DUE_DATE = "2027-01-08";
const ESTIMATED_LAST_PERIOD = "2026-04-03";

describe("women health domain", () => {
  it("uses an explicitly confirmed pregnancy week first", () => {
    const week = getEffectivePregnancyWeek(
      {
        pregnancyWeek: 18,
        dueDate: "2026-11-20T00:00:00.000Z",
        lastPeriodStartDate: "2026-02-13T00:00:00.000Z",
      },
      NOW
    );

    expect(week).toBe(18);
  });

  it("derives the pregnancy week from the due date when the week is missing", () => {
    const week = getEffectivePregnancyWeek(
      {
        pregnancyWeek: null,
        dueDate: "2026-11-20T00:00:00.000Z",
        lastPeriodStartDate: null,
      },
      NOW
    );

    expect(week).toBe(21);
  });

  it("derives the pregnancy week from the last period date when no due date exists", () => {
    const week = getEffectivePregnancyWeek(
      {
        pregnancyWeek: null,
        dueDate: null,
        lastPeriodStartDate: "2026-02-13T00:00:00.000Z",
      },
      NOW
    );

    expect(week).toBe(21);
  });

  it("keeps baby preview partner context in canonical women health state", () => {
    const state = normalizeWomenHealthState({
      mode: "pregnant",
      partnerEyeColor: "blue",
      motherZodiac: "cancer",
      fatherZodiac: "capricorn",
      motherChineseZodiac: "tiger",
      fatherChineseZodiac: "goat",
    });

    expect(state).toMatchObject({
      partnerEyeColor: "blue",
      motherZodiac: "cancer",
      fatherZodiac: "capricorn",
      motherChineseZodiac: "tiger",
      fatherChineseZodiac: "goat",
    });
  });

  it("normalizes pregnancy days only inside a confirmed pregnancy age", () => {
    expect(
      normalizeWomenHealthState({
        mode: "pregnant",
        pregnancyWeek: 14,
        pregnancyDay: 2,
      })
    ).toMatchObject({
      pregnancyWeek: 14,
      pregnancyDay: 2,
    });

    expect(
      normalizeWomenHealthState({
        mode: "pregnant",
        pregnancyWeek: 14,
        pregnancyDay: 99,
      }).pregnancyDay
    ).toBe(0);

    expect(
      normalizeWomenHealthState({
        mode: "trying_to_conceive",
        pregnancyWeek: 14,
        pregnancyDay: 2,
      })
    ).toMatchObject({
      pregnancyWeek: null,
      pregnancyDay: null,
    });
  });

  it("calculates pregnancy due, conception, and last-period dates from age or dates", () => {
    expect(estimatePregnancyDatesFromAge(14, 2, NOW)).toMatchObject({
      dueDate: ESTIMATED_DUE_DATE,
      conceptionDate: "2026-04-17",
      lastPeriodStartDate: ESTIMATED_LAST_PERIOD,
      age: AGE_14W2D,
    });

    expect(estimatePregnancyFromDueDate(ESTIMATED_DUE_DATE, NOW)).toMatchObject({
      age: AGE_14W2D,
      lastPeriodStartDate: ESTIMATED_LAST_PERIOD,
    });

    expect(estimatePregnancyFromLastPeriod(ESTIMATED_LAST_PERIOD, NOW)).toMatchObject({
      age: AGE_14W2D,
      dueDate: ESTIMATED_DUE_DATE,
    });
  });

  it("derives pregnancy trimester and month from the canonical pregnancy age", () => {
    expect(getPregnancyTrimester(13)).toBe(1);
    expect(getPregnancyTrimester(14)).toBe(2);
    expect(getPregnancyTrimester(28)).toBe(3);
    expect(getPregnancyTrimester(null)).toBeNull();
    expect(getPregnancyMonth(AGE_14W2D.totalDays)).toBe(4);
  });

  it("detects saved women-health context even when auth gender is stale", () => {
    expect(hasWomenHealthContext(createDefaultWomenHealthState())).toBe(false);

    expect(
      hasWomenHealthContext(
        normalizeWomenHealthState({
          mode: "pregnant",
          pregnancyWeek: 12,
        })
      )
    ).toBe(true);

    expect(
      hasWomenHealthContext({
        ...createDefaultWomenHealthState(),
        symptomHistory: [
          {
            id: "symptom-1",
            recordedAt: "2026-07-12T12:00:00.000Z",
            label: "headache",
            severity: 5,
            note: "",
            source: "assistant",
          },
        ],
      })
    ).toBe(true);

    expect(
      hasWomenHealthContext({
        ...createDefaultWomenHealthState(),
        partnerEyeColor: "blue",
      })
    ).toBe(true);
  });
});
