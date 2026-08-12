import { describe, expect, it } from "vitest";
import { getAssistantDisplayName } from "./assistantDisplayName";

describe("assistant display name", () => {
  it("keeps a user-chosen assistant name visible", () => {
    expect(getAssistantDisplayName(" Lumi ", "en")).toBe("Lumi");
  });

  it("uses a localized fallback without saving a fake default name", () => {
    expect(getAssistantDisplayName("", "uk")).toBe("Помічник Smart Nutrition");
    expect(getAssistantDisplayName(" ", "pl")).toBe("Asystent Smart Nutrition");
    expect(getAssistantDisplayName("", "en")).toBe("Smart Nutrition Assistant");
  });

  it("hides legacy accidental assistant names from the visible interface", () => {
    expect(getAssistantDisplayName("HyeMye", "uk")).toBe("Помічник Smart Nutrition");
    expect(getAssistantDisplayName("huemue", "en", "Smart Nutrition AI")).toBe(
      "Smart Nutrition AI"
    );
  });
});
