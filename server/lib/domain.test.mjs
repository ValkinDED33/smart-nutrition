import { describe, expect, it } from "vitest";
import {
  createInitialCommunityState,
  createInitialProfileState,
  normalizeWomenHealthState,
} from "./domain.mjs";

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

describe("server domain profile contracts", () => {
  it("creates the full canonical women health shape for every storage engine", () => {
    const profile = createInitialProfileState({
      age: 25,
      gender: "female",
      weight: 70,
      height: 175,
      activity: "moderate",
      goal: "maintain",
      languagePreference: "uk",
    });

    expect(profile.womenHealth).toMatchObject({
      mode: "none",
      pregnancyWeek: null,
      pregnancyDay: null,
      dueDate: null,
      lastPeriodStartDate: null,
      doctorConfirmed: false,
      notes: "",
      symptomHistory: [],
      partnerEyeColor: "unknown",
      motherZodiac: "unknown",
      fatherZodiac: "unknown",
      motherChineseZodiac: "unknown",
      fatherChineseZodiac: "unknown",
      updatedAt: null,
    });
  });

  it("normalizes pregnancy day and family preview fields without storing invalid values", () => {
    const state = normalizeWomenHealthState({
      mode: "pregnant",
      pregnancyWeek: 14,
      pregnancyDay: 9,
      dueDate: "not a date",
      lastPeriodStartDate: "2026-05-01",
      doctorConfirmed: true,
      notes: "  важливо   без хаосу  ",
      partnerEyeColor: "blue",
      motherZodiac: "cancer",
      fatherZodiac: "capricorn",
      motherChineseZodiac: "tiger",
      fatherChineseZodiac: "goat",
      symptomHistory: [
        {
          id: "one",
          recordedAt: "2026-08-08T08:00:00.000Z",
          label: "Нудота",
          severity: 12,
          note: "  після сніданку ",
          source: "assistant",
        },
      ],
    });

    expect(state).toMatchObject({
      mode: "pregnant",
      pregnancyWeek: 14,
      pregnancyDay: 0,
      dueDate: null,
      doctorConfirmed: true,
      notes: "важливо без хаосу",
      partnerEyeColor: "blue",
      motherZodiac: "cancer",
      fatherZodiac: "capricorn",
      motherChineseZodiac: "tiger",
      fatherChineseZodiac: "goat",
      symptomHistory: [
        {
          id: "one",
          label: "Нудота",
          severity: 10,
          note: "після сніданку",
          source: "assistant",
        },
      ],
    });
    expect(state.lastPeriodStartDate).toBe("2026-05-01T00:00:00.000Z");
  });
});
