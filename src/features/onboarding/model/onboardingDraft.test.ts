import { describe, expect, it } from "vitest";
import {
  clearPreAuthOnboardingDraft,
  hasPreAuthOnboardingDraft,
  readPreAuthOnboardingDraft,
  writePreAuthOnboardingDraft,
} from "./onboardingDraft";

describe("onboardingDraft", () => {
  it("persists the selected assistant identity without falling back to defaults", () => {
    clearPreAuthOnboardingDraft();

    writePreAuthOnboardingDraft({
      language: "uk",
      assistantName: "Мія",
      assistantAvatar: "panda",
      assistantPersonality: "gentle",
      userName: "Олена",
      age: 31,
      gender: "female",
      height: 168,
      weight: 64,
      goal: "cut",
      primaryGoalNote: "Менше вечірніх перекусів",
      mainFriction: "evening_snacking",
      motivationStyle: "direct",
      supportNote: "Не тиснути, коли день пішов не за планом",
    });

    const draft = readPreAuthOnboardingDraft("uk");

    expect(hasPreAuthOnboardingDraft()).toBe(true);
    expect(draft.assistantName).toBe("Мія");
    expect(draft.assistantAvatar).toBe("panda");
    expect(draft.userName).toBe("Олена");
    expect(draft.mainFriction).toBe("evening_snacking");
    expect(draft.motivationStyle).toBe("direct");
    expect(draft.supportNote).toBe("Не тиснути, коли день пішов не за планом");
  });

  it("normalizes newer companion variants from stored data", () => {
    clearPreAuthOnboardingDraft();

    writePreAuthOnboardingDraft({
      ...readPreAuthOnboardingDraft("en"),
      assistantName: "Nova",
      assistantAvatar: "owl",
    });

    expect(readPreAuthOnboardingDraft("en").assistantAvatar).toBe("owl");
  });
});
