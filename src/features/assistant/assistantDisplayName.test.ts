import { describe, expect, it } from "vitest";
import { getAssistantDisplayName } from "./assistantDisplayName";

const UK_ASSISTANT_FALLBACK = "Помічник Smart Nutrition";

describe("assistant display name", () => {
  it("keeps a user-chosen assistant name visible", () => {
    expect(getAssistantDisplayName(" Lumi ", "en")).toBe("Lumi");
  });

  it("uses a localized fallback without saving a fake default name", () => {
    expect(getAssistantDisplayName("", "uk")).toBe(UK_ASSISTANT_FALLBACK);
    expect(getAssistantDisplayName(" ", "pl")).toBe("Asystent Smart Nutrition");
    expect(getAssistantDisplayName("", "en")).toBe("Smart Nutrition Assistant");
  });

  it("hides legacy accidental assistant names from the visible interface", () => {
    expect(getAssistantDisplayName("HyeMye", "uk")).toBe(UK_ASSISTANT_FALLBACK);
    expect(getAssistantDisplayName(" Hye Mye ", "uk")).toBe(UK_ASSISTANT_FALLBACK);
    expect(getAssistantDisplayName("hye-mue", "pl")).toBe("Asystent Smart Nutrition");
    expect(getAssistantDisplayName("HUE_MYE", "en")).toBe("Smart Nutrition Assistant");
    expect(getAssistantDisplayName("huemue", "en", "Smart Nutrition AI")).toBe(
      "Smart Nutrition AI"
    );
  });
});
