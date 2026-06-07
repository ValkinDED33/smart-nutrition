import { describe, expect, it } from "vitest";
import {
  resolveAssistantContext,
  serializeAssistantDuties,
} from "./assistantContext";

describe("assistantContext", () => {
  it("builds a complete route context from the manifest", () => {
    const context = resolveAssistantContext("/meals");

    expect(context).toMatchObject({
      area: "meals",
      currentRoute: "/meals",
      screenName: "Meals",
      tone: "focused",
      visibility: "global",
      defaultAction: {
        label: "Add or review food",
        route: "/meals",
      },
    });
    expect(context.duties).toEqual(
      expect.arrayContaining(["suggest", "analyze", "warn", "explain"])
    );
    expect(context.capabilities[0]?.id).toBe("meal-helper");
    expect(context.primaryCapability?.id).toBe("meal-helper");
  });

  it("normalizes routes without a leading slash", () => {
    const context = resolveAssistantContext("progress");

    expect(context.area).toBe("progress");
    expect(context.currentRoute).toBe("/progress");
    expect(context.screenName).toBe("Progress");
  });

  it("returns an unknown context for unsupported routes", () => {
    const context = resolveAssistantContext("/missing");

    expect(context.area).toBe("unknown");
    expect(context.screenName).toBe("Unknown");
    expect(context.capabilities).toEqual([]);
    expect(context.defaultAction).toBeNull();
    expect(context.visibility).toBe("hidden");
  });

  it("serializes duties for analytics payloads", () => {
    expect(serializeAssistantDuties(["suggest", "warn"])).toBe("suggest,warn");
  });
});
