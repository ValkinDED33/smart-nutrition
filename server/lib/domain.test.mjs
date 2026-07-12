import { describe, expect, it } from "vitest";
import { createInitialProfileState } from "./domain.mjs";

describe("domain profile defaults", () => {
  it("does not assign an assistant name before the user chooses one", () => {
    const profile = createInitialProfileState({
      age: 30,
      weight: 75,
      height: 178,
      gender: "male",
      activity: "moderate",
      goal: "maintain",
    });

    expect(profile.assistant.name).toBe("");
    expect(profile.assistant).toMatchObject({
      assistantName: "",
      companionKind: "robot",
      assistantAvatar: "robot",
      preferredCompanionRenderMode: "2d",
      role: "assistant",
      tone: "gentle",
      assistantPersonality: "gentle",
      assistantMood: "idle",
      assistantMemory: {
        goals: [],
        preferences: [],
        conversationHighlights: [],
        lastSyncedAt: null,
      },
      onboarding: {
        goalSelections: [],
        mainFrictions: [],
        motivationStyles: ["gentle"],
      },
    });
  });
});
