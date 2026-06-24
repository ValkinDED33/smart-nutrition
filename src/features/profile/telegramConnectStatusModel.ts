export const TELEGRAM_CONNECT_STATUS_POLL_INTERVAL_MS = 3_000;
export const TELEGRAM_CONNECT_STATUS_POLL_TIMEOUT_MS = 120_000;

export const shouldPollTelegramConnectStatus = ({
  connected,
  hasConnectLink,
  nowMs,
  startedAtMs,
}: {
  connected: boolean;
  hasConnectLink: boolean;
  nowMs: number;
  startedAtMs: number | null;
}) =>
  !connected &&
  hasConnectLink &&
  typeof startedAtMs === "number" &&
  nowMs - startedAtMs <= TELEGRAM_CONNECT_STATUS_POLL_TIMEOUT_MS;
