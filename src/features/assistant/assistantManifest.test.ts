import { describe, expect, it } from "vitest";
import {
  assistantCapabilities,
  getAssistantCapabilitiesForArea,
  getAssistantDutiesForArea,
  resolveAssistantArea,
  resolveAssistantCapabilities,
} from "./assistantManifest";
import { getAssistantScreenFromPath } from "./assistantScreen";

describe("assistantManifest", () => {
  it("resolves product routes to assistant areas", () => {
    expect(resolveAssistantArea("/")).toBe("home");
    expect(resolveAssistantArea("/dashboard")).toBe("home");
    expect(resolveAssistantArea("/onboarding/friction")).toBe("onboarding");
    expect(resolveAssistantArea("/meals")).toBe("meals");
    expect(resolveAssistantArea("/food")).toBe("meals");
    expect(resolveAssistantArea("/scanner")).toBe("meals");
    expect(resolveAssistantArea("/photo-meal")).toBe("meals");
    expect(resolveAssistantArea("/coach")).toBe("coach");
    expect(resolveAssistantArea("/assistant")).toBe("coach");
    expect(resolveAssistantArea("/ai")).toBe("coach");
    expect(resolveAssistantArea("/progress")).toBe("progress");
    expect(resolveAssistantArea("/profile")).toBe("profile");
    expect(resolveAssistantArea("/community")).toBe("community");
    expect(resolveAssistantArea("/recipes")).toBe("recipes");
    expect(resolveAssistantArea("/water")).toBe("water");
    expect(resolveAssistantArea("/admin")).toBe("admin");
    expect(resolveAssistantArea("/missing")).toBe("unknown");
  });

  it("keeps every declared capability connected to an area and duties", () => {
    expect(assistantCapabilities.length).toBeGreaterThan(0);

    assistantCapabilities.forEach((capability) => {
      expect(capability.id).toBeTruthy();
      expect(capability.description).toBeTruthy();
      expect(capability.duties.length).toBeGreaterThan(0);
      expect(capability.defaultAction.route).toMatch(/^\//);
      expect(capability.defaultAction.label).toBeTruthy();
      expect(capability.visibility).not.toBe("hidden");
      expect(getAssistantCapabilitiesForArea(capability.area)).toContain(capability);
    });
  });

  it("derives duties and capabilities from the current route", () => {
    expect(getAssistantDutiesForArea("coach")).toEqual(
      expect.arrayContaining(["motivate", "analyze", "suggest", "remind", "navigate"])
    );
    expect(resolveAssistantCapabilities("/community")[0]?.id).toBe(
      "community-bridge"
    );
  });

  it("describes one living project worker across core Smart Nutrition domains", () => {
    const manifestText = assistantCapabilities
      .map((capability) => `${capability.id}: ${capability.description}`)
      .join("\n")
      .toLowerCase();

    [
      "meals",
      "water",
      "reminders",
      "telegram",
      "family",
      "women health",
      "partner invites",
      "assistant memory",
      "canonical",
      "without creating a second ai brain",
    ].forEach((contractPhrase) => {
      expect(manifestText).toContain(contractPhrase);
    });

    expect(resolveAssistantCapabilities("/coach")[0]).toMatchObject({
      id: "coach-support",
      duties: expect.arrayContaining([
        "motivate",
        "analyze",
        "suggest",
        "explain",
        "remind",
        "navigate",
      ]),
    });
  });

  it("adapts manifest areas to the legacy runtime screen contract", () => {
    expect(getAssistantScreenFromPath("/dashboard")).toBe("dashboard");
    expect(getAssistantScreenFromPath("/meals")).toBe("food");
    expect(getAssistantScreenFromPath("/coach")).toBe("coach");
    expect(getAssistantScreenFromPath("/onboarding")).toBe("unknown");
  });
});
