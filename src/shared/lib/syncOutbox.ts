import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "./clientPersistence";

export interface SyncOutboxMeta {
  pendingChanges: number;
  firstQueuedAt: string | null;
  lastQueuedAt: string | null;
  lastError: string | null;
}

const STORAGE_KEY = "smart-nutrition.sync-outbox";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const createEmptySyncOutboxMeta = (): SyncOutboxMeta => ({
  pendingChanges: 0,
  firstQueuedAt: null,
  lastQueuedAt: null,
  lastError: null,
});

const writeSyncOutboxMeta = (meta: SyncOutboxMeta) => {
  if (meta.pendingChanges <= 0) {
    removeClientStorageItem(STORAGE_KEY);
    return;
  }

  setClientStorageItem(STORAGE_KEY, JSON.stringify(meta));
};

export const getSyncOutboxMeta = (): SyncOutboxMeta => {
  const raw = getClientStorageItem(STORAGE_KEY);

  if (!raw) {
    return createEmptySyncOutboxMeta();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed)) {
      return createEmptySyncOutboxMeta();
    }

    const pendingChanges = Number(parsed.pendingChanges ?? 0);

    if (!Number.isFinite(pendingChanges) || pendingChanges <= 0) {
      return createEmptySyncOutboxMeta();
    }

    return {
      pendingChanges,
      firstQueuedAt:
        typeof parsed.firstQueuedAt === "string" ? parsed.firstQueuedAt : null,
      lastQueuedAt: typeof parsed.lastQueuedAt === "string" ? parsed.lastQueuedAt : null,
      lastError: typeof parsed.lastError === "string" ? parsed.lastError : null,
    };
  } catch {
    return createEmptySyncOutboxMeta();
  }
};

export const enqueueSyncOutbox = (errorMessage?: string): SyncOutboxMeta => {
  const current = getSyncOutboxMeta();
  const now = new Date().toISOString();
  const next: SyncOutboxMeta = {
    pendingChanges: current.pendingChanges + 1,
    firstQueuedAt: current.firstQueuedAt ?? now,
    lastQueuedAt: now,
    lastError: errorMessage ?? current.lastError ?? null,
  };

  writeSyncOutboxMeta(next);
  return next;
};

export const clearSyncOutbox = (): SyncOutboxMeta => {
  const empty = createEmptySyncOutboxMeta();
  writeSyncOutboxMeta(empty);
  return empty;
};
