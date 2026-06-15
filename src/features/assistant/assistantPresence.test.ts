import { describe, expect, it } from "vitest";
import { resolveAssistantContext } from "./assistantContext";
import {
  resolveAssistantPresence,
  resolveAssistantRouteKind,
} from "./assistantPresence";

describe("assistantPresence", () => {
  it("uses compact companion mode on public routes", () => {
    const context = resolveAssistantContext("/login");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/login",
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: true,
      mode: "compact",
      reason: "public-route",
      allowSpeechBubble: false,
      priority: "low",
    });
  });

  it("hides on mobile public routes while an input is focused", () => {
    const context = resolveAssistantContext("/register");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/register",
        viewport: "mobile",
        inputFocused: true,
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: "mobile-public-input-focused",
      allowSpeechBubble: false,
    });
  });

  it("uses compact mode on mobile authenticated routes", () => {
    const context = resolveAssistantContext("/dashboard");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/dashboard",
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

  it("hides the global assistant on dense mobile product surfaces", () => {
    ["/meals", "/coach", "/progress", "/profile", "/community", "/recipes", "/water"].forEach(
      (pathname) => {
        expect(
          resolveAssistantPresence(resolveAssistantContext(pathname), {
            pathname,
            viewport: "mobile",
          })
        ).toMatchObject({
          visible: false,
          mode: "hidden",
          reason: "mobile-dense-surface",
          allowSpeechBubble: false,
        });
      }
    );
  });

  it("uses bubble mode on desktop authenticated routes", () => {
    const context = resolveAssistantContext("/dashboard");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/dashboard",
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
    const context = resolveAssistantContext("/profile");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/profile",
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
    const context = resolveAssistantContext("/dashboard");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/dashboard",
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
    const context = resolveAssistantContext("/profile");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/profile",
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
    const context = resolveAssistantContext("/community");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/community",
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
        pathname: "/meals",
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
        pathname: "/progress",
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
    const context = resolveAssistantContext("/onboarding");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/onboarding",
        viewport: "desktop",
      })
    ).toMatchObject({
      visible: false,
      mode: "hidden",
      reason: "onboarding-guide-handles-assistant",
    });
  });

  it("disables motion when reduced motion is preferred", () => {
    const context = resolveAssistantContext("/dashboard");

    expect(
      resolveAssistantPresence(context, {
        pathname: "/dashboard",
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
    expect(resolveAssistantRouteKind("/register")).toBe("public");
    expect(resolveAssistantRouteKind("/onboarding/profile")).toBe("onboarding");
    expect(resolveAssistantRouteKind("/meals")).toBe("auth");
  });
});
