import { describe, expect, it } from "vitest";
import type { RootState } from "@app/store";
import { calculateMacroTargets } from "@domain/profile/macroTargets";
import type { User } from "@domain/user/types";
import {
  selectCurrentWeight,
  selectDailyMacroTargets,
} from "../selectors";
import reducer, {
  addProgressPhoto,
  activatePremiumPlan,
  cancelPremiumSubscription,
  normalizeProfileState,
  setAssistantCustomization,
  startPremiumTrial,
  updatePersonalDetails,
  updateWomenHealth,
} from "./store";

const createSelectorState = ({
  weightHistory = [],
  userWeight = 80,
}: {
  weightHistory?: Array<{ date: string; weight: number }>;
  userWeight?: number;
}) =>
  ({
    auth: {
      user: {
        id: "test-user",
        name: "Test User",
        email: "test@example.com",
        age: 30,
        weight: userWeight,
        height: 175,
        gender: "male",
        activity: "moderate",
        goal: "cut",
        role: "USER",
      } satisfies User,
    },
    profile: {
      dailyCalories: 2100,
      goal: "cut",
      dietStyle: "balanced",
      weightHistory,
    },
  }) as unknown as RootState;

describe("profileSlice premium", () => {
  it("normalizes invalid free active subscriptions back to inactive free", () => {
    const state = normalizeProfileState({
      premium: {
        plan: "free",
        status: "active",
      },
    });

    expect(state.premium).toMatchObject({
      plan: "free",
      status: "inactive",
    });
  });

  it("starts trial, activates paid plan, and cancels subscription", () => {
    let state = reducer(
      undefined,
      startPremiumTrial({ startedAt: "2026-05-02T10:00:00.000Z" })
    );

    expect(state.premium).toMatchObject({
      plan: "pro",
      status: "trial",
      trialEndsAt: "2026-05-09T10:00:00.000Z",
    });

    state = reducer(
      state,
      activatePremiumPlan({
        plan: "coach",
        activatedAt: "2026-05-02T10:00:00.000Z",
      })
    );

    expect(state.premium).toMatchObject({
      plan: "coach",
      status: "active",
      renewsAt: "2026-06-01T10:00:00.000Z",
    });

    state = reducer(
      state,
      cancelPremiumSubscription({ cancelledAt: "2026-05-03T10:00:00.000Z" })
    );

    expect(state.premium).toMatchObject({
      plan: "free",
      status: "cancelled",
      cancelledAt: "2026-05-03T10:00:00.000Z",
    });
  });
});

describe("profileSlice progress photos", () => {
  it("accepts only bounded raster image data URLs", () => {
    let state = reducer(
      undefined,
      addProgressPhoto({ imageDataUrl: "data:image/svg+xml;base64,PHN2Zy8+" })
    );

    expect(state.progressPhotos).toHaveLength(0);

    state = reducer(
      state,
      addProgressPhoto({
        imageDataUrl: `data:image/png;base64,${"a".repeat(1_700_000)}`,
      })
    );

    expect(state.progressPhotos).toHaveLength(0);

    state = reducer(
      state,
      addProgressPhoto({ imageDataUrl: "data:image/webp;base64,aaaa" })
    );

    expect(state.progressPhotos).toHaveLength(1);
  });
});

describe("profileSlice personal details", () => {
  it("normalizes assistant personalization details", () => {
    let state = reducer(
      undefined,
      updatePersonalDetails({
        bloodGroup: "a_positive",
        eyeColor: "green",
        relationshipStatus: "married",
        supportSystem: "partner_supports",
        petCompanion: "cat",
      })
    );

    expect(state.personalDetails).toMatchObject({
      bloodGroup: "a_positive",
      eyeColor: "green",
      relationshipStatus: "married",
      supportSystem: "partner_supports",
      petCompanion: "cat",
    });

    state = normalizeProfileState({
      personalDetails: {
        bloodGroup: "bad",
        eyeColor: "blue",
        relationshipStatus: "bad",
        supportSystem: "low_support",
        petCompanion: "dog",
      },
    });

    expect(state.personalDetails).toMatchObject({
      bloodGroup: "unknown",
      eyeColor: "blue",
      relationshipStatus: "prefer_not",
      supportSystem: "low_support",
      petCompanion: "dog",
    });
  });
});

