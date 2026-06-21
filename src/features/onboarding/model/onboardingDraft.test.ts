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
      womenHealthMode: "pregnant",
      pregnancyWeek: 12,
      dueDate: "2026-12-20",
      lastPeriodStartDate: "2026-03-20",
      doctorConfirmed: true,
      womenHealthNotes: "Нагадувати тільки за планом лікаря",
      height: 168,
      weight: 64,
      goal: "cut",
      selectedGoals: ["cut", "healthy"],
      primaryGoalNote: "Менше вечірніх перекусів",
      mainFriction: "evening_snacking",
      mainFrictions: ["evening_snacking", "low_energy"],
      motivationStyle: "direct",
      motivationStyles: ["direct", "gentle"],
      supportNote: "Не тиснути, коли день пішов не за планом",
    });

    const draft = readPreAuthOnboardingDraft("uk");

    expect(hasPreAuthOnboardingDraft()).toBe(true);
    expect(draft.assistantName).toBe("Мія");
    expect(draft.assistantAvatar).toBe("panda");
    expect(draft.userName).toBe("Олена");
    expect(draft.womenHealthMode).toBe("pregnant");
    expect(draft.pregnancyWeek).toBe(12);
    expect(draft.doctorConfirmed).toBe(true);
    expect(draft.selectedGoals).toEqual(["cut", "healthy"]);
    expect(draft.mainFriction).toBe("evening_snacking");
    expect(draft.mainFrictions).toEqual(["evening_snacking", "low_energy"]);
    expect(draft.motivationStyle).toBe("direct");
    expect(draft.motivationStyles).toEqual(["direct", "gentle"]);
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
