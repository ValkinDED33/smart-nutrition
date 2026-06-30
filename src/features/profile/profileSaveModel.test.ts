import { describe, expect, it } from "vitest";
import {
  buildProfileStateAfterFullSave,
  buildProfileStateAfterMeasurementSave,
  buildProfileStateAfterWeightSave,
} from "./profileSaveModel";
import { normalizeProfileState } from "./profileSlice";

describe("profileSaveModel", () => {
  it("builds the same profile state that the full save reducers persist", () => {
    const initial = normalizeProfileState({
      dailyCalories: 2000,
      personalDetails: { bloodGroup: "unknown" },
      womenHealth: { mode: "none" },
    });

    const next = buildProfileStateAfterFullSave(initial, {
      targets: {
        goal: "cut",
        weight: 82,
        maintenanceCalories: 2500,
        targetCalories: 2100,
        targetWeight: 75,
        dietStyle: "balanced",
        allergies: ["lactose"],
        excludedIngredients: ["sugar"],
        adaptiveMode: "manual",
      },
      personalDetails: {
        bloodGroup: "a_positive",
        eyeColor: "green",
        relationshipStatus: "married",
        supportSystem: "partner_supports",
        petCompanion: "cat",
      },
      womenHealth: {
        mode: "pregnant",
        pregnancyWeek: 12,
        doctorConfirmed: true,
        notes: "doctor plan exists",
      },
    });

    expect(next).toMatchObject({
      goal: "cut",
      dailyCalories: 2100,
      maintenanceCalories: 2500,
      targetWeight: 75,
      dietStyle: "balanced",
      allergies: ["lactose"],
      excludedIngredients: ["sugar"],
      adaptiveMode: "manual",
      personalDetails: {
        bloodGroup: "a_positive",
        eyeColor: "green",
        relationshipStatus: "married",
        supportSystem: "partner_supports",
        petCompanion: "cat",
      },
      womenHealth: {
        mode: "pregnant",
        pregnancyWeek: 12,
        doctorConfirmed: true,
      },
    });
    expect(next.weightHistory.at(-1)?.weight).toBe(82);
  });

  it("previews quick weight and measurements before cloud confirmation", () => {
    const initial = normalizeProfileState({});
    const withWeight = buildProfileStateAfterWeightSave(initial, 88.5);
    const withMeasurements = buildProfileStateAfterMeasurementSave(withWeight, {
      weight: 88.5,
      waist: 90,
      abdomen: 95,
      hip: 100,
      chest: 105,
    });

    expect(withWeight.weightHistory.at(-1)?.weight).toBe(88.5);
    expect(withMeasurements.measurementHistory.at(-1)).toMatchObject({
      weight: 88.5,
      waist: 90,
      abdomen: 95,
      hip: 100,
      chest: 105,
    });
  });
});
