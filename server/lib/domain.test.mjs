import { describe, expect, it } from "vitest";
import { createInitialCommunityState, createInitialProfileState } from "./domain.mjs";

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
    expect(profile.familyLifecycleMode).toBe("personal");
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

describe("domain community defaults", () => {
  it("uses the selected profile language for initial community seed content", () => {
    const polishCommunity = createInitialCommunityState("pl");

    expect(polishCommunity.posts[0]).toMatchObject({
      title: "Białkowe śniadanie w słoiku",
      ingredients: ["jogurt grecki", "płatki owsiane", "banan", "chia"],
    });
    expect(polishCommunity.messages[0]?.text).toContain("Przygotowałam");
    expect(polishCommunity.roomMessages[1]?.authorName).toBe("Coach Smart Nutrition");
    expect(polishCommunity.progressCards[1]).toMatchObject({
      metricLabel: "Rytm wody",
      metricValue: "7 dni",
    });
  });

  it("keeps Ukrainian startup community copy coherent by default", () => {
    const community = createInitialCommunityState();
    const visibleText = JSON.stringify(community);

    expect(community.posts[0]?.title).toBe("Білковий сніданок у банці");
    expect(community.progressCards[0]?.metricLabel).toBe("Вага");
    expect(visibleText).not.toMatch(
      /High-protein breakfast jar|How I broke|Plateau week|Собрала|Сегодня|Если вес|стаканы/
    );
  });
});
