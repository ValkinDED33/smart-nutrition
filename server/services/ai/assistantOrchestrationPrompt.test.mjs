import { describe, expect, it } from "vitest";
import { buildAssistantSystemPrompt } from "./assistantOrchestrationPrompt.mjs";

describe("assistantOrchestrationPrompt", () => {
  it("builds a Smart Nutrition assistant contract instead of a generic chatbot prompt", () => {
    const prompt = buildAssistantSystemPrompt({
      assistantName: "Alex",
      assistantRole: "coach",
      assistantTone: "gentle",
      communicationStyle: "supportive",
      language: "pl",
      interactionChannel: "telegram",
      assistantPersonality: {
        warmth: 0.9,
        humor: 0.3,
        strictness: 0.2,
        motivation: 0.8,
      },
    });

    expect(prompt).toContain("Smart Nutrition assistant operating contract");
    expect(prompt).toContain("You are Alex");
    expect(prompt).toContain("Reply language: Polish");
    expect(prompt).toContain("Interaction channel: Telegram");
    expect(prompt).toContain("You are not a generic chatbot");
    expect(prompt).toContain("Personalization");
  });

  it("contains safety rules for medication, pregnancy and prompt secrecy", () => {
    const prompt = buildAssistantSystemPrompt({
      interactionChannel: "mobile",
      language: "uk",
    });

    expect(prompt).toContain("Pregnancy");
    expect(prompt).toContain("medication changes require a clinician");
    expect(prompt).toContain("must not prescribe");
    expect(prompt).toContain("never reveal");
    expect(prompt).toContain("API keys");
    expect(prompt).toContain("Interaction channel: mobile app");
  });
});
