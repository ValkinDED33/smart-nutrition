import * as Sentry from "@sentry/node";

const toTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

export const createSentryRuntime = ({ config, logger = console } = {}) => {
  const dsn = toTrimmedString(config?.sentryDsn);
  const enabled = Boolean(dsn);

  if (enabled) {
    Sentry.init({
      dsn,
      environment: config?.nodeEnv ?? "development",
      tracesSampleRate: Number(config?.sentryTracesSampleRate ?? 0),
    });
  }

  return {
    enabled,
    captureException(error, context = {}) {
      if (!enabled) {
        return;
      }

      try {
        Sentry.captureException(error, {
          extra: context,
        });
      } catch (captureError) {
        logger.warn?.("[sentry] failed to capture exception", {
          message:
            captureError instanceof Error
              ? captureError.message
              : String(captureError),
        });
      }
    },
    flush: async (timeoutMs = 2_000) => {
      if (!enabled) {
        return true;
      }

      return Sentry.flush(timeoutMs);
    },
    getStatus: () => ({
      configured: enabled,
      provider: "sentry",
    }),
  };
};
