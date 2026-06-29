import { describe, expect, it } from "vitest";
import {
  buildClientErrorReportPayload,
  buildErrorRecoveryDiagnostic,
  buildRecoveryReloadUrl,
  clearVolatileSmartNutritionStorage,
  hasRecoveryReloadMarker,
  isLikelyStaleBuildError,
  isRecoveryRecentlyAttempted,
  sanitizeDiagnosticText,
  shouldAttemptStaleBuildRecovery,
  shouldPreserveSmartNutritionStorageKey,
  shouldRecoverOnManualRetry,
} from "./errorRecovery";

class FakeStorage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("errorRecovery", () => {
  it("detects stale build and dynamic import failures", () => {
    expect(
      isLikelyStaleBuildError(new Error("Failed to fetch dynamically imported module"))
    ).toBe(true);
    expect(isLikelyStaleBuildError(new Error("Validation failed"))).toBe(false);
  });

  it("guards repeated automatic recovery attempts by TTL", () => {
    const now = 1_772_000_000_000;

    expect(isRecoveryRecentlyAttempted(String(now - 1_000), now)).toBe(true);
    expect(isRecoveryRecentlyAttempted(String(now - 20_000), now)).toBe(false);
    expect(isRecoveryRecentlyAttempted("not-a-number", now)).toBe(true);
    expect(isRecoveryRecentlyAttempted(null, now)).toBe(false);
  });

  it("attempts stale build recovery only for likely stale chunks and only once per TTL", () => {
    const now = 1_772_000_000_000;
    const staleChunkError = new Error("Failed to fetch dynamically imported module");

    expect(shouldAttemptStaleBuildRecovery(staleChunkError, null, now)).toBe(true);
    expect(
      shouldAttemptStaleBuildRecovery(staleChunkError, String(now - 1_000), now)
    ).toBe(false);
    expect(
      shouldAttemptStaleBuildRecovery(staleChunkError, String(now - 20_000), now)
    ).toBe(true);
    expect(
      shouldAttemptStaleBuildRecovery(
        staleChunkError,
        null,
        now,
        "https://smart-nutrition.club/meals?sn_recovery=12345"
      )
    ).toBe(false);
    expect(shouldAttemptStaleBuildRecovery(new Error("Validation failed"), null, now)).toBe(
      false
    );
  });

  it("detects cache-busted recovery URLs", () => {
    expect(
      hasRecoveryReloadMarker("https://smart-nutrition.club/home?sn_recovery=123")
    ).toBe(true);
    expect(hasRecoveryReloadMarker("https://smart-nutrition.club/home")).toBe(false);
    expect(hasRecoveryReloadMarker("not a url")).toBe(false);
  });

  it("uses cache recovery for manual retry only when the diagnostic points to a stale build", () => {
    expect(shouldRecoverOnManualRetry(null)).toBe(false);
    expect(shouldRecoverOnManualRetry({ staleBuildLikely: false })).toBe(false);
    expect(shouldRecoverOnManualRetry({ staleBuildLikely: true })).toBe(true);
  });

  it("preserves durable app keys and removes volatile smart-nutrition storage", () => {
    const storage = new FakeStorage();
    storage.setItem("smart-nutrition.language", "uk");
    storage.setItem("smart-nutrition.color-mode", "dark");
    storage.setItem("smart-nutrition.auth-session-hint", "{}");
    storage.setItem("smart-nutrition.error-boundary-diagnostic", "{}");
    storage.setItem("smart-nutrition.remote-snapshot-cache", "{}");
    storage.setItem("other-app-key", "safe");

    expect(shouldPreserveSmartNutritionStorageKey("smart-nutrition.language")).toBe(
      true
    );
    expect(
      shouldPreserveSmartNutritionStorageKey("smart-nutrition.remote-snapshot-cache")
    ).toBe(false);

    expect(clearVolatileSmartNutritionStorage(storage)).toEqual([
      "smart-nutrition.remote-snapshot-cache",
    ]);
    expect(storage.getItem("smart-nutrition.language")).toBe("uk");
    expect(storage.getItem("smart-nutrition.color-mode")).toBe("dark");
    expect(storage.getItem("smart-nutrition.auth-session-hint")).toBe("{}");
    expect(storage.getItem("smart-nutrition.error-boundary-diagnostic")).toBe("{}");
    expect(storage.getItem("other-app-key")).toBe("safe");
    expect(storage.getItem("smart-nutrition.remote-snapshot-cache")).toBeNull();
  });

  it("redacts sensitive diagnostic text and keeps diagnostic output compact", () => {
    const error = new Error(
      "Reset failed at /reset-password?token=secret-token-value&email=user@example.com"
    );
    const diagnostic = buildErrorRecoveryDiagnostic(
      error,
      "/verify-email?token=super-secret-token",
      new Date("2026-06-18T10:00:00.000Z"),
      "Mozilla/5.0 ".repeat(20)
    );

    expect(sanitizeDiagnosticText("x?token=abc&key=def")).toBe(
      "x?token=[redacted]&key=[redacted]"
    );
    expect(diagnostic.message).toContain("token=[redacted]");
    expect(diagnostic.message).toContain("email=[redacted]");
    expect(diagnostic.route).toBe("/verify-email?token=[redacted]");
    expect(diagnostic.userAgent?.length).toBeLessThanOrEqual(120);
    expect(diagnostic.id).toMatch(/^sn-/);
  });

  it("builds a compact client error report payload", () => {
    const diagnostic = buildErrorRecoveryDiagnostic(
      new Error("Broken route /reset-password?token=secret"),
      "/verify-email?token=another-secret",
      new Date("2026-06-18T10:00:00.000Z"),
      "Mozilla/5.0"
    );
    const payload = buildClientErrorReportPayload(
      diagnostic,
      [
        "at ResetPasswordPage (/reset-password?token=secret)",
        "at App",
        "at Root",
      ].join("\n"),
      "react-error-boundary",
      {
        viewport: { width: 393, height: 851, devicePixelRatio: 2.75 },
        online: false,
        language: "uk-UA",
      }
    );

    expect(payload.source).toBe("react-error-boundary");
    expect(payload.route).toBe("/verify-email?token=[redacted]");
    expect(payload.componentStackLines).toEqual([
      "at ResetPasswordPage (/reset-password?token=[redacted])",
      "at App",
      "at Root",
    ]);
    expect(payload.runtimeContext).toEqual({
      viewport: { width: 393, height: 851, devicePixelRatio: 2.75 },
      online: false,
      language: "uk-UA",
    });
  });

  it("builds a cache-busting recovery URL while preserving existing params", () => {
    expect(
      buildRecoveryReloadUrl(
        "https://smart-nutrition.club/reset-password?token=secret#top",
        12345
      )
    ).toBe("https://smart-nutrition.club/reset-password?token=secret&sn_recovery=12345#top");
    expect(buildRecoveryReloadUrl("not a url", 12345)).toBe("/");
  });
});
