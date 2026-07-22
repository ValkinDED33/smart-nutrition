const CLOUD_SYNC_INACTIVE_MESSAGE = "Cloud sync is not active for this account.";

const isStateConflictMessage = (message: string) =>
  /another device|state[_ -]?conflict|latest cloud version|cloud data changed/i.test(
    message
  );

const isInactiveSyncMessage = (message: string) =>
  /not enabled|not active|sync disabled|cloud sync is not active/i.test(message);

export const resolveCloudSyncFailureMessage = ({
  code,
  message,
  fallbackMessage,
  conflictMessage,
}: {
  code?: string;
  message?: string;
  fallbackMessage: string;
  conflictMessage: string;
}) => {
  if (code === "STATE_CONFLICT") {
    return conflictMessage;
  }

  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedMessage) {
    return fallbackMessage;
  }

  if (isStateConflictMessage(normalizedMessage)) {
    return conflictMessage;
  }

  if (isInactiveSyncMessage(normalizedMessage)) {
    return CLOUD_SYNC_INACTIVE_MESSAGE;
  }

  return fallbackMessage;
};
