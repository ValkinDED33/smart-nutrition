const DEFAULT_KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_KEEPALIVE_TIMEOUT_MS = 8_000;
const STARTUP_PING_DELAY_MS = 30_000;

const toSafeError = (error) => ({
  code: error?.name === "AbortError" ? "KEEPALIVE_TIMEOUT" : "KEEPALIVE_FAILED",
  message: error?.message ? String(error.message).slice(0, 180) : "Keepalive ping failed.",
});

export const createKeepAliveRuntime = ({
  enabled = false,
  url = null,
  intervalMs = DEFAULT_KEEPALIVE_INTERVAL_MS,
  timeoutMs = DEFAULT_KEEPALIVE_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  logger = console,
} = {}) => {
  let timerId = null;
  let inFlight = false;
  let running = false;
  let lastPingAt = null;
  let lastSuccessAt = null;
  let lastStatusCode = null;
  let lastDurationMs = null;
  let lastError = null;
  let totalPings = 0;
  let failedPings = 0;

  const configured = Boolean(enabled && url);

  const getStatus = () => ({
    enabled: Boolean(enabled),
    configured,
    running,
    urlConfigured: Boolean(url),
    intervalMs,
    timeoutMs,
    lastPingAt,
    lastSuccessAt,
    lastStatusCode,
    lastDurationMs,
    totalPings,
    failedPings,
    lastError,
  });

  const clearTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNextPing = (delayMs = intervalMs) => {
    clearTimer();

    if (!running) {
      return;
    }

    timerId = setTimeout(() => {
      void ping().finally(() => {
        scheduleNextPing(intervalMs);
      });
    }, delayMs);
    timerId.unref?.();
  };

  const ping = async () => {
    if (!configured || inFlight || typeof fetchImpl !== "function") {
      return getStatus();
    }

    inFlight = true;
    totalPings += 1;
    lastPingAt = new Date().toISOString();
    const startedAt = Date.now();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
    timeoutId.unref?.();

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          "User-Agent": "SmartNutritionKeepAlive/1.0",
        },
        signal: abortController.signal,
      });

      lastStatusCode = response.status;
      lastDurationMs = Date.now() - startedAt;

      if (!response.ok) {
        throw new Error(`Keepalive endpoint returned ${response.status}.`);
      }

      lastSuccessAt = new Date().toISOString();
      lastError = null;
    } catch (error) {
      failedPings += 1;
      lastDurationMs = Date.now() - startedAt;
      lastError = toSafeError(error);
      logger.warn?.("[keepalive] ping failed", lastError);
    } finally {
      clearTimeout(timeoutId);
      inFlight = false;
    }

    return getStatus();
  };

  const start = () => {
    if (!configured || running) {
      return getStatus();
    }

    running = true;
    scheduleNextPing(Math.min(STARTUP_PING_DELAY_MS, intervalMs));
    logger.info?.("[keepalive] runtime started", {
      intervalMs,
      timeoutMs,
    });

    return getStatus();
  };

  const stop = () => {
    clearTimer();
    running = false;
    return getStatus();
  };

  return {
    getStatus,
    ping,
    start,
    stop,
  };
};
