import { describe, expect, it } from "vitest";
import {
  resolveGlobalAssistantLayerModel,
  resolveGlobalAssistantNoticeKey,
} from "./globalAssistantLayerModel";

describe("globalAssistantLayerModel", () => {
  it("turns real day signals into living assistant notices", () => {
    expect(
      resolveGlobalAssistantNoticeKey("home", {
        hasNoMealsToday: true,
        onboardingCompleted: true,
      })
    ).toBe("first_meal");

    expect(
      resolveGlobalAssistantNoticeKey("water", {
        waterBehindTarget: true,
        onboardingCompleted: true,
      })
    ).toBe("water");

    expect(
      resolveGlobalAssistantNoticeKey("progress", {
        weightUpdatedToday: true,
        onboardingCompleted: true,
      })
    ).toBe("weight");
  });

  it("prioritizes confirmed success and failed save notices over soft nudges", () => {
    expect(
      resolveGlobalAssistantNoticeKey("home", {
        recentSuccess: true,
        hasNoMealsToday: true,
        waterBehindTarget: true,
      })
    ).toBe("recent_success");

    expect(
      resolveGlobalAssistantNoticeKey("home", {
        recentError: true,
        hasNoMealsToday: true,
        waterBehindTarget: true,
      })
    ).toBe("recent_error");
  });

  it("keeps the notice inside the single canonical global assistant layer model", () => {
    const model = resolveGlobalAssistantLayerModel(
      "/dashboard",
      {
        viewport: "desktop",
        inputFocused: false,
        prefersReducedMotion: false,
      },
      {
        hasNoMealsToday: true,
        onboardingCompleted: true,
      }
    );

    expect(model.noticeKey).toBe("first_meal");
    expect(model.presence.visible).toBe(true);
    expect(model.displayAction?.route).toBe("/coach");
  });
});
