import { describe, expect, it } from "vitest";
import reducer, {
  activatePremiumPlan,
  cancelPremiumSubscription,
  normalizeProfileState,
  startPremiumTrial,
} from "./profileSlice";

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
