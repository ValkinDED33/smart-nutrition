import { describe, expect, it } from "vitest";
import type { User } from "@domain/user/types";
import { buildProfileBootstrapState, buildSessionProfileState } from "./authSessionProfile";
import { normalizeProfileState } from "@features/profile/profileSlice";

const user: User = {
  id: "user-1",
  name: "Session User",
  email: "session@example.com",
  age: 32,
  weight: 82,
  height: 181,
  gender: "male",
  activity: "moderate",
  goal: "maintain",
  role: "USER",
};

describe("authSessionProfile", () => {
  it("builds a bootstrap profile from the authenticated user", () => {
    const profile = buildProfileBootstrapState(user);

    expect(profile.goal).toBe("maintain");
    expect(profile.weightHistory.at(-1)?.weight).toBe(82);
    expect(profile.dailyCalories).toBeGreaterThan(0);
    expect(profile.adaptiveMode).toBe("automatic");
  });

  it("uses snapshot profile data but applies the current language preference", () => {
    const snapshotProfile = normalizeProfileState({
      dailyCalories: 1900,
      goal: "cut",
      languagePreference: "pl",
    });

    const profile = buildSessionProfileState({
      user,
      snapshot: {
        profile: snapshotProfile,
        meal: null,
        water: null,
        fridge: null,
        community: null,
        companion: null,
      },
      language: "en",
    });

    expect(profile.dailyCalories).toBe(1900);
    expect(profile.goal).toBe("cut");
    expect(profile.languagePreference).toBe("en");
  });
});
