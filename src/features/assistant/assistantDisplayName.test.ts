import { describe, expect, it } from "vitest";
import { getAssistantDisplayName } from "./assistantDisplayName";

describe("assistant display name", () => {
  it("keeps a user-chosen assistant name visible", () => {
    expect(getAssistantDisplayName(" Lumi ", "en")).toBe("Lumi");
  });

  it("uses a localized fallback without saving a fake default name", () => {
    expect(getAssistantDisplayName("", "uk")).toBe("ваш помічник");
    expect(getAssistantDisplayName(" ", "pl")).toBe("Twój asystent");
    expect(getAssistantDisplayName("", "en")).toBe("your assistant");
  });

  it("hides legacy accidental assistant names from the visible interface", () => {
    expect(getAssistantDisplayName("HyeMye", "uk")).toBe("ваш помічник");
    expect(getAssistantDisplayName("huemue", "en", "Smart Nutrition AI")).toBe(
      "Smart Nutrition AI"
    );
  });
});
