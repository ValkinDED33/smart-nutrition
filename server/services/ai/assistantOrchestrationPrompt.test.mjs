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
    expect(prompt).toContain("reply language: Polish");
    expect(prompt).toContain("channel: Telegram");
    expect(prompt).toContain("CORE_SYSTEM_PROMPT");
    expect(prompt).toContain("nutrition companion");
    expect(prompt).toContain("Primary mission");
  });

  it("uses a neutral runtime label when the user has not named the companion", () => {
    const prompt = buildAssistantSystemPrompt({
      assistantName: "",
      assistantRole: "assistant",
      language: "en",
    });

    expect(prompt).toContain("You are Smart Nutrition companion");
    expect(prompt).not.toContain("You are Diana");
    expect(prompt).not.toContain("You are Алекс");
  });

  it("contains safety rules for medication, pregnancy and prompt secrecy", () => {
    const prompt = buildAssistantSystemPrompt({
      interactionChannel: "mobile",
      language: "uk",
    });

    expect(prompt).toContain("Pregnancy");
    expect(prompt).toContain("medication changes require a clinician");
    expect(prompt).toContain("prescribe medications");
    expect(prompt).toContain("never reveal");
    expect(prompt).toContain("API keys");
    expect(prompt).toContain("Mobile mode");
  });

  it("includes production AI OS layers for tools, memory, emotion and self-checks", () => {
    const prompt = buildAssistantSystemPrompt({
      interactionChannel: "web",
      language: "en",
    });

    expect(prompt).toContain("AGENT_TOOL_PROMPT");
    expect(prompt).toContain("Never invent successful actions");
    expect(prompt).toContain("MEMORY_PROMPT");
    expect(prompt).toContain("EMOTIONAL_COMPANION_PROMPT");
    expect(prompt).toContain("SELF_REFLECTION_PROMPT");
    expect(prompt).toContain("Never expose this reflection process");
  });

  it("includes intent, screen, gamification and provider routing contracts", () => {
    const prompt = buildAssistantSystemPrompt({
      interactionChannel: "telegram",
      language: "uk",
    });

    expect(prompt).toContain("INTENT_DETECTION_PROMPT");
    expect(prompt).toContain("medication_reminder");
    expect(prompt).toContain("SCREEN_CONTEXT_PROMPT");
    expect(prompt).toContain("STREAK_AND_GAMIFICATION_PROMPT");
    expect(prompt).toContain("MULTI_PROVIDER_ROUTING_PROMPT");
    expect(prompt).toContain("Gemini");
    expect(prompt).toContain("Groq");
  });

  it("keeps the full assistant AI operating system prompt stack", () => {
    const prompt = buildAssistantSystemPrompt({
      interactionChannel: "web",
      language: "en",
    });

    [
      "CORE_SYSTEM_PROMPT",
      "SAFETY_AND_MEDICAL_PROMPT",
      "AGENT_TOOL_PROMPT",
      "MEMORY_PROMPT",
      "EMOTIONAL_COMPANION_PROMPT",
      "WEB_AND_MOBILE_PROMPT",
      "STREAK_AND_GAMIFICATION_PROMPT",
      "PRODUCT_AND_NUTRITION_ANALYSIS_PROMPT",
      "SELF_REFLECTION_PROMPT",
      "INTENT_DETECTION_PROMPT",
      "COMPANION_EVOLUTION_PROMPT",
      "LONG_TERM_MEMORY_SUMMARIZER",
      "DAILY_COACH_PROMPT",
      "AI_AGENT_RUNTIME_RULES",
      "SCREEN_CONTEXT_PROMPT",
      "AI_RESPONSE_STYLE_PROMPT",
      "MULTI_PROVIDER_ROUTING_PROMPT",
      "AUTONOMOUS_ASSISTANT_PROMPT",
      "SECURITY_PROMPT",
    ].forEach((layerName) => {
      expect(prompt).toContain(layerName);
    });
  });
});
