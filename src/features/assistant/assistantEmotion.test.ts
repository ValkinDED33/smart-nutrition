import { describe, expect, it } from "vitest";
import { resolveAssistantContext } from "./assistantContext";
import { resolveAssistantEmotion } from "./assistantEmotion";
import { resolveAssistantPresence } from "./assistantPresence";

const createPresence = (pathname: string, viewport: "mobile" | "desktop" = "desktop") => {
  const context = resolveAssistantContext(pathname);

  return {
    context,
    presence: resolveAssistantPresence(context, {
      pathname,
      viewport,
    }),
  };
};

describe("assistantEmotion", () => {
  it("celebrates recent success with high priority", () => {
    const { context, presence } = createPresence("/dashboard");

    expect(
      resolveAssistantEmotion(context, presence, {
        recentSuccess: true,
      })
    ).toEqual({
      mood: "celebrate",
      emotion: "celebrate",
      messageIntent: "celebrate",
      priority: "high",
    });
  });

  it("becomes concerned after recent errors", () => {
    const { context, presence } = createPresence("/dashboard");

    expect(
      resolveAssistantEmotion(context, presence, {
        recentError: true,
      })
    ).toEqual({
      mood: "concerned",
      emotion: "concerned",
      messageIntent: "warn",
      priority: "high",
    });
  });

  it("coaches when there are no meals today on meals route", () => {
    const { context, presence } = createPresence("/meals");

    expect(
      resolveAssistantEmotion(context, presence, {
        hasNoMealsToday: true,
      })
    ).toEqual({
      mood: "coach",
      emotion: "coach",
      messageIntent: "guide",
      priority: "normal",
    });
  });

  it("encourages hydration when water is behind target", () => {
    const { context, presence } = createPresence("/water");

    expect(
      resolveAssistantEmotion(context, presence, {
        waterBehindTarget: true,
      })
    ).toEqual({
      mood: "happy",
      emotion: "happy",
      messageIntent: "encourage",
      priority: "normal",
    });
  });

  it("uses focused coach emotion on coach route", () => {
    const { context, presence } = createPresence("/coach");

    expect(resolveAssistantEmotion(context, presence, {})).toEqual({
      mood: "coach",
      emotion: "focused",
      messageIntent: "explain",
      priority: "high",
    });
  });

  it("lowers priority for hidden presence", () => {
    const { context, presence } = createPresence("/onboarding");

    expect(
      resolveAssistantEmotion(context, presence, {
        recentSuccess: true,
      })
    ).toEqual({
      mood: "idle",
      emotion: "calm",
      messageIntent: "idle",
      priority: "low",
    });
  });

  it("lowers high priority reactions in compact presence", () => {
    const { context, presence } = createPresence("/meals");

    expect(
      resolveAssistantEmotion(context, presence, {
        hasNoMealsToday: true,
      })
    ).toEqual({
      mood: "coach",
      emotion: "coach",
      messageIntent: "guide",
      priority: "normal",
    });
  });
});
