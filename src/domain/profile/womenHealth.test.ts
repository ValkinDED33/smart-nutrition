import { describe, expect, it } from "vitest";
import { getEffectivePregnancyWeek, normalizeWomenHealthState } from "./womenHealth";

const NOW = new Date("2026-07-12T12:00:00.000Z");

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
});
