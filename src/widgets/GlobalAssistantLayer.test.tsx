import { describe, expect, it } from "vitest";
import {
  resolveGlobalAssistantLayerModel,
  shouldHideAssistantLayer,
} from "./globalAssistantLayerModel";

describe("GlobalAssistantLayer", () => {
  it("hides on public and onboarding routes", () => {
    ["/login", "/register", "/reset-password", "/verify-email", "/onboarding"].forEach(
      (pathname) => {
        expect(shouldHideAssistantLayer(pathname)).toBe(true);
        expect(
          resolveGlobalAssistantLayerModel(pathname).isVisibleOnAuthenticatedRoute
        ).toBe(false);
      }
    );
  });

  it("is visible on authenticated product routes", () => {
    expect(
      resolveGlobalAssistantLayerModel("/dashboard").isVisibleOnAuthenticatedRoute
    ).toBe(true);
    expect(
      resolveGlobalAssistantLayerModel("/progress").isVisibleOnAuthenticatedRoute
    ).toBe(true);
  });

  it("resolves meals area and action from the assistant manifest", () => {
    const model = resolveGlobalAssistantLayerModel("/meals");

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
    expect(resolveGlobalAssistantLayerModel("/community").defaultAction?.route).toBe(
      "/community"
    );
    expect(resolveGlobalAssistantLayerModel("/profile").defaultAction?.route).toBe(
      "/profile"
    );
    expect(resolveGlobalAssistantLayerModel("/coach").defaultAction?.route).toBe(
      "/coach"
    );
  });
});
