import { describe, expect, it } from "vitest";
import { resolveAssistantContext } from "./assistantContext";
import {
  resolveAssistantPresence,
  resolveAssistantRouteKind,
} from "./assistantPresence";

const ROUTE_LOGIN = "/login";
const ROUTE_REGISTER = "/register";
const ROUTE_DASHBOARD = "/dashboard";
const ROUTE_MEALS = "/meals";
const ROUTE_PROFILE = "/profile";
const ROUTE_PROGRESS = "/progress";
const ROUTE_COMMUNITY = "/community";
const ROUTE_ONBOARDING = "/onboarding";
const ROUTE_ONBOARDING_PROFILE = "/onboarding/profile";
const PUBLIC_AUTH_HIDDEN_REASON = "public-auth-surface-guides-itself";

const DENSE_PRODUCT_ROUTES = [
  ROUTE_MEALS,
  "/coach",
  ROUTE_PROGRESS,
  ROUTE_PROFILE,
  ROUTE_COMMUNITY,
  "/recipes",
  "/water",
] as const;

describe("assistantPresence", () => {
  it("hides on desktop public auth routes because auth surfaces guide themselves", () => {
    const context = resolveAssistantContext(ROUTE_LOGIN);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_LOGIN,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: PUBLIC_AUTH_HIDDEN_REASON,
      allowSpeechBubble: false,
      priority: "low",
    });
  });

  it("hides on mobile public auth routes because auth surfaces guide themselves", () => {
    const context = resolveAssistantContext(ROUTE_LOGIN);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_LOGIN,
        viewport: "mobile",
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: PUBLIC_AUTH_HIDDEN_REASON,
      allowSpeechBubble: false,
      priority: "low",
    });
  });

  it("keeps public auth routes hidden while an input is focused", () => {
    const context = resolveAssistantContext(ROUTE_REGISTER);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_REGISTER,
        viewport: "mobile",
        inputFocused: true,
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: PUBLIC_AUTH_HIDDEN_REASON,
      allowSpeechBubble: false,
    });
  });

  it("uses compact mode on mobile authenticated routes", () => {
    const context = resolveAssistantContext(ROUTE_DASHBOARD);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_DASHBOARD,
        viewport: "mobile",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "mobile-viewport",
      allowSpeechBubble: false,
      priority: "normal",
    });
  });

  it("hides the global companion on dense mobile product surfaces", () => {
    DENSE_PRODUCT_ROUTES.forEach((pathname) => {
      expect(
        resolveAssistantPresence(resolveAssistantContext(pathname), {
          pathname,
          viewport: "mobile",
        })
      ).toMatchObject({
        visible: false,
        mode: "hidden",
        reason: "mobile-dense-surface-hidden",
        allowSpeechBubble: false,
        priority: "low",
      });
    });
  });

  it("keeps a compact low-priority companion on dense tablet product surfaces", () => {
    DENSE_PRODUCT_ROUTES.forEach((pathname) => {
      expect(
        resolveAssistantPresence(resolveAssistantContext(pathname), {
          pathname,
          viewport: "tablet",
        })
      ).toMatchObject({
        visible: true,
        mode: "compact",
        reason: "compact-dense-surface",
        allowSpeechBubble: false,
        priority: "low",
      });
    });
  });

  it("uses bubble mode on desktop authenticated routes", () => {
    const context = resolveAssistantContext(ROUTE_DASHBOARD);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_DASHBOARD,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "bubble",
      reason: "desktop-authenticated-route",
      allowSpeechBubble: true,
      priority: "normal",
    });
  });

  it("switches to compact mode when an input is focused", () => {
    const context = resolveAssistantContext(ROUTE_PROFILE);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_PROFILE,
        viewport: "desktop",
        inputFocused: true,
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "input-focused",
      allowSpeechBubble: false,
      priority: "low",
    });
  });

  it("hides on mobile when an input is focused", () => {
    const context = resolveAssistantContext(ROUTE_DASHBOARD);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_DASHBOARD,
        viewport: "mobile",
        inputFocused: true,
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: "mobile-input-focused",
      allowSpeechBubble: false,
      priority: "low",
    });
  });

  it("uses compact mode on profile desktop surfaces to avoid covering forms and shop cards", () => {
    const context = resolveAssistantContext(ROUTE_PROFILE);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_PROFILE,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "profile-interactive-surface",
      allowSpeechBubble: false,
    });
  });

  it("uses compact mode on community desktop surfaces to avoid covering content cards", () => {
    const context = resolveAssistantContext(ROUTE_COMMUNITY);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_COMMUNITY,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "community-content-surface",
      allowSpeechBubble: false,
    });
  });

  it("uses compact mode on dense food and progress surfaces", () => {
    expect(
      resolveAssistantPresence(resolveAssistantContext("/meals"), {
        pathname: ROUTE_MEALS,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "meals-dense-input-surface",
      allowSpeechBubble: false,
    });

    expect(
      resolveAssistantPresence(resolveAssistantContext("/progress"), {
        pathname: ROUTE_PROGRESS,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "progress-chart-surface",
      allowSpeechBubble: false,
    });
  });

  it("excludes onboarding because the onboarding guide owns that experience", () => {
    const context = resolveAssistantContext(ROUTE_ONBOARDING);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_ONBOARDING,
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: "onboarding-guide-handles-assistant",
    });
  });

  it("disables motion when reduced motion is preferred", () => {
    const context = resolveAssistantContext(ROUTE_DASHBOARD);

    expect(
      resolveAssistantPresence(context, {
        pathname: ROUTE_DASHBOARD,
        viewport: "desktop",
        prefersReducedMotion: true,
      })
    ).toMatchObject({
      visible: true,
      mode: "bubble",
      allowMotion: false,
    });
  });

  it("classifies route kinds for the presence engine", () => {
    expect(resolveAssistantRouteKind(ROUTE_REGISTER)).toBe("public");
    expect(resolveAssistantRouteKind(ROUTE_ONBOARDING_PROFILE)).toBe("onboarding");
    expect(resolveAssistantRouteKind(ROUTE_MEALS)).toBe("auth");
  });
});
