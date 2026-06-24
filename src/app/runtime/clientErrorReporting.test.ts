import { describe, expect, it, vi } from "vitest";
import {
  reportClientRuntimeError,
  renderBootstrapFailureFallback,
  shouldReportClientRuntimeError,
} from "./clientErrorReporting";
import { buildErrorRecoveryDiagnostic } from "@shared/lib/errorRecovery";

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
});
