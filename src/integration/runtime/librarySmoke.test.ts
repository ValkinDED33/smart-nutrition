import { describe, expect, it } from "vitest";
import { buttonSurface, cn } from "../../shared/ui";
import { createElevenLabsClient, estimateAssistantPromptTokens, getNutritionVadOptions } from "./ai";
import { readPostHogConfig } from "./analytics";
import { sanitizeHtml } from "./content";
import { readFirebaseConfig } from "./firebase";
import { reorderItems, swapItems } from "./interaction";
import { getRuntimePlatform } from "./native";
import { createNutritionMatterWorld, preloadParticlesEngine } from "./visualEngine";
import {
  AnimatedSurface,
  NutritionParticles,
  NutritionThreePreview,
} from "./visuals";

describe("runtime library integrations", () => {
  it("merges class utilities through cva, clsx, and tailwind-merge", () => {
    const isHidden = false;

    expect(cn("px-2 text-sm", isHidden && "hidden", "px-4")).toBe("text-sm px-4");
    expect(buttonSurface({ intent: "subtle", size: "sm" })).toContain("bg-slate-100");
  });

  it("sanitizes unsafe html without requiring a DOM in tests", () => {
    const clean = sanitizeHtml('<strong>ok</strong><script>alert("x")</script>');

    expect(clean).toContain("<strong>ok</strong>");
    expect(clean).not.toContain("<script>");
  });

  it("checks optional platform SDK configuration without network calls", () => {
    expect(readFirebaseConfig()).toBeNull();
    expect(readPostHogConfig()).toBeNull();
    expect(typeof getRuntimePlatform()).toBe("string");
  });

  it("creates AI helpers from ElevenLabs, VAD, and LangChain", () => {
    expect(createElevenLabsClient()).toBeNull();
    expect(createElevenLabsClient("test-api-key")).toBeTruthy();
    expect(getNutritionVadOptions()).toMatchObject({
      minSpeechMs: 220,
      positiveSpeechThreshold: 0.72,
    });
    expect(estimateAssistantPromptTokens("Build a high-protein breakfast plan.")).toBeGreaterThan(0);
  });

  it("moves sortable items through dnd-kit helpers", () => {
    expect(reorderItems(["breakfast", "lunch", "dinner"], 0, 2)).toEqual([
      "lunch",
      "dinner",
      "breakfast",
    ]);
    expect(swapItems(["water", "meal", "weight"], 0, 2)).toEqual([
      "weight",
      "meal",
      "water",
    ]);
  });

  it("builds visual adapters for motion, particles, three, drei, fiber, and matter", async () => {
    const world = createNutritionMatterWorld();

    expect(world.bodyCount).toBe(3);
    expect(world.samplePosition.y).toBeGreaterThan(-48);
    expect(typeof AnimatedSurface).toBe("function");
    expect(typeof NutritionParticles).toBe("function");
    expect(typeof NutritionThreePreview).toBe("function");
    await expect(preloadParticlesEngine()).resolves.toBeUndefined();
  });

  it("loads workbox-window for the PWA registration path", async () => {
    const { Workbox } = await import("workbox-window");

    expect(typeof Workbox).toBe("function");
  });
});
