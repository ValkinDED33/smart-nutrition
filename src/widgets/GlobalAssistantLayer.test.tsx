import { describe, expect, it } from "vitest";
import {
  resolveGlobalAssistantDisplayAction,
  resolveGlobalAssistantLayerModel,
  shouldHideAssistantLayer,
} from "./globalAssistantLayerModel";

const resolveModel = (pathname: string) =>
  resolveGlobalAssistantLayerModel(pathname, {
    viewport: "desktop",
    inputFocused: false,
    prefersReducedMotion: false,
  });

const resolveMobileModel = (pathname: string) =>
  resolveGlobalAssistantLayerModel(pathname, {
    viewport: "mobile",
    inputFocused: false,
    prefersReducedMotion: false,
  });

describe("GlobalAssistantLayer", () => {
  it("uses guided public companion mode on auth routes and hides on onboarding", () => {
    ["/login", "/register", "/reset-password", "/verify-email"].forEach(
      (pathname) => {
        expect(shouldHideAssistantLayer(pathname)).toBe(false);
        expect(resolveModel(pathname)).toMatchObject({
          area: "auth",
          presence: expect.objectContaining({
            visible: true,
            mode: "bubble",
            reason: "desktop-public-route",
            allowSpeechBubble: true,
          }),
          isVisibleOnAuthenticatedRoute: true,
        });
        expect(resolveMobileModel(pathname)).toMatchObject({
          area: "auth",
          presence: expect.objectContaining({
            visible: true,
            mode: "compact",
            reason: "public-route",
            allowSpeechBubble: false,
          }),
        });
      }
    );

    expect(shouldHideAssistantLayer("/onboarding")).toBe(true);
    expect(resolveModel("/onboarding").isVisibleOnAuthenticatedRoute).toBe(false);
  });

  it("is visible on authenticated product routes", () => {
    expect(resolveModel("/dashboard").isVisibleOnAuthenticatedRoute).toBe(true);
    expect(resolveModel("/progress").isVisibleOnAuthenticatedRoute).toBe(true);
  });

  it("resolves meals area and action from the assistant manifest", () => {
    const model = resolveModel("/meals");

    expect(model.area).toBe("meals");
    expect(model.primaryCapability?.id).toBe("meal-helper");
    expect(model.duties).toEqual(
      expect.arrayContaining(["suggest", "analyze", "warn"])
    );
    expect(model.defaultAction).toEqual({
      label: "Add or review food",
      route: "/meals",
    });
  });

  it("uses area-specific action routes instead of always routing to coach", () => {
    expect(resolveModel("/community").defaultAction?.route).toBe("/community");
    expect(resolveModel("/profile").defaultAction?.route).toBe("/profile");
    expect(resolveModel("/coach").defaultAction?.route).toBe("/coach");
  });

  it("uses coach fallback when the manifest action points to the current page", () => {
    const action = resolveGlobalAssistantDisplayAction("/community", {
      label: "Open community",
      route: "/community",
    });

    expect(action).toEqual({
      label: "Open community",
      route: "/coach",
      usesCoachFallback: true,
    });
  });

  it("keeps community compact so it does not cover content cards", () => {
    const model = resolveModel("/community");

    expect(model.presence.mode).toBe("compact");
    expect(model.presence.allowSpeechBubble).toBe(false);
    expect(model.displayAction?.route).toBe("/coach");
  });
});
