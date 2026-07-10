import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  resolveGlobalAssistantAvatarRenderMode,
  resolveGlobalAssistantDisplayAction,
  resolveGlobalAssistantLayerModel,
  shouldHideAssistantLayer,
} from "./globalAssistantLayerModel";

const COMMUNITY_ROUTE = "/community";
const PROFILE_ROUTE = "/profile";
const COACH_ROUTE = "/coach";
const MEALS_ROUTE = "/meals";

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
  it("does not import the 3D assistant runtime from the global shell", async () => {
    const source = await readFile(
      new URL("./GlobalAssistantLayer.tsx", import.meta.url),
      "utf8"
    );

    expect(source).not.toContain("@features/assistant-3d");
    expect(source).not.toContain("renderMode=");
  });

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
    const model = resolveModel(MEALS_ROUTE);

    expect(model.area).toBe("meals");
    expect(model.primaryCapability?.id).toBe("meal-helper");
    expect(model.duties).toEqual(
      expect.arrayContaining(["suggest", "analyze", "warn"])
    );
    expect(model.defaultAction).toEqual({
      label: "Add or review food",
      route: MEALS_ROUTE,
    });
  });

  it("uses area-specific action routes instead of always routing to coach", () => {
    expect(resolveModel(COMMUNITY_ROUTE).defaultAction?.route).toBe(COMMUNITY_ROUTE);
    expect(resolveModel(PROFILE_ROUTE).defaultAction?.route).toBe(PROFILE_ROUTE);
    expect(resolveModel(COACH_ROUTE).defaultAction?.route).toBe(COACH_ROUTE);
  });

  it("uses coach fallback when the manifest action points to the current page", () => {
    const action = resolveGlobalAssistantDisplayAction(COMMUNITY_ROUTE, {
      label: "Open community",
      route: COMMUNITY_ROUTE,
    });

    expect(action).toEqual({
      label: "Open community",
      route: COACH_ROUTE,
      usesCoachFallback: true,
    });
  });

  it("keeps community compact so it does not cover content cards", () => {
    const model = resolveModel(COMMUNITY_ROUTE);

    expect(model.presence.mode).toBe("compact");
    expect(model.presence.allowSpeechBubble).toBe(false);
    expect(model.displayAction?.route).toBe(COACH_ROUTE);
    expect(model.avatarRenderMode).toBe("2d");
  });

  it("keeps every global assistant surface on the 2D avatar contract", () => {
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "mobile",
        presenceMode: "compact",
      })
    ).toBe("2d");
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "tablet",
        presenceMode: "compact",
      })
    ).toBe("2d");
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "desktop",
        presenceMode: "compact",
      })
    ).toBe("2d");
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "desktop",
        presenceMode: "bubble",
      })
    ).toBe("2d");
  });

  it("keeps global assistant avatars lightweight while the user is editing inputs", () => {
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "mobile",
        presenceMode: "compact",
        inputFocused: true,
      })
    ).toBe("2d");
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "desktop",
        presenceMode: "bubble",
        inputFocused: true,
      })
    ).toBe("2d");
    expect(
      resolveGlobalAssistantAvatarRenderMode({
        viewport: "tablet",
        presenceMode: "bubble",
      })
    ).toBe("2d");
  });
});
