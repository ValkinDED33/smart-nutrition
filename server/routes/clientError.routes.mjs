import { readJsonBody, sendJson } from "../lib/http.mjs";

const CLIENT_ERROR_BODY_LIMIT_BYTES = 16_384;
const TEXT_LIMIT = 220;
const STACK_LINE_LIMIT = 220;
const STACK_MAX_LINES = 8;

const sensitiveTextPattern =
  /([?&](?:access_)?token|[?&]code|[?&]key|[?&]password|[?&]email)=([^&#\s)\]}>"']+)/gi;

const toSafeString = (value, limit = TEXT_LIMIT) => {
  const text = String(value ?? "")
    .replace(sensitiveTextPattern, "$1=[redacted]")
    .trim();

  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
};

const toSafeBoolean = (value) => value === true;

const toSafeNumber = (value, min, max) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  return Math.max(min, Math.min(max, numberValue));
};

const sanitizeMetricGroup = (value, allowedFields) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const result = {};

  allowedFields.forEach(([field, min, max]) => {
    const nextValue = toSafeNumber(value[field], min, max);

    if (nextValue !== undefined) {
      result[field] = nextValue;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

export const sanitizeClientErrorRuntimeContext = (value = {}) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const context = {
    viewport: sanitizeMetricGroup(value.viewport, [
      ["width", 0, 10_000],
      ["height", 0, 10_000],
      ["devicePixelRatio", 0, 10],
    ]),
    screen: sanitizeMetricGroup(value.screen, [
      ["width", 0, 20_000],
      ["height", 0, 20_000],
    ]),
    online: typeof value.online === "boolean" ? value.online : undefined,
    language: value.language ? toSafeString(value.language, 40) : undefined,
    timezone: value.timezone ? toSafeString(value.timezone, 80) : undefined,
    visibilityState: value.visibilityState
      ? toSafeString(value.visibilityState, 40)
      : undefined,
    colorScheme: ["dark", "light", "unknown"].includes(value.colorScheme)
      ? value.colorScheme
      : undefined,
    reducedMotion:
      typeof value.reducedMotion === "boolean" ? value.reducedMotion : undefined,
    standalone: typeof value.standalone === "boolean" ? value.standalone : undefined,
    serviceWorkerControlled:
      typeof value.serviceWorkerControlled === "boolean"
        ? value.serviceWorkerControlled
        : undefined,
    connection:
      value.connection && typeof value.connection === "object"
        ? {
            effectiveType: value.connection.effectiveType
              ? toSafeString(value.connection.effectiveType, 40)
              : undefined,
            saveData:
              typeof value.connection.saveData === "boolean"
                ? value.connection.saveData
                : undefined,
            downlinkMbps: toSafeNumber(value.connection.downlinkMbps, 0, 10_000),
            rttMs: toSafeNumber(value.connection.rttMs, 0, 120_000),
          }
        : undefined,
    build:
      value.build && typeof value.build === "object"
        ? {
            mode: value.build.mode ? toSafeString(value.build.mode, 40) : undefined,
            baseUrl: value.build.baseUrl ? toSafeString(value.build.baseUrl, 80) : undefined,
            production:
              typeof value.build.production === "boolean"
                ? value.build.production
                : undefined,
          }
        : undefined,
  };

  if (context.connection) {
    context.connection = Object.fromEntries(
      Object.entries(context.connection).filter(([, entry]) => entry !== undefined)
    );
  }

  if (context.build) {
    context.build = Object.fromEntries(
      Object.entries(context.build).filter(([, entry]) => entry !== undefined)
    );
  }

  const sanitized = Object.fromEntries(
    Object.entries(context).filter(([, entry]) => {
      if (entry === undefined) {
        return false;
      }

      return !(typeof entry === "object" && Object.keys(entry).length === 0);
    })
  );

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

export const sanitizeClientErrorReport = (body = {}) => {
  const componentStackLines = Array.isArray(body.componentStackLines)
    ? body.componentStackLines
    : String(body.componentStack ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

  return {
    source: toSafeString(body.source || "unknown", 80),
    id: toSafeString(body.id || "unknown", 80),
    createdAt: toSafeString(body.createdAt, 80),
    errorName: toSafeString(body.errorName || "Error", 120),
    message: toSafeString(body.message || "Client error reported."),
    route: toSafeString(body.route || "/", 180),
    staleBuildLikely: toSafeBoolean(body.staleBuildLikely),
    userAgent: body.userAgent ? toSafeString(body.userAgent, 180) : undefined,
    componentStackLines: componentStackLines
      .map((line) => toSafeString(line, STACK_LINE_LIMIT))
      .filter(Boolean)
      .slice(0, STACK_MAX_LINES),
    runtimeContext: sanitizeClientErrorRuntimeContext(body.runtimeContext),
  };
};

export const createClientErrorRoutes = ({ clientErrorController } = {}) =>
  clientErrorController
    ? [
        {
          method: "POST",
          pathname: "/api/client-errors",
          handler: clientErrorController.reportClientError,
        },
      ]
    : [];

export const createClientErrorController = ({
  bodyLimitBytes = CLIENT_ERROR_BODY_LIMIT_BYTES,
  logger = console,
  sentryRuntime = null,
} = {}) => ({
  reportClientError: async ({ request, response }) => {
    const body = await readJsonBody(
      request,
      Math.min(Number(bodyLimitBytes) || CLIENT_ERROR_BODY_LIMIT_BYTES, CLIENT_ERROR_BODY_LIMIT_BYTES)
    );
    const report = sanitizeClientErrorReport(body);

    logger.warn?.("[client-error] ui crash reported", report);

    sentryRuntime?.captureException?.(
      new Error(`[client-error] ${report.errorName}: ${report.message}`),
      {
        diagnosticId: report.id,
        route: report.route,
        source: report.source,
        staleBuildLikely: report.staleBuildLikely,
        componentStackLines: report.componentStackLines,
        runtimeContext: report.runtimeContext,
      }
    );

    sendJson(response, 202, { ok: true, id: report.id });
  },
});