describe("profileSlice women health", () => {
  it("normalizes missing and invalid women health profile safely", () => {
    const emptyState = normalizeProfileState({});
    expect(emptyState.womenHealth).toMatchObject({
      mode: "none",
      pregnancyWeek: null,
      doctorConfirmed: false,
    });

    const invalidState = normalizeProfileState({
      womenHealth: {
        mode: "pregnant",
        pregnancyWeek: 80,
        dueDate: "not-a-date",
        doctorConfirmed: true,
        notes: "x".repeat(260),
      },
    });

    expect(invalidState.womenHealth).toMatchObject({
      mode: "pregnant",
      pregnancyWeek: null,
      dueDate: null,
      doctorConfirmed: true,
    });
    expect(invalidState.womenHealth.notes).toHaveLength(220);
  });

  it("updates women health mode for pregnancy context", () => {
    const state = reducer(
      undefined,
      updateWomenHealth({
        mode: "pregnant",
        pregnancyWeek: 12,
        doctorConfirmed: true,
        notes: "doctor plan exists",
      })
    );

    expect(state.womenHealth).toMatchObject({
      mode: "pregnant",
      pregnancyWeek: 12,
      doctorConfirmed: true,
      notes: "doctor plan exists",
    });
    expect(state.womenHealth.updatedAt).toEqual(expect.any(String));
  });
});

describe("profileSlice assistant onboarding", () => {
  it("defaults and normalizes the companion render mode preference", () => {
    const defaultState = normalizeProfileState({});

    expect(defaultState.assistant.preferredCompanionRenderMode).toBe("2d");

    const restoredState = normalizeProfileState({
      assistant: {
        preferredCompanionRenderMode: "3d",
      },
    });

    expect(restoredState.assistant.preferredCompanionRenderMode).toBe("3d");

    const invalidState = normalizeProfileState({
      assistant: {
        preferredCompanionRenderMode: "auto",
      },
    });

    expect(invalidState.assistant.preferredCompanionRenderMode).toBe("2d");
  });

  it("persists companion render mode through assistant customization", () => {
    const state = reducer(
      undefined,
      setAssistantCustomization({ preferredCompanionRenderMode: "3d" })
    );

    expect(state.assistant.preferredCompanionRenderMode).toBe("3d");
  });

  it("persists and normalizes companion memory inputs", () => {
    const state = reducer(
      undefined,
      setAssistantCustomization({
        onboarding: {
          preferredName: "Ira",
          primaryGoalNote: "steady evenings",
          goalSelections: ["cut", "healthy"],
          mainFriction: "evening_snacking",
          mainFrictions: ["evening_snacking", "chaotic_schedule"],
          motivationStyle: "direct",
          motivationStyles: ["direct", "gentle"],
          supportNote: "keep it practical",
          completedAt: "2026-05-23T12:00:00.000Z",
        },
      })
    );

    expect(state.assistant.onboarding).toMatchObject({
      preferredName: "Ira",
      primaryGoalNote: "steady evenings",
      goalSelections: ["cut", "healthy"],
      mainFriction: "evening_snacking",
      mainFrictions: ["evening_snacking", "chaotic_schedule"],
      motivationStyle: "direct",
      motivationStyles: ["direct", "gentle"],
      supportNote: "keep it practical",
    });

    const normalized = normalizeProfileState({
      assistant: {
        onboarding: {
          mainFriction: "invalid",
          motivationStyle: "invalid",
        },
      },
    });

    expect(normalized.assistant.onboarding).toMatchObject({
      mainFriction: "unknown",
      mainFrictions: [],
      motivationStyle: "gentle",
      motivationStyles: ["gentle"],
    });
  });
});

describe("profile selectors", () => {
  it("uses the latest weight check-in before the account weight", () => {
    const state = createSelectorState({
      userWeight: 80,
      weightHistory: [
        { date: "2026-05-01T10:00:00.000Z", weight: 77.8 },
        { date: "2026-05-02T10:00:00.000Z", weight: 75.4 },
      ],
    });

    expect(selectCurrentWeight(state)).toBe(75.4);
  });

  it("calculates macro targets from the latest check-in weight", () => {
    const state = createSelectorState({
      userWeight: 80,
      weightHistory: [{ date: "2026-05-02T10:00:00.000Z", weight: 75 }],
    });

    expect(selectDailyMacroTargets(state)).toEqual(
      calculateMacroTargets({
        calories: 2100,
        weight: 75,
        goal: "cut",
        dietStyle: "balanced",
      })
    );
  });
});
