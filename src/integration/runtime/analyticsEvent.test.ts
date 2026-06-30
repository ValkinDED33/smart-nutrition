import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: posthogMock,
}));

describe("runtime analytics event boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_POSTHOG_KEY", "test-posthog-key");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://analytics.example.test");
    vi.stubGlobal("window", {});
    posthogMock.capture.mockClear();
    posthogMock.init.mockClear();
  });

  it("initializes PostHog lazily when the first web event is tracked", async () => {
    const { trackRuntimeEvent } = await import("./analyticsEvent");

    trackRuntimeEvent("screen_viewed", {
      path: "/dashboard",
      authenticated: true,
    });

    await vi.waitFor(() => {
      expect(posthogMock.init).toHaveBeenCalledTimes(1);
      expect(posthogMock.capture).toHaveBeenCalledWith("screen_viewed", {
        path: "/dashboard",
        authenticated: true,
      });
    });
  });

  it("reuses one in-flight PostHog initialization", async () => {
    const { initializePostHog } = await import("./analytics");

    const [firstClient, secondClient] = await Promise.all([
      initializePostHog(),
      initializePostHog(),
    ]);

    expect(firstClient).toBe(posthogMock);
    expect(secondClient).toBe(posthogMock);
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });

  it("does not load analytics when there is no browser window", async () => {
    vi.unstubAllGlobals();
    const { trackRuntimeEvent } = await import("./analyticsEvent");

    trackRuntimeEvent("screen_viewed", {
      path: "/server-render",
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });
});
