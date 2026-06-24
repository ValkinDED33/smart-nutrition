import { reportClientErrorDiagnostic } from "@shared/api/clientErrors";
import {
  buildErrorRecoveryDiagnostic,
  type ClientErrorReportSource,
  type ErrorRecoveryDiagnostic,
} from "@shared/lib/errorRecovery";

const DUPLICATE_REPORT_WINDOW_MS = 10_000;
const reportedFingerprints = new Map<string, number>();

let globalClientErrorReportingInstalled = false;

const toErrorLike = (value: unknown, fallbackMessage: string) => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return new Error(value.trim());
  }

  return new Error(fallbackMessage);
};

const getCurrentRoute = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
};

const getCurrentUserAgent = () =>
  typeof navigator === "undefined" ? undefined : navigator.userAgent;

export const shouldReportClientRuntimeError = (
  diagnostic: ErrorRecoveryDiagnostic,
  source: ClientErrorReportSource,
  nowMs = Date.now()
) => {
  const fingerprint = [
    source,
    diagnostic.errorName,
    diagnostic.message,
    diagnostic.route,
  ].join("|");
  const lastReportedAt = reportedFingerprints.get(fingerprint);

  if (
    typeof lastReportedAt === "number" &&
    nowMs - lastReportedAt < DUPLICATE_REPORT_WINDOW_MS
  ) {
    return false;
  }

  reportedFingerprints.set(fingerprint, nowMs);
  return true;
};

export const reportClientRuntimeError = (
  error: unknown,
  {
    source,
    route = getCurrentRoute(),
    userAgent = getCurrentUserAgent(),
    now = new Date(),
    reporter = reportClientErrorDiagnostic,
  }: {
    source: ClientErrorReportSource;
    route?: string;
    userAgent?: string;
    now?: Date;
    reporter?: typeof reportClientErrorDiagnostic;
  }
) => {
  const diagnostic = buildErrorRecoveryDiagnostic(error, route, now, userAgent);

  if (!shouldReportClientRuntimeError(diagnostic, source, now.getTime())) {
    return diagnostic;
  }

  void (async () => {
    try {
      await reporter(diagnostic, null, { source });
    } catch {
      // Reporting must never create a second app failure.
    }
  })();

  return diagnostic;
};

export const installGlobalClientErrorReporting = () => {
  if (typeof window === "undefined" || globalClientErrorReportingInstalled) {
    return false;
  }

  globalClientErrorReportingInstalled = true;

  window.addEventListener("error", (event) => {
    reportClientRuntimeError(
      event.error ?? event.message,
      { source: "window-error" }
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientRuntimeError(
      toErrorLike(event.reason, "Unhandled promise rejection"),
      { source: "unhandled-rejection" }
    );
  });

  return true;
};

export const renderBootstrapFailureFallback = (
  container: HTMLElement,
  diagnostic: ErrorRecoveryDiagnostic
) => {
  container.innerHTML = [
    '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,sans-serif;">',
    '<section style="max-width:520px;width:100%;border:1px solid #d8e3ea;border-radius:24px;background:white;padding:28px;box-shadow:0 20px 50px rgba(15,23,42,.08);">',
    '<h1 style="margin:0 0 10px;font-size:28px;line-height:1.15;">Smart Nutrition не зміг стартувати</h1>',
    '<p style="margin:0 0 18px;color:#64748b;line-height:1.55;">Ми вже записали діагностику. Спробуйте перезавантажити застосунок.</p>',
    `<p style="margin:0 0 18px;color:#475569;font-size:13px;">Код діагностики: ${diagnostic.id}</p>`,
    '<button type="button" onclick="window.location.reload()" style="width:100%;min-height:48px;border:0;border-radius:999px;background:#0f766e;color:white;font-weight:800;font-size:16px;">Перезавантажити</button>',
    "</section>",
    "</main>",
  ].join("");
};
