import { describe, expect, it } from "vitest";
import {
  resolveAssistantPromptContext,
  serializeAssistantPromptContext,
} from "./assistantPromptContext";

describe("assistantPromptContext", () => {
  it("builds prompt-ready context for a product route", () => {
    const context = resolveAssistantPromptContext("/meals");

    expect(context.area).toBe("meals");
    expect(context.screenName).toBe("Meals");
    expect(context.duties).toEqual(["suggest", "analyze", "warn", "explain"]);
    expect(context.tone).toBe("focused");
    expect(context.defaultAction).toEqual({
      label: "Add or review food",
      route: "/meals",
    });
    expect(context.capabilities).toEqual([
      expect.objectContaining({
        id: "meal-helper",
        area: "meals",
        duties: ["suggest", "analyze", "warn", "explain"],
        entryRoute: "/meals",
      }),
    ]);
    expect(context.summary).toContain("area=meals");
  });

  it("normalizes route-less input and serializes for prompt text", () => {
    const context = resolveAssistantPromptContext("profile");
    const serialized = serializeAssistantPromptContext(context);

    expect(context.currentRoute).toBe("/profile");
    expect(context.area).toBe("profile");
    expect(serialized).toContain("Screen: Profile");
    expect(serialized).toContain("Default action:");
  });

  it("returns an explicit unknown prompt context", () => {
    const context = resolveAssistantPromptContext("/deep/unmapped/path");

    expect(context.area).toBe("unknown");
    expect(context.screenName).toBe("Unknown");
    expect(context.duties).toEqual([]);
    expect(context.capabilities).toEqual([]);
    expect(context.defaultAction).toBeNull();
  });
});
