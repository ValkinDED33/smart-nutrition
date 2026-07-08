import { describe, expect, it, vi } from "vitest";
import {
  installGlobalClientErrorReporting,
  reportClientRuntimeError,
  renderBootstrapFailureFallback,
  shouldReportClientRuntimeError,
} from "./clientErrorReporting";
import {
  buildErrorRecoveryDiagnostic,
  STALE_BUILD_RECOVERY_KEY,
} from "@shared/lib/errorRecovery";

const TEST_NOW_ISO = "2026-06-23T10:00:00.000Z";
const WINDOW_ERROR_SOURCE = "window-error";

describe("clientErrorReporting", () => {
  it("deduplicates the same runtime error for a short window", () => {
    const diagnostic = buildErrorRecoveryDiagnostic(
      new Error("Mobile crash"),
      "/progress",
      new Date(TEST_NOW_ISO),
      "mobile"
    );
    const now = 1_780_000_000_000;

    expect(
      shouldReportClientRuntimeError(diagnostic, WINDOW_ERROR_SOURCE, now)
    ).toBe(true);
    expect(
      shouldReportClientRuntimeError(diagnostic, WINDOW_ERROR_SOURCE, now + 1_000)
    ).toBe(false);
    expect(
      shouldReportClientRuntimeError(diagnostic, WINDOW_ERROR_SOURCE, now + 11_000)
    ).toBe(true);
  });

  it("builds and reports runtime diagnostics without throwing", async () => {
    const reporter = vi.fn(async () => undefined);
    const diagnostic = reportClientRuntimeError(new Error("Async crash"), {
      source: "unhandled-rejection",
      route: "/meals",
      userAgent: "test-agent",
      now: new Date(TEST_NOW_ISO),
      reporter,
    });

    await Promise.resolve();

    expect(diagnostic.route).toBe("/meals");
    expect(diagnostic.errorName).toBe("Error");
    expect(diagnostic.message).toBe("Async crash");
    expect(reporter).toHaveBeenCalledWith(
      diagnostic,
      null,
      { source: "unhandled-rejection" }
    );
  });

  it("renders a bootstrap failure fallback with diagnostic id", () => {
    const container = { innerHTML: "" } as HTMLElement;
    const diagnostic = buildErrorRecoveryDiagnostic(
      new Error("Bootstrap failed"),
      "/",
      new Date(TEST_NOW_ISO)
    );

    renderBootstrapFailureFallback(container, diagnostic);

    expect(container.innerHTML).toContain("Smart Nutrition");
    expect(container.innerHTML).toContain(diagnostic.id);
    expect(container.innerHTML).toContain("Перезавантажити");
  });

  it("recovers automatically from Vite preload errors without a white screen", async () => {
    const listeners = new Map<string, EventListener>();
    const storage = new Map<string, string>();
    const replace = vi.fn();
    const preventDefault = vi.fn();

    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      caches: {
        keys: vi.fn(async () => []),
      },
      location: {
        href: "https://smart-nutrition.club/meals",
        pathname: "/meals",
        search: "",
        replace,
      },
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        key: (index: number) => {
          let currentIndex = 0;

          for (const key of storage.keys()) {
            if (currentIndex === index) {
              return key;
            }

            currentIndex += 1;
          }

          return null;
        },
        get length() {
          return storage.size;
        },
      },
    });
    vi.stubGlobal("indexedDB", undefined);
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistrations: vi.fn(async () => []),
      },
      userAgent: "test-agent",
    });

    expect(installGlobalClientErrorReporting()).toBe(true);

    listeners.get("vite:preloadError")?.({
      payload: new Error("Failed to fetch dynamically imported module"),
      preventDefault,
    } as unknown as Event);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(storage.get(STALE_BUILD_RECOVERY_KEY)).toBeTruthy();
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("sn_recovery=")
    );

    vi.unstubAllGlobals();
  });
});
